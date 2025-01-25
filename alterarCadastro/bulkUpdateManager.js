// bulkUpdateManager.js

class BulkUpdateManager {
    constructor() {
        this.btnAlterar = document.getElementById('btnAlterar');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.btnAlterar) {
            this.btnAlterar.addEventListener('click', () => this.processarAlteracoes());
        }
    }

    async processarAlteracoes() {
        try {
            const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
            const situacaoSelect = document.getElementById('situacao');
            const situacaoText = situacaoSelect.options[situacaoSelect.selectedIndex].text;

            if (matriculas.length === 0) {
                alert('Nenhuma matrícula encontrada no localStorage.');
                return;
            }

            if (situacaoSelect.value === '0') {
                alert('Por favor, selecione uma situação.');
                return;
            }

            chrome.tabs.query({}, async (tabs) => {
                const pergamumTab = tabs.find(tab => tab.url.includes('pergamumweb.com.br'));

                if (!pergamumTab) {
                    alert('Nenhuma aba com o Pergamum encontrada.');
                    return;
                }

                for (const matricula of matriculas) {
                    await this.processarMatricula(pergamumTab.id, matricula, situacaoText);
                }

                alert('Processamento concluído!');
            });

        } catch (error) {
            console.error('Erro ao processar alterações:', error);
            alert('Erro ao processar alterações: ' + error.message);
        }
    }

    async processarMatricula(tabId, matricula, situacaoText) {
        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: alterarMatriculaNoIframe,
                args: [matricula, situacaoText]
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }

                const result = results[0].result;
                if (result.error) {
                    console.error(`Erro ao processar matrícula ${matricula}:`, result.error);
                    reject(result.error);
                } else {
                    console.log(`Matrícula ${matricula} processada com sucesso`);
                    resolve(result);
                }
            });
        });
    }
}

// Função que será injetada na página do Pergamum
function alterarMatriculaNoIframe(matricula, situacaoText) {
    return new Promise((resolve) => {
        try {
            const iframe = document.getElementById('id_meio');
            if (!iframe) throw new Error('Iframe não encontrado');

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // Função auxiliar para pegar elementos por XPath
            const getElementByXPath = (path, doc) => {
                return doc.evaluate(
                    path,
                    doc,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
            };

            // Função para aguardar
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Função para simular a perda de foco
            const simularBlur = (element) => {
                element.dispatchEvent(new Event('blur', { bubbles: true }));
                element.blur(); // Chamada nativa do blur
            };

            // Função para aguardar o popup aparecer
            const aguardarPopup = async () => {
                for (let i = 0; i < 10; i++) {
                    const popup = getElementByXPath('/html/body/div[4]', iframeDoc);
                    if (popup && popup.classList.contains('z-combobox-popup')) {
                        console.log('Popup encontrado!');
                        return popup;
                    }
                    console.log('Aguardando popup aparecer...');
                    await delay(300);
                }
                throw new Error('Timeout aguardando popup');
            };

            // Processo assíncrono de alteração
            (async () => {
                console.log(`Iniciando processamento da matrícula ${matricula}`);

                // 1. Preencher matrícula
                const inputMatricula = getElementByXPath(
                    '/html/body/div[1]/div/div/div[1]/table/tbody/tr/td/table/tbody/tr/td[3]/input',
                    iframeDoc
                );
                if (!inputMatricula) throw new Error('Campo de matrícula não encontrado');

                // Focar no input primeiro
                inputMatricula.focus();

                // Preencher o valor
                inputMatricula.value = matricula;

                // Disparar os eventos necessários
                inputMatricula.dispatchEvent(new Event('input', { bubbles: true }));
                inputMatricula.dispatchEvent(new Event('change', { bubbles: true }));

                // Simular a perda de foco
                simularBlur(inputMatricula);
                console.log('Matrícula preenchida e Tab simulado');

                // Aguardar carregar os dados
                await delay(2000);

                // 2. Clicar no input de situação para abrir o popup
                const inputSituacao = getElementByXPath(
                    '/html/body/div[1]/div/div/div[4]/div[2]/div[1]/div[3]/div[3]/table/tbody[1]/tr[2]/td[4]/div/span/input',
                    iframeDoc
                );
                if (!inputSituacao) throw new Error('Campo de situação não encontrado');

                inputSituacao.click();
                console.log('Campo situação clicado');

                // 3. Aguardar e encontrar o popup
                const popup = await aguardarPopup();
                console.log('Processando popup');

                // 4. Encontrar e clicar no item correto
                const items = popup.querySelectorAll('.z-comboitem');
                let itemEncontrado = false;

                for (const item of items) {
                    const textSpan = item.querySelector('.z-comboitem-text');
                    if (textSpan && textSpan.textContent.trim() === situacaoText) {
                        console.log(`Item "${situacaoText}" encontrado, clicando...`);
                        item.click();
                        itemEncontrado = true;
                        break;
                    }
                }

                if (!itemEncontrado) {
                    throw new Error(`Opção "${situacaoText}" não encontrada no popup`);
                }

                await delay(1000);

                // 5. Clicar no botão alterar
                const btnAlterar = getElementByXPath(
                    '/html/body/div[1]/div/div/div[1]/div/div[1]/button[2]',
                    iframeDoc
                );
                if (!btnAlterar) throw new Error('Botão alterar não encontrado');

                btnAlterar.click();
                console.log('Botão alterar clicado');

                await delay(1000);

                // 6. Confirmar alteração
                const btnConfirmar = getElementByXPath(
                    '/html/body/div[5]/div[2]/div[2]/div/button',
                    iframeDoc
                );
                if (!btnConfirmar) throw new Error('Botão confirmar não encontrado');

                btnConfirmar.click();
                console.log('Alteração confirmada');

                await delay(1500);

                resolve({ success: true, matricula });
            })();

        } catch (error) {
            resolve({ error: error.message, matricula });
        }
    });
}

export { BulkUpdateManager };