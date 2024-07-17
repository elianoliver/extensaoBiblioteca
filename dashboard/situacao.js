document.addEventListener('DOMContentLoaded', function () {
    const botao = document.getElementById('botaoCriarTabela');

    if (botao) {
        botao.addEventListener('click', criarTabela);
    }

    function criarTabela() {
        let textarea = document.getElementById('valores');
        let tabelaContainer = document.getElementById('tabelaContainer');
        let totalMatriculas = document.getElementById('totalMatriculas');
        let containerFooter = document.getElementById('containerFooter');

        // Obtém o texto do textarea e divide em linhas
        let linhas = textarea.value.split(/\r?\n/);

        // Filtra linhas vazias ou que contenham apenas espaços em branco
        let linhasFiltradas = linhas.filter(linha => linha.trim().length > 0);

        // Cria a tabela dinamicamente
        let tabela = document.createElement('table');
        tabela.classList.add('tabela');

        // Cria o cabeçalho da tabela
        let cabecalho = document.createElement('thead');
        let cabecalhoRow = document.createElement('tr');

        // Define os cabeçalhos das colunas
        let cabecalhoValores = ['Matrícula', 'Nome'];

        cabecalhoValores.forEach(valor => {
            let th = document.createElement('th');
            th.textContent = valor;
            cabecalhoRow.appendChild(th);
        });

        cabecalho.appendChild(cabecalhoRow);
        tabela.appendChild(cabecalho);

        // Cria o corpo da tabela
        let corpo = document.createElement('tbody');

        linhasFiltradas.forEach(linha => {
            let linhaValores = linha.split(/\t/); // Supondo que os valores estejam separados por tabulação (\t)
            let row = document.createElement('tr');

            // Verifica se o primeiro valor é numérico para determinar a ordem
            if (!isNaN(linhaValores[0])) {
                linhaValores.forEach(valor => {
                    let cell = document.createElement('td');
                    cell.textContent = valor;
                    row.appendChild(cell);
                });
            } else {
                linhaValores.reverse().forEach(valor => {
                    let cell = document.createElement('td');
                    cell.textContent = valor;
                    row.appendChild(cell);
                });
            }

            corpo.appendChild(row);
        });

        tabela.appendChild(corpo);

        // Limpa o conteúdo anterior e adiciona a nova tabela ao container
        tabelaContainer.innerHTML = '';
        tabelaContainer.appendChild(tabela);
        // Atualiza o total de matrículas considerando apenas linhas não vazias
        containerFooter.style.visibility = 'visible';
        totalMatriculas.textContent = `Matrículas: ` + linhasFiltradas.length;
    }
})
