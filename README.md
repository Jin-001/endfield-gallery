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

## Google 相簿每日同步

相簿來源設定於 `album-config.json`，目前使用 https://photos.app.goo.gl/ksexQQETNyVHLbty9 。
Actions 每天台灣時間 00:00（UTC 16:00）同步，也可由 Actions 的 Run workflow 手動執行；推送 main 也會同步部署。GitHub 排程可能延遲，並非保證準時執行。

以 Google 照片 ID 判斷是否已下載；已知 ID 且本機檔案雜湊正確時完全不下載圖片。新 ID 必須下載一次才能用 SHA-256 比較內容，相同內容只保留一份。首次同步也需下載以建立 ID 對照，既有 images 中相同位元組的圖片會沿用。此功能不是視覺相似圖片辨識；相同 ID 的遠端編輯目前不會重新下載。

圖片與 ID 紀錄存在 GitHub Actions 快取，不自動寫入 main。快取遭清除或淘汰後會重新下載。產出的 `_site` 才會部署，網站清單依完整相簿內容更新，移除的照片不再出現在新部署中。

採非官方分享頁解析；需保持相簿可透過連結讀取。遇到 Google 格式變更、空相簿、影片或分頁未完整取得時，流程會失敗並保留上一版部署，不會清空網站。目前只支援分享頁首批即可完整取得的相簿；超過首批容量需另行實作分頁。關閉分享也會保留上一版，若需下架請另外停用 Pages。

測試：`node --test scripts/sync-album.test.mjs`（Node.js 22 以上）。變更合併至 main 後排程才會生效；公開儲存庫長期無活動時 GitHub 可能停用排程，屆時需在 Actions 重新啟用。
