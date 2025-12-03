import React, { useEffect, useState } from "react";
import { subscribeUsers, updateUserRole, deleteUserDoc } from "@/lib/userClient";

type User = { id: string; name?: string; email?: string; role?: "student" | "mentor" | "admin"; joinedAt?: string };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "student" | "mentor" | "admin">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const unsub = subscribeUsers(
      (items) => {
        setUsers(items as any);
      },
      (err) => {
        console.warn("Failed to subscribe to users:", err);
      }
    );

    return () => unsub();
  }, []);

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (q && !((u.name || "").toLowerCase().includes(q.toLowerCase()) || (u.email || "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  async function changeRole(id: string, role: User["role"]) {
    // optimistic UI update
    setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, role } : x)));
    try {
      await updateUserRole(id, role as any);
    } catch (err) {
      console.warn("Failed to update role:", err);
    }
  }

  async function deleteUser(id: string) {
    setUsers((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteUserDoc(id);
    } catch (err) {
      console.warn("Failed to delete user:", err);
    }
  }

  return (
    <>
      <div className="page-title">User Management</div>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={filter === "all" ? "btn" : "btn secondary"} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "student" ? "btn" : "btn secondary"} onClick={() => setFilter("student")}>Students</button>
          <button className={filter === "mentor" ? "btn" : "btn secondary"} onClick={() => setFilter("mentor")}>Mentors</button>
          <button className={filter === "admin" ? "btn" : "btn secondary"} onClick={() => setFilter("admin")}>Admins</button>
        </div>
        <div style={{ flex: 1 }} />
        <input className="input" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as any)} style={{ padding: 8, borderRadius: 8 }}>
                    <option value="student">student</option>
                    <option value="mentor">mentor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "-"}</td>
                <td>
                  <button className="btn secondary" onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}