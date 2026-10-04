import { extractUrls } from "./urls.js";

const NOTES_KEY = "notes";
const SAVE_DEBOUNCE_MS = 300;

const notes = document.getElementById("notes");
const linkCount = document.getElementById("linkCount");
const openSelectedButton = document.getElementById("openSelected");
const openAllButton = document.getElementById("openAll");
const addCurrentTabButton = document.getElementById("addCurrentTab");
const statusBar = document.getElementById("status");

let saveTimer = null;
let opening = false;

function setStatus(message, tone = "muted") {
    statusBar.textContent = message;
    statusBar.dataset.tone = tone;
}

function getSelectedText() {
    return notes.value.slice(notes.selectionStart, notes.selectionEnd);
}

function getAllUrls() {
    return extractUrls(notes.value);
}

function refreshTotalCount() {
    const allCount = getAllUrls().length;

    linkCount.textContent = allCount === 1 ? "1 link" : `${allCount} links`;
    openAllButton.textContent = allCount > 0 ? `Open all ${allCount}` : "Open all";
    openAllButton.disabled = allCount === 0;
}

function refreshSelectedCount() {
    const selectedCount = extractUrls(getSelectedText()).length;

    openSelectedButton.textContent =
        selectedCount > 0 ? `Open ${selectedCount} selected` : "Open selected";
    openSelectedButton.disabled = selectedCount === 0;
}

function refreshCounts() {
    refreshTotalCount();
    refreshSelectedCount();
}

function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    setStatus("Saving…");

    chrome.storage.local
        .set({ [NOTES_KEY]: notes.value })
        .then(() => setStatus("Saved", "ok"))
        .catch((error) => setStatus(`Could not save: ${error.message}`, "error"));
}

function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
    setStatus("Saving…");
}

function insertAtCursor(text) {
    const { selectionStart, selectionEnd, value } = notes;
    const needsNewline = selectionStart > 0 && !/\s$/.test(value.slice(0, selectionStart));
    const insertion = `${needsNewline ? "\n" : ""}${text}`;

    notes.value = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);

    const caret = selectionStart + insertion.length;
    notes.setSelectionRange(caret, caret);
    notes.focus();
    refreshCounts();
    saveNow();
}

async function openUrls(urls) {
    if (urls.length === 0) {
        setStatus("No links in the selection", "warn");
        return;
    }

    if (opening) return;
    opening = true;

    try {
        const results = await Promise.allSettled(
            urls.map((url) => chrome.tabs.create({ url, active: false })),
        );

        const opened = results.filter((result) => result.status === "fulfilled").length;
        const failed = results.length - opened;

        if (failed === 0) {
            setStatus(opened === 1 ? "Opened 1 tab" : `Opened ${opened} tabs`, "ok");
        } else if (opened === 0) {
            setStatus(`Could not open any tabs: ${results[0].reason.message}`, "error");
        } else {
            setStatus(`Opened ${opened} of ${urls.length} tabs; ${failed} failed`, "warn");
        }
    } finally {
        opening = false;
    }
}

openSelectedButton.addEventListener("click", () => {
    openUrls(extractUrls(getSelectedText()));
});

openAllButton.addEventListener("click", () => {
    openUrls(getAllUrls());
});

addCurrentTabButton.addEventListener("click", async () => {
    const warnNoAccess = "Can't read this tab's URL — paste it instead";

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url || !/^https?:\/\//i.test(tab.url)) {
            setStatus(warnNoAccess, "warn");
            return;
        }
        insertAtCursor(tab.url);
        setStatus("Added this tab", "ok");
    } catch {
        setStatus(warnNoAccess, "warn");
    }
});

notes.addEventListener("input", () => {
    refreshCounts();
    scheduleSave();
});

for (const event of ["select", "click", "keyup", "mouseup", "focus"]) {
    notes.addEventListener(event, refreshSelectedCount);
}

notes.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        openUrls(extractUrls(getSelectedText()));
    }
});

window.addEventListener("pagehide", () => {
    if (saveTimer) saveNow();
});

async function restore() {
    let loaded = false;

    try {
        const stored = await chrome.storage.local.get(NOTES_KEY);
        const value = stored[NOTES_KEY];
        if (typeof value === "string" && value.length > 0) notes.value = value;
        loaded = true;
    } catch (error) {
        setStatus(`Could not read your saved notes: ${error.message}`, "error");
    }

    requestAnimationFrame(() => {
        notes.setSelectionRange(notes.value.length, notes.value.length);
        refreshCounts();
        notes.focus();
        if (loaded) setStatus("Saved");
    });
}

restore();
