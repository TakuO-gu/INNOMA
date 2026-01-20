import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";

interface GenerateRequest {
  municipality_name: string;
  municipality_id?: string;
  topics?: string[];
  skip_tavily?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // 入力検証
    if (!body.municipality_name) {
      return NextResponse.json(
        { error: "municipality_name is required" },
        { status: 400 }
      );
    }

    // コマンド引数を構築
    const args = [
      join(process.cwd(), "..", "composer", "cli.py"),
      body.municipality_name,
    ];

    if (body.municipality_id) {
      args.push("--id", body.municipality_id);
    }

    if (body.topics?.length) {
      args.push("--topics", body.topics.join(","));
    }

    if (body.skip_tavily) {
      args.push("--skip-tavily");
    }

    args.push("--force", "--verbose");

    // Pythonプロセスを起動
    const logs: string[] = [];
    let result: Record<string, unknown> | null = null;

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn("python3", args, {
        cwd: join(process.cwd(), "..", "composer"),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      // stdout を収集
      proc.stdout.on("data", (data) => {
        const lines = data.toString().split("\n").filter(Boolean);
        logs.push(...lines);
      });

      // stderr を収集
      proc.stderr.on("data", (data) => {
        const lines = data.toString().split("\n").filter(Boolean);
        logs.push(...lines.map((line: string) => `[stderr] ${line}`));
      });

      // プロセス終了
      proc.on("close", (code) => {
        if (code === 0) {
          // 成功
          result = {
            success: true,
            municipality_id:
              body.municipality_id ||
              body.municipality_name
                .replace(/市|町|村|区/g, "")
                .toLowerCase(),
            output_dir: `apps/web/data/artifacts/${body.municipality_id || body.municipality_name.replace(/市|町|村|区/g, "").toLowerCase()}`,
            stats: {
              files_created: extractNumber(logs, /Files:\s*(\d+)/),
              variables_fetched: extractNumber(logs, /Tavily queries:\s*(\d+)/),
              variables_replaced: extractNumber(logs, /Variables set:\s*(\d+)/),
              errors: [],
            },
            logs,
          };
        } else {
          // エラー
          result = {
            success: false,
            error: `Process exited with code ${code}`,
            stats: {
              files_created: 0,
              variables_fetched: 0,
              variables_replaced: 0,
              errors: logs.filter(
                (l) => l.includes("ERROR") || l.includes("Error")
              ),
            },
            logs,
          };
        }

        resolve(NextResponse.json(result));
      });

      // タイムアウト（5分）
      setTimeout(() => {
        proc.kill();
        resolve(
          NextResponse.json({
            success: false,
            error: "Process timed out after 5 minutes",
            stats: {
              files_created: 0,
              variables_fetched: 0,
              variables_replaced: 0,
              errors: ["Timeout"],
            },
            logs,
          })
        );
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start generation: ${error}` },
      { status: 500 }
    );
  }
}

// ログから数値を抽出
function extractNumber(logs: string[], pattern: RegExp): number {
  for (const log of logs) {
    const match = log.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}
