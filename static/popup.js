// ---- FUNÇÕES DE CLIENTES ----
function carregarClientes(clienteSelecionado = '') {
  chrome.storage.local.get({clientes: []}, (result) => {
    const datalist = document.getElementById('listaClientes');
    datalist.innerHTML = '';
    
    // Ordenação alfabética ignorando maiúsculas e acentos
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
       ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum cliente</li>';
       return;
    }
    clientesOrdenados.forEach(nome => {
      const li = document.createElement('li');
      li.textContent = nome;
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '✖';
      btnExcluir.className = 'btn-excluir-item';
      btnExcluir.addEventListener('click', () => {
        if(confirm(`Excluir "${nome}"?`)) {
          chrome.storage.local.get({clientes: []}, (res) => {
            const novaLista = res.clientes.filter(c => c !== nome);
            chrome.storage.local.set({clientes: novaLista}, () => {
              renderizarListaGerenciar();
              carregarClientes();
            });
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

function salvarClienteNoBanco(nome, callback) {
  chrome.storage.local.get({clientes: []}, (result) => {
    let listaClientes = result.clientes;
    if (!listaClientes.includes(nome)) {
      listaClientes.push(nome);
      chrome.storage.local.set({clientes: listaClientes}, callback);
    } else {
      if (callback) callback(); 
    }
  });
}

// ---- FUNÇÕES DE PROJETOS ----
function carregarProjetos(codigoSelecionado = '') {
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

    if (codigoSelecionado) document.getElementById('projeto').value = codigoSelecionado;
  });
}

function renderizarListaProjetos() {
  chrome.storage.local.get({projetos: []}, (result) => {
    const ul = document.getElementById('ulProjetosGerenciar');
    ul.innerHTML = '';
    
    const projetosOrdenados = result.projetos.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { sensitivity: 'base' }));
    
    if(projetosOrdenados.length === 0) {
       ul.innerHTML = '<li style="color:#aaa; justify-content:center; font-style: italic;">Nenhum projeto</li>';
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
          chrome.storage.local.get({projetos: []}, (res) => {
            const novaLista = res.projetos.filter(p => p.codigo !== proj.codigo);
            chrome.storage.local.set({projetos: novaLista}, () => {
              renderizarListaProjetos();
              carregarProjetos();
            });
          });
        }
      });
      li.appendChild(btnExcluir);
      ul.appendChild(li);
    });
  });
}

// ---- INICIALIZAÇÃO E EVENTOS ----
document.addEventListener('DOMContentLoaded', () => {
  carregarClientes();
  carregarProjetos();

  // Puxa as tarefas do banco para pegar as últimas informações preenchidas
  chrome.storage.local.get({tarefas: []}, (result) => {
    const tarefas = result.tarefas;

    if (tarefas.length > 0) {
      // Ordena de forma cronológica para pegar sempre a última data e hora registrada
      const tarefasOrdenadas = [...tarefas].sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return (a.horaSaida || '').localeCompare(b.horaSaida || '');
      });
      
      const ultimaTarefa = tarefasOrdenadas[tarefasOrdenadas.length - 1];
      
      if (ultimaTarefa.data && ultimaTarefa.horaSaida) {
        document.getElementById('data').value = ultimaTarefa.data;
        document.getElementById('horaEntrada').value = ultimaTarefa.horaSaida; // Entrada vira a última saída
        
        // Calcula a nova saída (+1 hora limitando a 23:59)
        let [h, m] = ultimaTarefa.horaSaida.split(':').map(Number);
        h += 1;
        if (h >= 24) { h = 23; m = 59; }
        document.getElementById('horaSaida').value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        return; // Retorna para não executar o código abaixo
      }
    }

    // FALLBACK: Se o histórico estiver vazio, usa a data/hora do momento (Tempo Real)
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    document.getElementById('data').value = `${ano}-${mes}-${dia}`;

    const horaEntrada = String(agora.getHours()).padStart(2, '0');
    const minEntrada = String(agora.getMinutes()).padStart(2, '0');
    document.getElementById('horaEntrada').value = `${horaEntrada}:${minEntrada}`;

    const dataSaida = new Date(agora.getTime() + 60 * 60 * 1000);
    let horaSaidaStr, minSaidaStr;
    if (dataSaida.getDate() !== agora.getDate() || dataSaida.getHours() < agora.getHours()) {
      horaSaidaStr = "23"; minSaidaStr = "59";
    } else {
      horaSaidaStr = String(dataSaida.getHours()).padStart(2, '0');
      minSaidaStr = String(dataSaida.getMinutes()).padStart(2, '0');
    }
    document.getElementById('horaSaida').value = `${horaSaidaStr}:${minSaidaStr}`;
  });
});

