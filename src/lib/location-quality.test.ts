import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupDuplicateNames,
  groupDuplicateStreets,
  isCompleteUsZip,
  knownDistinctLabel,
  locationGaps,
  normalizeStreetKey,
} from "./location-quality.ts";

test("missing street, zip, and gallery are gaps; incomplete ZIP is a gap", () => {
  assert.deepEqual(
    locationGaps({
      address_line1: null,
      city: "Tampa",
      state: "FL",
      zip: "336",
      phone: "555-0100",
      website: "https://example.com",
      image_urls: [],
    }),
    ["street", "zip", "gallery"],
  );
  assert.equal(isCompleteUsZip("33606"), true);
  assert.equal(isCompleteUsZip("33606-1234"), true);
});

test("street keys ignore punctuation without inventing an address", () => {
  assert.equal(normalizeStreetKey("7609 Shallowford Rd."), "7609 shallowford rd");
});

test("known same-name and campus pairs stay distinct", () => {
  assert.match(
    knownDistinctLabel("50d6c033-0ccc-402d-b9a6-a80ca58e1f54", "d9887265-70e3-4970-94ef-981adb594161") ?? "",
    /Serenity/,
  );
  assert.match(
    knownDistinctLabel("f7f5db61-e91a-4eb6-b0f3-dac65998a091", "bb47aec9-db09-473c-821d-31b970d15290") ?? "",
    /do not merge/i,
  );
});

test("duplicate grouping requires more than one listing", () => {
  const names = groupDuplicateNames([
    { id: "1", name: "Journey Pure" },
    { id: "2", name: "journey  pure" },
    { id: "3", name: "Other" },
  ]);
  assert.equal(names.length, 1);
  assert.equal(names[0].length, 2);

  const streets = groupDuplicateStreets([
    { id: "a", address_line1: "7609 Shallowford Rd", city: "Chattanooga", state: "TN" },
    { id: "b", address_line1: "7609 Shallowford Rd.", city: "Chattanooga", state: "TN" },
    { id: "c", address_line1: "100 Main St", city: "Tampa", state: "FL" },
  ]);
  assert.equal(streets.length, 1);
  assert.equal(streets[0].length, 2);
});
