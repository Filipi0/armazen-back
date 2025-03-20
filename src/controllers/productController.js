const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Criar um novo produto (Agora qualquer usuário pode criar)
async function createProduct(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { itemType, supplier, name, quantity, unit, expirationDate } =
      req.body;
    let idAdmin;
    let idUser = null;

    if (req.user.isAdmin) {
      idAdmin = req.user.id;
    } else {
      // Se for um usuário comum, busca o idAdmin e define idUser corretamente
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { idAdmin: true },
      });

      idAdmin = user?.idAdmin;
      idUser = req.user.id;
    }

    if (!idAdmin) {
      return res
        .status(400)
        .json({ error: "Usuário sem administrador associado" });
    }

    const product = await prisma.product.create({
      data: {
        itemType,
        supplier,
        name,
        quantity,
        unit,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        idAdmin,
        idUser,
      },
    });

    res
      .status(201)
      .json({ message: "Produto cadastrado com sucesso!", product });
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
}

// Listar produtos (Usuários normais veem apenas seus produtos, admins veem os deles e dos usuários vinculados)
async function getProducts(req, res) {
  try {
    console.log("🔹 Usuário autenticado:", req.user);

    const { name, supplier, itemType, id } = req.query;
    let filters = {};

    if (id) filters.id = parseInt(id);
    if (name) filters.name = { contains: name, mode: "insensitive" };
    if (supplier)
      filters.supplier = { contains: supplier, mode: "insensitive" };
    if (itemType)
      filters.itemType = { contains: itemType, mode: "insensitive" };

    console.log("🔹 Filtros aplicados:", filters);

    let products;

    if (req.user.isAdmin) {
      products = await prisma.product.findMany({
        where: {
          AND: [
            { OR: [{ idAdmin: req.user.id }, { idUser: req.user.id }] },
            filters,
          ],
        },
      });
    } else {
      const usersWithSameAdmin = await prisma.user.findMany({
        where: { idAdmin: req.user.idAdmin },
        select: { id: true },
      });

      const userIds = usersWithSameAdmin.map((user) => user.id);
      console.log("🔹 Usuários vinculados ao admin:", userIds);

      products = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { idUser: req.user.id },
                { idAdmin: req.user.idAdmin },
                { idUser: { in: userIds } },
              ],
            },
            filters,
          ],
        },
      });
    }

    console.log("🔹 Produtos retornados:", products);
    res.json(products);
  } catch (error) {
    console.error("🚨 Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
}

// Deletar produto (Usuários só podem deletar seus próprios produtos, admins podem deletar os deles e de seus usuários)
async function deleteProduct(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { id } = req.params;
    console.log(
      `Usuário tentando deletar o produto: ${req.user.id}, Admin: ${req.user.isAdmin}`
    );

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    console.log(
      `Dono do produto -> idAdmin: ${product.idAdmin}, idUser: ${product.idUser}`
    );

    // 🔹 Se for admin, pode deletar qualquer produto que pertença a ele
    if (req.user.isAdmin && product.idAdmin === req.user.id) {
      await prisma.product.delete({ where: { id: parseInt(id) } });
      return res.json({
        message: `Produto '${product.name}' deletado com sucesso!`,
      });
    }

    // 🔹 Se for um usuário normal, só pode deletar seus próprios produtos
    if (!req.user.isAdmin && product.idUser === req.user.id) {
      await prisma.product.delete({ where: { id: parseInt(id) } });
      return res.json({
        message: `Produto '${product.name}' deletado com sucesso!`,
      });
    }

    console.log("Permissão negada para deletar o produto.");
    return res
      .status(403)
      .json({ error: "Você não tem permissão para excluir este produto" });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
}

async function updateProductQuantity(req, res) {
  try {
    const { id } = req.params; // ID do produto
    const { action, amount } = req.body; // Ação ("increment" ou "decrement") e quantidade customizada

    if (!["increment", "decrement"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Ação inválida. Use 'increment' ou 'decrement'." });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({
          error: "Quantidade inválida. Deve ser um número maior que 0.",
        });
    }

    // Busca o produto no banco
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Define a nova quantidade com base na ação e quantidade enviada
    let newQuantity =
      action === "increment"
        ? product.quantity + amount
        : product.quantity - amount;

    // Evita que a quantidade fique negativa
    if (newQuantity < 0) {
      newQuantity = 0;
    }

    // Atualiza o produto no banco
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { quantity: newQuantity },
    });

    res.json({ message: "Quantidade do produto atualizada!", updatedProduct });
  } catch (error) {
    console.error("Erro ao atualizar quantidade:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar a quantidade do produto." });
  }
}

