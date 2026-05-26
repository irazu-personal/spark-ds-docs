document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('iconGrid');
  var searchInput = document.getElementById('iconSearch');
  var searchCount = document.getElementById('iconSearchCount');
  var sizeButtons = document.querySelectorAll('[data-icon-size]');

  if (!grid) return;

  var currentSize = 'medium';
  var allNames = [];
  var cards = [];

  function iconPath(name, size) {
    return 'assets/icons/' + name + '-' + size + '.svg';
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
    img.width = currentSize === 'medium' ? 24 : 16;
    img.height = currentSize === 'medium' ? 24 : 16;
    img.loading = 'lazy';
    img.decoding = 'async';
    preview.appendChild(img);

    var label = document.createElement('span');
    label.className = 'icon-card-name';
    label.textContent = name;

    var actions = document.createElement('div');
    actions.className = 'icon-card-actions';

    var mediumLink = document.createElement('a');
    mediumLink.href = iconPath(name, 'medium');
    mediumLink.download = name + '-medium.svg';
    mediumLink.textContent = 'Medium';
    mediumLink.setAttribute('aria-label', 'Download ' + name + ' medium SVG');

    var smallLink = document.createElement('a');
    smallLink.href = iconPath(name, 'small');
    smallLink.download = name + '-small.svg';
    smallLink.textContent = 'Small';
    smallLink.setAttribute('aria-label', 'Download ' + name + ' small SVG');

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('data-copy', iconPath(name, currentSize));
    copyBtn.setAttribute('aria-label', 'Copy path for ' + name + ' ' + currentSize);
    copyBtn.textContent = 'Copy path';

    actions.appendChild(mediumLink);
    actions.appendChild(smallLink);
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
      img.width = currentSize === 'medium' ? 24 : 16;
      img.height = currentSize === 'medium' ? 24 : 16;
      var copyBtn = card.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.setAttribute('data-copy', iconPath(name, currentSize));
      }
    });
    grid.setAttribute('data-size', currentSize);
  }

  function filterIcons(query) {
    var q = query.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (card) {
      var name = card.getAttribute('data-icon-name') || '';
      var show = !q || name.indexOf(q) !== -1;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (searchCount) {
      searchCount.textContent = visible + ' of ' + allNames.length + ' icons';
    }
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
      grid.innerHTML = '';
      allNames.forEach(function (name) {
        var card = renderCard(name);
        cards.push(card);
        grid.appendChild(card);
      });
      filterIcons(searchInput ? searchInput.value : '');
    })
    .catch(function () {
      grid.innerHTML = '<p class="icon-empty-state">Could not load the icon manifest. SVG files are still available under <code>assets/icons/</code> in the repository.</p>';
      if (searchCount) searchCount.textContent = '';
    });
});
