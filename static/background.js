// Permite que o Side Panel abra ao clicar no ícone da extensão
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));