const { PrismaClient, Prioridade } = require("@prisma/client");

const prisma = new PrismaClient();

const categorias = [
  ["bullying", "Bullying", "Ameaças, humilhações, intimidação ou exclusão repetida.", "B", Prioridade.MEDIA, 1],
  ["cyberbullying", "Cyberbullying", "Agressões, exposição ou intimidação em ambientes digitais.", "C", Prioridade.MEDIA, 2],
  ["assedio", "Assédio", "Conduta invasiva, constrangedora ou insistente.", "A", Prioridade.ALTA, 3],
  ["abuso", "Abuso", "Situação de abuso ou violação grave de segurança.", "S", Prioridade.ALTA, 4],
  ["discriminacao", "Discriminação", "Tratamento ofensivo ou injusto por identidade, origem, crença ou condição.", "D", Prioridade.MEDIA, 5],
  ["violencia_fisica", "Violência física", "Agressão, ameaça corporal ou briga com risco físico.", "V", Prioridade.ALTA, 6],
  ["ameaca", "Ameaça", "Mensagem, gesto ou atitude que indique risco ou intimidação.", "M", Prioridade.MEDIA, 7],
  ["outros", "Outros", "Outra situação que precisa ser acolhida pela escola.", "O", Prioridade.MEDIA, 8]
].map(([slug, nome, descricao, icone, prioridadePadrao, ordem]) => ({
  slug, nome, descricao, icone, prioridadePadrao, ordem
}));

async function main() {
  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: categoria,
      create: categoria
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
