/* SIRAJ CUP ANNI — beginner-friendly, browser-only demo */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
const areaNames = ['Anni','Kullu','Nirmand','Banjar','Luhri','Khanag','Rampur','Nither','Duttnagar','Sarahan','Shillai','Baghipul','Kushwa','Dalash','Dharla','Jalori'];
const teamWords = ['Warriors','Strikers','Kings','Riders','Super Kings','Titans','Eagles','Panthers'];
const teams = Array.from({ length: 128 }, (_, i) => ({
  id: i + 1, name: `${areaNames[i % areaNames.length]} ${teamWords[Math.floor(i / areaNames.length) % teamWords.length]}${Math.floor(i / 32) ? ` ${Math.floor(i / 32) + 1}` : ''}`,
  area: areaNames[i % areaNames.length], demo: true
}));
const rounds = [
  { name: 'Round of 128', count: 64 }, { name: 'Round of 64', count: 32 }, { name: 'Round of 32', count: 16 },
  { name: 'Round of 16', count: 8 }, { name: 'Quarterfinal', count: 4 }, { name: 'Semifinal', count: 2 }, { name: 'Final', count: 1 }
];
let matches = store.get('sirajDemoMatches', null);
if (!matches || matches.length !== 127) {
  matches = [];
  let no = 1;
  rounds.forEach((round, ri) => {
    for (let i = 0; i < round.count; i++) {
      const date = new Date(2027, 0, 14 + Math.floor((no - 1) * 30 / 127));
      const previousRoundStart = rounds.slice(0, Math.max(0, ri - 1)).reduce((n, r) => n + r.count, 0);
      matches.push({ no: no++, round: ri, slot: i, date: date.toISOString().slice(0, 10), status: ri === 0 && i < 3 ? 'Completed' : 'Upcoming',
        teamA: ri === 0 ? teams[i * 2].name : 'Winner of Match ' + (previousRoundStart + i * 2 + 1),
        teamB: ri === 0 ? teams[i * 2 + 1].name : 'Winner of Match ' + (previousRoundStart + i * 2 + 2),
        scoreA: ri === 0 && i < 3 ? [142, 118, 165][i] : '', scoreB: ri === 0 && i < 3 ? [128, 121, 153][i] : '',
        winner: ri === 0 && i < 3 ? (i === 1 ? teams[i * 2 + 1].name : teams[i * 2].name) : '' });
    }
  });
  store.set('sirajDemoMatches', matches);
}
let registrations = store.get('sirajDemoRegistrations', []);
let activeFilter = 'all';
let showAllTeams = false;

