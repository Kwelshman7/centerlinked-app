import { adminRequestsUrl, appLoginUrl, logoUrl, siteUrl, supportEmail } from "./config.mjs";

const BRAND = {
  primary: "#2088b8",
  primaryDark: "#176f92",
  navy: "#003048",
  text: "#1b2730",
  muted: "#5a6b75",
  border: "#dce6ec",
  bg: "#eef3f6",
  card: "#ffffff",
};

const FONT = "Arial, Helvetica, sans-serif";
const SUPPORT = supportEmail();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeSubjectPart(value) {
  return String(value ?? "")
    .replace(/[\r\n\u0000]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function heading(text) {
  return `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.navy};">${text}</h1>`;
}

function para(text) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.text};">${text}</p>`;
}

function mutedPara(text) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.muted};">${text}</p>`;
}

function label(text) {
  return `<p style="margin:8px 0 8px;font-family:${FONT};font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.primary};">${escapeHtml(text)}</p>`;
}

function supportLine() {
  return `<p style="margin:24px 0 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${BRAND.muted};">
    Questions? Reply to this email or write
    <a href="mailto:${SUPPORT}" style="color:${BRAND.primary};text-decoration:none;">${SUPPORT}</a>.
  </p>`;
}

function layout({ preheader, title, bodyHtml }) {
  const logo = logoUrl();
  const site = siteUrl();
  const year = new Date().getFullYear();
  const hiddenPad = "&#847;&zwnj;&nbsp;".repeat(30);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table,td,a{font-family:Arial,Helvetica,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:${FONT};color:${BRAND.text};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.bg};opacity:0;">
    ${escapeHtml(preheader)}${hiddenPad}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 8px 20px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="${logo}" alt="CenterLinked" width="188" height="49" style="display:block;width:188px;max-width:188px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;line-height:4px;font-size:0;background:${BRAND.primary};border-radius:12px 12px 0 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 36px 36px;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 16px 8px;">
              <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:1.5;color:${BRAND.muted};">
                CenterLinked · The private referral network for treatment organizations
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:${BRAND.muted};">
                © ${year}
                <a href="${site}" style="color:${BRAND.primary};text-decoration:none;">centerlinked.com</a>
                ·
                <a href="mailto:${SUPPORT}" style="color:${BRAND.primary};text-decoration:none;">${SUPPORT}</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href, label) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 4px;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="14%" fillcolor="${BRAND.primary}" stroke="f">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;line-height:1.2;font-weight:700;color:#ffffff;text-decoration:none;background:${BRAND.primary};border-radius:8px;">
        ${safeLabel}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

function detailRow(labelText, value) {
  if (!value) return "";
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT};font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.muted};width:132px;vertical-align:top;">${escapeHtml(labelText)}</td>
    <td style="padding:11px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT};font-size:15px;line-height:1.5;color:${BRAND.text};">${escapeHtml(value)}</td>
  </tr>`;
}

function detailTable(rowsHtml) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">${rowsHtml}</table>`;
}

function listItems(items) {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:0 10px 8px 0;width:16px;vertical-align:top;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.primary};">•</td>
          <td style="padding:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.text};">${item}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">${rows}</table>`;
}

/**
 * Admin notification when someone submits the request-access form.
 */
