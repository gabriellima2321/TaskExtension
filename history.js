const tbody = document.getElementById('tabelaCorpo');
const modalEdicao = document.getElementById('modalEdicao');
const modalRelatorio = document.getElementById('modalRelatorio');
const modalClientesHist = document.getElementById('modalClientesHist');
const modalProjetosHist = document.getElementById('modalProjetosHist');

let periodoRapido = 'all'; 
const selectFiltroCliente = document.getElementById('filtroCliente');
const inputFiltroData = document.getElementById('filtroData');
const botoesFiltro = document.querySelectorAll('.btn-filtro:not(.btn-limpar):not(.btn-menu)');

// ---- LÓGICA DO MENU SUSPENSO ----
const btnMenuDropdown = document.getElementById('btnMenuDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

btnMenuDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('show-dropdown');
  if (dropdownMenu.classList.contains('show-dropdown')) {
    btnMenuDropdown.innerHTML = '☰ <span style="font-size: 15px; font-weight: bold;">Menu</span>';
  } else {
    btnMenuDropdown.innerHTML = '☰';
  }
});
window.addEventListener('click', () => {
  if (dropdownMenu.classList.contains('show-dropdown')) {
    dropdownMenu.classList.remove('show-dropdown');
    btnMenuDropdown.innerHTML = '☰';
  }
});

// ---- CARREGAR LISTAS PARA O MODAL DE EDIÇÃO ----
function atualizarListasEdicao() {
  chrome.storage.local.get({clientes: [], projetos: []}, (result) => {
    const dlClientes = document.getElementById('editListaClientes');
    const dlProjetos = document.getElementById('editListaProjetos');
    
    // Atualiza opções de Clientes
    dlClientes.innerHTML = '';
    const clientesOrd = result.clientes.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    clientesOrd.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      dlClientes.appendChild(opt);
    });

    // Atualiza opções de Projetos
    dlProjetos.innerHTML = '';
    const projetosOrd = result.projetos.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { sensitivity: 'base' }));
    projetosOrd.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.codigo;
      opt.textContent = p.descricao;
      dlProjetos.appendChild(opt);
    });
  });
}

// ---- FILTRO DE CLIENTES PRINCIPAL ----
function carregarFiltroClientes() {
  chrome.storage.local.get({tarefas: []}, (result) => {
    const clienteSelecionado = selectFiltroCliente.value;
    const clientesUnicos = [...new Set(result.tarefas.map(t => (t.cliente || '').trim()))]
                             .filter(nome => nome !== '').sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    selectFiltroCliente.innerHTML = '<option value="">🔍 Todos os clientes</option>';
    clientesUnicos.forEach(nome => {
      const option = document.createElement('option');
      option.value = nome;
      option.textContent = nome;
      selectFiltroCliente.appendChild(option);
    });
    if (clientesUnicos.includes(clienteSelecionado)) selectFiltroCliente.value = clienteSelecionado;
  });
}

// ---- EVENTOS DE FILTRO ----
selectFiltroCliente.addEventListener('change', carregarHistorico);
inputFiltroData.addEventListener('change', () => { periodoRapido = 'all'; atualizarBotoesVisuais(); carregarHistorico(); });
document.getElementById('btnHoje').addEventListener('click', () => setPeriodo('today'));
document.getElementById('btnMes').addEventListener('click', () => setPeriodo('month'));
document.getElementById('btnAno').addEventListener('click', () => setPeriodo('year'));
document.getElementById('btnLimpar').addEventListener('click', () => { selectFiltroCliente.value = ''; inputFiltroData.value = ''; setPeriodo('all'); });

function setPeriodo(periodo) { periodoRapido = periodo; inputFiltroData.value = ''; atualizarBotoesVisuais(); carregarHistorico(); }
function atualizarBotoesVisuais() {
  botoesFiltro.forEach(btn => btn.classList.remove('ativo'));
  if (periodoRapido === 'today') document.getElementById('btnHoje').classList.add('ativo');
  if (periodoRapido === 'month') document.getElementById('btnMes').classList.add('ativo');
  if (periodoRapido === 'year') document.getElementById('btnAno').classList.add('ativo');
}

