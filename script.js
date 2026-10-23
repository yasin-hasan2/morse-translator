/* =========================================
   MorseFlow - Translator Logic
   Vanilla JavaScript + localStorage
========================================= */

// 1. Morse code dictionary

const morseCode = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",

  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",

  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
};

// 2. Reverse dictionary for Morse -> English

const reverseMorse = Object.fromEntries(
  Object.entries(morseCode).map(([letter, code]) => [code, letter]),
);

// 3. Select HTML elements

const directionSelect = document.getElementById("direction");

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");

const inputLabel = document.getElementById("input-label");
const outputLabel = document.getElementById("output-label");

const inputCount = document.getElementById("input-count");
const outputCount = document.getElementById("output-count");

const clearButton = document.getElementById("clear-button");
const copyButton = document.getElementById("copy-button");
const themeToggle = document.getElementById("theme-toggle");

const statusMessage = document.getElementById("status-message");

const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history-button");

// 4. Storage keys

const HISTORY_KEY = "morseFlowHistory";
const THEME_KEY = "morseFlowTheme";

// 5. Translation functions

function englishToMorse(text) {
  return text
    .toUpperCase()
    .split("")
    .map((character) => {
      if (character === " ") {
        return "/";
      }

      return morseCode[character] || "?";
    })
    .join(" ");
}

function morseToEnglish(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return "";
  }

  // Words are separated by /.
  // Letters within each word are separated by spaces.
  return trimmedText
    .split(/\s*\/\s*/)
    .map((word) => {
      if (!word.trim()) {
        return "";
      }

      return word
        .trim()
        .split(/\s+/)
        .map((code) => reverseMorse[code] || "�")
        .join("");
    })
    .join(" ");
}

// 6. Update character counts

function updateCounts() {
  inputCount.textContent = `${inputText.value.length} characters`;

  outputCount.textContent = `${outputText.value.length} characters`;
}

// 7. Status messages

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

// 8. Read translation history safely

function getHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read translation history:", error);
    return [];
  }
}

// 9. Save translation history

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    return true;
  } catch (error) {
    console.error("Could not save translation history:", error);
    showStatus("Could not save history. Browser storage may be full.", true);

    return false;
  }
}

// 10. Render saved history

function renderHistory() {
  const history = getHistory();

  historyList.replaceChildren();

  if (history.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "Your translations will appear here.";

    historyList.appendChild(emptyMessage);
    return;
  }

  history.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-item";

    const header = document.createElement("div");
    header.className = "history-item-header";

    const mode = document.createElement("strong");
    mode.textContent = item.mode;

    const date = document.createElement("span");
    const parsedDate = new Date(item.timestamp);

    date.textContent = Number.isNaN(parsedDate.getTime())
      ? ""
      : parsedDate.toLocaleString();

    header.append(mode, date);

    const original = document.createElement("p");
    original.className = "history-original";
    original.textContent = `Input: ${item.input}`;

    const result = document.createElement("p");
    result.className = "history-result";
    result.textContent = `Output: ${item.output}`;

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "text-button";
    restoreButton.textContent = "Use again";

    restoreButton.addEventListener("click", () => {
      directionSelect.value = item.direction;
      inputText.value = item.input;

      updateModeLabels();
      translate({ save: false });

      inputText.focus();
      showStatus("Translation restored.");
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "text-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      const updatedHistory = getHistory().filter(
        (entry) => entry.id !== item.id,
      );

      if (saveHistory(updatedHistory)) {
        renderHistory();
        showStatus("History item deleted.");
      }
    });

    actions.append(restoreButton, deleteButton);
    card.append(header, original, result, actions);
    historyList.appendChild(card);
  });
}

// 11. Save the current translation

