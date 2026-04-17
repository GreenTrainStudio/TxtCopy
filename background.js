const COMMAND_NAME = 'save-selection-as-txt';

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_NAME) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      const active = document.activeElement;
      const isFileInput =
        active instanceof HTMLInputElement &&
        active.type === 'file' &&
        !active.disabled &&
        !active.readOnly;

      if (!isFileInput) {
        return { ok: false, reason: 'no_file_input_focused' };
      }

      let clipboardText = '';
      try {
        clipboardText = await navigator.clipboard.readText();
      } catch {
        return { ok: false, reason: 'clipboard_unavailable' };
      }

      const text = clipboardText.trim();
      if (!text) {
        return { ok: false, reason: 'clipboard_empty' };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([text], `clipboard-${timestamp}.txt`, {
        type: 'text/plain'
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      active.files = dataTransfer.files;

      active.dispatchEvent(new Event('input', { bubbles: true }));
      active.dispatchEvent(new Event('change', { bubbles: true }));

      return { ok: true, filename: file.name };
    }
  });

  if (!result?.ok) {
    console.warn('Не удалось вставить TXT-файл в поле загрузки:', result?.reason || 'unknown');
  }
});