// ---- RENDERIZAÇÃO DA TABELA HISTÓRICO ----
function carregarHistorico() {
  chrome.storage.local.get({tarefas: []}, (result) => {
    tbody.innerHTML = '';
    let tarefas = result.tarefas;

    const dataAtual = new Date();
    const anoHoje = dataAtual.getFullYear().toString();
    const mesHoje = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const diaHoje = String(dataAtual.getDate()).padStart(2, '0');
    const stringHoje = `${anoHoje}-${mesHoje}-${diaHoje}`;

    const clienteSelecionado = selectFiltroCliente.value;
    const dataExata = inputFiltroData.value;

    tarefas = tarefas.filter(tarefa => {
      if (!tarefa.data) return false;
      if (clienteSelecionado && (tarefa.cliente || '').trim() !== clienteSelecionado) return false;
      if (dataExata && tarefa.data !== dataExata) return false;

      if (!dataExata && periodoRapido !== 'all') {
        const tAno = tarefa.data.substring(0, 4);
        const tMes = tarefa.data.substring(5, 7);
        if (periodoRapido === 'today' && tarefa.data !== stringHoje) return false;
        if (periodoRapido === 'month' && (tAno !== anoHoje || tMes !== mesHoje)) return false;
        if (periodoRapido === 'year' && tAno !== anoHoje) return false;
      }
      return true; 
    });

    tarefas.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return (a.horaEntrada || '').localeCompare(b.horaEntrada || '');
    });

    if (tarefas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="vazio">Nenhum registro encontrado.</td></tr>';
      return;
    }

    tarefas.forEach(tarefa => {
      const dataFormatada = tarefa.data.split('-').reverse().join('/');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${dataFormatada}</strong></td>
        <td>${tarefa.horaEntrada || '-'}</td>
        <td>${tarefa.horaSaida || '-'}</td>
        <td>${tarefa.cliente}</td>
        <td><strong>${tarefa.projetoCodigo || '-'}</strong></td>
        <td style="color:#666;">${tarefa.projetoDescricao || '-'}</td>
        <td>${tarefa.descricao || '-'}</td>
        <td class="btn-acoes">
          <button class="btn-editar" data-id="${tarefa.id}">Editar</button>
          <button class="btn-excluir" data-id="${tarefa.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', excluirTarefa));
    document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', abrirEdicao));
  });
}

// ---- EXCLUSÃO E EDIÇÃO DE TAREFA ----
function excluirTarefa(e) {
  const id = e.target.getAttribute('data-id');
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    chrome.storage.local.get({tarefas: []}, (result) => {
      const tarefasAtualizadas = result.tarefas.filter(t => t.id !== id);
      chrome.storage.local.set({tarefas: tarefasAtualizadas}, () => { carregarFiltroClientes(); carregarHistorico(); });
    });
  }
}

function abrirEdicao(e) {
  const id = e.target.getAttribute('data-id');
  chrome.storage.local.get({tarefas: []}, (result) => {
    const tarefa = result.tarefas.find(t => t.id === id);
    if (tarefa) {
      document.getElementById('editId').value = tarefa.id;
      document.getElementById('editData').value = tarefa.data;
      document.getElementById('editHoraEntrada').value = tarefa.horaEntrada;
      document.getElementById('editHoraSaida').value = tarefa.horaSaida;
      document.getElementById('editCliente').value = tarefa.cliente;
      document.getElementById('editProjeto').value = tarefa.projetoCodigo || '';
      document.getElementById('editDescricao').value = tarefa.descricao;
      modalEdicao.showModal();
    }
  });
}

document.getElementById('btnCancelarEdicao').addEventListener('click', () => modalEdicao.close());
document.getElementById('btnSalvarEdicao').addEventListener('click', () => {
  const id = document.getElementById('editId').value;
  const projEditado = document.getElementById('editProjeto').value.trim();

  chrome.storage.local.get({tarefas: [], projetos: []}, (result) => {
    let tarefas = result.tarefas;
    const index = tarefas.findIndex(t => t.id === id);
    
    if (index > -1) {
      let descProjeto = tarefas[index].projetoDescricao;
      if (projEditado !== tarefas[index].projetoCodigo) {
        descProjeto = ''; 
        const pEncontrado = result.projetos.find(p => p.codigo === projEditado);
        if (pEncontrado) descProjeto = pEncontrado.descricao;
      }

      tarefas[index] = {
        id: id,
        data: document.getElementById('editData').value,
        horaEntrada: document.getElementById('editHoraEntrada').value,
        horaSaida: document.getElementById('editHoraSaida').value,
        cliente: document.getElementById('editCliente').value,
        projetoCodigo: projEditado,
        projetoDescricao: descProjeto,
        descricao: document.getElementById('editDescricao').value
      };
      chrome.storage.local.set({tarefas: tarefas}, () => {
        modalEdicao.close();
        carregarFiltroClientes(); 
        carregarHistorico();
      });
    }
  });
});

