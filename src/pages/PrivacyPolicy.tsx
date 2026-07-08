import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { applySocialMeta } from "@/lib/social-meta";

const EFFECTIVE_DATE = "January 4, 2026";

export default function PrivacyPolicy() {
  useEffect(() => {
    applySocialMeta({
      title: "Privacy Policy · CenterLinked",
      description:
        "How CenterLinked collects, uses, and protects information for treatment organizations and referral professionals.",
      path: "/privacy",
    });
  }, []);

  return (
    <LegalPageLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <p>
          CenterLinked ("CenterLinked," "we," "us," or "our") operates a private professional network for
          behavioral-health and addiction-treatment organizations and their referral partners. This Privacy Policy
          explains how we collect, use, share, and protect information when you visit{" "}
          <a href="https://www.centerlinked.com">www.centerlinked.com</a> or use our services.
        </p>
        <p className="mt-3">
          CenterLinked is a business-to-business platform for referral professionals. It is not a patient-facing
          directory and is not intended for consumers seeking treatment.
        </p>
      </section>

      <section>
        <h2>1. Information we collect</h2>
        <p className="mb-3">We collect information in the following categories:</p>
        <ul>
          <li>
            <strong className="text-foreground">Account information:</strong> name, work email address, job title,
            profile photo, organization affiliation, and authentication credentials when you create an account or sign
            in.
          </li>
          <li>
            <strong className="text-foreground">Google sign-in data:</strong> if you choose "Continue with Google," we
            receive information made available by Google, such as your name, email address, and profile picture, solely
            to authenticate you and create or update your CenterLinked account.
          </li>
          <li>
            <strong className="text-foreground">Organization and facility data:</strong> information you or your team
            submit about your organization, facilities, programs, insurance contracts, referral contacts, branding, and
            related professional content.
          </li>
          <li>
            <strong className="text-foreground">Access requests:</strong> information submitted through our early-access
            or invite-request forms, including name, work email, organization, role, and optional notes.
          </li>
          <li>
            <strong className="text-foreground">Usage and technical data:</strong> IP address, browser type, device
            information, pages viewed, and similar log data collected automatically when you use the service.
          </li>
          <li>
            <strong className="text-foreground">Communications:</strong> messages you send to us, including support or
            legal inquiries.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p className="mb-3">We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, maintain, and improve CenterLinked;</li>
          <li>Authenticate users and enforce invite-only, work-email access controls;</li>
          <li>Display organization and facility referral profiles to authorized users and referral partners;</li>
          <li>Respond to access requests, support inquiries, and legal notices;</li>
          <li>Protect the security and integrity of our platform;</li>
          <li>Comply with applicable law and enforce our <Link to="/terms">Terms of Service</Link>.</li>
        </ul>
      </section>

      <section>
        <h2>3. What we do not collect</h2>
        <p>
          CenterLinked is not designed to store protected health information (PHI) about patients or individuals seeking
          treatment. You agree not to submit patient-identifying information through the service. If you believe PHI has
          been submitted in error, contact us at{" "}
          <a href="mailto:legal@centerlinked.com">legal@centerlinked.com</a>.
        </p>
      </section>

      <section>
        <h2>4. How we share information</h2>
        <p className="mb-3">We may share information as follows:</p>
        <ul>
          <li>
            <strong className="text-foreground">Within your organization:</strong> account and profile information may be
            visible to other authorized members of your organization.
          </li>
          <li>
            <strong className="text-foreground">Public referral profiles:</strong> organization and facility information
            you choose to publish may be visible on public referral profile pages intended for professional referral
            partners.
          </li>
          <li>
            <strong className="text-foreground">Service providers:</strong> we use trusted vendors to host and operate
            the service, including Supabase (authentication and database), Vercel (application hosting), and Google
            (optional sign-in). These providers process data on our behalf under contractual obligations.
          </li>
          <li>
            <strong className="text-foreground">Legal and safety:</strong> we may disclose information if required by law,
            court order, or governmental request, or when necessary to protect rights, safety, and security.
          </li>
          <li>
            <strong className="text-foreground">Business transfers:</strong> information may be transferred in connection
            with a merger, acquisition, financing, or sale of assets, subject to this Privacy Policy.
          </li>
        </ul>
        <p className="mt-3">We do not sell your personal information.</p>
      </section>

      <section>
        <h2>5. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences, and understand how the
          service is used. You can control cookies through your browser settings, but disabling them may affect sign-in
          and core functionality.
        </p>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          We retain information for as long as needed to provide the service, comply with legal obligations, resolve
          disputes, and enforce our agreements. When information is no longer needed, we delete or anonymize it where
          reasonably practicable.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We implement administrative, technical, and organizational safeguards designed to protect information against
          unauthorized access, loss, or misuse. No method of transmission or storage is completely secure, and we cannot
          guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>8. Your choices and rights</h2>
        <p className="mb-3">Depending on where you live, you may have rights to:</p>
        <ul>
          <li>Access, correct, or delete certain personal information;</li>
          <li>Object to or restrict certain processing;</li>
          <li>Receive a copy of information you provided in a portable format;</li>
          <li>Withdraw consent where processing is based on consent.</li>
        </ul>
        <p className="mt-3">
          To make a request, email{" "}
          <a href="mailto:legal@centerlinked.com">legal@centerlinked.com</a>. We may need to verify your identity before
          responding. California residents may have additional rights under applicable state privacy laws.
        </p>
      </section>

      <section>
        <h2>9. Children's privacy</h2>
        <p>
          CenterLinked is intended for adults using work email addresses in a professional capacity. We do not knowingly
          collect personal information from children under 16.
        </p>
      </section>

      <section>
        <h2>10. International users</h2>
        <p>
          CenterLinked is operated from the United States. If you access the service from outside the U.S., you understand
          that your information may be processed in the United States and other countries where our service providers
          operate.
        </p>
      </section>

      <section>
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy on this page and update
          the effective date above. Material changes may also be communicated by email or in-product notice where
          appropriate.
        </p>
      </section>

      <section>
        <h2>12. Contact us</h2>
        <p>
          Questions about this Privacy Policy or our data practices? Contact us at{" "}
          <a href="mailto:legal@centerlinked.com">legal@centerlinked.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
