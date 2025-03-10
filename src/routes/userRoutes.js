const express = require("express");
const {
  registerAdmin,
  registerUser,
  loginUser,
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register/admin", registerAdmin);
router.post("/register", authenticateToken, registerUser);
router.post("/login", loginUser);
router.get("/users", authenticateToken, getUsers);
router.delete("/users/:id", authenticateToken, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);



module.exports = router;
