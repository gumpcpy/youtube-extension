const STORAGE_KEY_HIDDEN = 'uiHidden';

document.getElementById('btnShow').addEventListener('click', () => {
  // 清除隱藏狀態，讓 content script 顯示 UI
  chrome.storage.local.set({ [STORAGE_KEY_HIDDEN]: false }, () => {
    // 發送消息給 content script 讓它立即顯示 UI
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showUI' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('發送消息失敗:', chrome.runtime.lastError);
          }
        });
      }
    });
  });
});
