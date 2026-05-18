"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { StadiumBoard } from "./StadiumBoard";
import { AgreementModal } from "./AgreementModal";
import {
  addAgreement,
  computeStats,
  listAgreements,
  removeAgreement,
  setStatus,
  subscribe,
  updateAgreement,
  CATEGORY_META,
  type AgreementInput,
  type PlanAgreement,
  type PlanCategory,
  type PlanStatus,
} from "@/lib/personal-plan";
import { addNotification } from "@/lib/notifications";
import type { ChatMessage } from "@/lib/plan-chat";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Target, Flame, CheckCircle2 } from "lucide-react";

interface Props {
  playerId: string;
  playerFirstName?: string;
  /** "coach" = full edit access. "player" = can mark complete + view. */
  viewerRole: "coach" | "player";
  viewerName?: string;
}

export function PlanView({ playerId, playerFirstName, viewerRole, viewerName }: Props) {
  const canEdit = viewerRole === "coach";
  const [agreements, setAgreements] = useState<PlanAgreement[]>([]);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [activeAgreement, setActiveAgreement] = useState<PlanAgreement | null>(null);
  const [initialCategory, setInitialCategory] = useState<PlanCategory | undefined>(undefined);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) setViewerId(user?.id ?? null);
      } catch {
        if (!cancelled) setViewerId(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    const next = await listAgreements(playerId);
    setAgreements(next);
  }, [playerId]);

  useEffect(() => {
    void refresh();
    return subscribe(playerId, () => { void refresh(); });
  }, [playerId, refresh]);

  const stats = useMemo(() => computeStats(agreements), [agreements]);

  function openCreate(category: PlanCategory) {
    setInitialCategory(category);
    setActiveAgreement(null);
    setModalMode("create");
  }

  function openDetail(a: PlanAgreement) {
    setActiveAgreement(a);
    setModalMode(canEdit ? "edit" : "view");
  }

  async function handleSave(input: AgreementInput) {
    const created = await addAgreement(playerId, { ...input, created_by_name: viewerName ?? input.created_by_name });
    if (!created) return;
    // Coach added an agreement → notify the player
    if (canEdit) {
      const meta = CATEGORY_META[created.category];
      await addNotification({
        player_id: playerId,
        type: "plan_update",
        title: `Nieuwe ${meta.label.toLowerCase()} afspraak`,
        body: `${viewerName ?? "Je coach"} heeft een afspraak op je bord gezet: "${created.title}"`,
        href: "/dashboard/player/plan",
        meta: { agreement_id: created.id, category: created.category },
      });
    }
    void refresh();
  }

  async function handleUpdate(id: string, patch: Partial<PlanAgreement>) {
    await updateAgreement(playerId, id, patch);
    void refresh();
  }

  async function handleDelete(id: string) {
    await removeAgreement(playerId, id);
    void refresh();
  }

  async function handleSetStatus(id: string, status: PlanStatus) {
    const before = agreements.find((a) => a.id === id);
    const after = await setStatus(playerId, id, status);
    if (!after || !before) return;

    if (viewerRole === "player" && status === "completed" && before.status !== "completed") {
      await addNotification({
        player_id: playerId,
        type: "plan_update",
        title: `Afspraak behaald 🎉`,
        body: `"${after.title}" is afgevinkt. +${after.xp ?? 0} XP, streak ${after.streak ?? 0}.`,
        href: "/dashboard/player/plan",
        meta: { agreement_id: after.id, achievement: true },
      });
    }
    void refresh();
  }

  function closeModal() {
    setModalMode(null);
    setActiveAgreement(null);
    setInitialCategory(undefined);
  }

  async function handleChatSent(msg: ChatMessage) {
    // Coach sends → notify the player via the in-app bell.
    // Player sends → no notification yet (coach overview in Fase 4 will surface it).
    if (msg.author_role === "coach") {
      const snippet = msg.body.length > 80 ? msg.body.slice(0, 80) + "…" : msg.body;
      const agreementTitle = activeAgreement?.title ?? "een afspraak";
      await addNotification({
        player_id: playerId,
        type: "chat_message",
        title: `${msg.author_name ?? "Je coach"} reageerde op "${agreementTitle}"`,
        body: snippet,
        href: "/dashboard/player/plan",
        meta: { agreement_id: msg.agreement_id, message_id: msg.id },
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        <StatCard
          icon={<Target size={16} />}
          color="#4DAEE5"
          label="Open afspraken"
          value={stats.open + stats.inProgress}
          hint={`${stats.total} totaal`}
        />
        <StatCard
          icon={<CheckCircle2 size={16} />}
          color="#16A34A"
          label="Behaald"
          value={stats.completed}
          hint={`${stats.completionRate}% behaald`}
        />
        <StatCard
          icon={<Flame size={16} />}
          color="#F0A500"
          label="XP verdiend"
          value={stats.xpEarned}
          hint="game-progressie"
        />
        <StatCard
          icon={<Trophy size={16} />}
          color="#A855F7"
          label="Beste zone"
          value={(() => {
            const entries = Object.entries(stats.byCategory);
            const best = entries.sort((a, b) => b[1].completed - a[1].completed)[0];
            if (!best || best[1].total === 0) return "—";
            return CATEGORY_META[best[0] as PlanCategory].label.split(" ")[0];
          })()}
          hint="meest voltooid"
        />
      </div>

      {/* Stadium board */}
      <StadiumBoard
        agreements={agreements}
        canEdit={canEdit}
        onAdd={openCreate}
        onSelect={openDetail}
      />

      {/* Helper hint for empty state */}
      {agreements.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "10px 14px",
            fontSize: 12,
            color: "var(--text-dim)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          {canEdit
            ? `Plaats afspraken op het veld${playerFirstName ? ` voor ${playerFirstName}` : ""}. Klik de + bij een zone.`
            : "Je coach heeft nog geen afspraken op je bord gezet."}
        </div>
      )}

      {modalMode && (
        <AgreementModal
          mode={modalMode}
          canEdit={canEdit}
          initialCategory={initialCategory}
          agreement={activeAgreement ?? undefined}
          playerId={playerId}
          viewerId={viewerId}
          viewerRole={viewerRole}
          viewerName={viewerName ?? (viewerRole === "coach" ? "Coach" : "Speler")}
          onClose={closeModal}
          onSave={handleSave}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onSetStatus={handleSetStatus}
          onChatMessageSent={handleChatSent}
        />
      )}
    </div>
  );
}

function StatCard({
  icon, color, label, value, hint,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-2)", fontFamily: "Outfit, sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{hint}</div>
    </div>
  );
}
