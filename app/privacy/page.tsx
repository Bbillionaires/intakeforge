export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 13, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p>IntakeForge ("we," "us," or "our") operates the IntakeForge web application available at <strong>intakeforge.app</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this policy carefully. By using IntakeForge, you agree to the practices described here.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <h3 className="font-medium mb-2">2a. Information You Provide</h3>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>Form prompts and descriptions you enter to generate intake forms</li>
          <li>Edits, customizations, and content within your form drafts</li>
          <li>Template names and organizational preferences</li>
        </ul>
        <h3 className="font-medium mb-2">2b. Information from Google</h3>
        <p className="mb-2">When you connect your Google account, we receive and store:</p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>Your Google account name, email address, and profile picture (for account identification)</li>
          <li>OAuth access and refresh tokens (to act on your behalf when creating forms and sheets)</li>
          <li>Google user ID (sub) to uniquely identify your account</li>
        </ul>
        <h3 className="font-medium mb-2">2c. Usage and Technical Data</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Server logs including IP address, browser type, pages visited, and timestamps</li>
          <li>Error logs for debugging and service improvement</li>
          <li>Payment information processed by Stripe (we do not store card numbers)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Google User Data</h2>
        <p className="mb-3">Our use of data received from Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p className="mb-2">We use Google user data <strong>only</strong> to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google Forms API:</strong> Create intake forms in your Google Drive on your behalf</li>
          <li><strong>Google Sheets API:</strong> Create linked response spreadsheets in your Google Drive on your behalf</li>
          <li><strong>Google Drive API:</strong> Manage file permissions for forms and sheets we create for you</li>
          <li><strong>Google userinfo:</strong> Identify your account and display your name and photo in the app</li>
        </ul>
        <p className="mt-3"><strong>We do not:</strong> sell your Google data, use it for advertising, share it with third parties for their independent use, or use it for any purpose other than providing IntakeForge features directly to you.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide, operate, and improve the IntakeForge service</li>
          <li>To authenticate your identity and maintain your account</li>
          <li>To generate AI-powered intake forms based on your prompts</li>
          <li>To publish forms and response sheets to your Google account</li>
          <li>To process subscription payments through Stripe</li>
          <li>To send transactional emails related to your account (billing receipts, service notices)</li>
          <li>To analyze aggregate usage patterns to improve our service</li>
          <li>To detect and prevent fraud, abuse, and security incidents</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Sharing and Disclosure</h2>
        <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google LLC</strong> — via the Google Forms, Sheets, Drive, and OAuth APIs to deliver core features</li>
          <li><strong>Stripe Inc.</strong> — to process subscription payments securely</li>
          <li><strong>Anthropic PBC</strong> — form prompts are sent to Claude AI for form generation (no personal account data is sent)</li>
          <li><strong>Google Cloud Platform</strong> — our backend infrastructure provider</li>
          <li><strong>Vercel Inc.</strong> — our frontend hosting provider</li>
          <li><strong>Law enforcement or government authorities</strong> — when required by law, court order, or to protect the rights, property, or safety of IntakeForge, our users, or the public</li>
          <li><strong>Successor entities</strong> — in connection with a merger, acquisition, or sale of assets, with notice provided to affected users</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Form drafts and templates are retained until you delete them or request account deletion</li>
          <li>Google OAuth tokens are retained while your account is active and deleted upon account deletion</li>
          <li>Server logs are retained for up to 90 days for security and debugging purposes</li>
          <li>Billing records are retained as required by applicable law (typically 7 years)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Security</h2>
        <p className="mb-3">We implement industry-standard security measures including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>TLS/HTTPS encryption for all data in transit</li>
          <li>JWT-based authentication with 30-day expiration</li>
          <li>OAuth tokens stored encrypted at rest</li>
          <li>Google Cloud infrastructure with built-in DDoS protection</li>
          <li>No storage of payment card data (handled entirely by Stripe)</li>
          <li>Principle of least privilege — we request only the Google API scopes necessary</li>
        </ul>
        <p className="mt-3">Despite these measures, no system is 100% secure. We cannot guarantee absolute security of your data.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Your Rights and Choices</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Revoke Google access:</strong> Visit <a href="https://myaccount.google.com/permissions" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a> to revoke IntakeForge's access to your Google account at any time</li>
          <li><strong>Data portability:</strong> Request an export of your form drafts and account data</li>
          <li><strong>Opt out of AI generation:</strong> Use the rule-based form generator by contacting us</li>
        </ul>
        <p className="mt-3">To exercise these rights, email <a href="mailto:contact@intakeforge.com" className="text-blue-600 underline">contact@intakeforge.com</a>. We will respond within 30 days.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
        <p>IntakeForge is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in the United States and other countries where our service providers operate. By using IntakeForge, you consent to such transfers. We ensure appropriate safeguards are in place in accordance with applicable law.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with an updated date, and where appropriate, by email. Your continued use of IntakeForge after changes constitutes acceptance.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
        <p>For privacy questions, data requests, or concerns:</p>
        <ul className="list-none mt-2 space-y-1">
          <li>Email: <a href="mailto:contact@intakeforge.com" className="text-blue-600 underline">contact@intakeforge.com</a></li>
          <li>Website: <a href="https://intakeforge.app" className="text-blue-600 underline">intakeforge.app</a></li>
        </ul>
      </section>
    </main>
  );
}
