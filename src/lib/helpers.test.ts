import assert from "node:assert/strict";
import { test } from "node:test";
import { isPartnerVisibleFacility } from "./facility-visibility.ts";
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
