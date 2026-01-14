import fs from "node:fs/promises";
import path from "node:path";
import type { ArtifactStorageAdapter } from "./types";

/**
 * ローカルファイルシステム用ストレージアダプタ
 * 開発環境・テスト用
 */
export class LocalStorageAdapter implements ArtifactStorageAdapter {
  private basePath: string;

  constructor(basePath: string = "./data/artifacts") {
    this.basePath = basePath;
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async get(key: string): Promise<string | null> {
    try {
      const fullPath = this.getFullPath(key);
      const data = await fs.readFile(fullPath, "utf-8");
      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async put(key: string, data: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, data, "utf-8");
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(key);
      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async list(prefix: string): Promise<string[]> {
    const fullPath = this.getFullPath(prefix);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true, recursive: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => path.join(prefix, e.name));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}
