const { createClient } = require("@supabase/supabase-js");
const { PrismaClient, Perfil } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const nome = process.env.ADMIN_NOME || "Administrador";
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_SENHA;

  if (!url || !secretKey || !email || !password) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL e ADMIN_SENHA.");
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let authUser = created?.user;
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

  await prisma.usuario.upsert({
    where: { authUserId: authUser.id },
    update: { nome, email, perfil: Perfil.ADMIN, ativo: true },
    create: { authUserId: authUser.id, nome, email, perfil: Perfil.ADMIN, ativo: true }
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
