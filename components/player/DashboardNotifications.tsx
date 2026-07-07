"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Award, Flag, MessageSquare, Clock, CheckCheck } from "lucide-react";
import {
  listNotifications, markRead, markAllRead, subscribe,
  type AppNotification, type NotificationType,
} from "@/lib/notifications";

const S = {
  card: "#FFFFFF", ink: "#0D1B2A", sub: "#5A6B80", dim: "#9BAABB",
  line: "rgba(13,27,42,0.09)", blue: "#1B6CA8", sky: "#4DAEE5", gold: "#F0A500", green: "#2E9E6B", purple: "#7C5CD6",
} as const;

const META: Record<NotificationType, { color: string; icon: React.ReactNode }> = {
  evaluation:   { color: S.blue,   icon: <Award size={15} /> },
  plan_update:  { color: S.green,  icon: <Flag size={15} /> },
  chat_message: { color: S.purple, icon: <MessageSquare size={15} /> },
  reminder:     { color: S.gold,   icon: <Bell size={15} /> },
};

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "nu";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}u`;
  return `${Math.floor(d / 86400)}d`;
}

export function DashboardNotifications({ playerId }: { playerId: string }) {
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = useCallback(async () => {
    const all = await listNotifications(playerId);
    setItems(all.filter(n => !n.read).slice(0, 4));
  }, [playerId]);

  useEffect(() => {
    void refresh();
    return subscribe(playerId, () => { void refresh(); });
  }, [playerId, refresh]);

  async function dismiss(id: string) {
    setItems(prev => prev.filter(n => n.id !== id));
    await markRead(playerId, id);
  }
  async function clearAll() {
    setItems([]);
    await markAllRead(playerId);
  }

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
      style={{ background: S.card, border: `1px solid ${S.line}`, borderRadius: 14, padding: "14px 16px",
        boxShadow: "0 1px 2px rgba(13,27,42,0.04)", fontFamily: "'Archivo',system-ui,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Bell size={14} style={{ color: S.blue }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: S.sub, textTransform: "uppercase" }}>
            Meldingen
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: S.blue, borderRadius: 999, padding: "1px 7px" }}>
            {items.length}
          </span>
        </div>
        <button onClick={clearAll} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: S.sub, background: "transparent", border: "none", cursor: "pointer" }}>
          <CheckCheck size={12} /> Alles gelezen
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence>
          {items.map((n) => {
            const meta = META[n.type] ?? META.reminder;
            const inner = (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, marginTop: 1,
                  background: `${meta.color}14`, border: `1px solid ${meta.color}26`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
                    <span style={{ fontSize: 10.5, color: S.dim, display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      <Clock size={9} /> {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: S.sub, lineHeight: 1.4, marginTop: 1,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {n.body}
                  </div>
                </div>
              </div>
            );
            return (
              <motion.div key={n.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 10, background: "#F7FAFC", border: `1px solid ${S.line}` }}>
                  {n.href ? <Link href={n.href} style={{ textDecoration: "none" }}>{inner}</Link> : inner}
                </div>
                <button onClick={() => dismiss(n.id)} aria-label="Markeer gelezen"
                  style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "transparent", border: `1px solid ${S.line}`,
                    color: S.dim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
