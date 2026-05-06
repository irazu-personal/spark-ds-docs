document.addEventListener('DOMContentLoaded', function () {

  // Sidebar toggle (mobile)
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.querySelector('.sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      var isOpen = sidebar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Token search/filter
  var searchInput = document.getElementById('tokenSearch');
  var searchCount = document.getElementById('searchCount');

  if (searchInput) {
    var allRows = document.querySelectorAll('.token-table tbody tr[data-token-name]');
    var totalCount = allRows.length;

    if (searchCount && totalCount > 0) {
      searchCount.textContent = totalCount + ' tokens';
    }

    searchInput.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();
      var visible = 0;

      allRows.forEach(function (row) {
        var tokenName = (row.getAttribute('data-token-name') || '').toLowerCase();
        var textContent = row.textContent.toLowerCase();
        var match = !query || tokenName.indexOf(query) !== -1 || textContent.indexOf(query) !== -1;

        row.classList.toggle('hidden', !match);
        if (match) visible++;
      });

      if (searchCount) {
        if (!query) {
          searchCount.textContent = totalCount + ' tokens';
        } else {
          searchCount.textContent = visible + ' of ' + totalCount + ' tokens';
        }
      }
    });
  }

  // Copy to clipboard
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;

    var text = btn.getAttribute('data-copy');
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopied(btn);
      });
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (err) { /* noop */ }
      document.body.removeChild(textarea);
      showCopied(btn);
    }
  });

  function showCopied(btn) {
    btn.classList.add('copied');
    var originalLabel = btn.getAttribute('aria-label');
    btn.setAttribute('aria-label', 'Copied!');

    setTimeout(function () {
      btn.classList.remove('copied');
      btn.setAttribute('aria-label', originalLabel);
    }, 1500);
  }

});
