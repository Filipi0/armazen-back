const express = require("express");
const {
  registerAdmin,
  registerUser,
  loginUser,
  getUsers,
  deleteUser,
  updatePassword,
} = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register/admin", registerAdmin);
router.post("/register", authenticateToken, registerUser);
router.post("/login", loginUser);
router.get("/users", authenticateToken, getUsers);
router.delete("/users/:id", authenticateToken, deleteUser);
router.put("/users/:id/password", authenticateToken, updatePassword);


module.exports = router;
