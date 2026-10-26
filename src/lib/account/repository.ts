import { SupabaseClient, User } from "@supabase/supabase-js";
import { PrototypeState } from "../prototype/types";

export interface AccountRecord { data: PrototypeState; revision: number }
export class ConflictError extends Error {
  constructor() { super("Your account changed on another device. Review your local changes before loading the latest version."); }
}
export function emptyAccount(user: Pick<User, "id" | "email" | "user_metadata">): PrototypeState {
  return {
    version: 1,
    user: { id: user.id, name: (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) || user.email?.split("@")[0] || "You" },
    projects: [], tasks: [], activities: [], sessions: [], checkIns: [], challenges: [], completions: [],
  };
}
export function validState(value: unknown, userId: string): value is PrototypeState {
  const state = value as PrototypeState | null;
  return !!state && state.version === 1 && state.user?.id === userId && typeof state.user.name === "string" &&
    [state.tasks, state.projects, state.activities, state.sessions, state.checkIns, state.challenges, state.completions].every(Array.isArray);
}
export async function loadAccount(client: SupabaseClient, user: User): Promise<AccountRecord> {
  const { data, error } = await client.rpc("daily_load_workspace", { p_initial: emptyAccount(user) });
  if (error) throw new Error(error.message);
  if (!data || !validState(data.data, user.id)) throw new Error("Your account data could not be loaded. Please retry.");
  return data as AccountRecord;
}
export async function saveAccount(client: SupabaseClient, userId: string, record: AccountRecord): Promise<number> {
  if (!validState(record.data, userId)) throw new Error("Invalid account data.");
  const { data, error } = await client.rpc("daily_save_workspace", { p_data: record.data, p_revision: record.revision });
  if (error?.code === "40001") throw new ConflictError();
  if (error) throw new Error(error.message);
  if (typeof data !== "number") throw new Error("Database did not acknowledge the save.");
  return data;
}
