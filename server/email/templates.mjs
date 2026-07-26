import { adminRequestsUrl, appLoginUrl, logoUrl, siteUrl } from "./config.mjs";

const BRAND = {
  primary: "#1E8BB5",
  primaryDark: "#176F92",
  text: "#1a2332",
  muted: "#5c6b7a",
  border: "#e2e8f0",
  bg: "#f4f7f9",
  card: "#ffffff",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout({ preheader, title, bodyHtml }) {
  const logo = logoUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <img src="${logo}" alt="CenterLinked" width="200" style="display:inline-block;max-width:200px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                © ${new Date().getFullYear()} CenterLinked ·
                <a href="${siteUrl()}" style="color:${BRAND.primary};text-decoration:none;">centerlinked.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
  <tr>
    <td style="border-radius:10px;background:${BRAND.primary};">
      <a href="${href}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function detailRow(label, value) {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.muted};width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};font-weight:500;">${escapeHtml(value)}</td>
  </tr>`;
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
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">New access request</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      A treatment organization submitted a request to join CenterLinked.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      ${detailRow("Name", full_name)}
      ${detailRow("Work email", email)}
      ${detailRow("Organization", organization)}
      ${detailRow("Role", role)}
      ${detailRow("Facilities", num_facilities != null && num_facilities !== "" ? String(num_facilities) : null)}
      ${detailRow("Notes", notes)}
    </table>
    ${ctaButton(adminRequestsUrl(), "Review in admin")}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">
      After approval, verify their organization so they can sign up and receive a welcome email.
    </p>
  `;

  return {
    subject: `New CenterLinked access request — ${organization || full_name}`,
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
 * User email after they create an account (password or Google signup).
 */
export function accountCreatedEmail({ recipientName }) {
  const name = recipientName?.trim() || "there";
  const login = appLoginUrl();

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">Your account is ready</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Welcome to <strong style="color:${BRAND.text};">CenterLinked</strong> — the private referral network
      for treatment business development teams. Your account is set up and ready to use.
    </p>
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${BRAND.text};">Next steps</p>
    <ol style="margin:8px 0 0;padding-left:20px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      <li>Complete your organization and facility profiles</li>
      <li>Add your BD contact details for partners</li>
      <li>Share your live referral page when you're ready</li>
    </ol>
    ${ctaButton(login, "Open CenterLinked")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">
      Questions? Reply to this email or reach us at
      <a href="mailto:admin@centerlinked.com" style="color:${BRAND.primary};text-decoration:none;">admin@centerlinked.com</a>.
    </p>
  `;

  return {
    subject: "Your CenterLinked account is ready",
    html: layout({
      preheader: "Your account is ready — open the app to get started.",
      title: "Your account is ready",
      bodyHtml,
    }),
    text: [
      "Your CenterLinked account is ready",
      "",
      `Hi ${name},`,
      "",
      "Welcome to CenterLinked. Your account is set up and ready to use.",
      "",
      "Next steps:",
      "1. Complete your organization and facility profiles",
      "2. Add your BD contact details for partners",
      "3. Share your live referral page when you're ready",
      "",
      `Open the app: ${login}`,
      "",
      "Questions? admin@centerlinked.com",
    ].join("\n"),
  };
}

/**
 * Admin notification when a new user account is created.
 */
export function adminNewSignupEmail({ full_name, email }) {
  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">New account signup</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Someone created a CenterLinked account.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      ${detailRow("Name", full_name)}
      ${detailRow("Email", email)}
    </table>
    ${ctaButton(adminRequestsUrl(), "Open admin")}
  `;

  return {
    subject: `New CenterLinked signup — ${full_name || email}`,
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
 */
export function loginNoticeEmail({ recipientName, signedInAt }) {
  const name = recipientName?.trim() || "there";
  const when = signedInAt || new Date().toUTCString();
  const login = appLoginUrl();

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">New sign-in</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Someone just signed in to your CenterLinked account.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      ${detailRow("When", when)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">
      If this was you, no action is needed. If you didn't sign in, reply to this email or contact
      <a href="mailto:admin@centerlinked.com" style="color:${BRAND.primary};text-decoration:none;">admin@centerlinked.com</a>
      right away.
    </p>
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
      "If you didn't sign in, contact admin@centerlinked.com right away.",
      "",
      `Open the app: ${login}`,
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
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">Welcome to CenterLinked</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
      <strong style="color:${BRAND.text};">${escapeHtml(org)}</strong> is approved and ready on CenterLinked —
      the private referral network for treatment business development teams.
    </p>
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${BRAND.text};">How to get started</p>
    <ol style="margin:8px 0 0;padding-left:20px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      <li>Sign in with your work email</li>
      <li>Complete your organization and facility profiles</li>
      <li>Share your live referral page with partners</li>
    </ol>
    ${ctaButton(login, "Open the app &amp; log in")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">
      Questions? Reply to this email or reach us at
      <a href="mailto:admin@centerlinked.com" style="color:${BRAND.primary};text-decoration:none;">admin@centerlinked.com</a>.
    </p>
  `;

  return {
    subject: "Welcome to CenterLinked",
    html: layout({
      preheader: `${org} is approved — open the app to get started.`,
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
      "Questions? admin@centerlinked.com",
    ].join("\n"),
  };
}
