"use client";

import { useEffect, useState } from "react";

type QuestionType = "short_text" | "long_text" | "multiple_choice" | "checkbox" | "date" | "number";
type Question = { label: string; type: QuestionType; required: boolean; options?: string[] };
type Section = { title: string; description: string; questions: Question[] };
type FormSchema = { title: string; description: string; sections: Section[] };
type Draft = {
  id: number; prompt: string; title: string; description: string;
  approved: boolean; is_template: boolean; template_name?: string;
  schema: FormSchema; form_edit_link?: string; form_public_link?: string; sheet_link?: string;
};
type UserInfo = {
  id: number; email: string; name: string; picture: string; plan: string;
  forms_used_this_month: number; free_forms_per_month: number; free_max_depth: number;
};

const API = "/api/proxy";
const QUESTION_TYPES: QuestionType[] = ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"];
const DEPTH_LABELS: Record<number, string> = {
  1: "Bare minimum", 2: "Very simple", 3: "Basic", 4: "Brief",
  5: "Standard", 6: "Detailed", 7: "Professional",
  8: "Thorough", 9: "Comprehensive", 10: "Gov. standard",
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("intakeforge_token");
}
function setToken(t: string) { localStorage.setItem("intakeforge_token", t); }
function clearToken() { localStorage.removeItem("intakeforge_token"); }

