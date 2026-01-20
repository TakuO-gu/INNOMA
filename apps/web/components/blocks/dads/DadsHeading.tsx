import React from "react";

/**
 * DADS準拠の見出しコンポーネント
 *
 * DADSのStorybookスタイルに完全準拠:
 * - data-size属性でフォントサイズを指定（64, 57, 45, 36, 32, 28, 24, 20, 18, 16）
 * - data-chip属性で左側のチップ装飾を追加
 * - data-rule属性で下線装飾を追加（8, 6, 4, 2）
 *
 * @see https://design.digital.go.jp/dads/html/?path=/docs/components-見出し--docs
 */

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingSize = "64" | "57" | "45" | "36" | "32" | "28" | "24" | "20" | "18" | "16";
type SizeAlias = "xl" | "l" | "m" | "s" | "xs";
type RuleSize = "8" | "6" | "4" | "2";

interface DadsHeadingProps {
  /** HTML見出しタグ */
  as: HeadingLevel;
  /** 見出しテキスト */
  children: React.ReactNode;
  /**
   * フォントサイズ（px）または別名
   * - 64 (xl): ページタイトル
   * - 45 (l): セクション見出し
   * - 32 (m): サブセクション見出し
   * - 24 (s): 小見出し
   * - 20 (xs): 最小見出し
   */
  size?: HeadingSize | SizeAlias;
  /** 左側にチップ装飾を表示 */
  chip?: boolean;
  /** 下線装飾のサイズ（px） */
  rule?: RuleSize;
  /** 肩見出し（サブタイトル） */
  shoulder?: string;
  /** アイコン */
  icon?: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * サイズ別名を数値サイズに変換
 */
function resolveSize(size: HeadingSize | SizeAlias): HeadingSize {
  const aliases: Record<SizeAlias, HeadingSize> = {
    xl: "64",
    l: "45",
    m: "32",
    s: "24",
    xs: "20",
  };

  if (size in aliases) {
    return aliases[size as SizeAlias];
  }
  return size as HeadingSize;
}

/**
 * サイズからCSSクラス名を取得
 */
function getSizeClass(size: HeadingSize | SizeAlias): string {
  const sizeClasses: Record<string, string> = {
    "64": "dads-heading--xl",
    xl: "dads-heading--xl",
    "45": "dads-heading--l",
    l: "dads-heading--l",
    "32": "dads-heading--m",
    m: "dads-heading--m",
    "24": "dads-heading--s",
    s: "dads-heading--s",
    "20": "dads-heading--xs",
    xs: "dads-heading--xs",
    "57": "dads-heading--xl",
    "36": "dads-heading--l",
    "28": "dads-heading--m",
    "18": "dads-heading--xs",
    "16": "dads-heading--xs",
  };
  return sizeClasses[size] || "dads-heading--m";
}

export function DadsHeading({
  as,
  children,
  size = "l",
  chip,
  rule,
  shoulder,
  icon,
  className,
}: DadsHeadingProps) {
  const Tag = as;
  const dataSize = resolveSize(size);
  const sizeClass = getSizeClass(size);

  const classes = ["dads-heading", sizeClass, className].filter(Boolean).join(" ");

  // シンプルな見出し（肩見出しなし）
  if (!shoulder) {
    return (
      <Tag
        className={classes}
        data-size={dataSize}
        data-chip={chip ? "" : undefined}
        data-rule={rule}
      >
        {icon && (
          <span className="dads-heading__icon">
            {typeof icon === "string" ? (
              <span>{icon}</span>
            ) : (
              <span className="dads-heading__icon-svg">{icon}</span>
            )}
          </span>
        )}
        {children}
      </Tag>
    );
  }

  // 肩見出しあり
  return (
    <div
      className={classes}
      data-size={dataSize}
      data-chip={chip ? "" : undefined}
      data-rule={rule}
    >
      <p className="dads-heading__shoulder">{shoulder}</p>
      <Tag className="dads-heading__heading">
        {icon && (
          <span className="dads-heading__icon">
            {typeof icon === "string" ? (
              <span>{icon}</span>
            ) : (
              <span className="dads-heading__icon-svg">{icon}</span>
            )}
          </span>
        )}
        {children}
      </Tag>
    </div>
  );
}

export default DadsHeading;
