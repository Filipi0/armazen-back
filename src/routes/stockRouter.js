const express = require("express");
const { getStockSummary, getStockDetails } = require("../controllers/stockController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/stock-summary", authenticateToken, getStockSummary);
router.get("/stock-details/:filterType", authenticateToken, getStockDetails);

module.exports = router;
