"use strict";

/* ========================================
   MorseFlow - Complete JavaScript
   ======================================== */

/* ---------- DOM Elements ---------- */

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");

const directionSelect = document.getElementById("direction");
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
const historyFilter = document.getElementById("history-filter");
const historyStatus = document.getElementById("history-status");

const exportTxtButton = document.getElementById("export-txt-button");
const exportCsvButton = document.getElementById("export-csv-button");

const audioSpeed = document.getElementById("audio-speed");
const audioFrequency = document.getElementById("audio-frequency");
const playAudioButton = document.getElementById("play-audio-button");
const pauseAudioButton = document.getElementById("pause-audio-button");
const stopAudioButton = document.getElementById("stop-audio-button");
const audioStatus = document.getElementById("audio-status");

const practiceForm = document.getElementById("practice-form");
const practicePrompt = document.getElementById("practice-prompt");
const practiceAnswer = document.getElementById("practice-answer");
const practiceScore = document.getElementById("practice-score");
const practiceFeedback = document.getElementById("practice-feedback");

const startPracticeButton = document.getElementById("start-practice-button");
const checkAnswerButton = document.getElementById("check-answer-button");
const nextQuestionButton = document.getElementById("next-question-button");

const defaultDirection = document.getElementById("default-direction");
const saveHistoryToggle = document.getElementById("save-history-toggle");
const settingsStatus = document.getElementById("settings-status");

/* ---------- Storage Keys ---------- */

const STORAGE_KEYS = {
  history: "morseFlowHistory",
  theme: "morseFlowTheme",
  defaultDirection: "morseFlowDefaultDirection",
  saveHistory: "morseFlowSaveHistory",
};

const MAX_HISTORY_ITEMS = 50;

/* ---------- Morse Code Dictionary ---------- */

const MORSE_CODE = {
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

const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([character, code]) => [code, character]),
);

/* ---------- Application State ---------- */

let historyItems = [];
let historyTimer = null;
let currentAudioContext = null;
let audioCompletionTimer = null;
let audioEndTime = 0;
let audioPaused = false;
let audioPlaying = false;

let practiceActive = false;
let currentPracticeAnswer = "";
let practiceCorrect = 0;
let practiceAttempted = 0;
let practiceAnswered = false;

/* ---------- Safe Local Storage ---------- */

function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    console.warn("Unable to read local storage:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("Unable to save to local storage:", error);
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Unable to remove local storage:", error);
  }
}

function loadHistory() {
  try {
    const stored = readStorage(STORAGE_KEYS.history, "[]");
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.input === "string" &&
          typeof item.output === "string",
      )
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (error) {
    console.warn("Unable to load translation history:", error);
    return [];
  }
}

function saveHistoryToStorage() {
  if (!isHistorySavingEnabled()) {
    return;
  }

  const saved = writeStorage(
    STORAGE_KEYS.history,
    JSON.stringify(historyItems),
  );

  if (!saved) {
    showMessage(
      historyStatus,
      "Could not save history. Check your browser storage settings.",
    );
  }
}

function isHistorySavingEnabled() {
  return readStorage(STORAGE_KEYS.saveHistory, "true") !== "false";
}

/* ---------- Translation Functions ---------- */

function englishToMorse(text) {
  return text
    .toUpperCase()
    .split("")
    .map((character) => {
      if (character === " ") {
        return "/";
      }

      return MORSE_CODE[character] || "?";
    })
    .reduce((result, code) => {
      // Keep spaces between letters and one slash between words.
      if (code === "/") {
        while (result.length && result[result.length - 1] === "") {
          result.pop();
        }

        if (result.length && result[result.length - 1] !== "/") {
          result.push("/");
        }
      } else {
        result.push(code);
      }

      return result;
    }, [])
    .join(" ")
    .replace(/\s*\/\s*/g, " / ")
    .trim();
}

function morseToEnglish(text) {
  const normalized = text.trim().replace(/[•·]/g, ".").replace(/[–—−]/g, "-");

  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\s*\/\s*|\s{3,}/)
    .map((word) => {
      return word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => REVERSE_MORSE[code] || "�")
        .join("");
    })
    .join(" ");
}

function translateText(text, direction) {
  if (!text.trim()) {
    return "";
  }

  if (direction === "morse-to-english") {
    return morseToEnglish(text);
  }

  return englishToMorse(text);
}

