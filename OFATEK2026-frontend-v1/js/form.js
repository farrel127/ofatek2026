(() => {
  const config = window.OFATEK_CONFIG || {};
  const $ = window.OFATEK_APP.$;
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

  const getData = () => Object.fromEntries(new FormData(form).entries());

  const setStep = (step) => {
    currentStep = step;
    steps.forEach(el => el.classList.toggle("active", Number(el.dataset.step) === step));
    progress.forEach(el => el.classList.toggle("active", Number(el.dataset.progress) <= step));
    document.querySelector("#register")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearGlobalError = () => {
    globalError.hidden = true;
    globalError.textContent = "";
  };

  const validateField = (field) => {
    const error = $(".field-error", field.parentElement);
    const input = field;
    let message = "";

    if (!input.value.trim()) {
      message = "Bagian ini wajib diisi.";
    } else if (input.name === "nim" && !/^[0-9]{5,20}$/.test(input.value.trim())) {
      message = "NIM harus berupa angka.";
    } else if (input.name === "whatsapp") {
      const digits = input.value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) message = "Nomor WhatsApp belum valid.";
    }

    input.classList.toggle("invalid", Boolean(message));
    if (error) error.textContent = message;
    return !message;
  };

  const validateStepOne = () => {
    const fields = $$("input[required], select[required]", steps[0]);
    let valid = true;
    fields.forEach(field => { if (!validateField(field)) valid = false; });
    return valid;
  };

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
    reviewGrid.innerHTML = Object.entries(labels).map(([key, label]) => `
      <div class="review-item">
        <span>${label}</span>
        <strong>${escapeHtml(data[key] || "-")}</strong>
      </div>
    `).join("");
  };

  const escapeHtml = value => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  // Clear errors while typing/changing.
  $$("input, select", form).forEach(field => {
    field.addEventListener("input", () => {
      field.classList.remove("invalid");
      const error = $(".field-error", field.parentElement);
      if (error) error.textContent = "";
      clearGlobalError();
    });
    field.addEventListener("change", () => {
      field.classList.remove("invalid");
      const error = $(".field-error", field.parentElement);
      if (error) error.textContent = "";
      clearGlobalError();
    });
  });

  // Division selection
  $$("#divisionSelect button").forEach(button => {
    button.addEventListener("click", () => {
      $$("#divisionSelect button").forEach(x => x.classList.remove("selected"));
      button.classList.add("selected");
      divisionInput.value = button.dataset.value;
      selectionError.textContent = "";
      clearGlobalError();
    });
  });

  // Next / previous
  $$("[data-next]").forEach(button => {
    button.addEventListener("click", () => {
      const next = Number(button.dataset.next);
      clearGlobalError();

      if (currentStep === 1 && !validateStepOne()) {
        const firstInvalid = $(".invalid", steps[0]);
        firstInvalid?.focus();
        return;
      }

      if (currentStep === 2) {
        if (!divisionInput.value) {
          selectionError.textContent = "Silakan pilih satu divisi terlebih dahulu.";
          return;
        }
        buildReview();
      }

      setStep(next);
    });
  });

  $$("[data-prev]").forEach(button => {
    button.addEventListener("click", () => {
      clearGlobalError();
      setStep(Number(button.dataset.prev));
    });
  });

  // Submission
  form.addEventListener("submit", async event => {
    event.preventDefault();
    clearGlobalError();

    if (!validateStepOne() || !divisionInput.value) {
      setStep(!divisionInput.value ? 2 : 1);
      return;
    }

    const data = getData();
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = "<span>Mengirim...</span><b>•••</b>";

    try {
      let responseData;

      if (config.DEMO_MODE || !config.GOOGLE_APPS_SCRIPT_URL) {
        // Frontend-only demo. Backend will be connected in the next phase.
        await new Promise(resolve => setTimeout(resolve, 1100));
        responseData = {
          success: true,
          registrationId: "OF26-DEMO-" + Math.floor(1000 + Math.random() * 9000)
        };
      } else {
        const response = await fetch(config.GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Server response was not OK.");
        responseData = await response.json();
      }

      if (!responseData?.success) {
        throw new Error(responseData?.message || "Pendaftaran tidak dapat diproses.");
      }

      form.hidden = true;
      $(".form-progress")?.classList.add("hidden");
      successScreen.hidden = false;

      const id = responseData.registrationId || "OF26-" + Date.now();
      successId.textContent = "ID PENDAFTARAN: " + id;

      const groupUrl = config.WHATSAPP_GROUP_URL || "#";
      whatsappButton.href = groupUrl;

      if (!config.WHATSAPP_GROUP_URL) {
        whatsappButton.addEventListener("click", event => {
          event.preventDefault();
          alert("Link grup WhatsApp belum diatur. Ganti WHATSAPP_GROUP_URL di js/config.js.");
        }, { once: true });
      }

      successScreen.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      globalError.hidden = false;
      globalError.textContent = error.message || "Terjadi kesalahan. Silakan coba lagi.";
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  });
})();
