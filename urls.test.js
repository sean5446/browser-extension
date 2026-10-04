import test from "node:test";
import assert from "node:assert/strict";

import { extractUrls, normalizeUrl } from "./urls.js";

test("extracts a bare url", () => {
  assert.deepEqual(extractUrls("https://example.com"), ["https://example.com/"]);
});

test("strips trailing sentence punctuation", () => {
  assert.deepEqual(extractUrls("See https://example.com."), ["https://example.com/"]);
  assert.deepEqual(extractUrls("https://example.com, then"), ["https://example.com/"]);
  assert.deepEqual(extractUrls("Read https://example.com/x; next"), ["https://example.com/x"]);
  assert.deepEqual(extractUrls("Wow https://example.com/x..."), ["https://example.com/x"]);
  assert.deepEqual(extractUrls("Odd https://example.com/x?"), ["https://example.com/x"]);
});

test("strips a closing bracket that belongs to the surrounding prose", () => {
  assert.deepEqual(extractUrls("(see https://example.com/x)"), ["https://example.com/x"]);
  assert.deepEqual(extractUrls("[https://example.com]"), ["https://example.com/"]);
  assert.deepEqual(extractUrls("(https://example.com))"), ["https://example.com/"]);
});

test("keeps a closing bracket that the url itself balances", () => {
  assert.deepEqual(extractUrls("https://en.wikipedia.org/wiki/Foo_(bar)"), [
    "https://en.wikipedia.org/wiki/Foo_(bar)",
  ]);
});

test("keeps the markdown link target and drops the label", () => {
  assert.deepEqual(extractUrls("[label](https://example.com)"), ["https://example.com/"]);
});

test("upgrades a bare www host to https", () => {
    assert.deepEqual(extractUrls("www.example.com"), ["https://www.example.com/"]);
});

test("upgrades a bare www host whatever its casing", () => {
  assert.deepEqual(extractUrls("WWW.Example.com"), ["https://www.example.com/"]);
  assert.deepEqual(extractUrls("Www.Example.com"), ["https://www.example.com/"]);
  assert.deepEqual(extractUrls("wWw.example.com"), ["https://www.example.com/"]);
});

test("preserves ports, query strings and fragments", () => {
  assert.deepEqual(extractUrls("https://example.com:8080/x?a=1&b=2#frag"), [
    "https://example.com:8080/x?a=1&b=2#frag",
  ]);
});

test("finds urls on separate lines and treats whitespace as a separator", () => {
  const notes = "https://a.com\n\nhttps://b.com\t https://c.com";
  assert.deepEqual(extractUrls(notes), [
    "https://a.com/",
    "https://b.com/",
    "https://c.com/",
  ]);
});

test("finds urls embedded mid-sentence", () => {
  assert.deepEqual(extractUrls("todo: check https://a.com and www.b.com later"), [
    "https://a.com/",
    "https://www.b.com/",
  ]);
});

test("deduplicates repeated urls", () => {
  assert.deepEqual(extractUrls("https://a.com\nhttps://a.com/\nhttps://a.com"), [
    "https://a.com/",
  ]);
});

test("deduplicates urls that differ only by case or trailing slash", () => {
  assert.deepEqual(extractUrls("HTTP://A.com and http://a.com/"), ["http://a.com/"]);
});

test("returns nothing for prose with no urls", () => {
  assert.deepEqual(extractUrls("just some notes about links"), []);
  assert.deepEqual(extractUrls(""), []);
});

test("rejects url-shaped fragments that cannot be parsed", () => {
  assert.deepEqual(extractUrls("https://"), []);
  assert.deepEqual(extractUrls("check www. for details"), []);
});

test("does not match a scheme glued to a preceding word", () => {
  assert.deepEqual(extractUrls("xhttps://example.com"), []);
});

test("normalizeUrl refuses non-web schemes", () => {
  assert.equal(normalizeUrl("javascript:alert(1)"), null);
  assert.equal(normalizeUrl("data:text/html,<h1>hi</h1>"), null);
  assert.equal(normalizeUrl("file:///etc/passwd"), null);
  assert.equal(normalizeUrl("chrome://settings"), null);
  assert.equal(normalizeUrl("ftp://example.com"), null);
});

test("normalizeUrl accepts web schemes", () => {
  assert.equal(normalizeUrl("http://example.com"), "http://example.com/");
  assert.equal(normalizeUrl("https://example.com"), "https://example.com/");
});
