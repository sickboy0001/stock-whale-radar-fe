import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 全角英数字・スペースを半角に変換する
 */
export function toHalfWidth(str: string): string {
  return str
    .replace(/[！-～]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    })
    .replace(/　/g, " ");
}

/**
 * 大きな数値を単位（万、億、兆）付きの文字列に変換する
 */
export function formatWithUnit(num?: number, unit: string = "") {
  if (num === undefined || num === null || isNaN(num)) return "-";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "兆" + unit;
  if (num >= 1e8) return (num / 1e8).toFixed(1) + "億" + unit;
  if (num >= 1e4) return (num / 1e4).toFixed(1) + "万" + unit;
  return num.toLocaleString() + unit;
}

/**
 * 通貨形式にフォーマットする
 */
export function formatCurrency(num?: number, currency: string = "JPY") {
  if (num === undefined || num === null || isNaN(num)) return "-";
  if (currency === "JPY") {
    return "¥" + num.toLocaleString();
  }
  return num.toLocaleString() + " " + currency;
}
