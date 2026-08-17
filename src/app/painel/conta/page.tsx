import { LogoutButton } from "@/components/auth/logout-button";
import { getPainelSession } from "@/lib/server-auth";

export default async function ContaPage() {
  const session = await getPainelSession();

  return (
    <main className="mx-auto w-full max-w-6xl">
      <section className="surface-neuro p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Conta</h1>
        <p className="mt-3 text-text-secondary">{session?.user.name} · {session?.user.email}</p>
        <div className="mt-6"><LogoutButton /></div>
      </section>
    </main>
  );
}
