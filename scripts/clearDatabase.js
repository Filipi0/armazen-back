const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
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


// para executar o script, basta rodar o comando node scripts/clearDatabase.js no terminal