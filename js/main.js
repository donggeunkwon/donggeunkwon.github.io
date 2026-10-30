/* Minimal CV — publication updates and complete CV printing. */
(function () {
  'use strict';

  let savedDetails = null;
  let pendingPublications = null;
  let pendingProjects = null;

  function prepareForPrint() {
    if (savedDetails !== null) return;
    savedDetails = Array.from(document.querySelectorAll('details'), detail => ({
      detail,
      wasOpen: detail.open
    }));
    savedDetails.forEach(({ detail }) => { detail.open = true; });
  }

  function restoreAfterPrint() {
    if (savedDetails === null) return;
    savedDetails.forEach(({ detail, wasOpen }) => { detail.open = wasOpen; });
    savedDetails = null;
    if (pendingPublications !== null) {
      const data = pendingPublications;
      pendingPublications = null;
      renderPublications(data);
    }
    if (pendingProjects !== null) {
      const data = pendingProjects;
      pendingProjects = null;
      renderProjects(data);
    }
  }

  const printButton = document.getElementById('print-cv');
  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }
  window.addEventListener('beforeprint', prepareForPrint);
  window.addEventListener('afterprint', restoreAfterPrint);

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function appendAuthors(container, authors, ownerName) {
    if (!ownerName || !authors.includes(ownerName)) {
      container.textContent = authors;
      return;
    }
    const parts = authors.split(ownerName);
    parts.forEach((part, index) => {
      if (index > 0) container.appendChild(element('strong', '', ownerName));
      container.appendChild(document.createTextNode(part));
    });
  }

  function paperLink(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      const link = element('a', 'paper-link', 'Paper ↗');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    } catch (_) {
      return null;
    }
  }

  function publicationRow(publication, ownerName) {
    const row = element('li', 'cv-row publication');
    row.appendChild(element('span', 'date', String(publication.year)));
    const body = element('div');
    body.appendChild(element('h3', '', publication.title));

    if (typeof publication.authors === 'string' && publication.authors.trim()) {
      const authors = element('p', 'authors');
      appendAuthors(authors, publication.authors, ownerName);
      body.appendChild(authors);
    }

    const metadata = element('p', 'meta');
    const notes = [publication.venue];
    if (typeof publication.note === 'string' && publication.note.trim()) {
      notes.push(publication.note);
    }
    metadata.textContent = notes.join(' · ');
    const link = paperLink(publication.link);
    if (link) {
      metadata.appendChild(document.createTextNode(' · '));
      metadata.appendChild(link);
    }
    body.appendChild(metadata);
    row.appendChild(body);
    return row;
  }

  function renderPublications(data) {
    const list = document.getElementById('publication-list');
    if (!list || !data || !Array.isArray(data.publications)) return;
    const publications = data.publications.filter(publication =>
      publication && publication.featured === true);
    if (!publications.every(publication =>
          Number.isInteger(publication.year) &&
          typeof publication.title === 'string' &&
          typeof publication.venue === 'string')) return;

    // Preserve the open print document until the print dialog has closed.
    if (savedDetails !== null) {
      pendingPublications = data;
      return;
    }

    publications.sort((a, b) => b.year - a.year);
    const ownerName = typeof data.ownerName === 'string' ? data.ownerName : '';
    const fragment = document.createDocumentFragment();
    publications.forEach(publication => fragment.appendChild(publicationRow(publication, ownerName)));
    list.replaceChildren(fragment);
  }

  function projectRow(project) {
    const row = element('li', 'cv-row project');
    row.appendChild(element('span', 'date', project.period));
    const body = element('div');
    body.appendChild(element('h3', '', project.title));
    const metadata = [project.funder, project.role].filter(Boolean).join(' · ');
    if (metadata) body.appendChild(element('p', 'meta', metadata));
    row.appendChild(body);
    return row;
  }

  function renderProjects(data) {
    const list = document.getElementById('project-list');
    if (!list || !data || !Array.isArray(data.projects) ||
        !data.projects.every(project => project &&
          typeof project.period === 'string' &&
          typeof project.title === 'string' &&
          (project.funder == null || typeof project.funder === 'string') &&
          (project.role == null || typeof project.role === 'string'))) return;
    if (savedDetails !== null) {
      pendingProjects = data;
      return;
    }
    const fragment = document.createDocumentFragment();
    data.projects.forEach(project => fragment.appendChild(projectRow(project)));
    list.replaceChildren(fragment);
  }

  function loadData(path, render) {
    const url = new URL(path, window.location.href);
    if (url.origin !== window.location.origin) return;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(response => {
        if (!response.ok) throw new Error('CV data unavailable');
        return response.json();
      })
      .then(render)
      .catch(() => { /* Keep the static CV available. */ });
  }

  // Static selected publications and project records work offline and remain
  // available when hosted JSON updates cannot be retrieved.
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    if (document.getElementById('publication-list')) {
      loadData('data/publications.json', renderPublications);
    }
    if (document.getElementById('project-list')) {
      loadData('data/projects.json', renderProjects);
    }
  }
})();