// ---- MENU: APAGAR HISTÓRICO ----
document.getElementById('menuLimparHistorico').addEventListener('click', (e) => {
  e.preventDefault();
  if(confirm('🚨 ATENÇÃO! Tem certeza que deseja APAGAR TODO o histórico de tarefas? Esta ação não pode ser desfeita.')) {
    if(confirm('Tem certeza absoluta? Recomendamos exportar um backup (Exportar Histórico Completo) antes de continuar.')) {
      chrome.storage.local.set({tarefas: []}, () => {
        alert('Histórico de tarefas apagado com sucesso.');
        carregarFiltroClientes();
        carregarHistorico();
      });
    }
  }
});

// ---- MENU: RELATÓRIOS ----
document.getElementById('menuRelatorio').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('resultadoRelatorio').innerHTML = '<div class="vazio" style="padding: 10px;">Clique em calcular para processar os dados do período.</div>';
  
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth(); 
  const dataInicio = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
  const qtdDiasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dataFim = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(qtdDiasNoMes).padStart(2, '0')}`;

  document.getElementById('relDataInicio').value = dataInicio;
  document.getElementById('relDataFim').value = dataFim;
  modalRelatorio.showModal();
});
document.getElementById('btnFecharRelatorio').addEventListener('click', () => modalRelatorio.close());

function calcularMinutos(entrada, saida) {
  if (!entrada || !saida) return 0;
  const [h1, m1] = entrada.split(':').map(Number);
  const [h2, m2] = saida.split(':').map(Number);
  let diferenca = ((h2 * 60) + m2) - ((h1 * 60) + m1);
  if (diferenca < 0) diferenca += 24 * 60; 
  return diferenca;
}

document.getElementById('btnGerarRelatorio').addEventListener('click', () => {
  const dataInicio = document.getElementById('relDataInicio').value;
  const dataFim = document.getElementById('relDataFim').value;
  const divResultado = document.getElementById('resultadoRelatorio');
  if (!dataInicio || !dataFim) return alert('Por favor, preencha a Data Início e a Data Fim.');

  chrome.storage.local.get({tarefas: []}, (result) => {
    const horasPorCliente = {};
    result.tarefas.forEach(t => {
      if (t.data >= dataInicio && t.data <= dataFim) {
        const nomeChave = t.cliente.trim().toUpperCase(); 
        const nomeExibicao = t.cliente.trim();
        const min = calcularMinutos(t.horaEntrada, t.horaSaida);
        if (!horasPorCliente[nomeChave]) horasPorCliente[nomeChave] = { nome: nomeExibicao, totalMinutos: 0 };
        horasPorCliente[nomeChave].totalMinutos += min;
      }
    });

    const clientes = Object.values(horasPorCliente).sort((a, b) => b.totalMinutos - a.totalMinutos);
    if (clientes.length === 0) return divResultado.innerHTML = '<div class="vazio" style="padding: 10px;">Nenhuma tarefa encontrada neste período.</div>';

    let html = '';
    clientes.forEach(c => {
      const h = Math.floor(c.totalMinutos / 60);
      const m = c.totalMinutos % 60;
      html += `<div class="item-resultado"><span class="nome-cliente">${c.nome}</span><span class="tempo-cliente">${h}h ${m>0?m+'m':'00m'}</span></div>`;
    });
    divResultado.innerHTML = html;
  });
});

// ---- MENU: GERENCIAR CLIENTES E EXPORTAR/IMPORTAR CLIENTES ----
document.getElementById('menuClientes').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('inputNomeCliente').value = '';
  renderizarListaClientesHist();
  modalClientesHist.showModal();
});
document.getElementById('btnFecharClientesHist').addEventListener('click', () => modalClientesHist.close());

document.getElementById('btnSalvarCliente').addEventListener('click', () => {
  const nomeNovo = document.getElementById('inputNomeCliente').value.trim();
  if (!nomeNovo) return alert("Digite o nome do cliente.");
  chrome.storage.local.get({clientes: []}, (result) => {
    let listaClientes = result.clientes;
    if (!listaClientes.includes(nomeNovo)) {
      listaClientes.push(nomeNovo);
      chrome.storage.local.set({clientes: listaClientes}, () => {
        document.getElementById('inputNomeCliente').value = ''; 
        renderizarListaClientesHist();
        atualizarListasEdicao(); // Atualiza listas do modal de edição
      });
    } else alert('Cliente já cadastrado.');
  });
});

function renderizarListaClientesHist() {
  chrome.storage.local.get({clientes: []}, (result) => {
    const ul = document.getElementById('ulClientesGerenciar');
    ul.innerHTML = '';
    const clientesOrdenados = result.clientes.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    if(clientesOrdenados.length === 0) return ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum cliente salvo</li>';
    
    clientesOrdenados.forEach(nome => {
      const li = document.createElement('li');
      li.textContent = nome;
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '✖';
      btnExcluir.className = 'btn-excluir-item';
      btnExcluir.addEventListener('click', () => {
        if(confirm(`Excluir "${nome}" da base de dados?`)) {
          chrome.storage.local.get({clientes: []}, (res) => {
            const novaLista = res.clientes.filter(c => c !== nome);
            chrome.storage.local.set({clientes: novaLista}, () => {
              renderizarListaClientesHist();
              atualizarListasEdicao();
            });
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

// Exportar e Importar APENAS Clientes
document.getElementById('btnExportarClientes').addEventListener('click', () => {
  chrome.storage.local.get({clientes: []}, (result) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({clientes: result.clientes}, null, 2)], { type: 'application/json' }));
    const hoje = new Date();
    a.download = `clientes_${String(hoje.getDate()).padStart(2,'0')}-${String(hoje.getMonth()+1).padStart(2,'0')}-${hoje.getFullYear()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
});

