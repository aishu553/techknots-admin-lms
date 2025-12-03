import React, { useEffect, useState } from "react";
import { generateMentorCode } from "./utils";
import { saveMentorCode, listMentorCodes } from "../../lib/mentorClient";
import { useToast } from "@/hooks/use-toast";

type CodeItem = {
  code: string;
  status: "unused" | "used";
  createdAt: string;
  assignedTo?: { email?: string } | null;
};

export default function MentorCodes() {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [query, setQuery] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const { toast } = useToast();

  // Load codes from Firestore
  useEffect(() => {
    setLoadingPage(true);
    let mounted = true;

    listMentorCodes() // fetch all codes
      .then((items: any[]) => {
        if (!mounted) return;
        const mapped = items.map((it) => ({
          code: it.code,
          status: it.status,
          createdAt: it.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          assignedTo: it.assignedTo || null,
        }));
        setCodes(mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch((err) => {
        console.error("Failed to load mentor codes:", err);
        toast({ title: "Unable to load codes", description: String(err), variant: "destructive" });
      })
      .finally(() => setLoadingPage(false));

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Generate code
  async function onGenerate() {
    setLoadingGenerate(true);
    const code = generateMentorCode();
    const optimistic: CodeItem = {
      code,
      status: "unused",
      createdAt: new Date().toISOString(),
      assignedTo: null,
    };
    setCodes((s) => [optimistic, ...s]);

    try {
      await saveMentorCode(code);
      toast({ title: "Mentor code generated", description: code });
    } catch (err: any) {
      setCodes((s) => s.filter((x) => x.code !== code));
      console.error(err);
      toast({ title: "Unable to save code", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setLoadingGenerate(false);
    }
  }

  const filtered = codes.filter(
    (c) =>
      c.code.includes(query.toUpperCase()) ||
      (c.assignedTo?.email || "").toLowerCase().includes(query.toLowerCase())
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: code });
  };

  return (
    <div>
      <div className="page-title">Mentor Code Generator</div>

      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Generate Mentor Codes</div>
          <div className="small-muted">Single-use mentor invitation codes</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn" onClick={onGenerate} disabled={loadingGenerate}>
            {loadingGenerate ? "Generating…" : "Generate New Code"}
          </button>
          {codes[0] && (
            <div className="code-box" onClick={() => copyCode(codes[0].code)} style={{ cursor: "pointer" }}>
              {codes[0].code} (click to copy)
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="card">
        <div className="search-row">
          <input
            className="input"
            placeholder="Search codes or assigned user"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="small-muted">
                  {loadingPage ? "Loading…" : "No mentor codes yet."}
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.code}>
                <td style={{ fontFamily: "ui-monospace,monospace", cursor: "pointer" }} onClick={() => copyCode(c.code)}>
                  {c.code}
                </td>
                <td>
                  <span className={`pill ${c.status === "unused" ? "emerald" : "used"}`}>{c.status}</span>
                </td>
                <td>{new Date(c.createdAt).toLocaleString()}</td>
                <td>{c.assignedTo?.email || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
