const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    // remove quotes if any
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Checking tables...");
  
  // 1. Check study_rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('study_rooms')
    .select('id, name, is_public')
    .limit(1);
    
  if (roomsError) {
    console.error("study_rooms error:", roomsError.message, roomsError.code);
  } else {
    console.log("study_rooms: OK. Data sample:", rooms);
  }

  // 2. Check study_room_members
  const { data: members, error: membersError } = await supabase
    .from('study_room_members')
    .select('*')
    .limit(1);
    
  if (membersError) {
    console.error("study_room_members error:", membersError.message, membersError.code);
  } else {
    console.log("study_room_members: OK. Data sample:", members);
  }

  // 3. Check study_room_invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('study_room_invitations')
    .select('*')
    .limit(1);
    
  if (invitationsError) {
    console.error("study_room_invitations error:", invitationsError.message, invitationsError.code);
  } else {
    console.log("study_room_invitations: OK. Data sample:", invitations);
  }

  // 4. Check study_room_timers
  const { data: timers, error: timersError } = await supabase
    .from('study_room_timers')
    .select('*')
    .limit(1);
    
  if (timersError) {
    console.error("study_room_timers error:", timersError.message, timersError.code);
  } else {
    console.log("study_room_timers: OK. Data sample:", timers);
  }
}

checkTables();
