chrome.action.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("dist/index.html") });
});