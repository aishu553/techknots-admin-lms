import React, { useEffect, useState } from "react";
import { getMentorRequests, updateMentorRequestStatus, subscribeMentorRequests } from "../../lib/mentorClient";
import { useToast } from "@/hooks/use-toast";

type Req = { id: string; email: string; userId: string; code: string; requestedAt: string; status: "pending" | "approved" | "rejected" };

export default function MentorRequests() {
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    try {
      // load a limited set to speed up initial checks
      const items = await getMentorRequests(50);
      const mapped = items.map((it: any) => ({
        id: it.id,
        email: it.email,
        userId: it.userId,
        code: it.code,
        requestedAt: it.requestedAt && it.requestedAt.toDate ? it.requestedAt.toDate().toISOString() : new Date().toISOString(),
        status: it.status,
      }));
      setRows(mapped);
    } catch (err) {
      console.error("Failed to load mentor requests:", err);
      toast({ title: "Unable to load requests", description: String(err), variant: "destructive" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    // subscribe to real-time updates; falls back to single read if subscription setup fails
    setLoading(true);
    let first = true;
    const unsub = subscribeMentorRequests(
      (items) => {
        // surface fallback warning if present
        const warning = (items as any).__queryFallbackWarning;
        if (warning) {
          toast({
            title: "Firestore query warning",
            description: "There was a problem running an ordered query (missing index or field). Showing results anyway. Check browser console for details.",
            variant: "destructive",
          });
        }
        const mapped = items.map((it: any) => ({
          id: it.id,
          email: it.email,
          userId: it.userId,
          code: it.code,
          requestedAt: it.requestedAt && it.requestedAt.toDate ? it.requestedAt.toDate().toISOString() : new Date().toISOString(),
          status: it.status,
        }));
        setRows(mapped);
        if (first) {
          first = false;
          setLoading(false);
        }
      },
      (err) => {
        console.error("Real-time subscription error:", err);
        toast({ title: "Realtime error", description: String(err), variant: "destructive" });
        setLoading(false);
      },
      50
    );

    // fallback safety: if no data arrives within 3s, try a single load to populate quickly
    const fallback = setTimeout(() => {
      if (first) {
        load().catch(() => undefined);
      }
    }, 3000);

    return () => {
      clearTimeout(fallback);
      unsub && unsub();
    };
  }, [toast]);

  async function update(id: string, status: Req["status"]) {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await updateMentorRequestStatus(id, status as any);
      setRows(r => r.map(x => (x.id === id ? { ...x, status } : x)));
      toast({ title: `Request ${status}`, description: `Request ${id} marked ${status}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Unable to update", description: String(err), variant: "destructive" });
    } finally {
      setUpdating(u => ({ ...u, [id]: false }));
    }
  }

  const counts = {
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status === "approved").length,
    rejected: rows.filter(r => r.status === "rejected").length,
  };

  return (
    <>
      <div className="page-title">Mentor Requests</div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="card"><div style={{ fontWeight: 700 }}>{counts.pending}</div><div className="small-muted">Pending Requests</div></div>
        <div className="card"><div style={{ fontWeight: 700 }}>{counts.approved}</div><div className="small-muted">Approved</div></div>
        <div className="card"><div style={{ fontWeight: 700 }}>{counts.rejected}</div><div className="small-muted">Rejected</div></div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Mentor Email</th>
              <th>User ID</th>
              <th>Submitted Code</th>
              <th>Requested At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="small-muted">{loading ? "Loading…" : "No requests found."}</td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.email}</td>
                <td>{r.userId}</td>
                <td style={{ fontFamily: "ui-monospace,monospace" }}>{r.code}</td>
                <td>{new Date(r.requestedAt).toLocaleString()}</td>
                <td><span className={`pill ${r.status === "pending" ? "emerald" : r.status === "approved" ? "" : "used"}`}>{r.status}</span></td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={() => update(r.id, "approved")} disabled={!!updating[r.id]}> {updating[r.id] ? "…" : "Approve"}</button>
                  <button className="btn secondary" onClick={() => update(r.id, "rejected")} disabled={!!updating[r.id]}> {updating[r.id] ? "…" : "Reject"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}