# Link Notepad

A browser extension that is basically a notepad for links.

Click the toolbar icon, get a textarea. Paste links in whatever shape you like — a
bare list, a paragraph of notes with links buried in it, markdown, whatever. Then
drag-highlight some text and press **Open selected**, and every link inside that
selection opens as a background tab.

Your notes are saved automatically to `storage.local`, so they survive browser
restarts and are waiting for you the next time you click the icon.

## Features

- **Open selected** — highlights a range of text, opens every URL inside it. The
  button label tells you how many it found before you commit.
- **Open all** — opens every URL in the whole notepad.
- **+ Add this tab** — appends the address of the page you're currently looking
  at, without leaving it.
- **Ctrl/Cmd+Enter** — same as *Open selected*.
- **Autosave** — writes ~300ms after you stop typing, and flushes immediately if
  you close the popup mid-keystroke.
- **Deduplication** — the same link twice in one batch opens once.
- **Dark mode** — follows your OS setting.

Tabs open **unfocused**, so opening twelve links just piles them up in your tab
strip for you to pick from.

## Installing

No build step and no dependencies. Load the folder directly.

**Chrome / Edge / Brave**

1. Visit `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

**Firefox**

1. Visit `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Pick `manifest.json` in this folder.

Firefox's temporary add-ons are removed when you close the browser. To keep it,
[sign a temporary build with your own key](https://extensionworkshop.com/documentation/publish/add-on-pausing-and-updating/)
or install it permanently. In Chrome, loaded-unpacked extensions persist across
restarts and only need reloading after you edit a file.

## Permissions

| Permission  | Why |
| ----------- | --- |
| `storage`   | Saving your notepad. Required. |
| `activeTab` | Reading the current tab's URL for *+ Add this tab*. Granted only when you click the toolbar icon. |

That's the whole list. Notably there is no `tabs` permission and no content
script, so the extension does not inject anything into any page and asks for no
host access anywhere. Opening new tabs via `chrome.tabs.create` needs no
permission at all.

## How link extraction works

All of it lives in `urls.js`, which is pure functions with no browser APIs, so
it's easy to test and reason about.

- URLs are found with a regex, so they're recognised anywhere in the text.
- Sentence punctuation that tends to get glued onto a link is trimmed:
  `see https://example.com/x.` and `(see https://example.com/x)` both resolve to
  `https://example.com/x`.
- A closing bracket that the URL itself balances is kept, so
  `https://en.wikipedia.org/wiki/Foo_(bar)` survives intact.
- A bare `www.example.com` is upgraded to `https://www.example.com/`.
- Duplicates are collapsed after normalisation, so `HTTP://A.com` and
  `http://a.com/` count once.
- **Only `http:` and `https:` are ever returned.** Anything else — `javascript:`,
  `data:`, `file:`, `chrome:` — is dropped. The notepad is free text you paste
  into, so this is a hard boundary rather than a filter: no string in your
  notepad can open anything other than a web page.

## Tests

```sh
npm test
```

Runs `urls.test.js` against Node's built-in test runner. Node is used only for
tests; the extension itself needs no toolchain.
