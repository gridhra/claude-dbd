import * as fs from "node:fs";
import * as path from "node:path";
import type { Config } from "./config.js";
import { formatDate } from "./task-file.js";

interface HolidayData {
  year: number;
  country: string;
  holidays: Array<{ date: string; name: string }>;
}

let holidayCache: Map<number, Set<string>> = new Map();

export function loadHolidays(config: Config, year: number): Set<string> {
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  const holidayFile = path.join(config.dbdRoot, ".local", "holidays", `${year}.json`);
  const holidays = new Set<string>();

  if (fs.existsSync(holidayFile)) {
    try {
      const data: HolidayData = JSON.parse(fs.readFileSync(holidayFile, "utf-8"));
      for (const h of data.holidays) {
        holidays.add(h.date);
      }
    } catch (e) {
      console.error(`Failed to load holidays for ${year}:`, e);
    }
  }

  holidayCache.set(year, holidays);
  return holidays;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isHoliday(config: Config, date: Date): boolean {
  const year = date.getFullYear();
  const holidays = loadHolidays(config, year);
  const dateStr = formatDate(date);
  return holidays.has(dateStr);
}

export function isBusinessDay(config: Config, date: Date): boolean {
  return !isWeekend(date) && !isHoliday(config, date);
}

export function countBusinessDays(
  config: Config,
  fromDate: Date,
  toDate: Date
): number {
  let count = 0;
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);

  // Don't count the start date, only count days between
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    if (isBusinessDay(config, current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function getHolidayName(config: Config, date: Date): string | null {
  const year = date.getFullYear();
  const holidayFile = path.join(config.dbdRoot, ".local", "holidays", `${year}.json`);

  if (!fs.existsSync(holidayFile)) {
    return null;
  }

  try {
    const data: HolidayData = JSON.parse(fs.readFileSync(holidayFile, "utf-8"));
    const dateStr = formatDate(date);
    const holiday = data.holidays.find((h) => h.date === dateStr);
    return holiday?.name || null;
  } catch {
    return null;
  }
}

export interface TaskPriorityInfo {
  taskText: string;
  dueDate: string | undefined;
  calendarDaysRemaining: number | null;
  businessDaysRemaining: number | null;
  effort: string | null; // S, M, L, XL
  impact: string | null; // L, M, H, C
  estimatedEffort: string | null; // AI推定値
  estimatedImpact: string | null; // AI推定値
  priorityScore: number; // 計算されたスコア
}

// effort/impact の推定ロジック
export function estimateEffort(taskText: string): string | null {
  const text = taskText.toLowerCase();

  // XL: 大規模な作業を示唆するキーワード
  if (text.includes("実装") && (text.includes("機能") || text.includes("システム"))) {
    return "L";
  }
  if (text.includes("設計") || text.includes("アーキテクチャ")) {
    return "L";
  }

  // L: 中〜大規模
  if (text.includes("ブラッシュアップ") || text.includes("改善")) {
    return "M";
  }
  if (text.includes("執筆") || text.includes("資料")) {
    return "M";
  }

  // M: 中規模
  if (text.includes("チェック") || text.includes("確認") || text.includes("レビュー")) {
    return "S";
  }
  if (text.includes("棚卸") || text.includes("整理")) {
    return "M";
  }
  if (text.includes("チケット化") || text.includes("優先度付け")) {
    return "S";
  }

  // S: 小規模
  if (text.includes("記入") || text.includes("入力")) {
    return "S";
  }
  if (text.includes("決める") || text.includes("検討")) {
    return "S";
  }

  return null; // 推定できない
}

export function estimateImpact(taskText: string): string | null {
  const text = taskText.toLowerCase();

  // C (Critical): クリティカルなキーワード
  if (text.includes("障害") || text.includes("緊急") || text.includes("クリティカル")) {
    return "C";
  }

  // H (High): 高インパクト
  if (text.includes("リリース") || text.includes("本番") || text.includes("展開")) {
    return "H";
  }
  if (text.includes("定例") || text.includes("報告")) {
    return "H";
  }
  if (text.includes("引き継ぎ")) {
    return "H";
  }

  // M (Medium): 中インパクト
  if (text.includes("改善") || text.includes("ブラッシュアップ")) {
    return "M";
  }
  if (text.includes("振り返り") || text.includes("資料")) {
    return "M";
  }

  // L (Low): 低インパクト
  if (text.includes("整理") || text.includes("棚卸")) {
    return "L";
  }
  if (text.includes("オートメーション") || text.includes("自動化")) {
    return "M"; // 将来的に効率化になるのでM
  }

  return null; // 推定できない
}

// 優先度スコア計算 (高いほど優先)
export function calculatePriorityScore(
  businessDaysRemaining: number | null,
  effort: string | null,
  impact: string | null
): number {
  let score = 0;

  // 営業日残による緊急度 (0-40点)
  if (businessDaysRemaining !== null) {
    if (businessDaysRemaining <= 0) score += 40;
    else if (businessDaysRemaining <= 1) score += 35;
    else if (businessDaysRemaining <= 2) score += 30;
    else if (businessDaysRemaining <= 3) score += 25;
    else if (businessDaysRemaining <= 5) score += 20;
    else if (businessDaysRemaining <= 7) score += 15;
    else if (businessDaysRemaining <= 14) score += 10;
    else score += 5;
  }

  // インパクトによる重要度 (0-40点)
  const impactScores: Record<string, number> = { C: 40, H: 30, M: 20, L: 10 };
  if (impact && impactScores[impact]) {
    score += impactScores[impact];
  }

  // effort は優先度に直接影響しないが、同スコアの場合小さいものを先にする
  // (effort bonus: S=3, M=2, L=1, XL=0)
  const effortBonus: Record<string, number> = { S: 3, M: 2, L: 1, XL: 0 };
  if (effort && effortBonus[effort] !== undefined) {
    score += effortBonus[effort];
  }

  return score;
}

export function getPriorityLabel(score: number): string {
  if (score >= 60) return "🔴 A (最優先)";
  if (score >= 45) return "🟠 B (高)";
  if (score >= 30) return "🟡 C (中)";
  if (score >= 15) return "🟢 D (低)";
  return "⚪ E (いつでも)";
}
