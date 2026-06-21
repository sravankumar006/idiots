const { createClient } = require('@supabase/supabase-js');

async function listUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    console.error("Service role key missing!");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
  } else {
    console.log("Users:", users.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata })));
  }
}
listUsers();
