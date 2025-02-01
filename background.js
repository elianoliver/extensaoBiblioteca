// ABRINDO SIDEPANEL
chrome.action.onClicked.addListener((tab) => {
    // Abre o Side Panel ao clicar no ícone da extensão
    chrome.sidePanel.open({ windowId: tab.windowId });
});