// js/main.js
// ==================================
// Estado da Aplicação
// ==================================
let garagem = [];
let veiculoAtualPlaca = null;

// ==================================
// Objetos de Áudio para Interação
// ==================================
// ==================================
// Configuração da API Key (Clima)
// ==================================
// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const apiKey = "0c700589f821587ef3ab07ab0e7ed6c2"; // <-- SUBSTITUA PELA SUA CHAVE REAL

// ==================================
// Funções de API (Simulada Veículo e Real Clima)
// ==================================

/**
 * Busca detalhes adicionais de um veículo em uma fonte de dados externa (simulada).
 * @async
 * @function buscarDetalhesVeiculoAPI
 * @param {string} placaVeiculo - A placa do veículo a ser buscada.
 * @returns {Promise<object|null>} Promise com dados do veículo ou null se não encontrado ou erro.
 */
async function buscarDetalhesVeiculoAPI(placaVeiculo) {
    const apiUrl = './dados_veiculos_api.json';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Veículo Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        const todosDetalhes = await response.json();
        const detalhes = todosDetalhes.find(item => item && item.placa === placaVeiculo);
        return detalhes || null;
    } catch (error) {
        console.error("Falha na busca de detalhes da API Veículo:", error);
        if (typeof exibirNotificacao === 'function') {
            exibirNotificacao(`Erro ao buscar dados extras do veículo: ${error.message}`, "error");
        }
        return null;
    }
}

/**
 * Busca a previsão do tempo ATUAL para uma cidade usando OpenWeatherMap.
 * Endpoint: "Current Weather Data"
 * URL base: https://api.openweathermap.org/data/2.5/weather
 * Parâmetros: q (cidade), appid (chave), units=metric, lang=pt_br
 * @async
 * @function buscarPrevisaoTempo
 * @param {string} nomeCidade - O nome da cidade para buscar a previsão.
 * @returns {Promise<object|null>} Uma Promise que resolve com os dados da previsão atual formatados
 *                                  ou lança um erro em caso de falha.
 */
