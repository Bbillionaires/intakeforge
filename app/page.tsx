"use client";

import { useEffect, useMemo, useState } from "react";

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

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://intakeforge-backend-527226736949.us-central1.run.app";
const QUESTION_TYPES: QuestionType[] = ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"];
const DEPTH_LABELS: Record<number, string> = {
  1: "1 — Bare minimum", 2: "2 — Very simple", 3: "3 — Basic", 4: "4 — Brief",
  5: "5 — Standard", 6: "6 — Detailed", 7: "7 — Professional",
  8: "8 — Thorough", 9: "9 — Comprehensive", 10: "10 — Government standard",
};

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

  const isPro = user?.plan === "pro";
  const formsLeft = user ? user.free_forms_per_month - user.forms_used_this_month : 0;
  const depthLocked = !isPro && depth > (user?.free_max_depth ?? 5);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, { credentials: "include", ...init });
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

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, []);

  async function connectGoogle() {
    setError(null);
    try {
      const data = await api<{ auth_url: string }>("/auth/google/login");
      window.location.href = data.auth_url;
    } catch (e) { setError((e as Error).message); }
  }

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
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
    if (depthLocked) { setError(`Depth ${depth} requires Pro. Upgrade or reduce depth to ${user?.free_max_depth ?? 5}.`); return; }
    setBusy(true); setError(null);
    try {
      const created = await api<Draft>("/forms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, depth }),
      });
      setDraft(created);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo + User */}
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

        {/* Usage / Upgrade */}
        {connected && user && (
          <div className="px-4 py-3 border-b border-gray-100">
            {isPro ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Pro plan — unlimited forms</span>
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
                <p className="text-xs text-gray-400 mt-1">Unlimited forms · Depth 1–10 · Templates</p>
              </div>
            )}
          </div>
        )}

        {/* Generate */}
        <div className="p-4 border-b border-gray-100">
          <textarea
            className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your intake form..."
          />
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Depth</span>
              <span className={depthLocked ? "text-orange-500 font-semibold" : ""}>{DEPTH_LABELS[depth]}{depthLocked ? " 🔒" : ""}</span>
            </div>
            <input type="range" min={1} max={10} value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            {depthLocked && <p className="text-xs text-orange-500 mt-1">Depth {depth} requires Pro plan.</p>}
          </div>
          <button onClick={generate} disabled={busy || !connected}
            className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-semibold">
            {busy ? "Generating…" : "Generate Form"}
          </button>
        </div>

        {/* Tabs */}
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
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
          </div>
        )}

        {!connected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to IntakeForge</h2>
            <p className="text-gray-500 mb-6 max-w-md">Connect your Google account to generate, edit, and publish professional intake forms in seconds.</p>
            <button onClick={connectGoogle} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
              Connect Google to Get Started
            </button>
          </div>
        )}

        {connected && !draft && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-lg font-medium">Enter a prompt and click Generate</p>
            <p className="text-sm mt-1">or select a draft from the sidebar</p>
          </div>
        )}

        {draft && (
          <div className="max-w-3xl mx-auto">
            {/* Header */}
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

              {/* Clone panel */}
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

              {/* Links */}
              {draft.form_public_link && (
                <div className="mt-3 flex gap-3 text-xs flex-wrap">
                  <a href={draft.form_public_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Public form ↗</a>
                  {draft.form_edit_link && <a href={draft.form_edit_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Edit in Google ↗</a>}
                  {draft.sheet_link && <a href={draft.sheet_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Response sheet ↗</a>}
                </div>
              )}
            </div>

            {/* Sections */}
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
  );
}
