/* DotnAI Laundry ERP — khung ứng dụng: API, phiên, shell, router, tiện ích */
(function () {
  'use strict';
  const CONFIG = {
    company: {
      ten: 'Thuỷ Việt Laundry',
      phap_nhan: 'CÔNG TY TNHH GIẶT LÀ THUỶ VIỆT',
      slogan: 'Chung tay tạo dựng giá trị',
      dia_chi: 'Tân Thành, TP.HCM',
      sdt: '0867 904 xxx',
      web: 'thuyvietgroup.com'
    },
    version: 'laundry-1.0'
  };

  // ---------- Tiện ích ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, s) => (window.licon ? licon(n, s || 16) : '');
  const dn = (key, mod) => '<span class="dn-mod" style="--dnc:var(--dn-' + mod + ');--dnc2:var(--dn-' + mod + '-2)">' + (window.dnIcon ? dnIcon(key) : '') + '</span>';
  const nf = new Intl.NumberFormat('vi-VN');
  const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
  const fmt = {
    n: v => nf.format(Math.round(Number(v) || 0)),
    kg: v => nf1.format(Number(v) || 0),
    pad: n => String(n).padStart(2, '0'),
    dt(iso) { if (!iso) return '—'; const d = new Date(iso); return fmt.pad(d.getHours()) + ':' + fmt.pad(d.getMinutes()) + ' ' + fmt.pad(d.getDate()) + '/' + fmt.pad(d.getMonth() + 1); },
    d(iso) { if (!iso) return '—'; const d = new Date(iso); return fmt.pad(d.getDate()) + '/' + fmt.pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
    hm(iso) { if (!iso) return '—'; const d = new Date(iso); return fmt.pad(d.getHours()) + ':' + fmt.pad(d.getMinutes()); },
    dur(ms) {
      ms = Math.abs(ms); const m = Math.round(ms / 60000);
      if (m < 60) return m + ' phút';
      const h = Math.floor(m / 60), r = m % 60;
      if (h < 24) return h + ' giờ' + (r ? ' ' + r + ' phút' : '');
      const d = Math.floor(h / 24), hh = h % 24; return d + ' ngày' + (hh ? ' ' + hh + ' giờ' : '');
    },
    durShort(ms) { ms = Math.abs(ms); const m = Math.round(ms / 60000); if (m < 60) return m + 'p'; const h = Math.floor(m / 60); if (h < 24) return h + 'g' + (m % 60 ? fmt.pad(m % 60) : ''); return Math.floor(h / 24) + 'n' + (h % 24 ? (h % 24) + 'g' : ''); },
    hen(iso) {
      const t = new Date(iso).getTime() - Date.now();
      if (t < 0) return '<span class="pill dn">' + ic('clock', 12) + ' Trễ ' + fmt.dur(t) + '</span>';
      if (t < 3 * 3600e3) return '<span class="pill wn">' + ic('clock', 12) + ' Còn ' + fmt.dur(t) + '</span>';
      return '<span class="pill gy">' + fmt.dt(iso) + '</span>';
    },
    localInput(iso) { const d = iso ? new Date(iso) : new Date(); return d.getFullYear() + '-' + fmt.pad(d.getMonth() + 1) + '-' + fmt.pad(d.getDate()) + 'T' + fmt.pad(d.getHours()) + ':' + fmt.pad(d.getMinutes()); }
  };
  const TT_PILL = {
    cho_xu_ly: 'gy', dang_xu_ly: 'nt', san_sang_giao: 'bl', dang_giao: 'wn', da_giao: 'up', huy: 'dn'
  };
  function ttPill(tt, ten) { return '<span class="pill ' + (TT_PILL[tt] || 'gy') + '">' + esc(ten || (LCore.TT_LABEL[tt] || tt)) + '</span>'; }
  function miniSteps(s) {
    let h = '<span class="mini" title="' + esc(s.buoc.map(b => b.ten).join(' → ') + ' → Giao') + '">';
    s.buoc.forEach((b, i) => {
      let c = '';
      if (i < s.buoc_idx) c = 'd';
      else if (i === s.buoc_idx && (s.trang_thai === 'cho_xu_ly' || s.trang_thai === 'dang_xu_ly')) c = 'c' + (s.buoc_tt === 'dang_lam' ? '' : ' w');
      h += '<i class="' + c + '"></i>';
    });
    const g = s.trang_thai === 'da_giao' ? 'g d' : (s.trang_thai === 'san_sang_giao' || s.trang_thai === 'dang_giao') ? 'c' + (s.trang_thai === 'dang_giao' ? '' : ' w') : 'g';
    return h + '<i class="' + g + '"></i></span>';
  }
  function stepState(s) {
    if (s.trang_thai === 'da_giao') return '<span class="pill up">' + ic('check-circle', 12) + ' Đã giao ' + fmt.dt(s.giao_luc) + '</span>';
    if (s.trang_thai === 'huy') return ttPill('huy');
    const wait = Date.now() - new Date(s.buoc_tt === 'dang_lam' && s.bat_dau_luc ? s.bat_dau_luc : s.cho_tu).getTime();
    if (s.buoc_tt === 'dang_lam') return '<b>' + esc(s.buoc_hien) + '</b><div class="sm" style="color:var(--brand-purple-dark)"><span class="dot pulse" style="background:var(--brand-purple);margin-right:5px"></span>' + (s.trang_thai === 'dang_giao' ? 'Chờ khách ký' : 'Đang làm' + (s.nguoi_dang_lam ? ' · ' + esc(s.nguoi_dang_lam.split('—')[0].trim()) : '')) + ' · ' + fmt.durShort(wait) + '</div>';
    return '<b>' + esc(s.buoc_hien) + '</b><div class="sm ' + (wait > 3 * 3600e3 ? '' : 'muted') + '" style="' + (wait > 3 * 3600e3 ? 'color:var(--semantic-amber);font-weight:650' : '') + '">Chờ ' + fmt.durShort(wait) + '</div>';
  }

  // ---------- Toast · modal ----------
  function toast(msg, kind) {
    let box = $('#toast'); if (!box) { box = document.createElement('div'); box.id = 'toast'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'tst ' + (kind || ''); t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), kind === 'er' ? 4200 : 2600);
  }
  function modal(o) {
    const m = document.createElement('div'); m.className = 'mask';
    m.innerHTML = '<div class="dlg ' + (o.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><div class="dlg-hd"><h3>' + esc(o.title) + '</h3><button class="ml-ib" data-x aria-label="Đóng">' + ic('x') + '</button></div><div class="dlg-bd">' + (o.body || '') + '</div>' + (o.foot !== false ? '<div class="dlg-ft">' + (o.foot || '<button class="btn btn-ghost" data-x>Đóng</button>') + '</div>' : '') + '</div>';
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); if (o.onClose) o.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) close(); });
    const f = m.querySelector('input,select,textarea'); if (f && window.innerWidth > 760) setTimeout(() => f.focus(), 30);
    return { el: m, close };
  }
  function confirmBox(title, msg, okText) {
    return new Promise(res => {
      const md = modal({ title, body: '<p style="margin:0">' + msg + '</p>', foot: '<button class="btn btn-ghost" data-x>Thôi</button><button class="btn btn-brand" data-ok>' + esc(okText || 'Đồng ý') + '</button>', onClose: () => res(false) });
      md.el.querySelector('[data-ok]').onclick = () => { res(true); md.el.remove(); };
    });
  }

  // ---------- API (server Supabase hoặc demo cục bộ) ----------
  const S = { mode: null, user: null, token: null, dm: null, timers: [] };
  let demoStore = null;
  async function detectMode() {
    try {
      const r = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn: 'ping' }) });
      const j = await r.json();
      S.mode = j && j.backend === 'supabase' ? 'server' : 'demo';
    } catch (e) { S.mode = 'demo'; }
    if (S.mode === 'demo') demoStore = new LocalStore('dotn_laundry_demo_v1');
  }
  async function rpc(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    let r;
    if (S.mode === 'server') {
      const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn, args, token: S.token }) });
      r = await res.json();
      if (r && r.auth === false) { logout(true); throw new Error(r.error); }
    } else {
      await new Promise(x => setTimeout(x, 60));
      try {
        if (fn === 'login') r = await LCore.login(demoStore, args[0], args[1]);
        else if (LCore.PUBLIC[fn]) {
          const a = fn === 'phieuKyToken' ? [args[0], args[1], args[2], 'demo', navigator.userAgent] : args;
          r = Object.assign({ success: true }, await LCore.PUBLIC[fn].apply(null, [demoStore].concat(a)));
        } else {
          const out = await LCore.FN[fn].apply(null, [demoStore, S.user].concat(args));
          r = Array.isArray(out) ? { success: true, data: out } : Object.assign({ success: true }, out);
        }
      } catch (e) { r = { success: false, error: e.message }; }
    }
    if (r && r.success === false) throw new Error(r.error || 'Lỗi không xác định');
    return r;
  }
  async function loadDm(force) {
    if (S.dm && !force) return S.dm;
    S.dm = await rpc('danhMuc');
    S.dm.cdMap = Object.fromEntries(S.dm.congDoan.map(c => [c.id, c]));
    S.dm.khMap = Object.fromEntries(S.dm.khachHang.map(c => [c.id, c]));
    S.dm.qtMap = Object.fromEntries(S.dm.quyTrinh.map(c => [c.id, c]));
    return S.dm;
  }

  // ---------- Phiên ----------
  const SKEY = 'dotn_laundry_session';
  function saveSession() { try { localStorage.setItem(SKEY, JSON.stringify({ user: S.user, token: S.token, mode: S.mode, at: Date.now() })); } catch (e) {} }
  function loadSession() {
    try { const o = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (o && o.mode === S.mode && Date.now() - o.at < 14 * 3600e3) { S.user = o.user; S.token = o.token; } } catch (e) {}
  }
  function logout(expired) {
    S.user = null; S.token = null; S.dm = null;
    try { localStorage.removeItem(SKEY); } catch (e) {}
    if (expired) toast('Phiên đăng nhập hết hạn — đăng nhập lại', 'er');
    location.hash = '#/login';
    route();
  }

  // ---------- Điều hướng ----------
  const ALL = ['quan_ly', 'nhan_don', 'san_xuat', 'giao_hang'];
  const NAV = [
    { ttl: 'Điều hành' },
    { id: 'tong-quan', ten: 'Tổng quan', dn: 'overview', mod: 'overview', roles: ALL, bn: 'layout-grid' },
    { ttl: 'Vận hành' },
    { id: 'nhan-don', ten: 'Nhận đơn', dn: 'receive', mod: 'purchase', roles: ['quan_ly', 'nhan_don'], bn: 'plus' },
    { id: 'don', ten: 'Đơn hàng', dn: 'po', mod: 'sales', roles: ALL, bn: 'clipboard-list' },
    { id: 'tram', ten: 'Trạm sản xuất', dn: 'inventory', mod: 'inventory', roles: ['quan_ly', 'san_xuat'], bn: 'layers' },
    { id: 'giao', ten: 'Giao hàng & ký', dn: 'transfer', mod: 'crm', roles: ['quan_ly', 'giao_hang', 'nhan_don'], bn: 'package' },
    { id: 'phieu', ten: 'Phiếu giao nhận', dn: 'book', mod: 'accounting', roles: ALL },
    { ttl: 'Thiết lập', roles: ['quan_ly'] },
    { id: 'quy-trinh', ten: 'Quy trình & công đoạn', dn: 'route', mod: 'system', roles: ['quan_ly'] },
    { id: 'khach-hang', ten: 'Khách hàng', dn: 'crm', mod: 'crm', roles: ['quan_ly'] },
    { id: 'mat-hang', ten: 'Mặt hàng', dn: 'product', mod: 'purchase', roles: ['quan_ly'] },
    { id: 'nhan-vien', ten: 'Nhân viên', dn: 'people', mod: 'hr', roles: ['quan_ly'] }
  ];
  const SCREENS = {};
  function homeFor(u) { return u.vaiTro === 'san_xuat' ? 'tram' : u.vaiTro === 'giao_hang' ? 'giao' : 'tong-quan'; }
  function canSee(id) { const n = NAV.find(x => x.id === id); return !n || n.roles.indexOf(S.user.vaiTro) >= 0; }
  function go(path) { if (location.hash === '#/' + path) route(); else location.hash = '#/' + path; }

  function shell() {
    if ($('#side')) return;
    document.body.innerHTML = '';
    const u = S.user;
    const side = document.createElement('aside'); side.id = 'side';
    let nav = '';
    NAV.forEach(n => {
      if (n.ttl) { if (!n.roles || n.roles.indexOf(u.vaiTro) >= 0) nav += '<div class="sd-ttl">' + esc(n.ttl) + '</div>'; return; }
      if (n.roles.indexOf(u.vaiTro) < 0) return;
      nav += '<button class="sd-item" data-go="' + n.id + '">' + dn(n.dn, n.mod) + '<span class="sd-lbl">' + esc(n.ten) + '</span><span class="cnt hidden" data-cnt="' + n.id + '"></span></button>';
    });
    side.innerHTML = '<div class="sd-brand"><span class="sd-logo"><img src="ui/dotn_logo.png" alt=""></span><span><span class="sd-name">' + esc(CONFIG.company.ten) + '</span><span class="sd-sub">Quản trị giặt là B2B · DotnAI</span></span></div><nav>' + nav + '</nav><div class="sd-foot">Vận hành bởi DotnAI · ' + CONFIG.version + (S.mode === 'demo' ? ' · demo' : '') + '</div>';
    const top = document.createElement('header'); top.className = 'topbar';
    const today = new Date();
    top.innerHTML = '<button class="tb-back" id="tb-back" aria-label="Quay lại">' + ic('arrow-left', 18) + '</button>' +
      '<div class="tb-info"><div class="tb-title" id="tb-title">Dotn</div><div class="tb-sub" id="tb-sub"></div></div>' +
      '<div class="tb-mid"><span class="kychip">HÔM NAY · ' + fmt.pad(today.getDate()) + '/' + fmt.pad(today.getMonth() + 1) + '</span>' +
      '<label id="tb-search"><span>' + ic('search', 15) + '</span><input id="tb-q" placeholder="Tìm đơn — mã đơn, tên khách…" autocomplete="off"><span class="ai">Dotn</span></label>' +
      (S.mode === 'demo' ? '<button class="demochip" id="tb-demo" title="Dữ liệu demo lưu trên trình duyệt này">Chế độ demo</button>' : '') + '</div>' +
      '<button class="tb-ib" id="tb-bell" aria-label="Cảnh báo">' + ic('bell', 17) + '<span class="d hidden" id="tb-bell-n"></span></button>' +
      '<button class="tb-user" id="tb-user">' + ic('users', 15) + ' ' + esc(u.ten.split('—')[0].split('(')[0].trim()) + '</button>';
    const main = document.createElement('main'); main.id = 'main';
    const bnav = document.createElement('nav'); bnav.className = 'bnav';
    bnav.innerHTML = NAV.filter(n => n.bn && n.roles.indexOf(u.vaiTro) >= 0).map(n => '<button class="bn" data-go="' + n.id + '">' + ic(n.bn, 20) + '<span>' + esc(n.ten.split(' ')[0] === 'Giao' ? 'Giao hàng' : n.ten.replace('Trạm sản xuất', 'Trạm')) + '</span></button>').join('') +
      '<button class="bn" id="bn-more">' + ic('ellipsis', 20) + '<span>Thêm</span></button>';
    document.body.append(side, top, main, bnav);
    $('#tb-back').onclick = () => history.back();
    $('#tb-user').onclick = e => userMenu(e.currentTarget);
    $('#bn-more').onclick = e => moreMenu(e.currentTarget);
    $('#tb-bell').onclick = e => bellMenu(e.currentTarget);
    if ($('#tb-demo')) $('#tb-demo').onclick = e => userMenu(e.currentTarget);
    $('#tb-q').addEventListener('keydown', e => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) { S.searchQ = q; go('don'); e.target.value = ''; } } });
    refreshBadges();
    S.timers.push(setInterval(refreshBadges, 60000));
  }
  function popAt(anchor, html) {
    $$('.pop').forEach(p => p.remove());
    const p = document.createElement('div'); p.className = 'pop'; p.innerHTML = html; document.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    const w = p.offsetWidth, hgt = p.offsetHeight;
    let left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w));
    let top = r.bottom + 6; if (top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 6);
    p.style.left = left + 'px'; p.style.top = top + 'px';
    setTimeout(() => {
      const off = e => { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('mousedown', off); } };
      document.addEventListener('mousedown', off);
    });
    p.addEventListener('click', e => { if (e.target.closest('[data-go],[data-act]')) setTimeout(() => p.remove()); });
    return p;
  }
  function userMenu(a) {
    const u = S.user;
    const p = popAt(a, '<h6>' + esc(u.ten) + ' · ' + esc(LCore.VAI_TRO[u.vaiTro]) + '</h6>' +
      (S.mode === 'demo' ? '<button class="sr" data-act="reset">' + ic('refresh-cw') + ' Tạo lại dữ liệu demo</button>' : '') +
      '<button class="sr" data-act="out">' + ic('arrow-left') + ' Đăng xuất</button>' +
      '<div class="sm muted" style="padding:6px 10px">' + (S.mode === 'demo' ? 'Đang chạy chế độ demo: dữ liệu lưu trên trình duyệt này. Cấu hình Supabase trên Vercel để dùng thật.' : 'Đã kết nối máy chủ Supabase.') + '</div>');
    p.querySelector('[data-act=out]').onclick = () => logout();
    const rs = p.querySelector('[data-act=reset]');
    if (rs) rs.onclick = async () => { if (!await confirmBox('Tạo lại dữ liệu demo', 'Xoá toàn bộ dữ liệu demo trên trình duyệt này và sinh lại dữ liệu mẫu?', 'Tạo lại')) return; demoStore.reset(); await LCore.seedIfEmpty(demoStore); S.dm = null; toast('Đã tạo lại dữ liệu demo', 'ok'); route(); };
  }
  function moreMenu(a) {
    const u = S.user;
    let h = '';
    NAV.forEach(n => {
      if (n.ttl) { if (!n.roles || n.roles.indexOf(u.vaiTro) >= 0) h += '<h6>' + esc(n.ttl) + '</h6>'; return; }
      if (n.roles.indexOf(u.vaiTro) < 0) return;
      h += '<button class="sr" data-go="' + n.id + '">' + dn(n.dn, n.mod) + ' ' + esc(n.ten) + '</button>';
    });
    h += '<h6>Tài khoản</h6><button class="sr" data-act="u">' + ic('users') + ' ' + esc(u.ten) + '</button>';
    const p = popAt(a, h);
    p.querySelector('[data-act=u]').onclick = () => userMenu(a);
  }
  async function bellMenu(a) {
    const p = popAt(a, '<h6>Cảnh báo tiến độ</h6><div class="skel" style="height:60px"></div>');
    try {
      const d = await rpc('dashboard');
      const items = d.canhBao.filter(s => s.canh_bao);
      p.innerHTML = '<h6>Cảnh báo tiến độ · ' + items.length + '</h6>' + (items.length ? items.map(s => '<div class="al ' + (s.canh_bao === 'tre' ? '' : 'wn') + '" data-go="don/' + s.id + '"><b>' + esc(s.id) + '</b> · ' + esc(s.khach_ten) + ' (' + esc(s.bo_phan) + ')<br><span class="sm">' + (s.canh_bao === 'tre' ? 'Trễ hẹn ' : 'Sát hạn — còn ') + fmt.dur(new Date(s.hen_giao) - Date.now()) + ' · đang ở ' + esc(s.buoc_hien) + '</span></div>').join('') : '<div class="empty">' + ic('check-circle', 22) + '<br>Không có đơn trễ hay sát hạn</div>');
    } catch (e) { p.innerHTML = '<div class="err-box">' + esc(e.message) + '</div>'; }
  }
  async function refreshBadges() {
    if (!S.user || S.mode == null) return;
    try {
      const d = await rpc('dashboard');
      const n = d.kpi.tre + d.kpi.sat_han;
      const b = $('#tb-bell-n'); if (b) { b.textContent = n; b.classList.toggle('hidden', !n); }
      const set = (id, v) => { const e = $('[data-cnt="' + id + '"]'); if (e) { e.textContent = v; e.classList.toggle('hidden', !v); } };
      set('tram', d.kpi.dang_xu_ly); set('giao', d.kpi.cho_giao + d.kpi.cho_ky);
      S.lastDash = d;
    } catch (e) {}
  }
  function setHead(title, sub, back) {
    document.title = title + ' · ' + CONFIG.company.ten;
    const t = $('#tb-title'); if (t) t.textContent = title;
    const s = $('#tb-sub'); if (s) s.textContent = sub || '';
    const b = $('#tb-back'); if (b) b.classList.toggle('show', !!back);
  }
  function pageHead(title, sub, act) {
    return '<div class="ml-pagehead"><div class="ml-ph-row"><div class="ml-ph-text"><h1 class="ml-ph-title">' + esc(title) + '</h1>' + (sub ? '<div class="ml-ph-sub">' + sub + '</div>' : '') + '</div><div class="ml-ph-act">' + (act || '') + '</div></div></div>';
  }

  // ---------- Router ----------
  let routeSeq = 0;
  async function route() {
    const seq = ++routeSeq;
    S.timers.filter(t => t.screen).forEach(t => clearInterval(t.id));
    S.timers = S.timers.filter(t => !t.screen);
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    // Trang công khai: khách ký qua link
    if (parts[0] === 'ky') { document.body.innerHTML = '<div id="pub" class="pub"></div>'; return SCREENS.ky.render($('#pub'), parts.slice(1)); }
    if (!S.user) { return renderLogin(); }
    shell();
    const id = parts[0] || homeFor(S.user);
    const scr = SCREENS[id];
    if (!scr || !canSee(id)) { go(homeFor(S.user)); return; }
    $$('#side .sd-item').forEach(el => el.classList.toggle('active', el.getAttribute('data-go') === id));
    $$('.bnav .bn').forEach(el => el.classList.toggle('on', el.getAttribute('data-go') === id));
    const main = $('#main');
    main.innerHTML = '<div class="skel" style="height:80px;margin-bottom:14px"></div><div class="skel" style="height:260px"></div>';
    window.scrollTo(0, 0);
    try {
      await loadDm();
      if (seq !== routeSeq) return;
      await scr.render(main, parts.slice(1), { isCurrent: () => seq === routeSeq });
    } catch (e) {
      if (seq !== routeSeq) return;
      main.innerHTML = '<div class="card"><div class="err-box">' + esc(e.message) + '</div><button class="og-repeat" onclick="location.reload()">' + ic('refresh-cw') + ' Tải lại</button></div>';
    }
  }
  function every(ms, fn) { const id = setInterval(fn, ms); S.timers.push({ id, screen: true }); }

  // ---------- Đăng nhập ----------
  function renderLogin() {
    document.body.innerHTML = '';
    const el = document.createElement('div'); el.className = 'login';
    const demo = S.mode === 'demo';
    el.innerHTML = '<div class="lg-brand"><div class="lg-logo"><img src="ui/dotn_logo.png" alt=""></div><div class="lg-name">' + esc(CONFIG.company.ten) + '</div>' +
      '<div class="lg-h">Một hệ thống cho cả xưởng giặt</div>' +
      '<div class="lg-v"><span class="ic">' + ic('clipboard-list', 18) + '</span><div><b>Nhận đơn số hoá</b><br>Đếm từng loại theo cái, cân tổng kg — thay phiếu giấy.</div></div>' +
      '<div class="lg-v"><span class="ic">' + ic('layers', 18) + '</span><div><b>Theo dõi từng công đoạn</b><br>Phân loại → giặt → sấy → ủi → QC → đóng gói, ai làm, bao lâu, hao hụt bao nhiêu.</div></div>' +
      '<div class="lg-v"><span class="ic">' + ic('pencil', 18) + '</span><div><b>Giao hàng ký điện tử</b><br>Khách ký ngay trên điện thoại tài xế hoặc qua link.</div></div></div>' +
      '<div class="lg-form"><form class="lg-card" id="lg-f"><h2>Đăng nhập</h2><p class="muted" style="margin:4px 0 18px">Dùng mã nhân viên và PIN do quản lý cấp.</p><div id="lg-err"></div>' +
      '<div class="fg"><label for="lg-ma">Mã nhân viên</label><input class="inp" id="lg-ma" autocomplete="username" autocapitalize="characters" placeholder="VD: QL01"></div>' +
      '<div class="fg"><label for="lg-pin">PIN</label><input class="inp" id="lg-pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••"></div>' +
      '<button class="btn btn-brand" id="lg-btn" type="submit">Đăng nhập</button>' +
      (demo ? '<div class="demo-acc"><div class="lbl" style="margin-bottom:8px">Tài khoản demo — bấm để vào nhanh</div>' +
        [['QL01', '1234', 'Quản lý — xem toàn bộ'], ['ND01', '1111', 'Nhận đơn'], ['SX02', '3333', 'Sản xuất — Giặt/Sấy'], ['SX03', '4444', 'Sản xuất — Ủi/QC/Đóng gói'], ['GH01', '5555', 'Giao hàng']]
          .map(a => '<button type="button" data-ma="' + a[0] + '" data-pin="' + a[1] + '">' + ic('users', 15) + ' ' + a[2] + '<code>' + a[0] + ' · ' + a[1] + '</code></button>').join('') + '</div>' : '') +
      '<div class="sm muted" style="text-align:center;margin-top:14px">Vận hành bởi DotnAI · ' + CONFIG.version + '</div></form></div>';
    document.body.appendChild(el);
    document.title = 'Đăng nhập · ' + CONFIG.company.ten;
    const doLogin = async (ma, pin) => {
      const btn = $('#lg-btn'); btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
      try {
        const r = await rpc('login', ma, pin);
        if (!r.ok) throw new Error(r.msg);
        S.user = { maNV: r.maNV, ten: r.ten, vaiTro: r.vaiTro, congDoan: r.congDoan || [] }; S.token = r.token || null;
        saveSession();
        location.hash = '#/' + homeFor(S.user);
        route();
      } catch (e) {
        $('#lg-err').innerHTML = '<div class="err-box">' + esc(e.message) + '</div>';
        btn.disabled = false; btn.textContent = 'Đăng nhập';
      }
    };
    $('#lg-f').onsubmit = e => { e.preventDefault(); doLogin($('#lg-ma').value, $('#lg-pin').value); };
    $$('[data-ma]', el).forEach(b => b.onclick = () => { $('#lg-ma').value = b.dataset.ma; $('#lg-pin').value = b.dataset.pin; doLogin(b.dataset.ma, b.dataset.pin); });
  }

  // ---------- Chữ ký ----------
  function sigPad(wrap) {
    wrap.innerHTML = '<div class="sig-wrap"><canvas></canvas><div class="line"></div><div class="ph">Ký tên vào đây</div></div><div class="sig-tools"><span>Dùng ngón tay hoặc bút</span><button type="button" class="og-repeat sm" data-clr>' + ic('refresh-cw', 14) + ' Ký lại</button></div>';
    const cv = wrap.querySelector('canvas'), ph = wrap.querySelector('.ph');
    const ctx = cv.getContext('2d');
    let dirty = false, drawing = false, last = null, pts = 0;
    function size() {
      const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      const data = dirty ? cv.toDataURL() : null;
      cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d2b6b'; ctx.lineWidth = 2.4;
      if (data) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = data; }
    }
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); ph.style.display = 'none'; ctx.beginPath(); ctx.arc(last.x, last.y, 1.1, 0, Math.PI * 2); ctx.fillStyle = '#1d2b6b'; ctx.fill(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; pts++; if (pts > 8) dirty = true; });
    const end = () => { drawing = false; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    wrap.querySelector('[data-clr]').onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); dirty = false; pts = 0; ph.style.display = ''; };
    setTimeout(size, 0);
    window.addEventListener('resize', size);
    return {
      isEmpty: () => !dirty,
      toDataURL() {
        // Xuất PNG thu nhỏ (rộng ≤ 600px) để nhẹ DB
        const w = Math.min(600, cv.width), h = Math.round(cv.height * w / cv.width);
        const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
        c2.getContext('2d').drawImage(cv, 0, 0, w, h);
        return c2.toDataURL('image/png');
      }
    };
  }

  // ---------- Phiếu giao nhận (bản in) ----------
  function paperHtml(pg) {
    const C = CONFIG.company;
    const rows = pg.dong || [];
    const half = Math.max(11, Math.ceil(rows.length / 2));
    const L = [], R = [];
    for (let i = 0; i < half; i++) { L.push(rows[i] || null); R.push(rows[half + i] || null); }
    const cell = (r, i) => r ? '<td class="c">' + (i + 1) + '</td><td>' + esc(r.ten) + '</td><td class="c">' + fmt.n(r.giao) + '</td><td class="c" style="' + (r.thieu ? 'color:#D64545;font-weight:700' : '') + '">' + (r.thieu ? fmt.n(r.thieu) : '') + '</td>' : '<td class="c">' + (i + 1) + '</td><td></td><td></td><td></td>';
    let tb = '';
    for (let i = 0; i < half; i++) tb += '<tr>' + cell(L[i], i) + cell(R[i], half + i) + '</tr>';
    const tongGiao = rows.reduce((s, r) => s + (Number(r.giao) || 0), 0), tongThieu = rows.reduce((s, r) => s + (Number(r.thieu) || 0), 0);
    return '<div class="paper"><div class="pp-hd"><div class="pp-logo">' + esc(C.ten.split(' ')[0]) + ' ' + esc(C.ten.split(' ')[1] || '') + '<small>Laundry</small></div>' +
      '<div class="pp-co"><b>' + esc(C.phap_nhan) + '</b><br>ĐC: ' + esc(C.dia_chi) + ' · ĐT: ' + esc(C.sdt) + '<br>Website: ' + esc(C.web) + '</div>' +
      '<div class="pp-no">Số phiếu<b>' + esc(pg.id.replace('PG-', '')) + '</b></div></div>' +
      '<div class="pp-ttl">PHIẾU GIAO NHẬN</div>' +
      '<div class="pp-meta"><div><span>Tên khách hàng:</span> <b>' + esc(pg.khach_ten) + '</b></div><div><span>Nhóm khách (bộ phận):</span> <b>' + esc(pg.bo_phan || '') + '</b></div>' +
      '<div><span>Ngày, giờ giao hàng:</span> <b>' + fmt.dt(pg.ky_luc || pg.tao_luc) + ' ' + (new Date(pg.ky_luc || pg.tao_luc).getFullYear()) + '</b></div><div><span>Mã đơn:</span> <b>' + esc(pg.don_id) + '</b> · nhận ' + fmt.dt(pg.ngay_nhan) + '</div></div>' +
      '<div class="pp-tw"><table class="pp-tbl"><thead><tr><th>Stt</th><th>Tên hàng hoá</th><th>Số lượng (cái)</th><th>SL hàng thiếu</th><th>Stt</th><th>Tên hàng hoá</th><th>Số lượng (cái)</th><th>SL hàng thiếu</th></tr></thead><tbody>' + tb + '</tbody></table></div>' +
      '<div class="pp-tot">Tổng số lượng giao: ' + fmt.n(tongGiao) + ' cái' + (tongThieu ? ' · thiếu ' + fmt.n(tongThieu) + ' cái' : '') + ' &nbsp;·&nbsp; Tổng khối lượng hàng hoá: ' + fmt.kg(pg.kg) + ' kg' + (pg.so_kien ? ' · ' + fmt.n(pg.so_kien) + ' kiện' : '') + '</div>' +
      (pg.ghi_chu ? '<div style="font-size:13px"><b>Ghi chú:</b> ' + esc(pg.ghi_chu) + '</div>' : '') +
      '<div class="pp-sig"><div><b>Lập phiếu</b><i>(Ký, ghi rõ họ tên)</i><div class="s"></div>Hệ thống</div><div><b>Giao nhận</b><i>(Ký, ghi rõ họ tên)</i><div class="s"></div>' + esc(pg.tai_xe_ten || '') + '</div>' +
      '<div><b>Bên nhận</b><i>(Ký, ghi rõ họ tên)</i><div class="s">' + (pg.chu_ky ? '<img src="' + esc(pg.chu_ky) + '" alt="Chữ ký">' : '<span class="pill wn">Chưa ký</span>') + '</div>' + esc(pg.nguoi_nhan || '') + '</div></div>' +
      (pg.ky_luc ? '<div class="pp-foot">Ký điện tử lúc ' + fmt.dt(pg.ky_luc) + ' ' + new Date(pg.ky_luc).getFullYear() + (pg.ky_ip && pg.ky_ip !== 'tai-cho' ? ' · qua link (IP ' + esc(pg.ky_ip) + ')' : ' · tại chỗ trên thiết bị giao hàng') + ' · mã phiếu ' + esc(pg.id) + '</div>' : '') + '</div>';
  }

  // ---------- Biểu đồ cột nhóm (SVG) ----------
  function barChart(days, keys, colors, labels) {
    const W = 760, H = 230, pl = 40, pr = 8, pt = 14, pb = 26;
    const max = Math.max(10, ...days.map(d => Math.max(...keys.map(k => d[k] || 0))));
    const nice = (() => { const p = Math.pow(10, Math.floor(Math.log10(max))); const m = max / p; return (m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; })();
    const gw = (W - pl - pr) / days.length, bw = Math.min(14, (gw - 6) / keys.length);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ kg nhận và giao 14 ngày">';
    for (let i = 0; i <= 3; i++) { const y = pt + (H - pt - pb) * i / 3; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="var(--chart-grid)" stroke-width="1" ' + (i < 3 ? 'stroke-dasharray="3 4"' : '') + '/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--chart-axis)">' + nf.format(Math.round(nice * (3 - i) / 3)) + '</text>'; }
    days.forEach((d, i) => {
      const x0 = pl + gw * i + (gw - bw * keys.length - 2) / 2;
      keys.forEach((k, j) => {
        const v = d[k] || 0, hh = (H - pt - pb) * v / nice, y = H - pb - hh;
        s += '<rect x="' + (x0 + j * (bw + 2)) + '" y="' + y + '" width="' + bw + '" height="' + Math.max(0, hh) + '" rx="3" fill="' + colors[j] + '"><title>' + d.ngay.slice(8) + '/' + d.ngay.slice(5, 7) + ' · ' + labels[j] + ': ' + nf1.format(v) + ' kg</title></rect>';
      });
      if (i % 2 === (days.length - 1) % 2) s += '<text x="' + (pl + gw * i + gw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--chart-axis)">' + d.ngay.slice(8) + '/' + d.ngay.slice(5, 7) + '</text>';
    });
    return s + '</svg>';
  }

  // ---------- Khởi động ----------
  async function boot() {
    document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;color:var(--ink4)">Đang tải…</div>';
    await detectMode();
    if (S.mode === 'demo') await LCore.seedIfEmpty(demoStore);
    loadSession();
    window.addEventListener('hashchange', route);
    document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); } });
    route();
  }

  window.App = { CONFIG, S, $, $$, esc, ic, dn, fmt, ttPill, miniSteps, stepState, toast, modal, confirmBox, rpc, loadDm, go, setHead, pageHead, SCREENS, every, sigPad, paperHtml, barChart, refreshBadges, nf };
  document.addEventListener('DOMContentLoaded', boot);
})();
