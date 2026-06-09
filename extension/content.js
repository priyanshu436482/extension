chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageText") {
    const text = document.body?.innerText || document.documentElement?.innerText || "";
    sendResponse({ text });
  }
  return true;
});
