chrome.tabs.query({}, (tabs) => {
    const pergamumUrl = 'https://pergamumweb.com.br/pergamumweb_ifc';
    const pergamumHomePage = 'https://pergamumweb.com.br/pergamumweb_ifc/home_geral/index.jsp';
    let titulo = document.getElementById('titulo');
    let botoes = document.getElementById('buttons');

    // 1º Função para procurar a aba com o URL do Pergamum
    let foundTab = searchTab(tabs); // Utiliza a função searchTab para encontrar a aba

    // Função para procurar
    function searchTab(tabs) {
        for (let tab of tabs) {
            if (tab.url && tab.url.includes(pergamumUrl)) {
                return tab; // Retorna o objeto tab encontrado
            }
        }
        return false; // Retorna false se não encontrar
    }

    // 2º Verifica se a aba foi encontrada.
    // Se não, abre uma nova aba.
    // Se sim, verifica se está na página inicial do Pergamum
    if (!foundTab) {
        chrome.tabs.create({ url: pergamumUrl });
        titulo.textContent = 'Abrindo Pergamum...';
        botoes.style.visibility = 'hidden';
    } else {
        // Verifica se a aba encontrada está na página inicial do Pergamum
        if (foundTab.url !== pergamumHomePage) {
            titulo.textContent = 'Por favor, abra a página inicial do Pergamum';
            botoes.style.display = 'none'; // Esconde os botões se não estiver na página inicial
        } else {
            botoes.style.display = 'flex'; // Mostra os botões se estiver na página inicial
        }
    }
});