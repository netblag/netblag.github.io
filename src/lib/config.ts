export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  chatEndpoint: import.meta.env.VITE_PUBLIC_CHAT_ENDPOINT ?? '',
}

export const hasSupabase = Boolean(
  config.supabaseUrl && config.supabasePublishableKey,
)
