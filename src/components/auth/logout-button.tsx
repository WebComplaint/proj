"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NeuButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <NeuButton loading={loading} onClick={logout}>Sair da conta</NeuButton>;
}
