/**
 * 每秒偵測頁面，若出現「跳過廣告」按鈕則嘗試跳過（僅在「開始」時執行）
 * 因 YouTube 會阻擋程式化 click，改為將廣告影片設到結尾以跳過
 */
const SKIP_AD_SELECTOR = '.ytp-skip-ad-button';
const VIDEO_SELECTOR = 'video.video-stream';
const CHECK_INTERVAL_MS = 1000;
const STORAGE_KEY_ENABLED = 'autoSkipEnabled';
const LOG_PREFIX = '[YouTube 自動跳過廣告]';

let intervalId = null;
let checkCount = 0;

function trySkipAd() {
  checkCount += 1;
  const btn = document.querySelector(SKIP_AD_SELECTOR);
  const video = document.querySelector(VIDEO_SELECTOR);

  if (!btn) {
    if (checkCount % 10 === 1) {
      console.log(LOG_PREFIX, '偵測中… 第', checkCount, '次，尚未發現跳過廣告按鈕');
    }
    return;
  }

  console.log(LOG_PREFIX, '發現跳過廣告按鈕，第', checkCount, '次');

  // YouTube 會擋程式化 click（isTrusted），改為把廣告影片設到結尾來跳過
  if (video && typeof video.duration === 'number' && isFinite(video.duration)) {
    const oldTime = video.currentTime;
    video.currentTime = video.duration;
    console.log(LOG_PREFIX, '已將影片設到結尾以跳過廣告 (currentTime:', oldTime, '->', video.duration, ')');
    return;
  }

  // 若沒有 video 或 duration 無效，仍嘗試點擊（部分環境可能有效）
  if (typeof btn.click === 'function') {
    btn.click();
    console.log(LOG_PREFIX, '已嘗試程式化點擊（若無效請依賴上方影片結尾方式）');
  }
}

function startWatching() {
  if (intervalId) return;
  checkCount = 0;
  console.log(LOG_PREFIX, '已開始偵測');
  intervalId = setInterval(trySkipAd, CHECK_INTERVAL_MS);
  trySkipAd();
}

function stopWatching() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log(LOG_PREFIX, '已停止偵測');
  }
}

function applyEnabled(enabled) {
  if (enabled) startWatching();
  else stopWatching();
}

chrome.storage.local.get([STORAGE_KEY_ENABLED], (data) => {
  const enabled = data[STORAGE_KEY_ENABLED] !== false;
  console.log(LOG_PREFIX, 'content script 已載入，狀態:', enabled ? '已開啟' : '已停止');
  applyEnabled(enabled);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEY_ENABLED]) return;
  applyEnabled(changes[STORAGE_KEY_ENABLED].newValue !== false);
});
