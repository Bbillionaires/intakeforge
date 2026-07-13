export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 13, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p>By accessing or using IntakeForge ("Service") at intakeforge.app, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree, do not use the Service. These Terms constitute a legally binding agreement between you and IntakeForge ("we," "us," "our").</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
        <p>IntakeForge is an AI-powered intake form builder that generates professional forms based on your prompts and publishes them to your Google account via the Google Forms and Google Sheets APIs. Features include form generation, editing, templates, and subscription-based access tiers.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Eligibility</h2>
        <p>You must be at least 18 years old and capable of forming a binding contract to use IntakeForge. By using the Service, you represent that you meet these requirements. The Service is intended for business and professional use.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Account and Google Authorization</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You must connect a valid Google account to use core features</li>
          <li>You authorize IntakeForge to create Google Forms, Google Sheets, and Google Drive files in your account on your behalf</li>
          <li>You are responsible for all activity that occurs through your account</li>
          <li>You may revoke our Google access at any time via Google Account settings</li>
          <li>You must keep your authentication token secure and notify us immediately of unauthorized access</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Subscription and Payment</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Free Plan:</strong> 3 forms per month, depth levels 1–5, no template saving</li>
          <li><strong>Pro Plan:</strong> $19/month — unlimited forms, all depth levels, templates, priority support</li>
          <li>Payments are processed by Stripe. By subscribing, you authorize recurring charges</li>
          <li>Subscriptions renew automatically. Cancel anytime via the billing portal in the app</li>
          <li>Refunds are not provided for partial billing periods</li>
          <li>We reserve the right to change pricing with 30 days notice</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
        <p className="mb-2">You agree not to use IntakeForge to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Collect information illegally or in violation of any applicable privacy law (GDPR, CCPA, HIPAA, etc.)</li>
          <li>Create forms designed to deceive, defraud, or phish respondents</li>
          <li>Collect sensitive personal data without proper consent and legal basis</li>
          <li>Violate any applicable law, regulation, or third-party rights</li>
          <li>Reverse engineer, copy, or resell the Service without authorization</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Use automated scripts to abuse the Service beyond normal use</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Your Content and Responsibility</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You retain ownership of all form content you create</li>
          <li>You are solely responsible for the content of forms you generate and publish</li>
          <li>You are responsible for complying with applicable privacy laws when collecting data from your respondents</li>
          <li>You grant IntakeForge a limited license to process and store your content solely to provide the Service</li>
          <li>AI-generated content is provided as-is — review all content before publishing</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Data Collection Compliance</h2>
        <p className="mb-2">If you use IntakeForge to collect personal data from third parties via published forms, you are acting as the data controller and are solely responsible for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Obtaining proper consent from respondents</li>
          <li>Providing respondents with required privacy notices</li>
          <li>Complying with GDPR, CCPA, HIPAA, or other applicable data protection laws</li>
          <li>Securing and properly handling collected responses in your Google Sheets</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>The IntakeForge name, logo, software, and all associated IP are owned by IntakeForge and protected by intellectual property laws</li>
          <li>You may not copy, modify, distribute, or create derivative works of our Service without written permission</li>
          <li>AI-generated form content is provided for your use; we make no copyright claims on forms you generate</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Disclaimers</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>The Service is provided "AS IS" without warranties of any kind, express or implied</li>
          <li>We do not guarantee that AI-generated forms are accurate, complete, or legally compliant for your specific use case</li>
          <li>We do not guarantee uninterrupted or error-free service</li>
          <li>We are not responsible for the availability or performance of Google's APIs</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, IntakeForge shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">12. Indemnification</h2>
        <p>You agree to indemnify and hold harmless IntakeForge and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or violation of any third-party rights.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">13. Termination</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You may cancel your account at any time via the billing portal or by emailing us</li>
          <li>We may suspend or terminate your account for violation of these Terms, non-payment, or at our discretion with reasonable notice</li>
          <li>Upon termination, your right to use the Service ceases immediately</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">14. Governing Law and Disputes</h2>
        <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any disputes shall be resolved by binding arbitration under the AAA Commercial Arbitration Rules, except you may bring claims in small claims court. Class action waiver applies.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">15. Changes to Terms</h2>
        <p>We may update these Terms at any time. We will provide 30 days notice of material changes via email or in-app notification. Continued use after the effective date constitutes acceptance.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">16. Contact</h2>
        <ul className="list-none space-y-1">
          <li>Email: <a href="mailto:contact@intakeforge.com" className="text-blue-600 underline">contact@intakeforge.com</a></li>
          <li>Website: <a href="https://intakeforge.app" className="text-blue-600 underline">intakeforge.app</a></li>
        </ul>
      </section>
    </main>
  );
}
