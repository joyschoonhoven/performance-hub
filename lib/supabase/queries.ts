"use client";
import { createClient } from "./client";
import type { PlayerWithDetails, Evaluation, Challenge } from "@/lib/types";

// ── Player: fetch own record (for player dashboard) ─────────────────
export async function getMyPlayerData(): Promise<PlayerWithDetails | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!player) return null;

  const [identityRes, evaluationsRes, challengesRes, profileRes] = await Promise.all([
    supabase.from("player_identities").select("*").eq("player_id", player.id).maybeSingle(),
    supabase.from("evaluations").select("*, evaluation_scores(*)").eq("player_id", player.id).order("evaluation_date", { ascending: false }),
    supabase.from("challenges").select("*").eq("player_id", player.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  const evaluations: Evaluation[] = (evaluationsRes.data ?? []).map((ev: Record<string, unknown>) => ({
    ...(ev as object),
    scores: ((ev.evaluation_scores as unknown[]) ?? []).map((s: unknown) => s as { id: string; evaluation_id: string; category: string; score: number }),
  })) as Evaluation[];

  const latest = evaluations[0];
  const recent_scores = latest?.scores?.length ? {
    techniek: latest.scores.find((s) => s.category === "techniek")?.score ?? 0,
    fysiek: latest.scores.find((s) => s.category === "fysiek")?.score ?? 0,
    tactiek: latest.scores.find((s) => s.category === "tactiek")?.score ?? 0,
    mentaal: latest.scores.find((s) => s.category === "mentaal")?.score ?? 0,
    teamplay: latest.scores.find((s) => s.category === "teamplay")?.score ?? 0,
  } : undefined;

  return {
    ...(player as object),
    avatar_url: profileRes.data?.avatar_url ?? player.avatar_url,
    identity: identityRes.data ?? undefined,
    evaluations,
    challenges: (challengesRes.data ?? []) as Challenge[],
    recent_scores,
    trend: "stable",
  } as PlayerWithDetails;
}

// ── Coach: fetch all players ─────────────────────────────────────────
export async function getAllPlayers(): Promise<PlayerWithDetails[]> {
  const supabase = createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("overall_rating", { ascending: false });

  if (!players?.length) return [];

  const playerIds = players.map((p) => p.id);
  const profileIds = players.map((p) => p.profile_id).filter(Boolean) as string[];

  const [identitiesRes, evaluationsRes, challengesRes, profilesRes] = await Promise.all([
    supabase.from("player_identities").select("*").in("player_id", playerIds),
    supabase.from("evaluations").select("*, evaluation_scores(*)").in("player_id", playerIds).order("evaluation_date", { ascending: false }),
    supabase.from("challenges").select("*").in("player_id", playerIds),
    profileIds.length
      ? supabase.from("profiles").select("id, avatar_url").in("id", profileIds)
      : Promise.resolve({ data: [] }),
  ]);

  const identities = identitiesRes.data ?? [];
  const allEvaluations = evaluationsRes.data ?? [];
  const allChallenges = challengesRes.data ?? [];
  const profiles = (profilesRes.data ?? []) as { id: string; avatar_url?: string }[];

  return players.map((player) => {
    const identity = identities.find((i) => i.player_id === player.id);
    const profileAvatar = player.profile_id
      ? profiles.find((pr) => pr.id === player.profile_id)?.avatar_url
      : undefined;
    const evaluations: Evaluation[] = allEvaluations
      .filter((e) => e.player_id === player.id)
      .map((ev: Record<string, unknown>) => ({
        ...(ev as object),
        scores: ((ev.evaluation_scores as unknown[]) ?? []),
      })) as Evaluation[];

    const challenges = allChallenges.filter((c) => c.player_id === player.id) as Challenge[];

    const latest = evaluations[0];
    const recent_scores = latest?.scores?.length ? {
      techniek: latest.scores.find((s) => s.category === "techniek")?.score ?? 0,
      fysiek: latest.scores.find((s) => s.category === "fysiek")?.score ?? 0,
      tactiek: latest.scores.find((s) => s.category === "tactiek")?.score ?? 0,
      mentaal: latest.scores.find((s) => s.category === "mentaal")?.score ?? 0,
      teamplay: latest.scores.find((s) => s.category === "teamplay")?.score ?? 0,
    } : undefined;

    return {
      ...(player as object),
      avatar_url: profileAvatar ?? player.avatar_url,
      identity,
      evaluations,
      challenges,
      recent_scores,
      trend: "stable",
    } as PlayerWithDetails;
  });
}

// ── Get single player by ID (for coach player detail) ───────────────
export async function getPlayerById(playerId: string): Promise<PlayerWithDetails | null> {
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .maybeSingle();

  if (!player) return null;

  const [identityRes, evaluationsRes, challengesRes] = await Promise.all([
    supabase.from("player_identities").select("*").eq("player_id", player.id).maybeSingle(),
    supabase.from("evaluations").select("*, evaluation_scores(*)").eq("player_id", player.id).order("evaluation_date", { ascending: false }),
    supabase.from("challenges").select("*").eq("player_id", player.id).order("created_at", { ascending: false }),
  ]);

  const evaluations: Evaluation[] = (evaluationsRes.data ?? []).map((ev: Record<string, unknown>) => ({
    ...(ev as object),
    scores: ((ev.evaluation_scores as unknown[]) ?? []).map((s: unknown) => s as { id: string; evaluation_id: string; category: string; score: number }),
  })) as Evaluation[];

  const latest = evaluations[0];
  const recent_scores = latest?.scores?.length ? {
    techniek: latest.scores.find((s) => s.category === "techniek")?.score ?? 0,
    fysiek: latest.scores.find((s) => s.category === "fysiek")?.score ?? 0,
    tactiek: latest.scores.find((s) => s.category === "tactiek")?.score ?? 0,
    mentaal: latest.scores.find((s) => s.category === "mentaal")?.score ?? 0,
    teamplay: latest.scores.find((s) => s.category === "teamplay")?.score ?? 0,
  } : undefined;

  return {
    ...(player as object),
    identity: identityRes.data ?? undefined,
    evaluations,
    challenges: (challengesRes.data ?? []) as Challenge[],
    recent_scores,
    trend: "stable",
  } as PlayerWithDetails;
}

// ── Challenges for a specific player ────────────────────────────────
export async function getPlayerChallenges(playerId: string): Promise<Challenge[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Challenge[];
}

// ── Challenge templates ──────────────────────────────────────────────
export interface ChallengeTemplate {
  id: string;
  month_label: string;
  title: string;
  description: string;
  category: string;
  duration_weeks: number;
}

export async function getChallengeTemplates(): Promise<ChallengeTemplate[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("challenge_templates")
    .select("*")
    .order("sort_order");
  return (data ?? []) as ChallengeTemplate[];
}

// ── Create challenge from template for a player ──────────────────────
export async function assignChallengeToPlayer(
  templateId: string,
  playerId: string,
  coachId: string,
  coachName: string,
  deadlineDate: string,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { data: template } = await supabase
    .from("challenge_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) return { error: "Template niet gevonden" };

  const { error } = await supabase.from("challenges").insert({
    player_id: playerId,
    coach_id: coachId,
    title: template.title,
    description: template.description,
    category: template.category,
    status: "open",
    deadline: deadlineDate,
    progress: 0,
  });

  return error ? { error: error.message } : {};
}

// ── Update challenge progress ─────────────────────────────────────────
export async function updateChallengeProgress(
  challengeId: string,
  progress: number,
  status: string,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("challenges")
    .update({ progress, status })
    .eq("id", challengeId);
}