// ---- AUTOPREENCHIMENTO: DAILY ----
document.getElementById('cliente').addEventListener('input', function(e) {
  const nomeCliente = e.target.value.trim().toUpperCase();
  const campoDescricao = document.getElementById('descricao');
  
  // Se o usuário digitar "Daily" ou "DAILY", preenche a descrição automaticamente
  if (nomeCliente === 'DAILY') {
    campoDescricao.value = 'Reunião com o time de projeto e desenvolvimento';
  }
});

// Eventos Modal Cliente
const modalGerenciar = document.getElementById('modalGerenciar');
document.getElementById('btnGerenciarClientes').addEventListener('click', () => {
  document.getElementById('inputNomeCliente').value = '';
  renderizarListaGerenciar();
  modalGerenciar.showModal();
});
document.getElementById('btnFecharGerenciar').addEventListener('click', () => modalGerenciar.close());
document.getElementById('btnSalvarCliente').addEventListener('click', () => {
  const nomeNovo = document.getElementById('inputNomeCliente').value.trim();
  if (!nomeNovo) return alert("Digite o nome do cliente.");
  salvarClienteNoBanco(nomeNovo, () => {
    document.getElementById('inputNomeCliente').value = ''; 
    renderizarListaGerenciar(); carregarClientes();
  });
});

// Eventos Modal Projeto
const modalProjetos = document.getElementById('modalProjetos');
document.getElementById('btnGerenciarProjetos').addEventListener('click', () => {
  document.getElementById('inputCodigoProj').value = '';
  document.getElementById('inputDescProj').value = '';
  renderizarListaProjetos();
  modalProjetos.showModal();
});
document.getElementById('btnFecharProjetos').addEventListener('click', () => modalProjetos.close());
document.getElementById('btnSalvarProj').addEventListener('click', () => {
  const cod = document.getElementById('inputCodigoProj').value.trim();
  const desc = document.getElementById('inputDescProj').value.trim();
  if (!cod) return alert("Digite o código do projeto.");

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
      renderizarListaProjetos();
      carregarProjetos(cod);
    });
  });
});

// Salvar Tarefa Principal
document.getElementById('btnHistorico').addEventListener('click', () => chrome.tabs.create({ url: 'history.html' }));

document.getElementById('btnSalvar').addEventListener('click', () => {
  const clienteDigitado = document.getElementById('cliente').value.trim();
  const projetoCodigo = document.getElementById('projeto').value.trim();

  if (!document.getElementById('data').value || !clienteDigitado) {
    return alert("Por favor, preencha a Data e o Cliente.");
  }

  chrome.storage.local.get({clientes: [], projetos: [], tarefas: []}, (result) => {
    
    let listaClientes = result.clientes;
    if (!listaClientes.includes(clienteDigitado)) listaClientes.push(clienteDigitado);

    let projetoDescricao = '';
    if (projetoCodigo) {
      const projEncontrado = result.projetos.find(p => p.codigo === projetoCodigo);
      if (projEncontrado) projetoDescricao = projEncontrado.descricao;
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
      // Exibe sucesso
      const msgSucesso = document.getElementById('mensagemSucesso');
      msgSucesso.style.display = 'block';
      setTimeout(() => msgSucesso.style.display = 'none', 3000);

      // Limpa os campos de texto descritivos
      document.getElementById('cliente').value = ''; 
      document.getElementById('projeto').value = ''; 
      document.getElementById('descricao').value = '';
      carregarClientes(); 
      
      // AUTO-AVANÇO: Atualiza a Entrada para a Saída que acabou de ser salva
      document.getElementById('horaEntrada').value = tarefa.horaSaida;
      let [h, m] = tarefa.horaSaida.split(':').map(Number);
      h += 1;
      if (h >= 24) { h = 23; m = 59; } // Trava limite em 23:59
      document.getElementById('horaSaida').value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });
  });
});