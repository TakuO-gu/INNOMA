#!/bin/bash
# ロックファイルを使用して排他的にコマンドを実行するスクリプト
# 使用例: ./scripts/with-lock.sh npm run build

LOCK_FILE="/tmp/innoma-build.lock"
LOCK_TIMEOUT=300  # 5分でタイムアウト

# ロック取得を試みる関数
acquire_lock() {
    local start_time=$(date +%s)
    local wait_count=0

    while true; do
        # ロックファイルを排他的に作成（既に存在する場合は失敗）
        if (set -o noclobber; echo "$$" > "$LOCK_FILE") 2>/dev/null; then
            # ロック取得成功
            trap 'rm -f "$LOCK_FILE"' EXIT INT TERM
            return 0
        fi

        # タイムアウトチェック
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        if [ $elapsed -ge $LOCK_TIMEOUT ]; then
            echo "⚠️  ロック取得タイムアウト（${LOCK_TIMEOUT}秒）。古いロックを強制解除します。"
            rm -f "$LOCK_FILE"
            continue
        fi

        # 待機中メッセージ（10秒ごと）
        wait_count=$((wait_count + 1))
        if [ $((wait_count % 10)) -eq 0 ]; then
            local remaining=$((LOCK_TIMEOUT - elapsed))
            echo "⏳ 他のビルドプロセスを待機中... (残り${remaining}秒でタイムアウト)"
        fi

        sleep 1
    done
}

# メイン処理
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <コマンド> [引数...]"
    echo "例: $0 npm run build"
    exit 1
fi

echo "🔒 ロック取得中..."
acquire_lock
echo "✅ ロック取得成功 (PID: $$)"

# コマンド実行
echo "▶️  実行: $@"
"$@"
exit_code=$?

echo "🔓 ロック解放"
exit $exit_code
