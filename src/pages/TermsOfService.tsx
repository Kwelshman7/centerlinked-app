import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { applySocialMeta } from "@/lib/social-meta";

const EFFECTIVE_DATE = "January 4, 2026";

export default function TermsOfService() {
  useEffect(() => {
    applySocialMeta({
      title: "Terms of Service · CenterLinked",
      description:
        "Terms governing use of CenterLinked, the private professional network for behavioral-health referral teams.",
      path: "/terms",
    });
  }, []);

  return (
    <LegalPageLayout title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <p>
          These Terms of Service ("Terms") govern your access to and use of CenterLinked ("CenterLinked," "we," "us," or
          "our"), including our website at <a href="https://www.centerlinked.com">www.centerlinked.com</a> and related
          services (collectively, the "Service").
        </p>
        <p className="mt-3">
          By creating an account, signing in, or otherwise using the Service, you agree to these Terms and our{" "}
          <Link to="/privacy">Privacy Policy</Link>. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>1. Who may use CenterLinked</h2>
        <p className="mb-3">CenterLinked is an invite-only professional platform for behavioral-health and addiction-treatment organizations and their referral partners. To use the Service, you must:</p>
        <ul>
          <li>Be at least 18 years old;</li>
          <li>Use a valid work email address associated with an approved organization or invite;</li>
          <li>Use the Service only for legitimate professional referral and business-development purposes;</li>
          <li>Have authority to bind your organization if you act on its behalf.</li>
        </ul>
        <p className="mt-3">
          We may refuse, suspend, or terminate access at our discretion, including for violations of these Terms or
          eligibility requirements.
        </p>
      </section>

      <section>
        <h2>2. Accounts and authentication</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under
          your account. Notify us promptly at{" "}
          <a href="mailto:legal@centerlinked.com">legal@centerlinked.com</a> if you suspect unauthorized access.
        </p>
        <p className="mt-3">
          If you sign in with Google or another third-party provider, your use of that provider is also subject to its
          terms and policies.
        </p>
      </section>

      <section>
        <h2>3. Organization content and referral profiles</h2>
        <p className="mb-3">
          You and your organization may submit information about facilities, programs, insurance participation, referral
          contacts, and related professional content ("Content"). You represent and warrant that:
        </p>
        <ul>
          <li>You have the right to submit and publish the Content;</li>
          <li>Content is accurate to the best of your knowledge and kept reasonably current;</li>
          <li>Content does not include patient-identifying information or protected health information (PHI);</li>
          <li>Content does not infringe third-party rights or violate applicable law.</li>
        </ul>
        <p className="mt-3">
          You grant CenterLinked a non-exclusive, worldwide, royalty-free license to host, display, reproduce, and
          distribute Content solely to operate and promote the Service, including public referral profile pages intended
          for professional audiences.
        </p>
      </section>

      <section>
        <h2>4. Acceptable use</h2>
        <p className="mb-3">You agree not to:</p>
        <ul>
          <li>Use the Service for consumer patient intake, lead generation aimed at individuals seeking treatment, or any unlawful purpose;</li>
          <li>Submit false, misleading, or defamatory information;</li>
          <li>Upload malware, attempt unauthorized access, or interfere with the Service;</li>
          <li>Scrape, crawl, or harvest data from the Service without our written permission;</li>
          <li>Impersonate another person or organization;</li>
          <li>Circumvent invite-only or work-email access controls.</li>
        </ul>
      </section>

      <section>
        <h2>5. Not medical advice; no treatment relationship</h2>
        <p>
          CenterLinked provides professional referral information and networking tools. We do not provide medical,
          clinical, legal, or insurance advice. The Service does not create a provider-patient relationship. Users are
          solely responsible for clinical, regulatory, and compliance decisions.
        </p>
      </section>

      <section>
        <h2>6. Third-party services</h2>
        <p>
          The Service may integrate with or rely on third-party services such as Google sign-in, Supabase, and hosting
          providers. We are not responsible for third-party services and do not control their terms, availability, or
          practices.
        </p>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p>
          CenterLinked and its logos, software, design, and branding are owned by CenterLinked or its licensors and are
          protected by intellectual-property laws. Except for the limited rights expressly granted in these Terms, no
          rights are transferred to you.
        </p>
      </section>

      <section>
        <h2>8. Fees</h2>
        <p>
          Some features may be offered free during early access. We may introduce paid plans in the future. If fees apply
          to your account, we will provide notice and any additional terms before charging you.
        </p>
      </section>

      <section>
        <h2>9. Suspension and termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate your access immediately if you violate
          these Terms, pose a security risk, or if we discontinue the Service. Upon termination, your right to use the
          Service ends, but provisions that by their nature should survive will remain in effect.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
          STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, CENTERLINKED AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND SUPPLIERS
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
          PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR
          TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE
          AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100).
        </p>
      </section>

      <section>
        <h2>12. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless CenterLinked from claims, damages, losses, and expenses
          (including reasonable attorneys' fees) arising out of your Content, your use of the Service, or your violation
          of these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2>13. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law
          principles. Except where prohibited, exclusive jurisdiction for disputes arising out of these Terms lies in the
          state or federal courts located in Delaware, and you consent to personal jurisdiction in those courts.
        </p>
      </section>

      <section>
        <h2>14. Changes to these Terms</h2>
        <p>
          We may modify these Terms from time to time. We will post updated Terms on this page and update the effective
          date above. Continued use of the Service after changes become effective constitutes acceptance of the revised
          Terms.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these Terms? Contact{" "}
          <a href="mailto:legal@centerlinked.com">legal@centerlinked.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
