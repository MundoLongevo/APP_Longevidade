/* ===============================
   FQ5C – APP.JS
   Versão estável com PIN local
   Data local corrigida
   =============================== */

/* -------- CONFIGURAÇÕES -------- */
const VERBS = [
  "Fazer",
  "Querer",
  "Cuidar",
  "Conhecer",
  "Conversar",
  "Compartilhar",
  "Curtir"
];

const DATA_KEY = "fq5c_data";
const PIN_KEY  = "fq5c_pin";

/* -------- DATA LOCAL (CORRIGIDA) -------- */
const now = new Date();
const today =
  now.getFullYear() + "-" +
  String(now.getMonth() + 1).padStart(2, "0") + "-" +
  String(now.getDate()).padStart(2, "0");

/* -------- PIN LOCAL -------- */
function hasPIN() {
  return !!localStorage.getItem(PIN_KEY);
}

function checkPIN(value) {
  return localStorage.getItem(PIN_KEY) === value;
}

function showPIN() {
  const overlay = document.getElementById("pinOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hidePIN() {
  const overlay = document.getElementById("pinOverlay");
  if (overlay) overlay.classList.add("hidden");
}

/* -------- INICIALIZAÇÃO -------- */
document.addEventListener("DOMContentLoaded", () => {

  /* PIN */
  if (hasPIN()) showPIN();

  const pinBtn  = document.getElementById("pinBtn");
  const pinSkip = document.getElementById("pinSkip");
  const pinInput = document.getElementById("pinInput");

  if (pinBtn) {
    pinBtn.onclick = () => {
      if (checkPIN(pinInput.value)) {
        hidePIN();
      } else {
        alert("Código incorreto");
      }
    };
  }

  if (pinSkip) {
    pinSkip.onclick = () => hidePIN();
  }

  /* -------- DADOS -------- */
  let data = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");

  if (!data[today]) {
    data[today] = {
      verbs: {},
      memory: ""
    };
  }

  /* -------- VERBOS -------- */
  const verbsContainer = document.getElementById("verbs");
  verbsContainer.innerHTML = "";

  VERBS.forEach(verb => {
    const block = document.createElement("div");
    block.className = "verb";

    block.innerHTML = `
      <label>
        <input type="checkbox" />
        ${verb}
      </label>
      <textarea placeholder="Registro livre"></textarea>
    `;

    const checkbox = block.querySelector("input");
    const textarea = block.querySelector("textarea");

    checkbox.checked = !!data[today].verbs[verb];
    textarea.value   = data[today].verbs[verb] || "";

    checkbox.onchange = () => {
      if (!textarea.value.trim()) {
        data[today].verbs[verb] = "";
      }
      saveData();
      updatePresence();
    };

    textarea.oninput = () => {
      data[today].verbs[verb] = textarea.value;
      saveData();
      updatePresence();
    };

    verbsContainer.appendChild(block);
  });

  /* -------- MEMÓRIA DO DIA -------- */
  const memoryInput = document.getElementById("memoryInput");
  const saveMemoryBtn = document.getElementById("saveMemory");

  if (memoryInput) {
    memoryInput.value = data[today].memory || "";
    memoryInput.oninput = () => {
      data[today].memory = memoryInput.value;
      saveData();
    };
  }

  if (saveMemoryBtn) {
    saveMemoryBtn.onclick = () => {
      alert("Memória guardada.");
    };
  }

  /* -------- PRESENÇA -------- */
  function updatePresence() {
    const count = Object.values(data[today].verbs)
      .filter(v => v && v.trim().length > 0).length;

    const presenceEl = document.getElementById("presence");
    if (presenceEl) {
      presenceEl.innerText = `Presença de hoje: ${count}/7`;
    }
  }

  function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  updatePresence();
});
