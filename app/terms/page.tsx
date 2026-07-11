export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 11, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Acceptance</h2>
        <p>By using IntakeForge, you agree to these terms. If you do not agree, do not use the service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
        <p>IntakeForge is a web application that uses AI to generate professional intake forms and publishes them to Google Forms on your behalf.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Your Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You are responsible for the content of forms you create and publish.</li>
          <li>You must not use IntakeForge to collect data illegally or in violation of privacy laws.</li>
          <li>You must have a legitimate purpose for any intake form you publish.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Google Account</h2>
        <p>You authorize IntakeForge to create Google Forms and Sheets in your Google account. You may revoke this access at any time via Google Account settings. We are not responsible for content published to your Google account.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. AI-Generated Content</h2>
        <p>Forms are generated using AI. We do not guarantee accuracy, completeness, or fitness for any particular purpose. Review all generated content before publishing or distributing.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
        <p>IntakeForge is provided "as is" without warranties. We are not liable for any damages arising from use of the service, including lost data, published forms, or third-party actions.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
        <p>Questions? Email <a href="mailto:henry@greenwood100inc.com" className="text-blue-600 underline">henry@greenwood100inc.com</a></p>
      </section>
    </main>
  );
}
