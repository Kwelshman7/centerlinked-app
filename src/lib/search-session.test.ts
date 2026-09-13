import assert from "node:assert/strict";
import { test } from "node:test";
import {
  rememberSearchSession,
  readSearchSession,
  searchSessionForOrg,
} from "./search-session.ts";

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => memory.clear(),
};
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });

const orgs = [
  { slug: "1st-step", name: "1st Step", logo_url: null },
  { slug: "banyan", name: "Banyan", logo_url: null },
];

test("remembers a search and only returns it for orgs in that result set", () => {
  sessionStorage.clear();
  rememberSearchSession({
    returnTo: "/app/search/results?state=FL",
    summary: "FL",
    orgs,
  });
  assert.equal(readSearchSession()?.returnTo, "/app/search/results?state=FL");
  assert.equal(searchSessionForOrg("1st-step")?.orgs.length, 2);
  assert.equal(searchSessionForOrg("unknown-org"), null);
});

test("ignores paths that are not app search", () => {
  sessionStorage.clear();
  rememberSearchSession({
    returnTo: "/o/1st-step",
    summary: "FL",
    orgs,
  });
  assert.equal(readSearchSession(), null);
});
