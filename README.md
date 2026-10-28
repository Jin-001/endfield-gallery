# ENDFIELD — AkiOne 的攝影手記

瀏覽 Arknights: Endfield 遊戲攝影集：

[開啟攝影網站](https://jin-001.github.io/endfield-gallery/)

## English

Explore a collection of in-game photography from **Arknights: Endfield**, capturing scenery and moments from the journey.

[Visit the photography gallery](https://jin-001.github.io/endfield-gallery/)

## 專案說明

收錄 EndField-1-001 的全部 16 張原始 PNG。純 HTML、CSS、JavaScript，支援手機版、相片燈箱、左右方向鍵、觸控滑動與排序。

以靜態 HTTP 伺服器預覽，例如 `python -m http.server 4173`。推送至 main 後由 GitHub Actions 部署 GitHub Pages。

圖片為個人遊戲攝影；遊戲內容及商標權利屬各自權利人。本專案不額外授予圖片的轉載授權。

## Google 相簿每日更新圖片網址

來源設定於 `album-config.json`。每天台灣時間 00:00（UTC 16:00）解析分享相簿，更新遠端圖片網址清單並部署；GitHub 排程可能延遲。推送 main 或手動 Run workflow 也會更新。

攝影集圖片由訪客瀏覽器直接向 Google 載入，不下載圖片、不建立 Actions 圖片快取，也不將相簿照片寫回 main。首頁指定背景沿用儲存庫內既有圖片。檢視原圖使用 Google 原圖連結。

每天重新取得網址；分享頁圖片連結沒有永久有效保證，若在下次更新前失效仍可能破圖。採非官方分享頁解析，目前不支援分頁或影片；解析失敗時不部署，保留上一次網站。關閉相簿分享不保證立即下架已發布內容。

以照片 ID 去重，不再下載內容進行雜湊比對。相簿移除的照片會在下次成功更新清單後移除。照片總數由清單自動顯示。

測試：`node --test scripts/sync-album.test.mjs`（Node.js 22 以上）。
