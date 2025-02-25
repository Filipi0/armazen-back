const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Criar um novo produto (Agora qualquer usuário pode criar)
async function createProduct(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { itemType, supplier, name, quantity, unit, expirationDate } = req.body;
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
      return res.status(400).json({ error: "Usuário sem administrador associado" });
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

    res.status(201).json({ message: "Produto cadastrado com sucesso!", product });
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
    if (supplier) filters.supplier = { contains: supplier, mode: "insensitive" };
    if (itemType) filters.itemType = { contains: itemType, mode: "insensitive" };

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
    console.log(`Usuário tentando deletar o produto: ${req.user.id}, Admin: ${req.user.isAdmin}`);

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    console.log(`Dono do produto -> idAdmin: ${product.idAdmin}, idUser: ${product.idUser}`);

    // 🔹 Se for admin, pode deletar qualquer produto que pertença a ele
    if (req.user.isAdmin && product.idAdmin === req.user.id) {
      await prisma.product.delete({ where: { id: parseInt(id) } });
      return res.json({ message: `Produto '${product.name}' deletado com sucesso!` });
    }

    // 🔹 Se for um usuário normal, só pode deletar seus próprios produtos
    if (!req.user.isAdmin && product.idUser === req.user.id) {
      await prisma.product.delete({ where: { id: parseInt(id) } });
      return res.json({ message: `Produto '${product.name}' deletado com sucesso!` });
    }

    console.log("Permissão negada para deletar o produto.");
    return res.status(403).json({ error: "Você não tem permissão para excluir este produto" });
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
      return res.status(400).json({ error: "Ação inválida. Use 'increment' ou 'decrement'." });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Quantidade inválida. Deve ser um número maior que 0." });
    }

    // Busca o produto no banco
    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Define a nova quantidade com base na ação e quantidade enviada
    let newQuantity = action === "increment" ? product.quantity + amount : product.quantity - amount;

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
    res.status(500).json({ error: "Erro ao atualizar a quantidade do produto." });
  }
}




module.exports = {
  createProduct,
  getProducts,
  deleteProduct,
  updateProductQuantity,
};
