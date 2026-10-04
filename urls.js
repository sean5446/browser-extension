const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?'"…]+$/;

const CLOSING_BRACKETS = { ")": "(", "]": "[", "}": "{" };

const BARE_HOST_PREFIX = /^www\./i;

function countOccurrences(text, character) {
    let count = 0;
    for (const candidate of text) {
        if (candidate === character) count += 1;
    }
    return count;
}

function stripUnbalancedBrackets(url) {
    let result = url;
    let last = result.at(-1);

    while (CLOSING_BRACKETS[last] && countOccurrences(result, last) > countOccurrences(result, CLOSING_BRACKETS[last])) {
        result = result.slice(0, -1);
        last = result.at(-1);
    }

    return result;
}

export function normalizeUrl(raw) {
    let candidate = raw.trim().replace(TRAILING_PUNCTUATION, "");
    candidate = stripUnbalancedBrackets(candidate);

    if (BARE_HOST_PREFIX.test(candidate)) candidate = `https://${candidate}`;

    try {
        const { protocol, href } = new URL(candidate);
        if (protocol !== "http:" && protocol !== "https:") return null;
        return href;
    } catch {
        return null;
    }
}

export function extractUrls(text) {
    const seen = new Set();

    for (const match of text.match(URL_PATTERN) ?? []) {
        const url = normalizeUrl(match);
        if (url) seen.add(url);
    }

    return [...seen];
}
