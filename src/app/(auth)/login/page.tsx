import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { NeuCard } from "@/components/ui";
import { getPainelSession } from "@/lib/server-auth";

export default async function LoginPage() {
  const session = await getPainelSession();

  if (session?.user?.id) {
    redirect("/painel");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard
        className="w-full"
        title="Entrar no painel"
        description="Acesso restrito à equipe autorizada da escola."
      >
        <BrandLogo className="mb-6" />
        <Suspense>
          <LoginForm />
        </Suspense>
      </NeuCard>
    </main>
  );
}
