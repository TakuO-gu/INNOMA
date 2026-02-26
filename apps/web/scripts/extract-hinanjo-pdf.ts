// 国土地理院の指定緊急避難場所・指定避難所データを取得

async function main() {
  // 市町村リストCSVを取得
  const res = await fetch('https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/publicHistoryListData.csv', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' }
  });
  console.log('status:', res.status);
  const text = await res.text();
  // 対象自治体を検索
  const lines = text.split('\n');
  const targets = ['当別', '草津', '南牧'];
  for (const line of lines) {
    for (const t of targets) {
      if (line.includes(t)) console.log(line.trim());
    }
  }
}

main().catch(console.error);
