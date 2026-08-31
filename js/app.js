(() => {
  const config = window.OFATEK_CONFIG || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  window.OFATEK_APP = { $ };

  // Loader
  window.addEventListener("load", () => {
    setTimeout(() => $("#pageLoader")?.classList.add("hide"), 500);
  });

  // Sticky header
  const header = $("#siteHeader");
  const syncHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  const closeMenu = () => {
    menuToggle?.classList.remove("open");
    navLinks?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };
  menuToggle?.addEventListener("click", () => {
    const open = !navLinks.classList.contains("open");
    menuToggle.classList.toggle("open", open);
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });
  $$(".nav-links a").forEach(a => a.addEventListener("click", closeMenu));

  // Reveal-on-scroll
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("visible"));
  }

  // Division showcase
  const divisionDescriptions = {
    "Acara": "Ruang untuk mengatur alur, konsep, dan jalannya rangkaian kegiatan OFATEK 2026.",
    "HUMAS": "Menjadi penghubung komunikasi dan membangun hubungan baik dengan pihak yang terlibat dalam kegiatan.",
    "PDD": "Mengolah publikasi, dokumentasi, dan informasi visual agar setiap momen OFATEK tersampaikan.",
    "Logistik": "Menyiapkan kebutuhan perlengkapan dan memastikan kebutuhan teknis kegiatan berjalan dengan baik.",
    "Medis": "Mendukung kesiapan dan respons kesehatan selama rangkaian kegiatan berlangsung.",
    "Konsumsi": "Mengatur kebutuhan konsumsi agar distribusi makanan dan minuman berjalan tertib.",
    "PJK": "Mendukung kebutuhan kepanitiaan sesuai peran PJK dalam pelaksanaan OFATEK 2026."
  };

  const divisionItems = $$(".division-item");
  const divisionName = $("#divisionName");
  const divisionNumber = $("#divisionNumber");
  const divisionDescription = $("#divisionDescription");

  divisionItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      divisionItems.forEach(x => x.classList.remove("active"));
      item.classList.add("active");
      const name = item.dataset.division;
      if (divisionName) divisionName.textContent = name.toUpperCase();
      if (divisionNumber) divisionNumber.textContent = String(index + 1).padStart(2, "0");
      if (divisionDescription) {
        divisionDescription.textContent = divisionDescriptions[name] || "Temukan ruang kontribusimu di OFATEK 2026.";
      }
    });
  });

  // Deadline countdown
  const deadline = new Date(config.REGISTRATION_DEADLINE || "2026-09-24T23:59:59+07:00");
  const countdownEls = {
    days: $("#days"), hours: $("#hours"), minutes: $("#minutes"), seconds: $("#seconds")
  };

  const updateCountdown = () => {
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) {
      Object.values(countdownEls).forEach(el => { if (el) el.textContent = "00"; });
      const label = $(".deadline-date > span");
      if (label) label.textContent = "REGISTRATION CLOSED";
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (countdownEls.days) countdownEls.days.textContent = String(days).padStart(2, "0");
    if (countdownEls.hours) countdownEls.hours.textContent = String(hours).padStart(2, "0");
    if (countdownEls.minutes) countdownEls.minutes.textContent = String(minutes).padStart(2, "0");
    if (countdownEls.seconds) countdownEls.seconds.textContent = String(seconds).padStart(2, "0");
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // PWA install prompt
  let deferredPrompt = null;
  const installBanner = $("#installBanner");
  const installButton = $("#installButton");
  const installDismiss = $("#installDismiss");

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if (!sessionStorage.getItem("ofatek_install_dismissed")) {
      setTimeout(() => { if (installBanner) installBanner.hidden = false; }, 3500);
    }
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installBanner) installBanner.hidden = true;
  });
  installDismiss?.addEventListener("click", () => {
    sessionStorage.setItem("ofatek_install_dismissed", "1");
    if (installBanner) installBanner.hidden = true;
  });

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
