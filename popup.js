document.addEventListener('DOMContentLoaded', () => {
    const pergamumUrl = 'https://pergamumweb.com.br/pergamumweb_ifc';
    const pergamumHomePage = 'https://pergamumweb.com.br/pergamumweb_ifc/home_geral/index.jsp';

    const dtidInput = document.getElementById('dtid');
    const uuidInput = document.getElementById('uuid');
    const btnVerificar = document.getElementById('btnVerificar');

    //=================================================================
    // 1. INICIALIZAÇÃO E VERIFICAÇÃO DO LOCALSTORAGE
    //=================================================================
    if (!localStorage.getItem('config')) {
        localStorage.setItem('config', JSON.stringify({
            dtid: '',
            uuid: ''
        }));
    }

    // Carrega configuração salva
    let config = JSON.parse(localStorage.getItem('config'));
    dtidInput.value = config.dtid || '';
    uuidInput.value = config.uuid || '';

    //=================================================================
    // 2. FUNÇÕES DE GERENCIAMENTO DE CONFIGURAÇÃO
    //=================================================================
    function salvarConfig(newUuid = null) {
        // Always get the latest config before saving
        config = JSON.parse(localStorage.getItem('config'));
        const updatedConfig = {
            dtid: dtidInput.value.trim(),
            uuid: newUuid || config.uuid || ''
        };
        localStorage.setItem('config', JSON.stringify(updatedConfig));
        config = updatedConfig; // Update the current config reference
    }

    //=================================================================
    // 3. CONFIGURAÇÃO DOS EVENT LISTENERS
    //=================================================================
    // Salvar DTID quando alterado
    dtidInput.addEventListener('change', () => salvarConfig());

    // Event listener para o botão verificar
    btnVerificar.addEventListener('click', () => {
        const dtid = dtidInput.value.trim();

        if (!dtid) {
            alert('Por favor, preencha o campo DTID.');
            return;
        }

        // Busca todas as abas abertas
        chrome.tabs.query({}, (tabs) => {
            const pergamumTab = tabs.find(tab => tab.url.includes('pergamumweb.com.br'));

            if (!pergamumTab) {
                alert('Nenhuma aba com o Pergamum encontrada.');
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: pergamumTab.id },
                function: capturarUUID
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }

                const uuid = results[0].result;
                if (!uuid) {
                    alert('Não foi possível capturar o UUID. Certifique-se de que está na página inicial do Pergamum.');
                    return;
                }

                // Salva configuração com novo UUID e navega
                salvarConfig(uuid);
                window.location.href = 'dashboard/dashboard.html';
            });
        });
    });

    //=================================================================
    // 4. VERIFICAÇÃO DO ESTADO DO PERGAMUM
    //=================================================================
    chrome.tabs.query({}, (tabs) => {
        let foundTab = searchTab(tabs);

        if (!foundTab) {
            chrome.tabs.create({ url: pergamumUrl });
            dtidInput.disabled = true;
            btnVerificar.disabled = true;
        } else if (foundTab.url !== pergamumHomePage) {
            dtidInput.disabled = true;
            btnVerificar.disabled = true;
            alert('Por favor, abra a página inicial do Pergamum');
        }
    });
});

//=================================================================
// 5. FUNÇÕES AUXILIARES
//=================================================================
// Função para procurar a aba do Pergamum
function searchTab(tabs) {
    const pergamumUrl = 'https://pergamumweb.com.br/pergamumweb_ifc';
    return tabs.find(tab => tab.url && tab.url.includes(pergamumUrl)) || false;
}

// Função que será executada na página do Pergamum para capturar o UUID
function capturarUUID() {
    try {
        const iframe = document.getElementById('id_meio');
        if (!iframe) return null;

        const uuidInput = iframe.contentDocument.evaluate(
            "/html/body/div[1]/div/div/div[1]/table/tbody/tr/td/table/tbody/tr/td[3]/input",
            iframe.contentDocument,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        return uuidInput ? uuidInput.id : null;
    } catch (error) {
        console.error('Erro ao capturar UUID:', error);
        return null;
    }
}