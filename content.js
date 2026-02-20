/**
 * 手動觸發跳過廣告：按 Z 鍵或點擊按鈕執行
 * 因 YouTube 會阻擋程式化 click，改為將廣告影片設到結尾以跳過
 */
const SKIP_AD_SELECTOR = '.ytp-skip-ad-button';
const VIDEO_SELECTOR = 'video.video-stream';
const STORAGE_KEY_POSITION = 'uiPosition';
const STORAGE_KEY_HIDDEN = 'uiHidden';
const LOG_PREFIX = '[YouTube 自動跳過廣告]';

function skipAd() {
  console.log(LOG_PREFIX, '=== 開始執行跳過廣告 ===');
  
  const btn = document.querySelector(SKIP_AD_SELECTOR);
  console.log(LOG_PREFIX, '跳過廣告按鈕:', btn ? '找到' : '未找到', btn);
  
  // 嘗試多個 video 選擇器，優先找正在播放的
  let videos = document.querySelectorAll('video');
  let video = null;
  
  // 優先找有 currentTime 且正在播放的 video
  for (let v of videos) {
    if (v.currentTime > 0 && !v.paused && v.duration > 0) {
      video = v;
      break;
    }
  }
  
  // 如果沒找到播放中的，找第一個有效的 video
  if (!video) {
    for (let v of videos) {
      if (v.duration > 0 && isFinite(v.duration)) {
        video = v;
        break;
      }
    }
  }
  
  // 如果還是沒有，用選擇器找
  if (!video) {
    video = document.querySelector(VIDEO_SELECTOR) || document.querySelector('video.html5-main-video') || document.querySelector('video');
  }
  
  console.log(LOG_PREFIX, '影片元素:', video ? '找到' : '未找到', video);
  
  if (video) {
    console.log(LOG_PREFIX, '影片資訊:', {
      duration: video.duration,
      currentTime: video.currentTime,
      paused: video.paused,
      readyState: video.readyState,
      src: video.src || video.currentSrc
    });
  }

  if (!btn && !video) {
    console.log(LOG_PREFIX, '未發現跳過廣告按鈕或影片元素');
    return false;
  }

  // 優先：把廣告影片設到結尾來跳過
  const duration = video ? video.duration : NaN;
  const durationOk = typeof duration === 'number' && Number.isFinite(duration) && duration > 0;
  
  if (video && durationOk) {
    const oldTime = video.currentTime;
    const targetTime = Math.max(0, duration - 0.1); // 設到最後 0.1 秒，確保為有限數
    
    if (!Number.isFinite(targetTime)) {
      console.warn(LOG_PREFIX, 'targetTime 非有限數，跳過', targetTime);
      return false;
    }
    
    console.log(LOG_PREFIX, '準備設定 currentTime:', oldTime, '->', targetTime);
    
    try {
      video.currentTime = targetTime;
      
      // 等待一下再檢查
      setTimeout(() => {
        const d = video.duration;
        if (Number.isFinite(d) && Math.abs(video.currentTime - targetTime) > 1) {
          try {
            video.currentTime = d;
            console.log(LOG_PREFIX, '重新設定到 duration:', d);
          } catch (e) {
            console.warn(LOG_PREFIX, '重新設定 currentTime 失敗', e);
          }
        }
        console.log(LOG_PREFIX, '設定後 currentTime:', video.currentTime);
      }, 100);
      
      video.dispatchEvent(new Event('timeupdate', { bubbles: true }));
      video.dispatchEvent(new Event('seeked', { bubbles: true }));
      
      if (video.paused) {
        video.play().catch(err => console.log(LOG_PREFIX, '播放失敗:', err));
      }
      
      console.log(LOG_PREFIX, '✓ 已將影片設到結尾以跳過廣告');
      return true;
    } catch (error) {
      console.error(LOG_PREFIX, '設定 currentTime 失敗:', error);
    }
  } else if (video) {
    console.warn(LOG_PREFIX, '影片 duration 無效或未就緒:', video.duration);
  }

  // 備選：嘗試點擊跳過按鈕
  if (btn && typeof btn.click === 'function') {
    console.log(LOG_PREFIX, '嘗試點擊按鈕');
    try {
      // 嘗試多種點擊方式
      btn.click();
      
      // 也嘗試觸發真實的滑鼠事件
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      btn.dispatchEvent(mouseEvent);
      
      console.log(LOG_PREFIX, '✓ 已嘗試程式化點擊');
      return true;
    } catch (error) {
      console.error(LOG_PREFIX, '點擊失敗:', error);
    }
  }

  console.log(LOG_PREFIX, '=== 跳過廣告失敗 ===');
  return false;
}

