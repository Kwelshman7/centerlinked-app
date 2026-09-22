import assert from "node:assert/strict";
import { test } from "node:test";
import {
  insuranceMatchFromContract,
  inNetworkFromStatus,
  isOutOfNetworkOnlyFacility,
  parseContractStatus,
  resolvePayerStrict,
  sanitizeCoveredStates,
  statusFromInNetwork,
} from "./insurance-contract-status.ts";

test("parseContractStatus accepts only stored statuses", () => {
  assert.equal(parseContractStatus("active"), "active");
  assert.equal(parseContractStatus("Pending_Verification"), "pending_verification");
  assert.equal(parseContractStatus("in_network"), null);
  assert.equal(parseContractStatus(""), null);
});

test("missing contract is unknown, never out of network", () => {
  const match = insuranceMatchFromContract(null);
  assert.equal(match.status, "unknown");
  assert.equal(match.label, "Insurance unknown");
});

test("self-pay only is distinct from out of network", () => {
  const match = insuranceMatchFromContract(null, { selfPayOnly: true });
  assert.equal(match.status, "self_pay");
  assert.notEqual(match.status, "out_of_network");
  assert.equal(isOutOfNetworkOnlyFacility([], { selfPayOnly: true }), false);
});

test("a facility with no in-network contracts is out of network only", () => {
  assert.equal(isOutOfNetworkOnlyFacility([]), true);
  assert.equal(
    isOutOfNetworkOnlyFacility([{ in_network: false }, { in_network: false }]),
    true,
  );
  assert.equal(
    isOutOfNetworkOnlyFacility([{ in_network: false }, { in_network: true }]),
    false,
  );
});

test("active without verified_at is reported, not verified", () => {
  const match = insuranceMatchFromContract({
    payer_name: "Aetna",
    in_network: true,
    contract_status: "active",
    verified_at: null,
  });
  assert.equal(match.status, "reported");
  assert.equal(match.payerName, "Aetna");
});

test("verified requires a contract verification timestamp", () => {
  const match = insuranceMatchFromContract({
    payer_name: "Aetna",
    contract_status: "active",
    verified_at: "2026-09-01T00:00:00.000Z",
    verification_method: "payer_portal",
  });
  assert.equal(match.status, "verified");
  assert.equal(match.verifiedAt, "2026-09-01T00:00:00.000Z");
});

test("pending and out-of-network stay explicit", () => {
  assert.equal(
    insuranceMatchFromContract({
      payer_name: "Cigna",
      contract_status: "pending_verification",
      in_network: true,
    }).status,
    "pending",
  );
  assert.equal(
    insuranceMatchFromContract({
      payer_name: "Cigna",
      contract_status: "out_of_network",
      in_network: false,
    }).status,
    "out_of_network",
  );
});

test("legacy in_network boolean still maps when status is missing", () => {
  assert.equal(statusFromInNetwork(true), "active");
  assert.equal(statusFromInNetwork(false), "out_of_network");
  assert.equal(
    insuranceMatchFromContract({ payer_name: "UHC", in_network: true }).status,
    "reported",
  );
});

test("inNetworkFromStatus keeps pending searchable as a claimed network", () => {
  assert.equal(inNetworkFromStatus("active"), true);
  assert.equal(inNetworkFromStatus("pending_verification"), true);
  assert.equal(inNetworkFromStatus("out_of_network"), false);
  assert.equal(inNetworkFromStatus("unknown"), false);
});

test("sanitizeCoveredStates keeps unique US codes", () => {
  assert.deepEqual(sanitizeCoveredStates(["fl", "FL", "Florida", "NY"]), ["FL", "NY"]);
});

test("resolvePayerStrict links exact and mapped names only", () => {
  const payers = [
    { id: "1", name: "Aetna", aliases: ["Aetna Better Health"] },
    { id: "2", name: "Anthem Blue Cross Blue Shield", aliases: [] },
    { id: "3", name: "Blue Cross Blue Shield", aliases: [] },
  ];
  assert.equal(resolvePayerStrict("Aetna", payers)?.id, "1");
  assert.equal(resolvePayerStrict("Aetna Better Health", payers)?.id, "1");
  assert.equal(resolvePayerStrict("Anthem", payers)?.id, "2");
  assert.equal(resolvePayerStrict("Associates", payers), null);
  assert.equal(resolvePayerStrict("Out-of-Network Only", payers), null);
  assert.equal(resolvePayerStrict("Most major insurance plans", payers), null);
});
