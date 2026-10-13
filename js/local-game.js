let players = [];
let turn = 0;
let round = 1;
const rounds = 3;
let mode = 'shared';
let clueMode = 'auto';
const categories = new Set(['Ficção', 'História', 'Celebridades']);
const usedCharacters = new Set();
let attempts = 0;
let questions = [];
let solved = false;

const $ = (id) => document.getElementById(id);

function showView(id) {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openRules() {
  $('modal').classList.add('open');
}

function closeRules() {
  $('modal').classList.remove('open');
}

function addName(value = '') {
  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `<input class="input player-name" maxlength="22" placeholder="Nome do participante" value="${escapeHtml(value)}"><button class="icon-btn" aria-label="Remover participante" onclick="this.parentElement.remove()">×</button>`;
  $('name-list').append(row);
  row.querySelector('input').focus();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderCategories() {
  const categoryIcons = { Ficção: '🎭', História: '📜', Celebridades: '⭐', Esportes: '🏅' };
  $('categories').innerHTML = categoryNames.map((category) => `
    <button class="category ${categories.has(category) ? 'selected' : ''}" onclick="toggleCategory('${category}', this)">
      ${categoryIcons[category]}&nbsp; ${category}
    </button>
  `).join('');
}

function toggleCategory(category, button) {
  if (categories.has(category)) categories.delete(category);
  else categories.add(category);
  button.classList.toggle('selected');
}

function setMode(button) {
  mode = button.dataset.mode;
  document.querySelectorAll('#mode button').forEach((option) => {
    option.classList.toggle('selected', option === button);
  });
  $('mode-hint').textContent = mode === 'shared'
    ? 'Cada pessoa recebe um personagem secreto na sua vez. O grupo vê a carta e ajuda respondendo.'
    : 'Todo mundo recebe a mesma dica. Conversem e tentem adivinhar juntos, sem saber qual personagem está em jogo.';
}

function setClue(button) {
  clueMode = button.dataset.clue;
  document.querySelectorAll('#clue-mode button').forEach((option) => {
    option.classList.toggle('selected', option === button);
  });
}

function startGame() {
  const names = [...document.querySelectorAll('.player-name')]
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (!names.length) {
    alert('Adicione pelo menos um participante.');
    return;
  }
  if (!categories.size) {
    alert('Escolha pelo menos um tema.');
    return;
  }

  players = names.map((name, index) => ({
    name,
    icon: icons[index % icons.length],
    score: null,
    done: false,
  }));
  if (mode === 'group' && players.length > 1) {
    players = [{ name: names.join(' & '), icon: '👥', score: null, done: false }];
  }

  turn = 0;
  round = 1;
  usedCharacters.clear();
  showView('game');
  setupTurn();
}

function chooseCharacter() {
  let pool = characters.filter((character) => (
    categories.has(character.category) && !usedCharacters.has(character.name)
  ));
  if (!pool.length) {
    usedCharacters.clear();
    pool = characters.filter((character) => categories.has(character.category));
  }

  const character = pool[Math.floor(Math.random() * pool.length)];
  usedCharacters.add(character.name);
  return character;
}

function setupTurn() {
  const player = players[turn];
  if (!player) {
    endGame();
    return;
  }

  const character = chooseCharacter();
  player.character = character;
  player.score = null;
  attempts = 0;
  questions = [];
  solved = false;

  $('feedback').innerHTML = '';
  $('question-list').innerHTML = '';
  $('question-input').value = '';
  $('guess-input').value = '';
  $('next-btn').style.display = 'none';
  $('attempt-pill').textContent = '0 palpites';
  $('round-pill').textContent = `RODADA ${round} DE ${rounds}`;
  $('progress').style.width = `${((round - 1) / rounds) * 100}%`;
  $('turn-heading').textContent = mode === 'group' ? 'É a vez de todo mundo!' : `É a vez de ${player.name}!`;
  $('turn-helper').textContent = mode === 'group'
    ? 'Conversem em voz alta e tentem descobrir o personagem do grupo.'
    : `Passe o dispositivo para o grupo. ${player.name}, não olhe para a carta!`;
  $('clue-text').textContent = clueMode === 'none'
    ? 'Sem dica inicial — comecem pelas perguntas!'
    : character.clue;
  $('clue-box').style.display = clueMode === 'none' ? 'none' : 'flex';
  $('character-art').textContent = character.emoji;
  $('character-art').style.background = character.tone;
  $('character-name').textContent = character.name;
  $('character-desc').textContent = character.desc;

  renderPlayers();
  renderScores();
}

function registerQuestion(event) {
  event.preventDefault();
  if (solved) return;

  const question = $('question-input').value.trim();
  if (!question) return;

  questions.push(question);
  $('question-list').insertAdjacentHTML('afterbegin', `
    <div class="question-item"><b>${escapeHtml(players[turn].name)}:</b> ${escapeHtml(question)} <span style="color:#929287">· respondida pelo grupo</span></div>
  `);
  $('question-input').value = '';
  $('question-input').focus();
}

function submitGuess(event) {
  event.preventDefault();
  if (solved) return;

  const guess = $('guess-input').value.trim();
  if (!guess) return;

  attempts++;
  $('attempt-pill').textContent = `${attempts} ${attempts === 1 ? 'palpite' : 'palpites'}`;
  const target = players[turn].character.name;
  const correct = guess.toLocaleLowerCase('pt-BR') === target.toLocaleLowerCase('pt-BR');
  if (correct) {
    solved = true;
    players[turn].score = attempts;
    players[turn].done = true;
    $('feedback').innerHTML = `<div class="success">🎉 Acertou, ${escapeHtml(players[turn].name)}! Você descobriu em <b>${attempts} ${attempts === 1 ? 'tentativa' : 'tentativas'}</b>.</div>`;
    $('next-btn').style.display = 'inline-block';
    $('next-btn').textContent = turn === players.length - 1 ? 'Ver placar final →' : 'Próxima pessoa →';
    renderPlayers();
    renderScores();
  } else {
    $('feedback').innerHTML = '<div class="success" style="background:#fff0e6;border-color:#f3d3b5;color:#77502c">Quase! Essa resposta não é. O grupo pode responder a pergunta e você pode tentar de novo.</div>';
  }

  $('guess-input').value = '';
  $('guess-input').focus();
}

function nextTurn() {
  if (turn < players.length - 1) turn++;
  else {
    turn = 0;
    round++;
  }

  if (round > rounds) {
    endGame();
    return;
  }
  setupTurn();
}

function renderPlayers() {
  $('player-list').innerHTML = players.map((player, index) => `
    <div class="player-row ${index === turn ? 'current' : ''}">
      <span class="player-dot">${player.icon}</span>${escapeHtml(player.name)}
      ${index === turn ? '<span class="player-score">sua vez</span>' : player.done ? `<span class="player-score">${player.score} ${player.score === 1 ? 'tentativa' : 'tentativas'}</span>` : ''}
    </div>
  `).join('');
}

function sortedPlayers() {
  return [...players].sort((first, second) => (first.score ?? 999) - (second.score ?? 999));
}

function renderScores() {
  const completedPlayers = sortedPlayers().filter((player) => player.done);
  $('score-list').innerHTML = completedPlayers.length
    ? completedPlayers.map((player, index) => `
      <div class="rank-row"><span class="rank-num">${String(index + 1).padStart(2, '0')}</span><span class="rank-name">${escapeHtml(player.name)}</span><span class="rank-attempts">${player.score} ${player.score === 1 ? 'tentativa' : 'tentativas'}</span></div>
    `).join('')
    : '<div class="empty-rank">O placar aparece<br>conforme vocês acertam.</div>';
}

function endGame() {
  if (!players.length) {
    showView('home');
    return;
  }

  $('final-rank').innerHTML = sortedPlayers().map((player, index) => `
    <div class="rank-row" style="padding:14px 3px">
      <span class="rank-num">${['🥇', '🥈', '🥉'][index] || String(index + 1).padStart(2, '0')}</span>
      <span class="rank-name">${escapeHtml(player.name)}</span>
      <span class="rank-attempts">${player.done ? `${player.score} ${player.score === 1 ? 'tentativa' : 'tentativas'}` : 'não acertou'}</span>
    </div>
  `).join('');
  showView('results');
}

$('question-form').addEventListener('submit', registerQuestion);
$('guess-form').addEventListener('submit', submitGuess);
addName('Ana');
addName('Rafael');
renderCategories();
