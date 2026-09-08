(() => {
  document.documentElement.classList.add('js');

  const body = document.body;
  const gallery = window.GALLERY_DATA?.categories || {};
  const categoryOrder = ['gestantes', 'newborn', 'retratos'];
  const categoryItems = (category) => Array.isArray(gallery[category]) ? gallery[category] : [];
  const allItems = categoryOrder.flatMap(categoryItems);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const chooseImage = (category, preferredOrientation, offset = 0) => {
    const items = categoryItems(category);
    const preferred = items.filter((item) => item.orientation === preferredOrientation);
    const pool = preferred.length ? preferred : items;
    return pool.length ? pool[offset % pool.length] : null;
  };
  const cssImage = (src) => `url("${String(src).replaceAll('"', '%22')}")`;

  const renderHomeHero = () => {
    const container = document.querySelector('#home-hero-slides');
    if (!container) return;

    const selected = [];
    categoryOrder.forEach((category) => {
      const item = chooseImage(category, 'landscape');
      if (item && !selected.some((current) => current.src === item.src)) selected.push(item);
    });
    allItems.filter((item) => item.orientation === 'landscape').forEach((item) => {
      if (selected.length < 3 && !selected.some((current) => current.src === item.src)) selected.push(item);
    });

    selected.slice(0, 3).forEach((item, index) => {
      const slide = element('div', `hero-slide${index === 0 ? ' active' : ''}`);
      slide.style.backgroundImage = cssImage(item.src);
      slide.style.backgroundPosition = 'center';
      slide.setAttribute('aria-label', item.phrase);
      container.append(slide);
    });

    const total = Math.min(selected.length, 3);
    const totalLabel = document.querySelector('[data-slide-total]');
    if (totalLabel) totalLabel.textContent = String(total).padStart(2, '0');
    if (!total) document.querySelector('.hero__meta')?.setAttribute('hidden', '');
  };

  const renderAutomaticImages = () => {
    document.querySelectorAll('[data-gallery-hero]').forEach((image) => {
      const category = image.dataset.galleryHero;
      const preferred = category === 'retratos' ? 'portrait' : 'landscape';
      const item = chooseImage(category, preferred);
      if (!item) return;
      image.src = item.src;
      image.alt = item.alt;
      if (!image.style.objectPosition) image.style.objectPosition = item.orientation === 'portrait' ? 'center 34%' : 'center';
    });

    document.querySelectorAll('[data-gallery-featured]').forEach((image) => {
      const item = chooseImage(image.dataset.galleryFeatured, 'portrait');
      if (!item) return;
      image.src = item.src;
      image.alt = item.alt;
    });

    document.querySelectorAll('[data-gallery-background]').forEach((section) => {
      const item = chooseImage(section.dataset.galleryBackground, 'landscape', 1);
      if (item) section.style.backgroundImage = cssImage(item.src);
    });
  };

  const createPhraseOverlay = (item) => {
    const overlay = element('span', 'photo-phrase');
    overlay.append(element('small', '', item.label), element('strong', '', item.phrase));
    return overlay;
  };

  const renderHomePreview = () => {
    const container = document.querySelector('#home-preview-grid');
    if (!container) return;
    container.classList.add('is-dynamic');

    categoryOrder.forEach((category, index) => {
      const item = chooseImage(category, index === 1 ? 'landscape' : 'portrait');
      if (!item) return;
      const card = element('a', 'preview-card');
      card.href = `portfolio.html?categoria=${category}`;
      card.dataset.reveal = '';
      card.dataset.delay = String(index * 120);
      card.style.setProperty('--photo-ratio', `${item.width} / ${item.height}`);

      const image = element('img');
      image.src = item.src;
      image.alt = item.alt;
      image.loading = 'lazy';
      const caption = element('div', 'preview-card__caption');
      const copy = element('div');
      copy.append(element('span', '', item.label), element('h3', '', item.title));
      caption.append(copy, element('span', '', String(index + 1).padStart(2, '0')));
      card.append(image, createPhraseOverlay(item), caption);
      container.append(card);
    });
  };

  const interleavedGallery = () => {
    const groups = categoryOrder.map((category) => [...categoryItems(category)]);
    const result = [];
    while (groups.some((group) => group.length)) {
      groups.forEach((group) => {
        const item = group.shift();
        if (item) result.push(item);
      });
    }
    return result;
  };

  const renderPortfolio = () => {
    const container = document.querySelector('#galeria');
    if (!container) return;
    const items = interleavedGallery();
    container.textContent = '';
    container.classList.add('is-dynamic');

    if (!items.length) {
      container.append(element('p', 'gallery-empty', 'Nenhuma fotografia encontrada. Execute o atualizador da galeria.'));
      return;
    }

    items.forEach((item, index) => {
      const article = element('article', `portfolio-card portfolio-card--${item.orientation}`);
      article.dataset.category = item.category;
      article.dataset.reveal = '';
      article.dataset.delay = String((index % 2) * 90);

      const button = element('button', 'portfolio-card__image');
      button.type = 'button';
      button.dataset.caption = `${item.label} · ${item.phrase}`;
      button.style.setProperty('--photo-ratio', `${item.width} / ${item.height}`);
      const image = element('img');
      image.src = item.src;
      image.alt = item.alt;
      image.loading = 'lazy';
      button.append(image, createPhraseOverlay(item));

      const caption = element('div', 'portfolio-card__caption');
      caption.append(element('h2', '', item.title), element('span', '', item.label));
      article.append(button, caption);
      container.append(article);
    });

    categoryOrder.forEach((category) => {
      document.querySelector(`[data-category-count="${category}"]`)?.replaceChildren(document.createTextNode(String(categoryItems(category).length)));
    });
    document.querySelector('[data-category-count="todos"]')?.replaceChildren(document.createTextNode(String(items.length)));
  };

  renderHomeHero();
  renderAutomaticImages();
  renderHomePreview();
  renderPortfolio();

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuLinks = document.querySelectorAll('.site-nav a');
  let lastScroll = 0;

  const syncHeader = () => {
    if (!header) return;
    const currentScroll = window.scrollY;
    header.classList.toggle('scrolled', currentScroll > 30);
    header.classList.toggle('is-hidden', currentScroll > 420 && currentScroll > lastScroll && !body.classList.contains('menu-open'));
    lastScroll = Math.max(0, currentScroll);
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    menuLinks.forEach((link) => link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const revealItems = document.querySelectorAll('[data-reveal], .image-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => entry.target.classList.add('revealed'), Number(entry.target.dataset.delay || 0));
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('revealed'));
  }

  const slides = [...document.querySelectorAll('.hero-slide')];
  const slideNumber = document.querySelector('[data-slide-number]');
  const progress = document.querySelector('.hero-progress span');
  let activeSlide = 0;
  const restartProgress = () => {
    if (!progress) return;
    progress.classList.remove('running');
    void progress.offsetWidth;
    progress.classList.add('running');
  };
  const showNextSlide = () => {
    if (slides.length < 2) return;
    slides[activeSlide].classList.remove('active');
    activeSlide = (activeSlide + 1) % slides.length;
    slides[activeSlide].classList.add('active');
    if (slideNumber) slideNumber.textContent = String(activeSlide + 1).padStart(2, '0');
    restartProgress();
  };
  if (slides.length) {
    restartProgress();
    window.setInterval(showNextSlide, 6000);
  }

  const filterButtons = document.querySelectorAll('.filter-button');
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  const applyFilter = (filter) => {
    filterButtons.forEach((button) => button.classList.toggle('active', button.dataset.filter === filter));
    portfolioCards.forEach((card) => card.classList.toggle('is-hidden', filter !== 'todos' && card.dataset.category !== filter));
  };
  filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  const requestedCategory = new URLSearchParams(window.location.search).get('categoria');
  if (requestedCategory && categoryOrder.includes(requestedCategory)) applyFilter(requestedCategory);

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.close();
    body.style.overflow = '';
  };
  document.querySelectorAll('.portfolio-card__image').forEach((button) => button.addEventListener('click', () => {
    const sourceImage = button.querySelector('img');
    if (!lightbox || !lightboxImage || !sourceImage) return;
    lightboxImage.src = sourceImage.src;
    lightboxImage.alt = sourceImage.alt;
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || sourceImage.alt;
    lightbox.showModal();
    body.style.overflow = 'hidden';
  }));
  lightbox?.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  lightbox?.addEventListener('cancel', () => { body.style.overflow = ''; });

  document.querySelectorAll('[data-year]').forEach((item) => { item.textContent = new Date().getFullYear(); });
})();
