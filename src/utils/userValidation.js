const { z } = require("zod");

// 🔹 Esquema de validação para registro de administrador
const registerAdminSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

// 🔹 Esquema de validação para registro de usuário comum
const registerUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

// 🔹 Esquema de validação para login
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// 🔹 Esquema de validação para ID (usado em deleção e atualização de senha)
const idSchema = z.object({
  id: z.string().regex(/^\d+$/, "O ID deve ser um número válido"),
});

// 🔹 Esquema de validação para atualização de senha
const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
});

module.exports = {
  registerAdminSchema,
  registerUserSchema,
  loginSchema,
  idSchema,
  updatePasswordSchema,
};
