chrome.tabs.query({}, (tabs) => {
  const pergamumUrl = 'https://pergamumweb.com.br/pergamumweb_ifc';
  const pergamumHomePage = 'https://pergamumweb.com.br/pergamumweb_ifc/home_geral/index.jsp';
  let titulo = document.getElementById('titulo');
  let botoes = document.getElementById('buttons');

  // Função para procurar a aba com o URL do Pergamum
  function searchTab(tabs) {
    for (let tab of tabs) {
      if (tab.url && tab.url.includes(pergamumUrl)) {
        return tab; // Retorna o objeto tab encontrado
      }
    }
    return null; // Retorna null se não encontrar
  }

  let foundTab = searchTab(tabs); // Utiliza a função searchTab para encontrar a aba

  if (!foundTab) {
    chrome.tabs.create({ url: pergamumUrl });
    titulo.textContent = 'Abrindo Pergamum...';
    botoes.style.visibility = 'hidden'; // Esconde os botões enquanto o Pergamum não está aberto
  } else {
    // Verifica se a aba encontrada está na página inicial do Pergamum
    if (foundTab.url !== pergamumHomePage) {
      titulo.textContent = 'Por favor, abra a página inicial do Pergamum';
      botoes.style.display = 'none'; // Esconde os botões se não estiver na página inicial
    } else {
      titulo.textContent = 'Pergamum está aberto';
      botoes.style.display = 'flex'; // Mostra os botões se estiver na página inicial
    }
  }
});