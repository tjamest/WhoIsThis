# WhoIsThis

Jogo de adivinhação em português. Abre diretamente no navegador, sem etapa de compilação.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos desta pasta para a branch `main`.
2. Abra **Settings → Pages** e selecione **GitHub Actions** em *Build and deployment*.
3. O workflow `.github/workflows/pages.yml` publica o jogo a cada envio para `main`. O endereço aparece em **Settings → Pages** e na execução do workflow.
4. Compartilhe o endereço com a turma. Uma pessoa clica **Criar sala online** e envia o link da sala; as outras abrem esse link nos próprios dispositivos.

O repositório precisa estar no GitHub para que o Pages publique. Esta pasta ainda não está vinculada a um repositório remoto.

## Como funciona o modo online

O GitHub Pages entrega a interface estática. PeerJS Cloud é usado apenas para localizar os navegadores e negociar a conexão; depois, as atualizações da partida seguem por uma conexão WebRTC direta. Não há sala guardada num servidor: o navegador de quem criou a partida é o anfitrião e precisa permanecer aberto e conectado. Se o anfitrião sair, a turma terá de criar outra sala. Algumas redes corporativas ou móveis podem impedir a conexão direta.

O anfitrião inicia a sala e escolhe os temas. Cada participante entra com o próprio nome. Em cada vez, somente os outros jogadores recebem a carta na interface; o jogador ativo recebe o campo para fazer perguntas e palpites. A rodada muda depois de um acerto e o placar usa o número de palpites errados.

As cartas deste protótipo são perfis ilustrados por emoji e descrição, não fotografias. O modo online é para um jogo casual: como o navegador do anfitrião distribui o estado da sala, ele não oferece proteção contra alguém que examine os dados técnicos da página.

## Arquivos

- `index.html`: interface e modo local.
- `online.js`: salas online e sincronização de ações.
- `.github/workflows/pages.yml`: publicação automática no GitHub Pages.
