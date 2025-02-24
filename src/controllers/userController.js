const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { 
  registerAdminSchema, 
  registerUserSchema, 
  loginSchema, 
  idSchema, 
  updatePasswordSchema 
} = require("../utils/userValidation");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// 🔹 Registrar um novo administrador
async function registerAdmin(req, res) {
  try {
    const result = registerAdminSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.format() });

    const { email, password, name } = result.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.userAdmin.create({
      data: { email, password: hashedPassword, name },
    });

    res.status(201).json({ message: "Administrador criado!", admin });
  } catch (error) {
    console.error("Erro ao registrar administrador:", error);
    res.status(500).json({ error: "Erro ao registrar administrador" });
  }
}

// 🔹 Registrar um novo usuário (Somente Admin)
async function registerUser(req, res) {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Acesso negado" });

    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.format() });

    const { email, password, name } = result.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) return res.status(409).json({ error: "E-mail já cadastrado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, idAdmin: req.user.id },
    });

    res.status(201).json({ message: "Usuário criado com sucesso!", user });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
}

// 🔹 Login para Administrador e Usuário Comum
async function loginUser(req, res) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.format() });

    const { email, password } = result.data;
    let user = await prisma.userAdmin.findUnique({ where: { email } });
    let isAdmin = true;

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      isAdmin = false;
    }

    if (!user) return res.status(401).json({ error: "E-mail ou senha inválidos" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "E-mail ou senha inválidos" });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin }, JWT_SECRET, { expiresIn: "2h" });

    res.json({ message: "Login realizado com sucesso", token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
}

// 🔹 Listar usuários vinculados ao Admin autenticado
async function getUsers(req, res) {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Acesso negado" });

    const users = await prisma.user.findMany({ where: { idAdmin: req.user.id } });
    res.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

// 🔹 Deletar usuário (Somente Admin e apenas usuários criados por ele)
async function deleteUser(req, res) {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Acesso negado" });

    const result = idSchema.safeParse(req.params);
    if (!result.success) return res.status(400).json({ error: result.error.format() });

    const { id } = result.data;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user || user.idAdmin !== req.user.id) return res.status(403).json({ error: "Você não tem permissão para excluir este usuário" });

    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.json({ message: `Usuário ${user.name} deletado com sucesso!` });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
}

// 🔹 Atualizar senha (Usuário pode atualizar sua própria senha ou um Admin pode atualizar)
async function updatePassword(req, res) {
  try {
    if (!req.user.isAdmin && req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: "Acesso negado" });

    const result = updatePasswordSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.format() });

    const { newPassword } = result.data;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { password: hashedPassword } });

    res.json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro ao atualizar senha" });
  }
}

module.exports = {
  registerAdmin,
  registerUser,
  loginUser,
  getUsers,
  deleteUser,
  updatePassword,
};
