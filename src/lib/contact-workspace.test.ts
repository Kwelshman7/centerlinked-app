import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyOrgPayers,
  classifyContactType,
  contactWorkspaceStats,
  filterWorkspaceContacts,
  formatConnectedDate,
  formatPayerCell,
  mergeWorkspaceContacts,
  uniqueContactStates,
} from "./contact-workspace.ts";

describe("contact-workspace", () => {
  it("classifies titles without inventing a schema enum", () => {
    assert.equal(classifyContactType("Director of Business Development", "connection"), "bd_rep");
    assert.equal(classifyContactType("Admissions Manager", "connection"), "admissions");
    assert.equal(classifyContactType("Provider Relations", "connection"), "insurance");
    assert.equal(classifyContactType("Clinical Director", "connection"), "clinical");
    assert.equal(classifyContactType("Outreach Coordinator", "connection"), "outreach");
    assert.equal(classifyContactType("CEO", "connection"), "executive");
    assert.equal(classifyContactType(null, "facility"), "facility");
    assert.equal(classifyContactType(null, "representative"), "bd_rep");
    assert.equal(classifyContactType("Regional VP", "connection"), "other");
  });

  it("dedupes connections, representatives, and facility BD lines", () => {
    const contacts = mergeWorkspaceContacts({
      viewerOrgId: "org-own",
      connections: [
        {
          user_id: "u1",
          full_name: "Sarah Mitchell",
          job_title: "Director of Business Development",
          avatar_url: "https://x/a.png",
          phone: "3055550187",
          email: "sarah.mitchell@recoveryhorizons.com",
          city: "Miami",
          state: "FL",
          organization: { id: "org-1", name: "Recovery Horizons", slug: "recovery-horizons", logo_url: null },
          connected_at: "2026-09-12T00:00:00.000Z",
          connection_id: "c1",
        },
      ],
      representatives: [
        {
          id: "r1",
          user_id: "u1",
          full_name: "Sarah Mitchell",
          title: "Director of Business Development",
          email: "sarah.mitchell@recoveryhorizons.com",
          organization_id: "org-1",
          organization_name: "Recovery Horizons",
          payer_expertise: ["Aetna", "BCBS"],
          internal_notes: "secret from another path",
        },
        {
          id: "r2",
          full_name: "James Carter",
          title: "Executive Director",
          email: "james@clearview.test",
          organization_id: "org-2",
          organization_name: "Clearview Treatment",
          internal_notes: "Do not show — other org",
        },
        {
          id: "r3",
          full_name: "Own Org Rep",
          organization_id: "org-own",
          organization_name: "Mine",
          internal_notes: "Visible to my team",
        },
      ],
      facilities: [
        {
          id: "f1",
          name: "Recovery Horizons Miami",
          organization_id: "org-1",
          city: "Miami",
          state: "FL",
          bd_contact_name: "Sarah Mitchell",
          bd_contact_email: "sarah.mitchell@recoveryhorizons.com",
          organization: { id: "org-1", name: "Recovery Horizons", slug: "recovery-horizons", logo_url: null },
        },
        {
          id: "f2",
          name: "Sunrise",
          organization_id: "org-3",
          city: "Orlando",
          state: "FL",
          bd_contact_name: "Ashley Turner",
          bd_contact_title: "Admissions Manager",
          bd_contact_email: "ashley@sunrise.test",
          organization: { id: "org-3", name: "Sunrise Recovery", slug: "sunrise", logo_url: null },
        },
      ],
    });

    assert.equal(contacts.length, 4);
    const sarah = contacts.find((row) => row.fullName === "Sarah Mitchell");
    assert.equal(sarah?.userId, "u1");
    assert.equal(sarah?.source, "connection");
    assert.deepEqual(sarah?.payers, ["Aetna", "BCBS"]);
    assert.equal(sarah?.connectedAt, "2026-09-12T00:00:00.000Z");
    assert.equal(sarah?.notes, null);

    const james = contacts.find((row) => row.fullName === "James Carter");
    assert.equal(james?.notes, null);
    assert.equal(james?.contactType, "executive");

    const own = contacts.find((row) => row.fullName === "Own Org Rep");
    assert.equal(own?.notes, "Visible to my team");

    const ashley = contacts.find((row) => row.fullName === "Ashley Turner");
    assert.equal(ashley?.contactType, "admissions");
    assert.equal(ashley?.source, "facility");
  });

  it("filters, stats, and payer labels stay honest", () => {
    const contacts = mergeWorkspaceContacts({
      connections: [
        {
          user_id: "u1",
          full_name: "Ada West",
          job_title: "BD",
          state: "Florida",
          organization: { id: "o1", name: "West Care", slug: "west", logo_url: null },
        },
        {
          user_id: "u2",
          full_name: "Ben Payer",
          job_title: "Insurance Specialist",
          state: "CT",
          organization: { id: "o2", name: "Aetna", slug: "aetna", logo_url: null },
        },
      ],
    });
    const withPayers = applyOrgPayers(contacts, { o1: ["Cigna", "UHC"] });
    const ada = withPayers.find((row) => row.fullName === "Ada West");
    assert.deepEqual(ada?.payers, ["Cigna", "UHC"]);
    assert.equal(formatPayerCell(ada?.payers ?? []), "Cigna, UHC");
    assert.equal(formatPayerCell(["Aetna", "BCBS", "Cigna"]), "Multiple");
    assert.equal(formatPayerCell([]), "—");

    const stats = contactWorkspaceStats(withPayers);
    assert.equal(stats.total, 2);
    assert.equal(stats.bdReps, 1);
    assert.equal(stats.insurance, 1);
    assert.equal(stats.treatmentCenters, 1);

    const filtered = filterWorkspaceContacts(withPayers, { query: "west", type: "bd_rep", state: "FL" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.fullName, "Ada West");
    assert.deepEqual(uniqueContactStates(withPayers), ["CT", "FL"]);
  });

  it("formats connected dates and skips empty catalog names", () => {
    const formatted = formatConnectedDate("2026-09-12T16:00:00.000Z");
    assert.notEqual(formatted, "—");
    assert.match(formatted, /2026/);
    assert.equal(formatConnectedDate(null), "—");
    const empty = mergeWorkspaceContacts({
      representatives: [{ id: "r", full_name: "  " }],
      facilities: [{ id: "f", name: "X", organization_id: "o", bd_contact_name: "" }],
    });
    assert.equal(empty.length, 0);
  });
});
