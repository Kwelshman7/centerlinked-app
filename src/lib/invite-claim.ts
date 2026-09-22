/** Pure claim result so a stale client still unlocks Search/Members/Facilities. */
export function resolveInviteClaim(input: {
  joined?: boolean;
  organization_id?: string;
  reason?: string | null;
  profileOrganizationId?: string | null;
  membershipOrganizationId?: string | null;
}): { joined: boolean; organization_id?: string; alreadyInOrg: boolean } {
  let organizationId = input.organization_id;
  let joined = Boolean(input.joined && organizationId);
  const alreadyInOrg = input.reason === "already_in_org";
  if (!joined && alreadyInOrg && input.profileOrganizationId) {
    organizationId = input.profileOrganizationId;
    joined = true;
  }
  // already_in_org means the RPC already linked membership. If the profile
  // row is still missing organization_id, use that membership so Join/Login
  // still route to Search instead of setup with no Accept button.
  if (!joined && input.membershipOrganizationId) {
    organizationId = input.membershipOrganizationId;
    joined = true;
  }
  return { joined, organization_id: organizationId, alreadyInOrg };
}
