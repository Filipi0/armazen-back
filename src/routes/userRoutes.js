const express = require("express");
const { registerUser, loginUser, getUsers, deleteUser } = require("../controllers/userController");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", authenticateToken, getUsers);
router.delete("/users/:id", authenticateToken, deleteUser);

module.exports = router;
