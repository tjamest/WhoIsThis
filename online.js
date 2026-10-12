/* Online rooms use PeerJS for signaling and direct WebRTC data channels.
   The room creator is the host and must stay online for the room to work. */
let netPeer=null,netConnections=new Map(),netHost=false,netJoined=false,netClientId=null,netRoomId=null,netGame=null,netName='',onlineClueMode='auto',onlineCategories=new Set(['Ficção','História','Celebridades']);
const onlineEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createOnlineRoom(){if(typeof Peer==='undefined'){alert('Não foi possível carregar a conexão online. Verifique a internet e tente novamente.');return}netHost=true;netJoined=true;netGame={phase:'lobby',players:[],turn:0,attempts:0,questions:[],character:null,clueMode:'auto',categories:['Ficção','História','Celebridades']};showView('online');$('online-status').textContent='Criando uma sala segura entre dispositivos…';$('lobby-title').textContent='Sua sala está quase pronta';$('lobby-copy').textContent='Compartilhe o link. Seus amigos entram pelo próprio celular ou computador.';$('room-share').style.display='flex';$('lobby-settings').style.display='block';$('start-online-btn').style.display='inline-block';renderOnlineCategories();netPeer=new Peer();netPeer.on('open',id=>{netRoomId=id;netClientId=id;netName='Anfitrião';netGame.players=[{id,name:netName,score:null,done:false}];$('room-code').textContent=onlineInviteUrl(id);$('online-status').textContent='Sala aberta · esperando a turma entrar';history.replaceState({},'',location.pathname+`?s=${encodeURIComponent(id)}`);renderLobby()});netPeer.on('connection',conn=>{netConnections.set(conn.peer,conn);conn.on('data',data=>hostMessage(conn,data));conn.on('close',()=>{if(netGame?.phase==='lobby'){netGame.players=netGame.players.filter(p=>p.id!==conn.peer);renderLobby()}})});netPeer.on('error',netError)}
function joinOnlinePrompt(){const u=new URL(location.href);const id=u.searchParams.get('s');const room=id||prompt('Cole aqui o link ou código da sala:');if(!room)return;joinOnlineRoom(room)}
function joinOnlineRoom(value){if(typeof Peer==='undefined'){alert('Não foi possível carregar a conexão online. Verifique a internet e tente novamente.');return}let id=String(value).trim();try{if(id.includes('://'))id=new URL(id).searchParams.get('s')||id}catch{}if(id.includes('?s=')){try{id=new URL(id,location.href).searchParams.get('s')||id}catch{}}if(!id){alert('Esse link não contém o código da sala.');return}netHost=false;netRoomId=id;showView('online');$('online-status').textContent='Conectando à sala…';$('lobby-title').textContent='Entre na partida';$('lobby-copy').textContent='Informe seu nome para aparecer na lista de participantes.';$('online-name-form').style.display='flex';$('room-share').style.display='none';netPeer=new Peer();netPeer.on('open',pid=>{netClientId=pid;const conn=netPeer.connect(id,{reliable:true});netConnections.set('host',conn);conn.on('open',()=>{$('online-name').focus();$('online-status').textContent='Conectado à sala. Escolha seu nome.'});conn.on('data',handleClientMessage);conn.on('close',()=>{$('online-status').textContent='Conexão encerrada. Peça ao anfitrião para abrir uma nova sala.'})});netPeer.on('error',netError)}
function onlineInviteUrl(id){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('s',id);return u.href}
async function copyRoomLink(){try{await navigator.clipboard.writeText(onlineInviteUrl(netRoomId));$('online-status').textContent='Link copiado! Envie para quem vai jogar.'}catch{$('online-status').textContent='Copie o link que aparece na sala e envie para sua turma.'}}
function netError(err){$('online-status').textContent='A conexão não foi estabelecida. Confira o código e tente de novo.';console.error('Conexão online:',err)}
function renderOnlineCategories(){const icons={'Ficção':'🎭','História':'📜','Celebridades':'⭐','Esportes':'🏅'};$('online-categories').innerHTML=categoryNames.map(c=>`<button class="category ${onlineCategories.has(c)?'selected':''}" onclick="toggleOnlineCategory('${c}',this)">${icons[c]}&nbsp;${c}</button>`).join('')}
function toggleOnlineCategory(c,b){if(onlineCategories.has(c))onlineCategories.delete(c);else onlineCategories.add(c);b.classList.toggle('selected')}
function setOnlineClue(v){onlineClueMode=v;$('online-clue-auto').classList.toggle('selected',v==='auto');$('online-clue-none').classList.toggle('selected',v==='none')}
function renderLobby(){if(!netGame)return;$('lobby-players').innerHTML=netGame.players.map((p,i)=>`<div class="lobby-player"><span class="player-dot">${icons[i%icons.length]}</span>${onlineEsc(p.name)}${p.id===netClientId?' <span class="player-score">(você)</span>':''}</div>`).join('');$('online-status').textContent=`${netGame.players.length} ${netGame.players.length===1?'pessoa na sala':'pessoas na sala'}`;if(netHost){$('start-online-btn').disabled=netGame.players.length<2;$('start-online-btn').title=netGame.players.length<2?'Espere mais uma pessoa entrar.':''}}
$('online-name-form').addEventListener('submit',e=>{e.preventDefault();netName=$('online-name').value.trim();if(!netName)return;const c=netConnections.get('host');if(c?.open){c.send({type:'join',name:netName});$('online-name-form').style.display='none';$('online-status').textContent='Entrando na sala…'}});
function hostMessage(conn,m){if(!m||!netGame)return;if(m.type==='join'&&netGame.phase==='lobby'&&!netGame.players.some(p=>p.id===conn.peer)){netGame.players.push({id:conn.peer,name:String(m.name||'Jogador').slice(0,22),score:null,done:false});renderLobby();conn.send({type:'state',game:netGame,clientId:conn.peer});netGame.players.forEach(p=>{if(p.id===conn.peer)return;const c=netConnections.get(p.id);if(c?.open)c.send({type:'state',game:netGame,clientId:p.id})});return}if(m.type==='question'&&netGame.phase==='playing'&&conn.peer===netGame.players[netGame.turn]?.id){netGame.questions.push({text:String(m.text||'').slice(0,120),answers:{}});netGame.feedback='';broadcastState();return}if(m.type==='answer'&&netGame.phase==='playing'&&['Sim','Não','Mais ou menos'].includes(m.answer)){const q=netGame.questions[m.index];if(q&&conn.peer!==netGame.players[netGame.turn]?.id&&!q.answers[conn.peer]){q.answers[conn.peer]=m.answer;broadcastState()}return}if(m.type==='guess'&&netGame.phase==='playing'&&conn.peer===netGame.players[netGame.turn]?.id){netGame.attempts++;const answer=String(m.text||'').trim().toLocaleLowerCase('pt-BR'),target=netGame.character.name.toLocaleLowerCase('pt-BR');if(answer===target){const p=netGame.players[netGame.turn];p.score=netGame.attempts;p.done=true;netGame.feedback=`🎉 ${p.name} acertou em ${p.score} ${p.score===1?'tentativa':'tentativas'}!`;netGame.phase='finished';broadcastState()}else{netGame.feedback=`${String(m.text||'').slice(0,60)} não é. Tentativa ${netGame.attempts}.`;broadcastState()}return}if(m.type==='next'&&netGame.phase==='finished'&&netHost){advanceOnline();return}}
function broadcastState(){for(const [id,c] of netConnections){if(c.open)c.send({type:'state',game:netGame,clientId:id})}renderOnlineGame()}
function handleClientMessage(m){if(!m)return;if(m.type==='state'){netGame=m.game;netClientId=m.clientId;netJoined=true;if(netGame.phase==='lobby'){renderLobby();$('lobby').style.display='block';$('online-game').style.display='none'}else renderOnlineGame()}}
function hostStartOnline(){if(!netHost||!netGame||!onlineCategories.size){alert('Escolha pelo menos um tema.');return}netGame.players=netGame.players.filter(p=>netConnections.has(p.id)||p.id===netClientId);if(netGame.players.length<2){alert('Espere pelo menos mais uma pessoa entrar na sala.');return}netGame.players[0].name=$('online-host-name').value.trim()||'Anfitrião';netName=netGame.players[0].name;netGame.categories=[...onlineCategories];netGame.clueMode=onlineClueMode;const pool=characters.filter(c=>onlineCategories.has(c.category));if(!pool.length){alert('Não há personagens nesse tema ainda. Escolha outro tema.');return}netGame.deck=netGame.players.map(()=>pool[Math.floor(Math.random()*pool.length)]);netGame.phase='playing';netGame.turn=0;netGame.round=1;netGame.attempts=0;netGame.questions=[];netGame.character=netGame.deck[0];netGame.feedback='';broadcastState()}
function advanceOnline(){netGame.turn++;if(netGame.turn>=netGame.players.length){netGame.phase='complete';broadcastState();return}netGame.phase='playing';netGame.character=netGame.deck[netGame.turn];netGame.attempts=0;netGame.questions=[];netGame.feedback='';broadcastState()}
function sendOnline(msg){if(netHost){hostMessage({peer:netClientId},msg);return}const c=netConnections.get('host');if(c?.open)c.send(msg)}
function renderOnlineGame() {
  if (!netGame) return;
  $('lobby').style.display = netGame.phase === 'lobby' ? 'block' : 'none';
  $('online-game').style.display = netGame.phase === 'lobby' ? 'none' : 'block';
  if (netGame.phase === 'lobby') { renderLobby(); return; }

  const player = netGame.players[netGame.turn];
  const active = player?.id === netClientId;
  const completed = netGame.phase === 'complete' || netGame.phase === 'finished';
  const character = netGame.character;
  const clue = netGame.clueMode === 'none' ? 'Sem dica inicial.' : character.clue;
  const questionHtml = netGame.questions.map((question, index) => {
    const mine = question.answers?.[netClientId];
    const votes = Object.entries(question.answers || {}).map(([id, answer]) => {
      const voter = netGame.players.find(item => item.id === id)?.name || 'Jogador';
      return `${onlineEsc(voter)}: ${answer}`;
    }).join(' · ');
    const answerButtons = !active && !mine && netGame.phase === 'playing'
      ? ['Sim', 'Não', 'Mais ou menos'].map(answer => `<button onclick="sendOnline({type:'answer',index:${index},answer:'${answer}'})">${answer}</button>`).join('')
      : '';
    return `<div class="online-question"><b>${onlineEsc(player.name)} perguntou:</b> ${onlineEsc(question.text)}${votes ? '<div class="answer-votes">' + votes + '</div>' : ''}${answerButtons ? '<div class="answer-actions">' + answerButtons + '</div>' : ''}</div>`;
  }).join('');

  const characterHtml = active
    ? '<div class="online-hidden">🙈<b>Seu personagem está escondido</b>O grupo vê a carta. Não peça para ninguém escrever o nome no chat!</div>'
    : `<div class="character-card"><div class="character-art" style="background:${character.tone}">${character.emoji}</div><div class="character-info"><small>Personagem secreto de ${onlineEsc(player.name)}</small><strong>${onlineEsc(character.name)}</strong><p>${onlineEsc(character.desc)}</p></div><span class="visible-tag">👀 Você vê</span></div>`;
  const questionForm = active
    ? '<form class="question-form" onsubmit="return submitOnlineQuestion(event)"><input class="input" id="net-question" maxlength="120" placeholder="Ex.: sou uma pessoa real?" required><button class="btn secondary">Perguntar</button></form>'
    : '';
  const guessForm = active
    ? '<div class="guess-divider">Seu palpite</div><form class="guess-form" onsubmit="return submitOnlineGuess(event)"><input class="input" id="net-guess" maxlength="80" placeholder="Quem você acha que é?" required><button class="btn">Chutar ↗</button></form>'
    : '';
  const feedback = netGame.feedback
    ? `<div id="net-feedback" class="success">${onlineEsc(netGame.feedback)}</div>`
    : '<div id="net-feedback" class="success" style="display:none"></div>';
  const nextAction = completed && netHost
    ? `<div class="panel-actions"><button class="btn primary" onclick="advanceOnline()">${netGame.phase === 'complete' ? 'Encerrar partida' : 'Próxima pessoa →'}</button></div>`
    : '';
  const waitingText = completed && !netHost
    ? '<p class="hint">Aguardando quem criou a sala iniciar a próxima vez.</p>'
    : '';
  const playerRows = netGame.players.map((item, index) => {
    const score = item.done ? `${item.score} ${item.score === 1 ? 'tentativa' : 'tentativas'}` : '';
    return `<div class="player-row ${index === netGame.turn ? 'current' : ''}"><span class="player-dot">${icons[index % icons.length]}</span>${onlineEsc(item.name)}<span class="player-score">${score}</span></div>`;
  }).join('');
  const sortedScores = [...netGame.players].filter(item => item.done).sort((a, b) => a.score - b.score);
  const scoreRows = sortedScores.map((item, index) => `<div class="rank-row"><span class="rank-num">${index + 1}</span><span class="rank-name">${onlineEsc(item.name)}</span><span class="rank-attempts">${item.score} palpites</span></div>`).join('');
  const scorePanel = scoreRows || '<p class="rule-copy">O placar aparece conforme vocês acertam.</p>';
  const roundNumber = netGame.turn + 1;
  const progress = Math.round(netGame.turn / netGame.players.length * 100);
  const heading = completed ? 'Placar da partida' : `É a vez de ${onlineEsc(player.name)}!`;
  const helper = completed
    ? 'Menos tentativas significa uma colocação melhor.'
    : active
      ? 'Seu personagem está escondido. Pergunte ao grupo e tente adivinhar!'
      : 'Veja o personagem e ajude respondendo às perguntas.';
  const gameplay = completed ? '' : `<div class="clue"><div class="clue-icon">✨</div><div><small>Dica para a roda</small><strong>${onlineEsc(clue)}</strong></div></div>${characterHtml}<div class="prompt">${active ? 'Faça uma pergunta para o grupo' : 'Ajude respondendo sim, não ou mais ou menos'}</div>${questionForm}<div class="question-list">${questionHtml}</div>${guessForm}${feedback}${nextAction}${waitingText}`;

  $('online-game').innerHTML = `<div class="online-game-grid"><div class="panel round-panel"><div class="round-top"><span class="pill">RODADA ${roundNumber} DE ${netGame.players.length}</span><span class="pill">${netGame.attempts} ${netGame.attempts === 1 ? 'palpite' : 'palpites'}</span></div><div class="progress"><span style="width:${progress}%"></span></div><h3 class="turn-heading">${heading}</h3><p class="turn-helper">${helper}</p>${gameplay}</div><aside class="sidebar"><div class="side-panel"><h3 class="side-title">Na sala</h3>${playerRows}</div><div class="side-panel"><h3 class="side-title">Placar</h3>${scorePanel}</div><div class="side-panel"><p class="rule-copy">Cada palpite errado soma uma tentativa. Só o jogador da vez vê o campo de palpite. A sala permanece ativa enquanto o anfitrião estiver conectado.</p></div></aside></div>`;
  $('online-status').textContent = netGame.phase === 'complete' ? 'Partida encerrada · placar final' : `Conectado · ${netGame.players.length} jogadores`;
}function submitOnlineQuestion(e){e.preventDefault();const t=$('net-question').value.trim();if(t)sendOnline({type:'question',text:t});return false}
function submitOnlineGuess(e){e.preventDefault();const t=$('net-guess').value.trim();if(t)sendOnline({type:'guess',text:t});return false}
function leaveOnline(){if(netPeer)netPeer.destroy();netPeer=null;netConnections.clear();netGame=null;netHost=false;netJoined=false;netRoomId=null;history.replaceState({},'',location.pathname);showView('home')}
window.addEventListener('load',()=>{const room=new URL(location.href).searchParams.get('s');if(room)joinOnlineRoom(room)});
