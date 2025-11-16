import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const email = "demo.owner@gestion-locative.test";
const password = "Test12345!";
const role = "owner";

async function upsertUser() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    let userId = data?.user?.id;

    if (error && !userId) {
      if (error.message.includes("already been registered")) {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = users.users.find((u) => u.email === email);
        if (!existing) {
          throw new Error("User exists but could not be retrieved");
        }
        userId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      } else {
        throw error;
      }
    }

    if (!userId) {
      throw new Error("Unable to determine user id");
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          role,
          prenom: "Démo",
          nom: "Propriétaire",
        },
        { onConflict: "user_id" }
      );

    if (profileError) throw profileError;

    console.log("✅ Compte démo prêt");
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${password}`);
  } catch (err) {
    console.error("❌ Impossible de créer le compte démo", err);
    process.exit(1);
  }
}

upsertUser();
