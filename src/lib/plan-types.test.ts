import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contractMatchesPlanType,
  formatPlanTypeList,
  parsePlanTypeParam,
  sanitizePlanTypes,
} from "./plan-types.ts";

test("sanitizePlanTypes drops unknown slugs and blanks", () => {
  assert.deepEqual(sanitizePlanTypes(["PPO", "hmo", "localplus", "", "ppo"]), ["ppo", "hmo"]);
  assert.deepEqual(sanitizePlanTypes(null), []);
  assert.deepEqual(sanitizePlanTypes("ppo"), []);
});

test("parsePlanTypeParam accepts only known slugs", () => {
  assert.equal(parsePlanTypeParam("medicare_advantage"), "medicare_advantage");
  assert.equal(parsePlanTypeParam("LocalPlus"), "");
  assert.equal(parsePlanTypeParam(null), "");
});

test("empty plan_types never matches a named type", () => {
  assert.equal(contractMatchesPlanType([], "ppo"), false);
  assert.equal(contractMatchesPlanType(null, "ppo"), false);
  assert.equal(contractMatchesPlanType(["hmo"], "ppo"), false);
  assert.equal(contractMatchesPlanType(["ppo", "hmo"], "ppo"), true);
  assert.equal(contractMatchesPlanType([], ""), true);
  assert.equal(contractMatchesPlanType(["hmo"], null), true);
});

test("formatPlanTypeList uses short labels", () => {
  assert.equal(formatPlanTypeList(["ppo", "marketplace"]), "PPO, Marketplace");
  assert.equal(formatPlanTypeList([]), "");
});
