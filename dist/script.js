(() => {
  const ja = document.documentElement.lang === 'ja';
  // Only low-cardinality, non-personal event properties enter analytics.
  window.va = window.va || function (...args) { (window.vaq = window.vaq || []).push(args); };
  window.si = window.si || function (...args) { (window.siq = window.siq || []).push(args); };
  const track = (name, data = {}) => {
    if (document.documentElement.dataset.eventsEnabled === 'true') window.va('event', { name, data: { language: ja ? 'ja' : 'en', ...data } });
  };
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  function closeMenu(returnFocus = false) {
    if (!toggle || !menu) return;
    menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', ja ? 'メニューを開く' : 'Open menu');
    if (returnFocus) toggle.focus();
  }
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? (ja ? 'メニューを閉じる' : 'Close menu') : (ja ? 'メニューを開く' : 'Open menu'));
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu?.hidden) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
  menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  document.querySelectorAll('[data-event]').forEach(link => link.addEventListener('click', () => {
    const data = {};
    for (const key of ['project','member','language']) if (link.dataset[key]) data[key] = link.dataset[key];
    track(link.dataset.event, data);
  }));
  document.querySelectorAll('.languages a').forEach(link => link.addEventListener('click', () => track('Language Changed', { to: link.lang })));
  const filters = document.querySelector('.filters');
  const cards = [...document.querySelectorAll('[data-categories]')];
  if (filters) {
    filters.hidden = false;
    const count = document.querySelector('.filter-count');
    const filter = value => {
      let shown = 0;
      cards.forEach(card => { card.hidden = value !== 'all' && !card.dataset.categories.split(' ').includes(value); if (!card.hidden) shown++; });
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
      count.textContent = ja ? `${shown}件の実績` : `${shown} selected projects`;
    };
    filters.addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (button) filter(button.dataset.filter); });
    filter('all');
  }
  const form = document.querySelector('#contact-form');
  if (form) {
    let started = false;
    form.addEventListener('input', () => { if (!started) { started = true; track('Contact Started'); } });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      const status = document.querySelector('#form-status');
      const old = button.textContent;
      button.disabled = true; form.setAttribute('aria-busy','true');
      status.textContent = ja ? '送信しています…' : 'Sending your inquiry…'; status.dataset.state = 'pending';
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(Object.fromEntries(new FormData(form))), signal:controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error('delivery');
        status.textContent = ja ? 'お問い合わせを受け付けました。内容を確認し、ご記入のメールアドレスへご連絡します。' : 'Thank you. We’ve received your project inquiry. We’ll review the context you shared and get back to you at the email provided.';
        status.dataset.state = 'success'; track('Contact Submitted'); form.reset(); started = false;
      } catch {
        status.textContent = ja ? '送信を確認できませんでした。入力内容は残っています。再度お試しいただくか、dotwave.creative@gmail.comへ直接ご連絡ください。' : 'We couldn’t confirm delivery. Your details are still here. Please try again or email dotwave.creative@gmail.com directly.';
        status.dataset.state = 'error';
      } finally { clearTimeout(timeout); button.disabled = false; button.textContent = old; form.removeAttribute('aria-busy'); status.focus(); }
    });
  }
})();
