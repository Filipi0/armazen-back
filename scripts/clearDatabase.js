const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Apaga todos os usuários normais e admins
    await prisma.user.deleteMany({});
    await prisma.userAdmin.deleteMany({});

    console.log("Banco de dados limpo com sucesso!");
  } catch (error) {
    console.error("Erro ao limpar o banco de dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
