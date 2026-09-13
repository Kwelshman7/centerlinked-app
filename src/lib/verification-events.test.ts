import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseVerificationAction,
  parseVerificationEntityType,
  verificationEventPayload,
  VERIFICATION_DISCLAIMER,
} from "./verification-events.ts";

test("only known entity types and actions are accepted", () => {
  assert.equal(parseVerificationEntityType("insurance_contract"), "insurance_contract");
  assert.equal(parseVerificationEntityType("payer"), null);
  assert.equal(parseVerificationAction("verified_contact"), "verified_contact");
  assert.equal(parseVerificationAction("guaranteed_coverage"), null);
});

test("disclaimer does not claim CenterLinked confirms benefits", () => {
  assert.match(VERIFICATION_DISCLAIMER, /does not confirm benefits/i);
});

test("event payload requires a facility and a known action", () => {
  const ok = verificationEventPayload({
    facilityId: "fac-1",
    entityType: "bd_contact",
    action: "verified_contact",
  });
  assert.equal(ok.ok, true);
  assert.equal(
    verificationEventPayload({
      facilityId: "",
      entityType: "bd_contact",
      action: "verified_contact",
    }).ok,
    false,
  );
});
