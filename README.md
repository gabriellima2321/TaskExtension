# TaskExtension
Cansado de abrir dezenas de abas, perder o foco ou esquecer o que precisava fazer hoje? Com a [Rastreador de Tarefas], você gerencia sua rotina diária diretamente do Google Chrome, de forma simples, rápida e minimalista.

### 💾 Persistência de Dados
A extensão utiliza a API **`chrome.storage.local`** para garantir que nenhum dado dependa de servidores externos. Suas horas, clientes salvos, projetos e até a preferência de tema ficam guardados localmente com total privacidade e segurança.

---

## 🔍 Funcionamento Detalhado dos Módulos

### 1. Interface de Lançamento (`popup`)
Ao clicar no ícone da extensão, o script realiza uma leitura cronológica no banco local:
*   Se houver registros, ele define o campo `Data` com o dia do último registro e injeta no campo `Entrada` a exata hora de `Saída` do apontamento anterior, adicionando `+1 hora` automaticamente no campo de término.
*   Se o banco estiver vazio, o sistema faz o *fallback* para o horário de tempo real da sua máquina.
*   **Regra de Negócio (Auto-Fill):** Um escutador de eventos (*Event Listener*) monitora o campo de entrada do cliente. Caso o valor inserido seja `DAILY` (case-insensitive), o campo de descrição é preenchido de forma assíncrona com a string: `"Reunião com o time de projeto e desenvolvimento"`.

### 2. Painel de Histórico (`history`)
Uma página completa disposta em formato tabular. Os dados são ordenados de forma crescente por data e por hora de entrada. Os elementos de entrada de texto para edição utilizam tags `<datalist>` dinâmicas — isso permite que você selecione de forma assistida seus clientes e projetos cadastrados, mas preserva strings legadas caso você altere ou exclua o cliente da sua base de configurações principal.

### 3. Motor do Relatório Dinâmico
Ao abrir o painel de relatórios, o sistema descobre o mês/ano vigente através do objeto `Date` do JavaScript e preenche os seletores automaticamente com o **primeiro** e o **último dia** do mês atual (calculando dinamicamente anos bissextos e meses de 28, 30 ou 31 dias).

O cálculo muda de comportamento dependendo da caixinha ativa:
*   **Clientes:** Agrupa as chaves normalizadas em caixa alta e soma a diferença absoluta de minutos.
*   **Projetos:** Executa um cruzamento de dados (*join*) entre o identificador salvo na tarefa e a tabela de projetos cadastrados para renderizar a descrição textual em vez do ID.
*   **Horas Extras:** Utiliza a lógica de escopo de tempo. Para cada tarefa, ele decompõe o horário e calcula o transbordo matemático baseado nas regras:
    $$\text{Extra Manhã} = \text{Se Entrada} < 08:55$$
    $$\text{Extra Noite} = \text{Se Saída} > 18:05$$
    O resultado exibe apenas os dias que geraram transbordo e monta um card destacado de **Total Acumulado** no final da listagem.

---

## ⚙️ Como Instalar e Rodar Localmente

Por ser uma extensão em ambiente de desenvolvimento, você pode carregá-la diretamente no seu navegador sem passar pela Chrome Web Store:

1. Faça o clone deste repositório ou baixe o arquivo `.zip` dos códigos:
   ```bash
   git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
   Aqui está um modelo completo, bem estruturado e detalhado para o seu **`README.md`**. Ele foi pensado exatamente no padrão que a comunidade do GitHub adora: limpo, organizado com emojis, escaneável e muito explicativo tecnicamente.

---

# 📑 `README.md`
```markdown
# ⏳ Smart Time Tracker - Extensão para Chrome

Uma extensão robusta e inteligente para o Google Chrome projetada para simplificar o apontamento de horas (*timesheet*), gerenciamento de projetos e controle de banco de horas (Horas Extras) diretamente no navegador. 

Com uma interface moderna, suporte a Modo Escuro persistente e automações de preenchimento, ela elimina o trabalho repetitivo de rastrear sua jornada de trabalho.

---

## 🚀 Recursos Principais

*   **Lançamento Inteligente (Popup):** Rápido, com cálculo automático de fluxo de tempo (a próxima entrada herda o horário de término da anterior).
*   **Gatilhos de Autopreenchimento:** Digitar ou selecionar o cliente `DAILY` preenche a descrição automaticamente.
*   **Filtros Avançados:** Busque registros por cliente específico, data exata ou use os atalhos rápidos (*Hoje*, *Este Mês*, *Este Ano*).
*   **Painel de Relatórios 3 em 1:**
    *   📊 **Por Cliente:** Consolida e soma o total de horas dedicadas a cada cliente.
    *   📁 **Por Projeto:** Consolida as horas exibindo dinamicamente o código e a descrição amigável do projeto.
    *   🚨 **Horas Extras:** Identifica e calcula automaticamente minutos trabalhados fora da jornada padrão (antes das **08:55** e após as **18:05**), com uma sumarização destacada no rodapé.
*   **Gerenciamento Total de Dados:** Telas dedicadas para cadastrar/excluir Clientes e Projetos, além de sistemas independentes de Importação/Exportação via JSON e limpeza completa de banco.
*   **Modo Escuro Animado (Dark Mode):** Interruptor fluido em formato de pílula que rotaciona e desliza usando ativos visuais locais (`sun.png` e `full-moon.png`), salvando sua preferência para as próximas sessões.

---

## 🛠️ Arquitetura e Estrutura do Projeto

O projeto segue estritamente as especificações do ecossistema de extensões do Chrome, isolando as responsabilidades de marcação, estilo e lógica de execução.

```text
├── manifest.json              # Manifesto de configuração da Extensão do Chrome
├── popup.html                 # Interface da janela flutuante de lançamento rápido
├── popup.css                  # Estilização isolada do ecossistema do popup
├── popup.js                   # Lógica de validação, tempo real e triggers do popup
├── history.html               # Dashboard principal de gerenciamento e relatórios
├── history.css                # Estilização geral e variáveis do Tema Claro/Escuro
├── history.js                 # Motor de cálculo de horas, filtros e gerenciamento local
├── sun.png                    # Ativo customizado para o tema claro
└── full-moon.png              # Ativo customizado para o tema escuro