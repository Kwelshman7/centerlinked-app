import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  asProfessionalCard,
  asProfessionalCards,
  asProfessionalProfile,
  asPublicReferralContacts,
  bdProfileMetrics,
  connectSharePath,
  groupByLetter,
  groupByOrganization,
  initialsFromName,
  letterForName,
  locationLine,
  personMatchesQuery,
  professionalPath,
} from "./professional-network.ts";

describe("professional-network helpers", () => {
  it("builds profile and share paths", () => {
    assert.equal(professionalPath("abc"), "/app/people/abc");
    assert.equal(connectSharePath("abc"), "/join?connect=abc");
  });

  it("formats initials and locations", () => {
    assert.equal(initialsFromName("Mike Smith"), "MS");
    assert.equal(locationLine("Tampa", "FL"), "Tampa, FL");
    assert.equal(locationLine(null, "FL"), "FL");
  });

  it("parses professional cards and profiles", () => {
    const card = asProfessionalCard({
      user_id: "u1",
      full_name: "Mike Smith",
      job_title: "BD",
      organization: { id: "o1", name: "ABC", slug: "abc", logo_url: null },
    });
    assert.equal(card?.full_name, "Mike Smith");
    assert.equal(card?.organization?.name, "ABC");
    assert.equal(asProfessionalCards([card, null]).length, 1);

    const profile = asProfessionalProfile({
      ...card,
      facilities: [
        {
          id: "f1",
          name: "Boca",
          slug: "boca",
          city: "Boca Raton",
          state: "FL",
          levels_of_care: ["Residential"],
          payers: ["Aetna"],
        },
      ],
    });
    assert.equal(profile?.facilities[0]?.payers[0], "Aetna");
  });

  it("counts BD profile metrics from listed facilities", () => {
    const metrics = bdProfileMetrics({
      facilities: [
        { id: "1", name: "A", slug: "a", city: "Tampa", state: "FL", levels_of_care: [], payers: ["Aetna", "Cigna"] },
        { id: "2", name: "B", slug: "b", city: "Austin", state: "TX", levels_of_care: [], payers: ["Aetna"] },
      ],
    });
    assert.equal(metrics.facilities, 2);
    assert.equal(metrics.inNetwork, 2);
    assert.equal(metrics.states, 2);
  });

  it("parses public referral contacts", () => {
    const contacts = asPublicReferralContacts([
      { name: "Jen", title: "BD", phone: "555", email: "a@b.com", avatar_url: "https://x", user_id: "u2" },
    ]);
    assert.equal(contacts[0]?.avatar_url, "https://x");
  });

  it("groups contacts like a phone book", () => {
    const people = asProfessionalCards([
      { user_id: "1", full_name: "John Coyle", organization: { id: "r", name: "Remedy", slug: "remedy", logo_url: null } },
      { user_id: "2", full_name: "AnnaClaire Davis", city: "West Palm Beach", state: "FL", organization: { id: "i", name: "Intrepid", slug: "intrepid", logo_url: null } },
      { user_id: "3", full_name: "Kyle Welshman", state: "FL", organization: { id: "i", name: "Intrepid", slug: "intrepid", logo_url: null } },
    ]);
    assert.equal(letterForName("John Coyle"), "C");
    const letters = groupByLetter(people);
    assert.equal(letters[0]?.letter, "C");
    assert.equal(letters[0]?.people[0]?.full_name, "John Coyle");
    const orgs = groupByOrganization(people);
    assert.equal(orgs[0]?.label, "Intrepid");
    assert.equal(orgs[0]?.people.length, 2);
    assert.equal(personMatchesQuery(people[1], "intrepid"), true);
    assert.equal(personMatchesQuery(people[0], "palm"), false);
  });
});
