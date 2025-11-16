import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants.");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
const role = (process.argv[4] as string) ?? "owner";

if (!email || !password) {
  console.error("Usage: npx tsx scripts/upsert-user.ts <email> <password> [role]");
  process.exit(1);
}

async function main() {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Impossible de lister les utilisateurs:", listError.message);
    process.exit(1);
  }

  let userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      console.error("❌ Création utilisateur impossible:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("✅ Utilisateur créé.");
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("❌ Mise à jour du mot de passe impossible:", error.message);
      process.exit(1);
    }
    console.log("✅ Mot de passe mis à jour.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        role,
        prenom: "Compte",
        nom: "Démo",
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("❌ Impossible de mettre à jour le profil:", profileError.message);
    process.exit(1);
  }

  console.log(`🎯 Profil synchronisé avec le rôle "${role}".`);
  console.log(`Email: ${email}`);
  console.log(`Mot de passe: ${password}`);
}

main();

