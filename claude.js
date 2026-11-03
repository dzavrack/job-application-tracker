// Claude features: turn a pasted job posting into a tracker card, and
// suggest next steps for an application from its history.
//
// Calls go straight from the browser to the Anthropic API with the user's
// own API key, which is kept in this browser's localStorage and is never
// sent anywhere else. Both features use tool use with a forced tool choice,
// so Claude returns structured JSON that matches a schema rather than free
// text the app would have to parse.

const CLAUDE = {
  key(){ return store.get('tracker-api-key', ''); },
  model(){ return store.get('tracker-model', '') || 'claude-sonnet-5-5'; },

  async callTool(system, userText, tool){
    const key = this.key();
    if (!key) throw new Error('Add your Anthropic API key in Settings first.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.model(),
        max_tokens: 1500,
        system,
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content: userText }]
      })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || `API error ${res.status}`);
    const block = body.content.find(b => b.type === 'tool_use');
    if (!block) throw new Error('Claude did not return structured output.');
    return block.input;
  }
};

const JOB_TOOL = {
  name: 'save_job',
  description: 'Save a job posting to the tracker as a structured record.',
  input_schema: {
    type: 'object',
    properties: {
      company: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string', description: 'Two plain-English sentences: what the company does, then what the role does day to day.' },
      payMin: { type: ['integer', 'null'], description: 'Lowest posted annual base pay in USD, or null if not posted.' },
      payMax: { type: ['integer', 'null'], description: 'Highest posted annual base pay in USD, or null if not posted.' },
      location: { type: 'string', description: 'e.g. "Remote (US) · 25% travel" or "Hybrid · Boston, MA".' },
      logoText: { type: 'string', description: '1–3 letter monogram for the company.' },
      color: { type: 'string', description: 'A dark hex color that suits the company, for the monogram background.' },
      nextSteps: { type: 'array', items: { type: 'string' }, description: '2–3 concrete first actions for the applicant.' }
    },
    required: ['company', 'title', 'description', 'payMin', 'payMax', 'location', 'logoText', 'color', 'nextSteps']
  }
};

const STEPS_TOOL = {
  name: 'set_next_steps',
  description: 'Record the recommended next steps for one application.',
  input_schema: {
    type: 'object',
    properties: {
      steps: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4,
        description: 'Concrete, specific actions in priority order. Name the person to contact where relevant.' }
    },
    required: ['steps']
  }
};

const STEPS_SYSTEM = `You are a pragmatic job-search coach. Given one application's details, people and conversation history (with day counts), recommend the next 1–4 actions.
Rules: use only the people and facts provided; never invent contacts or events. Respect normal follow-up etiquette (about a week between follow-ups, don't double-message someone who hasn't replied). If the other side replied last, the first step is answering them. Keep each step to one sentence.`;

// ---- UI ----------------------------------------------------------------
const $ = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0, 10);

function openDialog(id){ const d = $(id); d.querySelector('.err').textContent = ''; d.showModal(); }

async function addJobFromPosting(e){
  e.preventDefault();
  const dlg = $('#add-dialog'), btn = dlg.querySelector('button[type=submit]'), err = dlg.querySelector('.err');
  const posting = $('#posting').value.trim();
  if (!posting) { err.textContent = 'Paste the job posting text first.'; return; }
  btn.disabled = true; btn.textContent = 'Reading the posting…'; err.textContent = '';
  try {
    const job = await CLAUDE.callTool(
      'You extract job postings into a tracker. Be accurate; use null for pay that is not stated. Write the description for a mechanical/solutions engineer reading quickly.',
      posting, JOB_TOOL);
    const status = $('#add-status').value;
    userJobs.unshift({
      ...job,
      url: $('#posting-url').value.trim() || '#',
      status,
      dateApplied: status === 'Interested' ? null : today(),
      priority: 'med',
      summary: 'Added from a pasted posting.',
      people: [],
      convo: status === 'Interested' ? [] : [{ d: today(), channel: 'Tracker', dir: 'auto', text: 'Applied.' }]
    });
    store.set('tracker-user-jobs', userJobs);
    location.reload();
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Add with Claude';
  }
}

async function suggestSteps(btn){
  const id = btn.dataset.suggest;
  const job = jobs.find(j => j.company + '|' + j.title === id);
  if (!job) return;
  const t = timing(job);
  const context = {
    company: job.company, title: job.title, status: job.status,
    daysSinceApplied: t.dApp, daysSinceYouLastReachedOut: t.dOut, daysSinceTheyLastReplied: t.dIn,
    summary: job.summary,
    people: job.people || [],
    conversation: (job.convo || []).map(c => ({ daysAgo: daysAgo(c.d), channel: c.channel, from: c.dir === 'in' ? 'them' : c.dir === 'out' ? 'me' : 'automated', text: c.text }))
  };
  btn.disabled = true; btn.textContent = 'Thinking…';
  try {
    const { steps } = await CLAUDE.callTool(STEPS_SYSTEM, JSON.stringify(context, null, 2), STEPS_TOOL);
    aiSteps[id] = steps;
    store.set('tracker-ai-steps', aiSteps);
    location.reload();
  } catch (ex) {
    btn.textContent = '⚠ ' + ex.message;
    btn.disabled = false;
  }
}

function exportData(){
  const blob = new Blob([JSON.stringify({ jobs: userJobs, nextSteps: aiSteps }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'job-tracker-export.json';
  a.click();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-suggest]');
  if (b) { e.preventDefault(); suggestSteps(b); }
});
$('#btn-add').onclick = () => openDialog('#add-dialog');
$('#btn-settings').onclick = () => { $('#api-key').value = CLAUDE.key(); $('#model').value = store.get('tracker-model', ''); openDialog('#settings-dialog'); };
$('#add-form').onsubmit = addJobFromPosting;
$('#settings-form').onsubmit = e => {
  e.preventDefault();
  store.set('tracker-api-key', $('#api-key').value.trim());
  store.set('tracker-model', $('#model').value.trim());
  $('#settings-dialog').close();
};
$('#btn-export').onclick = exportData;
$('#btn-clear').onclick = e => {
  const b = e.currentTarget;
  if (b.dataset.armed) { ['tracker-user-jobs', 'tracker-ai-steps', 'ns-done'].forEach(k => localStorage.removeItem(k)); location.reload(); }
  else { b.dataset.armed = '1'; b.textContent = 'Click again to confirm'; }
};
document.querySelectorAll('dialog .cancel').forEach(b => b.onclick = () => b.closest('dialog').close());
