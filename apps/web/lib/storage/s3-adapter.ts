import type { ArtifactStorageAdapter } from "./types";

/**
 * S3互換ストレージ用アダプタ
 * AWS S3, Cloudflare R2, MinIO 等に対応
 */
export class S3StorageAdapter implements ArtifactStorageAdapter {
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(config: {
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region || "auto";
    this.endpoint = config.endpoint;
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "";
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "";
  }

  private getBaseUrl(): string {
    if (this.endpoint) {
      return this.endpoint;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  private async signRequest(
    method: string,
    key: string,
    body?: string
  ): Promise<{ url: string; headers: Record<string, string> }> {
    // 簡易実装：本番ではaws4-signを使用するか、AWS SDKを使用
    const url = `${this.getBaseUrl()}/${key}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 環境変数でIAMロールを使う場合はヘッダー不要
    if (this.accessKeyId && this.secretAccessKey) {
      // 本番では@aws-sdk/client-s3を使用推奨
      // ここでは簡易的にBasic Authスタイルで実装
      headers["Authorization"] = `AWS ${this.accessKeyId}:${this.secretAccessKey}`;
    }

    return { url, headers };
  }

  async get(key: string): Promise<string | null> {
    const { url, headers } = await this.signRequest("GET", key);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`S3 GET failed: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async put(key: string, data: string): Promise<void> {
    const { url, headers } = await this.signRequest("PUT", key, data);

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: data,
    });

    if (!response.ok) {
      throw new Error(`S3 PUT failed: ${response.status} ${response.statusText}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const { url, headers } = await this.signRequest("HEAD", key);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers,
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const { url, headers } = await this.signRequest("DELETE", key);

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 DELETE failed: ${response.status} ${response.statusText}`);
    }
  }

  async list(prefix: string): Promise<string[]> {
    const { url, headers } = await this.signRequest("GET", "");
    const listUrl = `${url}?list-type=2&prefix=${encodeURIComponent(prefix)}`;

    const response = await fetch(listUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`S3 LIST failed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    // 簡易XMLパース（本番ではxml2jsなど使用）
    const keys: string[] = [];
    const keyRegex = /<Key>([^<]+)<\/Key>/g;
    let match;
    while ((match = keyRegex.exec(xml)) !== null) {
      keys.push(match[1]);
    }

    return keys;
  }
}