export default function HomePage() {
  const [prompt, setPrompt] = useState("Create a home buyer intake form");
  const [depth, setDepth] = useState(5);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [templates, setTemplates] = useState<Draft[]>([]);
  const [tab, setTab] = useState<"drafts" | "templates">("drafts");
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [showClone, setShowClone] = useState(false);
  const [makeTemplate, setMakeTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  // Mobile nav: "generate" | "forms" | "account"
  const [mobileTab, setMobileTab] = useState<"generate" | "forms" | "account">("generate");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isPro = user?.plan === "pro";
  const depthLocked = !isPro && depth > (user?.free_max_depth ?? 5);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();
    const method = init?.method || "GET";
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (init?.body) headers["Content-Type"] = "application/json";
    const res = await fetch(`${API}?path=${encodeURIComponent(path)}`, { ...init, method, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data as T;
  }

  async function refresh() {
    const status = await api<{ connected: boolean; user?: UserInfo }>("/auth/google/status");
    setConnected(status.connected);
    setUser(status.user ?? null);
    if (status.connected) {
      const [allDrafts, allTemplates] = await Promise.all([
        api<Draft[]>("/forms"),
        api<Draft[]>("/templates"),
      ]);
      setDrafts(allDrafts);
      setTemplates(allTemplates);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      window.history.replaceState({}, "", "/");
    }
    refresh().catch((e) => setError(e.message));
  }, []);

  async function connectGoogle() {
    setError(null);
    try {
      const data = await api<{ auth_url: string }>("/auth/google/login");
      window.location.href = data.auth_url;
    } catch (e) { setError((e as Error).message); }
  }

  function logout() {
    clearToken();
    setConnected(false); setUser(null); setDrafts([]); setTemplates([]); setDraft(null);
  }

  async function upgrade() {
    setBusy(true);
    try {
      const data = await api<{ url: string }>("/billing/checkout", { method: "POST" });
      window.location.href = data.url;
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function manageSubscription() {
    setBusy(true);
    try {
      const data = await api<{ url: string }>("/billing/portal", { method: "POST" });
      window.location.href = data.url;
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function generate() {
    if (depthLocked) { setError(`Depth ${depth} requires Pro. Upgrade or reduce depth.`); return; }
    setBusy(true); setError(null);
    try {
      const created = await api<Draft>("/forms/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, depth }),
      });
      setDraft(created);
      setMobileTab("generate");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function save(approved = false) {
    if (!draft) return;
    setBusy(true); setError(null);
    try {
      const updated = await api<Draft>(`/forms/${draft.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: draft.title, description: draft.description, schema: draft.schema, approved, is_template: draft.is_template, template_name: draft.template_name }),
      });
      setDraft(updated);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!draft) return;
    setBusy(true); setError(null);
    try {
      const published = await api<Draft>(`/forms/${draft.id}/publish`, { method: "POST" });
      setDraft(published);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function cloneForm() {
    if (!draft || !cloneTitle.trim()) return;
    setBusy(true); setError(null);
    try {
      const cloned = await api<Draft>(`/forms/${draft.id}/clone`, {
        method: "POST",
        body: JSON.stringify({ title: cloneTitle, make_template: makeTemplate, template_name: makeTemplate ? templateName : undefined }),
      });
      setDraft(cloned);
      setShowClone(false); setCloneTitle(""); setMakeTemplate(false); setTemplateName("");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  function updateQuestion(si: number, qi: number, field: keyof Question, value: unknown) {
    if (!draft) return;
    const sections = draft.schema.sections.map((s, i) =>
      i !== si ? s : { ...s, questions: s.questions.map((q, j) => j !== qi ? q : { ...q, [field]: value }) }
    );
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function addQuestion(si: number) {
    if (!draft) return;
    const sections = draft.schema.sections.map((s, i) =>
      i !== si ? s : { ...s, questions: [...s.questions, { label: "New question", type: "short_text" as QuestionType, required: false }] }
    );
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function removeQuestion(si: number, qi: number) {
    if (!draft) return;
    const sections = draft.schema.sections.map((s, i) =>
      i !== si ? s : { ...s, questions: s.questions.filter((_, j) => j !== qi) }
    );
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  async function uploadFile(file: File) {
    if (!connected) { setError("Connect your Google account first."); return; }
    setUploading(true); setError(null);
    try {
      // Read the file as text in the browser, then send as a normal JSON prompt
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        if (file.name.endsWith(".pdf")) {
          reject(new Error("PDF reading requires the backend. Please use a .txt or .docx file, or type a prompt instead."));
        } else {
          reader.readAsText(file);
        }
      });
      const truncated = text.slice(0, 10000);
      const filePrompt = `Based on the following document, create a professional intake form that captures all relevant information:\n\nFilename: ${file.name}\n\n${truncated}`;
      setPrompt(filePrompt);
      // Generate immediately using the existing endpoint
      const created = await api<Draft>("/forms/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: filePrompt, depth }),
      });
      setDraft(created);
      setMobileTab("generate");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  // ── Generate panel (used in sidebar on desktop, main view on mobile) ──
  const GeneratePanel = () => (
    <div className="p-4">
      <textarea
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your intake form…"
      />
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Depth</span>
          <span className={depthLocked ? "text-orange-500 font-semibold" : ""}>{depth} — {DEPTH_LABELS[depth]}{depthLocked ? " 🔒" : ""}</span>
        </div>
        <input type="range" min={1} max={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full accent-blue-600" />
        {depthLocked && <p className="text-xs text-orange-500 mt-1">Depth {depth} requires Pro plan.</p>}
      </div>
      {!connected ? (
        <button onClick={connectGoogle} className="mt-3 w-full bg-blue-600 text-white text-sm py-3 rounded-xl hover:bg-blue-700 font-semibold">
          Connect Google to Generate
        </button>
      ) : (
        <>
          <button onClick={generate} disabled={busy || uploading}
            className="mt-3 w-full bg-blue-600 text-white text-sm py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 font-semibold">
            {busy ? "Generating…" : "Generate Form"}
          </button>
          <label className={`mt-2 w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-600 text-sm py-3 rounded-xl hover:bg-blue-50 cursor-pointer font-medium ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <span>📄</span> {uploading ? "Converting…" : "Upload a document instead"}
            <input type="file" className="hidden" accept=".txt,.md,.csv,.docx,.doc"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
          </label>
          <p className="text-xs text-gray-400 mt-1 text-center">PDF · DOCX · TXT — auto-converted to a form</p>
        </>
      )}

      {connected && !isPro && user && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Forms this month</span>
            <span>{user.forms_used_this_month} / {user.free_forms_per_month}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (user.forms_used_this_month / user.free_forms_per_month) * 100)}%` }} />
          </div>
          <button onClick={upgrade} disabled={busy} className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 font-semibold">
            Upgrade to Pro — $19/mo
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">Unlimited forms · All depths · Templates</p>
        </div>
      )}
    </div>
  );

  // ── Forms list panel ──
  const FormsPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-100">
        {(["drafts", "templates"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-sm py-3 font-medium capitalize ${tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {(tab === "drafts" ? drafts : templates).length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-12 px-6">
            {tab === "drafts" ? "No drafts yet. Generate your first form!" : "No templates yet. Clone a draft to create one."}
          </p>
        ) : (tab === "drafts" ? drafts : templates).map((d) => (
          <button key={d.id} onClick={() => { setDraft(d); setMobileTab("generate"); }}
            className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 ${draft?.id === d.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}>
            <p className="text-sm font-semibold truncate">{d.title}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{d.prompt}</p>
            {d.approved && <span className="text-xs text-green-600 font-medium mt-1 inline-block">✓ Published</span>}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Account panel ──
  const AccountPanel = () => (
    <div className="p-4 space-y-4">
      {!connected ? (
        <div className="text-center pt-8">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">Welcome to IntakeForge</h2>
          <p className="text-gray-500 mb-6 text-sm">Connect your Google account to get started.</p>
          <button onClick={connectGoogle} className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
            Connect Google
          </button>
        </div>
      ) : user && (
        <>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            {user.picture && <img src={user.picture} className="w-12 h-12 rounded-full" alt="" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name || user.email}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              {isPro && <span className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold mt-1">PRO</span>}
            </div>
          </div>

          {isPro ? (
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 mb-1">Pro Plan Active</p>
              <p className="text-xs text-blue-600 mb-3">Unlimited forms · All depths · Templates</p>
              <button onClick={manageSubscription} className="w-full text-sm border border-blue-300 text-blue-700 py-2 rounded-lg hover:bg-blue-100">
                Manage Subscription
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold mb-1">Free Plan</p>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Forms this month</span>
                <span>{user.forms_used_this_month} / {user.free_forms_per_month}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (user.forms_used_this_month / user.free_forms_per_month) * 100)}%` }} />
              </div>
              <button onClick={upgrade} disabled={busy} className="w-full bg-blue-600 text-white text-sm py-2.5 rounded-lg hover:bg-blue-700 font-semibold mb-1">
                Upgrade to Pro — $19/mo
              </button>
              <p className="text-xs text-gray-400 text-center">Unlimited forms · Depth 1–10 · Templates</p>
            </div>
          )}

          <button onClick={logout} className="w-full text-sm border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50">
            Sign Out
          </button>
        </>
      )}

      <div className="pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 justify-center">
          <a href="/privacy" className="hover:text-gray-600">Privacy</a>
          <a href="/terms" className="hover:text-gray-600">Terms</a>
          <a href="/security" className="hover:text-gray-600">Security</a>
          <a href="mailto:contact@intakeforge.com" className="hover:text-gray-600">Contact</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">IntakeForge</h1>
            {isPro && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">PRO</span>}
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              {user.picture && <img src={user.picture} className="w-8 h-8 rounded-full" alt="" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">Out</button>
            </div>
          ) : (
            <button onClick={connectGoogle} className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">
              Connect Google
            </button>
          )}
        </div>

        {/* Billing status */}
        {connected && user && (
          <div className="px-4 py-3 border-b border-gray-100">
            {isPro ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Pro — unlimited forms</span>
                <button onClick={manageSubscription} className="text-xs text-blue-600 hover:underline">Manage</button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Forms this month</span>
                  <span>{user.forms_used_this_month} / {user.free_forms_per_month}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (user.forms_used_this_month / user.free_forms_per_month) * 100)}%` }} />
                </div>
                <button onClick={upgrade} disabled={busy} className="w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 font-semibold">
                  Upgrade to Pro — $19/mo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generate inputs */}
        <div className="p-4 border-b border-gray-100">
          <textarea
            className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your intake form…"
          />
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Depth</span>
              <span className={depthLocked ? "text-orange-500 font-semibold" : ""}>{depth} — {DEPTH_LABELS[depth]}{depthLocked ? " 🔒" : ""}</span>
            </div>
            <input type="range" min={1} max={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full accent-blue-600" />
            {depthLocked && <p className="text-xs text-orange-500 mt-1">Depth {depth} requires Pro.</p>}
          </div>
          <button onClick={generate} disabled={busy || !connected}
            className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-semibold">
            {busy ? "Generating…" : "Generate Form"}
          </button>
        </div>

        {/* Drafts / templates list */}
        {connected && (
          <>
            <div className="flex border-b border-gray-100">
              {(["drafts", "templates"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 text-xs py-2 font-medium capitalize ${tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {(tab === "drafts" ? drafts : templates).map((d) => (
                <button key={d.id} onClick={() => setDraft(d)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${draft?.id === d.id ? "bg-blue-50" : ""}`}>
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-gray-400 truncate">{d.prompt}</p>
                  {d.approved && <span className="text-xs text-green-600 font-medium">Published</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Policy links */}
        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
            <a href="/privacy" className="hover:text-gray-600">Privacy</a>
            <a href="/terms" className="hover:text-gray-600">Terms</a>
            <a href="/security" className="hover:text-gray-600">Security</a>
            <a href="mailto:contact@intakeforge.com" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">
          IntakeForge {isPro && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">PRO</span>}
        </h1>
        {user ? (
          <div className="flex items-center gap-2">
            {user.picture && <img src={user.picture} className="w-7 h-7 rounded-full" alt="" />}
            <span className="text-xs text-gray-600 max-w-[120px] truncate">{user.name || user.email}</span>
          </div>
        ) : (
          <button onClick={connectGoogle} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">
            Connect Google
          </button>
        )}
      </header>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-hidden">

        {/* Mobile tab content */}
        <div className="md:hidden flex-1 overflow-y-auto pb-20">
          {error && (
            <div className="m-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
            </div>
          )}

          {mobileTab === "generate" && (
            <div>
              <GeneratePanel />
              {draft && (
                <div className="px-4 pb-4 space-y-3">
                  <button onClick={() => setDraft(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                    ← New Form
                  </button>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <input className="text-lg font-bold w-full border-none outline-none mb-1"
                      value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                    <textarea className="text-sm text-gray-500 w-full border-none outline-none resize-none"
                      rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex gap-2">
                        <button onClick={() => save(false)} disabled={busy} className="flex-1 text-sm py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40">Save</button>
                        <button onClick={() => save(true)} disabled={busy} className="flex-1 text-sm py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40">Approve</button>
                      </div>
                      <button onClick={publish} disabled={!draft.approved || busy}
                        className="w-full text-sm py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 font-semibold">
                        {draft.form_public_link ? "Re-publish to Google" : "Publish to Google Forms"}
                      </button>
                      <button onClick={() => setShowClone(!showClone)}
                        className="w-full text-sm py-2.5 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50">
                        Use as Template
                      </button>
                    </div>

                    {showClone && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <input className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-2"
                          placeholder="New form title" value={cloneTitle} onChange={(e) => setCloneTitle(e.target.value)} />
                        <label className="flex items-center gap-2 text-sm mb-2">
                          <input type="checkbox" checked={makeTemplate} onChange={(e) => setMakeTemplate(e.target.checked)} />
                          Save as template {!isPro && <span className="text-orange-500 text-xs">(Pro only)</span>}
                        </label>
                        {makeTemplate && (
                          <input className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-2"
                            placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                        )}
                        <div className="flex gap-2">
                          <button onClick={cloneForm} disabled={busy || !cloneTitle.trim()} className="flex-1 text-sm py-2 bg-blue-600 text-white rounded-lg disabled:opacity-40">Clone</button>
                          <button onClick={() => setShowClone(false)} className="flex-1 text-sm py-2 border border-gray-300 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    )}

                    {draft.form_public_link && (
                      <div className="mt-3 flex flex-col gap-1.5 text-sm">
                        <a href={draft.form_public_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">↗ Open public form</a>
                        {draft.form_edit_link && <a href={draft.form_edit_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">↗ Edit in Google Forms</a>}
                        {draft.sheet_link && <a href={draft.sheet_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">↗ Response sheet</a>}
                      </div>
                    )}
                  </div>

                  {draft.schema.sections.map((section, si) => (
                    <div key={si} className="bg-white rounded-xl border border-gray-200 p-4">
                      <input className="font-semibold text-base w-full border-none outline-none mb-1"
                        value={section.title}
                        onChange={(e) => {
                          const sections = draft.schema.sections.map((s, i) => i !== si ? s : { ...s, title: e.target.value });
                          setDraft({ ...draft, schema: { ...draft.schema, sections } });
                        }} />
                      <input className="text-xs text-gray-400 w-full border-none outline-none mb-3"
                        value={section.description}
                        onChange={(e) => {
                          const sections = draft.schema.sections.map((s, i) => i !== si ? s : { ...s, description: e.target.value });
                          setDraft({ ...draft, schema: { ...draft.schema, sections } });
                        }} />
                      {section.questions.map((q, qi) => (
                        <div key={qi} className="mb-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-start gap-2 mb-2">
                            <input className="flex-1 text-sm font-medium border-none bg-transparent outline-none"
                              value={q.label} onChange={(e) => updateQuestion(si, qi, "label", e.target.value)} />
                            <button onClick={() => removeQuestion(si, qi)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select className="flex-1 text-xs border border-gray-200 rounded-lg p-1.5 bg-white"
                              value={q.type} onChange={(e) => updateQuestion(si, qi, "type", e.target.value as QuestionType)}>
                              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <label className="flex items-center gap-1 text-xs text-gray-500">
                              <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(si, qi, "required", e.target.checked)} />
                              Required
                            </label>
                          </div>
                          {(q.type === "multiple_choice" || q.type === "checkbox") && (
                            <textarea className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg p-1.5 bg-white outline-none resize-none mt-2"
                              rows={2} placeholder="Options (one per line)"
                              value={(q.options || []).join("\n")}
                              onChange={(e) => updateQuestion(si, qi, "options", e.target.value.split("\n").filter(Boolean))} />
                          )}
                        </div>
                      ))}
                      <button onClick={() => addQuestion(si)} className="text-xs text-blue-600 hover:underline">+ Add question</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mobileTab === "forms" && <FormsPanel />}
          {mobileTab === "account" && <AccountPanel />}
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
          {([
            { key: "generate", label: "Generate", icon: "✨" },
            { key: "forms", label: "My Forms", icon: "📋" },
            { key: "account", label: "Account", icon: "👤" },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setMobileTab(key)}
              className={`flex-1 flex flex-col items-center py-2.5 text-xs gap-0.5 ${mobileTab === key ? "text-blue-600" : "text-gray-400"}`}>
              <span className="text-lg leading-none">{icon}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* ── Desktop main panel ── */}
        <main className="hidden md:block flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
            </div>
          )}

          {!draft && (
            <div className="flex flex-col items-center justify-center h-full">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <div className="text-5xl mb-4">{uploading ? "⏳" : "📄"}</div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  {uploading ? "Converting document…" : "Drop a document to create a form"}
                </h2>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  Drop a resume, contract, PDF, Word doc, or any text file. IntakeForge will read it and generate a complete intake form automatically.
                </p>
                <p className="text-xs text-gray-400 mb-6">Supports TXT · MD · CSV · DOCX (text-based files)</p>

                <label className={`inline-flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <span>📂</span> Browse files
                  <input type="file" className="hidden" accept=".txt,.md,.csv,.docx,.doc"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
                </label>

                {!connected && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    <strong>Connect Google first</strong> — click "Connect Google" in the sidebar to get started.
                  </div>
                )}
              </div>

              <div className="mt-6 text-center text-gray-400 text-sm">
                <span>— or type a prompt in the sidebar and click <strong>Generate Form</strong> —</span>
              </div>
            </div>
          )}

          {draft && (
            <div className="max-w-3xl mx-auto">
              <button onClick={() => setDraft(null)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                ← New Form
              </button>
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <input className="text-xl font-bold w-full border-none outline-none mb-1"
                  value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <textarea className="text-sm text-gray-500 w-full border-none outline-none resize-none"
                  rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => save(false)} disabled={busy} className="text-sm px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Save Draft</button>
                  <button onClick={() => save(true)} disabled={busy} className="text-sm px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Approve</button>
                  <button onClick={publish} disabled={!draft.approved || busy}
                    className="text-sm px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40">
                    {draft.form_public_link ? "Re-publish" : "Publish to Google"}
                  </button>
                  <button onClick={() => setShowClone(!showClone)}
                    className="text-sm px-4 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
                    Use as Template
                  </button>
                </div>

                {showClone && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input className="w-full border border-gray-200 rounded p-2 text-sm mb-2"
                      placeholder="New form title" value={cloneTitle} onChange={(e) => setCloneTitle(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm mb-2">
                      <input type="checkbox" checked={makeTemplate} onChange={(e) => setMakeTemplate(e.target.checked)} />
                      Save as reusable template {!isPro && <span className="text-orange-500 text-xs">(Pro only)</span>}
                    </label>
                    {makeTemplate && (
                      <input className="w-full border border-gray-200 rounded p-2 text-sm mb-2"
                        placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                    )}
                    <div className="flex gap-2">
                      <button onClick={cloneForm} disabled={busy || !cloneTitle.trim()} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">Clone</button>
                      <button onClick={() => setShowClone(false)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}

                {draft.form_public_link && (
                  <div className="mt-3 flex gap-3 text-xs flex-wrap">
                    <a href={draft.form_public_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Public form ↗</a>
                    {draft.form_edit_link && <a href={draft.form_edit_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Edit in Google ↗</a>}
                    {draft.sheet_link && <a href={draft.sheet_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Response sheet ↗</a>}
                  </div>
                )}
              </div>

              {draft.schema.sections.map((section, si) => (
                <div key={si} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                  <input className="font-semibold text-base w-full border-none outline-none mb-1"
                    value={section.title}
                    onChange={(e) => {
                      const sections = draft.schema.sections.map((s, i) => i !== si ? s : { ...s, title: e.target.value });
                      setDraft({ ...draft, schema: { ...draft.schema, sections } });
                    }} />
                  <input className="text-xs text-gray-400 w-full border-none outline-none mb-3"
                    value={section.description}
                    onChange={(e) => {
                      const sections = draft.schema.sections.map((s, i) => i !== si ? s : { ...s, description: e.target.value });
                      setDraft({ ...draft, schema: { ...draft.schema, sections } });
                    }} />
                  {section.questions.map((q, qi) => (
                    <div key={qi} className="flex gap-2 items-start mb-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input className="w-full text-sm font-medium border-none bg-transparent outline-none"
                          value={q.label} onChange={(e) => updateQuestion(si, qi, "label", e.target.value)} />
                        {(q.type === "multiple_choice" || q.type === "checkbox") && (
                          <textarea className="w-full text-xs text-gray-500 border-none bg-transparent outline-none resize-none mt-1"
                            rows={2} placeholder="Options (one per line)"
                            value={(q.options || []).join("\n")}
                            onChange={(e) => updateQuestion(si, qi, "options", e.target.value.split("\n").filter(Boolean))} />
                        )}
                      </div>
                      <select className="text-xs border border-gray-200 rounded p-1 bg-white"
                        value={q.type} onChange={(e) => updateQuestion(si, qi, "type", e.target.value as QuestionType)}>
                        {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                        <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(si, qi, "required", e.target.checked)} />
                        Req
                      </label>
                      <button onClick={() => removeQuestion(si, qi)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                    </div>
                  ))}
                  <button onClick={() => addQuestion(si)} className="text-xs text-blue-600 hover:underline mt-1">+ Add question</button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
