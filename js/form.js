(() => {
  const config = window.OFATEK_CONFIG || {};

  const $ = window.OFATEK_APP?.$;
  const $$ = window.OFATEK_APP?.$$;

  if (!$ || !$$) {
    console.error("OFATEK_APP belum tersedia. Pastikan app.js dimuat sebelum form.js.");
    return;
  }

  const form = $("#registrationForm");
  if (!form) return;

  const steps = $$(".form-step");
  const progress = $$(".progress-step");
  const divisionInput = $("#divisionInput");
  const selectionError = $("#selectionError");
  const reviewGrid = $("#reviewGrid");
  const submitButton = $("#submitButton");
  const globalError = $("#globalError");
  const successScreen = $("#successScreen");
  const whatsappButton = $("#whatsappButton");
  const successId = $("#successId");

  let currentStep = 1;

  // ============================================
  // DATA FORM
  // ============================================

  const getData = () => {
    return Object.fromEntries(new FormData(form).entries());
  };

  // ============================================
  // STEP NAVIGATION
  // ============================================

  const setStep = (step) => {
    currentStep = step;

    steps.forEach(el => {
      el.classList.toggle(
        "active",
        Number(el.dataset.step) === step
      );
    });

    progress.forEach(el => {
      el.classList.toggle(
        "active",
        Number(el.dataset.progress) <= step
      );
    });

    document
      .querySelector("#register")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  };

  // ============================================
  // ERROR
  // ============================================

  const clearGlobalError = () => {
    if (!globalError) return;

    globalError.hidden = true;
    globalError.textContent = "";
  };

  // ============================================
  // VALIDASI FIELD
  // ============================================

  const validateField = (field) => {
    const error = $(".field-error", field.parentElement);
    let message = "";

    const value = field.value.trim();

    if (!value) {
      message = "Bagian ini wajib diisi.";
    }

    else if (
      field.name === "nim" &&
      !/^[0-9]{5,20}$/.test(value)
    ) {
      message = "NIM harus berupa angka.";
    }

    else if (field.name === "whatsapp") {
      const digits = value.replace(/\D/g, "");

      if (digits.length < 10 || digits.length > 15) {
        message = "Nomor WhatsApp belum valid.";
      }
    }

    field.classList.toggle("invalid", Boolean(message));

    if (error) {
      error.textContent = message;
    }

    return !message;
  };

  const validateStepOne = () => {
    const fields = $$(
      "input[required], select[required]",
      steps[0]
    );

    let valid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        valid = false;
      }
    });

    return valid;
  };

  // ============================================
  // ESCAPE HTML
  // ============================================

  const escapeHtml = value =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  // ============================================
  // REVIEW DATA
  // ============================================

  const buildReview = () => {
    const data = getData();

    const labels = {
      nama: "NAMA LENGKAP",
      nim: "NIM",
      prodi: "PROGRAM STUDI",
      angkatan: "ANGKATAN",
      gender: "JENIS KELAMIN",
      whatsapp: "WHATSAPP",
      divisi: "DIVISI"
    };

    if (!reviewGrid) return;

    reviewGrid.innerHTML = Object
      .entries(labels)
      .map(([key, label]) => `
        <div class="review-item">
          <span>${label}</span>
          <strong>${escapeHtml(data[key] || "-")}</strong>
        </div>
      `)
      .join("");
  };

  // ============================================
  // CLEAR ERROR SAAT USER MENGISI
  // ============================================

  $$("input, select", form).forEach(field => {

    field.addEventListener("input", () => {
      field.classList.remove("invalid");

      const error = $(".field-error", field.parentElement);

      if (error) {
        error.textContent = "";
      }

      clearGlobalError();
    });

    field.addEventListener("change", () => {
      field.classList.remove("invalid");

      const error = $(".field-error", field.parentElement);

      if (error) {
        error.textContent = "";
      }

      clearGlobalError();
    });

  });

  // ============================================
  // PEMILIHAN DIVISI
  // ============================================

  $$("#divisionSelect button").forEach(button => {

    button.addEventListener("click", () => {

      $$("#divisionSelect button").forEach(item => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");

      divisionInput.value = button.dataset.value;

      if (selectionError) {
        selectionError.textContent = "";
      }

      clearGlobalError();
    });

  });

  // ============================================
  // NEXT
  // ============================================

  $$("[data-next]").forEach(button => {

    button.addEventListener("click", () => {

      const next = Number(button.dataset.next);

      clearGlobalError();

      // STEP 1 → STEP 2
      if (currentStep === 1) {

        if (!validateStepOne()) {

          const firstInvalid = $(".invalid", steps[0]);

          firstInvalid?.focus();

          return;
        }
      }

      // STEP 2 → STEP 3
      if (currentStep === 2) {

        if (!divisionInput.value) {

          if (selectionError) {
            selectionError.textContent =
              "Silakan pilih satu divisi terlebih dahulu.";
          }

          return;
        }

        buildReview();
      }

      setStep(next);
    });

  });

  // ============================================
  // PREVIOUS
  // ============================================

  $$("[data-prev]").forEach(button => {

    button.addEventListener("click", () => {

      clearGlobalError();

      setStep(
        Number(button.dataset.prev)
      );

    });

  });

  // ============================================
  // SUBMISSION
  // ============================================

  form.addEventListener("submit", async event => {

    event.preventDefault();

    clearGlobalError();

    // Validasi frontend sebelum dikirim
    if (!validateStepOne()) {

      setStep(1);

      return;
    }

    if (!divisionInput.value) {

      setStep(2);

      if (selectionError) {
        selectionError.textContent =
          "Silakan pilih satu divisi terlebih dahulu.";
      }

      return;
    }

    const data = getData();

    const originalText = submitButton.innerHTML;

    submitButton.disabled = true;

    submitButton.innerHTML =
      "<span>Mengirim...</span><b>•••</b>";

    try {

      let responseData;

      // ==========================================
      // DEMO MODE
      // ==========================================

      if (
        config.DEMO_MODE ||
        !config.GOOGLE_APPS_SCRIPT_URL
      ) {

        await new Promise(resolve =>
          setTimeout(resolve, 1100)
        );

        responseData = {
          success: true,
          registrationId:
            "OF26-DEMO-" +
            Math.floor(1000 + Math.random() * 9000)
        };

      }

      // ==========================================
      // PRODUCTION / GOOGLE APPS SCRIPT
      // ==========================================

      else {

        const response = await fetch(
          config.GOOGLE_APPS_SCRIPT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },

            body: JSON.stringify(data)
          }
        );

        if (!response.ok) {
          throw new Error(
            "Server tidak dapat memproses permintaan."
          );
        }

        responseData = await response.json();
      }

      // ==========================================
      // RESPONSE BACKEND
      // ==========================================

      if (!responseData?.success) {

        throw new Error(
          responseData?.message ||
          "Pendaftaran tidak dapat diproses."
        );
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      form.hidden = true;

      $(".form-progress")
        ?.classList.add("hidden");

      successScreen.hidden = false;

      const id =
        responseData.registrationId ||
        "OF26-" + Date.now();

      successId.textContent =
        "ID PENDAFTARAN: " + id;

      // ==========================================
      // WHATSAPP GROUP
      // ==========================================

      const groupUrl =
        config.WHATSAPP_GROUP_URL || "#";

      whatsappButton.href = groupUrl;

      if (!config.WHATSAPP_GROUP_URL) {

        whatsappButton.addEventListener(
          "click",
          event => {

            event.preventDefault();

            alert(
              "Link grup WhatsApp belum diatur."
            );

          },
          { once: true }
        );
      }

      successScreen.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

    catch (error) {

      console.error(
        "OFATEK submission error:",
        error
      );

      globalError.hidden = false;

      globalError.textContent =
        error.message ||
        "Terjadi kesalahan. Silakan coba lagi.";

      submitButton.disabled = false;

      submitButton.innerHTML =
        originalText;
    }

  });

})();
