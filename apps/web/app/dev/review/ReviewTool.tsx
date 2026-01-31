"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import type { Review, ReviewSession, ReviewStatus, SelectedElement } from "./types";

interface ReviewToolProps {
  pages: Array<{ key: string; municipality: string; path: string }>;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  children: TreeNode[];
  pageKey?: string;
}

const STORAGE_KEY = "innoma-review-sessions";

const STATUS_CONFIG: Record<ReviewStatus, { label: string; className: string }> = {
  proposal: { label: "提案", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  in_progress: { label: "変更中", className: "bg-orange-100 text-orange-700 border-orange-300" },
  confirmed: { label: "確認済み", className: "bg-green-100 text-green-700 border-green-300" },
};

const STATUS_ORDER: ReviewStatus[] = ["proposal", "in_progress", "confirmed"];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadSessions(): ReviewSession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 即時保存（手動保存用）
function saveSessionsToStorage(sessions: ReviewSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ページをツリー構造に変換
function buildTree(pages: Array<{ key: string; municipality: string; path: string }>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const page of pages) {
    const parts = [page.municipality, ...page.path.split("/").filter(Boolean)];
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find(n => n.name === part && n.fullPath === fullPath);

      if (!existing) {
        existing = {
          name: part,
          fullPath,
          isFile: isLast,
          children: [],
          pageKey: isLast ? page.key : undefined,
        };
        currentLevel.push(existing);
      }

      if (isLast && !existing.pageKey) {
        existing.pageKey = page.key;
        existing.isFile = true;
      }

      currentLevel = existing.children;
    }
  }

  // ソート: フォルダが先、ファイルが後
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => sortNodes(n.children));
  }
  sortNodes(root);

  return root;
}

