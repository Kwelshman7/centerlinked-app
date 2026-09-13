import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accreditationDisplayLabel,
  accreditationKey,
  accreditationReviewReason,
  displayAccreditations,
  resolveAccreditationBody,
  uniqueAccreditations,
} from "./accreditations.ts";

test("Joint Commission aliases share one key and keep original text", () => {
  assert.equal(accreditationKey("JCAHO"), "joint-commission");
  assert.equal(accreditationKey("The Joint Commission"), "joint-commission");
  assert.equal(accreditationKey("Joint Commission (JCAHO)"), "joint-commission");
  assert.deepEqual(uniqueAccreditations(["JCAHO", "The Joint Commission", "Joint Commission"]), ["JCAHO"]);
  assert.deepEqual(displayAccreditations(["JCAHO", "NAATP Member"]), ["Joint Commission", "NAATP"]);
});

test("NAATP and DCF aliases resolve without inventing a merge", () => {
  assert.equal(resolveAccreditationBody("NAATP Member")?.slug, "naatp");
  assert.equal(resolveAccreditationBody("Florida DCF")?.slug, "dcf");
  assert.equal(accreditationDisplayLabel("DCF Licensed"), "DCF");
});

test("ASAM levels stay uncertain instead of becoming an accreditation", () => {
  assert.match(accreditationReviewReason("ASAM 3.5") ?? "", /level of care/i);
  assert.equal(resolveAccreditationBody("ASAM 3.5"), null);
  assert.equal(uniqueAccreditations(["ASAM 3.5"])[0], "ASAM 3.5");
});
