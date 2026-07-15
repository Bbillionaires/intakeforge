export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Security</h1>
      <p className="text-sm text-gray-500 mb-10">How we protect your data and your forms</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Authentication</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Google OAuth 2.0</strong> — we never see or store your Google password. Authentication is handled entirely by Google.</li>
          <li><strong>JWT tokens</strong> — sessions use signed JSON Web Tokens with 30-day expiration stored in your browser's localStorage.</li>
          <li><strong>Token rotation</strong> — Google refresh tokens are rotated automatically and stored encrypted.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Encryption</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>In transit:</strong> All communication uses TLS 1.2+ (HTTPS). No plain HTTP.</li>
          <li><strong>At rest:</strong> Data stored on Google Cloud infrastructure with AES-256 encryption.</li>
          <li><strong>Payments:</strong> Card data is never stored by us — handled entirely by Stripe (PCI DSS Level 1 certified).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Google API Access</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>We request only the minimum Google API scopes required to operate.</li>
          <li>Forms and sheets are created in <strong>your</strong> Google Drive — we do not store your form content on our servers beyond what's needed to display it in the app.</li>
          <li>You can revoke our access at any time at <a href="https://myaccount.google.com/permissions" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Infrastructure</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Backend:</strong> Google Cloud Run — auto-scaling, isolated containers, built-in DDoS protection.</li>
          <li><strong>Frontend:</strong> Vercel — global CDN, automatic HTTPS, isolated deployments.</li>
          <li><strong>Access control:</strong> Production systems accessible only via authenticated service accounts.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Responsible Disclosure</h2>
        <p>If you discover a security vulnerability, please report it responsibly to <a href="mailto:contact@intakeforge.com" className="text-blue-600 underline">contact@intakeforge.com</a>. We will acknowledge your report within 48 hours and work to resolve confirmed issues promptly.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Your Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Keep your device and browser secure.</li>
          <li>Log out of shared devices after use.</li>
          <li>Do not share your session token with anyone.</li>
          <li>If you believe your account is compromised, revoke Google access immediately and contact us.</li>
        </ul>
      </section>
    </main>
  );
}
