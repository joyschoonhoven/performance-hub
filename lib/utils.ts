import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BadgeType, PositionType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRatingColor(rating: number): string {
  if (rating >= 85) return "#f59e0b"; // gold
  if (rating >= 75) return "#00d4aa"; // teal
  if (rating >= 65) return "#6366f1"; // indigo
  if (rating >= 55) return "#84cc16"; // lime
  return "#64748b"; // slate
}

export function getRatingLabel(rating: number): string {
  if (rating >= 90) return "Wereldklasse";
  if (rating >= 85) return "Elite";
  if (rating >= 75) return "Sterk";
  if (rating >= 65) return "Goed";
  if (rating >= 55) return "Gemiddeld";
  return "Ontwikkeling";
}

export function getScoreColor(score: number): string {
  if (score >= 9) return "#f59e0b";
  if (score >= 7) return "#00d4aa";
  if (score >= 5) return "#6366f1";
  if (score >= 3) return "#f97316";
  return "#ef4444";
}

export function calculateOverallFromScores(scores: Record<string, number>): number {
  const values = Object.values(scores).filter((v) => v > 0);
  if (!values.length) return 50;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(40 + (avg - 1) * (59 / 9));
}

export function determineBadge(rating: number, trend?: "up" | "down" | "stable"): BadgeType {
  if (rating >= 85) return "elite";
  if (rating >= 75) return trend === "up" ? "rising_star" : "talent";
  if (rating >= 60) return "prospect";
  return "prospect";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
  });
}

export function getAge(dateOfBirth: string): number {
  const today = new Date();
  const bday = new Date(dateOfBirth);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}

export function getPositionGroup(pos: PositionType): string {
  if (pos === "GK") return "Keeper";
  if (["CB", "LB", "RB"].includes(pos)) return "Verdediging";
  if (["CDM", "CM", "CAM"].includes(pos)) return "Middenveld";
  return "Aanval";
}

export function avatarUrl(name: string, size = 80): string {
  return `https://api.dicebear.com/7.x/footballicons/svg?seed=${encodeURIComponent(name)}&size=${size}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
