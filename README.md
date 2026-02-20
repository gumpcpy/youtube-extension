# YouTube 自動跳過廣告 (Chrome Extension)

Chrome 擴充功能：在 YouTube 頁面上顯示浮動控制視窗，按**Z 鍵**或點擊按鈕手動觸發跳過廣告。

## 安裝方式

1. 開啟 Chrome，網址列輸入 `chrome://extensions/`
2. 開啟右上角「**開發人員模式**」
3. 點「**載入未封裝項目**」
4. 選擇本專案資料夾 `youtube_extension`
5. 擴充功能會出現在列表中，保持啟用即可

## 使用方式

1. 進入 **www.youtube.com** 任一頁面，右上角會出現**浮動控制視窗**
2. 點「**開始**」啟用功能（狀態會顯示「已開始（按 Z 鍵觸發）」）
3. 當看到廣告時，有兩種方式跳過：
   - **按 Z 鍵**：快速觸發跳過廣告
   - **點擊「跳過廣告 (Z)」按鈕**：直接執行跳過
4. 點「**停止**」可暫停功能

## 檔案說明

- **manifest.json** — 擴充功能設定（Manifest V3）、storage 權限
- **content.js** — 注入浮動 UI、監聽 Z 鍵；按下時設定 `video.currentTime = video.duration` 以跳過廣告
- **popup.html / popup.js** — （可選）工具列彈出視窗，功能與浮動 UI 相同

## 注意事項

- 僅在 **https://www.youtube.com/** 底下生效
- Z 鍵只在「開始」狀態且焦點不在輸入框時才會觸發跳過廣告
- 若 YouTube 日後改版、按鈕的 class 或結構改變，可能需要更新選擇器
- 浮動 UI 會固定在頁面右上角，不會隨頁面滾動移動
