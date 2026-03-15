const STORAGE_KEY = 'iphone-18-hole-scoreboard-v1';
const DEFAULT_PAR = [4,4,3,5,4,4,3,4,5,4,4,3,5,4,4,3,4,5];

const state = {
  title: '18 Hole Match',
  notes: '',
  players: [
    { name: 'Player 1', scores: Array(18).fill('') },
    { name: 'Player 2', scores: Array(18).fill('') },
  ],
};

const els = {
  eventTitleDisplay: document.getElementById('eventTitleDisplay'),
  notesField: document.getElementById('notesField'),
  notesDisplay: document.getElementById('notesDisplay'),
  playerANameLabel: document.getElementById('playerANameLabel'),
  playerBNameLabel: document.getElementById('playerBNameLabel'),
  playerATotal: document.getElementById('playerATotal'),
  playerBTotal: document.getElementById('playerBTotal'),
  playerAFront: document.getElementById('playerAFront'),
  playerABack: document.getElementById('playerABack'),
  playerBFront: document.getElementById('playerBFront'),
  playerBBack: document.getElementById('playerBBack'),
  leaderText: document.getElementById('leaderText'),
  holesComplete: document.getElementById('holesComplete'),
  scorecardList: document.getElementById('scorecardList'),
  holeTemplate: document.getElementById('holeTemplate'),
  eventDialog: document.getElementById('eventDialog'),
  eventForm: document.getElementById('eventForm'),
  eventTitleInput: document.getElementById('eventTitleInput'),
  playerAInput: document.getElementById('playerAInput'),
  playerBInput: document.getElementById('playerBInput'),
  eventNotesInput: document.getElementById('eventNotesInput'),
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.title = parsed.title || state.title;
    state.notes = parsed.notes || '';
    if (Array.isArray(parsed.players) && parsed.players.length === 2) {
      state.players = parsed.players.map((player, index) => ({
        name: player.name || `Player ${index + 1}`,
        scores: Array.isArray(player.scores)
          ? player.scores.slice(0, 18).concat(Array(Math.max(0, 18 - player.scores.length)).fill(''))
          : Array(18).fill(''),
      }));
    }
  } catch (err) {
    console.error('Failed to load scorecard', err);
  }
}

