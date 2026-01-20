/**
 * Pipeline Types
 * パイプラインの型定義
 */

/**
 * パイプラインのステップ
 */
export type PipelineStep =
  | 'create'      // 自治体を作成
  | 'fetch'       // 情報取得
  | 'review'      // 下書き確認
  | 'apply'       // 変数適用
  | 'validate'    // 検証
  | 'publish';    // 公開

/**
 * パイプラインの実行状態
 */
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

/**
 * サービス取得の設定
 */
export interface ServiceFetchConfig {
  serviceId: string;
  priority: 'high' | 'normal' | 'low';
  maxRetries?: number;
}

/**
 * API無料枠の制限設定
 */
export interface FreeTierLimits {
  /** Google Custom Search API: 1日100クエリ無料 */
  googleSearchQueries: number;
  /** Gemini API: 1分あたり15リクエスト、1日1500リクエスト無料 */
  geminiRequestsPerMinute: number;
  geminiRequestsPerDay: number;
  /** Google Vision API: 1か月1000リクエスト無料 */
  visionRequestsPerMonth: number;
  /** ページ取得数の上限 */
  maxPagesPerService: number;
}

/**
 * デフォルトの無料枠制限
 */
export const DEFAULT_FREE_TIER_LIMITS: FreeTierLimits = {
  googleSearchQueries: 100,        // 1日100クエリ
  geminiRequestsPerMinute: 15,     // 1分15リクエスト
  geminiRequestsPerDay: 1500,      // 1日1500リクエスト
  visionRequestsPerMonth: 1000,    // 1か月1000リクエスト
  maxPagesPerService: 2,           // サービスあたり2ページまで
};

/**
 * 保守的な無料枠制限（安全マージン付き）
 */
export const CONSERVATIVE_FREE_TIER_LIMITS: FreeTierLimits = {
  googleSearchQueries: 10,         // 1日10クエリまで（10%使用）
  geminiRequestsPerMinute: 5,      // 1分5リクエストまで
  geminiRequestsPerDay: 50,        // 1日50リクエストまで
  visionRequestsPerMonth: 10,      // 1か月10リクエストまで
  maxPagesPerService: 1,           // サービスあたり1ページまで
};

/**
 * パイプラインの設定
 */
export interface PipelineConfig {
  /** 自治体ID */
  municipalityId: string;
  /** 自治体名 */
  municipalityName: string;
  /** 都道府県 */
  prefecture: string;
  /** 公式サイトURL */
  officialUrl?: string;
  /** 取得するサービス（省略時は全サービス） */
  services?: string[];
  /** 自動承認するか（信頼度閾値以上の変数） */
  autoApprove?: boolean;
  /** 自動承認の信頼度閾値 */
  autoApproveThreshold?: number;
  /** 深堀り検索を有効にするか */
  enableDeepSearch?: boolean;
  /** 最大再試行回数 */
  maxRetries?: number;
  /** ドライラン（実際の変更を行わない） */
  dryRun?: boolean;
  /** 無料枠モード（API使用量を制限） */
  freeTierMode?: boolean;
  /** 無料枠の制限設定（freeTierMode有効時に使用） */
  freeTierLimits?: Partial<FreeTierLimits>;
}

/**
 * ステップの実行結果
 */
export interface StepResult {
  step: PipelineStep;
  status: 'success' | 'warning' | 'error' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

/**
 * パイプラインの実行結果
 */
export interface PipelineResult {
  /** パイプラインID */
  id: string;
  /** 設定 */
  config: PipelineConfig;
  /** ステータス */
  status: PipelineStatus;
  /** 開始時刻 */
  startedAt: string;
  /** 終了時刻 */
  completedAt?: string;
  /** 各ステップの結果 */
  steps: StepResult[];
  /** サマリー */
  summary: {
    totalVariables: number;
    fetchedVariables: number;
    appliedVariables: number;
    errors: number;
    warnings: number;
  };
}

/**
 * パイプラインのイベント
 */
export interface PipelineEvent {
  type: 'step_start' | 'step_complete' | 'progress' | 'error' | 'complete';
  step?: PipelineStep;
  message: string;
  progress?: number;
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * パイプラインのイベントハンドラ
 */
export type PipelineEventHandler = (event: PipelineEvent) => void;
