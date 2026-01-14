/**
 * Artifact Logger
 *
 * 監視要件:
 *   - artifact load 失敗（404/timeout）をログで必ず拾う
 *   - schema parse 失敗をログで必ず拾う
 *   - 日次でエラー件数が見える形にする
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  data?: Record<string, unknown>;
}

// ログエントリのカウンター（日次集計用）
const errorCounts: Map<string, number> = new Map();
let lastResetDate = new Date().toISOString().slice(0, 10);

function resetCountsIfNewDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastResetDate) {
    errorCounts.clear();
    lastResetDate = today;
  }
}

function incrementErrorCount(event: string): void {
  resetCountsIfNewDay();
  const current = errorCounts.get(event) || 0;
  errorCounts.set(event, current + 1);
}

function formatLogEntry(entry: LogEntry): string {
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [artifact] ${entry.event}${dataStr}`;
}

function log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data,
  };

  // エラー系イベントはカウント
  if (level === "error" || level === "warn") {
    incrementErrorCount(event);
  }

  // 構造化ログとして出力
  const formatted = formatLogEntry(entry);

  switch (level) {
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formatted);
      }
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

/**
 * Artifact専用ロガー
 */
export const artifactLogger = {
  debug: (event: string, data?: Record<string, unknown>) => log("debug", event, data),
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),

  /**
   * 日次エラー統計を取得
   */
  getErrorStats(): Record<string, number> {
    resetCountsIfNewDay();
    return Object.fromEntries(errorCounts.entries());
  },

  /**
   * エラー統計をリセット
   */
  resetStats(): void {
    errorCounts.clear();
  },
};

/**
 * ロードエラー専用のログ関数
 */
export function logLoadError(
  key: string,
  errorType: "not_found" | "invalid_json" | "validation_failed" | "timeout" | "unknown",
  details?: string
): void {
  artifactLogger.error("load_error", {
    key,
    errorType,
    details,
  });
}

/**
 * バリデーションエラー専用のログ関数
 */
export function logValidationError(
  key: string,
  issues: Array<{ path: string; message: string }>
): void {
  artifactLogger.error("validation_error", {
    key,
    issueCount: issues.length,
    issues: issues.slice(0, 5), // 最初の5件のみ
  });
}
