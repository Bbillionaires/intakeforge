"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-bold tracking-tight">IntakeForge</span>
        <div className="flex items-center gap-6 text-sm">
          <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
          <a href="#how" className="text-gray-600 hover:text-gray-900">How it works</a>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Launch App</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">AI-Powered Form Builder</div>
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Generate professional intake forms<br />in seconds with AI
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Describe what you need. IntakeForge generates a complete, customizable intake form and publishes it directly to Google Forms — ready to share instantly.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition">Get Started Free</Link>
          <a href="#how" className="border border-gray-300 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-gray-50 transition">See how it works</a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to capture leads</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🤖", title: "AI Form Generation", desc: "Describe your intake needs in plain English. Claude AI builds the complete form structure instantly." },
              { icon: "📊", title: "Depth Control", desc: "Choose 1–10 comprehensiveness. From a simple 3-question form to a government-level 50-question document." },
              { icon: "📝", title: "Google Forms Publishing", desc: "One click publishes your form to Google Forms with a linked Google Sheet for responses." },
              { icon: "📁", title: "Templates", desc: "Save any published form as a reusable template. Clone and customize for new clients instantly." },
              { icon: "✏️", title: "Full Editor", desc: "Edit titles, questions, options, and sections before publishing. Full control at every step." },
              { icon: "🔗", title: "Instant Sharing", desc: "Get a shareable public link the moment you publish. Send it to clients immediately." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="space-y-8">
          {[
            { step: "1", title: "Describe your form", desc: 'Type something like "Mortgage loan application for first-time home buyers" and set the depth level.' },
            { step: "2", title: "Review and edit", desc: "AI generates a complete multi-section form. Edit any question, add options, or remove sections." },
            { step: "3", title: "Publish to Google Forms", desc: "Connect your Google account once. Click Publish — your form and response sheet go live instantly." },
            { step: "4", title: "Share and collect", desc: "Copy the public link and send it to clients. Responses land in your Google Sheet automatically." },
          ].map((s) => (
            <div key={s.step} className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to build your first form?</h2>
        <p className="text-blue-100 mb-8 text-lg">No credit card required. Connect Google and start in seconds.</p>
        <Link href="/" className="bg-white text-blue-600 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-50 transition">Launch IntakeForge</Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100">
        <div className="flex justify-center gap-6 mb-2 flex-wrap">
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
          <Link href="/security" className="hover:text-gray-600">Security</Link>
          <a href="mailto:contact@intakeforge.com" className="hover:text-gray-600">Contact</a>
        </div>
        <p>© 2026 IntakeForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
