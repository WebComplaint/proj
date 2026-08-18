type AdminUser = { id: string };

function getAdminConfig() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secretKey || !url) {
    throw new Error("SUPABASE_SECRET_KEY não configurada.");
  }

  return { secretKey, url };
}

async function adminRequest(path: string, init: RequestInit) {
  const { secretKey, url } = getAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: {
      apikey: secretKey,
      "Content-Type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.msg ?? result.message ?? result.error_description ?? "Falha na autenticação do Supabase.");
  }

  return result;
}

export async function createAuthUser(email: string, password: string) {
  return adminRequest("/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true })
  }) as Promise<AdminUser>;
}

export async function updateAuthUser(
  id: string,
  data: { email: string; password?: string; ativo: boolean }
) {
  return adminRequest(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      ban_duration: data.ativo ? "none" : "876000h"
    })
  });
}

export async function deleteAuthUser(id: string) {
  return adminRequest(`/users/${id}`, { method: "DELETE" });
}
