const express = require("express");
const {
  createProduct,
  getProducts,
  deleteProduct,
  updateProductQuantity,
  moveStock,
  getStockMovements,
} = require("../controllers/productController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/products", authenticateToken, createProduct);
router.get("/products", authenticateToken, getProducts);
router.delete("/products/:id", authenticateToken, deleteProduct);
router.patch("/products/:id/update-quantity", authenticateToken, updateProductQuantity);
router.post("/stock/move", authenticateToken, moveStock);
router.get("/stock/movements", authenticateToken, getStockMovements);

module.exports = router;