/* ---------- Status Messages ---------- */

function showMessage(element, message, type = "info") {
  if (!element) {
    return;
  }

  element.textContent = message;

  element.style.color =
    type === "success"
      ? "var(--success)"
      : type === "error"
        ? "var(--danger)"
        : "var(--text-muted)";
}

/* ---------- Character Counts ---------- */

function updateCharacterCounts() {
  inputCount.textContent = `${inputText.value.length} character${inputText.value.length === 1 ? "" : "s"}`;

  outputCount.textContent = `${outputText.value.length} character${outputText.value.length === 1 ? "" : "s"}`;
}

/* ---------- Direction Labels ---------- */

function updateDirectionLabels() {
  const isEnglishToMorse = directionSelect.value === "english-to-morse";

  inputLabel.textContent = isEnglishToMorse ? "English text" : "Morse code";

  outputLabel.textContent = isEnglishToMorse ? "Morse code" : "English text";

  inputText.placeholder = isEnglishToMorse
    ? "Type English text here..."
    : "Enter Morse code, for example: .... . .-.. .-.. ---";

  outputText.placeholder = isEnglishToMorse
    ? "Your Morse translation will appear here..."
    : "Your English translation will appear here...";

  document.getElementById("input-help").textContent = isEnglishToMorse
    ? "Enter the English text you want to translate."
    : "Use dots, dashes, spaces between letters, and / between words.";

  updateCharacterCounts();
}

/* ---------- Main Translator ---------- */

function translateCurrentText() {
  const translated = translateText(inputText.value, directionSelect.value);

  outputText.value = translated;

  updateCharacterCounts();

  if (!inputText.value.trim()) {
    showMessage(statusMessage, "");
  } else if (
    translated.includes("?") &&
    directionSelect.value === "english-to-morse"
  ) {
    showMessage(
      statusMessage,
      "Some characters are unsupported and are shown as ?.",
    );
  } else if (translated.includes("�")) {
    showMessage(statusMessage, "Some Morse sequences were not recognized.");
  } else {
    showMessage(statusMessage, "Translation updated.", "success");
  }

  scheduleHistorySave();
}

function changeDirection() {
  directionSelect.value =
    directionSelect.value === "english-to-morse"
      ? "morse-to-english"
      : "english-to-morse";

  updateDirectionLabels();
  translateCurrentText();
}

function clearInput() {
  clearTimeout(historyTimer);

  inputText.value = "";
  outputText.value = "";

  updateCharacterCounts();
  showMessage(statusMessage, "Input cleared.");
  inputText.focus();
}

/* ---------- Copy Translation ---------- */

async function copyTranslation() {
  const text = outputText.value;

  if (!text) {
    showMessage(statusMessage, "There is no translation to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showMessage(statusMessage, "Translation copied!", "success");
  } catch (error) {
    // Fallback for browsers where Clipboard API is unavailable.
    outputText.focus();
    outputText.select();

    try {
      const copied = document.execCommand("copy");

      showMessage(
        statusMessage,
        copied
          ? "Translation copied!"
          : "Copy failed. Select the text and copy it manually.",
        copied ? "success" : "error",
      );
    } catch {
      showMessage(
        statusMessage,
        "Copy failed. Select the text and copy it manually.",
        "error",
      );
    }

    window.getSelection()?.removeAllRanges();
  }
}

/* ---------- Theme ---------- */

function applyTheme(theme) {
  const isLight = theme === "light";

  document.body.classList.toggle("light-theme", isLight);

  themeToggle.textContent = isLight ? "🌙" : "☀️";

  themeToggle.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );

  themeToggle.title = isLight
    ? "Switch to dark theme"
    : "Switch to light theme";

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isLight ? "#f5f7ff" : "#0b1020");
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("light-theme")
    ? "light"
    : "dark";

  const newTheme = currentTheme === "light" ? "dark" : "light";

  applyTheme(newTheme);
  writeStorage(STORAGE_KEYS.theme, newTheme);
}

/* ---------- Translation History ---------- */

function scheduleHistorySave() {
  clearTimeout(historyTimer);

  if (!isHistorySavingEnabled()) {
    return;
  }

  if (!inputText.value.trim() || !outputText.value.trim()) {
    return;
  }

  // Wait until the user pauses typing before saving.
  historyTimer = setTimeout(() => {
    saveCurrentTranslation();
  }, 800);
}

