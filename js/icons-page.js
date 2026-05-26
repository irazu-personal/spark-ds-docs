document.addEventListener('DOMContentLoaded', function () {
  var gallery = document.getElementById('iconGallery');
  var searchInput = document.getElementById('iconSearch');
  var searchCount = document.getElementById('iconSearchCount');
  var sizeButtons = document.querySelectorAll('[data-icon-size]');

  if (!gallery) return;

  var currentSize = 'medium';
  var allNames = [];
  var cards = [];
  var groupSections = [];

  function iconPath(name, size) {
    return 'assets/icons/' + name + '-' + size + '.svg';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightName(name, query) {
    var q = query.trim();
    if (!q) return escapeHtml(name);
    var re = new RegExp('(' + escapeRegExp(q) + ')', 'gi');
    return name.split(re).map(function (part, i) {
      if (i % 2 === 1) {
        return '<mark class="icon-name-highlight">' + escapeHtml(part) + '</mark>';
      }
      return escapeHtml(part);
    }).join('');
  }

  function updateCardNameHighlights(query) {
    cards.forEach(function (card) {
      var label = card.querySelector('.icon-card-name');
      var name = card.getAttribute('data-icon-name') || '';
      if (label) label.innerHTML = highlightName(name, query);
    });
  }

  function renderCard(name) {
    var article = document.createElement('article');
    article.className = 'icon-card';
    article.setAttribute('data-icon-name', name);

    var preview = document.createElement('div');
    preview.className = 'icon-card-preview';
    var img = document.createElement('img');
    img.src = iconPath(name, currentSize);
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    preview.appendChild(img);

    var label = document.createElement('span');
    label.className = 'icon-card-name';
    label.textContent = name;

    var actions = document.createElement('div');
    actions.className = 'icon-card-actions';

    var downloadLink = document.createElement('a');
    downloadLink.className = 'icon-card-download';
    downloadLink.href = iconPath(name, currentSize);
    downloadLink.download = name + '-' + currentSize + '.svg';
    downloadLink.textContent = 'Download';
    downloadLink.setAttribute('aria-label', 'Download ' + name + ' ' + currentSize + ' SVG');

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('data-copy', iconPath(name, currentSize));
    copyBtn.setAttribute('aria-label', 'Copy path for ' + name + ' ' + currentSize);
    copyBtn.textContent = 'Copy path';

    actions.appendChild(downloadLink);
    actions.appendChild(copyBtn);

    article.appendChild(preview);
    article.appendChild(label);
    article.appendChild(actions);
    return article;
  }

  function updatePreviews() {
    cards.forEach(function (card) {
      var name = card.getAttribute('data-icon-name');
      var img = card.querySelector('img');
      if (!img) return;
      img.src = iconPath(name, currentSize);
      var downloadLink = card.querySelector('.icon-card-download');
      if (downloadLink) {
        downloadLink.href = iconPath(name, currentSize);
        downloadLink.download = name + '-' + currentSize + '.svg';
        downloadLink.setAttribute('aria-label', 'Download ' + name + ' ' + currentSize + ' SVG');
      }
      var copyBtn = card.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.setAttribute('data-copy', iconPath(name, currentSize));
        copyBtn.setAttribute('aria-label', 'Copy path for ' + name + ' ' + currentSize);
      }
    });
    gallery.querySelectorAll('.icon-grid').forEach(function (grid) {
      grid.setAttribute('data-size', currentSize);
    });
  }

  function filterIcons(query) {
    var raw = query == null ? '' : String(query);
    var q = raw.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (card) {
      var name = card.getAttribute('data-icon-name') || '';
      var show = !q || name.indexOf(q) !== -1;
      card.hidden = !show;
      if (show) visible += 1;
    });
    groupSections.forEach(function (section) {
      var visibleInGroup = section.querySelectorAll('.icon-card:not([hidden])').length;
      section.hidden = visibleInGroup === 0;
    });
    if (searchCount) {
      searchCount.textContent = visible + ' of ' + allNames.length + ' icons';
    }
    updateCardNameHighlights(raw);
  }

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentSize = btn.getAttribute('data-icon-size') || 'medium';
      sizeButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      updatePreviews();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterIcons(searchInput.value);
    });
  }

  fetch('assets/icons/manifest.json')
    .then(function (res) {
      if (!res.ok) throw new Error('manifest fetch failed');
      return res.json();
    })
    .then(function (data) {
      allNames = data.icons || [];
      var groups = data.groups;
      gallery.innerHTML = '';

      if (!groups || !groups.length) {
        groups = [{ id: 'all', title: 'All icons', icons: allNames }];
      }

      groups.forEach(function (group) {
        var section = document.createElement('section');
        section.className = 'icon-group';
        section.setAttribute('data-group-id', group.id);

        var heading = document.createElement('h3');
        heading.className = 'icon-group-title';
        heading.textContent = group.title;
        section.appendChild(heading);

        var grid = document.createElement('div');
        grid.className = 'icon-grid';
        grid.setAttribute('data-size', currentSize);

        (group.icons || []).forEach(function (name) {
          var card = renderCard(name);
          cards.push(card);
          grid.appendChild(card);
        });

        section.appendChild(grid);
        groupSections.push(section);
        gallery.appendChild(section);
      });

      filterIcons(searchInput ? searchInput.value : '');
    })
    .catch(function () {
      gallery.innerHTML =
        '<p class="icon-empty-state">Could not load the icon manifest. SVG files are still available under <code>assets/icons/</code> in the repository.</p>';
      if (searchCount) searchCount.textContent = '';
    });
});
