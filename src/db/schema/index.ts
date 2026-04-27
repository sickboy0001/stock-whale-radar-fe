import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  imageUrl: text("image_url"),
  googleId: text("google_id").unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(true),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
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
  listedCategory: text("listed_category"),
  isConsolidated: text("is_consolidated"),
  capital: integer("capital"),
  fiscalYearEnd: text("fiscal_year_end"),
  submitterName: text("submitter_name").notNull(),
  submitterNameEn: text("submitter_name_en"),
  submitterNameKana: text("submitter_name_kana"),
  address: text("address"),
  industry: text("industry"),
  secCode: text("sec_code"),
  corporateNumber: text("corporate_number"),
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
