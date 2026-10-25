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
  const read = () => client.from("user_workspaces").select("data,revision").eq("user_id", user.id).maybeSingle();
  let result = await read();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) {
    const created = await client.from("user_workspaces").upsert(
      { user_id: user.id, data: emptyAccount(user), revision: 0 },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (created.error) throw new Error(created.error.message);
    result = await read();
  }
  if (result.error) throw new Error(result.error.message);
  if (!result.data || !validState(result.data.data, user.id)) throw new Error("Your account data could not be loaded. Please retry.");
  return result.data as AccountRecord;
}
export async function saveAccount(client: SupabaseClient, userId: string, record: AccountRecord): Promise<number> {
  const { data, error } = await client.from("user_workspaces")
    .update({ data: record.data, revision: record.revision + 1 })
    .eq("user_id", userId).eq("revision", record.revision).select("revision").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ConflictError();
  return data.revision;
}
