import { z } from 'zod';

/**
 * LocalGov Drupal CMS 構造に基づくスキーマ定義
 *
 * 参考: LocalGov Drupal Docs
 * https://docs.localgovdrupal.org/
 */

/**
 * Service page（手続きを "1画面で完結" させるページ）
 *
 * 主な用途:
 * - 1つのユーザーニーズやタスク（例：ごみ収集日の確認、料金の支払い）
 * - 「短い説明＋オンラインフォームへのリンク」でまとめる
 *
 * 構造:
 * ① タイトル/要約 → ② 本文（見出しで区切る） → ③ Task button (CTA) → ④ サイドバーに Related links・topics
 */
export const ServicePageSchema = z.object({
  type: z.literal('service').describe('ページタイプ: service'),

  // ① タイトル/要約
  title: z.string().describe('タイトル: そのページで出来ることを明文化'),
  summary: z.string().describe('要約: ユーザーニーズを端的に説明（1-2段落）'),

  // ② 本文
  sections: z.array(z.object({
    heading: z.string().describe('見出し'),
    content: z.string().describe('本文'),
  })).describe('本文セクション（見出しで区切る）'),

  // ③ Task button (CTA)
  primaryTask: z.object({
    label: z.string().describe('CTAボタンのラベル（例：「申請する」「確認する」）'),
    url: z.string().url().describe('タスクURL（オンラインフォームなど）'),
    isTopTask: z.boolean().optional().describe('重要タスクかどうか（色分け表示）'),
  }).describe('メインタスクボタン（目立つCTAは1つだけ）'),

  // ④ Related links・topics
  relatedLinks: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
  })).optional().describe('関連リンク・トピック（サイドバー）'),

  // メタデータ
  category: z.string().describe('カテゴリ（住民票、税金、福祉等）'),
  targetAudience: z.string().optional().describe('対象者'),
  url: z.string().url().describe('ページURL'),
});

export type ServicePage = z.infer<typeof ServicePageSchema>;

/**
 * Guide page（"まとまった情報束" を順不同で読ませるページ）
 *
 * 主な用途:
 * - 同じテーマ内で複数ページをまとめ、読む順番は固定しない
 * - 例：動物取扱い許可の種類、出生届の変更手続き一覧
 *
 * 構造:
 * - Guide Landing（概要）＋子ページ群
 * - 各ページ下部の Next/Previous ボタン、または縦型の目次一覧で横断
 */
export const GuidePageSchema = z.object({
  type: z.literal('guide').describe('ページタイプ: guide'),

  // Guide Landing
  title: z.string().describe('ガイドタイトル'),
  overview: z.string().describe('概要説明'),

  // 子ページ群
  pages: z.array(z.object({
    title: z.string().describe('子ページタイトル'),
    summary: z.string().describe('子ページ要約'),
    content: z.string().describe('子ページ本文'),
    url: z.string().url().describe('子ページURL'),
  })).describe('子ページ群（読む順番は固定しない）'),

  // ナビゲーション設定
  enableStackedHeadings: z.boolean().optional().describe('Stacked headings を有効化（長文の場合）'),
  showTableOfContents: z.boolean().optional().describe('縦型目次一覧を表示'),

  // メタデータ
  category: z.string().describe('カテゴリ'),
  url: z.string().url().describe('ランディングページURL'),
});

export type GuidePage = z.infer<typeof GuidePageSchema>;

/**
 * Step-by-step page（"順番どおりに進む" プロセス専用ページ）
 *
 * 主な用途:
 * - 明確な開始点と終了点があり、タスクを決まった順序で完了する必要がある手続き
 * - 例：死亡届の提出、ビザ申請、パスワードリセット
 *
 * 構造:
 * ① 短いイントロ（3-4行以内） → ② 番号付き Step リスト → ③ 各 Task へのリンク（費用があれば金額を併記）
 */
