# WhoIsThis para VRChat

Este pacote traz a primeira versão do jogo como mundo social do VRChat. Ele foi pensado para uma roda de pessoas na mesma instância: a pessoa da vez fica de costas para o painel, o grupo vê o personagem e responde em voz alta ou pelos botões de resposta. A sala sincroniza a vez, a carta e o número de palpites entre os participantes.

## Preparar o projeto

1. Instale o **VRChat Creator Companion (VCC)** e crie um projeto do tipo **Worlds**. O VCC instala o SDK e a versão de Unity compatível.
2. Feche o Unity e copie a pasta `Assets/WhoIsThis` deste pacote para a pasta `Assets` do projeto criado pelo VCC.
3. Reabra o projeto pelo VCC e aguarde o Unity compilar os scripts.
4. Abra a cena padrão do projeto. No menu do Unity, selecione `WhoIsThis > Build Game Room in Current Scene` para criar o painel, a área de palpites e os botões.
5. No SDK Control Panel, adicione o `VRCSceneDescriptor` à cena. Ajuste o ponto de spawn para perto de `(0, 0, -2)`, virado para o painel de palpites em `z = -6`.
6. Execute **Build & Test** e convide outra pessoa para validar a sincronização antes de publicar.

> Este pacote contém os scripts e um gerador de sala simples, mas não inclui o SDK do VRChat. O SDK precisa ser instalado pelo VCC. A arte final, iluminação e decoração do mundo ainda podem ser personalizadas no Unity.

## Botões e ações

O painel com a carta fica atrás da pessoa da vez; as 20 opções de palpite ficam na parede oposta, à frente dela. Assim, a pessoa pode escolher seu palpite sem olhar a própria carta. O grupo usa os botões **Sim / Não / Mais ou menos** junto ao painel da carta. Perguntas são feitas em voz alta, como numa roda presencial. Depois de acertar, qualquer participante pode liberar a vez seguinte.

O jogador ativo deve ficar de costas para a carta. VRChat não consegue esconder o texto do personagem apenas para um participante de forma segura; como no jogo físico, isso depende de os jogadores respeitarem a regra de não olhar. O projeto web continua disponível em https://tjamest.github.io/WhoIsThis/.

## Regras de rede

O mundo usa variáveis sincronizadas manuais do Udon. O dono do objeto de jogo é quem atualiza o estado; cada alteração solicita serialização. Isso permite que todos na instância vejam a mesma rodada. A pontuação é mantida na instância e não persiste depois que a sessão termina.

## Classes e funções

### `WhoIsThisWorldGame`

Controla o estado da partida e atualiza os textos do painel. A classe herda de `UdonSharpBehaviour`; os campos marcados com `[UdonSynced]` são replicados para os participantes.

| Função | O que faz |
|---|---|
| `Start()` | Desenha o estado inicial no painel quando o mundo carrega. |
| `PressStart()` | Inicia a partida, define quem joga primeiro e sorteia a carta. |
| `PressClaimTurn()` | Permite à próxima pessoa reivindicar a vez livre. |
| `PressAnswerYes()`, `PressAnswerNo()`, `PressAnswerMaybe()` | Registram uma resposta do grupo à pergunta feita em voz alta. |
| `SetAnswer(value)` | Atualiza a resposta compartilhada, se quem clicou não for a pessoa ativa. |
| `SubmitGuess(guessIndex)` | Compara a opção escolhida com a carta; conta palpites e registra o acerto. |
| `PressNextTurn()` | Libera a vez depois do acerto e prepara a próxima rodada. |
| `ChooseCard()` | Sorteia o índice da carta que todos veem no painel. |
| `AddScore()` | Insere o resultado na lista ordenada pelo número de palpites. |
| `TakeOwnership()` | Transfere a propriedade de rede para a pessoa que está alterando a partida. |
| `SaveAndRefresh()` | Solicita a sincronização Udon e atualiza a interface local. |
| `OnDeserialization()` | Atualiza a interface quando chegam dados de outro participante. |
| `RefreshBoard()` | Monta os textos de status, dica, personagem, resposta, tentativas e placar. |

### `WhoIsThisWorldButton`

Componente colocado nos botões físicos da sala. O campo `action` determina a ação do botão: `0` inicia, `1` reivindica a vez, `2` avança, `3–5` registram respostas e valores a partir de `10` selecionam a carta no índice `action - 10`.

| Função | O que faz |
|---|---|
| `Interact()` | Lê `action` e encaminha o clique à função correspondente de `WhoIsThisWorldGame`. |

### `WhoIsThisWorldBuilder`

Ferramenta de editor em `Assets/WhoIsThis/Editor`. O menu `WhoIsThis > Build Game Room in Current Scene` cria uma sala básica na cena aberta.

| Função | O que faz |
|---|---|
| `BuildRoom()` | Cria o tabuleiro, painel de texto, botões de interação e estação de palpites. |
| `MakeFloor(root)` | Adiciona o piso da sala. |
| `MakeText(parent, ...)` | Cria e posiciona um texto no painel mundial. |
| `MakeButton(root, game, ...)` | Cria um botão físico, associa sua ação e adiciona o rótulo. |
| `MakeMaterial(color)` | Cria um material simples da cor solicitada. |

As cartas e dicas ficam nos arrays `characters` e `clues`, no componente `WhoIsThisWorldGame`. Edite esses arrays pelo Inspector ou diretamente no script para personalizar o conjunto.
