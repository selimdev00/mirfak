"use strict";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ---------- Sliders (Splide) ---------- */
function initSlider(sliderClass) {
  const sliderElement = document.querySelector(sliderClass);
  if (!sliderElement || typeof Splide === "undefined") return;

  const slides = sliderElement.querySelectorAll(".splide__slide");
  const totalItemCount = slides.length;

  function handlePagination(index) {
    const paginationWrapper =
      sliderElement.querySelector(".slider__pagination");
    if (!paginationWrapper) return;

    const current = paginationWrapper.querySelector(".current");
    const total = paginationWrapper.querySelector(".total");

    if (current) current.textContent = index + 1;
    if (total) total.textContent = totalItemCount;
  }

  // NOTE: do NOT pass an `arrows` element map (invalid in Splide v4 and it
  // grabbed the first matching arrows document-wide). Splide auto-binds the
  // per-root `.splide__arrow--prev/--next` buttons that already exist in markup.
  const splide = new Splide(sliderElement, {
    gap: 10,
    pagination: false,
    autoplay: !prefersReducedMotion,
    interval: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
    rewind: true,
    reducedMotion: {
      speed: 0,
      rewindSpeed: 0,
      autoplay: "pause",
    },
  });

  splide.on("mounted", () => handlePagination(0));
  splide.on("move", (index) => handlePagination(index));
  splide.mount();
}

function initSliders() {
  [".landing-section__slider", ".talk-section__slider"].forEach(initSlider);
}

/* ---------- Services accordion ---------- */
function initAccordion() {
  const triggers = document.querySelectorAll(
    ".services-section__list__item__title"
  );

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.parentElement;
      const isOpen = item.classList.toggle("is-active");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

/* ---------- Mobile nav (burger) ---------- */
function initBurger() {
  const burger = document.querySelector(".header__burger");
  const nav = document.getElementById("mobile-nav");
  if (!burger || !nav) return;

  function setOpen(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    burger.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
    if (open) {
      nav.hidden = false;
    } else {
      // allow the close transition to play before hiding
      window.setTimeout(() => {
        if (!nav.classList.contains("is-open")) nav.hidden = true;
      }, 250);
    }
    document.body.classList.toggle("is-nav-open", open);
  }

  burger.addEventListener("click", () =>
    setOpen(burger.getAttribute("aria-expanded") !== "true")
  );

  nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => setOpen(false))
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
  });
}

/* ---------- Header state on scroll ---------- */
function initHeaderScroll() {
  const header = document.querySelector(".header__wrapper");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Modal ---------- */
function initModal() {
  const modal = document.querySelector("[data-modal]");
  if (!modal) return;

  const dialog = modal.querySelector(".modal__dialog");
  let lastFocused = null;

  const focusableSelector =
    'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  function open() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    // next frame so the transition can run
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.classList.add("is-modal-open");
    setBackgroundInert(true);
    const first = dialog.querySelector(focusableSelector);
    if (first) first.focus();
  }

  function close() {
    modal.classList.remove("is-open");
    document.body.classList.remove("is-modal-open");
    setBackgroundInert(false);
    const finish = () => {
      modal.hidden = true;
      modal.removeEventListener("transitionend", finish);
    };
    if (prefersReducedMotion) finish();
    else modal.addEventListener("transitionend", finish);
    if (lastFocused) lastFocused.focus();
  }

  function setBackgroundInert(on) {
    ["header", "main", "footer"].forEach((tag) => {
      const el = document.querySelector(tag);
      if (!el) return;
      if (on) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    });
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusables = Array.from(
      dialog.querySelectorAll(focusableSelector)
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document
    .querySelectorAll("[data-modal-open]")
    .forEach((btn) => btn.addEventListener("click", open));
  modal
    .querySelectorAll("[data-modal-close]")
    .forEach((btn) => btn.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else trapFocus(e);
  });
}

/* ---------- Form validation ---------- */
function initForms() {
  const forms = document.querySelectorAll("[data-request-form]");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  forms.forEach((form) => {
    const status = form.querySelector(".form-status");

    function setError(field, message) {
      const errorEl = form.querySelector(`[data-error-for="${field.id}"]`);
      field.setAttribute("aria-invalid", "true");
      if (errorEl) errorEl.textContent = message;
    }

    function clearError(field) {
      const errorEl = form.querySelector(`[data-error-for="${field.id}"]`);
      field.removeAttribute("aria-invalid");
      if (errorEl) errorEl.textContent = "";
    }

    function validateField(field) {
      const value = field.value.trim();
      if (!value) {
        setError(field, "Заполните это поле");
        return false;
      }
      if (field.type === "email" && !emailRe.test(value)) {
        setError(field, "Проверьте формат e-mail");
        return false;
      }
      clearError(field);
      return true;
    }

    form.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = Array.from(form.querySelectorAll("input, textarea"));
      let valid = true;
      let firstInvalid = null;

      fields.forEach((field) => {
        if (!validateField(field)) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid) {
        if (status) {
          status.textContent = "Проверьте отмеченные поля.";
          status.classList.remove("is-success");
          status.classList.add("is-error");
        }
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No backend in this static build - simulate a successful submit.
      if (status) {
        status.textContent =
          "Спасибо! Заявка отправлена, мы свяжемся с вами в течение 14 минут.";
        status.classList.remove("is-error");
        status.classList.add("is-success");
      }
      form.reset();
      fields.forEach(clearError);
    });
  });
}

/* ---------- Footer year ---------- */
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", () => {
  initSliders();
  initAccordion();
  initBurger();
  initHeaderScroll();
  initReveal();
  initModal();
  initForms();
  initYear();
});
