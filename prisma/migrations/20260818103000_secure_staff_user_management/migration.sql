CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO web_complaint_app;

CREATE OR REPLACE FUNCTION app_private.create_staff_user(
  p_nome text,
  p_email text,
  p_password text,
  p_perfil public."Perfil",
  p_ativo boolean
) RETURNS TABLE (id text, nome text, email text, perfil public."Perfil", ativo boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, extensions
AS $$
DECLARE
  v_auth_id uuid := extensions.gen_random_uuid();
  v_usuario_id text := extensions.gen_random_uuid()::text;
  v_email text := lower(trim(p_email));
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data,
    raw_user_meta_data, is_super_admin, created_at, updated_at, phone_change, phone_change_token,
    email_change_token_current, email_change_confirm_status, reauthentication_token, is_sso_user,
    is_anonymous, banned_until
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('sub', v_auth_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    false, now(), now(), '', '', '', 0, '', false, false,
    CASE WHEN p_ativo THEN NULL ELSE now() + interval '100 years' END
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    extensions.gen_random_uuid(), v_auth_id::text, v_auth_id,
    jsonb_build_object('sub', v_auth_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now()
  );

  INSERT INTO public."Usuario" ("id", "authUserId", "nome", "email", "perfil", "ativo", "criadoEm", "atualizadoEm")
  VALUES (v_usuario_id, v_auth_id, trim(p_nome), v_email, p_perfil, p_ativo, now(), now());

  RETURN QUERY SELECT u."id", u."nome", u."email", u."perfil", u."ativo"
  FROM public."Usuario" u WHERE u."id" = v_usuario_id;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.update_staff_user(
  p_id text,
  p_nome text,
  p_email text,
  p_password text,
  p_perfil public."Perfil",
  p_ativo boolean
) RETURNS TABLE (id text, nome text, email text, perfil public."Perfil", ativo boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, extensions
AS $$
DECLARE
  v_auth_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  SELECT u."authUserId" INTO v_auth_id FROM public."Usuario" u WHERE u."id" = p_id;
  IF v_auth_id IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado.'; END IF;

  UPDATE auth.users
  SET email = v_email,
      encrypted_password = CASE WHEN nullif(p_password, '') IS NULL THEN encrypted_password
        ELSE extensions.crypt(p_password, extensions.gen_salt('bf')) END,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('email', v_email, 'email_verified', true),
      banned_until = CASE WHEN p_ativo THEN NULL ELSE now() + interval '100 years' END,
      updated_at = now()
  WHERE auth.users.id = v_auth_id;

  UPDATE auth.identities
  SET identity_data = coalesce(identity_data, '{}'::jsonb) ||
        jsonb_build_object('email', v_email, 'email_verified', true),
      updated_at = now()
  WHERE user_id = v_auth_id AND provider = 'email';

  UPDATE public."Usuario" u
  SET "nome" = trim(p_nome), "email" = v_email, "perfil" = p_perfil,
      "ativo" = p_ativo, "atualizadoEm" = now()
  WHERE u."id" = p_id;

  RETURN QUERY SELECT u."id", u."nome", u."email", u."perfil", u."ativo"
  FROM public."Usuario" u WHERE u."id" = p_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.create_staff_user(text,text,text,public."Perfil",boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.update_staff_user(text,text,text,text,public."Perfil",boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.create_staff_user(text,text,text,public."Perfil",boolean) TO web_complaint_app;
GRANT EXECUTE ON FUNCTION app_private.update_staff_user(text,text,text,text,public."Perfil",boolean) TO web_complaint_app;