document.getElementById('btnImportarClientes').addEventListener('click', () => document.getElementById('inputImportarClientesFile').click());
document.getElementById('inputImportarClientesFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evento) {
    try {
      const dados = JSON.parse(evento.target.result);
      const novosClientes = Array.isArray(dados) ? dados : (dados.clientes || []);
      
      if (novosClientes.length > 0) {
        chrome.storage.local.get({clientes: []}, (dAtuais) => {
          const cliFinais = [...new Set([...dAtuais.clientes, ...novosClientes])];
          chrome.storage.local.set({ clientes: cliFinais }, () => {
            alert('Clientes importados com sucesso!');
            renderizarListaClientesHist();
            atualizarListasEdicao();
            document.getElementById('inputImportarClientesFile').value = ''; 
          });
        });
      } else alert('Arquivo não contém dados de clientes válidos.');
    } catch (err) { alert('Erro ao ler o arquivo JSON.'); }
  };
  reader.readAsText(file); 
});

// ---- MENU: GERENCIAR PROJETOS E EXPORTAR/IMPORTAR PROJETOS ----
document.getElementById('menuProjetos').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('inputCodigoProj').value = '';
  document.getElementById('inputDescProj').value = '';
  renderizarListaProjetosHist();
  modalProjetosHist.showModal();
});
document.getElementById('btnFecharProjetosHist').addEventListener('click', () => modalProjetosHist.close());

document.getElementById('btnSalvarProj').addEventListener('click', () => {
  const cod = document.getElementById('inputCodigoProj').value.trim();
  const desc = document.getElementById('inputDescProj').value.trim();
  if (!cod) return alert("Digite o código do projeto.");
  chrome.storage.local.get({projetos: []}, (result) => {
    let listaProjetos = result.projetos;
    const index = listaProjetos.findIndex(p => p.codigo === cod);
    if (index > -1) listaProjetos[index].descricao = desc;
    else listaProjetos.push({ codigo: cod, descricao: desc });
    
    chrome.storage.local.set({projetos: listaProjetos}, () => {
      document.getElementById('inputCodigoProj').value = '';
      document.getElementById('inputDescProj').value = '';
      renderizarListaProjetosHist();
      atualizarListasEdicao();
    });
  });
});

