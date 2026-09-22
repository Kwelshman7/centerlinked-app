import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consumeFirstRunSignup,
  fullNameFromAuthUser,
  isFirstRunUser,
  isLikelyNewUser,
  setFirstRunSignup,
} from "./auth-user.ts";
import { isPartnerVisibleFacility } from "./facility-visibility.ts";

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
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
import { resolveStateCode, stateMatchesFilter } from "./us-states.ts";
import { buildPayerOrFilter, contractMatchesPayer } from "./match-payer.ts";

test("partner visibility requires approved and not frozen", () => {
  assert.equal(
    isPartnerVisibleFacility({ verification_status: "approved", verification_frozen: false }),
    true,
  );
  assert.equal(
    isPartnerVisibleFacility({ verification_status: "pending", verification_frozen: false }),
    false,
  );
  assert.equal(
    isPartnerVisibleFacility({ verification_status: "approved", verification_frozen: true }),
    false,
  );
  assert.equal(
    isPartnerVisibleFacility(
      { verification_status: "approved", verification_frozen: false, hidden_from_org_page: true },
      { honorHiddenFromOrgPage: true },
    ),
    false,
  );
});

test("California and CA are the same search state", () => {
  assert.equal(resolveStateCode("California"), "CA");
  assert.equal(resolveStateCode("ca"), "CA");
  assert.equal(stateMatchesFilter("California", "CA"), true);
  assert.equal(stateMatchesFilter("CA", "California"), true);
  assert.equal(stateMatchesFilter("NY", "CA"), false);
});

test("payer or-filter includes id and name", () => {
  const filter = buildPayerOrFilter({ id: "11111111-1111-1111-1111-111111111111", name: "Aetna" });
  assert.match(filter, /payer_id/);
  assert.match(filter, /Aetna/i);
});

test("contractMatchesPayer matches by id", () => {
  assert.equal(
    contractMatchesPayer(
      { payer_id: "abc", payer_name: "Other" },
      { id: "abc", name: "Aetna" },
    ),
    true,
  );
});

test("isLikelyNewUser is true only for accounts created in the last two minutes", () => {
  assert.equal(isLikelyNewUser(undefined), false);
  assert.equal(isLikelyNewUser("not-a-date"), false);
  assert.equal(isLikelyNewUser(new Date(Date.now() - 30_000).toISOString()), true);
  assert.equal(isLikelyNewUser(new Date(Date.now() - 5 * 60_000).toISOString()), false);
});

test("first-run flag survives a delayed email confirm in another tab", () => {
  localStorage.clear();
  const older = new Date(Date.now() - 10 * 60_000).toISOString();
  assert.equal(isFirstRunUser(older), false);
  setFirstRunSignup();
  assert.equal(isFirstRunUser(older), true);
  assert.equal(consumeFirstRunSignup(), true);
  assert.equal(isFirstRunUser(older), false);
  assert.equal(consumeFirstRunSignup(), false);
});

test("first-run flag expires after 24 hours", () => {
  localStorage.clear();
  const older = new Date(Date.now() - 10 * 60_000).toISOString();
  localStorage.setItem("cl_first_run", String(Date.now() - 25 * 60 * 60 * 1000));
  assert.equal(isFirstRunUser(older), false);
  assert.equal(consumeFirstRunSignup(), false);
});

test("fullNameFromAuthUser prefers signup full_name then Google name", () => {
  assert.equal(fullNameFromAuthUser(null), null);
  assert.equal(fullNameFromAuthUser({ user_metadata: { full_name: "  Ada Lovelace  " } }), "Ada Lovelace");
  assert.equal(fullNameFromAuthUser({ user_metadata: { name: " Ada " } }), "Ada");
  assert.equal(
    fullNameFromAuthUser({ user_metadata: { full_name: "Ada Lovelace", name: "Ada" } }),
    "Ada Lovelace",
  );
  assert.equal(fullNameFromAuthUser({ user_metadata: { full_name: "   " } }), null);
});
