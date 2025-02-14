const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Registrar um novo administrador
async function registerAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.userAdmin.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ message: "Administrador criado!", admin });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar administrador" });
  }
}

// Registrar um novo usuário (Somente Admin)
async function registerUser(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        idAdmin: req.user.id, 
      },
    });

    res.status(201).json({ 
      message: "Usuário criado com sucesso!", 
      user: { id: user.id, email: user.email, idAdmin: user.idAdmin } 
    });

  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ error: "Erro interno ao registrar usuário" });
  }
}



// Login de usuário (Admin ou Normal)
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    let user = await prisma.userAdmin.findUnique({ where: { email } });
    let userType = "admin";

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      userType = "user";
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: userType }, JWT_SECRET, { expiresIn: "2h" });

    res.json({ message: "Login realizado com sucesso", token });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login" });
  }
}

// Listar usuários vinculados ao Admin autenticado
async function getUsers(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const users = await prisma.user.findMany({
      where: { idAdmin: req.user.id },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

// Deletar usuário (Somente Admin e apenas usuários criados por ele)
async function deleteUser(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user || user.idAdmin !== req.user.id) {
      return res.status(403).json({ error: "Você não tem permissão para excluir este usuário" });
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
}

async function updatePassword(req, res) {
  try {
    const { id } = req.params; // ID do usuário a ser atualizado
    const { newPassword } = req.body; // Nova senha

    // Apenas o próprio usuário ou um administrador pode alterar a senha
    if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Criptografar a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha no banco
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
    });

    res.json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar a senha" });
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