function createFloatingUI() {
  const ui = document.createElement('div');
  ui.id = 'yt-auto-skip-ui';
  ui.innerHTML = `
    <div style="display: flex; gap: 6px; align-items: center;">
      <button id="yt-auto-skip-execute" style="width: 36px; height: 36px; border: none; border-radius: 50%; background: #0066cc; color: #fff; cursor: pointer; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1.2; white-space: normal; word-break: break-all;">跳過(Z)</button>
      <button id="yt-auto-skip-close" style="width: 36px; height: 36px; border: none; border-radius: 50%; background: #666; color: #fff; cursor: pointer; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1.2; white-space: normal; word-break: break-all;">退出(X)</button>
    </div>
  `;
  
  // 設置基本樣式
  ui.style.cssText = `
    position: fixed;
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #555;
    border-radius: 22px;
    padding: 4px 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: system-ui, sans-serif;
    user-select: none;
    cursor: move;
  `;
  
  // 預設位置
  const defaultTop = 10;
  const defaultRight = 10;
  
  // 從 storage 讀取位置和隱藏狀態
  chrome.storage.local.get([STORAGE_KEY_POSITION, STORAGE_KEY_HIDDEN], (data) => {
    if (data[STORAGE_KEY_HIDDEN]) {
      ui.style.display = 'none';
      return;
    }
    
    if (data[STORAGE_KEY_POSITION]) {
      const pos = data[STORAGE_KEY_POSITION];
      ui.style.top = pos.top + 'px';
      ui.style.left = pos.left + 'px';
      ui.style.right = 'auto';
    } else {
      ui.style.top = defaultTop + 'px';
      ui.style.right = defaultRight + 'px';
    }
  });

  document.body.appendChild(ui);

  // 拖動功能（整個 UI 可拖動）
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  
  ui.addEventListener('mousedown', (e) => {
    // 如果點擊的是按鈕，不拖動
    if (e.target.tagName === 'BUTTON') return;
    
    if (e.button !== 0) return; // 只處理左鍵
    isDragging = true;
    initialX = e.clientX - (ui.offsetLeft || 0);
    initialY = e.clientY - (ui.offsetTop || 0);
    
    ui.style.cursor = 'move';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    // 限制在視窗範圍內
    const maxX = window.innerWidth - ui.offsetWidth;
    const maxY = window.innerHeight - ui.offsetHeight;
    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));
    
    ui.style.left = currentX + 'px';
    ui.style.top = currentY + 'px';
    ui.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      ui.style.cursor = 'move';
      
      // 保存位置
      chrome.storage.local.set({
        [STORAGE_KEY_POSITION]: {
          top: parseInt(ui.style.top) || defaultTop,
          left: parseInt(ui.style.left) || (window.innerWidth - ui.offsetWidth - defaultRight)
        }
      });
    }
  });

  // 跳過廣告按鈕
  document.getElementById('yt-auto-skip-execute').addEventListener('click', (e) => {
    e.stopPropagation();
    console.log(LOG_PREFIX, '點擊「跳過廣告」按鈕');
    skipAd();
  });

  // 退出按鈕（隱藏 UI）
  document.getElementById('yt-auto-skip-close').addEventListener('click', (e) => {
    e.stopPropagation();
    console.log(LOG_PREFIX, '點擊「退出」按鈕，隱藏 UI');
    ui.style.display = 'none';
    chrome.storage.local.set({ [STORAGE_KEY_HIDDEN]: true });
  });

  return ui;
}

function handleKeyPress(e) {
  // 監聽 Z 鍵（keyCode 90 或 code 'KeyZ'）
  if (e.code === 'KeyZ' || e.keyCode === 90) {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (!isInput) {
      console.log(LOG_PREFIX, 'Z 鍵觸發，執行跳過廣告');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      skipAd();
    } else {
      console.log(LOG_PREFIX, 'Z 鍵按下但焦點在輸入框，忽略');
    }
  }
  
  // 監聽 X 鍵（退出）
  if (e.code === 'KeyX' || e.keyCode === 88) {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (!isInput) {
      const ui = document.getElementById('yt-auto-skip-ui');
      if (ui && ui.style.display !== 'none') {
        console.log(LOG_PREFIX, 'X 鍵觸發，隱藏 UI');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        ui.style.display = 'none';
        chrome.storage.local.set({ [STORAGE_KEY_HIDDEN]: true });
      }
    }
  }
}

function init() {
  if (document.getElementById('yt-auto-skip-ui')) return;

  // 檢查是否被隱藏
  chrome.storage.local.get([STORAGE_KEY_HIDDEN], (data) => {
    if (data[STORAGE_KEY_HIDDEN]) {
      console.log(LOG_PREFIX, 'UI 已被隱藏，不顯示');
      return;
    }
    
    const ui = createFloatingUI();
    console.log(LOG_PREFIX, 'content script 已載入，UI 已顯示');
  });

  // 恢復顯示 UI 的函數
  function showUI() {
    let ui = document.getElementById('yt-auto-skip-ui');
    
    if (!ui) {
      // 如果 UI 不存在，重新創建
      ui = createFloatingUI();
    } else {
      // 如果 UI 存在，恢復顯示
      ui.style.display = '';
      chrome.storage.local.get([STORAGE_KEY_POSITION], (data) => {
        if (data[STORAGE_KEY_POSITION]) {
          const pos = data[STORAGE_KEY_POSITION];
          ui.style.top = pos.top + 'px';
          ui.style.left = pos.left + 'px';
          ui.style.right = 'auto';
        }
      });
    }
    
    chrome.storage.local.set({ [STORAGE_KEY_HIDDEN]: false });
    console.log(LOG_PREFIX, 'UI 已恢復顯示');
  }
  
  // 監聽隱藏狀態變化（用於恢復顯示）
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY_HIDDEN]) return;
    
    if (!changes[STORAGE_KEY_HIDDEN].newValue) {
      // 恢復顯示
      showUI();
    }
  });
  
  // 監聽來自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showUI') {
      showUI();
      sendResponse({ success: true });
      return true;
    }
  });

  document.addEventListener('keydown', handleKeyPress, true);
  console.log(LOG_PREFIX, '已監聽 Z 鍵（跳過）和 X 鍵（退出）');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
