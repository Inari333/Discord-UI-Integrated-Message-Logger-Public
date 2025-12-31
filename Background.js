chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_TOTAL_LOG_COUNT_FROM_DISCORD_MESSAGE_LOGGER") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab?.id) {
                sendResponse({ count: null });
                return;
            }

            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_TOTAL_LOG_COUNT" },
                response => {
                    sendResponse(response || { count: null });
                }
            );
        });

        return true; // keep channel open (IMPORTANT)
    }
});