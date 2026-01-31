"use client";

import { useEffect } from "react";

/**
 * インスペクター機能を注入するスクリプト
 * 親ウィンドウとpostMessageで通信
 * スペースキー+クリックで要素を選択、通常クリックは元の挙動を維持
 */
export function InspectorScript() {
  useEffect(() => {
    let hoveredElement: HTMLElement | null = null;
    let selectedElement: HTMLElement | null = null;
    let isInspectorEnabled = true;
    let isSpacePressed = false;

    // ハイライトオーバーレイを作成（スペースキー押下時のみ表示）
    const overlay = document.createElement("div");
    overlay.id = "inspector-overlay";
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      background-color: rgba(59, 130, 246, 0.2);
      border: 2px solid rgb(59, 130, 246);
      z-index: 99999;
      display: none;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(overlay);

    // 選択済みオーバーレイ
    const selectedOverlay = document.createElement("div");
    selectedOverlay.id = "inspector-selected";
    selectedOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      background-color: rgba(34, 197, 94, 0.2);
      border: 2px solid rgb(34, 197, 94);
      z-index: 99998;
      display: none;
    `;
    document.body.appendChild(selectedOverlay);

    // インスペクトモード表示
    const modeIndicator = document.createElement("div");
    modeIndicator.id = "inspector-mode";
    modeIndicator.style.cssText = `
      position: fixed;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      background-color: rgb(59, 130, 246);
      color: white;
      font-size: 12px;
      font-weight: 500;
      border-radius: 4px;
      z-index: 99999;
      display: none;
    `;
    modeIndicator.textContent = "レビューモード (Space + Click)";
    document.body.appendChild(modeIndicator);

    // オーバーレイを要素に合わせる
    function updateOverlay(target: HTMLElement, overlayEl: HTMLElement) {
      const rect = target.getBoundingClientRect();
      overlayEl.style.top = `${rect.top}px`;
      overlayEl.style.left = `${rect.left}px`;
      overlayEl.style.width = `${rect.width}px`;
      overlayEl.style.height = `${rect.height}px`;
      overlayEl.style.display = "block";
    }

    // 詳細なCSSセレクタを生成（より細かい粒度）
    function generateDetailedSelector(element: HTMLElement): string {
      const parts: string[] = [];
      let current: HTMLElement | null = element;

      // 最大5階層まで遡る
      let depth = 0;
      while (current && depth < 5) {
        let selector = current.tagName.toLowerCase();

        // data-block-type, data-block-id があれば使用
        if (current.dataset.blockType) {
          selector = `[data-block-type="${current.dataset.blockType}"]`;
          if (current.dataset.blockId) {
            selector += `[data-block-id="${current.dataset.blockId}"]`;
          }
          parts.unshift(selector);
          break; // ブロック要素に到達したら終了
        }

        // IDがあれば使用
        if (current.id) {
          selector = `#${current.id}`;
          parts.unshift(selector);
          break;
        }

        // クラスがあれば最初の1つを使用
        if (current.className && typeof current.className === "string") {
          const firstClass = current.className.split(" ").filter(c => c && !c.startsWith("__"))[0];
          if (firstClass) {
            selector += `.${firstClass}`;
          }
        }

        // nth-child を追加
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(current) + 1;
          if (siblings.filter(s => s.tagName === current!.tagName).length > 1) {
            selector += `:nth-child(${index})`;
          }
        }

        parts.unshift(selector);
        current = current.parentElement;
        depth++;
      }

      return parts.join(" > ");
    }

    // 要素のタイプを推測
    function guessElementType(element: HTMLElement): string {
      // data-block-type があればそれを使う
      const blockEl = element.closest("[data-block-type]") as HTMLElement | null;
      if (blockEl?.dataset.blockType) {
        // サブ要素の場合は詳細を付加
        if (blockEl !== element) {
          const tag = element.tagName.toLowerCase();
          const role = element.getAttribute("role");
          if (role) return `${blockEl.dataset.blockType}/${role}`;
          if (tag === "a") return `${blockEl.dataset.blockType}/リンク`;
          if (tag === "button") return `${blockEl.dataset.blockType}/ボタン`;
          if (tag === "img") return `${blockEl.dataset.blockType}/画像`;
          if (tag === "h1" || tag === "h2" || tag === "h3") return `${blockEl.dataset.blockType}/見出し`;
          if (tag === "p") return `${blockEl.dataset.blockType}/段落`;
          if (tag === "li") return `${blockEl.dataset.blockType}/リスト項目`;
          if (tag === "span" || tag === "div") {
            // テキストがあればその一部を表示
            const text = element.textContent?.trim().substring(0, 20);
            if (text) return `${blockEl.dataset.blockType}/"${text}..."`;
          }
          return `${blockEl.dataset.blockType}/${tag}`;
        }
        return blockEl.dataset.blockType;
      }
      return element.tagName.toLowerCase();
    }

    // キーダウン（スペースキー検出）
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        // スペースキーのデフォルト動作（スクロール）を防止
        e.preventDefault();

        if (!isSpacePressed) {
          isSpacePressed = true;
          modeIndicator.style.display = "block";
          // 現在ホバー中の要素があればハイライト
          if (hoveredElement) {
            updateOverlay(hoveredElement, overlay);
          }
        }
      }
    }

    // キーアップ
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        isSpacePressed = false;
        modeIndicator.style.display = "none";
        overlay.style.display = "none";
      }
    }

    // マウスオーバー（スロットリング付き）
    let mouseOverThrottleTimer: number | null = null;
    let pendingTarget: HTMLElement | null = null;

    function handleMouseOver(e: MouseEvent) {
      if (!isInspectorEnabled) return;

      const target = e.target as HTMLElement;

      // オーバーレイ要素自身は無視
      if (target.id === "inspector-overlay" ||
          target.id === "inspector-selected" ||
          target.id === "inspector-mode") {
        return;
      }

      // スペースキーが押されていない時はhoveredElementのみ更新
      if (!isSpacePressed) {
        hoveredElement = target;
        return;
      }

      // スロットリング: 50ms に強化（より滑らかだが処理を減らす）
      if (mouseOverThrottleTimer) {
        // タイマー中は最新のターゲットを記録するだけ
        pendingTarget = target;
        return;
      }

      // 即座に処理
      if (target !== hoveredElement) {
        hoveredElement = target;
        updateOverlay(target, overlay);
      }

      mouseOverThrottleTimer = window.setTimeout(() => {
        mouseOverThrottleTimer = null;
        // 保留中のターゲットがあれば処理
        if (pendingTarget && pendingTarget !== hoveredElement) {
          hoveredElement = pendingTarget;
          updateOverlay(pendingTarget, overlay);
        }
        pendingTarget = null;
      }, 50);
    }

    // マウスアウト
    function handleMouseOut(e: MouseEvent) {
      if (!isInspectorEnabled) return;
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (!relatedTarget) {
        overlay.style.display = "none";
        hoveredElement = null;
      }
    }

    // リンク要素を見つける
    function findLinkElement(element: HTMLElement): HTMLAnchorElement | null {
      let current: HTMLElement | null = element;
      while (current) {
        if (current.tagName === "A") {
          return current as HTMLAnchorElement;
        }
        current = current.parentElement;
      }
      return null;
    }

    // クリック（スペースキー+クリックで要素選択、通常クリックはリンク遷移を親に通知）
    function handleClick(e: MouseEvent) {
      if (!isInspectorEnabled) return;

      const target = e.target as HTMLElement;

      // スペースキーが押されている場合は要素選択モード
      if (isSpacePressed) {
        e.preventDefault();
        e.stopPropagation();

        // 同じ要素をクリックした場合は選択解除
        if (selectedElement === target) {
          selectedElement = null;
          selectedOverlay.style.display = "none";

          // 親ウィンドウに選択解除を送信
          window.parent.postMessage({
            type: "element-deselected",
          }, "*");
          return;
        }

        // 新しい要素を選択
        selectedElement = target;
        updateOverlay(target, selectedOverlay);

        const selector = generateDetailedSelector(target);
        const elementType = guessElementType(target);

        // 親ブロックの情報も取得
        const blockEl = target.closest("[data-block-type]") as HTMLElement | null;
        const blockType = blockEl?.dataset.blockType || "Unknown";
        const blockId = blockEl?.dataset.blockId || "";

        // HTMLプレビュー（軽量に取得）
        // outerHTMLは大きな要素で非常に重いので、タグ名とクラス、テキストのみ取得
        const tagName = target.tagName.toLowerCase();
        const classes = target.className && typeof target.className === "string"
          ? target.className.split(" ").slice(0, 3).join(" ")
          : "";
        const textContent = target.textContent?.trim().substring(0, 50) || "";
        const htmlPreview = `<${tagName}${classes ? ` class="${classes}"` : ""}>${textContent}...</${tagName}>`;

        // 親ウィンドウに送信
        window.parent.postMessage({
          type: "element-selected",
          data: {
            selector,
            blockType,
            blockId,
            elementType,
            htmlPreview,
          },
        }, "*");

        return;
      }

      // 通常クリック: リンクの場合は遷移を防ぎ、親に通知
      const linkElement = findLinkElement(target);
      if (linkElement && linkElement.href) {
        const href = linkElement.getAttribute("href");
        // 内部リンクの場合のみ処理
        if (href && (href.startsWith("/") || href.startsWith("./"))) {
          e.preventDefault();
          e.stopPropagation();
          // 親に遷移リクエストを送信
          window.parent.postMessage({
            type: "navigate-request",
            data: { href },
          }, "*");
        }
      }
    }

    // 親からのメッセージを受信
    function handleMessage(e: MessageEvent) {
      if (e.data.type === "enable-inspector") {
        isInspectorEnabled = true;
      } else if (e.data.type === "disable-inspector") {
        isInspectorEnabled = false;
        overlay.style.display = "none";
      } else if (e.data.type === "clear-selection") {
        selectedElement = null;
        selectedOverlay.style.display = "none";
      }
    }

    // イベントリスナーを登録
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    // 親に準備完了を通知
    window.parent.postMessage({ type: "ready" }, "*");

    // クリーンアップ
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
      if (mouseOverThrottleTimer) {
        clearTimeout(mouseOverThrottleTimer);
      }
      overlay.remove();
      selectedOverlay.remove();
      modeIndicator.remove();
    };
  }, []);

  return null;
}