function saveCurrentTranslation() {
  if (!isHistorySavingEnabled()) {
    return;
  }

  const input = inputText.value.trim();
  const output = outputText.value.trim();
  const direction = directionSelect.value;

  if (!input || !output) {
    return;
  }

  const newest = historyItems[0];

  // Avoid repeatedly saving an unchanged translation.
  if (
    newest &&
    newest.input === input &&
    newest.output === output &&
    newest.direction === direction
  ) {
    return;
  }

  const item = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    input,
    output,
    direction,
    mode: direction,
    timestamp: new Date().toISOString(),
  };

  historyItems.unshift(item);
  historyItems = historyItems.slice(0, MAX_HISTORY_ITEMS);

  saveHistoryToStorage();
  renderHistory();
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function createHistoryItem(item) {
  const article = document.createElement("article");
  article.className = "history-item";

  const content = document.createElement("div");
  content.className = "history-content";

  const input = document.createElement("p");
  input.className = "history-input";

  const inputHeading = document.createElement("strong");
  inputHeading.textContent =
    item.direction === "morse-to-english" ? "Morse: " : "English: ";

  input.append(inputHeading, document.createTextNode(item.input));

  const output = document.createElement("p");
  output.className = "history-output";

  const outputHeading = document.createElement("strong");
  outputHeading.textContent =
    item.direction === "morse-to-english" ? "English: " : "Morse: ";

  output.append(outputHeading, document.createTextNode(item.output));

  const meta = document.createElement("div");
  meta.className = "history-meta";

  const date = document.createElement("span");
  date.textContent = formatTimestamp(item.timestamp);

  const mode = document.createElement("span");
  mode.textContent =
    item.direction === "morse-to-english"
      ? "Morse → English"
      : "English → Morse";

  meta.append(date, mode);
  content.append(input, output, meta);

  const actions = document.createElement("div");
  actions.className = "history-actions";

  const useButton = document.createElement("button");
  useButton.className = "secondary-button";
  useButton.type = "button";
  useButton.textContent = "Use again";

  useButton.addEventListener("click", () => {
    directionSelect.value = item.direction;
    inputText.value = item.input;

    updateDirectionLabels();
    translateCurrentText();

    document
      .getElementById("translator-section")
      .scrollIntoView({ behavior: "smooth" });

    inputText.focus();
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "text-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteHistoryItem(item.id);
  });

  actions.append(useButton, deleteButton);
  article.append(content, actions);

  return article;
}

function renderHistory() {
  historyList.replaceChildren();

  const filter = historyFilter.value;

  const filteredItems = historyItems.filter((item) => {
    return filter === "all" || item.direction === filter;
  });

  if (filteredItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";

    empty.textContent =
      historyItems.length === 0
        ? "Your translations will appear here."
        : "No translations match this filter.";

    historyList.appendChild(empty);
    return;
  }

  filteredItems.forEach((item) => {
    historyList.appendChild(createHistoryItem(item));
  });
}

function deleteHistoryItem(id) {
  historyItems = historyItems.filter((item) => item.id !== id);

  saveHistoryToStorage();
  renderHistory();

  showMessage(historyStatus, "Translation deleted.", "success");
}

