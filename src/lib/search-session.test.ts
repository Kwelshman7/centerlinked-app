import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasSearchCriteria,
  rememberSearchSession,
  readSearchSession,
  restoreSearchHref,
  searchSessionForOrg,
  searchWorkHrefFromFilters,
  toSearchWorkHref,
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

test("empty search needs insurance, place, or level of care", () => {
  assert.equal(hasSearchCriteria(new URLSearchParams()), false);
  assert.equal(hasSearchCriteria(new URLSearchParams("planType=ppo")), false);
  assert.equal(hasSearchCriteria(new URLSearchParams("state=FL")), true);
  assert.equal(hasSearchCriteria(new URLSearchParams("payerId=abc")), true);
});

test("legacy results URLs restore onto the work page", () => {
  assert.equal(toSearchWorkHref("/app/search/results?state=FL"), "/app/search?state=FL");
  assert.equal(toSearchWorkHref("/app/search?loc=PHP"), "/app/search?loc=PHP");
  assert.equal(toSearchWorkHref("/app/search"), null);
  assert.equal(
    searchWorkHrefFromFilters({
      payerId: "p1",
      payerName: "Aetna",
      planType: "",
      state: "FL",
      city: "",
      zip: "",
      specialty: "",
      accreditation: "",
      loc: "",
    }),
    "/app/search?payerId=p1&payerName=Aetna&state=FL",
  );
});

test("restoreSearchHref uses the last stored query", () => {
  sessionStorage.clear();
  assert.equal(restoreSearchHref(), null);
  rememberSearchSession({
    returnTo: "/app/search/results?state=FL&loc=PHP",
    summary: "FL",
    orgs,
  });
  assert.equal(restoreSearchHref(), "/app/search?state=FL&loc=PHP");
});
