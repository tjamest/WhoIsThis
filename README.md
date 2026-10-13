# WhoIsThis

Jogo de adivinhação em português: cada pessoa recebe um personagem secreto, faz perguntas para o grupo e tenta acertar com o menor número de palpites.

- **Jogar online:** [tjamest.github.io/WhoIsThis](https://tjamest.github.io/WhoIsThis/)
- **Repositório:** [github.com/tjamest/WhoIsThis](https://github.com/tjamest/WhoIsThis)

## Como abrir e jogar

### Versão online

1. Abra o [WhoIsThis](https://tjamest.github.io/WhoIsThis/) no navegador.
2. Para jogar no mesmo dispositivo, selecione **Jogar neste dispositivo**.
3. Para jogar em dispositivos diferentes, selecione **Criar sala online** e envie o link gerado para os participantes. Eles abrem o link e escolhem um nome.

No modo online, o anfitrião mantém a sala aberta durante a partida. O site usa PeerJS para conectar os navegadores por WebRTC; algumas redes podem bloquear essa conexão.

### Executar uma cópia local

1. Baixe o projeto pelo GitHub com **Code → Download ZIP** e extraia a pasta, ou clone o repositório:

   ```bash
   git clone https://github.com/tjamest/WhoIsThis.git
   cd WhoIsThis
   ```

2. Abra `index.html` no navegador para jogar localmente. Para servir a pasta em `http://localhost:8000`, execute:

   ```bash
   python -m http.server 8000
   ```

3. Acesse `http://localhost:8000`. O modo online continua usando o PeerJS hospedado externamente.

Não é necessário instalar dependências para o modo local. O PeerJS e as fontes web são carregados de serviços externos.

## Regras

No modo de uma pessoa por vez, o grupo vê a carta e quem está jogando faz perguntas que possam ser respondidas com “sim”, “não” ou “mais ou menos”. Perguntas não contam como tentativas; cada palpite errado soma uma. A partida tem três rodadas e o placar ordena os acertos pelo número de tentativas. Também há um modo para todo o grupo adivinhar junto.

As cartas do protótipo são personagens descritos e ilustrados com emojis, não fotografias.

## Organização do código web

```text
index.html                 Estrutura das telas e dos formulários
css/styles.css             Estilos e adaptação para telas menores
js/game-data.js            Personagens, categorias e ícones
js/local-game.js           Estado e regras da partida local
js/online/state.js         Estado compartilhado e escape de texto
js/online/room.js          Criar/entrar em salas e encerrar conexão
js/online/lobby.js         Participantes, temas e início da rodada
js/online/round.js         Mensagens, palpites e interface da partida online
```

Os scripts são carregados no fim de `index.html` com `defer`, na ordem das dependências. A versão web usa funções e estado compartilhado, sem classes JavaScript.

### Dados e modo local

| Função/valor | Arquivo | O que faz |
|---|---|---|
| `characters` | `js/game-data.js` | Lista de personagens, categoria, dica, emoji e cor. |
| `categoryNames`, `icons` | `js/game-data.js` | Temas oferecidos e ícones usados para identificar participantes. |
| `$` | `js/local-game.js` | Atalho para localizar um elemento pelo `id`. |
| `showView(id)` | `js/local-game.js` | Mostra uma tela do jogo e rola a página para o topo. |
| `openRules()`, `closeRules()` | `js/local-game.js` | Abre e fecha a explicação das regras. |
| `addName(value)` | `js/local-game.js` | Cria um campo para adicionar um participante. |
| `escapeHtml(value)` | `js/local-game.js` | Codifica texto antes de inseri-lo em HTML. |
| `renderCategories()` | `js/local-game.js` | Desenha os botões de tema. |
| `toggleCategory(category, button)` | `js/local-game.js` | Inclui ou remove um tema da seleção. |
| `setMode(button)` | `js/local-game.js` | Escolhe entre uma pessoa por vez e adivinhação em grupo. |
| `setClue(button)` | `js/local-game.js` | Define se a rodada começa com uma dica. |
| `startGame()` | `js/local-game.js` | Lê nomes e opções e inicia a partida local. |
| `chooseCharacter()` | `js/local-game.js` | Sorteia um personagem dos temas escolhidos e evita repetições até esgotar as opções. |
| `setupTurn()` | `js/local-game.js` | Prepara a carta, dica, placar e formulário da pessoa da vez. |
| `registerQuestion(event)` | `js/local-game.js` | Registra a pergunta feita ao grupo; perguntas não alteram a pontuação. |
| `submitGuess(event)` | `js/local-game.js` | Compara o palpite, soma tentativas e registra o acerto. |
| `nextTurn()` | `js/local-game.js` | Avança para a pessoa ou rodada seguinte. |
| `renderPlayers()` | `js/local-game.js` | Atualiza a lista de participantes e indica quem está jogando. |
| `sortedPlayers()` | `js/local-game.js` | Ordena participantes por tentativas; quem não acertou fica no fim. |
| `renderScores()` | `js/local-game.js` | Atualiza o placar parcial. |
| `endGame()` | `js/local-game.js` | Monta o placar final e mostra a tela de resultados. |

### Modo online

| Função/estado | Arquivo | O que faz |
|---|---|---|
| `netPeer`, `netConnections`, `netGame` e outros estados `net*` | `js/online/state.js` | Mantêm a conexão PeerJS, os participantes e o estado da sala no navegador. |
| `onlineEsc(value)` | `js/online/state.js` | Codifica texto recebido antes de mostrá-lo como HTML. |
| `createOnlineRoom()` | `js/online/room.js` | Cria a conexão PeerJS do anfitrião e abre uma sala. |
| `joinOnlinePrompt()` | `js/online/room.js` | Lê um link já aberto ou pede um código de sala. |
| `joinOnlineRoom(value)` | `js/online/room.js` | Conecta um participante à sala indicada. |
| `onlineInviteUrl(id)` | `js/online/room.js` | Monta o link que identifica a sala. |
| `copyRoomLink()` | `js/online/room.js` | Copia o link para a área de transferência. |
| `netError(error)` | `js/online/room.js` | Mostra falhas de conexão. |
| `leaveOnline()` | `js/online/room.js` | Fecha PeerJS, limpa o estado e volta ao início. |
| `renderOnlineCategories()` | `js/online/lobby.js` | Desenha as opções de tema no lobby. |
| `toggleOnlineCategory(category, button)` | `js/online/lobby.js` | Seleciona ou remove um tema online. |
| `setOnlineClue(mode)` | `js/online/lobby.js` | Ativa ou desativa a dica inicial da partida online. |
| `renderLobby()` | `js/online/lobby.js` | Atualiza a lista de participantes e o estado do anfitrião. |
| `hostStartOnline()` | `js/online/lobby.js` | Valida o lobby e sorteia uma carta para cada participante. |
| `hostMessage(connection, message)` | `js/online/round.js` | Valida e processa entradas, perguntas, respostas e palpites no anfitrião. |
| `broadcastState()` | `js/online/round.js` | Envia a partida atual a todos os participantes conectados. |
| `handleClientMessage(message)` | `js/online/round.js` | Recebe atualizações enviadas pelo anfitrião. |
| `advanceOnline()` | `js/online/round.js` | Avança a vez e prepara a carta do próximo participante. |
| `sendOnline(message)` | `js/online/round.js` | Encaminha uma ação local ao anfitrião ou a processa no anfitrião. |
| `renderOnlineGame()` | `js/online/round.js` | Desenha a rodada, perguntas, personagem visível ao grupo e placar. |
| `submitOnlineQuestion(event)` | `js/online/round.js` | Envia a pergunta da pessoa da vez. |
| `submitOnlineGuess(event)` | `js/online/round.js` | Envia um palpite para validação no anfitrião. |

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` publica a pasta do site quando há atualização na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como origem. A URL pública do projeto está no topo deste README.


