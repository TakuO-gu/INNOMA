import type { ArtifactStorageAdapter, StorageConfig } from "./types";
import { LocalStorageAdapter } from "./local-adapter";
import { S3StorageAdapter } from "./s3-adapter";

export type { ArtifactStorageAdapter, StorageConfig } from "./types";
export { LocalStorageAdapter } from "./local-adapter";
export { S3StorageAdapter } from "./s3-adapter";

/**
 * 環境変数からストレージアダプタを生成
 */
export function createStorageAdapter(config?: StorageConfig): ArtifactStorageAdapter {
  const storageType = config?.type || process.env.ARTIFACT_STORAGE_TYPE || "local";

  switch (storageType) {
    case "s3":
    case "r2":
      return new S3StorageAdapter({
        bucket: config?.bucket || process.env.ARTIFACT_STORAGE_BUCKET || "",
        region: config?.region || process.env.ARTIFACT_STORAGE_REGION || "auto",
        endpoint: config?.endpoint || process.env.ARTIFACT_STORAGE_ENDPOINT,
      });

    case "gcs":
      // GCS用アダプタは必要に応じて実装
      throw new Error("GCS adapter not implemented yet");

    case "local":
    default:
      return new LocalStorageAdapter(
        config?.basePath || process.env.ARTIFACT_STORAGE_PATH || "./data/artifacts"
      );
  }
}

// デフォルトアダプタのシングルトン
let defaultAdapter: ArtifactStorageAdapter | null = null;

export function getDefaultStorageAdapter(): ArtifactStorageAdapter {
  if (!defaultAdapter) {
    defaultAdapter = createStorageAdapter();
  }
  return defaultAdapter;
}
