"use client";

interface SearchAttempt {
  query: string;
  searchedAt: string;
  resultsCount: number;
  urls: string[];
  snippets: string[];
  reason: 'not_found' | 'no_match' | 'low_confidence' | 'validation_failed';
}

interface Props {
  variableName: string;
  attempts: SearchAttempt[];
}

const reasonLabels: Record<SearchAttempt['reason'], string> = {
  not_found: '検索結果なし',
  no_match: '該当情報なし',
  low_confidence: '信頼度不足',
  validation_failed: '形式不一致',
};

const reasonDescriptions: Record<SearchAttempt['reason'], string> = {
  not_found: '検索クエリに対する結果が見つかりませんでした',
  no_match: '検索結果はありましたが、対象の情報を特定できませんでした',
  low_confidence: '情報は見つかりましたが、確信度が低いため除外されました',
  validation_failed: '抽出した値が期待される形式と一致しませんでした',
};

export function SearchAttemptsViewer({ variableName, attempts }: Props) {
  if (attempts.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
        <svg
          className="w-12 h-12 mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-sm font-medium mb-1">検索記録がありません</p>
        <p className="text-xs text-center">
          この変数に対する検索試行の記録がありません。
          <br />
          情報取得を再実行すると記録が残ります。
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 h-full overflow-auto">
      <div className="mb-3">
        <code className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono">
          {variableName}
        </code>
        <span className="text-xs text-gray-500 ml-2">
          {attempts.length}件の検索を試行
        </span>
      </div>

      <div className="space-y-3">
        {attempts.map((attempt, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            {/* Query */}
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">検索クエリ</div>
              <div className="bg-gray-50 rounded px-2 py-1.5 font-mono text-sm text-gray-800 break-all">
                {attempt.query}
              </div>
            </div>

            {/* Result Summary */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  attempt.resultsCount > 0
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {attempt.resultsCount}件の結果
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  attempt.reason === 'not_found'
                    ? 'bg-gray-100 text-gray-600'
                    : attempt.reason === 'no_match'
                    ? 'bg-orange-50 text-orange-700'
                    : attempt.reason === 'low_confidence'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {reasonLabels[attempt.reason]}
              </span>
            </div>

            {/* Reason Description */}
            <p className="text-xs text-gray-500 mb-2">
              {reasonDescriptions[attempt.reason]}
            </p>

            {/* URLs checked */}
            {attempt.urls.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">確認したURL</div>
                <div className="space-y-1">
                  {attempt.urls.map((url, urlIndex) => (
                    <a
                      key={urlIndex}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {(() => {
                        try {
                          const u = new URL(url);
                          return `${u.hostname}${u.pathname}`;
                        } catch {
                          return url;
                        }
                      })()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Snippets */}
            {attempt.snippets.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">取得したスニペット</div>
                <div className="space-y-1">
                  {attempt.snippets.map((snippet, snippetIndex) => (
                    <div
                      key={snippetIndex}
                      className="text-xs text-gray-600 bg-gray-50 rounded p-2 line-clamp-2"
                    >
                      {snippet}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-2 text-xs text-gray-400">
              {new Date(attempt.searchedAt).toLocaleString('ja-JP')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
