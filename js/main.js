/* ══════════════════════════════════════
   Main JS — data loading & interactions
   ══════════════════════════════════════ */

(function () {
  'use strict';

  // ── Scroll → sticky header shadow ──
  const header = document.getElementById('top');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Mobile menu ──
  const menuBtn = document.getElementById('menuBtn');
  const navlinks = document.getElementById('navlinks');
  if (menuBtn && navlinks) {
    menuBtn.addEventListener('click', () => navlinks.classList.toggle('open'));
    navlinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navlinks.classList.remove('open'))
    );
  }

  // ── CV print ──
  document.querySelectorAll('[data-print]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); window.print(); })
  );
  window.addEventListener('beforeprint', () =>
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'))
  );

  // ── Reveal on scroll ──
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  // ── Active nav link highlighting ──
  const navLinksMap = {};
  document.querySelectorAll('.navlinks a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if (id) navLinksMap[id] = a;
  });

  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const a = navLinksMap[e.target.id];
      if (a && e.isIntersecting) {
        Object.values(navLinksMap).forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll('.section[id]').forEach(s => {
    if (navLinksMap[s.id]) navIO.observe(s);
  });

  // ── Publication rendering helpers ──
  function highlightAuthor(authors, ownerName) {
    return authors.replace(
      new RegExp(`(${ownerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
      '<span class="me">$1</span>'
    );
  }

  function renderPub(pub, idx, ownerName, showIdx) {
    const noteHtml = pub.note ? ` <span class="note">(${pub.note})</span>` : '';
    const linkHtml = pub.link
      ? ` <span class="pub-links"><a href="${pub.link}" target="_blank" rel="noopener">PDF</a></span>`
      : '';

    const idxHtml = showIdx ? `<div class="idx">[${idx}]</div>` : '';
    const gridClass = showIdx ? 'pub' : 'pub pub-flat';

    return `<div class="${gridClass}">
      ${idxHtml}
      <div class="body">
        ${highlightAuthor(pub.authors, ownerName)}.
        <span class="title">"${pub.title}."</span>
        <span class="venue">${pub.venue}</span>, ${pub.year}.${noteHtml}${linkHtml}
      </div>
    </div>`;
  }

  // ── Load publications (main page — featured only) ──
  const pubContainer = document.getElementById('pub-list');
  if (pubContainer) {
    const basePath = pubContainer.dataset.basePath || '.';
    fetch(`${basePath}/data/publications.json`)
      .then(r => r.json())
      .then(data => {
        const featured = data.publications.filter(p => p.featured);
        let html = '';

        featured.forEach(pub => {
          html += renderPub(pub, 0, data.ownerName, false);
        });

        pubContainer.innerHTML = html;
      })
      .catch(() => {
        pubContainer.innerHTML = '<p style="color:var(--ink-3)">Failed to load publications.</p>';
      });
  }

  // ── Load research projects ──
  const projContainer = document.getElementById('project-list');
  if (projContainer) {
    const basePath = projContainer.dataset.basePath || '.';
    fetch(`${basePath}/data/projects.json`)
      .then(r => r.json())
      .then(data => {
        let html = '';
        data.projects.forEach(proj => {
          const descHtml = proj.description
            ? `<p class="project-desc">${proj.description}</p>`
            : '';
          html += `<div class="project-item">
            <div class="project-header">
              <h4>${proj.title}</h4>
              <span class="project-period">${proj.period}</span>
            </div>
            <div class="project-meta">
              <span class="role-badge">${proj.role}</span>
              ${proj.funder}
            </div>
            ${descHtml}
          </div>`;
        });
        projContainer.innerHTML = html;
      })
      .catch(() => {
        projContainer.innerHTML = '<p style="color:var(--ink-3)">Failed to load projects.</p>';
      });
  }

  // ── Load professional services ──
  const svcContainer = document.getElementById('service-list');
  if (svcContainer) {
    const basePath = svcContainer.dataset.basePath || '.';
    fetch(`${basePath}/data/services.json`)
      .then(r => r.json())
      .then(data => {
        let html = '';
        (data.groups || []).forEach(group => {
          html += `<h3 class="service-sub">${group.category}</h3>`;
          html += '<ul class="cv-list">';
          (group.items || []).forEach(item => {
            const detailHtml = item.detail ? `<p>${item.detail}</p>` : '';
            html += `<li><span class="when">${item.when}</span><div class="what"><h4>${item.title}</h4>${detailHtml}</div></li>`;
          });
          html += '</ul>';
        });
        svcContainer.innerHTML = html;
      })
      .catch(() => {
        svcContainer.innerHTML = '<p style="color:var(--ink-3)">Failed to load services.</p>';
      });
  }

  // ── Re-observe reveals after dynamic content loads ──
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => revealIO.observe(el));
  }, 500);
})();
