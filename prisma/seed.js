/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Coloca as 8 categorias de denuncia dentro do banco de dados na primeira
 * vez que o sistema e instalado. Sem isso, o formulario publico apareceria
 * vazio, sem nenhuma opcao para a pessoa escolher.
 *
 * Ele usa uma operacao chamada "upsert": se a categoria ja existe, atualiza;
 * se nao existe, cria. Por isso pode ser rodado varias vezes sem duplicar nada.
 *
 * Para a apresentacao: e a "carga inicial" do sistema.
 */

const { PrismaClient, Prioridade } = require("@prisma/client");

const prisma = new PrismaClient();

// BLOCO 1 - As 8 categorias, escritas de forma compacta.
// Cada linha segue a mesma ordem: apelido tecnico, nome, descricao, icone,
// prioridade inicial e posicao no formulario.
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

// BLOCO 2 - Grava as categorias no banco, uma por uma.
async function main() {
  for (const categoria of categorias) {
    // O "upsert" e a juncao de update com insert: existindo a categoria com
    // aquele apelido, ela e atualizada; nao existindo, e criada.
    // Por isso este script pode ser rodado quantas vezes for preciso sem
    // duplicar nada, o que e util a cada nova instalacao do sistema.
    await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: categoria,
      create: categoria
    });
  }
}

// BLOCO 3 - Executa e fecha a conexao com o banco no fim.
// Dando erro, mostra a mensagem e encerra com codigo 1, que avisa ao sistema
// operacional que algo falhou. Isso importa em instalacao automatizada: um
// erro silencioso deixaria o sistema no ar sem nenhuma categoria cadastrada.
main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
