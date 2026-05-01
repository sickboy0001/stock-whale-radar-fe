export const runtime = "edge"; // この一行を追加
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
