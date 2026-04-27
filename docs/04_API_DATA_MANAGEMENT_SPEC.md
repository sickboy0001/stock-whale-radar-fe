# API 経由のデータ管理（クエリ発行）仕様書

このドキュメントは、フロントエンドから直接データベースを操作せず、API エンドポイントを経由してクエリを発行しデータを管理する構成の仕様を記述します。

## 1. アーキテクチャの概要
データ操作の安全性を高め、ビジネスロジックを共通化するため、以下の3層構造を採用しています。

1.  **クライアント層 (Client Layer)**: React コンポーネント。API を呼び出し、UI を更新。
2.  **API 層 (API Layer)**: Next.js App Router (Route Handlers)。認証チェックと Service 層の呼び出し。
3.  **サービス層 (Service Layer)**: Drizzle ORM 等を使用したデータベース操作の実行。

## 2. API エンドポイントの設計

### 2.1 データ一覧取得 (GET)
- **エンドポイント**: `/api/posts`
- **メソッド**: `GET`
- **機能**: データベースから全件（または条件付きで）レコードを取得する。

### 2.2 データ一括削除 (DELETE)
- **エンドポイント**: `/api/kinemoji`
- **メソッド**: `DELETE`
- **リクエストボディ**: `{ "ids": ["uuid-1", "uuid-2"] }`
- **機能**: 指定された複数の ID に基づいてレコードを削除する。

## 3. 実装のポイント

### 3.1 Service 層による共通化
データベース操作（SQL クエリの発行）は、API ハンドラ内に直接記述せず、Service クラスに集約します。これにより、API 以外（スクリプトやサーバーコンポーネント）からも同じロジックを利用できます。

- **ファイル例**: `src/service/kinemoji-service.ts`
- **実装例**:
  ```typescript
  export const kinemojiService = {
    async getAll() {
      return await db.query.kinemojis.findMany({
        orderBy: [desc(kinemojis.createdAt)],
      });
    },
    async deleteMany(ids: string[]) {
      return await db.delete(kinemojis).where(inArray(kinemojis.id, ids));
    }
  };
  ```

### 3.2 API 層でのカプセル化
API ハンドラは、HTTP プロトコルの詳細（ステータスコード、エラーレスポンス）を管理します。

- **ファイル例**: `src/app/api/posts/route.ts`
- **実装例**:
  ```typescript
  export async function GET() {
    try {
      const data = await kinemojiService.getAll();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
  }
  ```

### 3.3 クライアント側での非同期処理
フロントエンドからは `fetch` を使用して API を呼び出し、結果に基づいて状態 (`useState`) を更新します。

- **実装例**:
  ```typescript
  const fetchKinemojis = async () => {
    setIsLoading(true);
    const response = await fetch("/api/posts");
    const data = await response.json();
    setKinemojis(data);
    setIsLoading(false);
  };
  ```

## 4. この構成を採用するメリット
- **セキュリティ**: データベースの接続情報や複雑なクエリ構造をクライアントに露出させない。
- **保守性**: データベースのスキーマや ORM を変更しても、API のインターフェースが変わらなければクライアント側の修正は不要。
- **再利用性**: モバイルアプリや外部ツールから同じ API を利用可能になる。
- **認証の統合**: 管理者権限のチェックを API 層で一括して行える。
