"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Save, CheckCircle2, RotateCcw, AlertTriangle, Flame, Clock } from "lucide-react";
import {
  CATEGORY_META,
  type AgreementInput,
  type PlanAgreement,
  type PlanCategory,
  type PlanStatus,
} from "@/lib/personal-plan";
import { AgreementChat } from "./AgreementChat";
import type { ChatAuthorRole, ChatMessage } from "@/lib/plan-chat";

interface Props {
  mode: "create" | "edit" | "view";
  canEdit: boolean;
  initialCategory?: PlanCategory;
  agreement?: PlanAgreement;
  // Chat context — required to render the per-agreement chat thread.
  playerId: string;
  viewerId: string | null;
  viewerRole: ChatAuthorRole;
  viewerName: string;
  onClose: () => void;
  onSave?: (input: AgreementInput) => void;
  onUpdate?: (id: string, patch: Partial<PlanAgreement>) => void;
  onDelete?: (id: string) => void;
  onSetStatus?: (id: string, status: PlanStatus) => void;
  onChatMessageSent?: (msg: ChatMessage) => void;
}

const STATUS_OPTIONS: { value: PlanStatus; label: string; color: string; icon: typeof CheckCircle2 }[] = [
  { value: "open",        label: "Open",      color: "#94a3b8", icon: Clock },
  { value: "in_progress", label: "Bezig",     color: "#4DAEE5", icon: Flame },
  { value: "completed",   label: "Behaald",   color: "#16A34A", icon: CheckCircle2 },
  { value: "missed",      label: "Gemist",    color: "#D64045", icon: AlertTriangle },
];

export function AgreementModal({
  mode, canEdit, initialCategory, agreement,
  playerId, viewerId, viewerRole, viewerName,
  onClose, onSave, onUpdate, onDelete, onSetStatus, onChatMessageSent,
}: Props) {
  const [category, setCategory] = useState<PlanCategory>(
    agreement?.category ?? initialCategory ?? "technical",
  );
  const [title, setTitle] = useState(agreement?.title ?? "");
  const [description, setDescription] = useState(agreement?.description ?? "");
  const [deadline, setDeadline] = useState(agreement?.deadline?.slice(0, 10) ?? "");
  const [recurring, setRecurring] = useState<PlanAgreement["recurring"]>(
    agreement?.recurring ?? null,
  );
  const [xp, setXp] = useState<number>(agreement?.xp ?? 100);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const meta = CATEGORY_META[category];
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const editable = canEdit && (isCreate || isEdit);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (isCreate && onSave) {
      onSave({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        recurring,
        xp,
        created_by: "coach",
      });
      onClose();
    } else if (isEdit && agreement && onUpdate) {
      onUpdate(agreement.id, {
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        recurring,
        xp,
      });
      onClose();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(7,16,26,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(180deg, #0D1B2A 0%, #07101A 100%)",
          border: `1px solid ${meta.color}55`,
          borderRadius: 16,
          boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 0 4px ${meta.color}1a`,
          color: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: `linear-gradient(180deg, ${meta.color}22 0%, transparent 100%)`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: meta.accent,
              border: `1px solid ${meta.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: meta.color, textTransform: "uppercase" }}>
              {meta.zoneLabel} · {meta.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
              {isCreate ? "Nieuwe afspraak" : agreement?.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Quick status switch (when viewing/editing existing) */}
          {agreement && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>
                Status
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = agreement.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSetStatus?.(agreement.id, opt.value)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: active ? `${opt.color}26` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? opt.color : "rgba(255,255,255,0.12)"}`,
                        color: active ? opt.color : "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={12} /> {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category selector */}
          {editable && (
            <div>
              <label style={labelStyle}>Zone op het veld</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 6 }}>
                {(["mental", "technical", "tactical"] as PlanCategory[]).map((c) => {
                  const m = CATEGORY_META[c];
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 10,
                        background: active ? m.accent : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? m.color : "rgba(255,255,255,0.12)"}`,
                        color: active ? m.color : "rgba(255,255,255,0.6)",
                        textAlign: "center",
                        cursor: "pointer",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon}</div>
                      {m.label.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={labelStyle}>Afspraak</label>
            <input
              type="text"
              required
              disabled={!editable}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bv. Elke training 15 min extra schieten"
              style={inputStyle(editable)}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Toelichting</label>
            <textarea
              rows={3}
              disabled={!editable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wat verwachten we? Hoe meet je het?"
              style={{ ...inputStyle(editable), resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Deadline + Recurring + XP */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="date"
                disabled={!editable}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ ...inputStyle(editable), colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Herhaling</label>
              <select
                disabled={!editable}
                value={recurring ?? ""}
                onChange={(e) => setRecurring((e.target.value || null) as PlanAgreement["recurring"])}
                style={inputStyle(editable)}
              >
                <option value="">Eenmalig</option>
                <option value="daily">Dagelijks</option>
                <option value="weekly">Wekelijks</option>
                <option value="match">Elke wedstrijd</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>XP-beloning bij behalen</label>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={!editable}
                  onClick={() => setXp(v)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: xp === v ? "rgba(240,165,0,0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${xp === v ? "#F0A500" : "rgba(255,255,255,0.12)"}`,
                    color: xp === v ? "#F0A500" : "rgba(255,255,255,0.7)",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: editable ? "pointer" : "not-allowed",
                  }}
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata footer */}
          {agreement && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 10,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <div>
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>Door:</strong>{" "}
                {agreement.created_by_name ?? agreement.created_by}
              </div>
              <div>
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>Aangemaakt:</strong>{" "}
                {new Date(agreement.created_at).toLocaleDateString("nl-NL")}
              </div>
              {(agreement.streak ?? 0) > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#F0A500" }}>
                  <Flame size={11} /> streak {agreement.streak}
                </div>
              )}
            </div>
          )}

          {/* Chat thread (only for existing agreements) */}
          {agreement && (
            <AgreementChat
              playerId={playerId}
              agreementId={agreement.id}
              viewerId={viewerId}
              viewerRole={viewerRole}
              viewerName={viewerName}
              onMessageSent={onChatMessageSent}
            />
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            {agreement && canEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Afspraak verwijderen?")) {
                    onDelete(agreement.id);
                    onClose();
                  }
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "rgba(214,64,69,0.12)",
                  border: "1px solid rgba(214,64,69,0.4)",
                  color: "#D64045",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Trash2 size={13} /> Verwijder
              </button>
            )}
            {agreement && !canEdit && agreement.status !== "completed" && onSetStatus && (
              <button
                type="button"
                onClick={() => { onSetStatus(agreement.id, "completed"); onClose(); }}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  background: "#16A34A",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={13} /> Markeer als behaald
              </button>
            )}
            {agreement && !canEdit && agreement.status === "completed" && onSetStatus && (
              <button
                type="button"
                onClick={() => { onSetStatus(agreement.id, "open"); onClose(); }}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <RotateCcw size={13} /> Heropenen
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Sluiten
            </button>
            {editable && (
              <button
                type="submit"
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: meta.color,
                  border: "none",
                  color: "#0D1B2A",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  boxShadow: `0 0 0 4px ${meta.color}26`,
                }}
              >
                <Save size={13} /> {isCreate ? "Plaats op bord" : "Opslaan"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  marginBottom: 6,
};

function inputStyle(editable: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "9px 12px",
    background: editable ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };
}
