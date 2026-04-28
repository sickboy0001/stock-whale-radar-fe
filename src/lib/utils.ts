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
