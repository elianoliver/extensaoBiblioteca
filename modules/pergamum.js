class PergamumCadastro {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            document.getElementById("cadastrarAlunos").addEventListener("click", () => {
                this.processarCadastros();
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async processarCadastros() {
        try {
            const dadosPlanilha = await this.acessarPlanilha();
            await this.cadastrarUsuariosSequencialmente(dadosPlanilha);
        } catch (error) {
            console.error('Erro ao processar cadastros:', error);
            alert('Erro ao processar cadastros: ' + error.message);
        }
    }

    async acessarPlanilha() {
        const apiKey = "AIzaSyBB7KyxfvyPIz_NkuoXKc4CDtfHTHI7RbI";
        const sheetId = "1luAS2zzqX98O6o4R_sDVk0q7aYhgLyiu2S-s8NLVTbw";
        const range = "C1:M1000";

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);

        const data = await response.json();
        if (!data.values) throw new Error('Nenhum dado retornado.');

        return data.values.slice(1).map(row => ({
            matricula: row[1]?.trim() || "",
            nome: row[2]?.trim() || "",
            cpf: row[3]?.trim() || "",
            telefone: row[4]?.trim() || "",
            email: row[5]?.trim() || "",
            curso: row[6]?.trim() || "",
            anos: row[7]?.trim() || "",
            codigo: row[8]?.trim() || "",
            categoria: row[9]?.trim() || "",
            anoVigente: row[10]?.trim() || ""
        }));
    }

    // Modifique o loop principal em cadastrarUsuariosSequencialmente:
    async cadastrarUsuariosSequencialmente(usuarios) {
        const url = "https://pergamumweb.com.br/pergamumweb_ifc/usuario/cadastro_pessoa.zul";

        for (const usuario of usuarios) {
            let tab;
            try {
                // Abrir nova aba para cada usuário
                tab = await new Promise((resolve) => {
                    chrome.tabs.create({ url }, (tab) => {
                        resolve(tab);
                    });
                });

                await new Promise((resolve) => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                        if (tabId === tab.id && changeInfo.status === "complete") {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    });
                });

                // Execute o cadastro
                const resultado = await this.cadastrarUsuarioNoPergamum(tab.id, usuario);
                if (resultado.error) throw new Error(resultado.error);

                await this.delay(3000);
            } catch (error) {
                console.error(`Erro em ${usuario.nome}:`, error);
                break;
            } finally {
                // Fechar aba após cada cadastro
                if (tab && tab.id) {
                    chrome.tabs.remove(tab.id);
                    await this.delay(1000); // Espera para garantir fechamento
                }
            }
        }
    }

    cadastrarUsuarioNoPergamum(tabId, dadosUsuario) {
        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId },
                func: async (dados) => {
                    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                    const simularBlur = (element) => {
                        element.dispatchEvent(new Event('blur', { bubbles: true }));
                        element.blur();
                    };

                    const getElementByXPath = (path) => {
                        return document.evaluate(
                            path,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                    };

                    const aguardarPopupAlerta = async () => {
                        const xpaths = [
                            '/html/body/div[4]/div[2]/div[2]/div/button',
                            '/html/body/div[5]/div[2]/div[2]/div/button'
                        ];

                        for (let i = 0; i < 5; i++) {
                            for (const xpath of xpaths) {
                                const popup = getElementByXPath(xpath);
                                if (popup) {
                                    popup.click();
                                    await delay(500);
                                    return;
                                }
                            }
                            await delay(300);
                        }
                    };

                    // Adicionar função de validação
                    const isInvalidField = (value) => {
                        if (!value) return true;
                        if (value === '#N/A') return true;
                        if (/^\|+$/.test(value)) return true;
                        return false;
                    };

                    try {
                        // Processo principal (IIFE pattern)
                        await (async () => {
                            // Passo 0 - Preencher matrícula
                            const matricula = getElementByXPath('/html/body/div[1]/div/div/div[1]/table/tbody/tr/td/table/tbody/tr/td[3]/input');
                            if (!matricula) throw new Error('Campo de matrícula não encontrado');

                            matricula.focus();
                            matricula.value = dados.matricula;
                            matricula.dispatchEvent(new Event('input', { bubbles: true }));
                            matricula.dispatchEvent(new Event('change', { bubbles: true }));
                            simularBlur(matricula);
                            await delay(2000);

                            // Tratar alerta se existir
                            await aguardarPopupAlerta();

                            // Passo 1 - Preencher nome
                            const nomeUsuario = getElementByXPath('/html/body/div[1]/div/div/div[1]/table/tbody/tr/td/table/tbody/tr/td[7]/input');
                            if (!nomeUsuario) throw new Error('Campo de nome não encontrado');

                            nomeUsuario.focus();
                            nomeUsuario.value = dados.nome;
                            nomeUsuario.dispatchEvent(new Event('input', { bubbles: true }));
                            simularBlur(nomeUsuario);
                            await delay(1000);

                            // Clicar em Inserir
                            const btInserir = getElementByXPath('/html/body/div[1]/div/div/div[1]/div/div[1]/button[1]');
                            if (!btInserir) throw new Error('Botão "Inserir" não encontrado');
                            btInserir.click();
                            await delay(1500);

                            await aguardarPopupAlerta();

                            // Passo 2 - Informações Básicas
                            const telefone = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[1]/div[1]/div[3]/table/tbody[1]/tr[3]/td[2]/div/input');
                            const cpf = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[1]/div[1]/div[3]/table/tbody[1]/tr[5]/td[2]/div/input');
                            const email = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[1]/div[1]/div[3]/table/tbody[1]/tr[10]/td/input');

                            // Limpar campos inválidos
                            telefone.focus();
                            telefone.value = isInvalidField(dados.telefone) ? '' : dados.telefone;
                            simularBlur(telefone);
                            cpf.focus();
                            cpf.value = isInvalidField(dados.cpf) ? '' : dados.cpf;
                            simularBlur(cpf);
                            email.focus();
                            email.value = isInvalidField(dados.email) ? '' : dados.email;
                            simularBlur(email);

                            // Log de campos limpos
                            const camposLimpos = [];
                            if (isInvalidField(dados.telefone)) camposLimpos.push('Telefone');
                            if (isInvalidField(dados.cpf)) camposLimpos.push('CPF');
                            if (isInvalidField(dados.email)) camposLimpos.push('Email');

                            if (camposLimpos.length > 0) {
                                console.log(`Campos limpos para ${dados.nome}: ${camposLimpos.join(', ')}`);
                            }

                            await delay(500);

                            // categoria do usuário
                            const categoria = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[1]/div[3]/div[3]/table/tbody[1]/tr[1]/td[4]/div/span/input');
                            categoria.click();
                            await delay(500);

                            const selectCategoria = getElementByXPath('/html/body/div[3]/ul');
                            if (!selectCategoria) throw new Error('Lista de categorias não encontrada');

                            // Obter opções válidas (ignorando a primeira li vazia)
                            const opcoesCategoria = Array.from(selectCategoria.querySelectorAll('li'))
                                .filter(li => li.textContent.trim() !== '');

                            // Normalizar espaços não quebráveis (&nbsp;) e buscar a opção correspondente
                            const categoriaDesejada = dados.categoria; // Exemplo: "10 - Aluno - EAD"
                            const opcaoSelecionada = opcoesCategoria.find(li => {
                                const textoNormalizado = li.textContent
                                    .replace(/\u00A0/g, ' ')  // Substitui &nbsp; por espaço comum
                                    .trim();
                                return textoNormalizado === categoriaDesejada;
                            });

                            if (!opcaoSelecionada) {
                                throw new Error(`Categoria "${categoriaDesejada}" não encontrada na lista`);
                            }

                            opcaoSelecionada.click();
                            await delay(1500);

                            // Clicar em Alterar
                            const btAlterar = getElementByXPath('/html/body/div[1]/div/div/div[1]/div/div[1]/button[2]');
                            if (!btAlterar) throw new Error('Botão "Alterar" não encontrado');
                            btAlterar.click();
                            await delay(1500);

                            await aguardarPopupAlerta();

                            // Passo 3 - Validade
                            const btValidade = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[1]/ul/li[3]/a/span');
                            if (!btValidade) throw new Error('Aba "Validade" não encontrada');
                            btValidade.click();
                            await delay(1000);

                            const inputValidade = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[3]/div[1]/div[3]/table/tbody[1]/tr/td[2]/div/table/tbody/tr/td/table/tbody/tr/td[1]/span/input');
                            inputValidade.focus();
                            await delay(500);
                            inputValidade.value = "31/12/2025";
                            inputValidade.dispatchEvent(new Event('input', { bubbles: true }));
                            simularBlur(inputValidade);
                            await delay(500);


                            const btGravarValidade = getElementByXPath('/html/body/div[1]/div/div/div[1]/div/div[1]/button[1]');
                            if (!btGravarValidade) throw new Error('Botão "Gravar Validade" não encontrado');
                            btGravarValidade.click();
                            await delay(1500);

                            await aguardarPopupAlerta();

                            // Passo 4 - Unidade Organizacional
                            const btUnidade = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[1]/ul/li[5]/a/span');
                            if (!btUnidade) throw new Error('Aba "Unidade" não encontrada');
                            btUnidade.click();
                            await delay(1000);

                            const inputUnidadeCodigo = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[5]/div[1]/div[3]/table/tbody[1]/tr[1]/td[2]/div/table/tbody/tr/td/table/tbody/tr/td[1]/input');
                            inputUnidadeCodigo.focus();
                            await delay(500);
                            inputUnidadeCodigo.value = dados.codigo;
                            inputUnidadeCodigo.dispatchEvent(new Event('input', { bubbles: true }));
                            simularBlur(inputUnidadeCodigo);
                            await delay(500);

                            // ano vigente
                            const inputAnoVigente = getElementByXPath('/html/body/div[1]/div/div/div[4]/div[2]/div[5]/div[1]/div[3]/table/tbody[1]/tr[3]/td[2]/div/div/div[1]/input');
                            inputAnoVigente.focus();
                            await delay(500);
                            inputAnoVigente.value = dados.anoVigente;
                            inputAnoVigente.dispatchEvent(new Event('input', { bubbles: true }));
                            simularBlur(inputAnoVigente);
                            await delay(500);

                            const btGravarUnidade = getElementByXPath('/html/body/div[1]/div/div/div[1]/div/div[1]/button[1]');
                            if (!btGravarUnidade) throw new Error('Botão "Gravar Unidade" não encontrado');
                            btGravarUnidade.click();
                            await delay(1500);

                            await aguardarPopupAlerta();

                        })();

                        console.log('Cadastro concluído para:', dados.nome);
                        return { success: true, usuario: dados.nome };
                    } catch (error) {
                        console.error('Erro durante o cadastro:', error);
                        return { error: error.message, usuario: dados.nome };
                    }
                },
                args: [dadosUsuario],
                world: 'MAIN'
                // Substitua pelo código abaixo:
            }, (results) => {
                console.log('Resultados do script:', results); // Verifique o que é retornado

                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                // Verifique se results existe e tem pelo menos um item
                if (!results || results.length === 0 || !results[0]) {
                    reject(new Error("Nenhum resultado retornado pelo script."));
                    return;
                }

                // Verifique se result não é null/undefined
                const result = results[0].result;
                if (!result) {
                    reject(new Error("O script não retornou um resultado válido."));
                    return;
                }

                // Agora verifique se há erro no resultado
                if (result.error) {
                    reject(result.error);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

const pergamum = new PergamumCadastro();