// ツリーノードコンポーネント（メモ化して再レンダリングを防止）
// isExpanded を直接propsで受け取り、expandedPaths参照を避ける
const TreeNodeItem = memo(
  function TreeNodeItem({
    node,
    selectedPage,
    onSelect,
    isExpanded,
    onToggle,
    depth = 0,
    getIsExpanded,
  }: {
    node: TreeNode;
    selectedPage: string;
    onSelect: (key: string) => void;
    isExpanded: boolean;
    onToggle: (path: string) => void;
    depth?: number;
    getIsExpanded: (path: string) => boolean;
  }) {
    const hasChildren = node.children.length > 0;
    const isSelected = node.pageKey === selectedPage;

    return (
      <div>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-sm ${
            isSelected ? "bg-blue-100 text-blue-700" : "text-gray-700"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.pageKey) {
              onSelect(node.pageKey);
            } else if (hasChildren) {
              onToggle(node.fullPath);
            }
          }}
        >
          {hasChildren ? (
            <span
              className="w-4 h-4 flex items-center justify-center text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.fullPath);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
          ) : (
            <span className="w-4" />
          )}
          <span className={node.isFile ? "" : "font-medium"}>
            {node.isFile ? "📄" : "📁"} {node.name}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => (
              <TreeNodeItem
                key={child.fullPath}
                node={child}
                selectedPage={selectedPage}
                onSelect={onSelect}
                isExpanded={getIsExpanded(child.fullPath)}
                onToggle={onToggle}
                depth={depth + 1}
                getIsExpanded={getIsExpanded}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
  // カスタム比較関数: 関連するpropsのみ比較
  (prevProps, nextProps) => {
    return (
      prevProps.node === nextProps.node &&
      prevProps.selectedPage === nextProps.selectedPage &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.depth === nextProps.depth
    );
  }
);

// 全レビューをフラット化して表示用に変換
interface FlatReview extends Review {
  sessionId: string;
  municipalityId: string;
  path: string;
  pageKey: string;
}

function flattenReviews(sessions: ReviewSession[]): FlatReview[] {
  const reviews: FlatReview[] = [];
  for (const session of sessions) {
    for (const review of session.reviews) {
      reviews.push({
        ...review,
        sessionId: session.id,
        municipalityId: session.municipalityId,
        path: session.path,
        pageKey: `${session.municipalityId}/${session.path}.json`,
      });
    }
  }
  // 作成日時の新しい順にソート
  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return reviews;
}

export function ReviewTool({ pages }: ReviewToolProps) {
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [instruction, setInstruction] = useState("");
  const [scope, setScope] = useState<"global" | "local">("local");
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ツリー構造を構築
  const tree = useMemo(() => buildTree(pages), [pages]);

  // 全レビューをフラット化
  const allReviews = useMemo(() => flattenReviews(sessions), [sessions]);

  // 初期読み込み
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  // postMessageを受信
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // 自分のオリジンからのメッセージのみ処理（React DevTools等を除外）
      if (e.origin !== window.location.origin) return;

      const message = e.data;
      // INNOMAのメッセージタイプのみ処理
      if (!message || typeof message.type !== "string") return;
      const validTypes = ["ready", "element-selected", "element-deselected", "navigate-request"];
      if (!validTypes.includes(message.type)) return;

      if (message.type === "ready") {
        setIsPreviewReady(true);
      } else if (message.type === "element-selected" && message.data) {
        setSelectedElement(message.data as SelectedElement);
      } else if (message.type === "element-deselected") {
        setSelectedElement(null);
      } else if (message.type === "navigate-request" && message.data?.href) {
        const href = message.data.href as string;
        const pathWithoutLeadingSlash = href.replace(/^\//, "");
        const key = `${pathWithoutLeadingSlash}.json`;
        const targetPage = pages.find(p => p.key === key);
        if (targetPage) {
          setSelectedPage(targetPage.key);
        } else {
          console.warn(`Page not found: ${key}`);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pages]);

  // 現在のページ情報を取得
  const currentPageInfo = useMemo(() => {
    if (!selectedPage) return null;
    return pages.find(p => p.key === selectedPage) || null;
  }, [selectedPage, pages]);

  // プレビューURL
  const previewUrl = useMemo(() => {
    if (!currentPageInfo) return null;
    return `/dev/review/preview/${currentPageInfo.municipality}${currentPageInfo.path === "index" ? "" : `/${currentPageInfo.path}`}`;
  }, [currentPageInfo]);

  // ページ変更時にプレビュー状態をリセット
  useEffect(() => {
    setIsPreviewReady(false);
    setSelectedElement(null);
  }, [selectedPage]);

  // セッションを保存（内部用 - メモリのみ更新）
  const saveSession = useCallback((session: ReviewSession) => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === session.id);
      let newSessions: ReviewSession[];
      if (existingIndex >= 0) {
        newSessions = [...prev];
        newSessions[existingIndex] = session;
      } else {
        newSessions = [...prev, session];
      }
      return newSessions;
    });
    setHasUnsavedChanges(true);
  }, []);

  // 手動保存
  const saveToStorage = useCallback(() => {
    saveSessionsToStorage(sessions);
    setHasUnsavedChanges(false);
  }, [sessions]);

  // レビューを追加
  const addReview = useCallback(() => {
    if (!currentPageInfo || !selectedElement || !instruction.trim()) return;

    const review: Review = {
      id: generateId(),
      elementSelector: selectedElement.selector,
      blockType: selectedElement.blockType,
      blockId: selectedElement.blockId,
      elementType: selectedElement.elementType,
      instruction: instruction.trim(),
      scope,
      status: "proposal",
      createdAt: new Date().toISOString(),
    };

    // 既存セッションを探すか、新規作成
    const existingSession = sessions.find(
      s => s.municipalityId === currentPageInfo.municipality && s.path === currentPageInfo.path
    );

    if (existingSession) {
      const updatedSession = {
        ...existingSession,
        reviews: [...existingSession.reviews, review],
        updatedAt: new Date().toISOString(),
      };
      saveSession(updatedSession);
    } else {
      const newSession: ReviewSession = {
        id: generateId(),
        pageUrl: previewUrl || "",
        municipalityId: currentPageInfo.municipality,
        path: currentPageInfo.path,
        reviews: [review],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveSession(newSession);
    }

    setInstruction("");
    setSelectedElement(null);
  }, [currentPageInfo, selectedElement, instruction, scope, sessions, previewUrl, saveSession]);

  // レビューを削除
  const deleteReview = useCallback((sessionId: string, reviewId: string) => {
    setSessions(prev => {
      const newSessions = prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            reviews: session.reviews.filter(r => r.id !== reviewId),
            updatedAt: new Date().toISOString(),
          };
        }
        return session;
      }).filter(s => s.reviews.length > 0); // レビューが0になったセッションは削除
      return newSessions;
    });
    setHasUnsavedChanges(true);
  }, []);

  // レビューのステータスを更新
  const updateReviewStatus = useCallback((sessionId: string, reviewId: string, newStatus: ReviewStatus) => {
    setSessions(prev => {
      const newSessions = prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            reviews: session.reviews.map(r =>
              r.id === reviewId ? { ...r, status: newStatus } : r
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return session;
      });
      return newSessions;
    });
    setHasUnsavedChanges(true);
  }, []);

  // ステータスを次の状態に変更
  const cycleReviewStatus = useCallback((sessionId: string, reviewId: string, currentStatus: ReviewStatus) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
    updateReviewStatus(sessionId, reviewId, STATUS_ORDER[nextIndex]);
  }, [updateReviewStatus]);

  // 全レビュー出力をコピー
  const copyAllOutput = useCallback(() => {
    const output = generateAllOutput(sessions);
    navigator.clipboard.writeText(output);
  }, [sessions]);

  // レビューのページに移動
  const navigateToReviewPage = useCallback((pageKey: string) => {
    const targetPage = pages.find(p => p.key === pageKey);
    if (targetPage) {
      setSelectedPage(targetPage.key);
      // ツリーを展開
      const parts = [targetPage.municipality, ...targetPage.path.split("/").filter(Boolean)];
      const pathsToExpand = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
      setExpandedPaths(prev => {
        const next = new Set(prev);
        pathsToExpand.forEach(p => next.add(p));
        return next;
      });
    }
  }, [pages]);

  // フォルダの開閉
  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 展開状態を取得する関数（useCallbackでメモ化、expandedPathsをクロージャで参照）
  const getIsExpanded = useCallback((path: string) => {
    return expandedPaths.has(path);
  }, [expandedPaths]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左側: レビューパネル */}
      <div className="w-[400px] flex flex-col border-r border-gray-300 bg-white">
        {/* ページ選択（ツリー表示） */}
        <div className="p-2 border-b border-gray-200 max-h-[300px] overflow-y-auto">
          <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
            ページを選択
          </div>
          {tree.map(node => (
            <TreeNodeItem
              key={node.fullPath}
              node={node}
              selectedPage={selectedPage}
              onSelect={setSelectedPage}
              isExpanded={expandedPaths.has(node.fullPath)}
              onToggle={toggleExpanded}
              getIsExpanded={getIsExpanded}
            />
          ))}
        </div>

        {/* 全レビュー一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              全レビュー ({allReviews.length})
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600">●未保存</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={saveToStorage}
                disabled={!hasUnsavedChanges}
                className={`text-sm px-2 py-1 rounded ${
                  hasUnsavedChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                保存
              </button>
              {allReviews.length > 0 && (
                <button
                  onClick={() => setShowOutput(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  出力
                </button>
              )}
            </div>
          </div>

          {allReviews.length === 0 ? (
            <p className="text-sm text-gray-500">
              右側のプレビューでSpace+クリックして要素を選択し、レビューを追加
            </p>
          ) : (
            <div className="space-y-3">
              {allReviews.map((review, index) => {
                const isCurrentPage = currentPageInfo &&
                  review.municipalityId === currentPageInfo.municipality &&
                  review.path === currentPageInfo.path;
                return (
                  <div
                    key={review.id}
                    className={`p-3 rounded-lg border overflow-hidden ${
                      isCurrentPage
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {/* ページ情報 */}
                        <button
                          onClick={() => navigateToReviewPage(review.pageKey)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline mb-1 block text-left truncate max-w-full"
                        >
                          {review.municipalityId}/{review.path}
                        </button>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {review.elementType || review.blockType}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            review.scope === "global"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {review.scope === "global" ? "全体" : "個別"}
                          </span>
                          <button
                            onClick={() => cycleReviewStatus(review.sessionId, review.id, review.status || "proposal")}
                            className={`text-xs px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${
                              STATUS_CONFIG[review.status || "proposal"].className
                            }`}
                            title="クリックでステータスを変更"
                          >
                            {STATUS_CONFIG[review.status || "proposal"].label}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 break-words">{review.instruction}</p>
                      </div>
                      <button
                        onClick={() => deleteReview(review.sessionId, review.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* レビューフォーム */}
        {selectedElement && (
          <div className="p-4 border-t border-gray-200 bg-blue-50">
            <div className="mb-3">
              <span className="text-xs text-gray-500">選択中:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {selectedElement.elementType || selectedElement.blockType}
              </span>
            </div>
            <div className="mb-3 text-xs text-gray-500 truncate" title={selectedElement.selector}>
              セレクタ: {selectedElement.selector}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                改善指示
              </label>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="この要素の改善点を記述..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                適用範囲
              </label>
              <div className="flex gap-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scope"
                    value="local"
                    checked={scope === "local"}
                    onChange={() => setScope("local")}
                    className="mr-1.5"
                  />
                  <span className="text-sm text-gray-700">このページのみ</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scope"
                    value="global"
                    checked={scope === "global"}
                    onChange={() => setScope("global")}
                    className="mr-1.5"
                  />
                  <span className="text-sm text-gray-700">全体に適用</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addReview}
                disabled={!instruction.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                レビューを追加
              </button>
              <button
                onClick={() => setSelectedElement(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 右側: プレビュー */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 bg-gray-200 border-b border-gray-300 flex items-center">
          <div className="flex-1 text-sm text-gray-600">
            {previewUrl || "ページを選択してください"}
          </div>
          {isPreviewReady && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              インスペクター有効
            </span>
          )}
        </div>
        <div className="flex-1 bg-white">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              左側でページを選択してください
            </div>
          )}
        </div>
      </div>

      {/* 出力モーダル */}
      {showOutput && allReviews.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">AI向け出力（全{allReviews.length}件）</h3>
              <button
                onClick={() => setShowOutput(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                {generateAllOutput(sessions)}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowOutput(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
              >
                閉じる
              </button>
              <button
                onClick={copyAllOutput}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                コピー
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateAllOutput(sessions: ReviewSession[]): string {
  // レビューがあるセッションのみ
  const sessionsWithReviews = sessions.filter(s => s.reviews.length > 0);
  if (sessionsWithReviews.length === 0) return "レビューがありません";

  const totalReviews = sessionsWithReviews.reduce((sum, s) => sum + s.reviews.length, 0);

  const lines: string[] = [
    "# UIレビュー一覧",
    "",
    `レビュー総数: ${totalReviews}件`,
    `対象ページ数: ${sessionsWithReviews.length}ページ`,
    `出力日時: ${new Date().toLocaleString("ja-JP")}`,
    "",
  ];

  // ページごとにグループ化して出力
  sessionsWithReviews.forEach(session => {
    lines.push(`## ${session.municipalityId}/${session.path}`);
    lines.push("");

    session.reviews.forEach((review, index) => {
      const elementName = review.elementType || review.blockType;
      const statusLabel = STATUS_CONFIG[review.status || "proposal"].label;
      lines.push(`### ${index + 1}. ${elementName}`);
      lines.push(`- **ステータス**: ${statusLabel}`);
      lines.push(`- **指示**: ${review.instruction}`);
      lines.push(`- **適用範囲**: ${review.scope === "global" ? "全体（同タイプの全ブロック）" : "このページのみ"}`);
      lines.push(`- **セレクタ**: \`${review.elementSelector}\``);
      if (review.blockType !== elementName) {
        lines.push(`- **親ブロック**: ${review.blockType}${review.blockId ? ` (ID: ${review.blockId})` : ""}`);
      }
      lines.push("");
    });
  });

  return lines.join("\n");
}
