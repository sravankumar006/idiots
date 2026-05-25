const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value.trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env variables in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspect() {
  console.log("Fetching recent messages...")
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching messages:", error)
    return
  }

  console.log("Recent messages in database:")
  data.forEach(msg => {
    console.log(`[${msg.created_at}] ID: ${msg.id} | Sender: ${msg.profiles?.username} (${msg.sender_id}) | Type: ${msg.type} | Msg: ${msg.message.substring(0, 60)}...`)
  })
}

inspect()
