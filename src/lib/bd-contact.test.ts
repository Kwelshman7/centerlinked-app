import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bdContactStatusLabel,
  bdFieldsFromUser,
  hasAssignedBdContact,
  isBdContactVerified,
  normalizeBdEmail,
} from "./bd-contact.ts";

test("assigned BD requires a name plus phone or email", () => {
  assert.equal(hasAssignedBdContact({ bd_contact_name: "Ada" }), false);
  assert.equal(
    hasAssignedBdContact({ bd_contact_name: "Ada", bd_contact_email: "ada@org.com" }),
    true,
  );
  assert.equal(hasAssignedBdContact({ bd_contact_email: "ada@org.com" }), false);
});

test("verified requires an actual verification timestamp", () => {
  const assigned = { bd_contact_name: "Ada", bd_contact_phone: "555-0100" };
  assert.equal(isBdContactVerified(assigned), false);
  assert.equal(bdContactStatusLabel(assigned), "Contact not yet verified");
  assert.equal(
    isBdContactVerified({ ...assigned, bd_contact_verified_at: "2026-09-13T00:00:00.000Z" }),
    true,
  );
});

test("normalizeBdEmail rejects blanks and invalid values", () => {
  assert.equal(normalizeBdEmail("  Ada@Org.com "), "ada@org.com");
  assert.equal(normalizeBdEmail("not-an-email"), null);
});

test("bdFieldsFromUser trims profile fields for a first-facility prefill", () => {
  assert.deepEqual(
    bdFieldsFromUser({
      full_name: "  Ada Lovelace  ",
      email: " ada@org.com ",
      phone: " 555-0100 ",
    }),
    {
      bd_contact_name: "Ada Lovelace",
      bd_contact_phone: "555-0100",
      bd_contact_email: "ada@org.com",
    },
  );
  assert.deepEqual(bdFieldsFromUser(null), {
    bd_contact_name: "",
    bd_contact_phone: "",
    bd_contact_email: "",
  });
});
