/**
 * 自治体のメタ情報を設定するスクリプト
 */
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_DIR = './data/artifacts';

// 自治体ID -> 名前・都道府県のマッピング
const MUNICIPALITY_INFO: Record<string, { name: string; prefecture: string; officialUrl?: string }> = {
  hakone: { name: '箱根町', prefecture: '神奈川県', officialUrl: 'https://www.town.hakone.kanagawa.jp/' },
  hayakawa: { name: '早川町', prefecture: '山梨県', officialUrl: 'https://www.town.hayakawa.yamanashi.jp/' },
  higashiyoshino: { name: '東吉野村', prefecture: '奈良県', officialUrl: 'https://www.vill.higashiyoshino.nara.jp/' },
  ide: { name: '井手町', prefecture: '京都府', officialUrl: 'https://www.town.ide.kyoto.jp/' },
  kamikitayama: { name: '上北山村', prefecture: '奈良県', officialUrl: 'https://vill.kamikitayama.nara.jp/' },
  kanna: { name: '神流町', prefecture: '群馬県', officialUrl: 'https://www.town.kanna.gunma.jp/' },
  kawachi: { name: '河内町', prefecture: '茨城県', officialUrl: 'https://www.town.ibaraki-kawachi.lg.jp/' },
  'kawasaki-miyagi': { name: '川崎町', prefecture: '宮城県', officialUrl: 'https://www.town.kawasaki.miyagi.jp/' },
  kitagawa: { name: '北川村', prefecture: '高知県', officialUrl: 'https://www.vill.kitagawa.kochi.jp/' },
  kusatsu: { name: '草津町', prefecture: '群馬県', officialUrl: 'https://www.town.kusatsu.gunma.jp/' },
  nanmoku: { name: '南牧村', prefecture: '群馬県', officialUrl: 'https://www.vill.nanmoku.gunma.jp/' },
  nosegawa: { name: '野迫川村', prefecture: '奈良県', officialUrl: 'https://www.vill.nosegawa.nara.jp/' },
  otaki: { name: '大滝村', prefecture: '長野県', officialUrl: 'https://www.vill.otaki.nagano.jp/' },
  shimoichi: { name: '下市町', prefecture: '奈良県', officialUrl: 'https://www.town.shimoichi.lg.jp/' },
  sotogahama: { name: '外ヶ浜町', prefecture: '青森県', officialUrl: 'https://www.town.sotogahama.lg.jp/' },
  tobetsu: { name: '当別町', prefecture: '北海道', officialUrl: 'https://www.town.tobetsu.hokkaido.jp/' },
  toyono: { name: '豊能町', prefecture: '大阪府', officialUrl: 'https://www.town.toyono.osaka.jp/' },
  utashinai: { name: '歌志内市', prefecture: '北海道', officialUrl: 'https://www.city.utashinai.hokkaido.jp/' },
  yoshimi: { name: '吉見町', prefecture: '埼玉県', officialUrl: 'https://www.town.yoshimi.saitama.jp/' },
  yoshino: { name: '吉野町', prefecture: '奈良県', officialUrl: 'https://www.town.yoshino.nara.jp/' },
};

async function main() {
  const dirs = fs.readdirSync(ARTIFACTS_DIR).filter(d => {
    const stat = fs.statSync(path.join(ARTIFACTS_DIR, d));
    return stat.isDirectory() && !d.startsWith('_') && d !== 'sample';
  });

  for (const dir of dirs) {
    const metaPath = path.join(ARTIFACTS_DIR, dir, 'meta.json');
    const info = MUNICIPALITY_INFO[dir];

    if (!info) {
      console.log(`SKIP: ${dir} (no mapping)`);
      continue;
    }

    let meta: Record<string, unknown> = {};

    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    // 不完全なメタ情報を補完
    const needsUpdate = !meta.name || !meta.prefecture;

    if (needsUpdate) {
      meta = {
        id: dir,
        name: info.name,
        prefecture: info.prefecture,
        officialUrl: info.officialUrl || meta.officialUrl,
        createdAt: meta.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: meta.status || 'draft',
        settings: meta.settings || {
          autoPublish: false,
          fetchInterval: 'manual',
        },
      };

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      console.log(`UPDATED: ${dir} -> ${info.name} (${info.prefecture})`);
    } else {
      console.log(`OK: ${dir} (${meta.name})`);
    }
  }
}

main().catch(console.error);
