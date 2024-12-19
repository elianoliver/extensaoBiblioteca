chrome.tabs.query({}, (tabs) => {
    const pergamumUrl = 'https://pergamumweb.com.br/pergamumweb_ifc';
    const pergamumHomePage = 'https://pergamumweb.com.br/pergamumweb_ifc/home_geral/index.jsp';
    let titulo = document.getElementById('titulo');
    let botoesContainer = document.querySelector('.button-grid'); // Usando a classe que criamos

    // 1º Função para procurar a aba com o URL do Pergamum
    let foundTab = searchTab(tabs);

    // Função para procurar
    function searchTab(tabs) {
        for (let tab of tabs) {
            if (tab.url && tab.url.includes(pergamumUrl)) {
                return tab;
            }
        }
        return false;
    }

    // 2º Verifica se a aba foi encontrada
    if (!foundTab) {
        chrome.tabs.create({ url: pergamumUrl });
        titulo.textContent = 'Abrindo Pergamum...';
        if (botoesContainer) {
            botoesContainer.style.visibility = 'hidden';
        }
    } else {
        // Verifica se a aba encontrada está na página inicial do Pergamum
        if (foundTab.url !== pergamumHomePage) {
            titulo.textContent = 'Por favor, abra a página inicial do Pergamum';
            if (botoesContainer) {
                botoesContainer.style.display = 'none';
            }
        } else {
            if (botoesContainer) {
                botoesContainer.style.display = 'grid'; // Mantém o grid layout que definimos
            }
        }
    }
});