const COMMAND_NAME = 'save-selection-as-txt';

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_NAME) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const [{ result: selectedText } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString() || ''
  });

  const text = (selectedText || '').trim();
  if (!text) {
    console.warn('Не найден выделенный текст для сохранения.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `selected-text-${timestamp}.txt`;
  const url = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;

  await chrome.downloads.download({
    url,
    filename,
    saveAs: true
  });
});
