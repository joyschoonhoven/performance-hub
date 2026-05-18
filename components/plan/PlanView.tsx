"use client";

import { useEffect, useState, useCallback } from "react";
import { QuestDashboard } from "./QuestDashboard";
import { AgreementModal } from "./AgreementModal";
import {
  addAgreement,
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
  const [filter, setFilter] = useState<"all" | PlanCategory>("all");

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

  function openCreate(category?: PlanCategory) {
    setInitialCategory(category);
    setActiveAgreement(null);
    setModalMode("create");
  }

  async function handleQuickComplete(id: string) {
    await handleSetStatus(id, "completed");
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
      <QuestDashboard
        agreements={agreements}
        canEdit={canEdit}
        filter={filter}
        onFilterChange={setFilter}
        onAdd={openCreate}
        onSelect={openDetail}
        onQuickComplete={viewerRole === "player" || canEdit ? handleQuickComplete : undefined}
      />

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

