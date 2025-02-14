const express = require("express");
const { getStockSummary, getStockDetails } = require("../controllers/stockController");
const { authenticateToken } = require("../middlewares/authMiddleware"); // 🔹 Importando o middleware correto

const router = express.Router();

router.get("/stock-summary", authenticateToken, getStockSummary); // 🔹 Agora exige autenticação
router.get("/stock-details/:filterType", authenticateToken, getStockDetails);

module.exports = router;