export function accessRequestAdminEmail(payload) {
  const {
    full_name,
    email,
    organization,
    role,
    num_facilities,
    notes,
  } = payload;

  const bodyHtml = `
    ${label("Admin notice")}
    ${heading("New access request")}
    ${mutedPara("A treatment organization asked to join CenterLinked.")}
    ${detailTable(`
      ${detailRow("Name", full_name)}
      ${detailRow("Work email", email)}
      ${detailRow("Organization", organization)}
      ${detailRow("Role", role)}
      ${detailRow("Facilities", num_facilities != null && num_facilities !== "" ? String(num_facilities) : null)}
      ${detailRow("Notes", notes)}
    `)}
    ${ctaButton(adminRequestsUrl(), "Review request")}
    ${mutedPara("Approve login first, then assign them as organization admin and email them.")}
  `;

  return {
    subject: `Access request — ${safeSubjectPart(organization || full_name)}`,
    html: layout({
      preheader: `${full_name} requested access for ${organization}`,
      title: "New access request",
      bodyHtml,
    }),
    text: [
      "New CenterLinked access request",
      "",
      `Name: ${full_name}`,
      `Email: ${email}`,
      `Organization: ${organization}`,
      role ? `Role: ${role}` : null,
      num_facilities ? `Facilities: ${num_facilities}` : null,
      notes ? `Notes: ${notes}` : null,
      "",
      `Review: ${adminRequestsUrl()}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Admin notification when someone submits the pricing “send us a message” form.
 */
export function pricingInquiryAdminEmail(payload) {
  const { name, email, phone, question } = payload;

  const bodyHtml = `
    ${label("Pricing page")}
    ${heading("New message")}
    ${mutedPara("Someone asked a question from the pricing section.")}
    ${detailTable(`
      ${detailRow("Name", name)}
      ${detailRow("Email", email)}
      ${detailRow("Phone", phone)}
      ${detailRow("Question", question)}
    `)}
    ${mutedPara("Reply directly to this email to reach them.")}
  `;

  return {
    subject: `Pricing question — ${safeSubjectPart(name)}`,
    html: layout({
      preheader: `${name} sent a question from the pricing page`,
      title: "New pricing message",
      bodyHtml,
    }),
    text: [
      "New CenterLinked pricing message",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      "",
      "Question:",
      question,
    ].join("\n"),
  };
}

/**
 * User email after they create an account (password or Google signup).
 */
export function accountCreatedEmail({ recipientName }) {
  const name = recipientName?.trim() || "there";
  const login = appLoginUrl();

  const bodyHtml = `
    ${heading("Welcome to CenterLinked")}
    ${para(`Hi ${escapeHtml(name)},`)}
    ${para("Your account is ready. CenterLinked is the private referral network for treatment business-development teams — one live organization page your partners can reopen.")}
    ${label("Next step")}
    ${para("Sign in with this email. If your team already invited you, you will land on that organization automatically. Otherwise you can join or create your organization.")}
    ${ctaButton(login, "Sign in to CenterLinked")}
    ${supportLine()}
  `;

  return {
    subject: "Welcome to CenterLinked",
    html: layout({
      preheader: "Your account is ready. Sign in to join your organization.",
      title: "Welcome to CenterLinked",
      bodyHtml,
    }),
    text: [
      "Welcome to CenterLinked",
      "",
      `Hi ${name},`,
      "",
      "Your account is ready. CenterLinked is the private referral network for treatment BD teams.",
      "",
      "Sign in with this email. If your team already invited you, you will land on that organization automatically.",
      "Otherwise you can join or create your organization.",
      "",
      `Sign in: ${login}`,
      "",
      `Questions? ${SUPPORT}`,
    ].join("\n"),
  };
}

/**
 * Super-admin assigned this person as org admin (account may or may not exist yet).
 */
export function orgAssignedEmail({ recipientName, organizationName, alreadyLinked }) {
  const name = recipientName?.trim() || "there";
  const org = organizationName?.trim() || "your organization";
  const login = appLoginUrl();
  const signupUrl = `${siteUrl()}/signup`;

  const bodyHtml = `
    ${heading(`You are the admin for ${escapeHtml(org)}`)}
    ${para(`Hi ${escapeHtml(name)},`)}
    ${para(
      alreadyLinked
        ? `You have been assigned as organization admin for <strong style="color:${BRAND.navy};">${escapeHtml(org)}</strong> on CenterLinked. Sign in and you will go straight to the dashboard.`
        : `You have been assigned as organization admin for <strong style="color:${BRAND.navy};">${escapeHtml(org)}</strong> on CenterLinked. Create your account with this same email, then sign in — you will land on the organization automatically.`,
    )}
    ${label("From there you can")}
    ${listItems([
      "Add facilities, insurance, and who to contact",
      "Invite your BD and admissions teammates",
      "Share your live organization link with referral partners",
    ])}
    ${ctaButton(alreadyLinked ? login : signupUrl, alreadyLinked ? "Open CenterLinked" : "Create your account")}
    <p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${BRAND.muted};">
      Already have an account? <a href="${login}" style="color:${BRAND.primary};text-decoration:none;">Sign in</a>.
      Questions? <a href="mailto:${SUPPORT}" style="color:${BRAND.primary};text-decoration:none;">${SUPPORT}</a>.
    </p>
  `;

  return {
    subject: `You are the admin for ${safeSubjectPart(org)} on CenterLinked`,
    html: layout({
      preheader: `${org} is ready for you on CenterLinked.`,
      title: `You are the admin for ${org}`,
      bodyHtml,
    }),
    text: [
      `You are the admin for ${org} on CenterLinked`,
      "",
      `Hi ${name},`,
      "",
      alreadyLinked
        ? "Sign in and you will go straight to the dashboard."
        : "Create your account with this same email, then sign in — you will land on the organization automatically.",
      "",
      alreadyLinked ? `Sign in: ${login}` : `Create your account: ${signupUrl}`,
      "",
      `Questions? ${SUPPORT}`,
    ].join("\n"),
  };
}

/**
 * Admin notification when a new user account is created.
 */
export function adminNewSignupEmail({ full_name, email }) {
  const bodyHtml = `
    ${label("Admin notice")}
    ${heading("New account signup")}
    ${mutedPara("Someone created a CenterLinked account.")}
    ${detailTable(`
      ${detailRow("Name", full_name)}
      ${detailRow("Email", email)}
    `)}
    ${ctaButton(adminRequestsUrl(), "Open admin")}
  `;

  return {
    subject: `New signup — ${safeSubjectPart(full_name || email)}`,
    html: layout({
      preheader: `${full_name || email} created an account`,
      title: "New account signup",
      bodyHtml,
    }),
    text: [
      "New CenterLinked account signup",
      "",
      full_name ? `Name: ${full_name}` : null,
      `Email: ${email}`,
      "",
      `Admin: ${adminRequestsUrl()}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Security-style notice after a successful sign-in.
 * Kept for possible future use; login events are not sent today.
 */
export function loginNoticeEmail({ recipientName, signedInAt }) {
  const name = recipientName?.trim() || "there";
  const when = signedInAt || new Date().toUTCString();
  const login = appLoginUrl();

  const bodyHtml = `
    ${heading("New sign-in")}
    ${para(`Hi ${escapeHtml(name)},`)}
    ${para("Someone just signed in to your CenterLinked account.")}
    ${detailTable(detailRow("When", when))}
    ${para(`If this was you, no action is needed. If you did not sign in, reply to this email or contact <a href="mailto:${SUPPORT}" style="color:${BRAND.primary};text-decoration:none;">${SUPPORT}</a> right away.`)}
    ${ctaButton(login, "Open CenterLinked")}
  `;

  return {
    subject: "New sign-in to your CenterLinked account",
    html: layout({
      preheader: "A new sign-in was detected on your account.",
      title: "New sign-in",
      bodyHtml,
    }),
    text: [
      "New sign-in to your CenterLinked account",
      "",
      `Hi ${name},`,
      "",
      "Someone just signed in to your CenterLinked account.",
      `When: ${when}`,
      "",
      "If this was you, no action is needed.",
      `If you did not sign in, contact ${SUPPORT} right away.`,
      "",
      `Open the app: ${login}`,
    ].join("\n"),
  };
}

/**
 * Monthly nudge to re-confirm insurance contracts before a facility goes stale.
 * `facilities` is [{ name, daysSince, verifyUrl }] for one recipient.
 */
export function verificationReminderEmail({ recipientName, organizationName, facilities }) {
  const name = recipientName?.trim() || "there";
  const org = organizationName?.trim() || "your organization";
  const list = Array.isArray(facilities) ? facilities : [];
  const count = list.length;
  const plural = count === 1 ? "facility" : "facilities";
  const primaryCta = count === 1 && list[0]?.verifyUrl ? list[0].verifyUrl : `${siteUrl()}/app/facilities`;

  const rows = list.map((f) => {
    const days = Number.isFinite(f?.daysSince) ? f.daysSince : null;
    const age =
      days === null
        ? "not yet confirmed"
        : days >= 90
          ? `${days} days — frozen`
          : `last confirmed ${days} days ago`;
    return `<strong style="color:${BRAND.navy};">${escapeHtml(f?.name || "Facility")}</strong> — ${escapeHtml(age)}`;
  });

  const bodyHtml = `
    ${label("Monthly verification")}
    ${heading(`Confirm insurance for ${count} ${plural}`)}
    ${para(`Hi ${escapeHtml(name)},`)}
    ${para(
      `Referral partners trust ${escapeHtml(org)}'s profile because it shows when the insurance contracts were last confirmed. ${count === 1 ? "One facility is" : `${count} facilities are`} due for a check.`,
    )}
    ${listItems(rows)}
    ${ctaButton(primaryCta, count === 1 ? "Confirm this facility" : "Review facilities")}
    ${mutedPara(
      "If nothing has changed, confirming takes one click. Facilities that go 90 days without confirmation are frozen and stop appearing in partner search until they are checked.",
    )}
    ${supportLine()}
  `;

  return {
    subject:
      count === 1
        ? `Confirm insurance for ${safeSubjectPart(list[0]?.name || org)}`
        : `${count} ${plural} at ${safeSubjectPart(org)} need an insurance check`,
    html: layout({
      preheader: `A quick confirmation keeps ${org} visible to referral partners.`,
      title: `Confirm insurance for ${count} ${plural}`,
      bodyHtml,
    }),
    text: [
      `Confirm insurance for ${count} ${plural}`,
      "",
      `Hi ${name},`,
      "",
      `Referral partners trust ${org}'s profile because it shows when the insurance contracts were last confirmed. The following ${plural} are due for a check:`,
      "",
      ...list.map((f) => {
        const days = Number.isFinite(f?.daysSince) ? f.daysSince : null;
        const age =
          days === null
            ? "not yet confirmed"
            : days >= 90
              ? `${days} days — frozen`
              : `last confirmed ${days} days ago`;
        return `- ${f?.name || "Facility"} (${age})`;
      }),
      "",
      `Review: ${primaryCta}`,
      "",
      "If nothing has changed, confirming takes one click. Facilities that go 90 days without confirmation are frozen and stop appearing in partner search until they are checked.",
      "",
      `Questions? ${SUPPORT}`,
    ].join("\n"),
  };
}

