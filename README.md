# すべての市民に届く、迷わない自治体サイトへ

### INNOMAは地方公共団体のWeb体験を再設計するOSSプラットフォームです

![image.png](attachment:74fe5f66-25a6-4d16-987d-6dadf63be740:image.png)

---

# INNOMAとは

## **ミッション**

すべての自治体サイトを「迷わず辿り着ける・読める・操作できる」体験に統一し、災害・行政手続き情報を誰一人取り残さず届けるmunicipal_web_pipeline。

## **ステークホルダー**

住民（高齢者・障害者含む）、自治体職員、NPO／ボランティア開発者、公共DX省庁、研究者。

## **価値提供**

- アクセシビリティ AA準拠
- 自治体横断検索
- 多言語・読み上げ対応
- 災害時の即時更新対応など

---

# 技術構成（開発者向け）

## 処理フロー図

```

[URL List] → Crawler → OCR → LLM(JSON) → BestUXUI → React+DA-DS → Next.js → CDN

```

各ステップの技術スタック：Playwright、PaddleOCR、LangChain、GPT-4o、TypeScript + Zod、Next.js、Vercel etc.

---

# できること・提供機能

- 自動クロール + UI最適化
- スキャンPDFもテキスト化＆全文検索対象に
- 公共デザイン基準（DA-DS）対応UI
- APIで自治体情報を外部提供

---

# コンタクト・貢献方法

### コントリビューターを募集しています

INNOMAは完全OSSで運用されており、どなたでも開発・改善に参加できます。

以下のようなスキルをお持ちの方を特に歓迎します：

- TypeScript / Next.js / Playwright などの開発経験
- DA-DS（デジタル庁デザインシステム）に基づくUI/UX設計
- OCRやLLMの構成改善、アクセシビリティレビュー

開発に関わるご相談は、公式Discordで随時受け付けています。

**まずは「#自己紹介」チャンネルからお気軽に！**

▶︎ **INNOMA Discord コミュニティへ参加する**