async function buscarPrevisaoTempo(nomeCidade) {
    if (apiKey === "0c700589f821587ef3ab07ab0e7ed6c2" || !apiKey) {
        const errorMsg = "A chave da API de clima não está configurada. Por favor, adicione-a em js/main.js.";
        console.error(errorMsg);
        // A notificação será feita pelo handleVerificarClima
        throw new Error(errorMsg);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(nomeCidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(url);
        const data = await response.json(); // Tenta parsear JSON mesmo se não for ok, para obter msg de erro da API

        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}: ${data.message || response.statusText || 'Erro desconhecido'}`;
            if (response.status === 401) {
                errorMessage = "Chave de API inválida ou não autorizada. Verifique sua chave no OpenWeatherMap e no arquivo js/main.js.";
            } else if (response.status === 404) {
                errorMessage = `Cidade "${nomeCidade}" não encontrada pelo serviço de previsão.`;
            }
            console.error("Erro ao buscar previsão do tempo atual:", errorMessage, data);
            throw new Error(errorMessage);
        }
        
        // Extrai os dados relevantes do clima atual
        const previsaoFormatada = {
            cidade: data.name,
            pais: data.sys.country,
            temperatura: data.main.temp,
            sensacaoTermica: data.main.feels_like,
            tempMin: data.main.temp_min,
            tempMax: data.main.temp_max,
            descricao: data.weather[0].description,
            icone: data.weather[0].icon,
            umidade: data.main.humidity,
            ventoVelocidade: data.wind.speed, // m/s
            pressao: data.main.pressure, // hPa
            visibilidade: data.visibility, // metros
            nascerDoSol: new Date(data.sys.sunrise * 1000), // Convertendo timestamp UNIX para Date
            porDoSol: new Date(data.sys.sunset * 1000),   // Convertendo timestamp UNIX para Date
            timezoneOffset: data.timezone // Deslocamento em segundos do UTC
        };
        return previsaoFormatada;

    } catch (error) {
        // Se o erro já foi lançado acima (ex: response.ok false), ele será pego aqui e re-lançado.
        // Se for um erro de rede (fetch falhou), ele também será pego aqui.
        console.error("Falha na requisição ou processamento ao buscar previsão do tempo atual:", error.message);
        throw error; // Re-lança o erro para ser tratado por handleVerificarClima
    }
}


// ==================================
// Funções de Lógica Principal (mantidas como estavam, exceto handleVerificarClima)
// ==================================

function encontrarVeiculo(placa) {
    if (!placa) return undefined;
    return garagem.find(v => v && v.placa === placa);
}

function handleAddVeiculo(event) {
    event.preventDefault();
    const tipo = document.getElementById('veiculo-tipo').value;
    const placaInput = document.getElementById('veiculo-placa');
    const modeloInput = document.getElementById('veiculo-modelo');
    const corInput = document.getElementById('veiculo-cor');

    const placa = placaInput.value.trim().toUpperCase();
    const modelo = modeloInput.value.trim();
    const cor = corInput.value.trim();

    if (!placa || !modelo || !cor) {
        exibirNotificacao("Placa, modelo e cor são obrigatórios.", "error");
        return;
    }
    if (encontrarVeiculo(placa)) {
        exibirNotificacao(`A placa ${placa} já está cadastrada na garagem.`, "error");
        return;
    }

    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro':
                const numPortasCarro = document.getElementById('carro-portas').value;
                novoVeiculo = new Carro(placa, modelo, cor, numPortasCarro);
                break;
            case 'CarroEsportivo':
                const numPortasEsportivo = document.getElementById('carroesportivo-portas').value;
                novoVeiculo = new CarroEsportivo(placa, modelo, cor, numPortasEsportivo);
                break;
            case 'Caminhao':
                const numEixos = document.getElementById('caminhao-eixos').value;
                const capacidade = document.getElementById('caminhao-capacidade').value;
                novoVeiculo = new Caminhao(placa, modelo, cor, numEixos, capacidade);
                break;
            default:
                exibirNotificacao("Tipo de veículo selecionado inválido.", "error");
                return;
        }
        garagem.push(novoVeiculo);
        salvarGaragem(garagem);
        exibirVeiculos(garagem);
        exibirNotificacao(`${tipo} ${placa} adicionado com sucesso!`, "success");
        limparFormulario('form-add-veiculo');
    } catch (error) {
        console.error("Erro ao criar ou adicionar veículo:", error);
        exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, "error");
    }
}

function handleClickDetalhesGaragem(event) {
    if (event.target.classList.contains('btn-detalhes') || event.target.closest('.btn-detalhes')) {
        const placa = (event.target.classList.contains('btn-detalhes') ? event.target.dataset.placa : event.target.closest('.btn-detalhes').dataset.placa);
        const veiculo = encontrarVeiculo(placa);
        if (veiculo) {
            veiculoAtualPlaca = placa;
            exibirDetalhesCompletos(veiculo);
        } else {
            exibirNotificacao(`Veículo com placa ${placa} não encontrado na garagem.`, "error");
            veiculoAtualPlaca = null;
        }
    }
}

async function handleBuscarDetalhesAPI(event) {
    if (!event.target.classList.contains('btn-api-details') && !event.target.closest('.btn-api-details')) return;
    const placa = event.target.dataset.placa || event.target.closest('.btn-api-details').dataset.placa;

    if (typeof exibirFeedbackLoadingAPI !== 'function' || typeof exibirDetalhesAPI !== 'function') {
        console.error("Funções de UI para API details não encontradas.");
        return;
    }

    exibirFeedbackLoadingAPI(placa);
    const detalhes = await buscarDetalhesVeiculoAPI(placa);
    exibirDetalhesAPI(detalhes, placa);
}


function handleAgendarManutencao(event) {
    event.preventDefault();
    const placa = document.getElementById('agendamento-veiculo-placa').value;
    const dataInput = document.getElementById('agenda-data');
    const tipoInput = document.getElementById('agenda-tipo');
    const custoInput = document.getElementById('agenda-custo');
    const descricaoInput = document.getElementById('agenda-descricao');

    const data = dataInput.value;
    const tipo = tipoInput.value.trim();
    const custoStr = custoInput.value;
    const descricao = descricaoInput.value.trim();

    if (!placa || !data || !tipo || custoStr === '') {
        exibirNotificacao("Preencha Data, Tipo de Serviço e Custo para agendar.", "error");
        return;
    }
    const custo = parseFloat(custoStr);
    if (isNaN(custo) || custo < 0) {
        exibirNotificacao("O Custo informado é inválido ou negativo.", "error");
        return;
    }

    const veiculo = encontrarVeiculo(placa);
    if (!veiculo) {
        exibirNotificacao(`Veículo com placa ${placa} não encontrado para agendamento.`, "error");
        return;
    }

    try {
        const dataObj = new Date(data + 'T00:00:00');
        const novaManutencao = new Manutencao(dataObj, tipo, custo, descricao);
        if (!novaManutencao.validar()) {
            exibirNotificacao("Dados fornecidos para a manutenção são inválidos.", "error");
            return;
        }

        if (veiculo.adicionarManutencao(novaManutencao)) {
            salvarGaragem(garagem);
            exibirDetalhesCompletos(veiculo);
            exibirNotificacao(`Manutenção para ${placa} agendada com sucesso!`, "success");
            limparFormulario('form-agendamento');
        } else {
            exibirNotificacao("Não foi possível adicionar o agendamento de manutenção.", "error");
        }
    } catch (error) {
        console.error("Erro ao criar ou agendar manutenção:", error);
        exibirNotificacao(`Erro ao agendar: ${error.message}`, "error");
    }
}

function verificarAgendamentos() {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    hoje.setHours(0, 0, 0, 0);
    amanha.setHours(0, 0, 0, 0);

    garagem.forEach(veiculo => {
        (veiculo.historicoManutencao || []).forEach(manutencao => {
            const dataManutencao = new Date(manutencao.data);
            dataManutencao.setHours(0, 0, 0, 0);
            if (dataManutencao.getTime() === hoje.getTime()) {
                exibirNotificacao(`Lembrete HOJE: ${manutencao.formatar()} p/ ${veiculo.placa}`, 'warning', 10000);
            } else if (dataManutencao.getTime() === amanha.getTime()) {
                exibirNotificacao(`Lembrete AMANHÃ: ${manutencao.formatar()} p/ ${veiculo.placa}`, 'info', 10000);
            }
        });
    });
}

/**
 * Manipulador para o clique no botão "Verificar Clima".
 * Busca e exibe a previsão do tempo ATUAL para a cidade digitada.
 */
async function handleVerificarClima() {
    const destinoInput = document.getElementById('destino-viagem');
    const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado'); // ui.js

    if (!destinoInput || !previsaoResultadoDiv) {
        console.error("Elementos de input/output do clima não encontrados.");
        exibirNotificacao("Erro interno: Elementos da interface de clima não encontrados.", "error");
        return;
    }
    const nomeCidade = destinoInput.value.trim();

    if (!nomeCidade) {
        exibirNotificacao("Por favor, digite o nome da cidade de destino.", "warning");
        if (previsaoResultadoDiv) previsaoResultadoDiv.innerHTML = '<p style="color: orange;">Digite uma cidade para verificar o clima.</p>';
        return;
    }

    if (previsaoResultadoDiv) previsaoResultadoDiv.innerHTML = `<p>Buscando clima atual para ${nomeCidade}...</p>`; // Feedback de carregamento

    try {
        const dadosPrevisaoAtual = await buscarPrevisaoTempo(nomeCidade);
        
        // A função exibirResultadoPrevisaoTempo será criada/ajustada em ui.js
        if (typeof exibirResultadoPrevisaoTempo === 'function') {
            exibirResultadoPrevisaoTempo(dadosPrevisaoAtual, nomeCidade); // Passa o nome original para caso a API retorne um nome diferente
        } else {
            console.error("Função exibirResultadoPrevisaoTempo não encontrada em ui.js");
            previsaoResultadoDiv.innerHTML = `<p style="color: red;">Erro na configuração da interface para exibir o clima.</p>`;
        }

    } catch (error) {
        console.error("Erro final ao tentar obter e exibir previsão do tempo atual:", error);
        exibirNotificacao(`${error.message}`, "error", 7000); // Usa a mensagem do erro lançado
        if (previsaoResultadoDiv) previsaoResultadoDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


// ==================================
// Funções de Interação com Veículo (mantidas como estavam)
// ==================================
function handleInteracao(acao) {
    if (!veiculoAtualPlaca) {
        exibirNotificacao("Nenhum veículo selecionado para interação.", "warning");
        return;
    }
    const veiculo = encontrarVeiculo(veiculoAtualPlaca);
    if (!veiculo) {
        exibirNotificacao("Erro interno: Veículo selecionado não encontrado.", "error");
        veiculoAtualPlaca = null;
        mostrarGaragemView();
        return;
    }

    let resultado = "";
    let somParaTocar = null;

    try {
        switch (acao) {
            case 'ligar':
                resultado = veiculo.ligar(); if (resultado.includes("ligado!")) somParaTocar = somLigar; break;
            case 'desligar':
                resultado = veiculo.desligar(); if (resultado.includes("desligado!")) somParaTocar = somDesligar; break;
            case 'acelerar':
                resultado = veiculo.acelerar(); break;
            case 'frear':
                resultado = veiculo.frear(); break;
            case 'buzinar':
                resultado = veiculo.buzinar(); somParaTocar = somBuzina; break;
            case 'turbo':
                if (veiculo instanceof CarroEsportivo) {
                    resultado = veiculo.turboAtivado ? veiculo.desativarTurbo() : veiculo.ativarTurbo();
                    if (resultado.includes("ativado!")) somParaTocar = somTurbo;
                } else { resultado = "Esta ação só é aplicável a Carros Esportivos."; }
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                    resultado = veiculo.carregar(1000); if (resultado.includes("carregado")) somParaTocar = somCarga;
                } else { resultado = "Esta ação só é aplicável a Caminhões."; }
                break;
            case 'descarregar':
                if (veiculo instanceof Caminhao) {
                    resultado = veiculo.descarregar(500); if (resultado.includes("descarregado")) somParaTocar = somCarga;
                } else { resultado = "Esta ação só é aplicável a Caminhões."; }
                break;
            default: resultado = "Ação desconhecida.";
        }

        let tipoNotificacao = 'info';
        if (resultado.includes("Erro") || resultado.includes("não aplicável") || resultado.includes("Pare o veículo") || resultado.includes("excedida") || resultado.includes("Não há carga") || resultado.includes("já está")) {
            tipoNotificacao = 'warning';
        }
        exibirNotificacao(resultado, tipoNotificacao);

        if (somParaTocar && typeof somParaTocar.play === 'function') {
            somParaTocar.currentTime = 0;
            somParaTocar.play().catch(e => console.warn(`Erro ao tocar o som para a ação ${acao}:`, e));
        }

        atualizarDetalhesInteracao(veiculo);
        salvarGaragem(garagem);

    } catch (error) {
        console.error(`Erro durante a execução da ação '${acao}' no veículo ${veiculoAtualPlaca}:`, error);
        exibirNotificacao(`Erro inesperado ao tentar '${acao}'. Verifique o console.`, "error");
    }
}

// ==================================
// Inicialização e Event Listeners (mantidos como estavam)
// ==================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Inicializando Garagem Inteligente Unificada...");
    garagem = carregarGaragem();
    exibirVeiculos(garagem);

    const formAdd = document.getElementById('form-add-veiculo');
    if (formAdd) formAdd.addEventListener('submit', handleAddVeiculo);
    else console.error("Form 'form-add-veiculo' não encontrado.");

    const formAgend = document.getElementById('form-agendamento');
    if (formAgend) formAgend.addEventListener('submit', handleAgendarManutencao);
    else console.error("Form 'form-agendamento' não encontrado.");

    const elListaGaragem = document.getElementById('lista-garagem');
    if (elListaGaragem) {
        elListaGaragem.addEventListener('click', (event) => {
            const targetDetalhes = event.target.closest('.btn-detalhes');
            const targetApi = event.target.closest('.btn-api-details');
            if (targetDetalhes) handleClickDetalhesGaragem(event);
            else if (targetApi) handleBuscarDetalhesAPI(event);
        });
    } else console.error("Elemento 'lista-garagem' não encontrado.");

    const btnVoltar = document.getElementById('btn-voltar-garagem');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            veiculoAtualPlaca = null;
            mostrarGaragemView();
        });
    } else console.error("Botão 'btn-voltar-garagem' não encontrado.");

    const btnCloseApi = document.getElementById('btn-close-api-details');
    const elApiDetailsSection = document.getElementById('api-details-section');
    if (btnCloseApi && elApiDetailsSection) {
        btnCloseApi.addEventListener('click', () => elApiDetailsSection.style.display = 'none');
    } else console.warn("Botão/Seção de fechar API details não encontrados.");

    const botoesInteracaoConfig = [
        { id: 'btn-detail-ligar', acao: 'ligar' }, { id: 'btn-detail-desligar', acao: 'desligar' },
        { id: 'btn-detail-acelerar', acao: 'acelerar' }, { id: 'btn-detail-frear', acao: 'frear' },
        { id: 'btn-detail-buzinar', acao: 'buzinar' }, { id: 'btn-detail-turbo', acao: 'turbo' },
        { id: 'btn-detail-carregar', acao: 'carregar' }, { id: 'btn-detail-descarregar', acao: 'descarregar' },
    ];
    botoesInteracaoConfig.forEach(config => {
        const btn = document.getElementById(config.id);
        if (btn) btn.addEventListener('click', () => handleInteracao(config.acao));
        else console.warn(`Botão de interação '${config.id}' não encontrado.`);
    });

    const elVeiculoTipoSelect = document.getElementById('veiculo-tipo');
    if (elVeiculoTipoSelect) {
        elVeiculoTipoSelect.addEventListener('change', atualizarCamposEspecificos);
        atualizarCamposEspecificos();
    }
    else console.error("Select 'veiculo-tipo' não encontrado.");

    const btnVerificarClima = document.getElementById('verificar-clima-btn');
    if (btnVerificarClima) {
        btnVerificarClima.addEventListener('click', handleVerificarClima);
    } else {
        console.error("Botão 'verificar-clima-btn' não encontrado.");
    }
    verificarAgendamentos();
    console.log("Garagem Inteligente Unificada inicializada com sucesso.");
});