function renderizarListaProjetosHist() {
  chrome.storage.local.get({projetos: []}, (result) => {
    const ul = document.getElementById('ulProjetosGerenciar');
    ul.innerHTML = '';
    const projetosOrdenados = result.projetos.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { sensitivity: 'base' }));
    if(projetosOrdenados.length === 0) return ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum projeto salvo</li>';
    
    projetosOrdenados.forEach(proj => {
      const li = document.createElement('li');
      li.textContent = `${proj.codigo} - ${proj.descricao}`;
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '✖';
      btnExcluir.className = 'btn-excluir-item';
      btnExcluir.addEventListener('click', () => {
        if(confirm(`Excluir o projeto "${proj.codigo}" da base de dados?`)) {
          chrome.storage.local.get({projetos: []}, (res) => {
            const novaLista = res.projetos.filter(p => p.codigo !== proj.codigo);
            chrome.storage.local.set({projetos: novaLista}, () => {
              renderizarListaProjetosHist();
              atualizarListasEdicao();
            });
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

// Exportar e Importar APENAS Projetos
document.getElementById('btnExportarProjetos').addEventListener('click', () => {
  chrome.storage.local.get({projetos: []}, (result) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({projetos: result.projetos}, null, 2)], { type: 'application/json' }));
    const hoje = new Date();
    a.download = `projetos_${String(hoje.getDate()).padStart(2,'0')}-${String(hoje.getMonth()+1).padStart(2,'0')}-${hoje.getFullYear()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
});

document.getElementById('btnImportarProjetos').addEventListener('click', () => document.getElementById('inputImportarProjetosFile').click());
document.getElementById('inputImportarProjetosFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evento) {
    try {
      const dados = JSON.parse(evento.target.result);
      const novosProjetos = Array.isArray(dados) ? dados : (dados.projetos || []);
      
      if (novosProjetos.length > 0) {
        chrome.storage.local.get({projetos: []}, (dAtuais) => {
          const mapP = new Map();
          dAtuais.projetos.forEach(p => mapP.set(p.codigo, p));
          novosProjetos.forEach(p => { if (p.codigo) mapP.set(p.codigo, p); });
          
          chrome.storage.local.set({ projetos: Array.from(mapP.values()) }, () => {
            alert('Projetos importados com sucesso!');
            renderizarListaProjetosHist();
            atualizarListasEdicao();
            document.getElementById('inputImportarProjetosFile').value = ''; 
          });
        });
      } else alert('Arquivo não contém dados de projetos válidos.');
    } catch (err) { alert('Erro ao ler o arquivo JSON.'); }
  };
  reader.readAsText(file); 
});

// ---- IMPORTAR / EXPORTAR HISTÓRICO COMPLETO (MENU) ----
document.getElementById('menuExportar').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.storage.local.get(null, (result) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const hoje = new Date();
    a.download = `backup_completo_${String(hoje.getDate()).padStart(2,'0')}-${String(hoje.getMonth()+1).padStart(2,'0')}-${hoje.getFullYear()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
});

document.getElementById('menuImportar').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('inputImportarFile').click();
});

document.getElementById('inputImportarFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evento) {
    try {
      const dImp = JSON.parse(evento.target.result);
      if (dImp.tarefas || dImp.clientes || dImp.projetos) {
        if (confirm('Isto irá juntar as informações do arquivo com as atuais. Deseja continuar?')) {
          chrome.storage.local.get({tarefas: [], clientes: [], projetos: []}, (dAtuais) => {
            const mapT = new Map();
            dAtuais.tarefas.forEach(t => mapT.set(t.id, t));
            if (dImp.tarefas) dImp.tarefas.forEach(t => mapT.set(t.id, t));
            
            const cliFinais = [...new Set([...(dAtuais.clientes||[]), ...(dImp.clientes||[])])]; 

            const mapP = new Map();
            dAtuais.projetos.forEach(p => mapP.set(p.codigo, p));
            if (dImp.projetos) dImp.projetos.forEach(p => mapP.set(p.codigo, p));

            chrome.storage.local.set({ tarefas: Array.from(mapT.values()), clientes: cliFinais, projetos: Array.from(mapP.values()) }, () => {
              alert('Dados completos importados com sucesso!');
              carregarFiltroClientes(); 
              carregarHistorico(); 
              atualizarListasEdicao();
              document.getElementById('inputImportarFile').value = ''; 
            });
          });
        }
      } else alert('Arquivo sem dados válidos.');
    } catch (err) { alert('Erro ao ler o arquivo JSON.'); }
  };
  reader.readAsText(file); 
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => { 
  carregarFiltroClientes(); 
  carregarHistorico(); 
  atualizarListasEdicao(); 
});