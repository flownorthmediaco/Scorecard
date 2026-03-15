const STORAGE_KEY = 'putting-scoreboard-v1';

const state = {
  title: 'Putting Green Challenge',
  notes: '',
  scoringMode: 'points',
  players: [],
  editId: null,
};

const els = {
  body: document.getElementById('leaderboardBody'),
  emptyState: document.getElementById('emptyState'),
  statPlayers: document.getElementById('statPlayers'),
  statAverage: document.getElementById('statAverage'),
  statLongest: document.getElementById('statLongest'),
  statMade: document.getElementById('statMade'),
  challengeMode: document.getElementById('challengeMode'),
  notesField: document.getElementById('notesField'),
  notesDisplay: document.getElementById('notesDisplay'),
  eventTitleDisplay: document.getElementById('eventTitleDisplay'),
  playerDialog: document.getElementById('playerDialog'),
  playerDialogTitle: document.getElementById('playerDialogTitle'),
  playerForm: document.getElementById('playerForm'),
  playerName: document.getElementById('playerName'),
  longestPutt: document.getElementById('longestPutt'),
  hole1: document.getElementById('hole1'),
  hole2: document.getElementById('hole2'),
  hole3: document.getElementById('hole3'),
  eventDialog: document.getElementById('eventDialog'),
  eventTitleInput: document.getElementById('eventTitleInput'),
  eventNotesInput: document.getElementById('eventNotesInput'),
  rowTemplate: document.getElementById('rowTemplate'),
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseLongestFeet(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const feetInchMatch = raw.match(/(\d+)\s*'?\s*(\d+)?\s*"?/);
  if (feetInchMatch && raw.includes("'")) {
    const feet = Number(feetInchMatch[1] || 0);
    const inches = Number(feetInchMatch[2] || 0);
    return feet + inches / 12;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatFeet(value) {
  const totalInches = Math.round((Number(value) || 0) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}"`;
}

function getPlayerTotal(player) {
  const holes = player.holes.map(Number);
  if (state.scoringMode === 'strokes') {
    return holes.reduce((a, b) => a + b, 0);
  }
  return holes.reduce((sum, value) => {
    const map = { 1: 3, 2: 2, 3: 1, 0: 0 };
    return sum + (map[value] ?? 0);
  }, 0);
}

function getMadeCount(player) {
  return player.holes.filter(v => Number(v) > 0).length;
}

function sortedPlayers() {
  const copy = [...state.players];
  copy.sort((a, b) => {
    const totalA = getPlayerTotal(a);
    const totalB = getPlayerTotal(b);
    if (state.scoringMode === 'strokes') {
      if (totalA !== totalB) return totalA - totalB;
    } else {
      if (totalA !== totalB) return totalB - totalA;
    }
    const madeDiff = getMadeCount(b) - getMadeCount(a);
    if (madeDiff) return madeDiff;
    return (b.longestFeet || 0) - (a.longestFeet || 0);
  });
  return copy;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state.title = parsed.title || state.title;
    state.notes = parsed.notes || '';
    state.scoringMode = parsed.scoringMode || 'points';
    state.players = Array.isArray(parsed.players) ? parsed.players : [];
  } catch (err) {
    console.error('Failed to load app state', err);
  }
}

function openPlayerDialog(player = null) {
  state.editId = player?.id || null;
  els.playerDialogTitle.textContent = player ? 'Edit Player' : 'Add Player';
  els.playerName.value = player?.name || '';
  els.longestPutt.value = player?.longestInput || '';
  els.hole1.value = player?.holes?.[0] ?? 0;
  els.hole2.value = player?.holes?.[1] ?? 0;
  els.hole3.value = player?.holes?.[2] ?? 0;
  els.playerDialog.showModal();
}

function render() {
  els.eventTitleDisplay.textContent = state.title;
  els.notesDisplay.textContent = state.notes;
  els.notesField.value = state.notes;
  els.challengeMode.value = state.scoringMode;
  els.body.innerHTML = '';

  const players = sortedPlayers();
  players.forEach((player, index) => {
    const row = els.rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('.rank').textContent = index + 1;
    row.querySelector('.player').textContent = player.name;
    row.querySelector('.h1').textContent = player.holes[0];
    row.querySelector('.h2').textContent = player.holes[1];
    row.querySelector('.h3').textContent = player.holes[2];
    row.querySelector('.made').textContent = getMadeCount(player);
    row.querySelector('.longest').textContent = formatFeet(player.longestFeet || 0);
    row.querySelector('.total').textContent = getPlayerTotal(player);
    row.querySelector('.edit').addEventListener('click', () => openPlayerDialog(player));
    row.querySelector('.delete').addEventListener('click', () => deletePlayer(player.id));
    els.body.appendChild(row);
  });

  const totalPlayers = state.players.length;
  const totals = state.players.map(getPlayerTotal);
  const average = totalPlayers ? totals.reduce((a, b) => a + b, 0) / totalPlayers : 0;
  const longest = state.players.reduce((max, player) => Math.max(max, player.longestFeet || 0), 0);
  const made = state.players.reduce((sum, player) => sum + getMadeCount(player), 0);

  els.statPlayers.textContent = totalPlayers;
  els.statAverage.textContent = average.toFixed(1);
  els.statLongest.textContent = formatFeet(longest);
  els.statMade.textContent = made;
  els.emptyState.style.display = totalPlayers ? 'none' : 'block';

  save();
}

function upsertPlayer(event) {
  event.preventDefault();
  const player = {
    id: state.editId || uid(),
    name: els.playerName.value.trim(),
    longestInput: els.longestPutt.value.trim(),
    longestFeet: parseLongestFeet(els.longestPutt.value.trim()),
    holes: [Number(els.hole1.value), Number(els.hole2.value), Number(els.hole3.value)],
  };
  if (!player.name) return;

  const existingIndex = state.players.findIndex(p => p.id === player.id);
  if (existingIndex >= 0) state.players[existingIndex] = player;
  else state.players.push(player);

  state.editId = null;
  els.playerDialog.close();
  render();
}

function deletePlayer(id) {
  if (!confirm('Delete this player?')) return;
  state.players = state.players.filter(player => player.id !== id);
  render();
}

function resetEvent() {
  if (!confirm('Reset the full event and remove all players?')) return;
  state.players = [];
  state.notes = '';
  state.title = 'Putting Green Challenge';
  render();
}

function exportCsv() {
  const headers = ['Rank','Player','Hole 1','Hole 2','Hole 3','Putts Made','Longest Made Putt','Total'];
  const rows = sortedPlayers().map((player, index) => [
    index + 1,
    player.name,
    player.holes[0],
    player.holes[1],
    player.holes[2],
    getMadeCount(player),
    formatFeet(player.longestFeet || 0),
    getPlayerTotal(player),
  ]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'putting-scoreboard'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadDemo() {
  state.title = 'Flow North Putting Challenge';
  state.notes = 'Sponsor: Flow North Media Co.';
  state.players = [
    { id: uid(), name: 'Mason', holes: [1, 1, 2], longestInput: "18' 3\"", longestFeet: 18.25 },
    { id: uid(), name: 'Jake', holes: [2, 1, 3], longestInput: '15', longestFeet: 15 },
    { id: uid(), name: 'Emma', holes: [1, 2, 2], longestInput: '12.5', longestFeet: 12.5 },
  ];
  render();
}

function initEvents() {
  document.getElementById('addPlayerBtn').addEventListener('click', () => openPlayerDialog());
  document.getElementById('editEventBtn').addEventListener('click', () => {
    els.eventTitleInput.value = state.title;
    els.eventNotesInput.value = state.notes;
    els.eventDialog.showModal();
  });
  document.getElementById('resetBtn').addEventListener('click', resetEvent);
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  document.getElementById('demoBtn').addEventListener('click', loadDemo);
  els.challengeMode.addEventListener('change', (e) => {
    state.scoringMode = e.target.value;
    render();
  });
  els.notesField.addEventListener('input', (e) => {
    state.notes = e.target.value;
    render();
  });
  els.playerForm.addEventListener('submit', upsertPlayer);
  document.getElementById('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.title = els.eventTitleInput.value.trim() || 'Putting Green Challenge';
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
