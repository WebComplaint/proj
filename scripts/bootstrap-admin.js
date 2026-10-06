/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cria o PRIMEIRO administrador do sistema. E um problema classico: para
 * cadastrar um usuario no painel voce precisa estar logado, mas no comeco
 * nao existe ninguem logado. Este script quebra esse ciclo.
 *
 * Ele faz duas coisas em sequencia:
 *   1. Cria a conta de login no Supabase (o servico que guarda as senhas).
 *   2. Cria a ficha desse usuario no nosso banco, com o perfil ADMIN.
 *
 * Para a apresentacao: e a chave-mestra usada uma unica vez na instalacao.
 */

const { createClient } = require("@supabase/supabase-js");
const { PrismaClient, Perfil } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // BLOCO 1 - Le os dados das configuracoes do servidor.
  // Nada disso fica escrito no codigo: a senha do administrador e informada na
  // hora de rodar o script e nunca e guardada em nenhum arquivo do projeto.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const nome = process.env.ADMIN_NOME || "Administrador";
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_SENHA;

  // Faltando qualquer configuracao, para logo e diz exatamente o que falta.
  if (!url || !secretKey || !email || !password) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL e ADMIN_SENHA.");
  }

  // BLOCO 2 - Conecta ao Supabase com a CHAVE SECRETA, e nao com a publica.
  // E essa chave que permite criar contas de outras pessoas. Ela so pode ser
  // usada em um script rodado no computador de quem instala o sistema, jamais
  // em codigo que chega ao navegador de um visitante.
  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // BLOCO 3 - Tenta criar a conta de login.
  // O email_confirm: true ja marca o e-mail como confirmado, dispensando o
  // passo de clicar em um link de confirmacao na instalacao.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let authUser = created?.user;

  // BLOCO 4 - A conta ja existia (o script foi rodado antes).
  // Em vez de falhar, ele localiza a conta e apenas redefine a senha.
  // Isso torna o script util tambem para recuperar o acesso quando a escola
  // perde a senha do administrador.
  if (createError?.message.toLowerCase().includes("already")) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    authUser = users.users.find((user) => user.email?.toLowerCase() === email);
    if (authUser) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, { password });
      if (updateError) throw updateError;
    }
  } else if (createError) {
    throw createError;
  }

  if (!authUser) throw new Error("Não foi possível localizar ou criar o usuário no Supabase Auth.");

  // BLOCO 5 - Cria (ou atualiza) a ficha do funcionario no NOSSO banco,
  // ligada a conta de login pelo identificador do Supabase, e ja com o
  // perfil ADMIN.
  // Sao os dois cadastros de que o sistema precisa: sem este segundo passo,
  // a pessoa conseguiria digitar a senha certa e mesmo assim seria barrada,
  // porque o sistema nao saberia qual e o cargo dela na escola.
  // O e-mail ja nasce confirmado: quem roda este script tem acesso ao
  // servidor, e o primeiro administrador nao pode ficar trancado para fora
  // caso o servico de e-mail ainda nao esteja configurado.
  const emailVerificadoEm = new Date();

  await prisma.usuario.upsert({
    where: { authUserId: authUser.id },
    update: { nome, email, perfil: Perfil.ADMIN, ativo: true, emailVerificadoEm },
    create: { authUserId: authUser.id, nome, email, perfil: Perfil.ADMIN, ativo: true, emailVerificadoEm }
  });

  console.log(`Administrador ${email} configurado com sucesso.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
