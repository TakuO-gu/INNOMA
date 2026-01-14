Crawlerで取得したDOMを元にそのページがService pageかGuide pageかStep-by-step pageかその他を判断するスクリプト。

使うLLMはGemini APIで判断の基準は
1. 1ページで読了できる長さのページ->Servicepage
2. 1ページで読了できない、複数ページへのリンクをまとめるページ->Guide page
3. 1ページで読了できない、明確な開始点と終了点があり、タスクを決まった順序で完了する必要がある手続き->Step-by-step page
4. その他

使うLLMはGemini APIです。
