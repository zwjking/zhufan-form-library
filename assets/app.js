/* ============================================================
   筑范 · 应用逻辑（哈希路由 + 检索 + 筛选 + 收藏）
   ============================================================ */
(function () {
  'use strict';

  var FORMS = (window.FORMS || []).slice();
  var STAGES = window.STAGES || [];
  var STANDARDS = window.STANDARDS || [];
  var TYPES = window.FORM_TYPES || [];
  var ROLES = window.ROLES || [];

  var view = document.getElementById('view');
  var toastEl = document.getElementById('toast');
  var toastTimer;
  var favs = loadFavs();

  /* ---------- 工具 ---------- */
  function esc(s) { return ZF.esc(s); }
  function stageOf(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return { name: '未分类', icon: 'i-grid' }; }
  function byId(id) { for (var i = 0; i < FORMS.length; i++) if (FORMS[i].id === id) return FORMS[i]; return null; }
  function countBy(key) {
    var m = {};
    FORMS.forEach(function (f) {
      if (key === 'r') { (f.r || []).forEach(function (x) { m[x] = (m[x] || 0) + 1; }); }
      else { var v = f[key]; if (v) m[v] = (m[v] || 0) + 1; }
    });
    return m;
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }
  function loadFavs() {
    try { return JSON.parse(localStorage.getItem('zf_favs') || '[]'); } catch (e) { return []; }
  }
  function saveFavs() {
    try { localStorage.setItem('zf_favs', JSON.stringify(favs)); } catch (e) {}
  }
  function isFav(id) { return favs.indexOf(id) > -1; }
  function toggleFav(id, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    var i = favs.indexOf(id);
    if (i > -1) { favs.splice(i, 1); toast('已取消收藏'); }
    else { favs.push(id); toast('已加入收藏'); }
    saveFavs();
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.classList.toggle('on', isFav(id));
    });
    if (location.hash.indexOf('favorites') > -1) render();
  }

  /* ---------- 搜索文本 ---------- */
  function haystack(f) {
    if (f._h) return f._h;
    var parts = [f.n, f.id, f.p, f.w, f.b, (f.tg || []).join(' '), (f.r || []).join(' '), f.ty,
      (f.d || []).join(' '), (f.t || []).join(' ')];
    (f.m || []).forEach(function (p) { parts.push(p[0]); });
    (f.c || []).forEach(function (c) { parts.push(c.t); });
    (f.s || []).forEach(function (s) {
      parts.push(s.title || '');
      if (s.items) parts.push(s.items.join(' '));
      if (s.c) s.c.forEach(function (c) { parts.push(c.t); });
    });
    f._h = parts.join(' ').toLowerCase();
    return f._h;
  }

  function filterForms(st) {
    return FORMS.filter(function (f) {
      if (st.stage && f.st !== st.stage) return false;
      if (st.type && f.ty !== st.type) return false;
      if (st.role && (f.r || []).indexOf(st.role) === -1) return false;
      if (st.tag && (f.tg || []).indexOf(st.tag) === -1) return false;
      if (st.q) {
        var qs = st.q.toLowerCase().split(/\s+/).filter(Boolean);
        var h = haystack(f);
        for (var i = 0; i < qs.length; i++) if (h.indexOf(qs[i]) === -1) return false;
      }
      return true;
    });
  }

  /* ---------- 组件 ---------- */
  function icon(name) { return '<svg aria-hidden="true"><use href="#' + name + '"/></svg>'; }

  function formCard(f) {
    var s = stageOf(f.st);
    return '<a class="form-card" href="#/form/' + esc(f.id) + '">' +
      '<button class="fc-fav' + (isFav(f.id) ? ' on' : '') + '" data-fav="' + esc(f.id) + '" ' +
        'title="收藏" aria-label="收藏">' + icon('i-star') + '</button>' +
      '<div class="fc-top">' +
        '<span class="code-chip">' + esc(f.id) + '</span>' +
        '<span class="chip chip-jade">' + esc(s.name) + '</span>' +
      '</div>' +
      '<div class="fc-name">' + esc(f.n) + '</div>' +
      '<div class="fc-purpose">' + esc(f.p) + '</div>' +
      '<div class="fc-foot">' +
        '<span class="chip chip-line">' + esc(f.ty) + '</span>' +
        (f.tg || []).slice(0, 1).map(function (t) { return '<span class="chip chip-brass">' + esc(t) + '</span>'; }).join('') +
        '<span style="margin-left:auto;font-size:11px;color:var(--ink-4)">' + (f.sg ? f.sg.length : 0) + ' 处签字</span>' +
      '</div>' +
    '</a>';
  }

  function statNum(n, label) {
    return '<div class="hp-stat"><b>' + n + '</b><span>' + label + '</span></div>';
  }

  /* ---------- 首页 ---------- */
  function viewHome() {
    var stageCount = countBy('st');
    var featIds = ['SG-04', 'SG-16', 'JS-03', 'JS-07', 'SG-01', 'KG-02',
      'LF-01', 'SG-05', 'SG-21', 'BJ-01', 'JS-09', 'SG-03'];
    var featured = featIds.map(byId).filter(Boolean);
    if (featured.length < 8) featured = FORMS.slice(0, 12);

    var stagesHtml = STAGES.map(function (s) {
      return '<a class="stage-card" href="#/library?stage=' + s.id + '">' +
        '<div class="sc-icon">' + icon(s.icon) + '</div>' +
        '<div><div class="sc-name">' + esc(s.name) + '</div>' +
        '<div class="sc-desc">' + esc(s.desc) + '</div></div>' +
        '<div class="sc-foot"><span class="sc-count"><b>' + (stageCount[s.id] || 0) + '</b> 张表单</span>' +
        '<span class="sc-arrow">' + icon('i-arrow') + '</span></div>' +
      '</a>';
    }).join('');

    return '' +
    '<section class="hero"><div class="wrap hero-in">' +
      '<div class="hero-copy">' +
        '<div class="hero-kicker"><span class="dot"></span>标准表单库 <b>' + FORMS.length + '</b> 张 · 覆盖 <b>' + STAGES.length + '</b> 大阶段</div>' +
        '<h1>让每一道工序<br>都有<em>据</em>可依</h1>' +
        '<p class="hero-lead">装修施工管理全流程的标准表单库。从获客量房到竣工保修，每一张表都标明了用途、填报责任、常见纠纷点与编制依据——对齐 GB 50327、GB 50210、GB 50325 等现行标准，在线预览、打印、导出 Word 与 Excel，拿来即用。</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary" href="#/library">浏览全部表单' + icon('i-arrow') + '</a>' +
          '<a class="btn btn-ghost" href="#/stages">' + icon('i-grid') + '按阶段查看</a>' +
        '</div>' +
        '<form class="hero-search" id="heroSearch">' +
          icon('i-search') +
          '<input type="search" id="heroInput" placeholder="搜索表单，如「隐蔽工程验收」「增项变更」「竣工验收」">' +
          '<button type="submit" class="hs-btn">搜索</button>' +
        '</form>' +
      '</div>' +
      '<aside class="hero-panel">' +
        '<div class="hp-title">库 体 概 览</div>' +
        '<div class="hp-stats">' +
          statNum(FORMS.length, '张标准表单') +
          statNum(STAGES.length, '个业务阶段') +
          statNum(STANDARDS.length, '项依据标准') +
          statNum(FORMS.reduce(function (a, f) { return a + (f.sg ? f.sg.length : 0); }, 0), '个签字节点') +
        '</div>' +
        '<div class="hp-list">' +
          '<div class="hp-item">' + icon('i-shield') + '对齐国家标准与部门规章<b>' + STANDARDS.length + ' 项</b></div>' +
          '<div class="hp-item">' + icon('i-word') + 'Word / Excel 原生导出<b>可直接改</b></div>' +
          '<div class="hp-item">' + icon('i-print') + 'A4 打印与 PDF 存档<b>免排版</b></div>' +
          '<div class="hp-item">' + icon('i-check') + '每张标注填报责任与纠纷点<b>能落地</b></div>' +
        '</div>' +
      '</aside>' +
    '</div></section>' +

    '<section class="stage-block"><div class="wrap">' +
      '<div class="section-head">' +
        '<div class="kicker">PROJECT LIFE CYCLE</div>' +
        '<h2>按项目全生命周期组织</h2>' +
        '<p>不是把表格堆在一起，而是沿着一个装修项目从接触到保修的完整路径排列。找到你要的表，只需要知道现在处在哪一步。</p>' +
      '</div>' +
      '<div class="stage-grid">' + stagesHtml + '</div>' +
    '</div></section>' +

    '<section class="feat-block"><div class="wrap">' +
      '<div class="section-head">' +
        '<div class="kicker">MOST USED</div>' +
        '<h2>装企最常调用的 12 张</h2>' +
        '<p>按实际使用频次挑选，覆盖最容易出纠纷、最容易扯皮的环节。</p>' +
      '</div>' +
      '<div class="form-grid">' + featured.map(formCard).join('') + '</div>' +
      '<div style="margin-top:26px;text-align:center"><a class="btn btn-ghost" href="#/library">查看全部 ' + FORMS.length + ' 张表单' + icon('i-arrow') + '</a></div>' +
    '</div></section>';
  }

  /* ---------- 模板库 ---------- */
  function viewLibrary(st) {
    var list = filterForms(st);
    var stageCount = countBy('st'), typeCount = countBy('ty'), roleCount = countBy('r');

    function opts(active, items, key) {
      return items.map(function (o) {
        var val = o.v, label = o.l, n = o.n;
        return '<button class="f-opt' + (active === val ? ' on' : '') + '" data-filter="' + key + '" data-value="' + esc(val) + '">' +
          esc(label) + '<span class="n">' + n + '</span></button>';
      }).join('');
    }

    var stageOpts = [{ v: '', l: '全部阶段', n: FORMS.length }].concat(STAGES.map(function (s) {
      return { v: s.id, l: s.name, n: stageCount[s.id] || 0 };
    }));
    var typeOpts = [{ v: '', l: '全部性质', n: FORMS.length }].concat(
      Object.keys(typeCount).sort(function (a, b) { return typeCount[b] - typeCount[a]; }).map(function (t) {
        return { v: t, l: t, n: typeCount[t] };
      }));
    var roleOpts = [{ v: '', l: '全部角色', n: FORMS.length }].concat(ROLES.filter(function (r) { return roleCount[r]; }).map(function (r) {
      return { v: r, l: r, n: roleCount[r] };
    }));

    var tags = [];
    var tm = {};
    FORMS.forEach(function (f) { (f.tg || []).forEach(function (t) { tm[t] = (tm[t] || 0) + 1; }); });
    Object.keys(tm).sort(function (a, b) { return tm[b] - tm[a]; }).slice(0, 8).forEach(function (t) { tags.push({ v: t, l: t, n: tm[t] }); });

    var activeTags = [];
    if (st.stage) activeTags.push({ k: 'stage', v: st.stage, l: stageOf(st.stage).name });
    if (st.type) activeTags.push({ k: 'type', v: st.type, l: st.type });
    if (st.role) activeTags.push({ k: 'role', v: st.role, l: '角色：' + st.role });
    if (st.tag) activeTags.push({ k: 'tag', v: st.tag, l: st.tag });
    if (st.q) activeTags.push({ k: 'q', v: st.q, l: '关键词：' + st.q });

    return '<section class="library"><div class="wrap">' +
      '<div class="lib-head">' +
        '<div><h1>全部标准表单</h1><p>共 ' + FORMS.length + ' 张 · 当前筛选出 ' + list.length + ' 张</p></div>' +
        '<div class="lib-search">' + icon('i-search') +
          '<input type="search" id="libInput" placeholder="搜索名称、编号、字段、依据…" value="' + esc(st.q || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="lib-body">' +
        '<aside class="filters">' +
          '<div class="f-group"><div class="f-title">业 务 阶 段</div>' + opts(st.stage || '', stageOpts, 'stage') + '</div>' +
          '<div class="f-group"><div class="f-title">表 格 性 质</div>' + opts(st.type || '', typeOpts, 'type') + '</div>' +
          '<div class="f-group"><div class="f-title">使 用 角 色</div>' + opts(st.role || '', roleOpts, 'role') + '</div>' +
          '<div class="f-group"><div class="f-title">常 用 标 签</div>' + opts(st.tag || '', tags, 'tag') + '</div>' +
        '</aside>' +
        '<div class="lib-main">' +
          '<div class="lib-bar">' +
            '<span class="lib-count">筛选结果 <b>' + list.length + '</b> 张</span>' +
            '<button class="btn btn-ghost btn-sm" id="batchWord" style="margin-left:6px">' + icon('i-word') +
              '导出这 ' + list.length + ' 张（Word）</button>' +
            (activeTags.length ? '<button class="lib-clear" id="clearFilters">清除全部筛选</button>' : '') +
            '<div class="active-tags">' + activeTags.filter(function (t) { return t.k !== 'q'; }).map(function (t) {
              return '<span class="chip chip-jade">' + esc(t.l) + '</span>';
            }).join('') + '</div>' +
          '</div>' +
          (list.length
            ? '<div class="form-grid">' + list.map(formCard).join('') + '</div>'
            : '<div class="empty">' + icon('i-search') + '<h3>没有匹配的表单</h3><p>换个关键词，或清除筛选条件再试一次</p></div>') +
        '</div>' +
      '</div>' +
    '</div></section>';
  }

  /* ---------- 详情 ---------- */
  function viewForm(id) {
    var f = byId(id);
    if (!f) {
      return '<div class="wrap" style="padding:80px 0"><div class="empty">' + icon('i-search') +
        '<h3>找不到这张表单</h3><p>它可能已被移除，或链接有误</p></div></div>';
    }
    var s = stageOf(f.st);
    var siblings = FORMS.filter(function (x) { return x.st === f.st && x.id !== f.id; }).slice(0, 4);

    var dispute = (f.d || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('');
    var tips = (f.t || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('');

    return '<section class="detail"><div class="wrap">' +
      '<nav class="crumb">' +
        '<a href="#/">首页</a><i>/</i>' +
        '<a href="#/library">全部表单</a><i>/</i>' +
        '<a href="#/library?stage=' + f.st + '">' + esc(s.name) + '</a><i>/</i>' +
        '<b>' + esc(f.n) + '</b>' +
      '</nav>' +
      '<div class="detail-grid">' +

        '<aside class="info-panel">' +
          '<div class="ip-head">' +
            '<div class="ip-code">' +
              '<span class="code-chip">' + esc(f.id) + '</span>' +
              '<span class="chip chip-jade">' + esc(s.name) + '</span>' +
            '</div>' +
            '<h1>' + esc(f.n) + '</h1>' +
            '<div class="ip-tags">' +
              '<span class="chip chip-line">' + esc(f.ty) + '</span>' +
              (f.tg || []).map(function (t) { return '<span class="chip chip-brass">' + esc(t) + '</span>'; }).join('') +
            '</div>' +
            '<div class="ip-actions">' +
              '<button class="btn btn-primary btn-sm" id="btnPrint">' + icon('i-print') + '打印 / 存 PDF</button>' +
              '<button class="btn btn-ghost btn-sm" id="btnFav" data-fav-btn="' + esc(f.id) + '">' +
                icon('i-star') + (isFav(f.id) ? '已收藏' : '收藏') + '</button>' +
            '</div>' +
            '<div class="ip-actions" style="margin-top:8px">' +
              '<button class="btn btn-ghost btn-sm" id="btnWord">' + icon('i-word') + 'Word</button>' +
              '<button class="btn btn-ghost btn-sm" id="btnExcel">' + icon('i-excel') + 'Excel</button>' +
            '</div>' +
          '</div>' +
          '<div class="ip-body">' +
            '<div class="ip-sec"><h3>用 途</h3><p>' + esc(f.p) + '</p></div>' +
            '<div class="ip-sec"><h3>填 报 责 任</h3><p>' + esc(f.w) + '</p></div>' +
            (tips ? '<div class="ip-sec"><h3>填 写 要 点</h3><ul class="ip-list tip">' + tips + '</ul></div>' : '') +
            (dispute ? '<div class="ip-sec"><h3>常 见 纠 纷 点</h3><ul class="ip-list warn">' + dispute + '</ul></div>' : '') +
            '<div class="ip-sec"><h3>编 制 依 据</h3><div class="ip-basis">' + esc(f.b || '企业内控规范') + '</div></div>' +
            '<div class="ip-sec"><h3>适 用 说 明</h3>' +
              '<dl class="ip-kv">' +
                '<dt>适用角色</dt><dd>' + esc((f.r || []).join('、')) + '</dd>' +
                '<dt>表格性质</dt><dd>' + esc(f.ty) + '</dd>' +
                '<dt>签字节点</dt><dd>' + (f.sg || []).length + ' 处' + ((f.sg || []).length ? '（' + esc(f.sg.join('、')) + '）' : '') + '</dd>' +
                '<dt>所属阶段</dt><dd>' + esc(s.name) + '</dd>' +
              '</dl>' +
            '</div>' +
          '</div>' +
        '</aside>' +

        '<div class="preview-col">' +
          '<div class="preview-bar">' +
            '<span class="pb-label">A4 表 单 预 览</span>' +
            '<span class="chip chip-line">210 × 297 mm</span>' +
            '<span class="pb-hint">打印时请选择 A4、纵向、边距「无」或「默认」，效果最佳</span>' +
          '</div>' +
          '<div class="sheet-stage">' + ZF.sheetHTML(f) + '</div>' +
          (siblings.length ? '<div class="section-head" style="margin:38px 0 18px"><div class="kicker">SAME STAGE</div>' +
            '<h2 style="font-size:19px">同阶段的其他表单</h2></div>' +
            '<div class="form-grid">' + siblings.map(formCard).join('') + '</div>' : '') +
        '</div>' +

      '</div>' +
    '</div></section>';
  }

  /* ---------- 阶段地图 ---------- */
  function viewStages() {
    var stageCount = countBy('st');
    var blocks = STAGES.map(function (s, idx) {
      var list = FORMS.filter(function (f) { return f.st === s.id; });
      return '<div style="margin-bottom:44px">' +
        '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap">' +
          '<span class="sc-icon">' + icon(s.icon) + '</span>' +
          '<div><h2 style="margin:0;font-size:21px;letter-spacing:-.02em">' +
            '<span style="font-family:var(--num);font-size:12px;color:var(--brass);margin-right:9px">0' + (idx + 1) + '</span>' +
            esc(s.name) + '</h2>' +
            '<p style="margin:3px 0 0;font-size:12.5px;color:var(--ink-3)">' + esc(s.desc) + ' · ' + list.length + ' 张</p></div>' +
          '<a class="btn btn-ghost btn-sm" href="#/library?stage=' + s.id + '" style="margin-left:auto">进入该阶段' + icon('i-arrow') + '</a>' +
        '</div>' +
        '<div class="form-grid">' + list.map(formCard).join('') + '</div>' +
      '</div>';
    }).join('');

    return '<section class="library"><div class="wrap">' +
      '<div class="std-hero"><h1>阶段地图</h1>' +
      '<p>一个装修项目从首次咨询到保修期满，会经过九个阶段。每个阶段有它必须留下的记录——不是为了走流程，而是为了在出问题时，你能拿得出东西。</p></div>' +
      blocks + '</div></section>';
  }

  /* ---------- 依据标准 ---------- */
  function viewStandards() {
    var cards = STANDARDS.map(function (s) {
      var relLinks = (s.rel || []).map(function (sid) {
        var st = stageOf(sid);
        return '<a href="#/library?stage=' + sid + '&q=' + encodeURIComponent(s.q || '') + '">' + esc(st.name) + '</a>';
      }).join('');
      return '<div class="std-card">' +
        '<div class="std-badge">' + esc(s.code) + '</div>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<div class="std-org">' + esc(s.org) + ' · ' + esc(s.badge) + '</div>' +
        '<p>' + esc(s.desc) + '</p>' +
        (relLinks ? '<div class="std-rel">' + relLinks + '</div>' : '') +
      '</div>';
    }).join('');

    return '<section class="standards"><div class="wrap">' +
      '<div class="std-hero">' +
        '<div class="section-head"><div class="kicker">BASIS & STANDARDS</div>' +
        '<h1>每张表，都能说清依据</h1></div>' +
        '<p>装修行业没有「表格国标」，但有明确的技术标准、验收规范和管理规章。筑范的每一张表单都从这些文件里推出字段与验收项，并在表头标注依据编号。这样当客户问「凭什么这么验」，你有答案。</p>' +
      '</div>' +
      '<div class="std-grid">' + cards + '</div>' +
      '<div style="margin-top:44px;padding:24px;border-radius:var(--r-lg);background:rgba(255,255,255,.55);border:1px dashed var(--line)">' +
        '<p style="margin:0;font-size:12.5px;line-height:1.9;color:var(--ink-2)">' +
        '<b style="color:var(--ink)">关于标准版本：</b>国家标准会修订换版（例如 GB 50210 现行版本为 2018 版，替代 2001 版）。筑范表单标注的是编制时参照的版本，实际使用请以<span style="color:var(--jade);font-weight:600">国家标准化管理委员会</span>或<span style="color:var(--jade);font-weight:600">住房和城乡建设部</span>发布的最新有效版本为准。地方性要求（如上海、北京、深圳的示范合同与验收细则）可能更严，请叠加属地规定执行。</p>' +
      '</div>' +
    '</div></section>';
  }

  /* ---------- 收藏 ---------- */
  function viewFavorites() {
    var list = favs.map(byId).filter(Boolean);
    return '<section class="library"><div class="wrap">' +
      '<div class="lib-head"><div><h1>我的收藏</h1>' +
      '<p>' + (list.length ? '共 ' + list.length + ' 张 · 数据保存在本机浏览器' : '还没有收藏任何表单') + '</p></div></div>' +
      (list.length
        ? '<div class="form-grid">' + list.map(formCard).join('') + '</div>'
        : '<div class="empty">' + icon('i-star') + '<h3>收藏夹是空的</h3>' +
          '<p>在表单卡片或详情页点击星标，常用的表就会出现在这里</p>' +
          '<div style="margin-top:20px"><a class="btn btn-primary" href="#/library">去挑几张</a></div></div>') +
    '</div></section>';
  }

  /* ---------- 路由 ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi > -1 ? h.slice(0, qi) : h;
    var qs = qi > -1 ? h.slice(qi + 1) : '';
    var params = {};
    qs.split('&').filter(Boolean).forEach(function (kv) {
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { path: path.replace(/\/$/, ''), params: params };
  }

  function currentState() {
    var r = parseHash();
    return {
      stage: r.params.stage || '',
      type: r.params.type || '',
      role: r.params.role || '',
      tag: r.params.tag || '',
      q: r.params.q || ''
    };
  }

  function pushState(patch) {
    var st = currentState();
    Object.keys(patch).forEach(function (k) { st[k] = patch[k]; });
    var q = Object.keys(st).filter(function (k) { return st[k]; })
      .map(function (k) { return k + '=' + encodeURIComponent(st[k]); }).join('&');
    location.hash = '#/library' + (q ? '?' + q : '');
  }

  function render() {
    var r = parseHash();
    var html;
    if (r.path === '' || r.path === 'home') html = viewHome();
    else if (r.path === 'library') html = viewLibrary(currentState());
    else if (r.path === 'stages') html = viewStages();
    else if (r.path === 'standards') html = viewStandards();
    else if (r.path === 'favorites') html = viewFavorites();
    else if (r.path.indexOf('form/') === 0) html = viewForm(r.path.slice(5));
    else html = viewHome();

    view.innerHTML = html;
    bind(r);
    document.querySelectorAll('.nav a').forEach(function (a) {
      var rt = a.getAttribute('data-route');
      a.classList.toggle('active', rt === r.path || (r.path.indexOf('form/') === 0 && rt === 'library'));
    });
    document.getElementById('nav').classList.remove('open');
  }

  /* ---------- 事件绑定 ---------- */
  function bind(r) {
    // 收藏按钮（卡片）
    view.querySelectorAll('[data-fav]').forEach(function (b) {
      b.addEventListener('click', function (e) { toggleFav(b.getAttribute('data-fav'), e); });
    });

    // 首页搜索
    var hs = document.getElementById('heroSearch');
    if (hs) {
      hs.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = document.getElementById('heroInput').value.trim();
        location.hash = '#/library' + (v ? '?q=' + encodeURIComponent(v) : '');
      });
    }

    // 库内筛选
    view.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-filter');
        var val = b.getAttribute('data-value');
        if (key === 'stage') pushState({ stage: val });
        else if (key === 'type') pushState({ type: val });
        else if (key === 'role') pushState({ role: val });
        else if (key === 'tag') pushState({ tag: val });
      });
    });

    var clear = document.getElementById('clearFilters');
    if (clear) clear.addEventListener('click', function () { location.hash = '#/library'; });

    // 批量导出当前筛选结果
    var bw = document.getElementById('batchWord');
    if (bw) bw.addEventListener('click', function () {
      var st = currentState();
      var list = filterForms(st);
      if (!list.length) { toast('当前没有可导出的表单'); return; }
      var name = st.stage ? stageOf(st.stage).name + '阶段' : '全部';
      ZF.exportWord(list, '筑范_' + name + '_标准表单' + list.length + '张');
      toast('已导出 ' + list.length + ' 张表单（Word）');
    });

    // 库内搜索（防抖）
    var li = document.getElementById('libInput');
    if (li) {
      var t;
      li.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { pushState({ q: li.value.trim() }); }, 320);
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); pushState({ q: li.value.trim() }); }
      });
    }

    // 详情页动作
    var f = r.path.indexOf('form/') === 0 ? byId(r.path.slice(5)) : null;
    if (f) {
      var bp = document.getElementById('btnPrint');
      if (bp) bp.addEventListener('click', function () { ZF.printForms([f]); });
      var bw = document.getElementById('btnWord');
      if (bw) bw.addEventListener('click', function () {
        ZF.exportWord([f], f.id + '_' + f.n);
        toast('已导出 Word 文档');
      });
      var be = document.getElementById('btnExcel');
      if (be) be.addEventListener('click', function () {
        ZF.exportExcel([f], f.id + '_' + f.n);
        toast('已导出 Excel 表格');
      });
      var bf = document.getElementById('btnFav');
      if (bf) bf.addEventListener('click', function () {
        toggleFav(f.id);
        bf.innerHTML = '<svg aria-hidden="true"><use href="#i-star"/></svg>' + (isFav(f.id) ? '已收藏' : '收藏');
        bf.style.color = isFav(f.id) ? 'var(--brass)' : '';
      });
    }
  }

  /* ---------- 启动 ---------- */
  document.getElementById('navToggle').addEventListener('click', function () {
    document.getElementById('nav').classList.toggle('open');
  });

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  document.getElementById('footCount').textContent = FORMS.length;

  if (!location.hash) location.hash = '#/';
  render();
})();
