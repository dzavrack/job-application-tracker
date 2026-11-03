// ---- data -------------------------------------------------------------
// Sample jobs come from data.js; jobs added with "+ Add job" and Claude's
// suggested next steps are stored in this browser's localStorage.
const store = {
  get(k, fallback){ try{ return JSON.parse(localStorage.getItem(k)) ?? fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const userJobs = store.get('tracker-user-jobs', []);
const aiSteps = store.get('tracker-ai-steps', {});
const _raw = [...userJobs, ...window.TRACKER_DATA.jobs].map(j => {
  const job = {...j, convo: (j.convo||[]).map(c => ({...c, date: c.date || fmtDate(c.d)}))};
  if (aiSteps[job.company+'|'+job.title]) job.nextSteps = aiSteps[job.company+'|'+job.title];
  return job;
});
function fmtDate(d){ return d ? new Date(d+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''; }
const lastActivity = j => { const src = j.convo || (_raw.find(x=>x.company===(j.peopleRef||j.company) && x.convo)||{}).convo || [];
  return [j.dateApplied||'', ...src.map(c=>c.d||'')].sort().pop() || ''; };
// Most recent activity first
const jobs = _raw.sort((a,b)=> (!!b.focus - !!a.focus) || lastActivity(b).localeCompare(lastActivity(a)) || (b.dateApplied||'').localeCompare(a.dateApplied||''));
const closedNR = window.TRACKER_DATA.closed;
const rejected = [...window.TRACKER_DATA.rejected].sort((a,b)=>b.date.localeCompare(a.date));
// Auto-rule: Applied 30+ days ago with no reply from a person -> moves to Rejected ("No response").
const _T = new Date(); _T.setHours(12,0,0,0);
const _days = d => d ? Math.round((_T - new Date(d+'T12:00'))/864e5) : null;
const _convo = j => (j.convo || (jobs.find(x=>x.company===(j.peopleRef||j.company) && x.convo)||{}).convo || []);
const noReply = j => !j.focus && j.status==='Applied' && _days(j.dateApplied)>30 && !_convo(j).some(c=>c.dir==='in');
const ghosted = jobs.filter(noReply).sort((a,b)=>(b.dateApplied||'').localeCompare(a.dateApplied||''));
const active = jobs.filter(j=>j.status!=='Rejected' && !noReply(j));
const statusColor = {Interested:'var(--interested)',Applied:'var(--applied)',Interviewing:'var(--interview)',Offer:'var(--offer)',Rejected:'var(--rejected)'};
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const k = n => '$'+Math.round(n/1000)+'k';
const payText = j => j.payMin&&j.payMax ? `${k(j.payMin)} – ${k(j.payMax)}` : j.payMin ? `${k(j.payMin)}` : j.payMax ? `up to ${k(j.payMax)}` : null;
const logo = (j,cls='') => `<div class="logo ${cls}" style="background:${esc(j.color||'#4a5568')}">${esc(j.logoText||j.company[0])}</div>`;
const TODAY = new Date(); TODAY.setHours(12,0,0,0);
const daysAgo = d => d ? Math.max(0, Math.round((TODAY - new Date(d+'T12:00'))/864e5)) : null;
const ago = n => n===0 ? 'today' : n===1 ? '1 day ago' : n+' days ago';
const src = j => j.convo ? j : jobs.find(x=>x.company===(j.peopleRef||j.company) && x.convo) || j;
function timing(j){
  const c = (src(j).convo||[]).filter(x=>x.d);
  const last = dir => c.filter(x=>x.dir===dir).map(x=>x.d).sort().pop()||null;
  const out=last('out'), inn=last('in'), any=c.map(x=>x.d).sort().pop()||null;
  const dOut=daysAgo(out), dIn=daysAgo(inn), dAny=daysAgo(any), dApp=daysAgo(j.dateApplied);
  let label, tone;
  if(j.parked){ label='Parked, no outreach'; tone=''; }
  else if(inn && (!out || inn>out)){ label='They replied, your move'; tone='r'; }
  else if(!out && !inn){ label = j.status==='Interested' ? 'Not applied yet' : (dApp>45 ? 'No outreach, likely ghosted' : 'No outreach yet'); tone = dApp>45?'y':'r'; }
  else if(dOut>=7){ label='Follow-up due'; tone = dOut>=14?'r':'y'; }
  else { label='Waiting on reply'; tone='g'; }
  return {out,inn,dOut,dIn,dAny,dApp,label,tone};
}
const toneFor = n => n==null?'':n<7?'g':n<14?'y':'r';
function chipsFor(j){
  const t=timing(j);
  return `<div class="chips">
    <span class="chip ${t.tone}">${t.label}</span>
    ${t.dApp!=null?`<span class="chip">Applied ${ago(t.dApp)}</span>`:''}
    <span class="chip ${toneFor(t.dOut)}">You: ${t.dOut!=null?ago(t.dOut):'never'}</span>
    <span class="chip">${t.dIn!=null?'Them: '+ago(t.dIn):'No reply from a person'}</span>
  </div>`;
}
let done={}; try{done=JSON.parse(localStorage.getItem('ns-done')||'{}')}catch(e){}
function toggle(id,el){done[id]=el.checked; try{localStorage.setItem('ns-done',JSON.stringify(done))}catch(e){} el.closest('li').classList.toggle('done',el.checked);}
const focusTag = j => j.focus ? '<span class="focus">★ Focus</span>' : '';
const liUrl = n => 'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent(n);

const TABS = [['apps','Applications',active.length],['next','Next steps',null],['people','People & conversations',null],['rejected','Rejected',rejected.length+ghosted.length]];

function stats(){
  const iv = active.filter(j=>j.status==='Interviewing').length;
  document.getElementById('stats').innerHTML =
    `<div class="stat"><b>${active.filter(j=>j.status!=='Interested').length}</b><span>Applied</span></div>`+
    `<div class="stat"><b>${active.filter(j=>j.status==='Interested').length}</b><span>Interested</span></div>`+
    `<div class="stat"><b>${iv}</b><span>Interviewing</span></div>`+
    `<div class="stat"><b>${rejected.length+ghosted.length}</b><span>Rejected / no reply</span></div>`;
}

function viewApps(){
  const fc = active.filter(j=>j.focus).length;
  return `<h4 class="grp">★ This week's focus · ${fc}</h4><div class="grid">`+active.map((j,i)=>{
    const brk = (i===fc && fc) ? `</div><h4 class="grp">Everything else · ${active.length-fc}</h4><div class="grid">` : '';
    const p = payText(j);
    const src = j.summary ? j : jobs.find(x=>x.company===j.peopleRef && x.summary);
    const last = src && src.convo && src.convo[src.convo.length-1];
    return brk+`<a class="card ${j.focus?'fcard':''} cardlink" href="${esc(j.url)}" target="_blank" rel="noopener" title="Open the job posting">
      <div class="top">${logo(j)}
        <div class="who"><div class="co">${esc(j.company)} ${focusTag(j)}</div>
          <div class="title">${esc(j.title)} <span class="arrow">↗</span></div></div>
      </div>
      <p class="desc">${esc(j.description)}</p>
      ${last?`<div class="latest"><b>Latest (${esc(last.date)}):</b> ${esc(last.text)}</div>`:''}
      ${chipsFor(j)}
      <div class="meta">
        <span class="pay ${p?'':'none'}">${p||'Pay not posted'}</span>
        ${j.location?`<span class="dot">•</span><span class="muted">${esc(j.location)}</span>`:''}
        <span class="dot">•</span><span class="muted">${j.dateApplied?fmtDate(j.dateApplied):'Not applied yet'}</span>
        <span class="pill" style="background:${statusColor[j.status]}">${esc(j.status)}</span>
      </div></a>`;}).join('')+`</div>`;
}

function viewPeople(){
  const blocks = active.filter(j=>j.people);  // already focus-first
  return blocks.map(j=>{
    const titles = active.filter(x=>x.company===j.company).map(x=>x.title).join(' · ');
    return `<div class="co-block">
      <div class="co-head">${logo(j,'sm')}<div><h3><a class="ext" href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.company)} ↗</a> ${focusTag(j)}</h3><div class="prole">${esc(titles)}</div></div></div>
      ${chipsFor(j)}
      <div class="summary" style="margin-top:10px">${esc(j.summary)}</div>
      <div class="cols" style="margin-top:16px">
        <div><h4>People to reach out to</h4>
          ${j.people.map(p=>`<div class="person">
            <span class="deg ${p.degree==='1st'?'d1':''}">${esc(p.degree)}</span>
            <div><div class="pname"><a class="ext" href="${liUrl(p.name+' '+j.company)}" target="_blank" rel="noopener">${esc(p.name)}</a>
              <span class="tag ${p.contacted?'yes':'no'}">${p.contacted?'Contacted':'Not yet'}</span></div>
              <div class="prole">${esc(p.role)}</div>
              ${p.note?`<div class="pnote">${esc(p.note)}</div>`:''}</div></div>`).join('')}
        </div>
        <div><h4>Conversation history</h4>
          <ul class="tl">${(j.convo||[]).map(c=>`<li><span class="when">${esc(c.date)}</span><span class="ch">${esc(c.channel)}${c.dir==='in'?' · from them':c.dir==='out'?' · from you':''}${c.d?' · '+ago(daysAgo(c.d)):''}</span><div>${esc(c.text)}</div></li>`).join('')}</ul>
        </div>
      </div></div>`;}).join('');
}

function viewNext(){
  const P={high:0,med:1,low:2};
  const list = active.filter(j=>j.nextSteps||j.status!=='Rejected').map(j=>({j,t:timing(j)}))
    .sort((a,b)=>(!!b.j.focus - !!a.j.focus) || ((P[a.j.priority]??1)-(P[b.j.priority]??1)) || ((b.t.dOut??999)-(a.t.dOut??999)));
  return `<p class="legend">Sorted by priority, then by how long it's been since you reached out. (Applications and the compact view are sorted newest activity first.) Day counts update each time you open the page.
    <span class="chip g">&lt; 7 days</span><span class="chip y">7–13 days</span><span class="chip r">14+ days / action needed</span></p>`+
  list.map(({j,t})=>{
    const titles = active.filter(x=>x.company===j.company).map(x=>x.title).join(' · ');
    return `<div class="ns">${logo(j,'sm')}
      <div><h3>${esc(j.company)} ${focusTag(j)}<span class="prio ${j.priority}">${j.priority==='med'?'medium':j.priority}</span>
        <button class="ai-btn" data-suggest="${esc(j.company+'|'+j.title)}">✨ Suggest next steps</button></h3>
        <div class="prole">${esc(titles)}</div>
        <div style="margin-top:8px">${chipsFor(j)}</div>
        <ol>${(j.nextSteps||[]).map((s,i)=>{const id=j.company+'#'+i;return `<li class="${done[id]?'done':''}"><input type="checkbox" ${done[id]?'checked':''} onchange="toggle('${esc(id).replace(/'/g,"\\'")}',this)"><span>${esc(s)}</span></li>`}).join('')}</ol>
      </div></div>`;}).join('');
}

function viewWidget(){
  const P={high:0,med:1,low:2};
  const list = active.filter(j=>j.nextSteps).map(j=>({j,t:timing(j)}));
  const short = n => n==null?'—':n===0?'today':n+'d';
  const due = list.filter(x=>x.t.tone!=='g').length;
  return `<div class="wtop"><b>Job search</b><a href="#next">Full tracker →</a></div>
  <div class="wstats"><div><b>${active.filter(j=>j.status!=='Interested').length}</b><span>Applied</span></div><div><b>${active.filter(j=>j.status==='Interested').length}</b><span>Interested</span></div><div><b>${due}</b><span>Need action</span></div><div><b>${rejected.length+ghosted.length}</b><span>Rejected</span></div></div>`+
  list.map(({j,t})=>`<a class="wrow" href="${esc(j.url)}" target="_blank" rel="noopener">${logo(j,'sm')}<div>
    <div class="wco">${esc(j.company)}${focusTag(j)}<span class="chip ${t.tone}">${t.label}</span></div>
    <div class="wt">${t.dApp!=null?'Applied '+short(t.dApp)+' · ':''}You ${short(t.dOut)} · Them ${short(t.dIn)}</div>
    <div class="wstep">→ ${esc(j.nextSteps[0])}</div></div></a>`).join('');
}

function viewRejected(){
  const interviewed = rejected.filter(r=>/interview|screen|email/i.test(r.stage)).length;
  return `<div class="rbanner"><span><b>${rejected.length}</b>rejections</span><span><b>${ghosted.length}</b>no reply after 30 days</span><span><b>${interviewed}</b>got past the application stage</span><span class="muted">Each one is a rep. Keep going.</span></div>
  <div class="rej">`+rejected.map(r=>`<div class="rrow">
    ${logo(r,'sm')}
    <div><div class="pname">${r.hl?'<span class="hl">':''}${esc(r.company)}${r.hl?'</span>':''}</div><div class="prole">${esc(r.title)}${r.note?' — '+esc(r.note):''}</div></div>
    <div class="stage">Reached: ${esc(r.stage)}</div>
    <div class="date">${fmtDate(r.date)}</div></div>`).join('')+`</div>
  <h4 style="margin:26px 0 8px">No reply after 30+ days · ${ghosted.length}</h4>
  <p class="prole" style="margin:0 0 8px">These move here automatically when an application passes 30 days with no reply from a person. If someone gets back to you, add their reply to the conversation and it moves back to Applications.</p>
  <div class="rej">`+ghosted.map(j=>`<a class="rrow cardlink" href="${esc(j.url)}" target="_blank" rel="noopener">${logo(j,'sm')}<div><div class="pname">${esc(j.company)} <span class="arrow">↗</span></div><div class="prole">${esc(j.title)}</div></div><div class="stage">No reply · ${_days(j.dateApplied)} days</div><div class="date">applied ${fmtDate(j.dateApplied)}</div></a>`).join('')+`</div>
  <h4 style="margin:26px 0 8px">Posting closed, never heard back · ${closedNR.length}</h4>
  <div class="rej">`+closedNR.map(c=>`<div class="rrow" style="grid-template-columns:1.4fr 1fr 110px"><div class="pname" style="font-size:13.5px">${esc(c.company)}</div><div class="prole">${esc(c.title)}</div><div class="date">applied ${esc(c.when)} ago</div></div>`).join('')+`</div>
`;
}

function render(){
  const tab = (location.hash||'#apps').slice(1);
  document.body.classList.toggle('wmode', tab==='widget');
  if(tab==='widget'){ document.getElementById('view').innerHTML=viewWidget(); return; }
  const cur = TABS.some(t=>t[0]===tab) ? tab : 'apps';
  document.getElementById('tabs').innerHTML = TABS.map(([id,label,n])=>`<a href="#${id}" class="${id===cur?'on':''}">${label}${n!=null?`<span class="n">${n}</span>`:''}</a>`).join('');
  document.getElementById('view').innerHTML = cur==='next'?viewNext():cur==='people'?viewPeople():cur==='rejected'?viewRejected():viewApps();
}
stats(); render();
window.addEventListener('hashchange', render);
