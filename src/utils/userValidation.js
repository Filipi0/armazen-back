const { z } = require("zod");

//validação para registro de administrador
const registerAdminSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

//validação para registro de usuário comum
const registerUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

//validação para login
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
});

//validação para ID (usado em deleção e atualização de senha)
const idSchema = z.object({
  id: z.string().regex(/^\d+$/, "O ID deve ser um número válido"),
});

//validação para atualização de senha
const updatePasswordSchema = z.object({
  newPassword: z.string().min(4, "A nova senha deve ter pelo menos 4 caracteres"),
});

module.exports = {
  registerAdminSchema,
  registerUserSchema,
  loginSchema,
  idSchema,
  updatePasswordSchema,
};
