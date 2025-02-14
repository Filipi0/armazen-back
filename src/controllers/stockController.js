const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Resumo do estoque (por exemplo, produtos perto do vencimento, produtos com estoque baixo, etc)
async function getStockSummary(req, res) {
    try {
      if (!req.user) {
        return res.status(403).json({ error: "Usuário não autenticado." });
      }
  
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      let whereClause = req.user.role === "admin" ? 
        { idAdmin: req.user.id } : 
        { OR: [{ idUser: req.user.id }, { idAdmin: req.user.idAdmin }] };
  
      const nearExpiration = await prisma.product.count({
        where: {
          expirationDate: { lte: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000) },
          ...whereClause,
        },
      });
  
      const lowStock = await prisma.product.count({
        where: { quantity: { lte: 15 }, ...whereClause },
      });
  
      const expiredThisMonth = await prisma.product.count({
        where: { expirationDate: { gte: startOfMonth, lte: currentDate }, ...whereClause },
      });
  
      const outOfStockThisMonth = await prisma.product.count({
        where: { quantity: 0, createdAt: { gte: startOfMonth, lte: currentDate }, ...whereClause },
      });
  
      const untouchedThisMonth = await prisma.product.count({
        where: { createdAt: { lt: startOfMonth }, ...whereClause },
      });
  
      const mostMovedItems = await prisma.product.findMany({
        where: { createdAt: { gte: startOfMonth }, ...whereClause },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
  
      res.json({
        nearExpiration,
        lowStock,
        expiredThisMonth,
        outOfStockThisMonth,
        untouchedThisMonth,
        mostMovedItems: mostMovedItems.length,
      });
  
    } catch (error) {
      console.error("Erro ao buscar resumo de estoque:", error);
      res.status(500).json({ error: "Erro ao buscar resumo de estoque" });
    }
  }
  
  // Detalhes dos produtos (por exemplo, produtos perto do vencimento, produtos com estoque baixo, etc)
  async function getStockDetails(req, res) {
    try {
      const { filterType } = req.params; 
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      let whereClause = req.user.role === "admin" ? 
        { idAdmin: req.user.id } : 
        { OR: [{ idUser: req.user.id }, { idAdmin: req.user.idAdmin }] };
  
      let products = [];
  
      switch (filterType) {
        case "near-expiration":
          products = await prisma.product.findMany({
            where: { expirationDate: { lte: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000) }, ...whereClause },
          });
          break;
        case "low-stock":
          products = await prisma.product.findMany({
            where: { quantity: { lte: 15 }, ...whereClause },
          });
          break;
        case "expired-this-month":
          products = await prisma.product.findMany({
            where: { expirationDate: { gte: startOfMonth, lte: currentDate }, ...whereClause },
          });
          break;
        case "out-of-stock-this-month":
          products = await prisma.product.findMany({
            where: { quantity: 0, createdAt: { gte: startOfMonth, lte: currentDate }, ...whereClause },
          });
          break;
        case "untouched-this-month":
          products = await prisma.product.findMany({
            where: { createdAt: { lt: startOfMonth }, ...whereClause },
          });
          break;
        case "most-moved-items":
          products = await prisma.product.findMany({
            where: { createdAt: { gte: startOfMonth }, ...whereClause },
            orderBy: { createdAt: "desc" },
            take: 5,
          });
          break;
        default:
          return res.status(400).json({ error: "Filtro inválido" });
      }
  
      if (products.length === 0) {
        return res.json({ message: "Nenhum produto encontrado para este filtro." });
      }
  
      res.json(products);
    } catch (error) {
      console.error("Erro ao buscar detalhes dos produtos:", error);
      res.status(500).json({ error: "Erro ao buscar detalhes dos produtos" });
    }
  }
  
module.exports = { getStockSummary, getStockDetails };