async function moveStock(req, res) {
  try {
    const { productId, quantity, movementType } = req.body;

    if (!["entrada", "saida"].includes(movementType)) {
      return res
        .status(400)
        .json({
          error: "Tipo de movimentação inválido. Use 'entrada' ou 'saida'.",
        });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res
        .status(400)
        .json({
          error: "Quantidade inválida. Deve ser um número maior que 0.",
        });
    }

    // Busca o produto no banco
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    let newQuantity = product.quantity;

    if (movementType === "saida") {
      if (product.quantity < quantity) {
        return res
          .status(400)
          .json({ error: "Estoque insuficiente para a saída." });
      }
      newQuantity -= quantity;
    } else if (movementType === "entrada") {
      newQuantity += quantity;
    }

    // Atualiza o estoque do produto
    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { quantity: newQuantity },
    });

    // Definir idAdmin e idUser baseado se o usuário é admin ou não
    let idAdmin;
    let idUser = null;

    if (req.user.isAdmin) {
      idAdmin = req.user.id;
    } else {
      // Se for um usuário comum, buscamos o idAdmin e definimos idUser corretamente
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { idAdmin: true },
      });

      idAdmin = user?.idAdmin;
      idUser = req.user.id;
    }

    // Registra a movimentação com idAdmin e idUser corretamente preenchidos
    const stockMovement = await prisma.stockMovement.create({
      data: {
        productId: parseInt(productId),
        quantity: movementType === "saida" ? -quantity : quantity, // Negativo para saída
        movementType,
        userId: req.user.id, // O usuário que fez a movimentação
        adminId: idAdmin, // Agora preenchemos o adminId corretamente
      },
    });

    res.json({
      message: "Movimentação registrada com sucesso!",
      stockMovement,
    });
  } catch (error) {
    console.error("Erro ao movimentar estoque:", error);
    res.status(500).json({ error: "Erro ao movimentar estoque." });
  }
}

async function getStockMovements(req, res) {
  try {
    let whereClause = {};

    if (req.user.isAdmin) {
      // Se for admin, pode ver suas movimentações e as dos usuários que ele gerencia
      const usersWithSameAdmin = await prisma.user.findMany({
        where: { idAdmin: req.user.id },
        select: { id: true },
      });

      const userIds = usersWithSameAdmin.map((user) => user.id);

      whereClause = {
        OR: [
          { userId: req.user.id }, // Movimentações do próprio admin
          { adminId: req.user.id }, // Movimentações dos usuários sob sua gestão
          { userId: { in: userIds } }, // Movimentações feitas pelos usuários que ele gerencia
        ],
      };
    } else {
      // Se for um usuário normal, vê apenas suas próprias movimentações
      whereClause = {
        userId: req.user.id,
      };
    }

    // Busca as movimentações aplicando os filtros corretos
    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            itemType: true,

            quantity: true,
            unit: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,

            idAdmin: true,
          },
        },
        userAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(movements);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    res.status(500).json({ error: "Erro ao buscar movimentações." });
  }
}

module.exports = {
  createProduct,
  getProducts,
  deleteProduct,
  updateProductQuantity,
  moveStock,
  getStockMovements,
};
