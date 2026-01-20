/**
 * INNOMA Pipeline
 * 自治体情報取得のワークフローを統合実行
 */

import { cloneTemplate } from '../template/clone';
import { getMunicipalityMeta, updateVariableStore, getVariableStore } from '../template/storage';
import { fetchServiceVariables } from '../llm/fetcher';
import { serviceDefinitions } from '../llm/variable-priority';
import { createDraft, getDraft, updateDraftStatus } from '../drafts/storage';
import { isConcreteValue } from '../llm/deep-search';
import type {
  PipelineConfig,
  PipelineResult,
  StepResult,
  PipelineEvent,
  PipelineEventHandler,
  FreeTierLimits,
} from './types';
import { CONSERVATIVE_FREE_TIER_LIMITS } from './types';

/**
 * パイプラインのデフォルト設定
 */
const DEFAULT_CONFIG: Partial<PipelineConfig> = {
  autoApprove: false,
  autoApproveThreshold: 0.8,
  enableDeepSearch: true,
  maxRetries: 2,
  dryRun: false,
  freeTierMode: false,
};

/**
 * API使用量トラッカー
 */
interface ApiUsageTracker {
  googleSearchQueries: number;
  geminiRequests: number;
  visionRequests: number;
  lastMinuteGeminiRequests: number;
  lastMinuteTimestamp: number;
}

/**
 * INNOMAパイプライン
 */
export class Pipeline {
  private config: PipelineConfig;
  private result: PipelineResult;
  private eventHandlers: PipelineEventHandler[] = [];
  private aborted = false;
  private freeTierLimits: FreeTierLimits;
  private apiUsage: ApiUsageTracker;

  constructor(config: PipelineConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 無料枠制限を設定
    this.freeTierLimits = {
      ...CONSERVATIVE_FREE_TIER_LIMITS,
      ...(config.freeTierLimits || {}),
    };

    // API使用量トラッカーを初期化
    this.apiUsage = {
      googleSearchQueries: 0,
      geminiRequests: 0,
      visionRequests: 0,
      lastMinuteGeminiRequests: 0,
      lastMinuteTimestamp: Date.now(),
    };

    const id = `pipeline-${config.municipalityId}-${Date.now()}`;
    this.result = {
      id,
      config: this.config,
      status: 'pending',
      startedAt: new Date().toISOString(),
      steps: [],
      summary: {
        totalVariables: 0,
        fetchedVariables: 0,
        appliedVariables: 0,
        errors: 0,
        warnings: 0,
      },
    };
  }

  /**
   * 無料枠モードが有効かつAPI制限に達したかチェック
   */
  private isFreeTierLimitReached(apiType: 'search' | 'gemini' | 'vision'): boolean {
    if (!this.config.freeTierMode) return false;

    switch (apiType) {
      case 'search':
        return this.apiUsage.googleSearchQueries >= this.freeTierLimits.googleSearchQueries;
      case 'gemini':
        // 1日の制限チェック
        if (this.apiUsage.geminiRequests >= this.freeTierLimits.geminiRequestsPerDay) {
          return true;
        }
        // 1分あたりの制限チェック（リセット）
        const now = Date.now();
        if (now - this.apiUsage.lastMinuteTimestamp > 60000) {
          this.apiUsage.lastMinuteGeminiRequests = 0;
          this.apiUsage.lastMinuteTimestamp = now;
        }
        return this.apiUsage.lastMinuteGeminiRequests >= this.freeTierLimits.geminiRequestsPerMinute;
      case 'vision':
        return this.apiUsage.visionRequests >= this.freeTierLimits.visionRequestsPerMonth;
      default:
        return false;
    }
  }

  /**
   * API使用量を記録
   */
  private recordApiUsage(apiType: 'search' | 'gemini' | 'vision', count: number = 1): void {
    switch (apiType) {
      case 'search':
        this.apiUsage.googleSearchQueries += count;
        break;
      case 'gemini':
        this.apiUsage.geminiRequests += count;
        this.apiUsage.lastMinuteGeminiRequests += count;
        break;
      case 'vision':
        this.apiUsage.visionRequests += count;
        break;
    }
  }

  /**
   * 無料枠モードでのサービス数制限を取得
   */
  private getMaxServicesForFreeTier(): number {
    if (!this.config.freeTierMode) return Infinity;
    // 検索クエリ数からサービス数を計算（各サービス1クエリ想定）
    return this.freeTierLimits.googleSearchQueries;
  }

