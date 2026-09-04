(() => {
  document.documentElement.classList.add('js');
  const body = document.body;
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
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    portfolioCards.forEach((card) => card.classList.toggle('is-hidden', filter !== 'todos' && card.dataset.category !== filter));
  }));

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
