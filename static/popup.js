document.addEventListener('DOMContentLoaded', () => {
  carregarClientes();
  carregarProjetos();
  inicializarDataEHoras();
});

// ---- FUNÇÕES DE PREENCHIMENTO AUTOMÁTICO (NOVO) ----
function preencherHoraAtual(inputId) {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  document.getElementById(inputId).value = `${horas}:${minutos}`;
}

document.getElementById('btnAgoraEntrada').addEventListener('click', () => preencherHoraAtual('horaEntrada'));
document.getElementById('btnAgoraSaida').addEventListener('click', () => preencherHoraAtual('horaSaida'));

// Auto-preenchimento ao digitar 'DAILY'
document.getElementById('cliente').addEventListener('input', (e) => {
  const texto = e.target.value.trim().toUpperCase();
  if (texto === 'DAILY') {
    document.getElementById('descricao').value = 'Reunião diária com a equipa de desenvolvimento.';
  }
});

// Inicialização da Data e Hora do histórico
function inicializarDataEHoras() {
  const dataHoje = new Date().toISOString().split('T')[0];
  document.getElementById('data').value = dataHoje;

  chrome.storage.local.get({tarefas: []}, (result) => {
    const tarefas = result.tarefas;
    if (tarefas && tarefas.length > 0) {
      const ultimaTarefa = tarefas[tarefas.length - 1];
      document.getElementById('data').value = ultimaTarefa.data;
      if (ultimaTarefa.horaSaida) {
        document.getElementById('horaEntrada').value = ultimaTarefa.horaSaida;
        let [h, m] = ultimaTarefa.horaSaida.split(':').map(Number);
        h += 1;
        if (h > 23) h = 23;
        document.getElementById('horaSaida').value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    } else {
      preencherHoraAtual('horaEntrada');
    }
  });
}

// ---- FUNÇÕES DE CLIENTES ----
function carregarClientes(clienteSelecionado = '') {
  chrome.storage.local.get({clientes: []}, (result) => {
    const datalist = document.getElementById('listaClientes');
    datalist.innerHTML = '';
    
    const clientesOrdenados = result.clientes.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    clientesOrdenados.forEach(nome => {
      const option = document.createElement('option');
      option.value = nome;
      datalist.appendChild(option);
    });
    if (clienteSelecionado) document.getElementById('cliente').value = clienteSelecionado;
  });
}

function renderizarListaGerenciar() {
  chrome.storage.local.get({clientes: []}, (result) => {
    const ul = document.getElementById('ulClientesGerenciar');
    ul.innerHTML = '';
    
    const clientesOrdenados = result.clientes.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    if(clientesOrdenados.length === 0) {
       ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum cliente salvo</li>';
       return;
    }
    clientesOrdenados.forEach(nome => {
      const li = document.createElement('li');
      li.textContent = nome;
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '✖';
      btnExcluir.className = 'btn-excluir-item';
      btnExcluir.addEventListener('click', () => {
        if(confirm(`Excluir o cliente "${nome}"?`)) {
          const novaLista = result.clientes.filter(c => c !== nome);
          chrome.storage.local.set({clientes: novaLista}, () => {
            renderizarListaGerenciar();
            carregarClientes();
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

const modalGerenciar = document.getElementById('modalGerenciar');
document.getElementById('btnGerenciarClientes').addEventListener('click', () => {
  renderizarListaGerenciar();
  modalGerenciar.showModal();
});
document.getElementById('btnFecharGerenciar').addEventListener('click', () => modalGerenciar.close());

document.getElementById('btnSalvarCliente').addEventListener('click', () => {
  const nomeNovo = document.getElementById('inputNomeCliente').value.trim();
  if (!nomeNovo) return;
  chrome.storage.local.get({clientes: []}, (result) => {
    let listaClientes = result.clientes;
    if (!listaClientes.includes(nomeNovo)) {
      listaClientes.push(nomeNovo);
      chrome.storage.local.set({clientes: listaClientes}, () => {
        document.getElementById('inputNomeCliente').value = '';
        renderizarListaGerenciar();
        carregarClientes();
      });
    } else {
      alert('Cliente já cadastrado.');
    }
  });
});

// ---- FUNÇÕES DE PROJETOS ----
function carregarProjetos(projetoSelecionado = '') {
  chrome.storage.local.get({projetos: []}, (result) => {
    const datalist = document.getElementById('listaProjetos');
    datalist.innerHTML = '';
    
    const projetosOrdenados = result.projetos.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { sensitivity: 'base' }));
    projetosOrdenados.forEach(proj => {
      const option = document.createElement('option');
      option.value = proj.codigo;
      option.textContent = proj.descricao;
      datalist.appendChild(option);
    });
    if (projetoSelecionado) document.getElementById('projeto').value = projetoSelecionado;
  });
}

function renderizarListaProjetosGerenciar() {
  chrome.storage.local.get({projetos: []}, (result) => {
    const ul = document.getElementById('ulProjetosGerenciar');
    ul.innerHTML = '';
    
    const projetosOrdenados = result.projetos.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { sensitivity: 'base' }));
    if(projetosOrdenados.length === 0) {
       ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum projeto salvo</li>';
       return;
    }
    projetosOrdenados.forEach(proj => {
      const li = document.createElement('li');
      li.textContent = `${proj.codigo} - ${proj.descricao}`;
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '✖';
      btnExcluir.className = 'btn-excluir-item';
      btnExcluir.addEventListener('click', () => {
        if(confirm(`Excluir o projeto "${proj.codigo}"?`)) {
          const novaLista = result.projetos.filter(p => p.codigo !== proj.codigo);
          chrome.storage.local.set({projetos: novaLista}, () => {
            renderizarListaProjetosGerenciar();
            carregarProjetos();
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

const modalProjetos = document.getElementById('modalProjetos');
document.getElementById('btnGerenciarProjetos').addEventListener('click', () => {
  renderizarListaProjetosGerenciar();
  modalProjetos.showModal();
});
document.getElementById('btnFecharProjetos').addEventListener('click', () => modalProjetos.close());

document.getElementById('btnSalvarProj').addEventListener('click', () => {
  const cod = document.getElementById('inputCodigoProj').value.trim();
  const desc = document.getElementById('inputDescProj').value.trim();
  if (!cod) return;
  chrome.storage.local.get({projetos: []}, (result) => {
    let listaProjetos = result.projetos;
    const index = listaProjetos.findIndex(p => p.codigo === cod);
    if (index > -1) {
      listaProjetos[index].descricao = desc;
    } else {
      listaProjetos.push({ codigo: cod, descricao: desc });
    }
    chrome.storage.local.set({projetos: listaProjetos}, () => {
      document.getElementById('inputCodigoProj').value = '';
      document.getElementById('inputDescProj').value = '';
      renderizarListaProjetosGerenciar();
      carregarProjetos();
    });
  });
});

// ---- SALVAR E HISTÓRICO ----
document.getElementById('btnHistorico').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});

document.getElementById('btnSalvar').addEventListener('click', () => {
  chrome.storage.local.get({tarefas: [], clientes: [], projetos: []}, (result) => {
    const clienteDigitado = document.getElementById('cliente').value.trim();
    let listaClientes = result.clientes;
    if (clienteDigitado && !listaClientes.includes(clienteDigitado)) {
      listaClientes.push(clienteDigitado);
    }

    const projetoCodigo = document.getElementById('projeto').value.trim();
    let projetoDescricao = '';
    const projEncontrado = result.projetos.find(p => p.codigo === projetoCodigo);
    if (projEncontrado) {
      projetoDescricao = projEncontrado.descricao;
    }

    const tarefa = {
      id: Date.now().toString(),
      data: document.getElementById('data').value,
      horaEntrada: document.getElementById('horaEntrada').value,
      horaSaida: document.getElementById('horaSaida').value,
      cliente: clienteDigitado,
      projetoCodigo: projetoCodigo,
      projetoDescricao: projetoDescricao,
      descricao: document.getElementById('descricao').value
    };

    let listaTarefas = result.tarefas;
    listaTarefas.push(tarefa);

    chrome.storage.local.set({clientes: listaClientes, tarefas: listaTarefas}, () => {
      // Exibe animação de sucesso (usando CSS Animation)
      const msgSucesso = document.getElementById('mensagemSucesso');
      msgSucesso.style.display = 'block';
      msgSucesso.style.animation = 'slideDownFading 3s ease forwards';
      setTimeout(() => { msgSucesso.style.display = 'none'; msgSucesso.style.animation = ''; }, 3000);

      document.getElementById('cliente').value = ''; 
      document.getElementById('projeto').value = ''; 
      document.getElementById('descricao').value = '';
      carregarClientes(); 
      
      document.getElementById('horaEntrada').value = tarefa.horaSaida;
      let [h, m] = tarefa.horaSaida.split(':').map(Number);
      h += 1;
      if (h > 23) h = 23;
      document.getElementById('horaSaida').value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });
  });
});