/**
 * テンプレートシステム 型定義
 *
 * 自治体サイト生成のためのテンプレート複製・変数置換に関する型定義
 */

/**
 * 変数のソース（どこから取得したか）
 */
export type VariableSource = "manual" | "llm" | "default";

/**
 * 変数の値と関連メタデータ
 */
export interface VariableValue {
  /** 変数の値 */
  value: string;
  /** 値のソース */
  source: VariableSource;
  /** 取得元URL（LLMの場合） */
  sourceUrl?: string;
  /** 信頼度（0-1、LLMの場合） */
  confidence?: number;
  /** 最終更新日時 */
  updatedAt: string;

  // ソース変更検知用
  /** ソースURLのコンテンツハッシュ（SHA-256） */
  sourceContentHash?: string;
  /** 最後にソースを確認した日時 */
  lastSourceCheckAt?: string;
  /** ソースが変更されたか（レビュー待ち） */
  sourceChanged?: boolean;
  /** 変更が検出された日時 */
  sourceChangedAt?: string;
}

/**
 * 自治体の変数ストア
 * data/artifacts/{municipality}/variables.json の構造
 */
export interface VariableStore {
  [variableName: string]: VariableValue;
}

/**
 * 自治体のメタデータ
 * data/artifacts/{municipality}/meta.json の構造
 */
export interface MunicipalityMeta {
  /** 自治体ID（URLスラッグ） */
  id: string;
  /** 自治体名 */
  name: string;
  /** 都道府県 */
  prefecture: string;
  /** 公式サイトURL */
  officialUrl?: string;
  /** 作成日時 */
  createdAt: string;
  /** 最終更新日時 */
  updatedAt: string;
  /** 最終LLM取得日時 */
  lastFetchAt?: string;
  /** ステータス */
  status: MunicipalityStatus;
  /** 設定 */
  settings: MunicipalitySettings;
}

/**
 * 自治体のステータス
 */
export type MunicipalityStatus =
  | "draft" // 作成中（テンプレート複製直後）
  | "fetching" // LLM情報取得中
  | "pending_review" // 下書きレビュー待ち
  | "published" // 公開中
  | "error"; // エラー

/**
 * ソースチェック間隔
 */
export type SourceCheckInterval = "disabled" | "daily" | "weekly" | "monthly";

/**
 * 自治体の設定
 */
export interface MunicipalitySettings {
  /** 自動公開モード（LLM取得結果を承認なしで公開） */
  autoPublish: boolean;
  /** 取得間隔 */
  fetchInterval: "manual" | "daily" | "weekly" | "monthly";
  /** ソース変更チェック間隔（デフォルト: weekly） */
  sourceCheckInterval?: SourceCheckInterval;
}

/**
 * 自治体追加時の入力データ
 */
export interface CreateMunicipalityInput {
  /** 自治体ID（URLスラッグ、英数字とハイフンのみ） */
  id: string;
  /** 自治体名 */
  name: string;
  /** 都道府県 */
  prefecture: string;
  /** 公式サイトURL */
  officialUrl?: string;
  /** 作成後すぐにLLM取得を開始するか */
  startFetch?: boolean;
}

/**
 * 自治体一覧表示用のデータ
 */
export interface MunicipalitySummary {
  id: string;
  name: string;
  prefecture: string;
  status: MunicipalityStatus;
  updatedAt: string;
  /** 変数の統計 */
  variableStats: {
    /** 全変数数 */
    total: number;
    /** 設定済み変数数 */
    filled: number;
    /** 未設定変数数 */
    missing: number;
  };
  /** 未承認の下書き数 */
  pendingDrafts: number;
  /** ページ数 */
  pageCount: number;
}

/**
 * テンプレート複製のオプション
 */
export interface CloneTemplateOptions {
  /** ソーステンプレートのパス（省略時は_templates/sample） */
  sourceTemplate?: string;
  /** 初期変数値 */
  initialVariables?: Record<string, string>;
}

/**
 * 変数置換の結果
 */
export interface ReplaceResult {
  /** 置換後のコンテンツ */
  content: string;
  /** 置換された変数名のリスト */
  replacedVariables: string[];
  /** 未置換の変数名のリスト（値がなかった変数） */
  unreplacedVariables: string[];
}

/**
 * テンプレート内で見つかった変数の情報
 */
export interface FoundVariable {
  /** 変数名 */
  name: string;
  /** 発見されたファイル */
  files: string[];
  /** 出現回数 */
  count: number;
}

/**
 * 都道府県リスト
 */
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];
