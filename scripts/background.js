chrome.tabs.onUpdated.addListener(function (_, changeInfo, tab) {
    if (tab.url.includes('youtube.com/watch') && changeInfo.status === 'complete')
      chrome.tabs.sendMessage(_, { activate: true });
  });