export const StepByStepPageSchema = z.object({
  type: z.literal('step-by-step').describe('ページタイプ: step-by-step'),

  // ① イントロ
  title: z.string().describe('タイトル（"Step by step" を含めて意図を明確化）'),
  introduction: z.string().max(500).describe('短いイントロ（3-4行以内、モバイルですぐ見せる）'),

  // ② 番号付き Step リスト
  steps: z.array(z.object({
    stepNumber: z.number().describe('ステップ番号（自動読み上げ対応）'),
    title: z.string().describe('ステップタイトル'),
    description: z.string().describe('ステップ説明'),

    // ③ 各 Task へのリンク
    tasks: z.array(z.object({
      title: z.string().describe('タスク名'),
      url: z.string().url().describe('タスクURL'),
      fee: z.string().optional().describe('費用（金額を併記）'),
      estimatedTime: z.string().optional().describe('所要時間'),
    })),

    // and/or ステップ（ネスト）
    alternativeSteps: z.array(z.object({
      title: z.string(),
      description: z.string(),
      tasks: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
      })),
    })).optional().describe('代替ステップ（<h3>階層でネスト、スクリーンリーダーに区別）'),
  })).describe('ステップリスト（順番どおりに進む）'),

  // メタデータ
  totalSteps: z.number().describe('総ステップ数'),
  estimatedDuration: z.string().optional().describe('全体の所要時間'),
  category: z.string().describe('カテゴリ'),
  url: z.string().url().describe('ページURL'),
});

export type StepByStepPage = z.infer<typeof StepByStepPageSchema>;

/**
 * 統合されたLocalGovページ（いずれか1つ）
 */
export const LocalGovPageSchema = z.discriminatedUnion('type', [
  ServicePageSchema,
  GuidePageSchema,
  StepByStepPageSchema,
]);

export type LocalGovPage = z.infer<typeof LocalGovPageSchema>;

/**
 * 自治体全体の構造化データ（LocalGov準拠）
 */
export const LocalGovStructuredDataSchema = z.object({
  metadata: z.object({
    municipality: z.string().describe('自治体名'),
    prefecture: z.string().optional().describe('都道府県名'),
    sourceUrl: z.string().url().describe('元のURL'),
    extractedAt: z.string().describe('抽出日時（ISO 8601形式）'),
    confidence: z.number().min(0).max(1).describe('抽出の信頼度（0-1）'),
    llmModel: z.string().describe('使用したLLMモデル'),
    processingTimeMs: z.number().optional().describe('処理時間（ミリ秒）'),
  }),

  // LocalGovページ群
  pages: z.array(LocalGovPageSchema).describe('Service/Guide/Step-by-stepページ群'),

  // 緊急情報（全ページタイプ共通）
  emergencyAlerts: z.array(z.object({
    title: z.string(),
    content: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    publishedAt: z.string(),
    url: z.string().url().optional(),
  })).optional().describe('緊急アラート'),

  // サイト全体の連絡先
  contacts: z.array(z.object({
    department: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    hours: z.string().optional(),
  })).optional().describe('連絡先一覧'),
});

export type LocalGovStructuredData = z.infer<typeof LocalGovStructuredDataSchema>;

/**
 * 使い分けガイド
 */
export const PAGE_TYPE_GUIDE = {
  service: {
    example: '「粗大ごみを申し込む」をオンラインフォームに誘導',
    when: '1つのユーザーニーズやタスクを1画面で完結させる',
    structure: 'タイトル/要約 → 本文 → Task button (CTA) → Related links',
  },
  guide: {
    example: '「介護保険に関する情報を一通り学びたい」',
    when: 'まとまった情報束を順不同で読ませる',
    structure: 'Guide Landing（概要）＋子ページ群、Next/Previousボタン',
  },
  'step-by-step': {
    example: '「出生届を提出する手順を順番に案内」',
    when: '明確な開始点と終了点があり、決まった順序で完了する必要がある',
    structure: 'イントロ → 番号付きStepリスト → 各Taskへのリンク',
  },
} as const;