function clearHistory() {
  if (historyItems.length === 0) {
    showMessage(historyStatus, "Your history is already empty.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete all translation history?",
  );

  if (!confirmed) {
    return;
  }

  historyItems = [];
  removeStorage(STORAGE_KEYS.history);

  renderHistory();
  showMessage(historyStatus, "Translation history cleared.", "success");
}

/* ---------- Export History ---------- */

function getExportItems() {
  const filter = historyFilter.value;

  return historyItems.filter((item) => {
    return filter === "all" || item.direction === filter;
  });
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], {
    type: `${mimeType};charset=utf-8;`,
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportHistoryTXT() {
  const items = getExportItems();

  if (items.length === 0) {
    showMessage(historyStatus, "There is no history to export.");
    return;
  }

  const content = items
    .map((item) => {
      return [
        `Date: ${formatTimestamp(item.timestamp)}`,
        `Direction: ${item.direction}`,
        `Input: ${item.input}`,
        `Output: ${item.output}`,
        "-".repeat(35),
      ].join("\n");
    })
    .join("\n\n");

  downloadFile(content, "morseflow-history.txt", "text/plain");

  showMessage(historyStatus, "TXT file exported.", "success");
}

function escapeCSV(value) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function exportHistoryCSV() {
  const items = getExportItems();

  if (items.length === 0) {
    showMessage(historyStatus, "There is no history to export.");
    return;
  }

  const rows = [
    ["Date", "Direction", "Input", "Output"],
    ...items.map((item) => [
      formatTimestamp(item.timestamp),
      item.direction,
      item.input,
      item.output,
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

  // BOM helps spreadsheet programs display UTF-8 correctly.
  downloadFile("\uFEFF" + csv, "morseflow-history.csv", "text/csv");

  showMessage(historyStatus, "CSV file exported.", "success");
}

/* ---------- Morse Audio Player ---------- */

function getAudioMorseCode() {
  // The source of the audio is always Morse code,
  // regardless of the selected translation direction.
  if (directionSelect.value === "english-to-morse") {
    return outputText.value.trim();
  }

  return englishToMorse(outputText.value.trim());
}

function getSpeedUnit() {
  switch (audioSpeed.value) {
    case "slow":
      return 0.18;
    case "fast":
      return 0.06;
    default:
      return 0.1;
  }
}

function updateAudioButtons() {
  playAudioButton.disabled = audioPlaying && !audioPaused;
  pauseAudioButton.disabled = !audioPlaying;
  stopAudioButton.disabled = !audioPlaying;

  if (audioPaused) {
    pauseAudioButton.textContent = "▶ Resume";
  } else {
    pauseAudioButton.textContent = "⏸ Pause";
  }
}

function scheduleMorseAudio(context, code, unit, frequency) {
  const gain = context.createGain();

  gain.gain.value = 0;
  gain.connect(context.destination);

  let time = context.currentTime + 0.08;

  const volume = 0.15;

  for (let index = 0; index < code.length; index++) {
    const symbol = code[index];

    if (symbol === "." || symbol === "-") {
      const duration = symbol === "." ? unit : unit * 3;

      const oscillator = context.createOscillator();
      const toneGain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      toneGain.gain.setValueAtTime(0, time);
      toneGain.gain.linearRampToValueAtTime(volume, time + 0.005);
      toneGain.gain.setValueAtTime(volume, time + duration - 0.005);
      toneGain.gain.linearRampToValueAtTime(0, time + duration);

      oscillator.connect(toneGain);
      toneGain.connect(context.destination);

      oscillator.start(time);
      oscillator.stop(time + duration + 0.01);

      time += duration + unit;
    } else if (symbol === "/") {
      // Extra gap between words.
      time += unit * 6;
    } else if (symbol === " ") {
      // The preceding tone already added a one-unit gap.
      // Add two more units to make the total letter gap three.
      time += unit * 2;
    } else {
      // Unsupported symbols are ignored by the audio player.
      continue;
    }
  }

  return time;
}

async function playMorseAudio() {
  if (audioPlaying && !audioPaused) {
    return;
  }

  if (audioPaused && currentAudioContext) {
    await resumeMorseAudio();
    return;
  }

  const code = getAudioMorseCode();

  if (!code) {
    showMessage(audioStatus, "Translate some text before playing audio.");
    return;
  }

  if (!/[.-]/.test(code)) {
    showMessage(audioStatus, "No playable Morse signals were found.");
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    showMessage(
      audioStatus,
      "Your browser does not support Web Audio.",
      "error",
    );
    return;
  }

  try {
    currentAudioContext = new AudioContextClass();

    if (currentAudioContext.state === "suspended") {
      await currentAudioContext.resume();
    }

    const unit = getSpeedUnit();
    const frequency = Number(audioFrequency.value) || 600;

    audioPlaying = true;
    audioPaused = false;

    const endTime = scheduleMorseAudio(
      currentAudioContext,
      code,
      unit,
      frequency,
    );

    audioEndTime = endTime;

    updateAudioButtons();

    showMessage(audioStatus, "Playing Morse code…", "success");

    const finishInMilliseconds = Math.max(
      0,
      (endTime - currentAudioContext.currentTime) * 1000,
    );

    audioCompletionTimer = setTimeout(() => {
      finishMorseAudio();
    }, finishInMilliseconds + 100);
  } catch (error) {
    console.error("Morse audio playback failed:", error);

    stopMorseAudio();

    showMessage(
      audioStatus,
      "Could not play audio. Please try again.",
      "error",
    );
  }
}

async function pauseMorseAudio() {
  if (!currentAudioContext || !audioPlaying) {
    return;
  }

  if (audioPaused) {
    await resumeMorseAudio();
    return;
  }

  try {
    clearTimeout(audioCompletionTimer);

    await currentAudioContext.suspend();

    audioPaused = true;
    updateAudioButtons();

    showMessage(audioStatus, "Audio paused.");
  } catch (error) {
    console.error("Unable to pause audio:", error);
    showMessage(audioStatus, "Could not pause audio.", "error");
  }
}

async function resumeMorseAudio() {
  if (!currentAudioContext || !audioPaused) {
    return;
  }

  try {
    await currentAudioContext.resume();

    audioPaused = false;
    updateAudioButtons();

    const remaining = Math.max(
      0,
      (audioEndTime - currentAudioContext.currentTime) * 1000,
    );

    audioCompletionTimer = setTimeout(() => {
      finishMorseAudio();
    }, remaining + 100);

    showMessage(audioStatus, "Playing Morse code…", "success");
  } catch (error) {
    console.error("Unable to resume audio:", error);
    showMessage(audioStatus, "Could not resume audio.", "error");
  }
}

async function finishMorseAudio() {
  clearTimeout(audioCompletionTimer);

  const context = currentAudioContext;

  currentAudioContext = null;
  audioPlaying = false;
  audioPaused = false;

  updateAudioButtons();

  if (context) {
    try {
      await context.close();
    } catch (error) {
      console.warn("Unable to close audio context:", error);
    }
  }

  showMessage(audioStatus, "Playback finished.", "success");
}

async function stopMorseAudio() {
  clearTimeout(audioCompletionTimer);

  const context = currentAudioContext;

  currentAudioContext = null;
  audioPlaying = false;
  audioPaused = false;

  updateAudioButtons();

  if (context) {
    try {
      await context.close();
    } catch (error) {
      console.warn("Unable to stop audio cleanly:", error);
    }
  }

  showMessage(audioStatus, "Playback stopped.");
}

/* ---------- Practice Mode ---------- */

const PRACTICE_WORDS = [
  "SOS",
  "HELLO",
  "WORLD",
  "CODE",
  "MORSE",
  "HELP",
  "TEST",
  "RADIO",
  "SIGNAL",
  "LEARN",
  "JAVASCRIPT",
  "FRIEND",
  "GOOD",
  "NIGHT",
  "THANKS",
  "YES",
  "NO",
  "START",
  "STOP",
  "READY",
];

function updatePracticeScore() {
  practiceScore.textContent = `${practiceCorrect} / ${practiceAttempted}`;
}

function generatePracticeQuestion() {
  const index = Math.floor(Math.random() * PRACTICE_WORDS.length);

  currentPracticeAnswer = PRACTICE_WORDS[index];
  practicePrompt.textContent = englishToMorse(currentPracticeAnswer);

  practiceAnswer.value = "";
  practiceAnswer.disabled = false;

  checkAnswerButton.disabled = false;
  nextQuestionButton.disabled = true;

  practiceAnswered = false;

  showMessage(practiceFeedback, "");
  practiceAnswer.focus();
}

function startPractice() {
  practiceActive = true;
  practiceCorrect = 0;
  practiceAttempted = 0;

  updatePracticeScore();

  startPracticeButton.textContent = "Restart practice";

  generatePracticeQuestion();
}

function checkPracticeAnswer(event) {
  event.preventDefault();

  if (!practiceActive || practiceAnswered) {
    return;
  }

  const answer = practiceAnswer.value.trim().toUpperCase();

  if (!answer) {
    showMessage(practiceFeedback, "Enter your answer first.");
    practiceAnswer.focus();
    return;
  }

  practiceAnswered = true;
  practiceAttempted++;

  if (answer === currentPracticeAnswer) {
    practiceCorrect++;

    showMessage(practiceFeedback, "Correct! Well done.", "success");
  } else {
    showMessage(
      practiceFeedback,
      `Not quite. The correct answer is ${currentPracticeAnswer}.`,
      "error",
    );
  }

  updatePracticeScore();

  practiceAnswer.disabled = true;
  checkAnswerButton.disabled = true;
  nextQuestionButton.disabled = false;
}

function nextPracticeQuestion() {
  if (!practiceActive) {
    return;
  }

  generatePracticeQuestion();
}

/* ---------- Preferences ---------- */

function applyDefaultDirection(direction) {
  const validDirections = ["english-to-morse", "morse-to-english"];

  const selected = validDirections.includes(direction)
    ? direction
    : "english-to-morse";

  directionSelect.value = selected;
  defaultDirection.value = selected;

  updateDirectionLabels();
}

function changeDefaultDirection() {
  writeStorage(STORAGE_KEYS.defaultDirection, defaultDirection.value);

  applyDefaultDirection(defaultDirection.value);

  // Change the active translation mode too.
  translateCurrentText();

  showMessage(settingsStatus, "Default translation mode saved.", "success");
}

function changeSaveHistoryPreference() {
  const enabled = saveHistoryToggle.checked;

  writeStorage(STORAGE_KEYS.saveHistory, enabled ? "true" : "false");

  if (!enabled) {
    clearTimeout(historyTimer);

    showMessage(
      settingsStatus,
      "History saving is off. Existing history has been kept.",
    );
  } else {
    showMessage(settingsStatus, "History saving is on.", "success");

    // Save the current translation if one is available.
    scheduleHistorySave();
  }
}

/* ---------- Event Listeners ---------- */

inputText.addEventListener("input", translateCurrentText);

directionSelect.addEventListener("change", () => {
  updateDirectionLabels();
  translateCurrentText();
});

clearButton.addEventListener("click", clearInput);
copyButton.addEventListener("click", copyTranslation);

themeToggle.addEventListener("click", toggleTheme);

clearHistoryButton.addEventListener("click", clearHistory);
historyFilter.addEventListener("change", renderHistory);

exportTxtButton.addEventListener("click", exportHistoryTXT);
exportCsvButton.addEventListener("click", exportHistoryCSV);

playAudioButton.addEventListener("click", playMorseAudio);
pauseAudioButton.addEventListener("click", pauseMorseAudio);
stopAudioButton.addEventListener("click", stopMorseAudio);

startPracticeButton.addEventListener("click", startPractice);
practiceForm.addEventListener("submit", checkPracticeAnswer);

nextQuestionButton.addEventListener("click", nextPracticeQuestion);

defaultDirection.addEventListener("change", changeDefaultDirection);

saveHistoryToggle.addEventListener("change", changeSaveHistoryPreference);

/* ---------- Initialize Application ---------- */

function initializeMorseFlow() {
  // Restore the saved theme.
  const savedTheme = readStorage(STORAGE_KEYS.theme, "dark");

  applyTheme(savedTheme === "light" ? "light" : "dark");

  // Restore preferences.
  const savedDirection = readStorage(
    STORAGE_KEYS.defaultDirection,
    "english-to-morse",
  );

  applyDefaultDirection(savedDirection);

  saveHistoryToggle.checked = isHistorySavingEnabled();

  // Restore translation history.
  historyItems = loadHistory();
  renderHistory();

  // Initialize translator and counters.
  translateCurrentText();
  updateCharacterCounts();

  // Set initial audio controls.
  updateAudioButtons();

  // Set the initial practice score.
  updatePracticeScore();

  showMessage(audioStatus, "Translate some text to get started.");
}

initializeMorseFlow();

/* =========================================
   MORSEFLOW: ALPHABET BOOK
   ========================================= */

(() => {
  const alphabetGrid = document.getElementById("alphabet-grid");
  const alphabetSearch = document.getElementById("alphabet-search");
  const alphabetFilters = document.querySelectorAll(".alphabet-filter");
  const alphabetResults = document.getElementById("alphabet-results");
  const alphabetCopyFeedback = document.getElementById(
    "alphabet-copy-feedback",
  );

  if (!alphabetGrid || typeof MORSE_CODE === "undefined") {
    console.warn(
      "MorseFlow: Alphabet Book elements or MORSE_CODE are missing.",
    );
    return;
  }

  let activeCategory = "all";

  function getCategory(character) {
    if (/^[A-Z]$/i.test(character)) return "letters";
    if (/^[0-9]$/.test(character)) return "numbers";
    return "punctuation";
  }

  function renderAlphabetBook() {
    const query = (alphabetSearch?.value || "").trim().toUpperCase();

    const entries = Object.entries(MORSE_CODE).filter(([character, code]) => {
      const matchesCategory =
        activeCategory === "all" || getCategory(character) === activeCategory;

      const matchesSearch =
        character.toUpperCase().includes(query) || code.includes(query);

      return matchesCategory && matchesSearch;
    });

    alphabetGrid.replaceChildren();

    if (entries.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "alphabet-empty";
      emptyMessage.textContent = "No matching Morse code entries found.";
      alphabetGrid.appendChild(emptyMessage);

      if (alphabetResults) {
        alphabetResults.textContent = "No entries found.";
      }
      return;
    }

    entries.forEach(([character, code]) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "alphabet-card";
      card.setAttribute(
        "aria-label",
        `Copy Morse code for ${character}: ${code}`,
      );

      const characterElement = document.createElement("span");
      characterElement.className = "alphabet-character";
      characterElement.textContent = character;

      const codeElement = document.createElement("span");
      codeElement.className = "alphabet-code";
      codeElement.textContent = code;

      const categoryElement = document.createElement("span");
      categoryElement.className = "alphabet-category";
      categoryElement.textContent = getCategory(character);

      card.append(characterElement, codeElement, categoryElement);

      card.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code);

          if (alphabetCopyFeedback) {
            alphabetCopyFeedback.textContent = `Copied ${character}: ${code}`;
          }
        } catch (error) {
          if (alphabetCopyFeedback) {
            alphabetCopyFeedback.textContent =
              "Clipboard access failed. Please try again.";
          }
          console.error("Could not copy Morse code:", error);
        }
      });

      alphabetGrid.appendChild(card);
    });

    if (alphabetResults) {
      alphabetResults.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"} found.`;
    }
  }

  alphabetSearch?.addEventListener("input", renderAlphabetBook);

  alphabetFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";

      alphabetFilters.forEach((filter) => {
        const isActive = filter === button;

        filter.classList.toggle("active", isActive);
        filter.setAttribute("aria-pressed", String(isActive));
      });

      renderAlphabetBook();
    });
  });

  renderAlphabetBook();
})();

