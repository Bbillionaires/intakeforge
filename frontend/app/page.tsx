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

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const QUESTION_TYPES: QuestionType[] = ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"];

export default function HomePage() {
  const [prompt, setPrompt] = useState("Create a home buyer intake form");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPublish = useMemo(() => !!draft && connected && !busy, [draft, connected, busy]);

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

  function updateQuestionOptions(sectionIndex: number, questionIndex: number, value: string) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    sections[sectionIndex].questions[questionIndex].options = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function addSection() {
    if (!draft) return;
    const sections = [...draft.schema.sections, { title: "New Section", description: "", questions: [] }];
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  function addQuestion(sectionIndex: number) {
    if (!draft) return;
    const sections = [...draft.schema.sections];
    sections[sectionIndex].questions.push({ label: "New question", type: "short_text", required: false });
    setDraft({ ...draft, schema: { ...draft.schema, sections } });
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Arial" }}>
      <h1>IntakeForge MVP</h1>
      <p>Generate, edit, approve, and publish forms to Google Forms + linked Google Sheets.</p>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ padding: 8 }} />
        <button onClick={generate} disabled={busy}>Generate</button>
        <button onClick={connectGoogle}>{connected ? "Google Connected" : "Connect Google"}</button>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3>Saved Drafts</h3>
        {drafts.length === 0 ? <p>No drafts yet.</p> : (
          <ul>
            {drafts.map((d) => (
              <li key={d.id}>
                <button onClick={() => setDraft(d)} style={{ marginRight: 8 }}>Open</button>
                #{d.id} {d.title} {d.approved ? "(approved)" : "(draft)"}
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft && (
        <div style={{ marginTop: 20, border: "1px solid #ddd", padding: 16 }}>
          <label>Title</label>
          <input style={{ width: "100%", padding: 8, marginBottom: 8 }} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <label>Description</label>
          <textarea style={{ width: "100%", padding: 8, marginBottom: 8 }} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />

          {draft.schema.sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 12, padding: 8, background: "#fafafa" }}>
              <input style={{ width: "100%", padding: 8, fontWeight: "bold" }} value={section.title} onChange={(e) => {
                const sections = [...draft.schema.sections]; sections[si].title = e.target.value; setDraft({ ...draft, schema: { ...draft.schema, sections } });
              }} />
              <textarea style={{ width: "100%", padding: 8, marginTop: 8 }} value={section.description} onChange={(e) => {
                const sections = [...draft.schema.sections]; sections[si].description = e.target.value; setDraft({ ...draft, schema: { ...draft.schema, sections } });
              }} />
              {section.questions.map((q, qi) => (
                <div key={qi} style={{ display: "grid", gridTemplateColumns: "1fr 160px 80px", gap: 8, marginTop: 8 }}>
                  <input value={q.label} onChange={(e) => {
                    const sections = [...draft.schema.sections]; sections[si].questions[qi].label = e.target.value; setDraft({ ...draft, schema: { ...draft.schema, sections } });
                  }} />
                  <select value={q.type} onChange={(e) => {
                    const sections = [...draft.schema.sections];
                    const nextType = e.target.value as QuestionType;
                    sections[si].questions[qi].type = nextType;
                    if (nextType !== "multiple_choice" && nextType !== "checkbox") sections[si].questions[qi].options = undefined;
                    if ((nextType === "multiple_choice" || nextType === "checkbox") && !sections[si].questions[qi].options) sections[si].questions[qi].options = ["Option 1", "Option 2"];
                    setDraft({ ...draft, schema: { ...draft.schema, sections } });
                  }}>
                    {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label><input type="checkbox" checked={q.required} onChange={(e) => {
                    const sections = [...draft.schema.sections]; sections[si].questions[qi].required = e.target.checked; setDraft({ ...draft, schema: { ...draft.schema, sections } });
                  }} /> Req</label>
                  {(q.type === "multiple_choice" || q.type === "checkbox") && (
                    <input
                      style={{ gridColumn: "1 / span 3" }}
                      value={(q.options || []).join(", ")}
                      onChange={(e) => updateQuestionOptions(si, qi, e.target.value)}
                      placeholder="Comma-separated options"
                    />
                  )}
                </div>
              ))}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button type="button" onClick={() => addQuestion(si)}>Add Question</button>
                <button type="button" onClick={() => {
                  const sections = [...draft.schema.sections];
                  sections.splice(si, 1);
                  setDraft({ ...draft, schema: { ...draft.schema, sections } });
                }} disabled={draft.schema.sections.length <= 1}>Remove Section</button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addSection}>Add Section</button>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => save(false)} disabled={busy}>Save Draft</button>
            <button onClick={() => save(true)} disabled={busy}>Approve</button>
            <button onClick={publish} disabled={!canPublish}>Publish to Google</button>
          </div>

          {draft.form_edit_link && (
            <ul style={{ marginTop: 10 }}>
              <li><a href={draft.form_edit_link} target="_blank" rel="noreferrer">Form edit link</a></li>
              <li><a href={draft.form_public_link} target="_blank" rel="noreferrer">Form public link</a></li>
              <li><a href={draft.sheet_link} target="_blank" rel="noreferrer">Spreadsheet link</a></li>
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
