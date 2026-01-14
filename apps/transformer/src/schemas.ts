import { z } from 'zod';

/**
 * ニュース・お知らせ項目
 */
export const NewsItemSchema = z.object({
  title: z.string().describe('ニュースのタイトル'),
  date: z.string().describe('公開日（YYYY-MM-DD形式）'),
  category: z.string().describe('カテゴリ（お知らせ、重要、プレスリリース等）'),
  importance: z.enum(['high', 'medium', 'low']).describe('重要度'),
  summary: z.string().optional().describe('要約（存在する場合）'),
  content: z.string().describe('本文'),
  url: z.string().url().describe('詳細ページのURL'),
  tags: z.array(z.string()).optional().describe('タグ'),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

/**
 * イベント項目
 */
export const EventItemSchema = z.object({
  title: z.string().describe('イベント名'),
  startDate: z.string().describe('開始日時（YYYY-MM-DD または YYYY-MM-DD HH:MM）'),
  endDate: z.string().optional().describe('終了日時'),
  location: z.string().optional().describe('開催場所'),
  description: z.string().describe('イベント詳細'),
  applicationMethod: z.string().optional().describe('申込方法'),
  applicationDeadline: z.string().optional().describe('申込締切'),
  capacity: z.string().optional().describe('定員'),
  fee: z.string().optional().describe('参加費'),
  contact: z.string().optional().describe('問い合わせ先'),
  url: z.string().url().describe('詳細ページのURL'),
});

export type EventItem = z.infer<typeof EventItemSchema>;

/**
 * 手続き・サービス項目
 */
export const ProcedureItemSchema = z.object({
  title: z.string().describe('手続き・サービス名'),
  category: z.string().describe('カテゴリ（住民票、戸籍、税金、福祉等）'),
  description: z.string().describe('手続きの説明'),
  requiredDocuments: z.array(z.string()).optional().describe('必要書類のリスト'),
  targetAudience: z.string().optional().describe('対象者'),
  window: z.string().optional().describe('受付窓口'),
  hours: z.string().optional().describe('受付時間'),
  onlineAvailable: z.boolean().optional().describe('オンライン対応可否'),
  onlineUrl: z.string().url().optional().describe('オンライン申請URL'),
  fee: z.string().optional().describe('手数料'),
  processingTime: z.string().optional().describe('処理期間'),
  notes: z.string().optional().describe('注意事項'),
  url: z.string().url().describe('詳細ページのURL'),
});

export type ProcedureItem = z.infer<typeof ProcedureItemSchema>;

/**
 * 施設情報
 */
export const FacilityItemSchema = z.object({
  name: z.string().describe('施設名'),
  category: z.string().describe('カテゴリ（公民館、図書館、体育館等）'),
  address: z.string().describe('住所'),
  phone: z.string().optional().describe('電話番号'),
  fax: z.string().optional().describe('FAX番号'),
  email: z.string().email().optional().describe('メールアドレス'),
  openingHours: z.string().optional().describe('開館時間'),
  closedDays: z.string().optional().describe('休館日'),
  access: z.string().optional().describe('アクセス方法'),
  parking: z.string().optional().describe('駐車場情報'),
  barrierFree: z.boolean().optional().describe('バリアフリー対応'),
  url: z.string().url().optional().describe('詳細ページのURL'),
});

export type FacilityItem = z.infer<typeof FacilityItemSchema>;

/**
 * 連絡先情報
 */
export const ContactItemSchema = z.object({
  department: z.string().describe('部署名'),
  phone: z.string().optional().describe('電話番号'),
  fax: z.string().optional().describe('FAX番号'),
  email: z.string().email().optional().describe('メールアドレス'),
  address: z.string().optional().describe('所在地'),
  hours: z.string().optional().describe('対応時間'),
  responsibilities: z.array(z.string()).optional().describe('担当業務'),
});

export type ContactItem = z.infer<typeof ContactItemSchema>;

/**
 * 緊急情報
 */
export const EmergencyItemSchema = z.object({
  type: z.enum(['disaster', 'alert', 'warning', 'evacuation', 'other']).describe('緊急情報の種類'),
  title: z.string().describe('タイトル'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).describe('深刻度'),
  publishedAt: z.string().describe('発表日時'),
  content: z.string().describe('内容'),
  affectedAreas: z.array(z.string()).optional().describe('影響地域'),
  evacuationShelters: z.array(z.string()).optional().describe('避難所リスト'),
  contact: z.string().optional().describe('問い合わせ先'),
  url: z.string().url().optional().describe('詳細URL'),
});

export type EmergencyItem = z.infer<typeof EmergencyItemSchema>;

/**
 * メタデータ
 */
export const MetadataSchema = z.object({
  sourceUrl: z.string().url().describe('元のURL'),
  extractedAt: z.string().describe('抽出日時（ISO 8601形式）'),
  municipality: z.string().describe('自治体名'),
  prefecture: z.string().optional().describe('都道府県名'),
  confidence: z.number().min(0).max(1).describe('抽出の信頼度（0-1）'),
  llmModel: z.string().describe('使用したLLMモデル'),
  processingTimeMs: z.number().optional().describe('処理時間（ミリ秒）'),
});

export type Metadata = z.infer<typeof MetadataSchema>;

/**
 * 構造化された自治体データ全体
 */
export const MunicipalStructuredDataSchema = z.object({
  metadata: MetadataSchema,
  news: z.array(NewsItemSchema).describe('ニュース・お知らせ一覧'),
  events: z.array(EventItemSchema).describe('イベント一覧'),
  procedures: z.array(ProcedureItemSchema).describe('手続き・サービス一覧'),
  facilities: z.array(FacilityItemSchema).describe('施設情報一覧'),
  contacts: z.array(ContactItemSchema).describe('連絡先一覧'),
  emergencyInfo: z.array(EmergencyItemSchema).describe('緊急情報一覧'),
});

export type MunicipalStructuredData = z.infer<typeof MunicipalStructuredDataSchema>;

/**
 * クローラーからの入力データ型
 */
export interface CrawlerOutput {
  url: string;
  metadata?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
  content?: {
    mainText?: string;
    headings?: Array<{ level: number; text: string }>;
    [key: string]: any;
  };
  [key: string]: any;
}