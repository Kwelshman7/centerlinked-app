import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contractMatchesPayer,
  isDistinctBcbsLicensee,
  isGenericBcbsLabel,
  resolvePayerForContractName,
  type PayerMatchInput,
} from "./match-payer.ts";

const payers: PayerMatchInput[] = [
  { id: "bcbs", name: "Blue Cross Blue Shield", aliases: ["BCBS", "Blue Cross Blue Shield Association"] },
  { id: "anthem", name: "Anthem Blue Cross Blue Shield", aliases: ["Anthem", "Anthem BCBS"] },
  { id: "horizon", name: "Horizon Blue Cross Blue Shield of New Jersey", aliases: ["Horizon BCBS"] },
  { id: "aetna", name: "Aetna", aliases: ["Aetna Better Health"] },
];

test("Anthem is not generic BCBS", () => {
  assert.equal(isGenericBcbsLabel("Blue Cross Blue Shield"), true);
  assert.equal(isGenericBcbsLabel("Blue Cross Blue Shield Association"), true);
  assert.equal(isDistinctBcbsLicensee("Anthem Blue Cross Blue Shield"), true);
  assert.equal(isDistinctBcbsLicensee("Horizon Blue Cross Blue Shield of New Jersey"), true);
  assert.equal(isDistinctBcbsLicensee("Blue Cross Blue Shield"), false);
});

test("searching BCBS does not match Anthem or Horizon contracts", () => {
  const bcbs = payers[0];
  assert.equal(contractMatchesPayer({ payer_name: "Blue Cross Blue Shield" }, bcbs), true);
  assert.equal(contractMatchesPayer({ payer_name: "Blue Cross Blue Shield Association" }, bcbs), true);
  assert.equal(contractMatchesPayer({ payer_name: "Anthem Blue Cross Blue Shield" }, bcbs), false);
  assert.equal(contractMatchesPayer({ payer_name: "Anthem" }, bcbs), false);
  assert.equal(contractMatchesPayer({ payer_name: "Horizon Blue Cross Blue Shield of New Jersey" }, bcbs), false);
});

test("Anthem stays Anthem", () => {
  const anthem = payers[1];
  assert.equal(contractMatchesPayer({ payer_name: "Anthem" }, anthem), true);
  assert.equal(contractMatchesPayer({ payer_name: "Blue Cross Blue Shield" }, anthem), false);
  assert.equal(resolvePayerForContractName("Anthem", payers)?.id, "anthem");
  assert.equal(resolvePayerForContractName("BCBS", payers)?.id, "bcbs");
});

test("exact aliases still link", () => {
  assert.equal(resolvePayerForContractName("Aetna Better Health", payers)?.id, "aetna");
});
