import { useState, useEffect, useRef } from "react";

const API = "http://localhost:5123/api";

/* ─────────────────────────────────────────
   DESIGN TOKENS — Deep Navy + Gold theme
───────────────────────────────────────── */
const T = {
  bg: "#0F1117",
  bgAlt: "#161822",
  surface: "#1C1F2E",
  surfaceHover: "#232638",
  surfaceBright: "#2A2D42",
  border: "#2E3148",
  borderLight: "#3A3E5C",
  gold: "#F0B429",
  goldLight: "#FFF8E7",
  goldDim: "rgba(240,180,41,0.12)",
  goldBorder: "rgba(240,180,41,0.25)",
  ink: "#F0F2FF",
  inkMid: "#9DA3C8",
  inkDim: "#5C6186",
  green: "#22C97A",
  greenDim: "rgba(34,201,122,0.12)",
  greenBorder: "rgba(34,201,122,0.3)",
  red: "#FF5C7A",
  redDim: "rgba(255,92,122,0.12)",
  redBorder: "rgba(255,92,122,0.3)",
  amber: "#FFB547",
  amberDim: "rgba(255,181,71,0.12)",
  amberBorder: "rgba(255,181,71,0.3)",
  blue: "#5B8DEF",
  blueDim: "rgba(91,141,239,0.12)",
  shadow: "0 2px 8px rgba(0,0,0,0.4)",
  shadowLg: "0 20px 60px rgba(0,0,0,0.6)",
  glow: "0 0 20px rgba(240,180,41,0.15)",
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${T.bg};
    color: ${T.ink};
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  input, select, textarea, button { font-family: inherit; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes notifSlide {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .fade-up  { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .d1 { animation-delay: 0.07s; }
  .d2 { animation-delay: 0.14s; }
  .d3 { animation-delay: 0.21s; }
  .hover-row:hover { background: ${T.surfaceHover} !important; cursor: default; }
  .hover-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .hover-btn:active { transform: translateY(0); opacity: 1; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
  ::placeholder { color: ${T.inkDim}; }
  input, select, textarea { color-scheme: dark; }
`;

/* ─── NOTIFICATION STORE (in-memory) ─── */
let _notifications = [];
let _notifListeners = [];
const notifStore = {
  get: () => _notifications,
  add: (n) => {
    _notifications = [{ ...n, id: Date.now() + Math.random(), time: new Date(), read: false }, ..._notifications].slice(0, 50);
    _notifListeners.forEach(fn => fn([..._notifications]));
  },
  markRead: (id) => {
    _notifications = _notifications.map(n => n.id === id ? { ...n, read: true } : n);
    _notifListeners.forEach(fn => fn([..._notifications]));
  },
  markAllRead: () => {
    _notifications = _notifications.map(n => ({ ...n, read: true }));
    _notifListeners.forEach(fn => fn([..._notifications]));
  },
  subscribe: (fn) => {
    _notifListeners.push(fn);
    return () => { _notifListeners = _notifListeners.filter(f => f !== fn); };
  }
};

/* ─── EMPLOYEE STORE (in-memory) ─── */
let _employees = [
  { id: 1, name: "Jashika Patel", email: "jashika@test.com", role: "Employee", dept: "Engineering", joined: "2023-01-15" },
  { id: 2, name: "Pallavi",       email: "pallavi@test.com",  role: "Employee", dept: "Design",      joined: "2023-03-10" },
  { id: 3, name: "Khyati Singh",  email: "khyati@test.com",   role: "Employee", dept: "Marketing",   joined: "2022-11-20" },
  { id: 4, name: "Manasa",        email: "manasa@test.com",   role: "Employee", dept: "HR",          joined: "2024-01-05" },
  { id: 5, name: "Spandan",       email: "spandan@test.com",  role: "Employee", dept: "Finance",     joined: "2023-07-22" },
];
let _empListeners = [];
const empStore = {
  get: () => _employees,
  add: (emp) => {
    const newEmp = { ...emp, id: Date.now(), joined: new Date().toISOString().split("T")[0] };
    _employees = [..._employees, newEmp];
    _empListeners.forEach(fn => fn([..._employees]));
    return newEmp;
  },
  subscribe: (fn) => {
    _empListeners.push(fn);
    return () => { _empListeners = _empListeners.filter(f => f !== fn); };
  }
};

/* ─────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────── */
function Badge({ status }) {
  const cfg = {
    Pending:  { bg: T.amberDim, color: T.amber, border: T.amberBorder },
    Approved: { bg: T.greenDim, color: T.green, border: T.greenBorder },
    Rejected: { bg: T.redDim,   color: T.red,   border: T.redBorder   },
  };
  const c = cfg[status] || cfg.Pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"99px", background:c.bg, color:c.color, border:`1px solid ${c.border}`, fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
      <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:c.color, display:"inline-block" }} />
      {status}
    </span>
  );
}

function inputStyle(focused) {
  return {
    width:"100%", padding:"11px 14px",
    background: focused ? T.surfaceBright : T.surface,
    border:`1px solid ${focused ? T.gold : T.border}`,
    borderRadius:"10px", color:T.ink, fontSize:"14px", outline:"none",
    transition:"all 0.2s",
    boxShadow: focused ? `0 0 0 3px ${T.goldDim}` : "none",
  };
}

function FInput({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:"16px" }}>
      {label && <label style={{ display:"block", fontSize:"10px", fontWeight:"600", letterSpacing:"1px", textTransform:"uppercase", color:T.inkDim, marginBottom:"7px" }}>{label}</label>}
      <input style={inputStyle(focused)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props} />
    </div>
  );
}

function FSelect({ label, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:"16px" }}>
      {label && <label style={{ display:"block", fontSize:"10px", fontWeight:"600", letterSpacing:"1px", textTransform:"uppercase", color:T.inkDim, marginBottom:"7px" }}>{label}</label>}
      <select style={{ ...inputStyle(focused), cursor:"pointer", appearance:"none",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%239DA3C8' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center"
      }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props}>
        {children}
      </select>
    </div>
  );
}

function FTextarea({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:"16px" }}>
      {label && <label style={{ display:"block", fontSize:"10px", fontWeight:"600", letterSpacing:"1px", textTransform:"uppercase", color:T.inkDim, marginBottom:"7px" }}>{label}</label>}
      <textarea style={{ ...inputStyle(focused), resize:"vertical", minHeight:"80px" }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props} />
    </div>
  );
}

function Btn({ children, variant="primary", size="md", style={}, ...props }) {
  const sizes = { sm:{ padding:"6px 14px", fontSize:"12px" }, md:{ padding:"10px 20px", fontSize:"13px" }, lg:{ padding:"13px 28px", fontSize:"15px" } };
  const variants = {
    primary: { background:`linear-gradient(135deg, ${T.gold}, #E09400)`, color:"#1A1200", border:"none" },
    ghost:   { background:"transparent", color:T.inkMid, border:`1px solid ${T.border}` },
    success: { background:T.greenDim, color:T.green, border:`1px solid ${T.greenBorder}` },
    danger:  { background:T.redDim,   color:T.red,   border:`1px solid ${T.redBorder}`   },
    surface: { background:T.surfaceBright, color:T.ink, border:`1px solid ${T.border}` },
  };
  return (
    <button className="hover-btn" style={{ display:"inline-flex", alignItems:"center", gap:"7px", fontWeight:"600", cursor:"pointer", borderRadius:"10px", transition:"all 0.18s", whiteSpace:"nowrap", letterSpacing:"0.3px", ...sizes[size], ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"16px", boxShadow:T.shadow, ...style }}>
      {children}
    </div>
  );
}

function Spinner() {
  return <span style={{ display:"inline-block", width:"15px", height:"15px", border:`2px solid currentColor`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />;
}

/* ─── NOTIFICATION POPUP (corner banner) ─── */
function NotifPopup({ notif, onClose }) {
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [notif]);

  if (!notif) return null;
  const colorMap = { approve: T.green, reject: T.red, new: T.gold, info: T.blue };
  const iconMap  = { approve:"✅", reject:"❌", new:"🆕", info:"ℹ️" };
  const accentColor = colorMap[notif.type] || T.gold;

  return (
    <div style={{
      position:"fixed", top:"80px", right:"24px", zIndex:9999,
      background:T.surface, border:`1px solid ${T.borderLight}`,
      borderLeft:`3px solid ${accentColor}`,
      borderRadius:"14px", padding:"16px 20px", maxWidth:"320px", width:"100%",
      boxShadow:T.shadowLg, animation:"notifSlide 0.4s cubic-bezier(0.16,1,0.3,1)",
      display:"flex", gap:"12px", alignItems:"flex-start",
    }}>
      <span style={{ fontSize:"20px", flexShrink:0 }}>{iconMap[notif.type] || "🔔"}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:"600", fontSize:"13px", color:T.ink, marginBottom:"3px" }}>{notif.title}</div>
        <div style={{ fontSize:"12px", color:T.inkMid }}>{notif.message}</div>
      </div>
      <button onClick={onClose} style={{ background:"none", border:"none", color:T.inkDim, cursor:"pointer", fontSize:"18px", lineHeight:1, flexShrink:0, padding:"0" }}>×</button>
    </div>
  );
}

/* ─── NOTIFICATION PANEL (dropdown) ─── */
function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(notifStore.get());

  useEffect(() => {
    const unsub = notifStore.subscribe(setNotifs);
    return unsub;
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const iconMap = { approve:"✅", reject:"❌", new:"🆕", info:"ℹ️" };
  const timeAgo = (d) => {
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div style={{
      position:"absolute", top:"calc(100% + 12px)", right:0, zIndex:9999,
      background:T.surface, border:`1px solid ${T.borderLight}`,
      borderRadius:"16px", width:"360px", boxShadow:T.shadowLg,
      animation:"popIn 0.3s cubic-bezier(0.16,1,0.3,1)", overflow:"hidden",
    }}>
      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontWeight:"700", fontSize:"15px", color:T.ink }}>Notifications</div>
          <div style={{ fontSize:"12px", color:T.inkMid }}>{unread > 0 ? `${unread} unread` : "All caught up"}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {unread > 0 && (
            <button onClick={notifStore.markAllRead} style={{ background:"none", border:"none", color:T.gold, fontSize:"12px", cursor:"pointer", fontWeight:"500" }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background:T.surfaceBright, border:"none", color:T.inkMid, cursor:"pointer", width:"28px", height:"28px", borderRadius:"8px", fontSize:"16px", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
      </div>
      <div style={{ maxHeight:"380px", overflowY:"auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:T.inkDim }}>
            <div style={{ fontSize:"32px", marginBottom:"10px" }}>🔕</div>
            <div style={{ fontSize:"14px" }}>No notifications yet</div>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} onClick={() => notifStore.markRead(n.id)} className="hover-row" style={{
            padding:"14px 20px", borderBottom:`1px solid ${T.border}`,
            background: n.read ? "transparent" : T.bgAlt,
            display:"flex", gap:"12px", cursor:"pointer",
          }}>
            <span style={{ fontSize:"18px", flexShrink:0 }}>{iconMap[n.type] || "🔔"}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px" }}>
                <div style={{ fontWeight:"600", fontSize:"13px", color: n.read ? T.inkMid : T.ink }}>{n.title}</div>
                <div style={{ fontSize:"11px", color:T.inkDim, whiteSpace:"nowrap", flexShrink:0 }}>{timeAgo(n.time)}</div>
              </div>
              <div style={{ fontSize:"12px", color:T.inkMid, marginTop:"2px" }}>{n.message}</div>
            </div>
            {!n.read && <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:T.gold, flexShrink:0, marginTop:"5px" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("Employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setEmail(""); setPassword(""); setError(""); }, [tab]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/User/Login`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
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
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:T.bg,
      backgroundImage:`radial-gradient(ellipse at 20% 50%, rgba(240,180,41,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(91,141,239,0.06) 0%, transparent 60%)`,
    }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize:"60px 60px", opacity:0.25, pointerEvents:"none" }} />
      <div className="fade-up" style={{ width:"100%", maxWidth:"420px", padding:"0 20px", position:"relative", zIndex:1 }}>
        <div style={{ marginBottom:"40px", textAlign:"center" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"16px", margin:"0 auto 16px", background:`linear-gradient(135deg, ${T.gold}, #E09400)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", boxShadow:`0 8px 24px rgba(240,180,41,0.3)` }}>📋</div>
          <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:"32px", fontWeight:"800", color:T.ink, marginBottom:"8px", letterSpacing:"-0.5px" }}>LeaveFlow</h1>
          <p style={{ color:T.inkMid, fontSize:"15px", fontWeight:"300" }}>Manage your team's time off, beautifully.</p>
        </div>
        <div style={{ display:"flex", background:T.surface, borderRadius:"12px", padding:"4px", border:`1px solid ${T.border}`, marginBottom:"20px" }}>
          {["Employee","Manager"].map(r => (
            <button key={r} onClick={() => setTab(r)} style={{
              flex:1, padding:"10px", border:"none", borderRadius:"9px", fontSize:"14px", fontWeight:"600",
              background: tab === r ? T.gold : "transparent",
              color: tab === r ? "#1A1200" : T.inkMid,
              cursor:"pointer", transition:"all 0.2s",
            }}>
              {r === "Employee" ? "👤 " : "👔 "}{r}
            </button>
          ))}
        </div>
        <Card style={{ padding:"28px" }}>
          {error && (
            <div style={{ background:T.redDim, border:`1px solid ${T.redBorder}`, borderRadius:"10px", padding:"10px 14px", color:T.red, fontSize:"13px", marginBottom:"18px" }}>
              ⚠ {error}
            </div>
          )}
          <FInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={tab === "Manager" ? "manager@company.com" : "employee@company.com"} autoComplete="off" />
          <FInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" autoComplete="new-password" />
          <Btn variant="primary" size="lg" style={{ width:"100%", justifyContent:"center", marginTop:"4px" }} onClick={handleLogin} disabled={loading}>
            {loading ? <><Spinner /> Signing in...</> : `Sign in as ${tab} →`}
          </Btn>
        </Card>
        <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:T.inkDim }}>Secure · Role-based · Real-time</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
function Navbar({ user, onLogout }) {
  const [notifs, setNotifs] = useState(notifStore.get());
  const [showPanel, setShowPanel] = useState(false);
  const [popup, setPopup] = useState(null);
  const panelRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    prevCountRef.current = notifStore.get().length;
    const unsub = notifStore.subscribe((ns) => {
      setNotifs(ns);
      if (ns.length > prevCountRef.current) {
        setPopup(ns[0]);
        prevCountRef.current = ns.length;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <NotifPopup notif={popup} onClose={() => setPopup(null)} />
      <header style={{
        background:`${T.bgAlt}EE`, backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${T.border}`,
        padding:"0 32px", height:"62px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:500,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:`linear-gradient(135deg, ${T.gold}, #E09400)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>📋</div>
          <span style={{ fontFamily:"'Syne', sans-serif", fontSize:"18px", fontWeight:"800", color:T.ink, letterSpacing:"-0.3px" }}>LeaveFlow</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          {/* Bell */}
          <div ref={panelRef} style={{ position:"relative" }}>
            <button onClick={() => setShowPanel(v => !v)} style={{
              position:"relative", background: showPanel ? T.surfaceBright : T.surface,
              border:`1px solid ${showPanel ? T.gold : T.border}`,
              borderRadius:"10px", width:"40px", height:"40px",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:"18px", transition:"all 0.2s",
            }}>
              🔔
              {unread > 0 && (
                <span style={{
                  position:"absolute", top:"-5px", right:"-5px",
                  background:T.gold, color:"#1A1200", borderRadius:"99px",
                  fontSize:"10px", fontWeight:"700", minWidth:"18px", height:"18px",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px",
                  animation:"pulse 2s infinite",
                }}>{unread > 9 ? "9+" : unread}</span>
              )}
            </button>
            {showPanel && <NotifPanel onClose={() => setShowPanel(false)} />}
          </div>
          {/* User pill */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"6px 14px 6px 8px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"9px", fontSize:"14px", background: user.role === "Manager" ? T.goldDim : T.blueDim, border:`1px solid ${user.role === "Manager" ? T.goldBorder : "rgba(91,141,239,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {user.role === "Manager" ? "👔" : "👤"}
            </div>
            <div>
              <div style={{ fontSize:"13px", fontWeight:"600", color:T.ink, lineHeight:1.2 }}>{user.name}</div>
              <div style={{ fontSize:"11px", color:T.inkDim }}>{user.role}</div>
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={onLogout}>Sign out</Btn>
        </div>
      </header>
    </>
  );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ label, value, icon, color, sub }) {
  return (
    <Card style={{ padding:"20px 22px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"12px" }}>
        <span style={{ fontSize:"24px" }}>{icon}</span>
        <span style={{ fontSize:"28px", fontWeight:"700", color:T.ink, fontFamily:"'Syne', sans-serif" }}>{value}</span>
      </div>
      <div style={{ fontSize:"13px", fontWeight:"500", color:T.inkMid }}>{label}</div>
      {sub && <div style={{ fontSize:"11px", color:color, marginTop:"3px", fontWeight:"500" }}>{sub}</div>}
      <div style={{ marginTop:"14px", height:"3px", borderRadius:"99px", background:T.border }}>
        <div style={{ height:"100%", borderRadius:"99px", background:color, width:`${Math.min(value * 10, 100)}%`, transition:"width 1s" }} />
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────
   ADD EMPLOYEE MODAL
───────────────────────────────────────── */
function AddEmployeeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:"", email:"", dept:"Engineering", password:"" });
  const [error, setError] = useState("");
  const depts = ["Engineering","Design","Marketing","HR","Finance","Operations","Sales","Legal"];

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required."); return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError("Enter a valid email address."); return; }
    const emp = empStore.add({ ...form, role:"Employee" });
    notifStore.add({ type:"new", title:"New Employee Added", message:`${form.name} joined the ${form.dept} team.` });
    onAdd(emp);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.2s", backdropFilter:"blur(4px)" }}>
      <Card style={{ padding:"32px", width:"480px", boxShadow:T.shadowLg, animation:"popIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <div>
            <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:"20px", fontWeight:"700", color:T.ink }}>Add New Employee</h2>
            <p style={{ fontSize:"13px", color:T.inkMid, marginTop:"3px" }}>They can log in immediately after being added.</p>
          </div>
          <button onClick={onClose} style={{ background:T.surfaceBright, border:`1px solid ${T.border}`, color:T.inkMid, cursor:"pointer", width:"32px", height:"32px", borderRadius:"9px", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {error && <div style={{ background:T.redDim, border:`1px solid ${T.redBorder}`, borderRadius:"10px", padding:"10px 14px", color:T.red, fontSize:"13px", marginBottom:"18px" }}>⚠ {error}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
          <FInput label="Full Name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Riya Sharma" />
          <FInput label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="riya@test.com" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
          <FSelect label="Department" value={form.dept} onChange={e => setForm({...form, dept:e.target.value})}>
            {depts.map(d => <option key={d}>{d}</option>)}
          </FSelect>
          <FInput label="Login Password" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Set a password" />
        </div>
        <div style={{ height:"1px", background:T.border, margin:"8px 0 20px" }} />
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit}>➕ Add Employee</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────
   EMPLOYEE DASHBOARD
───────────────────────────────────────── */
function EmployeeDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType:"Annual", startDate:"", endDate:"", reason:"" });
  const [view, setView] = useState("apply");
  const [toast, setToast] = useState({ msg:"", type:"success" });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/user/${user.userId}`);
      if (res.ok) setLeaves(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, []);
  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
    return () => clearTimeout(t);
  }, [toast.msg]);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setToast({ msg:"Please fill in all fields.", type:"error" }); return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setToast({ msg:"End date cannot be before start date.", type:"error" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/Create`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ userId:user.userId, leaveType:form.leaveType, startDate:form.startDate+"T00:00:00", endDate:form.endDate+"T00:00:00", reason:form.reason }),
      });
      if (res.ok) {
        setForm({ leaveType:"Annual", startDate:"", endDate:"", reason:"" });
        fetchLeaves(); setView("history");
        notifStore.add({ type:"info", title:"Leave Submitted", message:`Your ${form.leaveType} leave request is pending review.` });
        setToast({ msg:"Leave submitted successfully!", type:"success" });
      } else {
        const d = await res.json();
        setToast({ msg:d.message || "Failed to submit.", type:"error" });
      }
    } catch { setToast({ msg:"Server error.", type:"error" }); }
    setSubmitting(false);
  };

  const pending  = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;
  const totalDays = leaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + Math.ceil((new Date(l.endDate)-new Date(l.startDate))/86400000)+1, 0);
  const fmt  = d => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  const diff = (s,e) => Math.ceil((new Date(e)-new Date(s))/86400000)+1;

  return (
    <div style={{ padding:"32px", maxWidth:"1100px", margin:"0 auto" }}>
      {toast.msg && (
        <div style={{ position:"fixed", bottom:"28px", right:"28px", zIndex:9998, background:T.surface, border:`1px solid ${toast.type==="error"?T.redBorder:T.greenBorder}`, borderLeft:`3px solid ${toast.type==="error"?T.red:T.green}`, borderRadius:"12px", padding:"14px 20px", boxShadow:T.shadowLg, animation:"notifSlide 0.3s", display:"flex", gap:"10px", alignItems:"center" }}>
          <span>{toast.type==="error"?"⚠":"✅"}</span>
          <span style={{ fontSize:"14px", fontWeight:"500", color:T.ink }}>{toast.msg}</span>
        </div>
      )}

      <div className="fade-up" style={{ marginBottom:"28px" }}>
        <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:"28px", fontWeight:"800", color:T.ink, letterSpacing:"-0.5px" }}>Hello, {user.name.split(" ")[0]} 👋</h1>
        <p style={{ color:T.inkMid, fontSize:"14px", marginTop:"4px" }}>Track and manage your leave requests.</p>
      </div>

      <div className="fade-up d1" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"28px" }}>
        <StatCard label="Total Requests" value={leaves.length} icon="📋" color={T.blue}  />
        <StatCard label="Pending"        value={pending}       icon="⏳" color={T.amber} />
        <StatCard label="Approved"       value={approved}      icon="✅" color={T.green} sub={`${totalDays} days taken`} />
        <StatCard label="Rejected"       value={rejected}      icon="❌" color={T.red}   />
      </div>

      <div className="fade-up d2" style={{ display:"flex", gap:"4px", marginBottom:"22px" }}>
        {[["apply","📝 Apply for Leave"],["history",`📋 My Requests${leaves.length?` (${leaves.length})`:""}`]].map(([v,lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:"8px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600",
            background: view===v ? T.gold : T.surface,
            color: view===v ? "#1A1200" : T.inkMid,
            cursor:"pointer", transition:"all 0.2s",
            border: view===v ? "none" : `1px solid ${T.border}`,
          }}>{lbl}</button>
        ))}
      </div>

      {view === "apply" && (
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"22px" }}>
          <Card style={{ padding:"28px" }}>
            <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:"18px", fontWeight:"700", color:T.ink, marginBottom:"22px" }}>New Leave Request</h2>
            <FSelect label="Leave Type" value={form.leaveType} onChange={e => setForm({...form, leaveType:e.target.value})}>
              {["Annual","Sick","Casual","Maternity","Paternity","Emergency"].map(t => <option key={t}>{t}</option>)}
            </FSelect>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <FInput label="Start Date" type="date" value={form.startDate} onChange={e => setForm({...form, startDate:e.target.value})} />
              <FInput label="End Date"   type="date" value={form.endDate}   onChange={e => setForm({...form, endDate:e.target.value})} />
            </div>
            {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
              <div style={{ background:T.goldDim, border:`1px solid ${T.goldBorder}`, borderRadius:"9px", padding:"9px 14px", marginBottom:"14px", fontSize:"13px", color:T.gold, fontWeight:"500" }}>
                📅 {diff(form.startDate,form.endDate)} day{diff(form.startDate,form.endDate)>1?"s":""} requested
              </div>
            )}
            <FTextarea label="Reason" value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} placeholder="Describe the reason for your leave..." />
            <Btn variant="primary" style={{ width:"100%", justifyContent:"center" }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Spinner /> Submitting...</> : "Submit Leave Request →"}
            </Btn>
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Card style={{ padding:"22px" }}>
              <h3 style={{ fontSize:"11px", fontWeight:"600", color:T.inkDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px" }}>Leave Guide</h3>
              {[["Annual","Planned personal time off"],["Sick","Medical illness or injury"],["Casual","Short personal errands"],["Emergency","Unforeseen urgent events"]].map(([t,d]) => (
                <div key={t} style={{ display:"flex", gap:"10px", marginBottom:"13px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:T.gold, marginTop:"6px", flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:"600", fontSize:"13px", color:T.ink }}>{t}</div>
                    <div style={{ fontSize:"12px", color:T.inkMid }}>{d}</div>
                  </div>
                </div>
              ))}
            </Card>
            <Card style={{ padding:"22px" }}>
              <h3 style={{ fontSize:"11px", fontWeight:"600", color:T.inkDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px" }}>Quick Stats</h3>
              {[["Pending",pending,T.amber],["Approved",approved,T.green],["Rejected",rejected,T.red]].map(([lbl,val,col]) => (
                <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <span style={{ fontSize:"13px", color:T.inkMid }}>{lbl}</span>
                  <span style={{ fontWeight:"700", color:col, fontSize:"18px", fontFamily:"'Syne', sans-serif" }}>{val}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="fade-up">
          <Card>
            {loading ? (
              <div style={{ textAlign:"center", padding:"48px", color:T.inkMid }}><Spinner /></div>
            ) : leaves.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px", color:T.inkDim }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📭</div>
                <div style={{ fontSize:"15px" }}>No leave requests yet</div>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {["Leave Type","From","To","Days","Reason","Status","Remark"].map(h => (
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"10px", fontWeight:"600", color:T.inkDim, textTransform:"uppercase", letterSpacing:"0.8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} className="hover-row" style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"14px 16px", fontWeight:"600", fontSize:"13px", color:T.ink }}>{l.leaveType}</td>
                      <td style={{ padding:"14px 16px", fontSize:"13px", color:T.inkMid }}>{fmt(l.startDate)}</td>
                      <td style={{ padding:"14px 16px", fontSize:"13px", color:T.inkMid }}>{fmt(l.endDate)}</td>
                      <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"700", color:T.ink, textAlign:"center" }}>{diff(l.startDate,l.endDate)}</td>
                      <td style={{ padding:"14px 16px", fontSize:"13px", color:T.inkMid, maxWidth:"180px" }}>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{l.reason}</span>
                      </td>
                      <td style={{ padding:"14px 16px" }}><Badge status={l.status} /></td>
                      <td style={{ padding:"14px 16px", fontSize:"12px", color:T.inkMid, fontStyle:"italic" }}>
                        {l.managerRemark ? `"${l.managerRemark}"` : <span style={{ color:T.inkDim }}>—</span>}
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
  );
}

/* ─────────────────────────────────────────
   MANAGER DASHBOARD
───────────────────────────────────────── */
function ManagerDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState(empStore.get());
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [remarkModal, setRemarkModal] = useState(null);
  const [remark, setRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState("requests");
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [toast, setToast] = useState({ msg:"", type:"success" });

  useEffect(() => {
    const unsub = empStore.subscribe(setEmployees);
    return unsub;
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest`);
      if (res.ok) setLeaves(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, []);
  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
    return () => clearTimeout(t);
  }, [toast.msg]);

  const updateStatus = async (id, status, managerRemark) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/LeaveRequest/${id}`, {
        method:"PUT", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ status, managerRemark: managerRemark || "" }),
      });
      if (res.ok) {
        fetchLeaves();
        const leaf = leaves.find(l => l.id === id);
        notifStore.add({
          type: status === "Approved" ? "approve" : "reject",
          title: `Leave ${status}`,
          message: `${leaf?.userName || "Employee"}'s ${leaf?.leaveType || ""} leave has been ${status.toLowerCase()}.`,
        });
        setToast({ msg:`Request ${status.toLowerCase()} successfully!`, type: status==="Approved"?"success":"error" });
        setRemarkModal(null); setRemark("");
      }
    } catch { setToast({ msg:"Failed to update.", type:"error" }); }
    setActionLoading(false);
  };

  const filtered = leaves.filter(l =>
    (filterStatus==="All" || l.status===filterStatus) &&
    (filterEmployee==="All" || l.userName===filterEmployee)
  );
  const empNames = [...new Set(leaves.map(l => l.userName))].filter(Boolean);
  const pending  = leaves.filter(l => l.status==="Pending").length;
  const approved = leaves.filter(l => l.status==="Approved").length;

  const fmt  = d => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  const diff = (s,e) => Math.ceil((new Date(e)-new Date(s))/86400000)+1;

  return (
    <div style={{ padding:"32px", maxWidth:"1200px", margin:"0 auto" }}>
      {toast.msg && (
        <div style={{ position:"fixed", bottom:"28px", right:"28px", zIndex:9998, background:T.surface, border:`1px solid ${toast.type==="error"?T.redBorder:T.greenBorder}`, borderLeft:`3px solid ${toast.type==="error"?T.red:T.green}`, borderRadius:"12px", padding:"14px 20px", boxShadow:T.shadowLg, animation:"notifSlide 0.3s", display:"flex", gap:"10px", alignItems:"center" }}>
          <span>{toast.type==="error"?"⚠":"✅"}</span>
          <span style={{ fontSize:"14px", fontWeight:"500", color:T.ink }}>{toast.msg}</span>
        </div>
      )}

      {showAddEmp && (
        <AddEmployeeModal
          onClose={() => setShowAddEmp(false)}
          onAdd={(emp) => setToast({ msg:`${emp.name} added successfully!`, type:"success" })}
        />
      )}

      {remarkModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.2s", backdropFilter:"blur(4px)" }}>
          <Card style={{ padding:"28px", width:"440px", boxShadow:T.shadowLg, animation:"popIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
            <h3 style={{ fontFamily:"'Syne', sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"6px", color:T.ink }}>
              {remarkModal.action==="Approved" ? "✅ Approve Request" : "❌ Reject Request"}
            </h3>
            <p style={{ color:T.inkMid, fontSize:"13px", marginBottom:"20px" }}>Add an optional remark for the employee.</p>
            <FTextarea label="Remark (Optional)" value={remark} onChange={e => setRemark(e.target.value)}
              placeholder={remarkModal.action==="Approved" ? "e.g. Approved! Enjoy your break." : "e.g. Critical deadline that week."} />
            <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={() => { setRemarkModal(null); setRemark(""); }}>Cancel</Btn>
              <Btn variant={remarkModal.action==="Approved"?"success":"danger"}
                onClick={() => updateStatus(remarkModal.id, remarkModal.action, remark)} disabled={actionLoading}>
                {actionLoading ? <Spinner /> : remarkModal.action==="Approved" ? "✅ Approve" : "❌ Reject"}
              </Btn>
            </div>
          </Card>
        </div>
      )}

      <div className="fade-up" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"28px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:"28px", fontWeight:"800", color:T.ink, letterSpacing:"-0.5px" }}>Team Dashboard</h1>
          <p style={{ color:T.inkMid, fontSize:"14px", marginTop:"4px" }}>Manage leave requests and your team.</p>
        </div>
        <Btn variant="primary" onClick={() => setShowAddEmp(true)}>➕ Add Employee</Btn>
      </div>

      <div className="fade-up d1" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"28px" }}>
        <StatCard label="Total Requests"  value={leaves.length}    icon="📋" color={T.blue}  />
        <StatCard label="Pending Review"  value={pending}          icon="⏳" color={T.amber} sub={pending>0?"Needs attention":"All clear!"} />
        <StatCard label="Approved"        value={approved}         icon="✅" color={T.green} />
        <StatCard label="Team Members"    value={employees.length} icon="👥" color={T.gold}  />
      </div>

      <div className="fade-up d2" style={{ display:"flex", gap:"4px", marginBottom:"22px" }}>
        {[["requests","📋 Leave Requests"],["team","👥 Team Members"]].map(([v,lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:"8px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600",
            background: view===v ? T.gold : T.surface,
            color: view===v ? "#1A1200" : T.inkMid,
            cursor:"pointer", transition:"all 0.2s",
            border: view===v ? "none" : `1px solid ${T.border}`,
          }}>{lbl}</button>
        ))}
      </div>

      {view === "requests" && (
        <div className="fade-up">
          <div style={{ display:"flex", gap:"10px", marginBottom:"18px", flexWrap:"wrap", alignItems:"flex-end" }}>
            <div>
              <div style={{ fontSize:"10px", fontWeight:"600", letterSpacing:"1px", textTransform:"uppercase", color:T.inkDim, marginBottom:"7px" }}>Status</div>
              <div style={{ display:"flex", gap:"4px", background:T.surface, padding:"4px", borderRadius:"10px", border:`1px solid ${T.border}` }}>
                {["All","Pending","Approved","Rejected"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding:"6px 14px", border:"none", borderRadius:"7px", fontSize:"12px", fontWeight:"500",
                    background: filterStatus===s ? T.gold : "transparent",
                    color: filterStatus===s ? "#1A1200" : T.inkMid,
                    cursor:"pointer", transition:"all 0.15s",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:"10px", fontWeight:"600", letterSpacing:"1px", textTransform:"uppercase", color:T.inkDim, marginBottom:"7px" }}>Employee</div>
              <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{
                padding:"9px 36px 9px 14px", border:`1px solid ${T.border}`, borderRadius:"10px",
                background:T.surface, color:T.ink, fontSize:"13px", cursor:"pointer", outline:"none", appearance:"none",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%239DA3C8' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
              }}>
                <option value="All">All Employees</option>
                {empNames.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            {filterEmployee !== "All" && <Btn variant="ghost" size="sm" onClick={() => setFilterEmployee("All")}>× Clear</Btn>}
            <div style={{ marginLeft:"auto" }}>
              <button onClick={fetchLeaves} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"9px 16px", color:T.inkMid, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", gap:"6px" }}>
                🔄 Refresh
              </button>
            </div>
          </div>
          <Card>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, fontSize:"13px", fontWeight:"500", color:T.inkMid }}>{filtered.length} result{filtered.length!==1?"s":""}</div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"48px", color:T.inkMid }}><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px", color:T.inkDim }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📭</div>
                <div>No requests found</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                      {["Employee","Type","From","To","Days","Reason","Status","Remark","Actions"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"10px", fontWeight:"600", color:T.inkDim, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.id} className="hover-row" style={{ borderBottom:`1px solid ${T.border}`, transition:"background 0.15s" }}>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ fontWeight:"600", fontSize:"13px", color:T.ink }}>{l.userName}</div>
                          <div style={{ fontSize:"11px", color:T.inkDim }}>{l.userEmail}</div>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ fontSize:"12px", fontWeight:"500", color:T.ink, background:T.surfaceBright, border:`1px solid ${T.border}`, borderRadius:"6px", padding:"3px 9px" }}>{l.leaveType}</span>
                        </td>
                        <td style={{ padding:"14px 16px", fontSize:"13px", color:T.inkMid, whiteSpace:"nowrap" }}>{fmt(l.startDate)}</td>
                        <td style={{ padding:"14px 16px", fontSize:"13px", color:T.inkMid, whiteSpace:"nowrap" }}>{fmt(l.endDate)}</td>
                        <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"700", color:T.ink, textAlign:"center" }}>{diff(l.startDate,l.endDate)}</td>
                        <td style={{ padding:"14px 16px", maxWidth:"150px" }}>
                          <span style={{ fontSize:"12px", color:T.inkMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{l.reason}</span>
                        </td>
                        <td style={{ padding:"14px 16px" }}><Badge status={l.status} /></td>
                        <td style={{ padding:"14px 16px", maxWidth:"130px" }}>
                          <span style={{ fontSize:"12px", color:T.inkMid, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{l.managerRemark || "—"}</span>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          {l.status === "Pending" ? (
                            <div style={{ display:"flex", gap:"6px" }}>
                              <Btn variant="success" size="sm" onClick={() => { setRemarkModal({ id:l.id, action:"Approved" }); setRemark(""); }}>✅</Btn>
                              <Btn variant="danger"  size="sm" onClick={() => { setRemarkModal({ id:l.id, action:"Rejected" }); setRemark(""); }}>❌</Btn>
                            </div>
                          ) : (
                            <span style={{ fontSize:"11px", color:T.inkDim }}>Done</span>
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
      )}

      {view === "team" && (
        <div className="fade-up">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
            <span style={{ fontSize:"14px", color:T.inkMid }}>{employees.length} member{employees.length!==1?"s":""}</span>
            <Btn variant="primary" size="sm" onClick={() => setShowAddEmp(true)}>➕ Add Employee</Btn>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:"16px" }}>
            {employees.map((emp, i) => {
              const empLeaves   = leaves.filter(l => l.userEmail === emp.email);
              const empApproved = empLeaves.filter(l => l.status === "Approved").length;
              const empPending  = empLeaves.filter(l => l.status === "Pending").length;
              return (
                <Card key={emp.id} style={{ padding:"22px", animation:`fadeUp 0.4s ${i*0.06}s both` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
                    <div style={{ width:"44px", height:"44px", borderRadius:"12px", flexShrink:0, background:`linear-gradient(135deg, ${T.gold}33, ${T.blue}33)`, border:`1px solid ${T.borderLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", fontWeight:"700", color:T.gold, fontFamily:"'Syne', sans-serif" }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:"700", fontSize:"14px", color:T.ink }}>{emp.name}</div>
                      <div style={{ fontSize:"11px", color:T.inkDim }}>{emp.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:"99px", background:T.blueDim, color:T.blue, fontSize:"11px", fontWeight:"500", border:`1px solid rgba(91,141,239,0.2)` }}>{emp.dept}</span>
                    <span style={{ padding:"3px 10px", borderRadius:"99px", background:T.greenDim, color:T.green, fontSize:"11px", fontWeight:"500", border:`1px solid ${T.greenBorder}` }}>Active</span>
                  </div>
                  <div style={{ height:"1px", background:T.border, margin:"0 0 14px" }} />
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    {[["Requests",empLeaves.length,T.ink],["Pending",empPending,T.amber],["Approved",empApproved,T.green]].map(([lbl,val,col]) => (
                      <div key={lbl} style={{ textAlign:"center" }}>
                        <div style={{ fontWeight:"700", fontSize:"16px", color:col, fontFamily:"'Syne', sans-serif" }}>{val}</div>
                        <div style={{ fontSize:"10px", color:T.inkDim, textTransform:"uppercase", letterSpacing:"0.5px" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
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
        <div style={{ minHeight:"100vh", background:T.bg }}>
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