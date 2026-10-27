
const STORAGE_KEY = "mindfulme_entries_v1";

const today = new Date();
document.getElementById("today").textContent =
  today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

const moodButtons = [...document.querySelectorAll("#moods button")];
const form = document.getElementById("journalForm");

let selectedMood = "";
let entries = loadEntries();

function loadEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(item =>
      item &&
      typeof item.id === "string" &&
      typeof item.date === "string" &&
      typeof item.text === "string" &&
      typeof item.mood === "string"
    );
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    document.getElementById("formMessage").textContent =
      "Could not save. Browser storage may be unavailable or full.";
    return false;
  }
}

// Choose a mood.
moodButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;

    moodButtons.forEach(item =>
      item.classList.toggle("selected", item === button)
    );

    document.getElementById("selectedMood").textContent =
      "Today's mood: " + selectedMood;

    document.getElementById("moodStatus").textContent =
      selectedMood;
  });
});

// Save a journal entry.
form.addEventListener("submit", event => {
  event.preventDefault();

  const text = document.getElementById("entry").value.trim();
  const title = document.getElementById("title").value.trim();
  const gratitude = document.getElementById("gratitude").value.trim();
  const message = document.getElementById("formMessage");

  if (!text) {
    message.textContent = "Please write a little about your day.";
    return;
  }

  if (!selectedMood) {
    message.textContent = "Please select a mood first.";
    return;
  }

  const entry = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
    date: new Date().toISOString(),
    title: title || "My daily reflection",
    text,
    gratitude,
    mood: selectedMood
  };

  entries.unshift(entry);

  if (!saveEntries()) {
    entries.shift();
    return;
  }

  renderEntries();
  form.reset();

  selectedMood = "";
  moodButtons.forEach(button =>
    button.classList.remove("selected")
  );

  document.getElementById("selectedMood").textContent =
    "Choose a mood to begin.";

  message.textContent = "Your entry has been saved on this browser.";
});

// Display saved entries safely using textContent.
function renderEntries() {
  const list = document.getElementById("entriesList");
  const history = document.getElementById("moodHistory");

  list.replaceChildren();
  history.replaceChildren();

  document.getElementById("entryCount").textContent =
    entries.length;

  const uniqueDays = new Set(
    entries.map(item => item.date.slice(0, 10))
  );

  document.getElementById("dayCount").textContent =
    uniqueDays.size;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(item =>
    item.date.slice(0, 10) === todayKey
  );

  document.getElementById("moodStatus").textContent =
    todayEntry ? todayEntry.mood : "Not yet";

  if (entries.length === 0) {
    list.textContent = "No entries yet. Start with a small reflection.";
    history.textContent = "Your mood check-ins will appear here.";
    return;
  }

  entries.slice(0, 5).forEach(item => {
    const article = document.createElement("article");
    article.className = "entry-item";

    const heading = document.createElement("h3");
    heading.textContent = `${moodEmoji(item.mood)} ${item.title}`;

    const date = document.createElement("p");
    date.className = "entry-meta";
    date.textContent = new Date(item.date).toLocaleString();

    const preview = document.createElement("p");
    preview.textContent = item.text.length > 130
      ? item.text.slice(0, 130) + "…"
      : item.text;

    const gratitude = document.createElement("p");
    if (item.gratitude) {
      gratitude.textContent = "Grateful for: " + item.gratitude;
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-entry";
    deleteButton.textContent = "Delete entry";

    deleteButton.addEventListener("click", () => {
      if (!confirm("Delete this journal entry?")) return;

      const previous = entries;
      entries = entries.filter(entry => entry.id !== item.id);

      if (saveEntries()) {
        renderEntries();
      } else {
        entries = previous;
      }
    });

    article.append(heading, date, preview);
    if (item.gratitude) article.append(gratitude);
    article.append(deleteButton);
    list.append(article);
  });

  entries.slice(0, 7).forEach(item => {
    const row = document.createElement("p");
    row.textContent =
      `${moodEmoji(item.mood)} ${item.mood} — ` +
      new Date(item.date).toLocaleDateString();

    history.append(row);
  });
}

function moodEmoji(mood) {
  const emojis = {
    Great: "😊",
    Good: "🙂",
    Okay: "😐",
    Low: "😔",
    Stressed: "😣"
  };

  return emojis[mood] || "🌿";
}

// Rotate through gentle wellness reminders.
const tips = [
  "Take a short break and notice your surroundings.",
  "Write down one small thing you appreciated today.",
  "Stretch gently if you feel comfortable doing so.",
  "Give yourself permission to take things one step at a time.",
  "Consider talking with someone you trust if things feel difficult."
];

let tipIndex = 0;

document.getElementById("tipButton").addEventListener("click", () => {
  tipIndex = (tipIndex + 1) % tips.length;
  document.getElementById("tipText").textContent = tips[tipIndex];
});

document.getElementById("clearButton").addEventListener("click", () => {
  if (!confirm("Permanently delete all journal entries saved by this demo?")) {
    return;
  }

  const previous = entries;
  entries = [];

  if (saveEntries()) {
    renderEntries();
    document.getElementById("formMessage").textContent =
      "All saved entries have been deleted.";
    document.getElementById("selectedMood").textContent =
      "Choose a mood to begin.";

    selectedMood = "";
    moodButtons.forEach(button =>
      button.classList.remove("selected")
    );
  } else {
    entries = previous;
  }
});

// Load existing entries on startup.
renderEntries();
