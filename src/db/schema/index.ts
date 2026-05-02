import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  imageUrl: text("image_url"),
  googleId: text("google_id").unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(true),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s', 'now'))`),
});

export const documents = sqliteTable("documents", {
  docId: text("doc_id").primaryKey(),
  submitDatetime: text("submit_datetime"),
  ordinanceCode: text("ordinance_code"),
  formCode: text("form_code"),
  docTypeCode: text("doc_type_code"),
  docDescription: text("doc_description"),
  submitterEdinetCode: text("submitter_edinet_code"),
  submitterName: text("submitter_name"),
  secCode: text("sec_code"),
  jcn: text("jcn"),
  fundCode: text("fund_code"),
  issuerEdinetCode: text("issuer_edinet_code"),
  subjectEdinetCode: text("subject_edinet_code"),
  issuerName: text("issuer_name"),
  withdrawalStatus: integer("withdrawal_status"),
  docInfoEditStatus: integer("doc_info_edit_status"),
  disclosureStatus: integer("disclosure_status"),
  xbrlFlag: integer("xbrl_flag"),
  pdfFlag: integer("pdf_flag"),
  csvFlag: integer("csv_flag"),
  legalStatus: integer("legal_status"),
  processedStatus: integer("processed_status").default(0),
});

export const ownershipReports = sqliteTable("ownership_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  docId: text("doc_id").references(() => documents.docId),
  obligationDate: text("obligation_date"),
  holdingRatio: real("holding_ratio"),
  prevHoldingRatio: real("prev_holding_ratio"),
  holdingPurpose: text("holding_purpose"),
  isJointHolding: integer("is_joint_holding"),
});

export const edinetCodes = sqliteTable("edinet_codes", {
  edinetCode: text("edinet_code").primaryKey(),
  submitterType: text("submitter_type"),
  listedCategory: text("listing_status"),
  isConsolidated: text("consolidated"),
  capital: integer("capital"),
  settlementDate: text("settlement_date"),
  submitterName: text("filer_name").notNull(),
  submitterNameEn: text("filer_name_en"),
  submitterNameKana: text("filer_name_kana"),
  address: text("address"),
  industry: text("industry"),
  secCode: text("sec_code"),
  corporateNumber: text("jcn"),
});

export const userBuckets = sqliteTable("user_buckets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

export const bucketItems = sqliteTable("bucket_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bucketId: integer("bucket_id").references(() => userBuckets.id),
  secCode: text("sec_code").notNull(),
});

export const importDailyStatus = sqliteTable("import_daily_status", {
  targetDate: text("target_date").primaryKey(),
  status: text("status").notNull(), // completed, failed, processing, pending
  totalDocsCount: integer("total_docs_count"),
  targetDocsCount: integer("target_docs_count"),
  successCount: integer("success_count"),
  lastRunStartAt: text("last_run_start_at"),
  lastRunEndAt: text("last_run_end_at"),
  errorMessage: text("error_message"),
});

export const fundCodes = sqliteTable("fund_codes", {
  fundCode: text("fund_code").primaryKey(),
  secCode: text("sec_code"),
  fundName: text("fund_name").notNull(),
  fundNameKana: text("fund_name_kana"),
  // category: text("category"), // DBに存在しないためコメントアウト
  specificPeriod1: text("specific_period1"),
  specificPeriod2: text("specific_period2"),
  edinetCode: text("edinet_code"),
  issuerName: text("issuer_name"),
});

// 閲覧履歴テーブル
export const viewHistory = sqliteTable(
  "view_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // ユーザー識別 (どちらか一方が値を持つ)
    userId: text("user_id"), // ログインユーザーの ID
    guestId: text("guest_id"), // 匿名ユーザー用の UUID (Cookie 管理)
    // ターゲット情報
    targetType: text("target_type", { enum: ["entity", "fund"] }).notNull(), // 'entity' (企業) または 'fund' (ファンド)
    targetCode: text("target_code").notNull(), // edinet_code または fund_code
    // 記録時刻 (TEXT 形式：YYYY-MM-DD HH:MM:SS.SSS)
    viewedAt: text("viewed_at").notNull(),
  },
  (table) => ({
    // インデックス定義
    idxUserGuest: index("idx_view_history_user_guest").on(
      table.userId,
      table.guestId,
    ),
    idxViewedAt: index("idx_view_history_viewed_at").on(table.viewedAt),
    idxTarget: index("idx_view_history_target").on(
      table.targetType,
      table.targetCode,
    ),
  }),
);
