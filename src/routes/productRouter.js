const express = require("express");
const { createProduct, getProducts, deleteProduct } = require("../controllers/productController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/products", authenticateToken, createProduct); // Criar Produto
router.get("/products", authenticateToken, getProducts); // Listar Produtos
router.delete("/products/:id", authenticateToken, deleteProduct); // Deletar Produto

module.exports = router;
