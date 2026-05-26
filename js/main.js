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

  function copyTextFallback(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) { /* noop */ }
    document.body.removeChild(textarea);
  }

  // Copy to clipboard (Clipboard API may reject on file:// or without permission)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;

    var text = btn.getAttribute('data-copy');
    if (!text) return;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        showCopied(btn);
      }).catch(function () {
        copyTextFallback(text);
        showCopied(btn);
      });
    } else {
      copyTextFallback(text);
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

  // Modal demo (modal.html)
  var modalDemo = document.getElementById('modalDemo');
  var modalOpenBtn = document.getElementById('modalOpenBtn');

  if (modalDemo && modalOpenBtn) {
    var modalOverlay = document.getElementById('modalOverlay');
    var lastFocusedBeforeModal = null;

    function openModal() {
      lastFocusedBeforeModal = document.activeElement;
      modalDemo.setAttribute('data-open', '');
      modalDemo.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var searchInput = modalDemo.querySelector('#demo-modal-search');
      if (searchInput) {
        searchInput.focus();
      }
    }

    function closeModal() {
      modalDemo.removeAttribute('data-open');
      modalDemo.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
        lastFocusedBeforeModal.focus();
      } else {
        modalOpenBtn.focus();
      }
    }

    modalOpenBtn.addEventListener('click', openModal);

    modalDemo.querySelectorAll('.spark-modal-close, .spark-modal-dismiss').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }

    modalDemo.querySelector('.spark-modal-panel').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalDemo.hasAttribute('data-open')) {
        closeModal();
      }
    });
  }

});
