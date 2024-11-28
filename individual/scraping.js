class ScrapingService {
    constructor() {
        this.BASE_URL = "https://pergamumweb.com.br/pergamumweb_ifc/zkau";
    }

    validarMatricula(matricula) {
        // Remove espaços e zeros à esquerda
        const matriculaLimpa = matricula.trim().replace(/^0+/, '').replace(/\s+/g, '');
        // Verifica se a string resultante contém apenas números
        const matriculaRegex = /^\d+$/;
        return matriculaRegex.test(matriculaLimpa);
    }

    // Funções auxiliares de extração
    decodeSpecialChars(str) {
        if (!str) return null;
        return str.replace(/\\x([0-9A-Fa-f]{2})/g,
            (_, p1) => String.fromCharCode(parseInt(p1, 16)))
            .replace(/\\"/g, '"')
            .trim();
    }

    extractValue(text, id) {
        const regex = new RegExp(`\\["setAttr",\\[\\{\\\$u:'${id}'\\},"_value","([^"]*)"\\]\\]`);
        const match = text.match(regex);
        return match ? this.decodeSpecialChars(match[1]) : null;
    }

    async consultarMatricula(matricula, dtid = "z__h_0", uuid = "bBwR8") {
        if (!this.validarMatricula(matricula)) {
            throw new Error('Matrícula inválida.');
        }

        try {
            // Primeira requisição - simula o foco no campo
            await this.enviarRequisicao("onFocus", dtid, uuid);

            // Segunda requisição - envia o valor
            await this.enviarRequisicao("onChange", dtid, uuid, `{"value":"${matricula}"}`);

            // Terceira requisição - simula o blur
            const response = await this.enviarRequisicao("onBlur", dtid, uuid);
            const rawText = await response.text();

            return this.extrairInformacoes(rawText, uuid);

        } catch (error) {
            console.error('Erro na consulta:', error);
            throw new Error('Erro ao consultar matrícula. Verifique sua conexão e tente novamente.');
        }
    }

    async enviarRequisicao(comando, dtid, uuid, data = "{}") {
        const payload = {
            "dtid": dtid,
            "cmd_0": comando,
            "uuid_0": uuid,
            "data_0": data
        };

        return fetch(this.BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: new URLSearchParams(payload)
        });
    }

    extrairInformacoes(rawText, uuid) {
        const info = {};
        const baseId = uuid.slice(0, -1);

        // Mapeamento de campos
        const fieldMap = {
            [`${uuid}`]: 'matricula',
            [`${baseId}a`]: 'nome',
            [`${baseId}j2`]: 'email',
            [`${baseId}f1`]: 'cpf',
            [`${baseId}x0`]: 'cep',
            [`${baseId}81`]: 'nacionalidade',
            [`${baseId}74`]: 'situacao',
            [`${baseId}b4`]: 'biblioteca',
            [`${baseId}24`]: 'tipo_usuario',
            [`${baseId}_2`]: 'sexo',
            [`${baseId}v0`]: 'telefone'
        };

        // Extrair valores usando o mapa de campos
        for (const [id, field] of Object.entries(fieldMap)) {
            const value = this.extractValue(rawText, id);
            if (value) info[field] = value;
        }

        // Extrai curso
        const cursoPatterns = [
            /label:'([^']*(?:Bacharel|Licenciatura|Técnico)[^']*)'/,
            /label:'(T[^']*Cambori[^']*\))'/,
            /label:'([^']*curso[^']*)'/i
        ];

        for (const pattern of cursoPatterns) {
            const match = rawText.match(pattern);
            if (match) {
                info.curso = this.decodeSpecialChars(match[1]);
                break;
            }
        }

        // Extrai validade da biblioteca
        const validadeMatch = rawText.match(/label:'(\d{2}\/\d{2}\/\d{4})'/);
        if (validadeMatch) {
            info.validade_biblioteca = validadeMatch[1];
        }

        // Remove campos vazios
        Object.keys(info).forEach(key => {
            if (!info[key]) delete info[key];
        });

        return info;
    }
}

export const scrapingService = new ScrapingService();