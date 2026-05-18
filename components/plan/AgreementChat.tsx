"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import {
  listMessages,
  sendMessage,
  subscribe,
  type ChatAuthorRole,
  type ChatMessage,
} from "@/lib/plan-chat";

interface Props {
  playerId: string;
  agreementId: string;
  viewerId: string | null;
  viewerRole: ChatAuthorRole;
  viewerName: string;
  onMessageSent?: (msg: ChatMessage) => void;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return sameDay
    ? d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) +
        " " +
        d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export function AgreementChat({
  playerId, agreementId, viewerId, viewerRole, viewerName, onMessageSent,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    const next = await listMessages(playerId, agreementId);
    setMessages(next);
    setLoading(false);
  }, [playerId, agreementId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    return subscribe(playerId, agreementId, () => { void refresh(); });
  }, [playerId, agreementId, refresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    const msg = await sendMessage({
      playerId,
      agreementId,
      authorId: viewerId,
      authorRole: viewerRole,
      authorName: viewerName,
      body,
    });
    setBody("");
    setSending(false);
    if (msg) {
      onMessageSent?.(msg);
      void refresh();
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={13} style={{ color: "#A855F7" }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
          }}
        >
          Berichten over deze afspraak
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>
          {messages.length > 0 ? `${messages.length} bericht${messages.length === 1 ? "" : "en"}` : "Nog geen berichten"}
        </span>
      </div>

      {/* Scrollable message list */}
      <div
        ref={scrollRef}
        style={{
          background: "rgba(7,16,26,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 12,
          maxHeight: 240,
          minHeight: 100,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
            <Loader2 size={11} className="animate-spin" /> Laden...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              textAlign: "center",
              padding: "16px 8px",
              fontStyle: "italic",
            }}
          >
            Start het gesprek over deze afspraak.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.author_role === viewerRole;
            const coachMsg = m.author_role === "coach";
            const accent = coachMsg ? "#4DAEE5" : "#F0A500";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    borderRadius: 12,
                    background: mine ? `${accent}26` : "rgba(255,255,255,0.06)",
                    border: `1px solid ${mine ? `${accent}55` : "rgba(255,255,255,0.1)"}`,
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.body}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.45)",
                    display: "inline-flex",
                    gap: 6,
                    padding: "0 4px",
                  }}
                >
                  <span style={{ color: accent, fontWeight: 700 }}>
                    {m.author_name || (coachMsg ? "Coach" : "Speler")}
                  </span>
                  <span>· {timeLabel(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={viewerRole === "coach" ? "Schrijf je speler een bericht..." : "Reageer op je coach..."}
          disabled={sending}
          style={{
            flex: 1,
            padding: "9px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          style={{
            padding: "0 14px",
            borderRadius: 8,
            background: !body.trim() || sending ? "rgba(168,85,247,0.3)" : "#A855F7",
            border: "none",
            color: "#fff",
            cursor: !body.trim() || sending ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Stuur
        </button>
      </form>
    </div>
  );
}
