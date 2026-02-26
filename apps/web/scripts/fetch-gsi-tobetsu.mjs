/**
 * 国土地理院の避難所検索APIで当別町のデータを取得
 */

async function searchMunicipality(municipalityCode, name) {
  // 国土地理院の避難所検索 - 自治体コード検索
  // 当別町の自治体コード: 01303
  const url = `https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/search?prefCode=01&cityCode=01303&type=1`;

  console.log(`Fetching: ${url}`);
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
  });
  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const text = await response.text();
    console.log(text.substring(0, 500));
  }
}

// 別のアプローチ: e-Stat（政府統計ポータル）から避難所数を検索
async function searchEStat() {
  // 当別町の避難所情報を政府統計から探す
  const url = 'https://www.e-stat.go.jp/api/v2/json-stat/getData?statsDataId=0000010101&cdArea=01303';
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
  });
  console.log(`e-Stat status: ${response.status}`);
}

// 直接当別町の地域防災計画PDFを取得して避難所数を確認
async function fetchBosaiPlanPdf() {
  // 当別町地域防災計画 資料19「緊急時退避場所及び指定避難所一覧」
  // URLは 47981.html から確認が必要
  const pageUrl = 'https://www.town.tobetsu.hokkaido.jp/soshiki/kiki/47981.html';
  const response = await fetch(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
  });
  if (!response.ok) {
    console.log(`Page HTTP ${response.status}`);
    return;
  }
  const html = await response.text();
  // PDFリンクを探す
  const pdfMatches = html.match(/href="([^"]*\.pdf[^"]*)"/gi) || [];
  console.log(`Found ${pdfMatches.length} PDF links:`);
  pdfMatches.forEach(m => console.log(`  ${m}`));

  // 資料19のリンクを探す
  const lines = html.split('\n');
  lines.forEach(line => {
    if (line.includes('資料') && (line.includes('避難') || line.includes('退避'))) {
      console.log(`  Match: ${line.substring(0, 200)}`);
    }
  });
}

await fetchBosaiPlanPdf();
