import { useState, useEffect, useRef } from "react";

const API = "http://localhost:5123/api";

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const T = {
  bg: "#F5F3EF",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF9F7",
  border: "#E8E4DC",
  borderDark: "#D4CFC5",
  ink: "#1A1714",
  inkMid: "#6B6560",
  inkLight: "#9E9890",
  accent: "#C8590A",
  accentLight: "#FCF0E8",
  accentBorder: "#F0C4A0",
  green: "#1A7A4A",
  greenLight: "#EAF6EF",
  greenBorder: "#A8DBBF",
  red: "#C02B2B",
  redLight: "#FDEAEA",
  redBorder: "#F0AAAA",
  amber: "#A05C00",
  amberLight: "#FEF6E4",
  amberBorder: "#F5D48A",
  shadow: "0 1px 3px rgba(26,23,20,0.06), 0 4px 12px rgba(26,23,20,0.04)",
  shadowMd: "0 4px 16px rgba(26,23,20,0.10), 0 1px 4px rgba(26,23,20,0.06)",
  shadowLg: "0 16px 48px rgba(26,23,20,0.14), 0 4px 16px rgba(26,23,20,0.08)",
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${T.bg};
    color: ${T.ink};
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  input, select, textarea, button { font-family: inherit; }
  input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .fade-up { animation: fadeSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-up-d1 { animation-delay: 0.06s; }
  .fade-up-d2 { animation-delay: 0.12s; }
  .fade-up-d3 { animation-delay: 0.18s; }
  .fade-up-d4 { animation-delay: 0.24s; }

  .btn-hover:hover { filter: brightness(0.93); transform: translateY(-1px); transition: all 0.15s; }
  .btn-hover:active { transform: translateY(0); }
  .row-hover:hover { background: ${T.surfaceAlt} !important; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.borderDark}; border-radius: 99px; }
`;

/* ─────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────── */

function StatusBadge({ status }) {
  const map = {
    Pending:  { bg: T.amberLight, color: T.amber,  border: T.amberBorder, icon: "⏳" },
    Approved: { bg: T.greenLight, color: T.green,  border: T.greenBorder, icon: "✓" },
    Rejected: { bg: T.redLight,   color: T.red,    border: T.redBorder,   icon: "✕" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "99px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: "12px", fontWeight: "600", letterSpacing: "0.3px",
      whiteSpace: "nowrap"
    }}>
      <span style={{ fontSize: "10px" }}>{s.icon}</span> {status}
    </span>
  );
}

function Card({ children, style = {}, className = "" }) {
  return (
    <div className={className} style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: "16px", boxShadow: T.shadow, ...style
    }}>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px", textTransform: "uppercase", color: T.inkMid, marginBottom: "6px" }}>{label}</label>}
      <input style={{
        width: "100%", padding: "10px 14px",
        border: `1px solid ${T.border}`, borderRadius: "10px",
        background: T.surfaceAlt, color: T.ink, fontSize: "14px",
        outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        {...props}
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px", textTransform: "uppercase", color: T.inkMid, marginBottom: "6px" }}>{label}</label>}
      <select style={{
        width: "100%", padding: "10px 14px",
        border: `1px solid ${T.border}`, borderRadius: "10px",
        background: T.surfaceAlt, color: T.ink, fontSize: "14px",
        outline: "none", cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B6560' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
      }}
        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px", textTransform: "uppercase", color: T.inkMid, marginBottom: "6px" }}>{label}</label>}
      <textarea style={{
        width: "100%", padding: "10px 14px",
        border: `1px solid ${T.border}`, borderRadius: "10px",
        background: T.surfaceAlt, color: T.ink, fontSize: "14px",
        outline: "none", resize: "vertical", minHeight: "80px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        {...props}
      />
    </div>
  );
}

function Btn({ children, variant = "primary", style = {}, ...props }) {
  const variants = {
    primary: { background: T.accent, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: T.inkMid, border: `1px solid ${T.border}` },
    success: { background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}` },
    danger:  { background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}` },
  };
  return (
    <button className="btn-hover" style={{
      padding: "9px 18px", borderRadius: "10px", fontSize: "13px",
      fontWeight: "600", cursor: "pointer", display: "inline-flex",
      alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      transition: "all 0.15s", letterSpacing: "0.2px",
      ...variants[variant], ...style
    }} {...props}>
      {children}
    </button>
  );
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const colors = { success: T.green, error: T.red, info: T.accent };
  return (
    <div style={{
      position: "fixed", bottom: "28px", right: "28px", zIndex: 9999,
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${colors[type] || T.green}`,
      borderRadius: "12px", padding: "14px 20px",
      boxShadow: T.shadowLg, maxWidth: "340px",
      animation: "toastIn 0.3s cubic-bezier(0.16,1,0.3,1)",
      display: "flex", alignItems: "center", gap: "10px",
    }}>
      <span style={{ fontSize: "18px" }}>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      <span style={{ fontSize: "14px", fontWeight: "500", color: T.ink }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.inkLight, fontSize: "16px" }}>×</button>
    </div>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", width: "16px", height: "16px", border: `2px solid currentColor`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

