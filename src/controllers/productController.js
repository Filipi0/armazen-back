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

    if (req.user.role === "admin") {
      idAdmin = req.user.id;
    } else {
      // busca o admin associado ao usuário comum no banco
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { idAdmin: true },
      });

      idAdmin = user?.idAdmin;
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
        idAdmin, // 🔹 Agora sempre haverá um idAdmin válido
        idUser: req.user.role === "user" ? req.user.id : null,
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
    const { name, supplier, itemType, id } = req.query;

    let filters = {};

    // filtros passados na URL
    if (id) filters.id = parseInt(id);
    if (name) filters.name = { contains: name, mode: "insensitive" };
    if (supplier)
      filters.supplier = { contains: supplier, mode: "insensitive" };
    if (itemType)
      filters.itemType = { contains: itemType, mode: "insensitive" };

    let products;

    if (req.user.role === "admin") {
      // 🔹 Admin pode ver todos os produtos dele e de seus usuários vinculados
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

    res.json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
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

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    if (
      (req.user.role !== "admin" && product.idUser !== req.user.id) ||
      (req.user.role === "admin" && product.idAdmin !== req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Você não tem permissão para excluir este produto" });
    }

    await prisma.product.delete({ where: { id: parseInt(id) } });

    res.json({ message: `Produto '${product.name}' deletado com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
}

module.exports = {
  createProduct,
  getProducts,
  deleteProduct,
};
