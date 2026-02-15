# YouTube 自動跳過廣告 (Chrome Extension)

Chrome 擴充功能：在 YouTube 播放頁面每秒偵測一次，若出現「跳過廣告」按鈕（`class="ytp-skip-ad-button"`）就自動點擊。

## 安裝方式

1. 開啟 Chrome，網址列輸入 `chrome://extensions/`
2. 開啟右上角「**開發人員模式**」
3. 點「**載入未封裝項目**」
4. 選擇本專案資料夾 `youtube_extension`
5. 擴充功能會出現在列表中，保持啟用即可

## 使用方式

1. 點工具列上的擴充功能圖示，在彈出視窗中按「**開始**」才會開始偵測；按「**停止**」可暫停。
2. 在 **www.youtube.com** 看影片時，若為「開始」狀態，每秒會檢查是否出現可跳過的廣告；發現時會**把廣告影片設到結尾**以跳過（因 YouTube 會阻擋程式化點擊）。

## 檔案說明

- **manifest.json** — 擴充功能設定（Manifest V3）、popup、storage 權限
- **popup.html / popup.js** — 開始／停止按鈕，狀態存於 `chrome.storage.local`
- **content.js** — 僅在「開始」時每秒偵測；發現 `.ytp-skip-ad-button` 時設定 `video.currentTime = video.duration` 以跳過廣告

## 注意事項

- 僅在 **https://www.youtube.com/** 底下生效
- 若 YouTube 日後改版、按鈕的 class 或結構改變，可能需要更新選擇器
