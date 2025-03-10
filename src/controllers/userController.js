const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); 
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
const APP_URL = process.env.APP_URL;

//Registrar um novo administrador
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

//Registrar um novo usuário (Somente Admin)
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

//Login para Administrador e Usuário Comum
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

//Listar usuários vinculados ao Admin autenticado
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

//Deletar usuário (Somente Admin e apenas usuários criados por ele)
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

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Verifica se o email pertence a um administrador ou um usuário normal
    let user = await prisma.userAdmin.findUnique({ where: { email } });
    let userType = "admin";

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      userType = "user";
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Gerar um token de recuperação válido por 1 hora
    const resetToken = jwt.sign({ email, userType }, JWT_SECRET, { expiresIn: "1h" });

    // Atualiza o token no banco
    if (userType === "admin") {
      await prisma.userAdmin.update({
        where: { email },
        data: { resetToken },
      });
    } else {
      await prisma.user.update({
        where: { email },
        data: { resetToken },
      });
    }

    const resetLink = `${process.env.FRONTEND_URL}/recupera-senha?token=${resetToken}`;

    // Configuração do email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Recuperação de Senha",
      html: `<p>Olá ${user.name},</p>
             <p>Você solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Se você não solicitou essa mudança, ignore este email.</p>`,
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    return res.json({ message: "Email de recuperação enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    res.status(500).json({ error: "Erro ao processar recuperação de senha" });
  }
}





async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    // Verifica se o token é válido
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.email || !decoded.userType) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    // Busca o usuário correspondente
    let user = null;
    if (decoded.userType === "admin") {
      user = await prisma.userAdmin.findUnique({ where: { email: decoded.email } });
    } else {
      user = await prisma.user.findUnique({ where: { email: decoded.email } });
    }

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: "Token inválido ou já utilizado" });
    }

    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha no banco e remove o token de recuperação
    if (decoded.userType === "admin") {
      await prisma.userAdmin.update({
        where: { email: decoded.email },
        data: { password: hashedPassword, resetToken: null },
      });
    } else {
      await prisma.user.update({
        where: { email: decoded.email },
        data: { password: hashedPassword, resetToken: null },
      });
    }

    return res.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Erro ao redefinir senha" });
  }
}





module.exports = {
  registerAdmin,
  registerUser,
  loginUser,
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
};
