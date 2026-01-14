/**
 * Artifact Storage Adapter Interface
 * 各種ストレージバックエンドを抽象化
 */

export interface ArtifactStorageAdapter {
  /**
   * Artifactを取得
   * @param key - 識別子（例: "municipalities/tokyo/artifact.json"）
   * @returns ArtifactのJSON文字列、存在しない場合はnull
   */
  get(key: string): Promise<string | null>;

  /**
   * Artifactを保存
   * @param key - 識別子
   * @param data - ArtifactのJSON文字列
   */
  put(key: string, data: string): Promise<void>;

  /**
   * Artifactが存在するか確認
   * @param key - 識別子
   */
  exists(key: string): Promise<boolean>;

  /**
   * Artifactを削除
   * @param key - 識別子
   */
  delete(key: string): Promise<void>;

  /**
   * キー一覧を取得
   * @param prefix - 検索プレフィックス（例: "municipalities/"）
   */
  list(prefix: string): Promise<string[]>;
}

export interface StorageConfig {
  type: "local" | "s3" | "gcs" | "r2";
  bucket?: string;
  region?: string;
  endpoint?: string;
  basePath?: string;
}