// Mobile navigation
$('.menu-toggle').addEventListener('click', () => {
  const nav = $('.main-nav'); const open = nav.classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded', String(open)); $('.menu-toggle').textContent = open ? '×' : '☰';
});
$$('.main-nav a').forEach(link => link.addEventListener('click', () => { $('.main-nav').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded', 'false'); $('.menu-toggle').textContent = '☰'; }));

// Build the eleven required player fields and five optional substitutes.
const playerFields = $('#playerFields');
for (let i = 1; i <= 16; i++) {
  const optional = i > 11; const label = document.createElement('label');
  label.innerHTML = `<small>${optional ? 'SUB' : 'PLAYER'} ${optional ? i - 11 : i}${optional ? '' : ' *'}</small><input name="player${i}" ${optional ? '' : 'required'} maxlength="60" placeholder="${optional ? 'Optional' : 'Player name'}" aria-label="${optional ? 'Optional substitute' : 'Required player'} ${optional ? i - 11 : i} name">`;
  playerFields.append(label);
}

// Sample team search and list
function renderTeams(query = '') {
  const found = teams.filter(t => `${t.name} ${t.area}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = query ? found : (showAllTeams ? found : found.slice(0, 12));
  $('#teamsGrid').innerHTML = visible.length ? visible.map(t => `<article class="team-card"><span class="team-crest">${String(t.id).padStart(2, '0')}</span><span><strong>${t.name}</strong><small>${t.area} · DEMO TEAM</small></span></article>`).join('') : '<div class="empty-state">No sample teams match that search.</div>';
  $('#teamCount').textContent = query ? `${found.length} sample ${found.length === 1 ? 'team' : 'teams'} found` : `${showAllTeams ? '128' : '12'} of 128 sample teams`;
  $('#showMoreTeams').hidden = !!query || showAllTeams;
}
renderTeams();
$('#teamSearch').addEventListener('input', e => renderTeams(e.target.value));
$('#showMoreTeams').addEventListener('click', () => { showAllTeams = true; renderTeams($('#teamSearch').value); });

function prettyDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
function renderFixtures() {
  const visible = matches.filter(m => activeFilter === 'all' || m.status.toLowerCase() === activeFilter).slice(0, 10);
  $('#matchList').innerHTML = visible.map(m => `<article class="match-card"><div class="match-date"><b>${prettyDate(m.date)}</b>${rounds[m.round].name}</div><div class="match-teams">${m.teamA}<br><span>VS</span><br>${m.teamB}</div><div class="match-status ${m.status.toLowerCase()}">${m.status === 'Completed' ? 'COMPLETED' : 'UPCOMING'}${m.winner ? `<b>${m.scoreA} – ${m.scoreB}</b>` : ''}</div></article>`).join('') || '<div class="empty-state">No sample matches in this filter.</div>';
}
$$('.filter-tabs button').forEach(button => button.addEventListener('click', () => { $$('.filter-tabs button').forEach(b => b.classList.remove('active')); button.classList.add('active'); activeFilter = button.dataset.filter; renderFixtures(); }));

function renderBracket() {
  let offset = 0;
  $('#bracketGrid').innerHTML = rounds.map((round, ri) => {
    const items = matches.slice(offset, offset + round.count); offset += round.count;
    return `<section class="bracket-round"><h3>${round.name} <small>(${round.count})</small></h3><div class="bracket-matches">${items.map(m => `<article class="bracket-match ${m.status === 'Completed' ? 'done' : 'scheduled'}"><span class="match-no">MATCH ${String(m.no).padStart(3, '0')} · DEMO</span><span class="bracket-team ${m.winner === m.teamA ? 'winner' : ''}">${m.teamA}<em>${m.scoreA}</em></span><span class="bracket-team ${m.winner === m.teamB ? 'winner' : ''}">${m.teamB}<em>${m.scoreB}</em></span></article>`).join('')}</div></section>`;
  }).join('');
}
renderBracket(); renderFixtures();

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3600); }
$('#registrationForm').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget; const feedback = $('#formFeedback');
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key of ['captainPhone', 'vicePhone', 'managerPhone']) {
    if (data[key] && !/^\d{10}$/.test(data[key])) { feedback.className = 'feedback error'; feedback.textContent = 'Please enter mobile numbers using exactly 10 digits.'; return; }
  }
  const ref = `SCA-DEMO-${Date.now().toString().slice(-7)}`;
  const players = Array.from({ length: 16 }, (_, i) => data[`player${i + 1}`] || '');
  registrations = store.get('sirajDemoRegistrations', []);
  registrations.unshift({ ref, teamName: data.teamName.trim(), area: data.area.trim(), captain: data.captain.trim(), captainPhone: data.captainPhone, viceCaptain: data.viceCaptain || '', vicePhone: data.vicePhone || '', manager: data.manager || '', managerPhone: data.managerPhone || '', players, payment: 'Pending', created: new Date().toLocaleString('en-IN'), demo: true });
  store.set('sirajDemoRegistrations', registrations); renderOrganizer();
  feedback.className = 'feedback'; feedback.innerHTML = `<b>Demo registration received · ${ref}</b><br>Your details are saved on this device only. No payment was collected and your team is not officially confirmed.`;
  form.reset(); toast(`Demo registration saved. Reference: ${ref}`);
});

let activePanel = 'registrations';
function renderOrganizer() {
  registrations = store.get('sirajDemoRegistrations', []);
  $('#registrationTotal').textContent = registrations.length;
  const content = $('#organizerContent');
  if (activePanel === 'registrations') {
    content.innerHTML = `<p class="organizer-note">DEMO registrations saved only in this browser. Captain phone numbers are hidden in this panel.</p>` + (registrations.length ? registrations.map((r, i) => `<article class="org-row"><div><strong>${r.teamName}</strong><small>${r.area} · ${r.captain} · ${r.ref}</small></div><span class="org-status ${r.payment === 'Paid' ? 'paid' : ''}">${r.payment} · DEMO</span><span class="org-meta">${r.players.filter(Boolean).length} player names</span><div class="org-actions"><button data-reg-index="${i}" data-payment="Pending">Pending</button><button data-reg-index="${i}" data-payment="Paid">Paid</button></div></article>`).join('') : '<div class="empty-state">No demo registrations yet. Submit the form above to see one here.</div>');
    $$('[data-reg-index]', content).forEach(btn => btn.addEventListener('click', () => { const rows = store.get('sirajDemoRegistrations', []); rows[Number(btn.dataset.regIndex)].payment = btn.dataset.payment; store.set('sirajDemoRegistrations', rows); renderOrganizer(); toast(`Demo payment status set to ${btn.dataset.payment}.`); }));
  } else if (activePanel === 'sampleTeams') {
    content.innerHTML = `<p class="organizer-note">128 SAMPLE TEAMS · DEMO. First 12 shown below; full list is in the Teams section.</p>` + teams.slice(0, 12).map(t => `<article class="org-row"><div><strong>${t.name}</strong><small>${t.area} · DEMO TEAM</small></div><span class="org-status">SAMPLE</span><span></span><span class="org-meta">Team ${String(t.id).padStart(3, '0')}</span></article>`).join('');
  } else {
    content.innerHTML = `<p class="organizer-note">Update a sample match score and winner. All changes persist on this device and are marked DEMO.</p><form id="matchUpdateForm" class="org-row match-update-form"><label>Match<select name="matchNo">${matches.slice(0, 20).map(m => `<option value="${m.no}">#${m.no} · ${rounds[m.round].name} · ${m.teamA} vs ${m.teamB}</option>`).join('')}</select></label><label>Team A score<input name="scoreA" type="text" placeholder="e.g. 142/6" required></label><label>Team B score<input name="scoreB" type="text" placeholder="e.g. 138/8" required></label><label>Winner<select name="winner"><option value="A">Team A</option><option value="B">Team B</option></select></label><button class="button button-orange" type="submit">SAVE DEMO RESULT</button></form><div class="org-row"><div><strong>DEMO SAMPLE RESULT</strong><small>${matches.find(m => m.no === 1).teamA} vs ${matches.find(m => m.no === 1).teamB}</small></div><span class="org-status paid">COMPLETED</span><span>${matches.find(m => m.no === 1).scoreA} – ${matches.find(m => m.no === 1).scoreB}</span><span>Match #001</span></div>`;
    $('#matchUpdateForm').addEventListener('submit', e => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const m = matches.find(row => row.no === Number(fd.get('matchNo')));
      m.scoreA = fd.get('scoreA').trim(); m.scoreB = fd.get('scoreB').trim(); m.status = 'Completed'; m.winner = fd.get('winner') === 'A' ? m.teamA : m.teamB;
      store.set('sirajDemoMatches', matches); renderFixtures(); renderBracket(); toast(`Demo score saved for Match #${m.no}.`); e.currentTarget.reset();
    });
  }
}
$$('.organizer-tabs button').forEach(button => button.addEventListener('click', () => { $$('.organizer-tabs button').forEach(b => b.classList.remove('active')); button.classList.add('active'); activePanel = button.dataset.panel; renderOrganizer(); }));
renderOrganizer();
