import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import "./admin.css";
import {
  Home,
  Users,
  Key,
  Inbox,
  BarChart2,
  Settings as Cog,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("adminSidebarCollapsed");
      return raw === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("adminSidebarCollapsed", String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();

      // update function to read user from auth
      const refreshFromAuth = () => {
        const u = auth.currentUser;
        setDisplayName(u?.displayName ?? null);
        setPhotoURL(u?.photoURL ?? null);
      };

      // initial read
      refreshFromAuth();

      // onAuthStateChanged covers sign-in / sign-out
      const unsub = onAuthStateChanged(auth, (u) => {
        setDisplayName(u?.displayName ?? null);
        setPhotoURL(u?.photoURL ?? null);
      });

      // custom event listener for profile updates
      const onProfileUpdated = () => {
        refreshFromAuth();
      };
      window.addEventListener("auth-profile-updated", onProfileUpdated);

      return () => {
        unsub();
        window.removeEventListener("auth-profile-updated", onProfileUpdated);
      };
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className={`admin-root ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="admin-topnav">
        <div className="admin-brand">
          <img src="/favicon.ico" alt="logo" className="logo" />
          <span className="brand-label">Admin</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="signed-as" style={{color:"white"}}>Signed in as Admin</div>
          <Link
            to="/admin/profile"
            className="admin-profile-link"
            title="View profile"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Avatar className="h-10 w-10"> {/* explicit size */}
              {photoURL ? (
                <AvatarImage src={photoURL} />
              ) : (
                <AvatarFallback>{displayName ? displayName[0] : "A"}</AvatarFallback>
              )}
            </Avatar>
            {!collapsed && (
              <span className="small-muted" style={{ fontWeight: 600 }}>
                {displayName ?? "Admin"}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="admin-layout">
        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
          <button
            className="sidebar-toggle sidebar-toggle-left"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>

          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <Home size={16} />
            </span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <Users size={16} />
            </span>
            <span className="nav-label">Users</span>
          </NavLink>

          <NavLink to="/admin/mentor-codes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <Key size={16} />
            </span>
            <span className="nav-label">Mentor Codes</span>
          </NavLink>

          <NavLink to="/admin/mentor-requests" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <Inbox size={16} />
            </span>
            <span className="nav-label">Mentor Requests</span>
          </NavLink>

          <NavLink to="/admin/analytics" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <BarChart2 size={16} />
            </span>
            <span className="nav-label">Analytics</span>
          </NavLink>

          <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <Cog size={16} />
            </span>
            <span className="nav-label">Settings</span>
          </NavLink>

          <NavLink to="/admin/courses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">
              <BookOpen size={16} />
            </span>
            <span className="nav-label">Courses</span>
          </NavLink>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
