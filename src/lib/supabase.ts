// Shared authenticated client. Never construct a placeholder database connection.
import { accountClient } from "./account/client";
export const supabase = accountClient;
export const isSupabaseConfigured = !!accountClient;