function addToHistory(input, output) {
  const history = getHistory();

  const entry = {
    id: `${Date.now()}-${Math.random()}`,
    input,
    output,
    direction: directionSelect.value,
    mode:
      directionSelect.value === "english-to-morse"
        ? "English → Morse"
        : "Morse → English",
    timestamp: new Date().toISOString(),
  };

  // Keep the most recent 50 translations.
  const updatedHistory = [entry, ...history].slice(0, 50);

  if (saveHistory(updatedHistory)) {
    renderHistory();
  }
}

// 12. Translate input

function translate({ save = true } = {}) {
  const originalInput = inputText.value;
  const trimmedInput = originalInput.trim();

  let result = "";

  if (trimmedInput) {
    if (directionSelect.value === "english-to-morse") {
      result = englishToMorse(originalInput);
    } else {
      result = morseToEnglish(originalInput);
    }
  }

  outputText.value = result;

  updateCounts();

  if (!trimmedInput) {
    showStatus("");
    return;
  }

  if (result.includes("?") && directionSelect.value === "english-to-morse") {
    showStatus("Some characters are unsupported and shown as ?.", true);
  } else if (
    result.includes("�") &&
    directionSelect.value === "morse-to-english"
  ) {
    showStatus("Some Morse sequences are unknown and shown as �.", true);
  } else {
    showStatus("Translation complete.");
  }

  if (save && result) {
    addToHistory(originalInput, result);
  }
}

// 13. Update labels when direction changes

function updateModeLabels() {
  const isEnglishToMorse = directionSelect.value === "english-to-morse";

  inputLabel.textContent = isEnglishToMorse ? "English text" : "Morse code";

  outputLabel.textContent = isEnglishToMorse ? "Morse code" : "English text";

  inputText.placeholder = isEnglishToMorse
    ? "Type English text here..."
    : "Enter Morse code, e.g. .... . .-.. .-.. ---";

  outputText.placeholder = isEnglishToMorse
    ? "Your Morse translation will appear here..."
    : "Your English translation will appear here...";

  translate();
}

// 14. Clear input and output

function clearTranslation() {
  inputText.value = "";
  outputText.value = "";

  updateCounts();
  showStatus("");

  inputText.focus();
}

// 15. Copy output

async function copyTranslation() {
  if (!outputText.value) {
    showStatus("There is no translation to copy.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(outputText.value);
    showStatus("Translation copied to clipboard.");
  } catch (error) {
    // Fallback for browsers without Clipboard API access.
    outputText.focus();
    outputText.select();

    const copied = document.execCommand("copy");

    showStatus(
      copied
        ? "Translation copied to clipboard."
        : "Copy failed. Please select and copy the text manually.",
      !copied,
    );
  }
}

// 16. Dark and light theme

function applyTheme(theme) {
  const isLight = theme === "light";

  document.body.classList.toggle("light-theme", isLight);

  themeToggle.textContent = isLight ? "🌙" : "☀️";

  themeToggle.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
}

function toggleTheme() {
  const isLight = !document.body.classList.contains("light-theme");

  const theme = isLight ? "light" : "dark";

  applyTheme(theme);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn("Could not save theme preference:", error);
  }
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    applyTheme(savedTheme === "light" ? "light" : "dark");
  } catch (error) {
    applyTheme("dark");
  }
}

// 17. Clear all history

function clearHistory() {
  const history = getHistory();

  if (history.length === 0) {
    showStatus("There is no history to clear.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete all translation history?",
  );

  if (!confirmed) {
    return;
  }

  if (saveHistory([])) {
    renderHistory();
    showStatus("Translation history cleared.");
  }
}

// 18. Event listeners

inputText.addEventListener("input", () => {
  translate();
});

directionSelect.addEventListener("change", () => {
  updateModeLabels();
});

clearButton.addEventListener("click", clearTranslation);

copyButton.addEventListener("click", copyTranslation);

themeToggle.addEventListener("click", toggleTheme);

clearHistoryButton.addEventListener("click", clearHistory);

// 19. Initialize the application

function init() {
  loadTheme();
  updateModeLabels();
  updateCounts();
  renderHistory();
}

init();
