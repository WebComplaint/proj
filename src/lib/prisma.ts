/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Abre a conexao com o banco de dados e reaproveita sempre a mesma.
 *
 * E como manter uma unica linha de telefone aberta com o banco em vez de
 * ligar de novo a cada pergunta. Durante o desenvolvimento o codigo e
 * recarregado a todo momento, e sem esse cuidado o sistema abriria dezenas
 * de conexoes ate o banco recusar novas.
 *
 * Para a apresentacao: e a linha direta com o banco de dados.
 */

import { PrismaClient } from "@prisma/client";

// BLOCO 1 - Cria um "espaco de memoria global" onde a conexao fica guardada.
// E como um gancho na parede onde penduramos a chave do banco de dados.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// BLOCO 2 - Se ja existe uma conexao pendurada no gancho, usa ela.
// Se nao existe, cria uma nova. O simbolo ?? significa "ou entao".
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// BLOCO 3 - Fora do ar de producao (ou seja, na maquina do desenvolvedor),
// pendura a conexao no gancho para a proxima vez.
// Em desenvolvimento o codigo recarrega a cada arquivo salvo. Sem isso, cada
// recarga abriria uma conexao nova ate o banco recusar por excesso.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
