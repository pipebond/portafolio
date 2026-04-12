/* ================================================================
   PORTAFOLIO — script.js
   Funcionalidades:
     1. Cursor personalizado
     2. Navbar: scroll + active link + hamburguesa
     3. Scroll reveal (IntersectionObserver)
     4. Formulario de contacto (validación + feedback)
     5. Año dinámico en footer
     6. Botón "volver arriba"
     7. Inicializar iconos Lucide
================================================================ */

/* ----------------------------------------------------------------
   Esperar a que el DOM esté listo
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  // ── Inicializar iconos Lucide ────────────────────────────────
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ── Año en el footer ─────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Llamar a cada módulo
  initCursor();
  initNavbar();
  initScrollReveal();
  initContactForm();
  initBackToTop();
  initSmoothScroll();

});

/* ================================================================
   1. CURSOR PERSONALIZADO
================================================================ */
function initCursor() {
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (!cursor || !follower) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  // Actualizar posición del cursor principal (inmediato)
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Seguidor con retraso (animación fluida)
  function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  // Efecto hover en elementos interactivos
  const interactives = document.querySelectorAll(
    'a, button, input, textarea, select, .service-card, .project-card, .pricing-card'
  );

  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // Ocultar cursor al salir de la ventana
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity   = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity   = '1';
    follower.style.opacity = '1';
  });
}

/* ================================================================
   2. NAVBAR
================================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const toggle    = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');

  if (!navbar) return;

  // ── Clase "scrolled" al bajar ──────────────────────────────
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
    updateBackToTop();
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Hamburguesa (móvil) ────────────────────────────────────
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      // Evitar scroll del body mientras el menú esté abierto
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (
        navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ── Active link según sección visible ─────────────────────
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }
}

/* ================================================================
   3. SCROLL REVEAL — IntersectionObserver
================================================================ */
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.reveal-up, .reveal-left, .reveal-right'
  );

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Dejar de observar una vez animado (rendimiento)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,      // 12% del elemento visible para disparar
      rootMargin: '0px 0px -40px 0px'
    }
  );

  elements.forEach(el => observer.observe(el));
}

/* ================================================================
   4. FORMULARIO DE CONTACTO
================================================================ */

const BACKEND_URL = '';

function initContactForm() {
  const form       = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar campos requeridos
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      const isEmpty = field.value.trim() === '';
      field.classList.toggle('invalid', isEmpty);
      if (isEmpty) isValid = false;
      field.addEventListener('input', () => field.classList.remove('invalid'), { once: true });
    });

    // Validar formato de email
    const emailField = form.querySelector('#email');
    if (emailField && !isValidEmail(emailField.value)) {
      emailField.classList.add('invalid');
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn  = form.querySelector('.btn-submit');
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Estado de carga
    submitBtn.disabled = true;
    if (btnText)    btnText.hidden    = true;
    if (btnLoading) btnLoading.hidden = false;

    try {
      const response = await fetch(`${BACKEND_URL}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.querySelector('#name').value.trim(),
          email:   form.querySelector('#email').value.trim(),
          service: form.querySelector('#service').value,
          budget:  form.querySelector('#budget').value,
          message: form.querySelector('#message').value.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Éxito — mostrar mensaje
        form.style.display = 'none';
        if (successMsg) {
          successMsg.hidden = false;
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Restaurar formulario después de 6s
        setTimeout(() => {
          form.reset();
          form.style.display = 'flex';
          if (successMsg) successMsg.hidden = true;
          submitBtn.disabled = false;
          if (btnText)    btnText.hidden    = false;
          if (btnLoading) btnLoading.hidden = true;
        }, 6000);

      } else {
        throw new Error(data.error || 'Error desconocido');
      }

    } catch (err) {
      console.error('Error al enviar:', err.message);
      alert('Hubo un problema al enviar el mensaje. Intenta de nuevo o escríbeme directo al WhatsApp.');
      submitBtn.disabled = false;
      if (btnText)    btnText.hidden    = false;
      if (btnLoading) btnLoading.hidden = true;
    }
  });
}

/* Utilidad: validar email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ================================================================
   5. BOTÓN VOLVER ARRIBA
================================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* Actualiza visibilidad del botón (llamado desde scroll) */
function updateBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 400);
}

/* ================================================================
   6. SMOOTH SCROLL para anclas (#section)
================================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = document.getElementById('navbar')?.offsetHeight ?? 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}