/* =========================================
   MORSEFLOW: AUDIO VISUALIZER
   ========================================= */

(() => {
  const visualizer = document.getElementById("morse-visualizer");
  const visualizerStatus = document.getElementById("visualizer-status");
  const audioStatus = document.getElementById("audio-status");

  const playButton = document.getElementById("play-audio-button");
  const pauseButton = document.getElementById("pause-audio-button");
  const stopButton = document.getElementById("stop-audio-button");

  if (!visualizer) return;

  function setVisualizerState(state, label) {
    visualizer.dataset.state = state;

    if (visualizerStatus) {
      visualizerStatus.textContent = label;
    }

    const accessibleLabels = {
      playing: "Morse audio visualization. Audio is playing.",
      paused: "Morse audio visualization. Audio is paused.",
      stopped: "Morse audio visualization. Audio is stopped.",
    };

    visualizer.setAttribute(
      "aria-label",
      accessibleLabels[state] || "Morse audio visualization.",
    );
  }

  playButton?.addEventListener("click", () => {
    // Allow the existing audio handler to start playback first.
    requestAnimationFrame(() => {
      const statusText = audioStatus?.textContent?.toLowerCase() || "";

      if (statusText.includes("error") || statusText.includes("failed")) {
        setVisualizerState("stopped", "Audio unavailable");
        return;
      }

      setVisualizerState("playing", "Playing");
    });
  });

  pauseButton?.addEventListener("click", () => {
    requestAnimationFrame(() => {
      const statusText = audioStatus?.textContent?.toLowerCase() || "";

      if (statusText.includes("resum") || statusText.includes("play")) {
        setVisualizerState("playing", "Playing");
      } else {
        setVisualizerState("paused", "Paused");
      }
    });
  });

  stopButton?.addEventListener("click", () => {
    setVisualizerState("stopped", "Stopped");
  });

  // Keep the visualizer in sync when the existing audio code
  // updates its status message.
  if (audioStatus) {
    const statusObserver = new MutationObserver(() => {
      const message = audioStatus.textContent.toLowerCase();

      if (
        message.includes("finished") ||
        message.includes("completed") ||
        message.includes("stopped")
      ) {
        setVisualizerState("stopped", "Ready");
      } else if (message.includes("paused")) {
        setVisualizerState("paused", "Paused");
      } else if (message.includes("error") || message.includes("failed")) {
        setVisualizerState("stopped", "Audio unavailable");
      }
    });

    statusObserver.observe(audioStatus, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  setVisualizerState("stopped", "Ready");
})();
