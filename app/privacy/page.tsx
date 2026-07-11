export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 11, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Overview</h2>
        <p>IntakeForge ("we", "us", "our") operates the IntakeForge web application. This policy explains what data we collect, how we use it, and your rights.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google OAuth tokens</strong> — stored securely to publish forms to your Google account on your behalf.</li>
          <li><strong>Form drafts</strong> — the prompts and form schemas you create are stored in our database.</li>
          <li><strong>Usage data</strong> — basic server logs (IP address, timestamps) for security and debugging.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To generate and publish Google Forms to your Google account.</li>
          <li>To save and retrieve your form drafts and templates.</li>
          <li>We do not sell your data to third parties.</li>
          <li>We do not use your data for advertising.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Google API Usage</h2>
        <p>IntakeForge uses the Google Forms API and Google Sheets API solely to create forms and spreadsheets in your Google account. We request only the minimum permissions needed. Our use of Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Data Retention</h2>
        <p>Form drafts and OAuth tokens are retained until you delete them or request account deletion. You may revoke Google access at any time via <a href="https://myaccount.google.com/permissions" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google Account Permissions</a>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Security</h2>
        <p>We use industry-standard practices to protect your data. OAuth tokens are stored encrypted. However, no system is 100% secure — use at your own risk.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
        <p>For privacy questions or data deletion requests, email: <a href="mailto:henry@greenwood100inc.com" className="text-blue-600 underline">henry@greenwood100inc.com</a></p>
      </section>
    </main>
  );
}
