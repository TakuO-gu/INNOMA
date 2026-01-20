/**
 * Test isOfficialDomain function
 */

import { isOfficialDomain } from '../lib/llm/google-search';

const testUrls = [
  // 公式ドメイン
  'https://www.city.takaoka.toyama.jp/index.html',
  'https://www.city.aogashima.tokyo.jp/',
  'https://www.town.karuizawa.lg.jp/',
  'https://www.vill.otari.nagano.jp/',
  'https://www.pref.toyama.jp/',
  'https://www.soumu.go.jp/',
  'https://example.lg.jp/',
  'https://example-city.jp/',
  'https://takaoka-shi.jp/',
  'https://city.takaoka.toyama.jp/',
  // 非公式ドメイン
  'https://www.google.com/',
  'https://example.com/',
  'https://ja.wikipedia.org/',
  // 無効なURL
  'invalid-url',
  '',
];

console.log('isOfficialDomain tests:\n');
for (const url of testUrls) {
  const result = isOfficialDomain(url);
  const status = result ? '✓' : '✗';
  console.log(`  ${status} ${url.padEnd(50)} => ${result}`);
}
