const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 🔹 Criar um novo produto (Apenas Admins)
async function createProduct(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { itemType, supplier, name, quantity, unit, expirationDate } =
      req.body;

    const product = await prisma.product.create({
      data: {
        itemType,
        supplier,
        name,
        quantity,
        unit,
        expirationDate: expirationDate ? new Date(expirationDate) : null, // 🔹 Armazena null no banco
        idAdmin: req.user.id,
      },
    });

    res
      .status(201)
      .json({ message: "Produto cadastrado com sucesso!", product });
  } catch (error) {
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
}

// 🔹 Listar produtos (Somente Admins e Usuários vinculados ao Admin)
async function getProducts(req, res) {
  try {
    let products;

    if (req.user.role === "admin") {
      // Admins podem ver apenas os produtos que eles cadastraram
      products = await prisma.product.findMany({
        where: { idAdmin: req.user.id },
      });
    } else {
      // Usuários normais podem ver apenas os produtos do Admin que os cadastrou
      const adminId = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { idAdmin: true },
      });

      if (!adminId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      products = await prisma.product.findMany({
        where: { idAdmin: adminId.idAdmin },
      });
    }
    const formattedProducts = products.map((product) => ({
      ...product,
      expirationDate: product.expirationDate
        ? product.expirationDate
        : "Sem data de validade",
    }));

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
}

// 🔹 Deletar produto (Apenas o Admin que cadastrou)
async function deleteProduct(req, res) {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { id } = req.params;

        // Verifica se o produto pertence ao Admin autenticado
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!product || product.idAdmin !== req.user.id) {
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
