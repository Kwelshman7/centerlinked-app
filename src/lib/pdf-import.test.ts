import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeContractDrafts,
  parsedFacilityContractDrafts,
  reviewImportGaps,
} from "./pdf-import.ts";

const payers = [{ id: "payer-aetna", name: "Aetna", aliases: ["Aetna"] }];

test("imported in-network payers are reported, not verified", () => {
  const drafts = parsedFacilityContractDrafts(
    {
      name: "Harbor",
      payers_in_network: ["Aetna"],
      payers_out_of_network: [],
    },
    payers,
  );
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].payer_name, "Aetna");
  assert.equal(drafts[0].in_network, true);
  assert.equal(drafts[0].contract_status, "active");
  assert.equal(drafts[0].original_imported_value, "Aetna");
  assert.equal(drafts[0].verified_at, null);
});

test("a name listed as both in-network and OON stays in-network", () => {
  const drafts = parsedFacilityContractDrafts(
    {
      name: "Harbor",
      payers_in_network: ["Aetna"],
      payers_out_of_network: ["Aetna"],
    },
    payers,
  );
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].in_network, true);
  assert.equal(drafts[0].contract_status, "active");
  assert.equal(drafts[0].verified_at, null);
});

test("PDF out-of-network names stay explicit OON and keep the original label", () => {
  const drafts = parsedFacilityContractDrafts(
    {
      name: "Harbor",
      payers_in_network: [],
      payers_out_of_network: ["Local Plan XYZ"],
    },
    [],
  );
  assert.equal(drafts[0].in_network, false);
  assert.equal(drafts[0].contract_status, "out_of_network");
  assert.equal(drafts[0].original_imported_value, "Local Plan XYZ");
  assert.equal(drafts[0].payer_name, "Local Plan XYZ");
});

test("merge keeps existing contracts and does not invent verification", () => {
  const merged = mergeContractDrafts(
    [
      {
        payer_id: "payer-aetna",
        payer_name: "Aetna",
        in_network: true,
        plan_types: [],
        contract_status: "active",
        verified_at: "2026-09-01T00:00:00.000Z",
        original_imported_value: "Aetna Inc",
      },
    ],
    parsedFacilityContractDrafts({ name: "Harbor", payers_in_network: ["Aetna", "Cigna"] }, payers),
  );
  assert.equal(merged.length, 2);
  const aetna = merged.find((row) => row.payer_name === "Aetna");
  assert.equal(aetna?.verified_at, "2026-09-01T00:00:00.000Z");
  const cigna = merged.find((row) => row.payer_name === "Cigna");
  assert.equal(cigna?.verified_at, null);
  assert.equal(cigna?.original_imported_value, "Cigna");
});

test("review gaps stay unknown and use the existing listing on merge", () => {
  const createGaps = reviewImportGaps({
    parsed: { name: "Harbor", city: "Tampa", state: "FL" },
    extractedContracts: [],
    assignedPhotoCount: 0,
  });
  assert.ok(createGaps.some((label) => /Street/i.test(label)));
  assert.ok(createGaps.some((label) => /insurance/i.test(label)));
  assert.ok(createGaps.some((label) => /BD/i.test(label)));

  const mergeGaps = reviewImportGaps({
    parsed: { name: "Harbor" },
    extractedContracts: parsedFacilityContractDrafts(
      { name: "Harbor", payers_in_network: ["Aetna"] },
      payers,
    ),
    assignedPhotoCount: 0,
    existing: {
      id: "fac-1",
      name: "Harbor",
      tagline: null,
      address_line1: "100 Main St",
      city: "Tampa",
      state: "FL",
      zip: "33606",
      phone: "555-0100",
      website: "https://example.com",
      description: null,
      capacity: null,
      levels_of_care: [],
      highlights: [],
      population_served: [],
      specializations: [],
      accreditations: [],
      image_urls: ["https://example.com/a.jpg"],
      bd_contact_name: "Ada",
      bd_contact_phone: "555-0100",
      bd_contact_email: "ada@org.com",
      hidden_from_org_page: false,
    },
    existingContracts: [],
  });
  assert.equal(mergeGaps.length, 0);
});
