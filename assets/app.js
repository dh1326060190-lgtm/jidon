/* 肌动 · 应用逻辑（单端移动工作台）
 * 路由 / 状态 / CRUD / 筛选搜索排序 / 日历 / 图表 / 计时 / 上传 / 成就联动 / 本地存储
 */
(function () {
  'use strict';
  const ART = window.ART, SEED = window.SEED;
  const STORE = 'jidong_v1';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>(s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ic=k=>(ART.icons[k]||'');
  const clone=o=>JSON.parse(JSON.stringify(o));

  const TYPE={
    training:{label:'训练',icon:'training',cover:'dumbbell'},
    exercise:{label:'动作',icon:'exercise',cover:'sequence'},
    body:{label:'体态',icon:'body',cover:'curve'},
    measure:{label:'围度',icon:'measure',cover:'curve'},
    diet:{label:'饮食',icon:'diet',cover:'plate'},
    sleep:{label:'恢复',icon:'sleep',cover:'recovery'},
    record:{label:'纪录',icon:'record',cover:'dumbbell'}
  };
  const STLABEL={doing:'进行中',done:'已完成',todo:'待办'};

  // —— 状态 ——
  let state=null, filter={q:'',type:'',status:'',tag:'',sort:'date'}, wiz=null, timer=null, form=null;
  function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
  function load(){try{const s=localStorage.getItem(STORE);return s?JSON.parse(s):null;}catch(e){return null;}}
  function initState(){state=load()||clone(SEED);if(!state.exercises)state.exercises=clone(SEED.exercises);if(!state.routines)state.routines=clone(SEED.routines);
    const P=state.persona||(state.persona={});
    if(P.gender===undefined)P.gender='';
    if(P.activityLevel===undefined)P.activityLevel=1.375;
    if(P.waterTarget===undefined)P.waterTarget=2500;
    save();}
  initState();

  // —— 工具 ——
  function vol(exs){return (exs||[]).reduce((s,e)=>s+(+e.sets||0)*(+e.reps||0)*(+e.weight||0),0);}
  function coverHTML(rec){
    if(rec&&typeof rec.cover==='string'&&rec.cover.indexOf('data:')===0)
      return `<img src="${rec.cover}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML=ART.empty">`;
    return ART.svg((rec&&rec.cover)||'empty');
  }
  function mediaSVG(item){
    if(item&&item.dataUrl) return `<img src="${item.dataUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML=ART.empty">`;
    return ART.svg((item&&item.key)||'empty');
  }
  function parseNum(v){const m=String(v).match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):-1;}
  function recNumber(rec){
    const f=rec.fields||{}, P=state.persona;
    switch(rec.type){
      case 'training':return{v:(f.duration||0)+'′',s:f.plan?'计划时长':'训练时长'};
      case 'exercise':return{v:f.bodyPart||'—',s:'部位'};
      case 'body':return{v:(f.weight||0)+'kg',s:'体重'};
      case 'measure':return{v:(f.waist||0)+'cm',s:'腰围'};
      case 'diet':return f.water?{v:(f.water/1000).toFixed(1)+'L',s:'饮水'}:{v:(f.kcal||0)+'kcal',s:'热量'};
      case 'sleep':return{v:(f.total||0)+'h',s:'睡眠'};
      case 'record':return{v:(f.value||0),s:f.metric||'纪录'};
    }
    return{v:'—',s:''};
  }
  function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  // —— 营养目标（单机 TDEE 估算）——
  function currentWeight(){const b=state.records.filter(r=>r.type==='body').sort((a,b)=>a.date<b.date?1:-1);const w=(b[0]||{}).fields;return w&&w.weight?(+w.weight):(+state.persona.startWeight||0);}
  function tdee(){const P=state.persona;const w=currentWeight();if(!P.gender||!P.age||!P.height||!w)return null;const bmr=10*w+6.25*P.height-5*P.age+(P.gender==='男'?5:-161);return Math.round(bmr*(P.activityLevel||1.375));}
  function calorieTarget(){const t=tdee();return t?Math.round(t-400):null;}
  function proteinTarget(){const w=currentWeight();return w?Math.round(1.8*w):0;}
  function fmtDate(d){if(!d)return'';const a=d.split('-');return a[1]+'/'+a[2];}
  function byDate(){return state.records.slice().sort((a,b)=>a.date<b.date?1:-1);}

  // —— 渲染外壳 ——
  function tabbar(route){
    const items=[['home','首页','home'],['records','记录库','filter'],['plan','计划','calendar'],
      ['insight','洞察','chart'],['settings','设置','settings']];
    return items.map(it=>`<button class="tab ${route.indexOf(it[0])===0?'on':''}" data-act="nav" data-route="${it[0]}">
      <span>${ic(it[2])}</span>${it[1]}</button>`).join('');
  }

  function render(){
    const hash=location.hash.replace('#/','')||'home';
    const route=hash.split('/')[0];
    let html='';
    if(route==='home')html=viewHome();
    else if(route==='records')html=viewRecords();
    else if(route==='plan')html=viewPlan();
    else if(route==='insight')html=viewInsight();
    else if(route==='media')html=viewMedia();
    else if(route==='settings')html=viewSettings();
    else if(route==='detail')html=viewDetail(hash.split('/')[1]);
    else if(route==='add')html=viewAdd();
    else if(route==='exercises')html=viewExercises();
    else if(route==='edit')html=viewEdit(hash.split('/')[1]);
    else if(route==='report')html=viewReport();
    else html=viewHome();
    const screen=$('#screen');
    screen.innerHTML=html;
    $('#tabbar').innerHTML=tabbar(route);
    screen.scrollTop=0;
    closeOverlays();
  }

  // —— 首页 ——
  function viewHome(){
    const P=state.persona;
    const recs=state.records;
    const bodyRecs=recs.filter(r=>r.type==='body').sort((a,b)=>a.date<b.date?1:-1);
    const lastBody=bodyRecs[0];
    const today=todayStr();
    const todays=recs.filter(r=>r.date===today);
    const todos=todays.filter(r=>r.status!=='done');
    const doneToday=todays.filter(r=>r.status==='done').length;
    const wa=new Date(today);wa.setDate(wa.getDate()-6);const was=wa.toISOString().slice(0,10);
    const trainWeek=recs.filter(r=>r.type==='training'&&r.status==='done'&&r.date>=was).length;
    const recent=byDate().slice(0,6);
    // 今日蛋白 / 热量目标进度
    const dietP=recs.filter(r=>r.type==='diet'&&r.date===today).reduce((s,r)=>s+(+((r.fields||{}).protein)||0),0);
    const pT=proteinTarget();
    const pPct=pT?Math.min(100,Math.round(dietP/pT*100)):0;
    const nutriHtml=pT?`<div class="nutri-card">
        <div class="ring-wrap"><svg viewBox="0 0 100 100" class="p-ring">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#EAE5DA" stroke-width="10"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#C24B3A" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="264" stroke-dashoffset="${(264*(1-pPct/100)).toFixed(0)}" transform="rotate(-90 50 50)"/></svg>
          <div class="p-num">${pPct}%</div></div>
        <div class="nutri-info"><div class="k">今日蛋白</div>
          <div class="v">${dietP}<span> / ${pT} g</span></div>
          <div class="d">${dietP>=pT?'已达标 · 保肌稳线':'距目标还差 '+(pT-dietP)+'g'}</div></div>
      </div>`
      :`<div class="nutri-card" data-act="nav" data-route="settings" style="cursor:pointer">
        <div class="ring-wrap" style="background:rgba(194,75,58,.08);border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="color:var(--accent);font-size:26px">+</span></div>
        <div class="nutri-info"><div class="k">今日蛋白</div>
          <div class="v" style="font-size:15px;color:var(--accent)">设置目标</div>
          <div class="d">去档案填身高/体重，自动估算蛋白目标</div></div></div>`;
    // 体重趋势 mini
    const pts=bodyRecs.map(r=>r.fields.weight);
    const wmin=Math.min(...pts)-1,wmax=Math.max(...pts)+1;
    const linePts=bodyRecs.map((r,i)=>`${(i/(pts.length-1)*300+10).toFixed(0)},${(70-(r.fields.weight-wmin)/(wmax-wmin)*60).toFixed(0)}`).join(' ');

    const hero=`<section class="hero">
      ${ART.hero}
      <div class="overlay">
        <div>
          <span class="tag">${esc(P.goal||'我的目标')} · ${P.started?('第 '+Math.max(0,Math.round((new Date(today)-new Date(P.started))/864e5))+' 天'):'今天开始'}</span>
          <div class="big">${P.streak||0}<small> 天</small></div>
          <div class="lead">连续训练 · 肌肉正在记住每一次努力</div>
        </div>
        <div class="cta">
          <button class="btn btn-primary" data-act="open-today-train">开始今日训练</button>
          <button class="btn btn-ghost" data-act="open-add">记一笔</button>
        </div>
      </div>
    </section>`;

    const todosHtml=todos.length?todos.map(r=>`<div class="todo" data-act="open-detail" data-id="${r.id}">
        <div class="chk">${ic('check')}</div>
        <div class="body"><div class="tt">${esc(r.title)}</div>
        <div class="mt">${fmtDate(r.date)} · ${TYPE[r.type].label} · ${STLABEL[r.status]}</div></div>
        <span class="status st-${r.status}">${STLABEL[r.status]}</span></div>`).join('')
      :`<div class="empty">${ART.empty}<div class="et">今日事项已清空</div><div class="ed">点「记一笔」安排新的训练或记录</div>
        <button class="btn btn-line btn-sm" data-act="open-add">记一笔</button></div>`;

    const quick=[['open-add','新增记录','add'],['open-timer','开始计时','timer'],
      ['open-today-train','完成训练','check'],['open-upload','上传素材','camera']];

    const stats=`<div class="statrow">
      <div class="stat"><div class="k">近 7 天训练</div><div class="v">${trainWeek}<small> 次</small></div><div class="d">完成后自动累计</div></div>
      <div class="stat"><div class="k">当前体重</div><div class="v">${lastBody?lastBody.fields.weight:'—'}<small> kg</small></div><div class="d">${lastBody&&P.startWeight?('较目标 -'+(P.startWeight-lastBody.fields.weight).toFixed(1)):'记录后显示'}</div></div>
      ${lastBody?'<div class="stat"><div class="k">体脂</div><div class="v">'+lastBody.fields.fat+'<small> %</small></div><div class="d">持续监测</div></div>':'<div class="stat" data-act="open-add-body" style="cursor:pointer"><div class="k">体脂</div><div class="v" style="font-size:15px;color:var(--accent)">+ 记一次</div><div class="d">点此测体态</div></div>'}
    </div>`;

    const recentHtml=recent.length?recent.map(r=>`<div class="card" data-act="open-detail" data-id="${r.id}">
      <div class="cov">${coverHTML(r)}</div>
      <div class="ttl">${esc(r.title)}</div>
      <div class="meta"><span class="tagchip">${TYPE[r.type].label}</span><span>${fmtDate(r.date)}</span>
      <span class="status st-${r.status}">${STLABEL[r.status]}</span></div></div>`).join('')
      :`<div class="empty" style="grid-column:1/-1"><div class="ed">还没有记录</div><button class="btn btn-line btn-sm" data-act="open-add">记第一笔</button></div>`;

    const ach=state.achievements.filter(a=>a.earned).slice(0,3);

    return `<div class="topbar">
        <div class="brand"><div class="mark">${ART.logo}</div>
          <div><div class="name">肌动</div><div class="sub">${esc(P.slogan)}</div></div></div>
        <div class="topdate">${today.replace(/-/g,'.')}<br>${['日','一','二','三','四','五','六'][new Date(today).getDay()]} · ${esc(P.name||'我')}</div>
      </div>
      ${hero}
      <div class="section">
        <div class="section-head"><div class="t">今日事项</div><div class="cap">${todays.length?doneToday+'/'+todays.length+' 完成':'今日暂无安排'}</div></div>
        ${todosHtml}
      </div>
      <div class="section"><div class="section-head"><div class="t">核心数据</div>
        <a data-act="nav" data-route="insight">查看洞察 ${ic('arrow')}</a></div>${stats}
        ${nutriHtml}
        <div class="card" style="margin-top:12px;padding:12px">
          <div class="cap">体重趋势（数据来源：体态记录 ${bodyRecs.length} 条）</div>
          ${bodyRecs.length>=2?`<svg viewBox="0 0 300 60" style="width:100%;height:64px;margin-top:6px">${(function(){const pts=bodyRecs.map(r=>r.fields.weight);const wmin=Math.min(...pts)-1,wmax=Math.max(...pts)+1;return `<polyline points="${bodyRecs.map((r,i)=>`${(i/(pts.length-1)*280+10).toFixed(0)},${(55-(r.fields.weight-wmin)/(wmax-wmin)*45).toFixed(0)}`).join(' ')}" fill="none" stroke="#C24B3A" stroke-width="3"/>`+bodyRecs.map((r,i)=>`<circle cx="${(i/(pts.length-1)*280+10).toFixed(0)}" cy="${(55-(r.fields.weight-wmin)/(wmax-wmin)*45).toFixed(0)}" r="3" fill="#C24B3A"/>`).join('');})()}</svg>`:'<div class="ed" style="margin-top:8px">记录至少 2 次体态测量后，这里会显示体重趋势。</div>'}
        </div></div>
      <div class="section"><div class="section-head"><div class="t">快捷操作</div></div>
        <div class="quick">${quick.map(q=>`<div class="q" data-act="${q[0]}"><span class="ic">${ic(q[2])}</span><span class="lb">${q[1]}</span></div>`).join('')}</div></div>
      <div class="section"><div class="section-head"><div class="t">最近内容</div>
        <a data-act="nav" data-route="records">全部 ${ic('arrow')}</a></div>
        <div class="hscroll">${recentHtml}</div></div>
      <div class="section"><div class="section-head"><div class="t">阶段成果</div>
        <a data-act="nav" data-route="report">报告 ${ic('arrow')}</a></div>
        ${ach.length?ach.map(a=>`<div class="ach"><div class="badge">${ic(a.icon)}</div>
          <div><div class="bt">${esc(a.title)}</div><div class="bd">${esc(a.desc)} · ${fmtDate(a.date)}</div></div></div>`).join('')
        :`<div class="empty" style="padding:16px"><div class="ed">还没有成就</div><div class="ed">完成训练、达成目标后会自动点亮</div></div>`}
      </div>`;
  }

  // —— 记录库 ——
  function viewRecords(){
    let list=state.records.slice();
    if(filter.q){const q=filter.q.toLowerCase();list=list.filter(r=>r.title.toLowerCase().includes(q)||(r.tags||[]).join(' ').toLowerCase().includes(q));}
    if(filter.type)list=list.filter(r=>r.type===filter.type);
    if(filter.status)list=list.filter(r=>r.status===filter.status);
    if(filter.sort==='date')list.sort((a,b)=>a.date<b.date?1:-1);else list.sort((a,b)=>parseNum(recNumber(a).v)<parseNum(recNumber(b).v)?1:-1);
    const typeChips=['',...state.categories.map(c=>c.key)];
    const stChips=['', 'todo','doing','done'];
    const cards=list.length?list.map(r=>{const n=recNumber(r);return `<div class="card" data-act="open-detail" data-id="${r.id}">
        <div class="cov">${coverHTML(r)}</div>
        <div class="ttl">${esc(r.title)}</div>
        <div class="meta"><span class="tagchip">${TYPE[r.type].label}</span><span>${fmtDate(r.date)}</span>
        <span class="status st-${r.status}">${STLABEL[r.status]}</span></div>
        <div class="meta" style="margin-top:6px"><b class="num">${esc(n.v)}</b><span class="micro">${n.s}</span></div>
      </div>`;}).join('')
      :`<div class="empty">${ART.empty}<div class="et">没有匹配的记录</div>
        <div class="ed">调整筛选条件，或新增一条</div>
        <button class="btn btn-line btn-sm" data-act="clear-filter">清除筛选</button>
        <button class="btn btn-primary btn-sm" data-act="open-add" style="margin-left:8px">新增记录</button></div>`;
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">记录库</div><div class="sub">${state.records.length} 条 · 全部轨迹</div></div></div>
      <div class="topdate">${filter.q?'筛选中':'全部'}<br>点击卡片看详情</div></div>
      <div class="section">
        <div class="search">${ic('search')}<input placeholder="搜索标题或标签" value="${esc(filter.q)}" data-act="search-input">
          <span data-act="open-filter" style="cursor:pointer;color:var(--accent)">${ic('filter')}</span></div>
        <div class="chips" style="margin-top:10px">
          ${typeChips.map(t=>`<span class="chip ${filter.type===t?'on':''}" data-act="chip-type" data-v="${t}">${t?TYPE[t].label:'全部'}</span>`).join('')}
        </div>
        <div class="chips" style="margin-top:6px">
          ${stChips.map(s=>`<span class="chip ${filter.status===s?'on':''}" data-act="chip-status" data-v="${s}">${s?STLABEL[s]:'全部状态'}</span>`).join('')}
        </div>
        <div class="filterbar" style="margin-top:8px;justify-content:space-between">
          <span class="cap">共 ${list.length} 条</span>
          <span class="cap" data-act="chip-sort" style="cursor:pointer;color:var(--accent)">排序：${filter.sort==='date'?'日期↓':'数值↓'} ${ic('sort')}</span>
        </div>
        <div class="grid c2">${cards}</div>
      </div>`;
  }

  // —— 计划 / 日历 ——
  function viewPlan(){
    const cal=state._cal||{y:new Date().getFullYear(),m:new Date().getMonth()};
    const y=cal.y,m=cal.m;
    const first=new Date(y,m,1).getDay();const days=new Date(y,m+1,0).getDate();
    const have={};state.records.forEach(r=>{have[r.date]=(have[r.date]||0)+1;});
    let cells='';for(let i=0;i<first;i++)cells+=`<div class="day dim"></div>`;
    for(let d=1;d<=days;d++){const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isT=ds===todayStr();const sel=state._selDate===ds;
      cells+=`<div class="day ${isT?'today':''} ${have[ds]?'has':''} ${sel?'sel':''}" data-act="pick-day" data-d="${ds}">${d}</div>`;}
    const sel=state._selDate||todayStr();
    const dayRecs=state.records.filter(r=>r.date===sel).sort((a,b)=>a.time<b.time?-1:1);
    const plans=state.records.filter(r=>r.status!=='done'&&r.date>=todayStr()).sort((a,b)=>a.date<b.date?1:-1);
    const dayHtml=dayRecs.length?dayRecs.map(r=>`<div class="todo" data-act="open-detail" data-id="${r.id}">
        <div class="chk ${r.status==='done'?'':''}">${r.status==='done'?ic('check'):''}</div>
        <div class="body"><div class="tt">${esc(r.title)}</div><div class="mt">${r.time} · ${TYPE[r.type].label} · ${STLABEL[r.status]}</div></div>
        <span class="status st-${r.status}">${STLABEL[r.status]}</span></div>`).join('')
      :`<div class="empty" style="padding:18px"><div class="ed">这一天还没有安排</div>
        <button class="btn btn-line btn-sm" data-act="open-add">添加记录</button></div>`;
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">计划</div><div class="sub">日历视图 · 训练与安排</div></div></div>
      <div class="topdate">点击日期<br>查看当天</div></div>
      <div class="section">
        <div class="cal">
          <div class="ch"><button class="btn btn-line btn-sm" data-act="cal-prev">‹</button>
            <div class="mt">${y} 年 ${m+1} 月</div>
            <button class="btn btn-line btn-sm" data-act="cal-next">›</button></div>
          <div class="grid7">${['日','一','二','三','四','五','六'].map(w=>`<div class="wd">${w}</div>`).join('')}</div>
          <div class="grid7" style="margin-top:4px">${cells}</div>
        </div>
        <div class="section-head"><div class="t">${fmtDate(sel)} 安排</div></div>
        ${dayHtml}
      </div>
      <div class="section"><div class="section-head"><div class="t">我的套路</div>
        <a data-act="nav" data-route="exercises">动作库 ${ic('arrow')}</a></div>
        ${state.routines.length?state.routines.map(rt=>`<div class="routine">
          <div class="rh"><div><div class="rt">${esc(rt.name)}</div>
            <div class="rm">${esc(rt.split)} · ${rt.items.length} 个动作</div></div>
          <button class="btn btn-primary btn-sm" data-act="open-routine" data-id="${rt.id}">开练</button></div></div>`).join('')
          :'<div class="ed">还没有套路模板，去动作库组合你的训练。</div>'}
      </div>
      <div class="section"><div class="section-head"><div class="t">未来计划</div></div>
        ${plans.length?plans.map(r=>`<div class="card" data-act="open-detail" data-id="${r.id}">
          <div class="cov" style="aspect-ratio:16/6">${coverHTML(r)}</div>
          <div class="ttl">${esc(r.title)}</div>
          <div class="meta"><span class="tagchip">${fmtDate(r.date)}</span><span class="status st-${r.status}">${STLABEL[r.status]}</span></div>
        </div>`).join(''):`<div class="empty" style="padding:14px"><div class="ed">暂无未来计划</div></div>`}
      </div>`;
  }

  // —— 数据洞察 ——
  function viewInsight(){
    const range=state._range||'week';
    const now=new Date(todayStr());
    let from;if(range==='week'){from=new Date(now);from.setDate(now.getDate()-6);}
    else if(range==='month'){from=new Date(now);from.setDate(now.getDate()-29);}
    else {const earliest=state.records.slice().sort((a,b)=>a.date<b.date?-1:1)[0];from=new Date(earliest?earliest.date:todayStr());}
    const fromS=from.toISOString().slice(0,10);
    const inRange=r=>r.date>=fromS&&r.date<=todayStr();
    const recs=state.records.filter(inRange);
    // 完成趋势（按周）
    const weeks={};recs.filter(r=>r.status==='done').forEach(r=>{const d=new Date(r.date);const wk=Math.floor((d-from)/6048e5);weeks[wk]=(weeks[wk]||0)+1;});
    const wkKeys=Object.keys(weeks).sort((a,b)=>a-b);
    const maxWk=Math.max(1,...wkKeys.map(k=>weeks[k]));
    const bars=wkKeys.map(k=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="width:60%;background:var(--accent);height:${(weeks[k]/maxWk*90).toFixed(0)}px;border-radius:5px 5px 0 0"></div>
      <div class="micro">W${+k+1}</div></div>`).join('')||`<div class="micro">该区间暂无完成记录</div>`;
    // 分类占比
    const dist={};recs.forEach(r=>dist[r.type]=(dist[r.type]||0)+1);
    const total=recs.length||1;const palette={training:'#C24B3A',exercise:'#3E5C50',body:'#8A8276',measure:'#B08D57',diet:'#C24B3A',sleep:'#3E5C50',record:'#202628'};
    let acc=0;const segs=Object.keys(dist).map(t=>{const v=dist[t]/total*100;const seg=`<span style="width:${v}%;background:${palette[t]||'#999'}"></span>`;acc+=v;return seg;}).join('');
    const legend=Object.keys(dist).map(t=>`<span><i style="background:${palette[t]}"></i>${TYPE[t].label} ${dist[t]}</span>`).join('');
    // 体重变化（周平均，平滑每日波动）
    const body=state.records.filter(r=>r.type==='body').sort((a,b)=>a.date<b.date?-1:1);
    const inB=body.filter(inRange);
    const byWeekW={};body.forEach(r=>{const d=new Date(r.date);const wk=Math.floor((d-from)/6048e5);if(wk<0)return;(byWeekW[wk]=byWeekW[wk]||[]).push(+r.fields.weight);});
    const wkArr=Object.keys(byWeekW).sort((a,b)=>a-b).map(k=>({wk:+k,w:+(byWeekW[k].reduce((s,x)=>s+x,0)/byWeekW[k].length).toFixed(1)}));
    const bp=wkArr.map(o=>o.w);const bmn=Math.min(...bp,99),bmx=Math.max(...bp,0);
    const bpts=wkArr.map((o,i)=>`${(i/(Math.max(1,bp.length-1))*280+10).toFixed(0)},${(70-(o.w-bmn)/(bmx-bmn||1)*60).toFixed(0)}`).join(' ');
    const firstW=inB[0]?inB[0].fields.weight:null,lastW=inB[inB.length-1]?inB[inB.length-1].fields.weight:null;
    // 营养汇总（区间内饮食记录）
    const dietRecs=recs.filter(r=>r.type==='diet'&&r.fields);
    const sumK=dietRecs.reduce((s,r)=>s+(+r.fields.kcal||0),0);
    const sumP=dietRecs.reduce((s,r)=>s+(+r.fields.protein||0),0);
    const sumC=dietRecs.reduce((s,r)=>s+(+r.fields.carb||0),0);
    const sumF=dietRecs.reduce((s,r)=>s+(+r.fields.fat||0),0);
    const dayCount=new Set(dietRecs.map(r=>r.date)).size||1;
    const ct=calorieTarget();const avgK=Math.round(sumK/dayCount);const deficit=ct?Math.round(ct-avgK):null;
    const kP=sumP*4,kC=sumC*4,kF=sumF*9,kTot=kP+kC+kF||1;
    const pPct=Math.round(kP/kTot*100),cPct=Math.round(kC/kTot*100),fPct=Math.max(0,100-pPct-cPct);
    const sug=[];
    if(lastW!=null&&firstW!=null&&lastW<firstW)sug.push(`近 ${range==='week'?'一周':range==='month'?'一月':'全程'}体重下降 <b>${(firstW-lastW).toFixed(1)}kg</b>，减脂节奏健康。`);
    if(deficit!=null&&deficit>=0)sug.push(`日均热量缺口 <b>${deficit}kcal</b>，脂肪在稳定消耗。`);
    const water=state.records.filter(r=>r.type==='diet'&&r.fields&&r.fields.water).sort((a,b)=>a.date<b.date?1:-1)[0];if(water&&water.fields.water<state.persona.waterTarget)sug.push(`最近一次饮水 ${(water.fields.water/1000).toFixed(1)}L，距目标还差 <b>${((state.persona.waterTarget-water.fields.water)/1000).toFixed(1)}L</b>，记得补水。`);
    if(state.persona.streak>=21)sug.push(`连续训练 <b>${state.persona.streak} 天</b>，神经适应良好，可维持当前分化。`);
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">数据洞察</div><div class="sub">看得见的变化</div></div></div>
      <div class="topdate">${range==='week'?'本周':range==='month'?'本月':'全程'}<br>数据联动</div></div>
      <div class="section">
        <div class="chips">${[['week','本周'],['month','本月'],['all','全程']].map(r=>`<span class="chip ${range===r[0]?'on':''}" data-act="set-range" data-v="${r[0]}">${r[1]}</span>`).join('')}</div>
        <div class="chart"><div class="ct">完成趋势</div><div class="cs">数据来源：区间内状态为「已完成」的记录（共 ${wkKeys.reduce((s,k)=>s+weeks[k],0)} 条）</div>
          <div style="display:flex;align-items:flex-end;height:110px;gap:6px;padding:0 4px">${bars}</div></div>
        <div class="chart"><div class="ct">分类占比</div><div class="cs">数据来源：区间内全部记录 ${recs.length} 条</div>
          <div style="display:flex;height:18px;border-radius:9px;overflow:hidden;margin:6px 0">${segs}</div>
          <div class="legend">${legend}</div></div>
        <div class="chart"><div class="ct">体重趋势（周平均）</div><div class="cs">数据来源：体态记录 ${body.length} 条（按周平均，平滑每日波动）</div>
          <svg viewBox="0 0 300 80" style="width:100%;height:90px">${wkArr.length>1?`<polyline points="${bpts}" fill="none" stroke="#C24B3A" stroke-width="3"/>`:''}
          ${wkArr.map((o,i)=>`<circle cx="${(i/(Math.max(1,bp.length-1))*280+10).toFixed(0)}" cy="${(70-(o.w-bmn)/(bmx-bmn||1)*60).toFixed(0)}" r="3" fill="#C24B3A"/>`).join('')}</svg>
          <div class="legend"><span><i style="background:#C24B3A"></i>体重 ${firstW!=null?firstW+'→'+lastW+'kg':'—'}</span></div></div>
        <div class="chart"><div class="ct">宏量营养素分布</div><div class="cs">数据来源：区间饮食 ${dietRecs.length} 条（按热量当量 4/4/9 kcal/g）</div>
          ${dietRecs.length?`<div style="display:flex;height:18px;border-radius:9px;overflow:hidden;margin:6px 0">
            <span style="width:${pPct}%;background:#C24B3A"></span><span style="width:${cPct}%;background:#3E5C50"></span><span style="width:${fPct}%;background:#B08D57"></span></div>
            <div class="legend"><span><i style="background:#C24B3A"></i>蛋白 ${pPct}% · ${sumP}g</span><span><i style="background:#3E5C50"></i>碳水 ${cPct}% · ${sumC}g</span><span><i style="background:#B08D57"></i>脂肪 ${fPct}% · ${sumF}g</span></div>`
            :'<div class="ed" style="margin-top:6px">记录饮食后，这里会显示蛋白 / 碳水 / 脂肪的比例。</div>'}
        </div>
        <div class="chart"><div class="ct">热量缺口（减脂）</div><div class="cs">数据来源：区间饮食 ${dietRecs.length} 天 · 目标 ${ct?ct+' kcal/天':'未设定'}</div>
          ${dietRecs.length&&ct?`<div class="kv"><span class="k">日均摄入</span><span class="v">${avgK} kcal</span></div>
            <div class="kv"><span class="k">目标热量</span><span class="v">${ct} kcal</span></div>
            <div class="kv"><span class="k">日均缺口</span><span class="v" style="color:${deficit>=0?'var(--accent)':'#C0392B'}">${deficit>=0?'+':''}${deficit} kcal</span></div>
            <div class="d" style="margin-top:6px">${deficit>=0?'缺口合理，脂肪在稳定消耗；体重多看周平均线，别被单日波动带偏。':'摄入超目标，适当减少碳水或脂肪，回到减脂区间。'}</div>`
            :(ct?'<div class="ed" style="margin-top:6px">记录几天饮食后，这里会算出日均缺口。</div>':'<div class="ed" style="margin-top:6px">去「设置」填身高 / 体重，先设定减脂热量目标。</div>')}
        </div>
        <div class="chart"><div class="ct">力量 PR（个人最大重量）</div><div class="cs">数据来源：已完成训练的动作重量</div>
          ${(function(){const prm=prMap();const arr=Object.keys(prm).map(n=>({name:n,...prm[n]})).sort((a,b)=>b.weight-a.weight);
            return arr.length?`<div class="prlist">${arr.slice(0,8).map(p=>`<div class="prrow"><span class="nm">${esc(p.name)}</span>
              <span class="v">${p.weight}<small>kg @${p.reps}次</small></span><span class="dt">${fmtDate(p.date)}</span></div>`).join('')}</div>`
              :'<div class="ed" style="margin-top:6px">完成训练后，这里会自动记录你的力量成长。</div>';})()}
        </div>
        <div class="chart"><div class="ct">周训练量</div><div class="cs">数据来源：已完成训练的训练量（kg·次）累加</div>
          ${(function(){const vb={};state.records.filter(r=>r.type==='training'&&r.status==='done'&&r.fields).forEach(r=>{const d=new Date(r.date);const wk=Math.floor((d-from)/6048e5);if(wk<0)return;vb[wk]=(vb[wk]||0)+vol(r.fields.exercises);});
            const keys=Object.keys(vb).sort((a,b)=>a-b);const mx=Math.max(1,...keys.map(k=>vb[k]));
            return keys.length?`<div style="display:flex;align-items:flex-end;height:110px;gap:6px;padding:0 4px">${keys.map(k=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:60%;background:var(--ink);height:${(vb[k]/mx*90).toFixed(0)}px;border-radius:5px 5px 0 0"></div>
              <div class="micro">W${+k+1}</div></div>`).join('')}</div>`
              :'<div class="ed" style="margin-top:6px">完成训练后，这里会显示每周训练量。</div>';})()}
        </div>
        <div class="chart"><div class="ct">可解释的建议</div><div class="suggest">${sug.length?sug.map(s=>`<div>• ${s}</div>`).join(''):'<div>继续记录，数据越多建议越准。</div>'}</div></div>
      </div>`;
  }

  // —— 相册 / 素材 ——
  function viewMedia(){
    const m=state.media.slice().sort((a,b)=>a.date<b.date?1:-1);
    const wide=new Set(['md4','md2']);
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">素材相册</div><div class="sub">${m.length} 张 · 训练痕迹</div></div></div>
      <div class="topdate"><span data-act="open-upload" style="cursor:pointer;color:#fff;background:var(--accent);padding:6px 12px;border-radius:20px;font-weight:700">${ic('camera')} 上传</span></div></div>
      <div class="section"><div class="album ${wide.size?'wide':''}">
        ${m.length?m.map(it=>`<div class="ph ${wide.has(it.id)?'w':''}" data-act="open-lightbox" data-id="${it.id}">
          ${mediaSVG(it)}<div class="cap">${esc(it.title)} · ${fmtDate(it.date)}</div></div>`).join('')
        :'<div class="empty" style="grid-column:1/-1;padding:18px"><div class="ed">还没有素材</div><div class="ed" style="margin-top:2px">点右上角「上传」添加训练照片</div></div>'}
      </div></div>`;
  }

  // —— 设置 ——
  function viewSettings(){
    const P=state.persona;
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">设置</div><div class="sub">工作台偏好</div></div></div>
      <div class="topdate">本地存储<br>即时保存</div></div>
      <div class="section">
        <div class="panel" style="background:var(--ink);color:#fff">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="mark" style="width:48px;height:48px;border-radius:12px;overflow:hidden">${ART.icon}</div>
            <div><div style="font-weight:800;font-size:18px">${esc(P.name||'未设置')}</div>
            <div class="micro" style="color:rgba(255,255,255,.7)">${P.age||'—'} 岁 · ${P.height||'—'}cm · 目标 ${esc(P.goal||'—')}</div></div>
          </div>
        </div>
        <div class="panel"><div class="ct" style="font-weight:800;margin-bottom:8px">个人档案</div>
          <div class="field"><label>称呼</label><input id="p-name" value="${esc(P.name||'')}" placeholder="如 林深"></div>
          <div class="field"><label>年龄</label><input id="p-age" type="number" inputmode="numeric" value="${P.age||''}" placeholder="岁"></div>
          <div class="field"><label>身高 (cm)</label><input id="p-height" type="number" inputmode="numeric" value="${P.height||''}" placeholder="170"></div>
          <div class="field"><label>训练目标</label><input id="p-goal" value="${esc(P.goal||'')}" placeholder="减脂增肌"></div>
          <div class="field"><label>起始体重 (kg)</label><input id="p-start" type="number" inputmode="numeric" step="0.1" value="${P.startWeight||''}" placeholder="70"></div>
          <div class="field"><label>性别</label><select id="p-gender"><option value="">未填</option><option value="男" ${P.gender==='男'?'selected':''}>男</option><option value="女" ${P.gender==='女'?'selected':''}>女</option></select></div>
          <div class="field"><label>活动量</label><select id="p-activity"><option value="1.2" ${P.activityLevel==1.2?'selected':''}>久坐（几乎不运动）</option><option value="1.375" ${P.activityLevel==1.375?'selected':''}>轻度（每周 1-3 次）</option><option value="1.55" ${P.activityLevel==1.55?'selected':''}>中度（每周 3-5 次）</option><option value="1.725" ${P.activityLevel==1.725?'selected':''}>高度（每周 6-7 次）</option></select></div>
          <div class="field"><label>每日饮水目标 (L)</label><input id="p-water" type="number" inputmode="numeric" step="0.1" value="${P.waterTarget?(P.waterTarget/1000):''}" placeholder="2.5"></div>
          <div class="panel" style="margin-top:10px;background:#F4F1EA">${(function(){const _t=tdee(),_ct=calorieTarget(),_pt=proteinTarget();
            return _t?`<div class="kv"><span class="k">每日消耗 TDEE</span><span class="v">${_t} kcal</span></div>
              <div class="kv"><span class="k">减脂热量目标</span><span class="v">${_ct} kcal/天</span></div>
              <div class="kv"><span class="k">蛋白目标</span><span class="v">${_pt} g/天</span></div>
              <div class="d" style="margin-top:6px">按当前体重 ${currentWeight()||'—'}kg × 1.8g 估算，减脂缺口 400kcal（保肌优先）。</div>`
              :`<div class="d">填完性别 / 年龄 / 身高 / 体重后，这里自动算出你的热量与蛋白目标。</div>`;})()}</div>
          <button class="btn btn-primary btn-block" style="margin-top:8px" data-act="save-persona">保存档案</button>
        </div>
        <div class="panel"><div class="ct" style="font-weight:800;margin-bottom:8px">提醒</div>
          ${state.reminders.map(r=>`<div class="kv"><span class="k">${esc(r.text)}</span>
            <span class="status st-doing">${fmtDate(r.nextDate)}</span></div>`).join('')}
          <label class="kv" style="cursor:pointer"><span class="k">开启提醒推送</span>
            <input type="checkbox" ${state.settings.reminderOn?'checked':''} data-act="toggle-reminder" style="width:20px;height:20px"></label>
        </div>
        <div class="panel"><div class="ct" style="font-weight:800;margin-bottom:8px">分类管理</div>
          <div class="chips">${state.categories.map(c=>`<span class="chip on">${esc(c.label)}</span>`).join('')}</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <input class="field" style="flex:1;margin:0" placeholder="新增分类名，如「冥想」" data-act="cat-input">
            <button class="btn btn-ink btn-sm" data-act="add-category">添加</button></div>
          <div class="micro" style="margin-top:6px">新分类将自动出现在记录库筛选、统计图例与新增表单中。</div>
        </div>
        <div class="panel"><div class="ct" style="font-weight:800;margin-bottom:8px">数据备份</div>
          <button class="btn btn-primary btn-block" data-act="export-data">${ic('download')} 导出备份（JSON）</button>
          <button class="btn btn-line btn-block" style="margin-top:10px" data-act="import-data">${ic('upload')} 从备份导入</button>
          <div class="micro" style="margin-top:10px">${esc(state.settings.storeNote)}</div>
          <button class="btn btn-danger btn-block" style="margin-top:12px" data-act="reset-data">清空所有数据</button>
        </div>
      </div>`;
  }

  // —— 详情 ——
  function viewDetail(id){
    const r=state.records.find(x=>x.id===id);if(!r)return viewHome();
    const f=r.fields||{};
    let body='';
    if(r.type==='training'){
      body+=`<div class="kv"><span class="k">训练量</span><span class="v">${vol(f.exercises)} kg·次</span></div>`;
      body+=`<div class="kv"><span class="k">时长</span><span class="v">${f.duration} 分钟</span></div>`;
      if(f.exercises){const prm=prMap();body+=`<div style="margin-top:8px">${f.exercises.map(e=>{const isPR=prm[e.name]&&prm[e.name].weight===+e.weight&&+e.weight>0&&prm[e.name].reps===+e.reps;return `<div class="exrow"><span class="nm">${esc(e.name)}</span>
        <span class="dt">${e.sets}组 × ${e.reps}次 ${e.weight?('· '+e.weight+'kg'):''}</span>${isPR?'<span class="pr">PR ▲</span>':''}</div>`;}).join('')}</div>`;}
    } else if(r.type==='body'){body+=`<div class="kv"><span class="k">体重</span><span class="v">${f.weight} kg</span></div>
      <div class="kv"><span class="k">体脂</span><span class="v">${f.fat} %</span></div>`;}
    else if(r.type==='measure'){body+=`<div class="kv"><span class="k">腰围</span><span class="v">${f.waist} cm</span></div>
      <div class="kv"><span class="k">臂围</span><span class="v">${f.arm} cm</span></div>
      <div class="kv"><span class="k">大腿</span><span class="v">${f.thigh} cm</span></div>
      <div class="kv"><span class="k">胸围</span><span class="v">${f.chest} cm</span></div>`;}
    else if(r.type==='diet'){body+=`<div class="kv"><span class="k">热量</span><span class="v">${f.kcal} kcal</span></div>
      <div class="kv"><span class="k">蛋白质</span><span class="v">${f.protein} g</span></div>
      <div class="kv"><span class="k">碳水</span><span class="v">${f.carb} g</span></div>
      <div class="kv"><span class="k">脂肪</span><span class="v">${f.fat} g</span></div>
      ${f.water?`<div class="kv"><span class="k">饮水</span><span class="v">${(f.water/1000).toFixed(1)} L</span></div>`:''}`;}
    else if(r.type==='sleep'){body+=`<div class="kv"><span class="k">总时长</span><span class="v">${f.total} h</span></div>
      <div class="kv"><span class="k">深睡</span><span class="v">${f.deep} h</span></div>
      <div class="kv"><span class="k">质量</span><span class="v">${esc(f.quality)}</span></div>`;}
    else if(r.type==='exercise'){body+=`<div class="kv"><span class="k">部位</span><span class="v">${esc(f.bodyPart)}</span></div>
      <div class="kv"><span class="k">器械</span><span class="v">${esc(f.equipment)}</span></div>
      <div class="kv" style="display:block"><span class="k">动作要点</span><div style="font-weight:400;margin-top:4px;line-height:1.6">${esc(f.steps)}</div></div>`;}
    else if(r.type==='record'){body+=`<div class="kv"><span class="k">项目</span><span class="v">${esc(f.metric)}</span></div>
      <div class="kv"><span class="k">成绩</span><span class="v">${f.value}</span></div>`;}
    const relatedMedia=state.media.filter(x=>x.related===id);
    const acts=state.activities.filter(a=>a.rec===id).slice(0,3);
    const n=recNumber(r);
    return `<div class="detail-hero">${coverHTML(r)}
        <button class="back" data-act="nav" data-route="home">${ic('arrow')}</button></div>
      <div class="detail-body">
        <div class="panel" style="margin-top:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div class="h2">${esc(r.title)}</div>
              <div class="cap" style="margin-top:4px">${fmtDate(r.date)} ${r.time} · ${TYPE[r.type].label}</div></div>
            <span class="status st-${r.status}">${STLABEL[r.status]}</span></div>
          <div style="display:flex;gap:14px;margin-top:12px;align-items:baseline">
            <span class="num" style="font-size:28px">${esc(n.v)}</span><span class="cap">${n.s}</span></div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${(r.tags||[]).map(t=>`<span class="tagchip">${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="panel">${body}</div>
        ${r.note?`<div class="panel"><div class="k cap">备注</div><div style="margin-top:4px;line-height:1.6">${esc(r.note)}</div></div>`:''}
        ${relatedMedia.length?`<div class="panel"><div class="k cap" style="margin-bottom:8px">关联素材</div>
          <div class="album">${relatedMedia.map(x=>`<div class="ph" data-act="open-lightbox" data-id="${x.id}">${mediaSVG(x)}</div>`).join('')}</div></div>`:''}
        ${acts.length?`<div class="panel"><div class="k cap" style="margin-bottom:8px">活动记录</div>
          ${acts.map(a=>`<div class="kv"><span class="k">${a.date} ${a.time}</span><span class="v" style="font-weight:400">${esc(a.text)}</span></div>`).join('')}</div>`:''}
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-primary" style="flex:2" data-act="open-edit" data-id="${r.id}">${ic('edit')} 编辑</button>
          ${r.status!=='done'?`<button class="btn btn-ink" style="flex:1" data-act="toggle-status" data-id="${r.id}">${ic('check')} 完成</button>`:''}
          <button class="btn btn-danger" style="flex:1" data-act="open-delete" data-id="${r.id}">${ic('trash')}</button>
        </div>
        <button class="btn btn-line btn-block" style="margin-top:8px" data-act="export-one" data-id="${r.id}">${ic('share')} 导出此记录</button>
      </div>`;
  }

  // —— 新增向导 ——
  function viewAdd(){
    wiz=wiz||{step:1,type:'training',cover:'dumbbell',media:[]};
    if(wiz.step===1){
      const types=state.categories;
      return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div><div><div class="name">新增记录</div><div class="sub">第一步 · 选类型</div></div></div>
        <div class="topdate" data-act="nav" data-route="records" style="cursor:pointer;color:var(--accent)">取消</div></div>
        <div class="section"><div class="steps"><div class="s on"></div><div class="s"></div><div class="s"></div></div>
        <div class="grid c2">${types.map(t=>`<div class="card" data-act="pick-type" data-v="${t.key}" style="text-align:center">
          <div style="width:40px;height:40px;color:var(--accent);margin:0 auto">${ic(TYPE[t.key].icon)}</div>
          <div class="ttl" style="margin-top:6px">${esc(t.label)}</div></div>`).join('')}</div></div>`;
    }
    if(wiz.step===2){
      return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div><div><div class="name">新增 · ${TYPE[wiz.type].label}</div><div class="sub">第二步 · 填核心</div></div></div>
        <div class="topdate" data-act="nav" data-route="records" style="cursor:pointer;color:var(--accent)">取消</div></div>
        <div class="section"><div class="steps"><div class="s on"></div><div class="s on"></div><div class="s"></div></div>
        ${formHTML(wiz.type,null)}</div>`;
    }
    // step3
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div><div><div class="name">新增 · 媒体</div><div class="sub">第三步 · 确认</div></div></div>
        <div class="topdate" data-act="nav" data-route="records" style="cursor:pointer;color:var(--accent)">取消</div></div>
      <div class="section"><div class="steps"><div class="s on"></div><div class="s on"></div><div class="s on"></div></div>
        <div class="field"><label>封面 / 场景图</label><div class="coverpick" id="coverpick">
          ${ART.coverList.map(c=>`<div class="c ${wiz.cover===c?'on':''}" data-act="pick-cover" data-v="${c}">${ART.svg(c)}</div>`).join('')}</div></div>
        <div class="field"><label>添加素材（可选）</label>
          <div class="search" style="margin-bottom:8px">${ic('camera')}<input type="file" accept="image/*" style="font-size:12px"></div>
          <div id="up-thumb" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>
        <div class="field"><label>标题预览</label><div class="cap" id="prev-title">${esc((wiz&&wiz.draft&&wiz.draft.title)||'未填写')}</div></div>
        <button class="btn btn-primary btn-block" data-act="confirm-add">${ic('check')} 保存记录</button>
        <button class="btn btn-line btn-block" style="margin-top:8px" data-act="wiz-prev">上一步</button>
      </div>`;
  }

  function formHTML(type,rec){
    const f=(rec&&rec.fields)||{};
    const cover=rec?rec.cover:'dumbbell';
    let extra='';
    if(type==='training'){
      const exs=f.exercises||[{name:'',sets:4,reps:8,weight:0}];
      extra=`<div class="field"><label>动作组（组 × 次 × 重量kg）</label><div id="ex-list">
        ${exs.map((e,i)=>`<div class="exrow" style="display:block">
          <div style="display:flex;gap:6px;margin-bottom:6px"><input style="flex:2" placeholder="动作名" value="${esc(e.name)}" data-ex="name" data-i="${i}">
            <input style="flex:1" placeholder="组" value="${e.sets}" data-ex="sets" data-i="${i}" inputmode="numeric">
            <input style="flex:1" placeholder="次" value="${e.reps}" data-ex="reps" data-i="${i}" inputmode="numeric">
            <input style="flex:1" placeholder="kg" value="${e.weight}" data-ex="weight" data-i="${i}" inputmode="numeric"></div>
          <button class="btn btn-line btn-sm" data-act="del-ex" data-i="${i}" ${exs.length<=1?'disabled':''}>删此组</button></div>`).join('')}</div>
        <button class="btn btn-line btn-sm" data-act="add-ex" style="margin-top:4px">+ 加一组</button></div>
        <div class="field"><label>时长（分钟）</label><input name="f_duration" value="${f.duration||45}" inputmode="numeric"></div>`;
    } else if(type==='exercise'){
      extra=`<div class="field"><label>训练部位</label><input name="f_bodyPart" value="${esc(f.bodyPart||'')}" placeholder="如 臀腿/后背"></div>
        <div class="field"><label>器械</label><input name="f_equipment" value="${esc(f.equipment||'')}"></div>
        <div class="field"><label>动作要点</label><textarea name="f_steps" placeholder="分步骤描述">${esc(f.steps||'')}</textarea></div>`;
    } else if(type==='body'){
      extra=`<div class="field"><label>体重 kg</label><input name="f_weight" value="${f.weight||''}" inputmode="decimal"></div>
        <div class="field"><label>体脂 %</label><input name="f_fat" value="${f.fat||''}" inputmode="decimal"></div>`;
    } else if(type==='measure'){
      extra=`<div class="field"><label>腰围 cm</label><input name="f_waist" value="${f.waist||''}" inputmode="numeric"></div>
        <div class="field"><label>臂围 cm</label><input name="f_arm" value="${f.arm||''}" inputmode="numeric"></div>
        <div class="field"><label>大腿 cm</label><input name="f_thigh" value="${f.thigh||''}" inputmode="numeric"></div>
        <div class="field"><label>胸围 cm</label><input name="f_chest" value="${f.chest||''}" inputmode="numeric"></div>`;
    } else if(type==='diet'){
      extra=`<div class="field"><label>热量 kcal</label><input name="f_kcal" value="${f.kcal||''}" inputmode="numeric"></div>
        <div class="field"><label>蛋白质 g</label><input name="f_protein" value="${f.protein||''}" inputmode="numeric"></div>
        <div class="field"><label>碳水 g</label><input name="f_carb" value="${f.carb||''}" inputmode="numeric"></div>
        <div class="field"><label>脂肪 g</label><input name="f_fat" value="${f.fat||''}" inputmode="numeric"></div>
        <div class="field"><label>饮水 ml</label><input name="f_water" value="${f.water||''}" inputmode="numeric"></div>`;
    } else if(type==='sleep'){
      extra=`<div class="field"><label>总时长 h</label><input name="f_total" value="${f.total||''}" inputmode="decimal"></div>
        <div class="field"><label>深睡 h</label><input name="f_deep" value="${f.deep||''}" inputmode="decimal"></div>
        <div class="field"><label>质量</label><input name="f_quality" value="${esc(f.quality||'')}"></div>`;
    } else if(type==='record'){
      extra=`<div class="field"><label>项目</label><input name="f_metric" value="${esc(f.metric||'')}" placeholder="如 硬拉 1RM"></div>
        <div class="field"><label>成绩</label><input name="f_value" value="${f.value||''}" inputmode="numeric"></div>`;
    }
    return `<form id="rec-form">
      <div class="field"><label>标题</label><input name="f_title" id="f_title" value="${esc(rec?rec.title:'')}" placeholder="如 推胸日训练"></div>
      <div class="field"><label>日期</label><input type="date" name="f_date" value="${rec?rec.date:todayStr()}"></div>
      <div class="field"><label>时间</label><input type="time" name="f_time" value="${rec?rec.time:'19:30'}"></div>
      <div class="field"><label>状态</label><div class="seg" id="seg-status">
        ${['todo','doing','done'].map(s=>`<div class="opt ${((rec&&rec.status)||'todo')===s?'on':''}" data-act="seg-status" data-v="${s}">${STLABEL[s]}</div>`).join('')}</div></div>
      ${extra}
      <div class="field"><label>标签（逗号分隔）</label><input name="f_tags" value="${esc((rec&&rec.tags||[]).join(','))}" placeholder="胸,力量"></div>
      <div class="field"><label>备注</label><textarea name="f_note" placeholder="训练感受、注意事项">${esc(rec?rec.note:'')}</textarea></div>
      <div class="field"><label>封面</label><div class="coverpick" id="coverpick">
        ${ART.coverList.map(c=>`<div class="c ${cover===c?'on':''}" data-act="pick-cover" data-v="${c}">${ART.svg(c)}</div>`).join('')}</div></div>
      <button class="btn btn-primary btn-block" data-act="${rec?'confirm-edit':'wiz-next'}">${rec?'保存修改':'下一步'}</button>
      ${rec?'':`<button class="btn btn-line btn-block" style="margin-top:8px" data-act="wiz-prev">上一步</button>`}
    </form>`;
  }

  function readForm(){
    const g=n=>{const e=document.querySelector(`[name="${n}"]`);return e?e.value:'';};
    const r={title:g('f_title').trim()||'未命名记录',date:g('f_date')||todayStr(),time:g('f_time')||'19:00',
      status:document.querySelector('#seg-status .opt.on')?document.querySelector('#seg-status .opt.on').dataset.v:'todo',
      tags:g('f_tags').split(',').map(s=>s.trim()).filter(Boolean),
      note:g('f_note'),cover:document.querySelector('#coverpick .c.on')?document.querySelector('#coverpick .c.on').dataset.v:'dumbbell',
      fields:{}};
    const t=wiz?wiz.type:(form&&form.type);
    if(t==='training'){
      const names=$$('[data-ex="name"]'),sets=$$('[data-ex="sets"]'),reps=$$('[data-ex="reps"]'),wg=$$('[data-ex="weight"]');
      const exs=names.map((n,i)=>({name:n.value.trim()||'动作',sets:+sets[i].value||0,reps:+reps[i].value||0,weight:+wg[i].value||0}));
      r.fields={duration:+g('f_duration')||0,exercises:exs};
    } else if(t==='exercise'){r.fields={bodyPart:g('f_bodyPart'),equipment:g('f_equipment'),steps:g('f_steps')};}
    else if(t==='body'){r.fields={weight:+g('f_weight')||0,fat:+g('f_fat')||0};}
    else if(t==='measure'){r.fields={waist:+g('f_waist')||0,arm:+g('f_arm')||0,thigh:+g('f_thigh')||0,chest:+g('f_chest')||0};}
    else if(t==='diet'){r.fields={kcal:+g('f_kcal')||0,protein:+g('f_protein')||0,carb:+g('f_carb')||0,fat:+g('f_fat')||0,water:+g('f_water')||0};}
    else if(t==='sleep'){r.fields={total:+g('f_total')||0,deep:+g('f_deep')||0,quality:g('f_quality')};}
    else if(t==='record'){r.fields={metric:g('f_metric'),value:+g('f_value')||0};}
    return r;
  }

  function viewEdit(id){
    const r=state.records.find(x=>x.id===id);if(!r)return viewHome();
    form={type:r.type};
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">编辑 · ${TYPE[r.type].label}</div><div class="sub">沿用相同字段</div></div></div>
      <div class="topdate" data-act="nav" data-route="detail/${id}" style="cursor:pointer;color:var(--accent)">取消</div></div>
      <div class="section">${formHTML(r.type,r)}</div>`;
  }

  function viewReport(){
    const P=state.persona;
    const hasData=state.records.length>0||state.achievements.length>0;
    if(!hasData){
      return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">阶段报告</div><div class="sub">成长档案</div></div></div>
        <div class="topdate" data-act="nav" data-route="home" style="cursor:pointer;color:var(--accent)">${ic('close')}</div></div>
        <div class="detail-body"><div class="empty" style="margin-top:34px">${ART.empty}
          <div class="et">还没有阶段报告</div>
          <div class="ed">完成训练、记录体态后，这里会自动汇总你的成长。</div>
          <button class="btn btn-primary btn-sm" data-act="open-add">记第一笔</button></div></div>`;
    }
    const train=state.records.filter(r=>r.type==='training'&&r.status==='done');
    const volAll=train.reduce((s,r)=>s+vol(r.fields.exercises),0);
    const body=state.records.filter(r=>r.type==='body').sort((a,b)=>a.date<b.date?1:-1);
    const firstB=body[0],lastB=body[body.length-1];
    const ach=state.achievements.filter(a=>a.earned);
    const dayN=P.started?Math.max(0,Math.round((new Date(todayStr())-new Date(P.started))/864e5)):0;
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">阶段报告</div><div class="sub">${P.started||'今日'} 至今</div></div></div>
      <div class="topdate" data-act="nav" data-route="home" style="cursor:pointer;color:var(--accent)">${ic('close')}</div></div>
      <div class="detail-hero" style="height:160px">${ART.curve}
        <div class="back" style="position:absolute;top:14px;left:14px;color:#202628;font-weight:800;font-size:15px;background:rgba(244,241,234,.7)">肌动 · 成长档案</div></div>
      <div class="detail-body">
        <div class="panel" style="margin-top:0">
          <div class="h2">${esc(P.name||'你')} 的阶段成果</div>
          <div class="cap" style="margin-top:4px">从 ${P.started||'今天'} 到 ${todayStr()}，共 ${dayN} 天</div>
        </div>
        <div class="statrow">
          <div class="stat"><div class="k">体重变化</div><div class="v">${firstB&&lastB?('-'+(firstB.fields.weight-lastB.fields.weight).toFixed(1)):'—'}<small> kg</small></div></div>
          <div class="stat"><div class="k">体脂变化</div><div class="v">${firstB&&lastB?('-'+(firstB.fields.fat-lastB.fields.fat).toFixed(1)):'—'}<small> %</small></div></div>
        </div>
        <div class="statrow" style="margin-top:12px">
          <div class="stat"><div class="k">完成训练</div><div class="v">${train.length}<small> 次</small></div></div>
          <div class="stat"><div class="k">累计训练量</div><div class="v">${(volAll/1000).toFixed(1)}<small> t·次</small></div></div>
          <div class="stat"><div class="k">连续训练</div><div class="v">${P.streak||0}<small> 天</small></div></div>
        </div>
        <div class="panel" style="margin-top:12px"><div class="ct" style="font-weight:800;margin-bottom:8px">已解锁成就</div>
          ${ach.length?ach.map(a=>`<div class="ach"><div class="badge">${ic(a.icon)}</div><div><div class="bt">${esc(a.title)}</div>
            <div class="bd">${fmtDate(a.date)}</div></div></div>`).join(''):'<div class="ed">暂无成就，达成目标后自动点亮。</div>'}</div>
        <button class="btn btn-primary btn-block" data-act="export-data">${ic('download')} 导出完整数据</button>
      </div>`;
  }

  // —— 动作库（字典二级页）——
  function viewExercises(){
    const list=state.exercises.slice();
    const muscles=['','胸','背','腿','肩','臂','核心','臀','小腿'];
    const fm=state._exMuscle||'';
    const shown=fm?list.filter(e=>e.muscle===fm):list;
    return `<div class="topbar"><div class="brand"><div class="mark">${ART.logo}</div>
        <div><div class="name">动作库</div><div class="sub">${list.length} 个动作 · 家庭哑铃 + 弹力带</div></div></div>
      <div class="topdate" data-act="nav" data-route="plan" style="cursor:pointer;color:var(--accent)">返回</div></div>
      <div class="section">
        <div class="chips">${muscles.map(m=>`<span class="chip ${fm===m?'on':''}" data-act="filter-muscle" data-v="${m}">${m||'全部'}</span>`).join('')}</div>
        <div class="exlist">${shown.map(e=>`<div class="excard"><div class="eh"><span class="nm">${esc(e.name)}</span>
            <span class="tagchip">${esc(e.muscle)} · ${esc(e.equipment)}</span></div>
          <div class="meta">${e.sets}组 × ${e.reps}次 · 休息 ${e.rest}s</div>
          ${e.note?`<div class="note">${esc(e.note)}</div>`:''}
          <button class="btn btn-line btn-sm" data-act="del-exercise" data-id="${e.id}">删除</button></div>`).join('')
          ||'<div class="ed">该肌群还没有动作。</div>'}</div>
        <button class="btn btn-primary btn-block" data-act="open-exercise-form">${ic('add')} 新增动作</button>
      </div>`;
  }

  // —— 弹层 ——
  function closeOverlays(){$('#overlay')&&$('#overlay').remove();}
  function mask(html){closeOverlays();const d=document.createElement('div');d.id='overlay';d.className='mask';d.innerHTML=`<div class="sheet">${html}</div>`;$('#phone').appendChild(d);}
  function center(html){closeOverlays();const d=document.createElement('div');d.id='overlay';d.className='center-mask';d.innerHTML=`<div class="dialog">${html}</div>`;$('#phone').appendChild(d);}

  function openDelete(id){
    const r=state.records.find(x=>x.id===id);if(!r)return;
    const relMedia=state.media.filter(m=>m.related===id);
    center(`<div class="dt">删除这条记录？</div>
      <div class="dd">「${esc(r.title)}」将被移除，<b>无法撤销</b>。
      ${relMedia.length?`<div class="related-warn" style="margin-top:10px">将同时影响 ${relMedia.length} 张关联素材（相册中仍保留，但不再回链此记录）。</div>`:''}</div>
      <div class="drow"><button class="btn btn-line" style="flex:1" data-act="cancel">再想想</button>
        <button class="btn btn-danger" style="flex:1" data-act="confirm-delete" data-id="${id}">确认删除</button></div>`);
  }

  function openTimer(){
    let total=90,rem=90;
    const ring=`<svg class="ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="#EAE5DA" stroke-width="12"/>
      <circle id="t-ring" cx="100" cy="100" r="90" fill="none" stroke="#C24B3A" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="565" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>`;
    mask(`<div class="timer"><div class="h2">组间休息</div><div style="position:relative;width:200px;margin:0 auto">
        ${ring}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
        <span class="tt" id="t-num">1:30</span></div></div>
      <div class="chips" style="justify-content:center;margin:10px 0">
        ${[60,90,120].map(s=>`<span class="chip ${s===90?'on':''}" data-act="timer-set" data-v="${s}">${s}s</span>`).join('')}</div>
      <div style="display:flex;gap:10px"><button class="btn btn-primary" style="flex:1" data-act="timer-start">开始</button>
        <button class="btn btn-line" style="flex:1" data-act="timer-pause">暂停</button>
        <button class="btn btn-line" style="flex:1" data-act="timer-reset">重置</button>
        <button class="btn btn-ink" style="flex:1" data-act="cancel">结束</button></div></div>`);
    window._tm={total,rem,running:false};
    updateTimer();
  }
  function updateTimer(){
    const t=window._tm;if(!t)return;const m=Math.floor(t.rem/60),s=t.rem%60;
    const num=$('#t-num');if(num)num.textContent=m+':'+String(s).padStart(2,'0');
    const ring=$('#t-ring');if(ring)ring.setAttribute('stroke-dashoffset',(565*(1-t.rem/t.total)).toFixed(0));
  }

  function openLightbox(id){
    const it=state.media.find(m=>m.id===id);if(!it)return;
    const rel=it.related?state.records.find(r=>r.id===it.related):null;
    const d=document.createElement('div');d.id='overlay';d.className='lightbox';
    d.innerHTML=`<div class="lb-top"><button data-act="cancel">${ic('close')}</button>
        <b>${esc(it.title)}</b><button data-act="replace-cover" data-id="${id}" style="font-size:12px">设为封面</button></div>
      <div class="lb-img">${mediaSVG(it)}</div>
      <div class="lb-info"><div class="cap">${fmtDate(it.date)} · ${esc(it.note||'')}</div>
        ${rel?`<button class="btn btn-ghost" style="margin-top:10px" data-act="open-detail" data-id="${rel.id}">查看关联记录：${esc(rel.title)} ${ic('arrow')}</button>`:'<div class="cap" style="margin-top:8px">暂无关联记录</div>'}</div>`;
    $('#phone').appendChild(d);
  }

  function openUpload(){
    mask(`<div class="h2">上传素材</div><div class="cap" style="margin:4px 0 12px">真实场景图，可回链到一条记录</div>
      <div class="field"><label>标题</label><input id="up-title" placeholder="如 周末户外跑"></div>
      <div class="field"><label>日期</label><input type="date" id="up-date" value="${todayStr()}"></div>
      <div class="field"><label>关联记录</label><select id="up-rel"><option value="">不关联</option>
        ${state.records.map(r=>`<option value="${r.id}">${esc(r.title)}</option>`).join('')}</select></div>
      <div class="field"><label>选择场景插画 或 上传本地图片</label>
        <div class="coverpick" id="up-cover">${ART.coverList.map(c=>`<div class="c" data-act="up-pick" data-v="${c}">${ART.svg(c)}</div>`).join('')}</div>
        <div class="search" style="margin-top:8px">${ic('camera')}<input type="file" accept="image/*" id="up-file"></div>
        <div id="up-prev" style="margin-top:8px"></div></div>
      <button class="btn btn-primary btn-block" data-act="confirm-upload">保存素材</button>
      <button class="btn btn-line btn-block" style="margin-top:8px" data-act="cancel">取消</button>`);
  }

  // —— Toast ——
  function toast(msg){
    const t=document.createElement('div');t.className='toast';t.innerHTML=ic('check')+`<span>${esc(msg)}</span>`;
    $('#phone').appendChild(t);setTimeout(()=>t.remove(),1600);
  }

  // —— 动作分发 ——
  function nav(route){location.hash='#/'+route;}

  function handleAct(act,el){
    const id=el.dataset.id, v=el.dataset.v||el.dataset.route;
    switch(act){
      case 'nav':nav(v);break;
      case 'open-detail':location.hash='#/detail/'+id;break;
      case 'open-add':wiz={step:1,type:'training',cover:'dumbbell',media:[]};location.hash='#/add';break;
      case 'open-edit':location.hash='#/edit/'+id;break;
      case 'pick-type':wiz.type=v;wiz.step=2;location.hash='#/add';break;
      case 'wiz-next':{const r=readForm();wiz.cover=r.cover;wiz.draft=r;wiz.step=3;location.hash='#/add';break;}
      case 'wiz-prev':wiz.step=Math.max(1,wiz.step-1);location.hash='#/add';break;
      case 'pick-cover':{const c=el.parentNode.querySelectorAll('.c');c.forEach(x=>x.classList.remove('on'));el.classList.add('on');break;}
      case 'confirm-add':{
        const r=wiz.draft||readForm();r.type=wiz.type;r.id='u'+Date.now();
        const sc=document.querySelector('#coverpick .c.on');if(sc)r.cover=sc.dataset.v;
        r.media=wiz.media||[];state.records.unshift(r);
        state.media.push({id:'m'+Date.now(),key:r.cover,kind:'illustration',title:r.title,date:r.date,related:r.id,note:'新增封面'});
        state.activities.unshift({id:'ac'+Date.now(),date:r.date,time:r.time,text:'新增 '+TYPE[r.type].label+'：'+r.title,icon:TYPE[r.type].icon,rec:r.id});
        const isFirstTrain=r.type==='training'&&!state.records.some(x=>x.type==='training');
        if(r.type==='training'&&r.status==='done'){bumpStreak(r.date);applyPR(r);}
        if(isFirstTrain)unlock('第一次训练','training','记录从今天开始，证据会自己说话。');
        save();toast('已记录 · '+r.title);location.hash='#/detail/'+r.id;break;}
      case 'confirm-edit':{
        const r=readForm();const orig=state.records.find(x=>x.id===id);
        if(orig.type==='training'){const wasDone=orig.status==='done';Object.assign(orig,{title:r.title,date:r.date,time:r.time,status:r.status,tags:r.tags,note:r.note,cover:r.cover,fields:r.fields});
          if(r.status==='done'&&!wasDone){bumpStreak(r.date);applyPR(orig);}if(r.status!=='done'&&wasDone)state.persona.streak=Math.max(0,state.persona.streak-1);}
        else Object.assign(orig,{title:r.title,date:r.date,time:r.time,status:r.status,tags:r.tags,note:r.note,cover:r.cover,fields:r.fields});
        save();toast('已保存修改');location.hash='#/detail/'+id;break;}
      case 'toggle-status':{
        const r=state.records.find(x=>x.id===id);const was=r.status;
        r.status=r.status==='done'?'doing':'done';
        if(r.type==='training'){if(r.status==='done'&&was!=='done'){bumpStreak(r.date);applyPR(r);}if(r.status!=='done'&&was==='done')state.persona.streak=Math.max(0,state.persona.streak-1);}
        state.activities.unshift({id:'ac'+Date.now(),date:r.date,time:r.time,text:(r.status==='done'?'完成 ':'重开 ')+r.title,icon:r.status==='done'?'check':TYPE[r.type].icon,rec:r.id});
        save();render();toast(r.status==='done'?'已完成 · 进度已更新':'已恢复进行中');break;}
      case 'open-delete':openDelete(id);break;
      case 'confirm-delete':{
        const r=state.records.find(x=>x.id===id);state.records=state.records.filter(x=>x.id!==id);
        state.activities=state.activities.filter(a=>a.rec!==id);
        save();closeOverlays();toast('已删除 · '+r.title);location.hash='#/records';break;}
      case 'open-timer':openTimer();break;
      case 'open-upload':openUpload();break;
      case 'open-exercise-form':mask(`<div class="h2">新增动作</div>
        <div class="field"><label>动作名</label><input id="ex-name" placeholder="如 哑铃弯举"></div>
        <div class="field"><label>目标肌群</label><select id="ex-muscle">${['胸','背','腿','肩','臂','核心','臀','小腿'].map(m=>`<option>${m}</option>`).join('')}</select></div>
        <div class="field"><label>器械</label><select id="ex-eq">${['哑铃','弹力带','徒手'].map(m=>`<option>${m}</option>`).join('')}</select></div>
        <div class="field"><label>默认组数</label><input id="ex-sets" type="number" inputmode="numeric" value="3"></div>
        <div class="field"><label>默认次数</label><input id="ex-reps" type="number" inputmode="numeric" value="10"></div>
        <div class="field"><label>组间休息 (s)</label><input id="ex-rest" type="number" inputmode="numeric" value="60"></div>
        <div class="field"><label>要点</label><textarea id="ex-note" placeholder="发力 / 呼吸 / 注意事项"></textarea></div>
        <button class="btn btn-primary btn-block" data-act="confirm-exercise">保存动作</button>
        <button class="btn btn-line btn-block" style="margin-top:8px" data-act="cancel">取消</button>`);break;
      case 'confirm-exercise':{const name=$('#ex-name').value.trim();if(!name){toast('请输入动作名');break;}
        state.exercises.push({id:'e'+Date.now(),name,muscle:$('#ex-muscle').value,sets:+$('#ex-sets').value||3,reps:+$('#ex-reps').value||10,rest:+$('#ex-rest').value||60,equipment:$('#ex-eq').value,note:$('#ex-note').value.trim()});
        save();closeOverlays();toast('已新增动作');location.hash='#/exercises';break;}
      case 'del-exercise':{const e=state.exercises.find(x=>x.id===id);if(!e)break;
        center(`<div class="dt">删除动作「${esc(e.name)}」？</div><div class="dd">仅从动作库移除，已用它的训练记录不受影响。</div>
          <div class="drow"><button class="btn btn-line" style="flex:1" data-act="cancel">取消</button>
          <button class="btn btn-danger" style="flex:1" data-act="confirm-del-exercise" data-id="${id}">确认删除</button></div>`);break;}
      case 'confirm-del-exercise':{state.exercises=state.exercises.filter(x=>x.id!==id);save();closeOverlays();toast('已删除动作');location.hash='#/exercises';break;}
      case 'open-routine':{const rt=state.routines.find(x=>x.id===id);if(!rt)break;
        const items=rt.items.map(it=>{const ex=state.exercises.find(e=>e.id===it.exId);return ex?`<div class="exrow"><span class="nm">${esc(ex.name)}</span><span class="dt">${it.sets||ex.sets}组 × ${it.reps||ex.reps}次</span></div>`:'';}).join('');
        center(`<div class="dt">${esc(rt.name)}</div><div class="dd">分化：${esc(rt.split)} · 共 ${rt.items.length} 个动作</div>
          <div style="margin:10px 0">${items}</div>
          <div class="drow"><button class="btn btn-line" style="flex:1" data-act="cancel">取消</button>
          <button class="btn btn-primary" style="flex:1" data-act="confirm-routine" data-id="${rt.id}">今天开练</button></div>`);break;}
      case 'confirm-routine':{const rt=state.routines.find(x=>x.id===id);if(!rt)break;
        const exs=rt.items.map(it=>{const ex=state.exercises.find(e=>e.id===it.exId)||{};return {name:ex.name||'动作',sets:it.sets||ex.sets||3,reps:it.reps||ex.reps||10,weight:0,rest:it.rest||ex.rest||60};});
        const rec={id:'u'+Date.now(),type:'training',title:rt.name+' · '+fmtDate(todayStr()),date:todayStr(),time:'19:30',status:'todo',tags:[rt.split],note:'',cover:'dumbbell',media:[],fields:{duration:45,exercises:exs}};
        state.records.unshift(rec);
        state.activities.unshift({id:'ac'+Date.now(),date:todayStr(),time:'19:30',text:'开练 '+rt.name+'（预填 '+exs.length+' 个动作）',icon:'training',rec:rec.id});
        save();closeOverlays();toast('已开练 · '+rt.name);location.hash='#/detail/'+rec.id;break;}
      case 'open-today-train':{const t=state.records.find(x=>x.type==='training'&&x.date===todayStr());
        if(t){location.hash='#/detail/'+t.id;if(t.status==='done')toast('今日训练已完成');}
        else{wiz={step:2,type:'training',cover:'dumbbell',media:[]};location.hash='#/add';toast('先记下今天练什么');}
        break;}
      case 'open-add-body':{wiz={step:2,type:'body',cover:'curve',media:[]};location.hash='#/add';break;}
      case 'timer-set':{window._tm.total=+v;window._tm.rem=+v;updateTimer();
        el.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');break;}
      case 'timer-start':{if(window._tm.running)break;window._tm.running=true;timer=setInterval(()=>{window._tm.rem--;if(window._tm.rem<=0){clearInterval(timer);window._tm.running=false;updateTimer();toast('休息结束 · 该上重量了');return;}updateTimer();},1000);break;}
      case 'timer-pause':{window._tm.running=false;clearInterval(timer);break;}
      case 'timer-reset':{window._tm.rem=window._tm.total;window._tm.running=false;clearInterval(timer);timer=null;updateTimer();break;}
      case 'cancel':closeOverlays();if(timer){clearInterval(timer);timer=null;}window._tm=null;break;
      case 'open-lightbox':openLightbox(id);break;
      case 'replace-cover':{const it=state.media.find(m=>m.id===id);if(it&&it.related){const r=state.records.find(x=>x.id===it.related);if(r){r.cover=it.dataUrl||it.key;save();toast('封面已更新');closeOverlays();location.hash='#/detail/'+it.related;}}break;}
      case 'confirm-upload':{
        const title=$('#up-title').value.trim()||'未命名素材';
        const date=$('#up-date').value||todayStr();
        const rel=$('#up-rel').value;
        const picked=document.querySelector('#up-cover .c.on');
        const fileInput=$('#up-file');
        const fin=()=>{const key=picked?picked.dataset.v:'dumbbell';
          state.media.unshift({id:'m'+Date.now(),key,kind:'illustration',title,date,related:rel||null,note:'用户上传'});
          save();closeOverlays();toast('素材已存入相册');location.hash='#/media';};
        if(fileInput.files&&fileInput.files[0]){
          const fr=new FileReader();fr.onload=()=>{state.media.unshift({id:'m'+Date.now(),dataUrl:fr.result,kind:'photo',title,date,related:rel||null,note:'本地图片'});save();closeOverlays();toast('本地图片已上传');location.hash='#/media';};
          fr.onerror=()=>{toast('读取失败，请重试');};fr.readAsDataURL(fileInput.files[0]);
        } else fin();
        break;}
      case 'search-input':filter.q=el.value;render();{const s=document.querySelector('[data-act="search-input"]');if(s){s.focus();const v=s.value;s.setSelectionRange(v.length,v.length);}}break;
      case 'chip-type':filter.type=v;render();break;
      case 'chip-status':filter.status=v;render();break;
      case 'chip-sort':filter.sort=filter.sort==='date'?'num':'date';render();break;
      case 'filter-muscle':state._exMuscle=v;render();break;
      case 'open-filter':mask(`<div class="h2">筛选与排序</div>
        <div class="field"><label>类型</label><div class="seg">${['','training','exercise','body','measure','diet','sleep','record'].map(t=>`<div class="opt ${filter.type===t?'on':''}" data-act="f-type" data-v="${t}">${t?TYPE[t].label:'全部'}</div>`).join('')}</div></div>
        <div class="field"><label>状态</label><div class="seg">${['','todo','doing','done'].map(s=>`<div class="opt ${filter.status===s?'on':''}" data-act="f-status" data-v="${s}">${s?STLABEL[s]:'全部'}</div>`).join('')}</div></div>
        <div class="field"><label>排序</label><div class="seg">${[['date','日期↓'],['num','数值↓']].map(s=>`<div class="opt ${filter.sort===s[0]?'on':''}" data-act="f-sort" data-v="${s[0]}">${s[1]}</div>`).join('')}</div></div>
        <button class="btn btn-line btn-block" data-act="clear-filter">清除全部筛选</button>
        <button class="btn btn-primary btn-block" style="margin-top:8px" data-act="apply-filter">完成</button>`);break;
      case 'f-type':filter.type=v;el.parentNode.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');break;
      case 'f-status':filter.status=v;el.parentNode.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');break;
      case 'f-sort':filter.sort=v;el.parentNode.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');break;
      case 'clear-filter':filter={q:'',type:'',status:'',tag:'',sort:'date'};closeOverlays();render();break;
      case 'apply-filter':closeOverlays();render();break;
      case 'cal-prev':{const c=state._cal||{y:2026,m:7};let m=c.m-1,y=c.y;if(m<0){m=11;y--;}state._cal={y,m};render();break;}
      case 'cal-next':{const c=state._cal||{y:2026,m:7};let m=c.m+1,y=c.y;if(m>11){m=0;y++;}state._cal={y,m};render();break;}
      case 'pick-day':state._selDate=v;render();break;
      case 'set-range':state._range=v;render();break;
      case 'seg-status':{el.parentNode.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');break;}
      case 'add-ex':{const i=$$('[data-ex="name"]').length;const box=document.createElement('div');box.className='exrow';box.style.display='block';
        box.innerHTML=`<div style="display:flex;gap:6px;margin-bottom:6px"><input style="flex:2" placeholder="动作名" data-ex="name" data-i="${i}">
          <input style="flex:1" placeholder="组" data-ex="sets" data-i="${i}" inputmode="numeric">
          <input style="flex:1" placeholder="次" data-ex="reps" data-i="${i}" inputmode="numeric">
          <input style="flex:1" placeholder="kg" data-ex="weight" data-i="${i}" inputmode="numeric"></div>
          <button class="btn btn-line btn-sm" data-act="del-ex" data-i="${i}">删此组</button>`;
        $('#ex-list').appendChild(box);break;}
      case 'del-ex':{if($$('[data-ex="name"]').length<=1){toast('至少保留一组');break;}el.closest('.exrow').remove();break;}
      case 'up-pick':{document.querySelectorAll('#up-cover .c').forEach(c=>c.classList.remove('on'));el.classList.add('on');break;}
      case 'upload-file':{const f=el.files&&el.files[0];if(f){const th=document.getElementById('up-thumb');if(th){th.innerHTML='<div style="width:60px;height:46px;border-radius:8px;background:#EAE5DA;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--taupe)">本地图</div>';}}break;}
      case 'add-category':{const inp=document.querySelector('[data-act="cat-input"]');const name=inp&&inp.value.trim();if(!name){toast('请输入分类名');break;}
        const key=name;if(state.categories.some(c=>c.key===key)){toast('分类已存在');break;}
        state.categories.push({key,label:name});TYPE[key]={label:name,icon:'tag',cover:'dumbbell'};
        save();toast('已新增分类：'+name);render();break;}
      case 'toggle-reminder':state.settings.reminderOn=el.checked;save();toast(el.checked?'提醒已开启':'提醒已关闭');break;
      case 'save-persona':{const P=state.persona;P.name=(document.querySelector('#p-name').value||'').trim();const age=+document.querySelector('#p-age').value;if(age)P.age=age;const h=+document.querySelector('#p-height').value;if(h)P.height=h;P.goal=(document.querySelector('#p-goal').value||'').trim();const g=document.querySelector('#p-gender').value;if(g)P.gender=g;const al=+document.querySelector('#p-activity').value;if(al)P.activityLevel=al;const sw=+document.querySelector('#p-start').value;if(sw)P.startWeight=sw;const wt=+document.querySelector('#p-water').value;if(wt)P.waterTarget=wt*1000;if(!P.started)P.started=todayStr();save();toast('档案已保存');render();break;}
      case 'export-data':exportJSON();break;
      case 'export-one':{const r=state.records.find(x=>x.id===id);exportObj(r,'记录_'+r.title);break;}
      case 'import-data':{
        mask(`<div class="h2">导入数据备份</div>
          <div class="cap" style="margin:4px 0 10px">选择此前导出的 <b>.json</b> 备份文件，或粘贴备份文本。导入将<b>覆盖当前全部数据</b>（不可撤销）。</div>
          <div class="search" style="margin-bottom:10px">${ic('upload')}<input type="file" accept="application/json,.json" id="imp-file" style="font-size:12px"></div>
          <div class="field"><label>或粘贴备份文本</label><textarea id="imp-text" placeholder="把导出的文本粘贴到这里" style="min-height:120px;font-size:11px;font-family:monospace"></textarea></div>
          <button class="btn btn-primary btn-block" data-act="do-import">${ic('check')} 读取并导入</button>
          <button class="btn btn-line btn-block" style="margin-top:8px" data-act="cancel">取消</button>`);
        break;}
      case 'do-import':{
        const fileInput=document.getElementById('imp-file');
        const ta=document.getElementById('imp-text');
        const readDone=(str)=>{
          let parsed;
          try{parsed=JSON.parse(str);}catch(e){toast('解析失败：不是有效 JSON');return;}
          if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.records)||!parsed.persona){
            toast('不是完整备份（需含 records 与 persona）');return;}
          window._impData=parsed;
          center(`<div class="dt">覆盖当前全部数据？</div>
            <div class="dd">备份含 <b>${parsed.records.length}</b> 条记录、${parsed.media?parsed.media.length:0} 张素材。导入后替换现有数据，不可撤销。</div>
            <div class="drow"><button class="btn btn-line" style="flex:1" data-act="cancel">取消</button>
            <button class="btn btn-danger" style="flex:1" data-act="confirm-import">确认导入</button></div>`);
        };
        if(fileInput&&fileInput.files&&fileInput.files[0]){
          const fr=new FileReader();fr.onload=()=>readDone(fr.result);fr.onerror=()=>toast('读取文件失败');fr.readAsText(fileInput.files[0]);
        } else if(ta&&ta.value.trim()){
          readDone(ta.value.trim());
        } else {
          toast('请先选择备份文件，或粘贴备份文本');
        }
        break;}
      case 'confirm-import':{
        if(!window._impData)break;
        state=window._impData;
        if(!state.settings)state.settings={reminderOn:false,storeNote:''};
        if(!state.version)state.version=3;
        ['records','media','activities','achievements','reminders','exercises','routines','categories'].forEach(k=>{if(!Array.isArray(state[k]))state[k]=clone(SEED[k]||[]);});
        save();closeOverlays();toast('导入成功 · 已恢复 '+state.records.length+' 条记录');
        location.hash='#/home';render();
        break;}
      case 'copy-export':{
        const ta=document.getElementById('exp-text');
        const text=ta?ta.value:(window._expJson||JSON.stringify(state));
        copyText(text).then(ok=>toast(ok?'已复制，去粘贴保存':'复制失败，请长按手动选择'));
        break;}
      case 'download-export':{
        const name=el.dataset.name||'肌动_数据备份.json';
        const blob=new Blob([window._expJson||JSON.stringify(state,null,2)],{type:'application/json'});
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
        try{URL.revokeObjectURL(a.href);}catch(e){}
        toast('已开始下载文件');
        break;}
      case 'reset-data':center(`<div class="dt">清空所有数据？</div><div class="dd">将删除全部记录、素材、活动与成就，<b>回到空白工作台（不可恢复）</b>。</div>
        <div class="drow"><button class="btn btn-line" style="flex:1" data-act="cancel">取消</button>
        <button class="btn btn-danger" style="flex:1" data-act="do-reset">确认清空</button></div>`);break;
      case 'do-reset':state=clone(SEED);save();closeOverlays();toast('已清空，开始记录你的数据');location.hash='#/home';break;
    }
  }

  function unlock(title,icon,desc){
    if(!state.achievements.some(a=>a.title===title))
      state.achievements.push({id:'ac'+Date.now(),title,date:todayStr(),icon,desc,earned:true});
  }
  // —— PR 追踪（按动作名聚合历史最大重量）——
  function prMap(excludeId){
    const m={};
    state.records.filter(r=>r.id!==excludeId&&r.type==='training'&&r.status==='done'&&r.fields&&r.fields.exercises)
      .forEach(r=>{(r.fields.exercises||[]).forEach(e=>{const w=+e.weight||0;if(w<=0)return;const cur=m[e.name];if(!cur||w>cur.weight)m[e.name]={weight:w,reps:+e.reps||0,date:r.date};});});
    return m;
  }
  function detectPR(rec){
    const m=prMap(rec.id),hit=[];
    (rec.fields.exercises||[]).forEach(e=>{const w=+e.weight||0;if(w<=0)return;const cur=m[e.name];
      if(!cur||w>cur.weight)hit.push({name:e.name,weight:w,reps:+e.reps||0});});
    return hit;
  }
  function applyPR(rec){
    const hit=detectPR(rec);
    if(!hit.length)return;
    const top=hit.sort((a,b)=>b.weight-a.weight)[0];
    unlock('力量新高度','record',top.name+' 刷新个人最大重量 '+top.weight+'kg。');
    state.activities.unshift({id:'ac'+Date.now(),date:rec.date,time:rec.time,text:top.name+' 破纪录 '+top.weight+'kg（'+top.reps+'次）',icon:'record',rec:rec.id});
    toast(top.name+' PR · '+top.weight+'kg');
  }

  function bumpStreak(date){
    state.persona.streak=(state.persona.streak||0)+1;
    const n=state.persona.streak;
    if(n===7)unlock('连续训练 7 天','check','习惯开始扎根。');
    if(n===14)unlock('连续训练 14 天','training','双周节律，稳。');
    if(n===21)unlock('连续训练 21 天','trophy','三周不中断，身体已适应。');
    if(n===30)unlock('连续训练 30 天','record','月度全勤，证据确凿。');
  }

  function exportJSON(){
    const json=JSON.stringify(state,null,2);
    const ts=todayStr().replace(/-/g,'');
    const fname='肌动_数据备份_'+ts+'.json';
    window._expJson=json;
    const hasPhoto=state.media.some(m=>m.dataUrl);
    mask(`<div class="h2">导出数据备份</div>
      <div class="cap" style="margin:4px 0 10px">共 ${state.records.length} 条记录、${state.media.length} 张素材。${hasPhoto?'<b>含本地照片，文本较大，建议用「下载文件」保存。</b>':'轻点文本框全选后复制，或下载文件保存。'}换手机或清浏览器前务必备份。</div>
      <div class="field"><label>备份内容（点选全选后复制）</label>
        <textarea id="exp-text" readonly style="min-height:170px;font-size:11px;font-family:monospace;line-height:1.4">${esc(json)}</textarea></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1" data-act="copy-export">${ic('copy')} 复制</button>
        <button class="btn btn-ink" style="flex:1" data-act="download-export" data-name="${fname}">${ic('download')} 下载文件</button>
      </div>
      <button class="btn btn-line btn-block" style="margin-top:8px" data-act="cancel">关闭</button>`);
  }
  function copyText(text){
    return new Promise(res=>{
      if(navigator.clipboard&&window.isSecureContext){
        navigator.clipboard.writeText(text).then(()=>res(true)).catch(()=>res(legacyCopy(text)));
      } else res(legacyCopy(text));
    });
  }
  function legacyCopy(text){
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.top='-9999px';ta.style.opacity='0';
    document.body.appendChild(ta);ta.focus();ta.select();
    let ok=false;try{ok=document.execCommand('copy');}catch(e){}
    ta.remove();return ok;
  }
  function exportObj(obj,name){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.json';a.click();
    toast('已导出此记录');
  }

  // —— 事件绑定 ——
  document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a&&a.type!=='file'){e.preventDefault();handleAct(a.dataset.act,a);}});
  document.addEventListener('input',e=>{if(e.target.matches('[data-act="search-input"]')){filter.q=e.target.value;render();}});
  document.addEventListener('change',e=>{
    if(e.target.type==='file'){
      const f=e.target.files&&e.target.files[0];
      const th=document.getElementById('up-thumb');
      if(f&&th)th.innerHTML='<div style="width:60px;height:46px;border-radius:8px;background:#EAE5DA;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--taupe)">本地图</div>';
      return;
    }
    if(e.target.matches('[data-act="toggle-reminder"]')){handleAct('toggle-reminder',e.target);}
  });
  window.addEventListener('hashchange',render);

  // 启动
  if(!location.hash)location.hash='#/home';
  render();
})();
