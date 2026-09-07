export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  chatEndpoint: import.meta.env.VITE_PUBLIC_CHAT_ENDPOINT ?? '',

  /**
   * Instant-notification endpoint for the contact form.
   * Any service that accepts a JSON POST works; the zero-backend option is
   * Formspree: create a free form, then set
   *   VITE_NOTIFY_ENDPOINT=https://formspree.io/f/XXXXXXXX
   * Every submission is e-mailed to you immediately.
   * Leave empty to keep Supabase as the only channel.
   */
  notifyEndpoint: import.meta.env.VITE_NOTIFY_ENDPOINT ?? '',
}

export const hasSupabase = Boolean(
  config.supabaseUrl && config.supabasePublishableKey,
)
