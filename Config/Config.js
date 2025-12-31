const logCountElement = document.getElementById("logCount");
const upgradeButton = document.getElementById("upgradeButton");
const backButton = document.getElementById("backButton");
const discordLink = document.getElementById("discordLink");

if (logCountElement) {
    chrome.runtime.sendMessage(
        { type: "GET_TOTAL_LOG_COUNT_FROM_DISCORD_MESSAGE_LOGGER" },
        response => {
            if (response?.count && response.count != null) {
                logCountElement.textContent = response.count + " / 500";
            } else {
                logCountElement.textContent = "Open discord to get log counts";
            }
        }
    );
}

if (upgradeButton) {
    upgradeButton.addEventListener("click", () => {
        window.location.href = "Plan.html";
    });
}

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "Index.html";
    });
}

if (discordLink) {
    discordLink.addEventListener("click", () => {
        window.open("https://discord.gg/pUKDF2adMw", "_blank");
    });
}
