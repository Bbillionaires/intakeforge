"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionType = "short_text" | "long_text" | "multiple_choice" | "checkbox" | "date" | "number";
type Question = { label: string; type: QuestionType; required: boolean; options?: string[] };
type Section = { title: string; description: string; questions: Question[] };
type FormSchema = { title: string; description: string; sections: Section[] };
type Draft = {
  id: number;
  prompt: string;
  title: string;
  description: string;
  approved: boolean;
  schema: FormSchema;
  form_edit_link?: string;
  form_public_link?: string;
  sheet_link?: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://intakeforge-backend-kny734yvda-uc.a.run.app";
const QUESTION_TYPES: QuestionType[] = ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"];

export default function HomePage() {
  const [prompt, setPrompt] = useState("Create a home buyer intake form");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPublish = useMemo(() => !!draft && draft.approved && connected && !busy, [draft, connected, busy]);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, init);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data as T;
  }

  async function refreshStatusAndDrafts() {
    const [status, allDrafts] = await Promise.all([
      api<{ connected: boolean }>("/auth/google/status"),
      api<Draft[]>("/forms"),
    ]);
    setConnected(status.connected);
    setDrafts(allDrafts);
  }

  useEffect(() => {
    refreshStatusAndDrafts().catch((e) => setError(e.message));
  }, []);

  async function connectGoogle() {
    setError(null);
    try {
      const data = await api<{ auth_url: string }>("/auth/google/login");
      window.location.href = data.auth_url;
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const created = await api<Draft>("/forms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      setDraft(created);
      await refreshStatusAndDrafts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(approved = false) {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Draft>(`/forms/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title, description: draft.description, schema: draft.schema, approved }),
      });
      setDraft(updated);
      await refreshStatusAndDrafts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const published = await api<Draft>(`/forms/${draft.id}/publish`, { method: "POST" });
      setDraft(published);
      await refreshStatusAndDrafts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function updateSection(si: number, key: keyof Section, value: string) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    (sections[si] as Record<string, unknown>)[key] = value;
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function updateQuestion(si: number, qi: number, patch: Partial<Question>) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    sections[si].questions[qi] = { ...sections[si].questions[qi], ...patch };
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function deleteQuestion(si: number, qi: number) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    sections[si].questions.splice(qi, 1);
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function deleteSection(si: number) {
    if (!draft || draft.schema.sections.length <= 1) return;
    const sections = [...draft.schema.sections];
    sections.splice(si, 1);
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function addSection() {
    if (!draft) return;
    const sections = [...draft.schema.sections, { title: "New Section", description: "", questions: [] }];
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function addQuestion(si: number) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    sections[si].questions.push({ label: "New question", type: "short_text", required: false });
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IntakeForge</h1>
          <p className="text-sm text-gray-500">Generate intake forms and publish to Google Forms</p>
        </div>
        <button
          onClick={connectGoogle}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            connected
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {connected ? "Google Connected" : "Connect Google"}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Generate a new form</h2>
          <div className="flex gap-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && generate()}
              placeholder="Describe the form you need..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generate}
              disabled={busy}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Saved Drafts</h2>
              {drafts.length === 0 ? (
                <p className="text-sm text-gray-400">No drafts yet.</p>
              ) : (
                <ul className="space-y-2">
                  {drafts.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => setDraft(d)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          draft?.id === d.id
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span className="font-medium truncate block">{d.title}</span>
                        <span className={`text-xs ${d.approved ? "text-green-600" : "text-gray-400"}`}>
                          {d.approved ? "Approved" : "Draft"} #{d.id}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-span-2">
            {draft ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                    <input
                      className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <textarea
                      rows={2}
                      className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {draft.schema.sections.map((section, si) => (
                    <div key={si} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="flex items-start gap-2 mb-3">
                        <input
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={section.title}
                          onChange={(e) => updateSection(si, "title", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => deleteSection(si)}
                          disabled={draft.schema.sections.length <= 1}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={section.description}
                        placeholder="Section description"
                        onChange={(e) => updateSection(si, "description", e.target.value)}
                      />

                      <div className="space-y-2">
                        {section.questions.map((q, qi) => (
                          <div key={qi} className="bg-white border border-gray-200 rounded p-3">
                            <div className="flex gap-2 items-center">
                              <input
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={q.label}
                                onChange={(e) => updateQuestion(si, qi, { label: e.target.value })}
                              />
                              <select
                                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={q.type}
                                onChange={(e) => {
                                  const nextType = e.target.value as QuestionType;
                                  const patch: Partial<Question> = { type: nextType };
                                  if (nextType !== "multiple_choice" && nextType !== "checkbox") patch.options = undefined;
                                  if ((nextType === "multiple_choice" || nextType === "checkbox") && !q.options) patch.options = ["Option 1", "Option 2"];
                                  updateQuestion(si, qi, patch);
                                }}
                              >
                                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) => updateQuestion(si, qi, { required: e.target.checked })}
                                />
                                Required
                              </label>
                              <button
                                type="button"
                                onClick={() => deleteQuestion(si, qi)}
                                className="text-red-400 hover:text-red-600 text-xs px-1"
                                title="Delete question"
                              >
                                ✕
                              </button>
                            </div>
                            {(q.type === "multiple_choice" || q.type === "checkbox") && (
                              <input
                                className="mt-2 w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={(q.options || []).join(", ")}
                                onChange={(e) => {
                                  const options = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                                  updateQuestion(si, qi, { options });
                                }}
                                placeholder="Comma-separated options"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addQuestion(si)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add Question
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSection}
                  className="w-full border-2 border-dashed border-gray-300 rounded-md py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Add Section
                </button>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => save(false)}
                    disabled={busy}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={busy}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={publish}
                    disabled={!canPublish}
                    title={!draft.approved ? "Approve the form first" : !connected ? "Connect Google first" : ""}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publish to Google
                  </button>
                </div>

                {draft.form_edit_link && (
                  <div className="border-t border-gray-200 pt-4 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Published Links</p>
                    <a href={draft.form_edit_link} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">Edit form in Google Forms</a>
                    <a href={draft.form_public_link} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">View public form</a>
                    <a href={draft.sheet_link} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">View response spreadsheet</a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
                <p className="text-lg font-medium">No form selected</p>
                <p className="text-sm mt-1">Generate a new form or open a draft from the list.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
