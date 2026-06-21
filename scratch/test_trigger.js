const { createClient } = require('@supabase/supabase-js');

// We simulate createNotification in JS to debug the 500 error
async function testTrigger() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key length:", supabaseKey?.length);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Let's find an active user profile to send to
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, username').limit(2);
  if (profErr) {
    console.error("Profiles fetch error:", profErr);
    return;
  }

  if (!profiles || profiles.length < 2) {
    console.error("Need at least 2 profiles to test invite.");
    return;
  }

  const host = profiles[0];
  const invitee = profiles[1];
  console.log(`Simulating invite from host: @${host.username} (${host.id}) to invitee: @${invitee.username} (${invitee.id})`);

  // Let's see if we have a study room or create a dummy one
  let roomId = null;
  const { data: existingRooms } = await supabase.from('study_rooms').select('id').limit(1);
  if (existingRooms && existingRooms.length > 0) {
    roomId = existingRooms[0].id;
  } else {
    // Create a dummy room
    const { data: newRoom, error: createRoomErr } = await supabase.from('study_rooms').insert({
      name: "Debug Room",
      description: "Temp debug room",
      host_user_id: host.id,
      room_status: 'waiting'
    }).select().single();

    if (createRoomErr) {
      console.error("Failed to create debug room:", createRoomErr);
      return;
    }
    roomId = newRoom.id;
  }

  console.log("Using room ID:", roomId);

  try {
    // 1. Insert notification record
    console.log("Attempting database insert into notifications table...");
    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: invitee.id,
        title: "test study cabin invite 📅",
        body: `@${host.username} invited you to join: Debug Room`,
        category: "focus",
        type: "invitation",
        related_id: roomId,
        room_id: roomId,
        is_read: false
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error details:", insertError);
      throw insertError;
    }

    console.log("Notification record inserted successfully:", inserted);
  } catch (err) {
    console.error("Exception caught during execution:", err);
  }
}

testTrigger();
