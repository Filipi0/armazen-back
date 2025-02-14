const express = require("express");
const { createProduct, getProducts, deleteProduct } = require("../controllers/productController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/products", authenticateToken, createProduct); 
router.get("/products", authenticateToken, getProducts);
router.delete("/products/:id", authenticateToken, deleteProduct); 

module.exports = router;
