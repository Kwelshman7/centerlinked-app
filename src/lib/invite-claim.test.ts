import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveInviteClaim } from "./invite-claim.ts";

test("fresh invite claim needs joined plus organization id", () => {
  assert.deepEqual(
    resolveInviteClaim({ joined: true, organization_id: "org-1" }),
    { joined: true, organization_id: "org-1", alreadyInOrg: false },
  );
  assert.deepEqual(
    resolveInviteClaim({ joined: true }),
    { joined: false, organization_id: undefined, alreadyInOrg: false },
  );
});

test("already_in_org uses the profile org id so a stale client still unlocks", () => {
  assert.deepEqual(
    resolveInviteClaim({
      joined: false,
      reason: "already_in_org",
      profileOrganizationId: "org-2",
    }),
    { joined: true, organization_id: "org-2", alreadyInOrg: true },
  );
});

test("already_in_org uses membership when the profile org id is still blank", () => {
  assert.deepEqual(
    resolveInviteClaim({
      reason: "already_in_org",
      membershipOrganizationId: "org-3",
    }),
    { joined: true, organization_id: "org-3", alreadyInOrg: true },
  );
});

test("already_in_org prefers the profile org id over membership", () => {
  assert.deepEqual(
    resolveInviteClaim({
      reason: "already_in_org",
      profileOrganizationId: "org-2",
      membershipOrganizationId: "org-3",
    }),
    { joined: true, organization_id: "org-2", alreadyInOrg: true },
  );
});

test("accepted invite with empty profile org recovers from membership", () => {
  assert.deepEqual(
    resolveInviteClaim({
      joined: false,
      membershipOrganizationId: "org-4",
    }),
    { joined: true, organization_id: "org-4", alreadyInOrg: false },
  );
});