  /**
   * 無料枠モードでのページ取得数制限を取得
   */
  private getMaxPagesPerService(): number {
    if (!this.config.freeTierMode) return 3; // デフォルト
    return this.freeTierLimits.maxPagesPerService;
  }

  /**
   * API使用量のサマリーを取得
   */
  getApiUsageSummary(): { usage: ApiUsageTracker; limits: FreeTierLimits; freeTierMode: boolean } {
    return {
      usage: { ...this.apiUsage },
      limits: { ...this.freeTierLimits },
      freeTierMode: !!this.config.freeTierMode,
    };
  }

  /**
   * イベントハンドラを登録
   */
  onEvent(handler: PipelineEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * イベントを発火
   */
  private emit(event: Omit<PipelineEvent, 'timestamp'>): void {
    const fullEvent: PipelineEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    for (const handler of this.eventHandlers) {
      try {
        handler(fullEvent);
      } catch (e) {
        console.error('Event handler error:', e);
      }
    }
  }

  /**
   * ステップの開始をログ
   */
  private logStepStart(step: string, message: string): void {
    this.emit({
      type: 'step_start',
      step: step as PipelineResult['steps'][0]['step'],
      message,
    });
  }

  /**
   * ステップの完了をログ
   */
  private logStepComplete(result: StepResult): void {
    this.result.steps.push(result);

    if (result.status === 'error') {
      this.result.summary.errors++;
    } else if (result.status === 'warning') {
      this.result.summary.warnings++;
    }

    this.emit({
      type: 'step_complete',
      step: result.step,
      message: result.message,
      data: result.details,
    });
  }

  /**
   * 進捗を更新
   */
  private updateProgress(progress: number, message: string): void {
    this.emit({
      type: 'progress',
      progress,
      message,
    });
  }

  /**
   * パイプラインを中断
   */
  abort(): void {
    this.aborted = true;
    this.result.status = 'paused';
  }

  /**
   * パイプラインを実行
   */
  async run(): Promise<PipelineResult> {
    this.result.status = 'running';
    this.emit({ type: 'step_start', message: 'パイプラインを開始します' });

    try {
      // Step 1: 自治体の作成または確認
      await this.stepCreate();
      if (this.aborted) return this.finalize();

      // Step 2: 情報取得
      await this.stepFetch();
      if (this.aborted) return this.finalize();

      // Step 3: 下書き確認
      await this.stepReview();
      if (this.aborted) return this.finalize();

      // Step 4: 変数適用
      await this.stepApply();
      if (this.aborted) return this.finalize();

      // Step 5: 検証
      await this.stepValidate();

      this.result.status = 'completed';
    } catch (error) {
      this.result.status = 'failed';
      this.logStepComplete({
        step: 'validate',
        status: 'error',
        message: `パイプラインエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return this.finalize();
  }

  /**
   * 結果をファイナライズ
   */
  private finalize(): PipelineResult {
    this.result.completedAt = new Date().toISOString();

    this.emit({
      type: 'complete',
      message: `パイプライン完了: ${this.result.status}`,
      data: this.result.summary,
    });

    return this.result;
  }

  /**
   * Step 1: 自治体の作成
   */
  private async stepCreate(): Promise<void> {
    const startTime = Date.now();
    this.logStepStart('create', `自治体「${this.config.municipalityName}」を確認中...`);

    try {
      // 既存の自治体を確認
      const existing = await getMunicipalityMeta(this.config.municipalityId);

      if (existing) {
        this.logStepComplete({
          step: 'create',
          status: 'success',
          message: `既存の自治体を使用: ${existing.name}`,
          details: { id: existing.id, name: existing.name },
          duration: Date.now() - startTime,
        });
        return;
      }

      if (this.config.dryRun) {
        this.logStepComplete({
          step: 'create',
          status: 'skipped',
          message: 'ドライラン: 自治体作成をスキップ',
          duration: Date.now() - startTime,
        });
        return;
      }

      // 新規作成
      const meta = await cloneTemplate({
        id: this.config.municipalityId,
        name: this.config.municipalityName,
        prefecture: this.config.prefecture,
        officialUrl: this.config.officialUrl,
      });

      this.logStepComplete({
        step: 'create',
        status: 'success',
        message: `自治体を作成: ${meta.name}`,
        details: { id: meta.id, name: meta.name },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logStepComplete({
        step: 'create',
        status: 'error',
        message: `自治体作成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Step 2: 情報取得
   */
  private async stepFetch(): Promise<void> {
    const startTime = Date.now();
    this.logStepStart('fetch', '情報を取得中...');

    let servicesToFetch = this.config.services ||
      serviceDefinitions.map(s => s.id);

    // 無料枠モードの場合、サービス数を制限
    if (this.config.freeTierMode) {
      const maxServices = this.getMaxServicesForFreeTier();
      if (servicesToFetch.length > maxServices) {
        this.emit({
          type: 'progress',
          message: `無料枠モード: サービス数を${maxServices}件に制限`,
        });
        servicesToFetch = servicesToFetch.slice(0, maxServices);
      }
    }

    let fetchedCount = 0;
    let totalVars = 0;
    let skippedServices = 0;

    for (let i = 0; i < servicesToFetch.length; i++) {
      if (this.aborted) return;

      // 無料枠モードでAPI制限に達した場合はスキップ
      if (this.config.freeTierMode) {
        if (this.isFreeTierLimitReached('search')) {
          this.emit({
            type: 'progress',
            message: `無料枠制限: 検索API制限に達したため残りのサービスをスキップ`,
          });
          skippedServices = servicesToFetch.length - i;
          break;
        }
        if (this.isFreeTierLimitReached('gemini')) {
          this.emit({
            type: 'progress',
            message: `無料枠制限: Gemini API制限に達したため残りのサービスをスキップ`,
          });
          skippedServices = servicesToFetch.length - i;
          break;
        }
      }

      const serviceId = servicesToFetch[i];
      const service = serviceDefinitions.find(s => s.id === serviceId);
      const serviceName = service?.nameJa || serviceId;

      this.updateProgress(
        Math.round((i / servicesToFetch.length) * 100),
        `${serviceName}の情報を取得中...`
      );

      try {
        // API使用量を記録（検索1回 + Gemini複数回の見積もり）
        this.recordApiUsage('search', 1);
        // Gemini: スニペット抽出1回 + ページ抽出最大3回 + 深堀り検索
        this.recordApiUsage('gemini', 5);

        const result = await fetchServiceVariables(
          this.config.municipalityName,
          serviceId,
          this.config.officialUrl
        );

        const concreteVars = result.variables.filter(
          v => v.value && isConcreteValue(v.variableName, v.value)
        );

        fetchedCount += concreteVars.length;
        totalVars += service?.variables.length || 0;

        // 下書きを作成
        if (!this.config.dryRun && concreteVars.length > 0) {
          const draftVars: Record<string, {
            value: string;
            sourceUrl: string;
            confidence: number;
            extractedAt: string;
            validated: boolean;
          }> = {};

          for (const v of concreteVars) {
            draftVars[v.variableName] = {
              value: v.value!,
              sourceUrl: v.sourceUrl,
              confidence: v.confidence,
              extractedAt: v.extractedAt,
              validated: true,
            };
          }

          const missingVars = (service?.variables || []).filter(
            name => !concreteVars.some(v => v.variableName === name)
          );

          await createDraft(
            this.config.municipalityId,
            serviceId,
            draftVars,
            missingVars,
            result.errors
          );
        }

        // レート制限（無料枠モードでは長めに待機）
        if (i < servicesToFetch.length - 1) {
          const waitTime = this.config.freeTierMode ? 2000 : 1000;
          await new Promise(r => setTimeout(r, waitTime));
        }
      } catch (error) {
        console.error(`Service ${serviceId} fetch error:`, error);
        this.result.summary.errors++;
      }
    }

    this.result.summary.totalVariables = totalVars;
    this.result.summary.fetchedVariables = fetchedCount;

    // 完了メッセージにAPI使用状況を含める
    const statusMessage = this.config.freeTierMode
      ? `${fetchedCount}/${totalVars}個の変数を取得 (API: 検索${this.apiUsage.googleSearchQueries}回, Gemini${this.apiUsage.geminiRequests}回${skippedServices > 0 ? `, ${skippedServices}サービスをスキップ` : ''})`
      : `${fetchedCount}/${totalVars}個の変数を取得`;

    this.logStepComplete({
      step: 'fetch',
      status: fetchedCount > 0 ? 'success' : 'warning',
      message: statusMessage,
      details: {
        fetched: fetchedCount,
        total: totalVars,
        ...(this.config.freeTierMode && {
          apiUsage: {
            searchQueries: this.apiUsage.googleSearchQueries,
            geminiRequests: this.apiUsage.geminiRequests,
          },
          skippedServices,
        }),
      },
      duration: Date.now() - startTime,
    });
  }

  /**
   * Step 3: 下書き確認
   */
  private async stepReview(): Promise<void> {
    const startTime = Date.now();
    this.logStepStart('review', '下書きを確認中...');

    const servicesToReview = this.config.services ||
      serviceDefinitions.map(s => s.id);

    let reviewedCount = 0;
    let autoApprovedCount = 0;

    for (const serviceId of servicesToReview) {
      const draft = await getDraft(this.config.municipalityId, serviceId);
      if (!draft) continue;

      reviewedCount++;

      // 自動承認が有効な場合
      if (this.config.autoApprove && !this.config.dryRun) {
        const threshold = this.config.autoApproveThreshold || 0.8;
        const highConfidenceVars = Object.entries(draft.variables).filter(
          ([, v]) => v.confidence >= threshold
        );

        if (highConfidenceVars.length > 0) {
          await updateDraftStatus(
            this.config.municipalityId,
            serviceId,
            'approved',
            { autoApproved: true, approvedAt: new Date().toISOString() }
          );
          autoApprovedCount++;
        } else {
          await updateDraftStatus(
            this.config.municipalityId,
            serviceId,
            'pending_review'
          );
        }
      } else {
        await updateDraftStatus(
          this.config.municipalityId,
          serviceId,
          'pending_review'
        );
      }
    }

    this.logStepComplete({
      step: 'review',
      status: 'success',
      message: `${reviewedCount}件の下書きを確認（${autoApprovedCount}件自動承認）`,
      details: { reviewed: reviewedCount, autoApproved: autoApprovedCount },
      duration: Date.now() - startTime,
    });
  }

  /**
   * Step 4: 変数適用
   */
  private async stepApply(): Promise<void> {
    const startTime = Date.now();
    this.logStepStart('apply', '変数を適用中...');

    if (this.config.dryRun) {
      this.logStepComplete({
        step: 'apply',
        status: 'skipped',
        message: 'ドライラン: 変数適用をスキップ',
        duration: Date.now() - startTime,
      });
      return;
    }

    const servicesToApply = this.config.services ||
      serviceDefinitions.map(s => s.id);

    let appliedCount = 0;
    const _currentStore = await getVariableStore(this.config.municipalityId);

    for (const serviceId of servicesToApply) {
      const draft = await getDraft(this.config.municipalityId, serviceId);
      if (!draft || draft.status !== 'approved') continue;

      const updates: Record<string, {
        value: string;
        source: 'llm';
        sourceUrl?: string;
        confidence?: number;
        updatedAt: string;
      }> = {};

      for (const [name, entry] of Object.entries(draft.variables)) {
        // 自動承認の場合は閾値以上のもののみ適用
        if (this.config.autoApprove) {
          const threshold = this.config.autoApproveThreshold || 0.8;
          if (entry.confidence < threshold) continue;
        }

        updates[name] = {
          value: entry.value,
          source: 'llm',
          sourceUrl: entry.sourceUrl,
          confidence: entry.confidence,
          updatedAt: new Date().toISOString(),
        };
        appliedCount++;
      }

      if (Object.keys(updates).length > 0) {
        await updateVariableStore(this.config.municipalityId, updates);
      }
    }

    this.result.summary.appliedVariables = appliedCount;

    this.logStepComplete({
      step: 'apply',
      status: appliedCount > 0 ? 'success' : 'warning',
      message: `${appliedCount}個の変数を適用`,
      details: { applied: appliedCount },
      duration: Date.now() - startTime,
    });
  }

  /**
   * Step 5: 検証
   */
  private async stepValidate(): Promise<void> {
    const startTime = Date.now();
    this.logStepStart('validate', '結果を検証中...');

    const store = await getVariableStore(this.config.municipalityId);
    const filledCount = Object.values(store).filter(
      v => v.value && v.value.trim() !== ''
    ).length;

    this.logStepComplete({
      step: 'validate',
      status: 'success',
      message: `検証完了: ${filledCount}個の変数が設定済み`,
      details: { filled: filledCount },
      duration: Date.now() - startTime,
    });
  }
}

/**
 * 簡易実行関数
 */
export async function runPipeline(
  config: PipelineConfig,
  onEvent?: PipelineEventHandler
): Promise<PipelineResult> {
  const pipeline = new Pipeline(config);

  if (onEvent) {
    pipeline.onEvent(onEvent);
  }

  return pipeline.run();
}
