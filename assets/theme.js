document.documentElement.className = document.documentElement.className.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', function () {
  var revealItems = document.querySelectorAll('[data-reveal]');
  if (!revealItems.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-revealed'); });
    return;
  }
  document.documentElement.classList.add('reveal-ready');
  var revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach(function (item) { revealObserver.observe(item); });
});

document.addEventListener('click', function (event) {
  var thumbnail = event.target.closest('[data-gallery-thumbnail]');
  if (!thumbnail) return;

  var gallery = thumbnail.closest('[data-product-gallery]');
  if (!gallery) return;

  var image = gallery.querySelector('[data-gallery-main-image]');
  var source = thumbnail.getAttribute('data-full-src');
  var alt = thumbnail.getAttribute('data-alt') || '';

  if (image && source) {
    image.src = source;
    image.alt = alt;
  }

  gallery.querySelectorAll('[data-gallery-thumbnail]').forEach(function (button) {
    button.classList.remove('is-active');
  });
  thumbnail.classList.add('is-active');
});

document.addEventListener('DOMContentLoaded', function () {
  var sticky = document.querySelector('[data-mobile-sticky-cta]');
  var pricing = document.querySelector('#pricing');
  var finalCta = document.querySelector('#final-bundle');
  if (!sticky || !pricing || !finalCta || !('IntersectionObserver' in window)) return;

  var passedPricing = false;
  var finalVisible = false;
  var updateSticky = function () {
    sticky.classList.toggle('is-visible', passedPricing && !finalVisible);
  };

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      passedPricing = entry.boundingClientRect.top < 0 && !entry.isIntersecting;
      updateSticky();
    });
  }).observe(pricing);

  new IntersectionObserver(function (entries) {
    finalVisible = entries.some(function (entry) { return entry.isIntersecting; });
    updateSticky();
  }, { threshold: 0.15 }).observe(finalCta);
});

document.addEventListener('change', function (event) {
  var selector = event.target.closest('[data-locale-selector]');
  if (selector && selector.form) {
    selector.form.submit();
  }
});

/* Mobile navigation sheet */
(function () {
  var setMenu = function (open) {
    var button = document.querySelector('[data-header-menu-toggle]');
    var sheet = document.querySelector('[data-header-navigation]');
    var overlay = document.querySelector('[data-header-overlay]');
    if (!button || !sheet) return;
    button.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  };

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-header-menu-toggle]')) {
      var button = document.querySelector('[data-header-menu-toggle]');
      setMenu(button.getAttribute('aria-expanded') !== 'true');
      return;
    }
    if (event.target.closest('[data-header-overlay]')) { setMenu(false); return; }
    if (event.target.closest('[data-header-navigation] a')) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMenu(false);
  });
})();

/* Header: publish its measured height, and switch to dark glass once scrolled */
(function () {
  var header = document.querySelector('[data-site-header]');
  if (!header) return;

  var measure = function () {
    var height = Math.round(header.getBoundingClientRect().height);
    if (height > 0) document.documentElement.style.setProperty('--header-h', height + 'px');
  };

  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 24);
  };

  measure();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(header);
})();

/* Count-up for hero stats — runs once, when the rail scrolls into view */
(function () {
  var rail = document.querySelector('[data-hero-stats]');
  if (!rail) return;

  var values = rail.querySelectorAll('[data-count-to]');
  if (!values.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var render = function (node, amount) {
    var decimals = parseInt(node.getAttribute('data-count-decimals'), 10) || 0;
    var suffix = node.getAttribute('data-count-suffix') || '';
    node.textContent = amount.toFixed(decimals) + suffix;
  };

  var run = function () {
    values.forEach(function (node, index) {
      var target = parseFloat(node.getAttribute('data-count-to'));
      if (isNaN(target)) return;

      if (reduced) { render(node, target); return; }

      var duration = 1500 + index * 80;
      var startDelay = 480 + index * 90;
      render(node, 0);

      window.setTimeout(function () {
        var started = null;
        var step = function (timestamp) {
          if (started === null) started = timestamp;
          var progress = Math.min((timestamp - started) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          render(node, target * eased);
          if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      }, startDelay);
    });
  };

  if (!('IntersectionObserver' in window)) { run(); return; }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run();
    });
  }, { threshold: 0.25 });

  observer.observe(rail);
})();

/* Hero video: honour reduced-motion, and stop decoding once scrolled past */
(function () {
  var video = document.querySelector('[data-hero-video]');
  if (!video) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  var play = function () {
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(function () { /* autoplay blocked — poster frame stands in */ });
  };

  play();

  if (!('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { play(); } else { video.pause(); }
    });
  }, { threshold: 0.01 }).observe(video);
})();

document.addEventListener('click', function (event) {
  var trigger = event.target.closest('[data-bundle-add-trigger]');
  if (!trigger) return;

  var ids = (trigger.getAttribute('data-bundle-variant-ids') || '')
    .split(',')
    .map(function (id) { return id.trim(); })
    .filter(Boolean);

  if (!ids.length) return;

  event.preventDefault();

  if (trigger.getAttribute('aria-busy') === 'true') return;

  var originalText = trigger.textContent;
  var loadingText = trigger.getAttribute('data-bundle-loading') || 'Preparing bundle...';
  var errorText = trigger.getAttribute('data-bundle-error') || 'We could not prepare the bundle. Please open cart and try again.';
  var cartUrl = trigger.getAttribute('data-bundle-cart-url') || '/cart.js';
  var addUrl = trigger.getAttribute('data-bundle-add-url') || '/cart/add.js';
  var redirectUrl = trigger.getAttribute('href') || '/cart';
  var errorNode = trigger.parentElement && trigger.parentElement.querySelector('[data-bundle-action-error]');

  if (!errorNode && trigger.parentElement) {
    errorNode = document.createElement('p');
    errorNode.setAttribute('data-bundle-action-error', '');
    errorNode.className = 'bundle-action-error';
    trigger.parentElement.appendChild(errorNode);
  }

  if (errorNode) {
    errorNode.hidden = true;
    errorNode.textContent = '';
  }

  trigger.setAttribute('aria-busy', 'true');
  trigger.setAttribute('aria-disabled', 'true');
  trigger.textContent = loadingText;

  fetch(cartUrl, { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('Cart request failed');
      return response.json();
    })
    .then(function (cart) {
      var existingIds = (cart.items || []).map(function (item) {
        return String(item.variant_id);
      });
      var missingIds = ids.filter(function (id) {
        return existingIds.indexOf(String(id)) === -1;
      });

      if (!missingIds.length) return null;

      return fetch(addUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          items: missingIds.map(function (id) {
            return { id: Number(id), quantity: 1 };
          })
        })
      }).then(function (response) {
        if (!response.ok) throw new Error('Bundle add failed');
        return response.json();
      });
    })
    .then(function () {
      window.location.href = redirectUrl;
    })
    .catch(function () {
      trigger.removeAttribute('aria-busy');
      trigger.removeAttribute('aria-disabled');
      trigger.textContent = originalText;
      if (errorNode) {
        errorNode.textContent = errorText;
        errorNode.hidden = false;
      }
    });
});
