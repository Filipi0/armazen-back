const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

async function registerUser(req, res) {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({ data: { email, password: hashedPassword } });
    res.status(201).json({ message: "Usuário criado!", user: { email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login bem-sucedido", token });
}

async function getUsers(req, res) {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  res.json(users);
}

async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Usuário deletado com sucesso!" });
  } catch {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
}

module.exports = { registerUser, loginUser, getUsers, deleteUser };
