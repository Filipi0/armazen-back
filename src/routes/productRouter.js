const express = require("express");
const {
  createProduct,
  getProducts,
  deleteProduct,
  updateProductQuantity,
} = require("../controllers/productController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// CRUD de produtos
router.post("/products", authenticateToken, createProduct);
router.get("/products", authenticateToken, getProducts);
router.delete("/products/:id", authenticateToken, deleteProduct);
router.patch("/products/:id/update-quantity", authenticateToken, updateProductQuantity);

module.exports = router;