/**
 * Teammate invite to join an existing organization workspace.
 * The invite is claimed on first login via `claim_pending_org_invite`,
 * so the recipient must sign up with the exact invited address.
 */
export function orgInviteEmail({ organizationName, inviterName, roleAtOrg }) {
  const org = organizationName?.trim() || "an organization";
  const inviter = inviterName?.trim() || "A teammate";
  const login = appLoginUrl();
  const signupUrl = `${siteUrl()}/signup`;
  const roleLabel = roleAtOrg === "facility_admin" ? "an organization admin" : "a team member";

  const bodyHtml = `
    ${label("Team invite")}
    ${heading(`Join ${escapeHtml(org)} on CenterLinked`)}
    ${para(
      `${escapeHtml(inviter)} invited you to join <strong style="color:${BRAND.navy};">${escapeHtml(org)}</strong> on CenterLinked as ${roleLabel}.`,
    )}
    ${para(
      "CenterLinked is where your organization keeps one live referral profile — locations, levels of care, insurance contracts, and who to contact — so partners always see current information instead of a stale one-pager.",
    )}
    ${label("Once you are in you can")}
    ${listItems([
      "Keep facilities, insurance, and referral contacts current",
      "Share your organization's live link with referral partners",
      "Search partner facilities by insurance, location, and level of care",
    ])}
    ${ctaButton(signupUrl, "Create your account")}
    ${mutedPara(
      "Use this same email address when you sign up — that is how we connect you to the right organization.",
    )}
    <p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${BRAND.muted};">
      Already have an account? <a href="${login}" style="color:${BRAND.primary};text-decoration:none;">Sign in</a> and you will be added automatically.
      Not expecting this? You can ignore this email — no account is created until you sign up.
    </p>
    ${supportLine()}
  `;

  return {
    subject: `${safeSubjectPart(inviter)} invited you to ${safeSubjectPart(org)} on CenterLinked`,
    html: layout({
      preheader: `Join ${org} on CenterLinked.`,
      title: `Join ${org} on CenterLinked`,
      bodyHtml,
    }),
    text: [
      `Join ${org} on CenterLinked`,
      "",
      `${inviter} invited you to join ${org} on CenterLinked as ${roleLabel}.`,
      "",
      "CenterLinked is where your organization keeps one live referral profile — locations, levels of care, insurance contracts, and who to contact.",
      "",
      `Create your account: ${signupUrl}`,
      `Already have an account? Sign in: ${login}`,
      "",
      "Use this same email address when you sign up — that is how we connect you to the right organization.",
      "Not expecting this? You can ignore this email.",
      "",
      `Questions? ${SUPPORT}`,
    ].join("\n"),
  };
}

