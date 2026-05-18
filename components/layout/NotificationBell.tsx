"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, ClipboardList, MessageCircle, Map, AlarmClock, X,
  type LucideIcon,
} from "lucide-react";
import {
  listNotifications,
  markAllRead,
  markRead,
  removeNotification,
  subscribe,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  evaluation:   { icon: ClipboardList, color: "#4DAEE5", bg: "rgba(77,174,229,0.14)" },
  plan_update:  { icon: Map,           color: "#16A34A", bg: "rgba(22,163,74,0.14)" },
  chat_message: { icon: MessageCircle, color: "#A855F7", bg: "rgba(168,85,247,0.14)" },
  reminder:     { icon: AlarmClock,    color: "#F0A500", bg: "rgba(240,165,0,0.16)" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} uur geleden`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} dag${d === 1 ? "" : "en"} geleden`;
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

interface Props {
  playerId: string;
}

export function NotificationBell({ playerId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    const next = await listNotifications(playerId);
    setItems(next);
  }, [playerId]);

  useEffect(() => {
    void refresh();
    return subscribe(playerId, () => { void refresh(); });
  }, [playerId, refresh]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function handleItemClick(n: AppNotification) {
    void markRead(playerId, n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notificaties"
        aria-label="Notificaties"
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          border: "1px solid var(--border)",
          background: open ? "rgba(77,174,229,0.1)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: unread ? "#4DAEE5" : "var(--text-dim)",
          position: "relative",
          transition: "all 0.15s",
        }}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 8,
              background: "#D64045",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--surface)",
              letterSpacing: "0.02em",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Notificaties</span>
              {unread > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#4DAEE5",
                    background: "rgba(77,174,229,0.12)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                  }}
                >
                  {unread} NIEUW
                </span>
              )}
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => { void markAllRead(playerId); }}
                disabled={unread === 0}
                title="Alles als gelezen markeren"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: unread === 0 ? "var(--text-dim)" : "var(--sfa-blue)",
                  background: "transparent",
                  border: "none",
                  cursor: unread === 0 ? "default" : "pointer",
                  padding: 4,
                  fontWeight: 600,
                }}
              >
                <CheckCheck size={12} /> Lezen
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    margin: "0 auto 10px",
                    borderRadius: 12,
                    background: "rgba(77,174,229,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={20} style={{ color: "var(--text-dim)" }} />
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>Niks nieuws</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                  Beoordelingen, plan-updates en berichten verschijnen hier.
                </div>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type];
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--border)",
                      background: n.read ? "transparent" : "rgba(77,174,229,0.04)",
                      cursor: n.href ? "pointer" : "default",
                      display: "flex",
                      gap: 10,
                      position: "relative",
                    }}
                    onClick={() => handleItemClick(n)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(77,174,229,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = n.read
                        ? "transparent"
                        : "rgba(77,174,229,0.04)";
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 8,
                        background: meta.bg,
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text-2)",
                        }}
                      >
                        {!n.read && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: "#4DAEE5",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.title}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-dim)",
                          marginTop: 3,
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.body}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Verwijder"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeNotification(playerId, n.id);
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
