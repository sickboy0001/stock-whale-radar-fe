import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const GUEST_COOKIE_NAME = "radar_guest_id";
const GUEST_COOKIE_AGE = 60 * 60 * 24 * 365; // 1 年

/**
 * 匿名ユーザー用の guest_id を取得します (生成しません)。
 * Cookie に保存されていない場合は undefined を返します。
 */
export async function getExistingGuestId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE_NAME)?.value;
}

/**
 * 匿名ユーザー用の guest_id を取得または生成します。
 * 新規生成した場合は、返り値として guest_id と設定すべき Cookie の情報も返します。
 * Server Action 側で Cookie を設定する必要があります。
 */
export async function getOrCreateGuestId(): Promise<{
  guestId: string;
  shouldSetCookie: boolean;
}> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (!guestId) {
    guestId = nanoid(); // 安全な一意の ID を生成
    return { guestId, shouldSetCookie: true };
  }

  return { guestId, shouldSetCookie: false };
}