/**
 * Welcome email after an organization is verified / approved.
 */
export function orgWelcomeEmail({ recipientName, organizationName }) {
  const name = recipientName?.trim() || "there";
  const org = organizationName?.trim() || "your organization";
  const login = appLoginUrl();

  const bodyHtml = `
    ${heading("Welcome to CenterLinked")}
    ${para(`Hi ${escapeHtml(name)},`)}
    ${para(`<strong style="color:${BRAND.navy};">${escapeHtml(org)}</strong> is approved and ready on CenterLinked — the private referral network for treatment business-development teams.`)}
    ${label("How to get started")}
    ${listItems([
      "Sign in with your work email",
      "Complete your organization and facility profiles",
      "Share your live referral page with partners",
    ])}
    ${ctaButton(login, "Open CenterLinked")}
    ${supportLine()}
  `;

  return {
    subject: `Welcome to CenterLinked — ${safeSubjectPart(org)}`,
    html: layout({
      preheader: `${org} is approved. Open the app to get started.`,
      title: "Welcome to CenterLinked",
      bodyHtml,
    }),
    text: [
      "Welcome to CenterLinked",
      "",
      `Hi ${name},`,
      "",
      `${org} is approved and ready on CenterLinked.`,
      "",
      "How to get started:",
      "1. Sign in with your work email",
      "2. Complete your organization and facility profiles",
      "3. Share your live referral page with partners",
      "",
      `Open the app: ${login}`,
      "",
      `Questions? ${SUPPORT}`,
    ].join("\n"),
  };
}

/**
 * Internal notice when an org buys Done For You setup.
 */
export function doneForYouAdminEmail({ orgName, orgId, email, membershipTier }) {
  const bodyHtml = `
    ${label("Admin notice")}
    ${heading("Done For You purchase")}
    ${mutedPara("A setup package was purchased. The organization is waiting on onboarding.")}
    ${detailTable(`
      ${detailRow("Organization", orgName)}
      ${detailRow("Organization ID", orgId)}
      ${detailRow("Package", membershipTier)}
      ${detailRow("Billing email", email)}
    `)}
    ${ctaButton(adminRequestsUrl(), "Open admin")}
  `;

  return {
    subject: `Done For You purchase — ${safeSubjectPart(orgName)}`,
    html: layout({
      preheader: `${orgName} purchased Done For You setup.`,
      title: "Done For You purchase",
      bodyHtml,
    }),
    text: [
      "A Done For You setup package was purchased.",
      "",
      `Organization: ${orgName}`,
      orgId ? `Organization ID: ${orgId}` : null,
      membershipTier ? `Package: ${membershipTier}` : null,
      email ? `Billing email: ${email}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
