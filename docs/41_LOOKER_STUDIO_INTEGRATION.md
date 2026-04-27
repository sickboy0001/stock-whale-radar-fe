# Looker Studio 管理画面統合仕様書

このドキュメントは、Next.js プロジェクトの管理者画面に Looker Studio ダッシュボードを統合するための仕様と実装手順を記述します。

## 1. 概要
管理者専用ページにおいて、GA4 などのデータを可視化した Looker Studio ダッシュボードを `iframe` で埋め込み表示します。

## 2. 前提条件
- **Looker Studio 側の設定**:
  - ダッシュボードの「共有」設定で、埋め込みが許可されていること。
  - 「レポートの埋め込み」を有効にし、埋め込み用 URL を取得しておくこと。

## 3. 実装詳細

### 3.1 環境変数の設定
埋め込み URL はプロジェクトごとに異なるため、環境変数で管理します。

```env
# .env.local
NEXT_PUBLIC_LOOKER_STUDIO_URL="https://lookerstudio.google.com/embed/reporting/..."
```

### 3.2 コンポーネント構成
`iframe` を使用してダッシュボードを表示する Client Component を作成します。

- **ファイルパス**: `src/components/pages/admini/looker_dashboard.tsx`
- **主要な属性**:
  - `src`: 環境変数から取得した URL。
  - `sandbox`: セキュリティと機能のバランスをとるため、以下の値を推奨。
    - `allow-storage-access-by-user-activation`
    - `allow-scripts`
    - `allow-same-origin`
    - `allow-popups`
    - `allow-popups-to-escape-sandbox`

### 3.3 アクセス制御
管理者以外が閲覧できないよう、サーバーサイドでセッションと権限を確認します。

- **ファイルパス**: `src/app/admini/page.tsx`
- **チェック内容**:
  - `auth()` によるセッション確認。
  - ユーザーのメールアドレス等に基づいた管理者権限の判定 (`isAdministrator`)。

### 3.4 ユーザー体験 (UX) の向上
- **タブ切り替え**: 他の管理者機能（データ一覧など）とタブで切り替えられるように設計。
- **状態保持**: `localStorage` を使用して、最後に表示していたタブを記憶することで、リロード時の利便性を向上。

## 4. 参考コード

### LookerDashboard コンポーネント
```tsx
"use client";

export function LookerDashboard() {
  const lookerUrl = process.env.NEXT_PUBLIC_LOOKER_STUDIO_URL || "";

  if (!lookerUrl) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-600">
        環境変数 NEXT_PUBLIC_LOOKER_STUDIO_URL が設定されていません。
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        src={lookerUrl}
        style={{ border: 0, width: "100%", height: "1050px" }}
        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      ></iframe>
    </div>
  );
}
```

## 5. 注意事項
- **レスポンシブ対応**: Looker Studio のレポートサイズに合わせて `iframe` の `height` を調整してください。
- **セキュリティ**: `iframe` の `sandbox` 属性は、レポート内のインタラクション（ドリルダウンやポップアップ）に必要な最小限の権限を設定してください。
