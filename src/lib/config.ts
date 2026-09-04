export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  chatEndpoint: import.meta.env.VITE_PUBLIC_CHAT_ENDPOINT ?? '',
}

export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey)
