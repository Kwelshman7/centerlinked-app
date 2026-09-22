import assert from "node:assert/strict";
import { test } from "node:test";
import { orgInviteEmail } from "./templates.mjs";

test("org invite email keeps the invited address on join and sign-in links", () => {
  const mail = orgInviteEmail({
    organizationName: "Flyland",
    inviterName: "Kyle",
    roleAtOrg: "bd_rep",
    email: "rep@example.com",
  });
  assert.match(mail.html, /\/join\?email=rep%40example\.com/);
  assert.match(mail.html, /\/login\?email=rep%40example\.com/);
  assert.match(mail.text, /\/join\?email=rep%40example\.com/);
  assert.match(mail.text, /\/login\?email=rep%40example\.com/);
  assert.match(mail.text, /Create your account/);
});
