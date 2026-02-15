const KEY_ENABLED = 'autoSkipEnabled';

document.getElementById('btnStart').addEventListener('click', () => setEnabled(true));
document.getElementById('btnStop').addEventListener('click', () => setEnabled(false));

function setEnabled(enabled) {
  chrome.storage.local.set({ [KEY_ENABLED]: enabled }, updateUI);
}

function updateUI() {
  chrome.storage.local.get([KEY_ENABLED], (data) => {
    const enabled = data[KEY_ENABLED] !== false;
    document.getElementById('btnStart').disabled = enabled;
    document.getElementById('btnStop').disabled = !enabled;
    document.getElementById('status').textContent = enabled ? '已開啟（正在偵測）' : '已停止';
  });
}

updateUI();