function scoreValue(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function subtotal(scores, start, end) {
  return scores.slice(start, end).reduce((sum, value) => sum + (scoreValue(value) || 0), 0);
}

function total(scores) {
  return subtotal(scores, 0, 18);
}

function holesEnteredCount() {
  let count = 0;
  for (let i = 0; i < 18; i += 1) {
    if (scoreValue(state.players[0].scores[i]) && scoreValue(state.players[1].scores[i])) count += 1;
  }
  return count;
}

function leaderSummary() {
  const aTotal = total(state.players[0].scores);
  const bTotal = total(state.players[1].scores);
  if (aTotal === 0 && bTotal === 0) return 'Even';
  if (aTotal === bTotal) return 'Even';
  const diff = Math.abs(aTotal - bTotal);
  return aTotal < bTotal
    ? `${state.players[0].name} +${diff}`
    : `${state.players[1].name} +${diff}`;
}

function holeStatus(index) {
  const a = scoreValue(state.players[0].scores[index]);
  const b = scoreValue(state.players[1].scores[index]);
  if (!a || !b) return { text: 'Enter both scores to compare this hole.', className: '' };
  if (a === b) return { text: 'Hole tied.', className: 'status-tie' };
  if (a < b) return { text: `${state.players[0].name} won this hole by ${b - a}.`, className: 'status-win-a' };
  return { text: `${state.players[1].name} won this hole by ${a - b}.`, className: 'status-win-b' };
}

function renderSummary() {
  const [a, b] = state.players;
  els.eventTitleDisplay.textContent = state.title;
  els.notesField.value = state.notes;
  els.notesDisplay.textContent = state.notes;
  els.playerANameLabel.textContent = a.name;
  els.playerBNameLabel.textContent = b.name;
  els.playerATotal.textContent = total(a.scores);
  els.playerBTotal.textContent = total(b.scores);
  els.playerAFront.textContent = subtotal(a.scores, 0, 9);
  els.playerABack.textContent = subtotal(a.scores, 9, 18);
  els.playerBFront.textContent = subtotal(b.scores, 0, 9);
  els.playerBBack.textContent = subtotal(b.scores, 9, 18);
  els.leaderText.textContent = leaderSummary();
  els.holesComplete.textContent = `${holesEnteredCount()} of 18 holes entered`;
}

function renderScorecard() {
  els.scorecardList.innerHTML = '';
  for (let i = 0; i < 18; i += 1) {
    const node = els.holeTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.hole-label').textContent = i < 9 ? 'Front Nine' : 'Back Nine';
    node.querySelector('.hole-number').textContent = `Hole ${i + 1}`;
    node.querySelector('.par-value').textContent = DEFAULT_PAR[i];
    node.querySelector('.player-a-name').textContent = state.players[0].name;
    node.querySelector('.player-b-name').textContent = state.players[1].name;

    const inputA = node.querySelector('.score-a');
    const inputB = node.querySelector('.score-b');
    inputA.value = state.players[0].scores[i];
    inputB.value = state.players[1].scores[i];

    inputA.addEventListener('input', (e) => updateScore(0, i, e.target.value));
    inputB.addEventListener('input', (e) => updateScore(1, i, e.target.value));

    const status = holeStatus(i);
    const statusEl = node.querySelector('.hole-status');
    statusEl.textContent = status.text;
    if (status.className) statusEl.classList.add(status.className);

    els.scorecardList.appendChild(node);
  }
}

function render() {
  renderSummary();
  renderScorecard();
  save();
}

function sanitizeScore(value) {
  if (value === '') return '';
  const n = Math.max(1, Math.min(15, Number(value)));
  return Number.isFinite(n) ? String(n) : '';
}

function updateScore(playerIndex, holeIndex, value) {
  state.players[playerIndex].scores[holeIndex] = sanitizeScore(value);
  render();
}

function resetCard() {
  if (!confirm('Reset all 18 holes for both players?')) return;
  state.players.forEach(player => { player.scores = Array(18).fill(''); });
  render();
}

function fillPar() {
  state.players.forEach(player => { player.scores = DEFAULT_PAR.map(String); });
  render();
}

function exportCsv() {
  const headers = ['Hole', 'Par', state.players[0].name, state.players[1].name];
  const rows = DEFAULT_PAR.map((par, index) => [
    index + 1,
    par,
    state.players[0].scores[index] || '',
    state.players[1].scores[index] || '',
  ]);
  rows.push(['Front 9', '', subtotal(state.players[0].scores, 0, 9), subtotal(state.players[1].scores, 0, 9)]);
  rows.push(['Back 9', '', subtotal(state.players[0].scores, 9, 18), subtotal(state.players[1].scores, 9, 18)]);
  rows.push(['Total', '', total(state.players[0].scores), total(state.players[1].scores)]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '18-hole-scorecard'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initEvents() {
  document.getElementById('editEventBtn').addEventListener('click', () => {
    els.eventTitleInput.value = state.title;
    els.playerAInput.value = state.players[0].name;
    els.playerBInput.value = state.players[1].name;
    els.eventNotesInput.value = state.notes;
    els.eventDialog.showModal();
  });
  document.getElementById('resetBtn').addEventListener('click', resetCard);
  document.getElementById('fillParBtn').addEventListener('click', fillPar);
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  els.notesField.addEventListener('input', (e) => {
    state.notes = e.target.value;
    render();
  });
  els.eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.title = els.eventTitleInput.value.trim() || '18 Hole Match';
    state.players[0].name = els.playerAInput.value.trim() || 'Player 1';
    state.players[1].name = els.playerBInput.value.trim() || 'Player 2';
    state.notes = els.eventNotesInput.value.trim();
    els.eventDialog.close();
    render();
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}

load();
initEvents();
render();