/* ─────────────────────────────────────────
   MINI BAR CHART
───────────────────────────────────────── */
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: T.inkMid }}>{d.value}</span>
          <div style={{
            width: "100%", height: `${Math.max((d.value / max) * 38, d.value > 0 ? 6 : 0)}px`,
            background: d.color, borderRadius: "4px 4px 2px 2px",
            transition: "height 0.4s cubic-bezier(0.16,1,0.3,1)",
            minHeight: d.value > 0 ? "6px" : "0",
          }} />
          <span style={{ fontSize: "10px", color: T.inkLight, textAlign: "center", lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   LOGIN PAGE  ← ALL CHANGES ARE HERE
───────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("Employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear fields on tab switch — NO autofill
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
  }, [tab]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/User/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid credentials"); setLoading(false); return; }
      onLogin(data);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running on port 5123.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: T.bg,
      backgroundImage: `radial-gradient(circle at 20% 20%, #F5E6D8 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, #E8F5EE 0%, transparent 50%)`,
    }}>
      <div className="fade-up" style={{
        width: "100%",
        maxWidth: "460px",
        padding: "0 24px",
      }}>
        {/* Brand */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: T.accent, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px",
            }}>📋</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "700", color: T.ink }}>
              LeaveFlow
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", fontWeight: "700", lineHeight: 1.15, color: T.ink, marginBottom: "12px" }}>
            Welcome back
          </h1>
          <p style={{ color: T.inkMid, fontSize: "16px", fontWeight: "300" }}>
            Sign in to manage leave requests for your team.
          </p>
        </div>

        {/* Role tabs */}
        <div style={{
          display: "flex", background: T.surfaceAlt, borderRadius: "12px",
          padding: "4px", border: `1px solid ${T.border}`, marginBottom: "20px"
        }}>
          {["Employee", "Manager"].map(role => (
            <button key={role} onClick={() => setTab(role)} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: "9px",
              background: tab === role ? T.surface : "transparent",
              color: tab === role ? T.ink : T.inkMid,
              fontWeight: tab === role ? "600" : "400",
              fontSize: "14px", cursor: "pointer",
              boxShadow: tab === role ? T.shadow : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              <span>{role === "Employee" ? "👤" : "👔"}</span> {role}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <Card style={{ padding: "28px" }}>
          {error && (
            <div style={{
              background: T.redLight, border: `1px solid ${T.redBorder}`,
              borderRadius: "10px", padding: "10px 14px",
              color: T.red, fontSize: "13px", marginBottom: "16px"
            }}>
              {error}
            </div>
          )}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={tab === "Manager" ? "manager@company.com" : "employee@company.com"}
            autoComplete="off"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Btn
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px", marginTop: "4px" }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <><Spinner /> Signing in...</> : `Sign in as ${tab} →`}
          </Btn>
        </Card>


      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   NAV BAR
───────────────────────────────────────── */
function Navbar({ user, onLogout }) {
  return (
    <header style={{
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      padding: "0 32px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 0 rgba(26,23,20,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📋</div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "700", color: T.ink }}>LeaveFlow</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: user.role === "Manager" ? T.accentLight : T.greenLight, border: `1px solid ${user.role === "Manager" ? T.accentBorder : T.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
            {user.role === "Manager" ? "👔" : "👤"}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: T.ink, lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: T.inkLight }}>{user.role}</div>
          </div>
        </div>
        <div style={{ width: "1px", height: "24px", background: T.border }} />
        <Btn variant="ghost" style={{ padding: "7px 14px", fontSize: "13px" }} onClick={onLogout}>Sign out</Btn>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ label, value, icon, color, sub }) {
  return (
    <Card style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "28px", fontWeight: "700", color: T.ink, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</div>
        <div style={{ fontSize: "13px", color: T.inkMid, marginTop: "2px" }}>{label}</div>
        {sub && <div style={{ fontSize: "11px", color: T.inkLight, marginTop: "1px" }}>{sub}</div>}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────
   EMPLOYEE DASHBOARD
───────────────────────────────────────── */
function EmployeeDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [form, setForm] = useState({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });
  const [view, setView] = useState("apply");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/user/${user.userId}`);
      if (res.ok) setLeaves(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setToast({ msg: "Please fill in all fields.", type: "error" }); return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setToast({ msg: "End date cannot be before start date.", type: "error" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/Create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, leaveType: form.leaveType, startDate: form.startDate + "T00:00:00", endDate: form.endDate + "T00:00:00", reason: form.reason }),
      });
      if (res.ok) {
        setForm({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });
        fetchLeaves();
        setView("history");
        setToast({ msg: "Leave request submitted successfully!", type: "success" });
      } else {
        const d = await res.json();
        setToast({ msg: d.message || "Failed to submit.", type: "error" });
      }
    } catch { setToast({ msg: "Server error. Please try again.", type: "error" }); }
    setSubmitting(false);
  };

  const pending = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;
  const totalDays = leaves.filter(l => l.status === "Approved").reduce((acc, l) => {
    const d = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
    return acc + d;
  }, 0);

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const daysDiff = (s, e) => Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="fade-up" style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "700", color: T.ink, marginBottom: "4px" }}>
            Good day, {user.name.split(" ")[0]} 👋
          </h1>
          <p style={{ color: T.inkMid, fontSize: "15px" }}>Manage your leave requests below.</p>
        </div>

        <div className="fade-up fade-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <StatCard label="Total Requests" value={leaves.length} icon="📋" color={T.accent} />
          <StatCard label="Pending Review" value={pending} icon="⏳" color={T.amber} />
          <StatCard label="Approved" value={approved} icon="✓" color={T.green} sub={`${totalDays} days taken`} />
          <StatCard label="Rejected" value={rejected} icon="✕" color={T.red} />
        </div>

        <div className="fade-up fade-up-d2" style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          {[["apply", "📝 Apply for Leave"], ["history", `📋 My Requests${leaves.length ? ` (${leaves.length})` : ""}`]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 20px", borderRadius: "10px", border: "none", fontSize: "14px", fontWeight: "500",
              background: view === v ? T.ink : "transparent",
              color: view === v ? "#fff" : T.inkMid,
              cursor: "pointer", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {view === "apply" && (
          <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <Card style={{ padding: "28px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "600", marginBottom: "22px", color: T.ink }}>
                New Leave Request
              </h2>
              <Select label="Leave Type" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
                {["Annual", "Sick", "Casual", "Maternity", "Paternity", "Emergency"].map(t => <option key={t}>{t}</option>)}
              </Select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
              {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
                <div style={{ background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", padding: "8px 12px", marginBottom: "14px", fontSize: "13px", color: T.accent, fontWeight: "500" }}>
                  📅 {daysDiff(form.startDate, form.endDate)} day{daysDiff(form.startDate, form.endDate) > 1 ? "s" : ""} requested
                </div>
              )}
              <Textarea label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe the reason for your leave..." />
              <Btn style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: "14px" }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Spinner /> Submitting...</> : "Submit Leave Request →"}
              </Btn>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Card style={{ padding: "22px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: T.ink, marginBottom: "16px" }}>Leave Type Guide</h3>
                {[
                  ["Annual", "Planned personal time off"],
                  ["Sick", "Medical illness or injury"],
                  ["Casual", "Short personal errands"],
                  ["Emergency", "Unforeseen urgent events"],
                ].map(([type, desc]) => (
                  <div key={type} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.accent, marginTop: "5px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: T.ink }}>{type}</div>
                      <div style={{ fontSize: "12px", color: T.inkMid }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </Card>
              <Card style={{ padding: "22px", background: T.surfaceAlt }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: T.ink, marginBottom: "12px" }}>My Leave Summary</h3>
                <MiniBarChart data={[
                  { label: "Pending", value: pending, color: T.amber },
                  { label: "Approved", value: approved, color: T.green },
                  { label: "Rejected", value: rejected, color: T.red },
                ]} />
              </Card>
            </div>
          </div>
        )}

        {view === "history" && (
          <div className="fade-up">
            <Card>
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px", color: T.inkMid }}>
                  <Spinner /> Loading requests...
                </div>
              ) : leaves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px", color: T.inkMid }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <div style={{ fontSize: "16px", fontWeight: "500" }}>No leave requests yet</div>
                  <div style={{ fontSize: "13px", marginTop: "6px" }}>Click "Apply for Leave" to submit your first request.</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Leave Type", "From", "To", "Days", "Reason", "Status", "Manager's Remark"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: T.inkLight, textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l, i) => (
                      <tr key={l.id} className="row-hover" style={{ borderBottom: `1px solid ${T.border}`, animationDelay: `${i * 0.04}s` }}>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: "600", color: T.ink, fontSize: "13px" }}>{l.leaveType}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.inkMid }}>{formatDate(l.startDate)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.inkMid }}>{formatDate(l.endDate)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.ink, fontWeight: "600" }}>{daysDiff(l.startDate, l.endDate)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.inkMid, maxWidth: "180px" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{l.reason}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={l.status} /></td>
                        <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                          {l.managerRemark ? (
                            <span style={{ color: l.status === "Approved" ? T.green : l.status === "Rejected" ? T.red : T.inkMid, fontStyle: "italic" }}>
                              "{l.managerRemark}"
                            </span>
                          ) : (
                            <span style={{ color: T.inkLight }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MANAGER DASHBOARD
───────────────────────────────────────── */
function ManagerDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [remarkModal, setRemarkModal] = useState(null);
  const [remark, setRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest`);
      if (res.ok) setLeaves(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const updateStatus = async (id, status, managerRemark) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, managerRemark: managerRemark || "" }),
      });
      if (res.ok) {
        fetchLeaves();
        setToast({ msg: `Request ${status.toLowerCase()} successfully!`, type: status === "Approved" ? "success" : "error" });
        setRemarkModal(null); setRemark("");
      }
    } catch { setToast({ msg: "Failed to update. Try again.", type: "error" }); }
    setActionLoading(false);
  };

  const openModal = (id, action) => { setRemarkModal({ id, action }); setRemark(""); };

  const employees = [...new Set(leaves.map(l => l.userName))].filter(Boolean);

  const filtered = leaves.filter(l =>
    (filterStatus === "All" || l.status === filterStatus) &&
    (filterEmployee === "All" || l.userName === filterEmployee)
  );

  const empLeaves = filterEmployee !== "All" ? leaves.filter(l => l.userName === filterEmployee) : [];
  const empStats = filterEmployee !== "All" ? {
    total: empLeaves.length,
    pending: empLeaves.filter(l => l.status === "Pending").length,
    approved: empLeaves.filter(l => l.status === "Approved").length,
    rejected: empLeaves.filter(l => l.status === "Rejected").length,
    totalDays: empLeaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1, 0),
  } : null;

  const pending = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const daysDiff = (s, e) => Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      {remarkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }}>
          <Card style={{ padding: "28px", width: "440px", boxShadow: T.shadowLg }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
              {remarkModal.action === "Approved" ? "✓ Approve Request" : "✕ Reject Request"}
            </h3>
            <p style={{ color: T.inkMid, fontSize: "14px", marginBottom: "20px" }}>
              Add a remark for the employee (optional).
            </p>
            <Textarea label="Remark (Optional)" value={remark} onChange={e => setRemark(e.target.value)} placeholder={remarkModal.action === "Approved" ? "e.g. Approved, have a great break!" : "e.g. Team meeting scheduled that day."} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => { setRemarkModal(null); setRemark(""); }}>Cancel</Btn>
              <Btn variant={remarkModal.action === "Approved" ? "success" : "danger"}
                onClick={() => updateStatus(remarkModal.id, remarkModal.action, remark)} disabled={actionLoading}>
                {actionLoading ? <Spinner /> : (remarkModal.action === "Approved" ? "✓ Approve" : "✕ Reject")}
              </Btn>
            </div>
          </Card>
        </div>
      )}

      <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="fade-up" style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "700", color: T.ink, marginBottom: "4px" }}>
            Team Leave Management
          </h1>
          <p style={{ color: T.inkMid, fontSize: "15px" }}>Review and manage all leave requests.</p>
        </div>

        <div className="fade-up fade-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <StatCard label="Total Requests" value={leaves.length} icon="📋" color={T.accent} />
          <StatCard label="Pending Review" value={pending} icon="⏳" color={T.amber} sub={pending > 0 ? "Requires attention" : "All caught up!"} />
          <StatCard label="Approved" value={approved} icon="✓" color={T.green} />
          <StatCard label="Rejected" value={rejected} icon="✕" color={T.red} />
        </div>

        <div className="fade-up fade-up-d2" style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px", textTransform: "uppercase", color: T.inkMid, marginBottom: "6px" }}>Filter by Status</label>
            <div style={{ display: "flex", gap: "4px", background: T.surfaceAlt, padding: "4px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
              {["All", "Pending", "Approved", "Rejected"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: "6px 14px", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: "500",
                  background: filterStatus === s ? T.surface : "transparent",
                  color: filterStatus === s ? T.ink : T.inkMid,
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: filterStatus === s ? T.shadow : "none",
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px", textTransform: "uppercase", color: T.inkMid, marginBottom: "6px" }}>Filter by Employee</label>
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{
              padding: "9px 36px 9px 14px", border: `1px solid ${T.border}`, borderRadius: "10px",
              background: T.surfaceAlt, color: T.ink, fontSize: "13px", cursor: "pointer",
              outline: "none", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B6560' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
            }}>
              <option value="All">All Employees</option>
              {employees.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          {filterEmployee !== "All" && (
            <Btn variant="ghost" style={{ padding: "8px 14px", fontSize: "12px" }} onClick={() => setFilterEmployee("All")}>✕ Clear filter</Btn>
          )}
        </div>

        {filterEmployee !== "All" && empStats && (
          <div className="fade-up" style={{ marginBottom: "24px" }}>
            <Card style={{ padding: "22px", background: "linear-gradient(135deg, #FDF8F4, #EAF6EF)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "600", color: T.ink, marginBottom: "4px" }}>
                    {filterEmployee}'s Leave Overview
                  </h3>
                  <p style={{ color: T.inkMid, fontSize: "13px" }}>{empStats.totalDays} approved leave days total</p>
                </div>
                <div style={{ display: "flex", gap: "32px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: T.ink, fontFamily: "'Playfair Display', serif" }}>{empStats.total}</div>
                    <div style={{ fontSize: "11px", color: T.inkMid }}>Total</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: T.amber, fontFamily: "'Playfair Display', serif" }}>{empStats.pending}</div>
                    <div style={{ fontSize: "11px", color: T.inkMid }}>Pending</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: T.green, fontFamily: "'Playfair Display', serif" }}>{empStats.approved}</div>
                    <div style={{ fontSize: "11px", color: T.inkMid }}>Approved</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: T.red, fontFamily: "'Playfair Display', serif" }}>{empStats.rejected}</div>
                    <div style={{ fontSize: "11px", color: T.inkMid }}>Rejected</div>
                  </div>
                  <div style={{ minWidth: "140px" }}>
                    <MiniBarChart data={[
                      { label: "Pending", value: empStats.pending, color: T.amber },
                      { label: "Approved", value: empStats.approved, color: T.green },
                      { label: "Rejected", value: empStats.rejected, color: T.red },
                    ]} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="fade-up fade-up-d3">
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: T.ink }}>
                {filtered.length} request{filtered.length !== 1 ? "s" : ""}
                {filterStatus !== "All" ? ` · ${filterStatus}` : ""}
                {filterEmployee !== "All" ? ` · ${filterEmployee}` : ""}
              </span>
              <button onClick={fetchLeaves} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMid, fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: T.inkMid }}>
                <Spinner /> <span style={{ marginLeft: "8px" }}>Loading...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px", color: T.inkMid }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                <div style={{ fontSize: "16px", fontWeight: "500" }}>No requests found</div>
                <div style={{ fontSize: "13px", marginTop: "6px" }}>Try adjusting your filters.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Employee", "Leave Type", "From", "To", "Days", "Reason", "Status", "Remark", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: T.inkLight, textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l, i) => (
                      <tr key={l.id} className="row-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: "600", fontSize: "13px", color: T.ink }}>{l.userName}</div>
                          <div style={{ fontSize: "11px", color: T.inkLight }}>{l.userEmail}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "500", color: T.ink, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "3px 8px" }}>{l.leaveType}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.inkMid, whiteSpace: "nowrap" }}>{formatDate(l.startDate)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: T.inkMid, whiteSpace: "nowrap" }}>{formatDate(l.endDate)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: T.ink, textAlign: "center" }}>{daysDiff(l.startDate, l.endDate)}</td>
                        <td style={{ padding: "14px 16px", maxWidth: "160px" }}>
                          <span style={{ fontSize: "13px", color: T.inkMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{l.reason}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={l.status} /></td>
                        <td style={{ padding: "14px 16px", maxWidth: "140px" }}>
                          <span style={{ fontSize: "12px", color: T.inkMid, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {l.managerRemark || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {l.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <Btn variant="success" style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => openModal(l.id, "Approved")}>✓ Approve</Btn>
                              <Btn variant="danger" style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => openModal(l.id, "Rejected")}>✕ Reject</Btn>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: T.inkLight }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT APP
───────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      <style>{globalCSS}</style>
      {!user ? (
        <LoginPage onLogin={setUser} />
      ) : (
        <div style={{ minHeight: "100vh", background: T.bg }}>
          <Navbar user={user} onLogout={() => setUser(null)} />
          {user.role === "Manager"
            ? <ManagerDashboard user={user} />
            : <EmployeeDashboard user={user} />
          }
        </div>
      )}
    </>
  );
}