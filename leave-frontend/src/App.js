import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:5123/api";

/* ═══════════════════════════════════════════════════════════
   DESIGN DIRECTION: Dark luxury glassmorphism
   Fonts: Sora (display/headings) + Plus Jakarta Sans (body)
   Palette: Deep navy, frosted glass cards, electric teal accent
   Vibe: Premium SaaS — Vercel meets Linear
═══════════════════════════════════════════════════════════ */

const C = {
  bg:        "#060A12",
  bg2:       "#0B1120",
  bg3:       "#101828",
  glass:     "rgba(255,255,255,0.04)",
  glassMd:   "rgba(255,255,255,0.07)",
  glassHov:  "rgba(255,255,255,0.09)",
  border:    "rgba(255,255,255,0.08)",
  borderLt:  "rgba(255,255,255,0.13)",
  ink:       "#EEF2FF",
  inkMid:    "#7C8BA1",
  inkFaint:  "#384454",
  acc:       "#00D4B4",
  accDim:    "rgba(0,212,180,0.14)",
  accGlow:   "rgba(0,212,180,0.4)",
  accDark:   "#00B89C",
  purple:    "#8B5CF6",
  purpleDim: "rgba(139,92,246,0.15)",
  green:     "#10B981", greenBg:"rgba(16,185,129,0.12)", greenBd:"rgba(16,185,129,0.25)",
  red:       "#F87171", redBg:  "rgba(248,113,113,0.12)",redBd:  "rgba(248,113,113,0.25)",
  amber:     "#FBBF24", amberBg:"rgba(251,191,36,0.12)", amberBd:"rgba(251,191,36,0.25)",
  blue:      "#60A5FA", blueBg: "rgba(96,165,250,0.12)", blueBd: "rgba(96,165,250,0.25)",
  sideW: 256,
};

/* ─── GLOBAL CSS ─────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html { font-size:14px; }

body {
  font-family:'Plus Jakarta Sans', sans-serif;
  line-height:1.6; color:${C.ink}; background:${C.bg};
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
input,select,textarea,button { font-family:inherit; }
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:${C.inkFaint}; border-radius:99px; }

@keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes popIn   { from{opacity:0;transform:scale(.95) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes toastIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes shake   { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-14deg)} 40%{transform:rotate(14deg)} 60%{transform:rotate(-8deg)} 80%{transform:rotate(8deg)} }
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }

.fu  { animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
.fu1 { animation-delay:.07s }
.fu2 { animation-delay:.14s }
.fu3 { animation-delay:.21s }
.fu4 { animation-delay:.28s }

.inp {
  width:100%; padding:11px 15px;
  background:${C.glass};
  border:1px solid ${C.border};
  border-radius:12px; color:${C.ink}; font-size:13.5px;
  transition:border-color .2s, box-shadow .2s, background .2s;
  outline:none; backdrop-filter:blur(8px);
}
.inp::placeholder { color:${C.inkFaint}; }
.inp:focus {
  border-color:${C.acc};
  background:rgba(0,212,180,0.05);
  box-shadow:0 0 0 3px ${C.accDim};
}
.inp-sel {
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 11 11'%3E%3Cpath fill='%237C8BA1' d='M5.5 7.5L1 2.5h9z'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 13px center;
  padding-right:34px; cursor:pointer;
}
.inp option { background:${C.bg3}; }

.btn { transition:all .18s cubic-bezier(.16,1,.3,1); }
.btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
.btn:active { transform:translateY(0) scale(.98); }
.btn:disabled { opacity:.4; pointer-events:none; }

.nav-i { transition:all .15s; }
.nav-i:hover { background:${C.glassHov}; }
.nav-act { background:${C.glassMd} !important; }
.row-h { transition:background .12s; }
.row-h:hover { background:${C.glass} !important; }
.card-h { transition:transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s; }
.card-h:hover { transform:translateY(-3px); box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px ${C.borderLt}; }
.bell-s { animation:shake .5s ease; }
.tab-pill { transition:all .15s; }
.tab-pill-act { background:${C.glassMd} !important; color:${C.ink} !important; border-color:${C.borderLt} !important; }
.prog { transition:width .7s cubic-bezier(.16,1,.3,1); }
`;

/* ─── HELPERS ────────────────────────────────────────────── */
const fmt  = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const fmtS = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const dur  = (s,e) => Math.max(1,Math.ceil((new Date(e)-new Date(s))/86400000)+1);
const AVCOLORS = ["#00D4B4","#8B5CF6","#F59E0B","#EC4899","#3B82F6","#10B981","#F87171"];
const aColor   = n => AVCOLORS[(n?.charCodeAt(0)||0)%AVCOLORS.length];
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const LC = { Annual:C.blue, Sick:C.red, Casual:C.green, Emergency:C.amber, Unpaid:C.inkMid };

/* ─── AVATAR ─────────────────────────────────────────────── */
function Av({name,size=32,r=10}) {
  const col = aColor(name);
  return (
    <div style={{
      width:size,height:size,borderRadius:r,flexShrink:0,
      background:`linear-gradient(135deg,${col}30,${col}14)`,
      border:`1.5px solid ${col}45`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*.34,fontWeight:700,color:col,
      fontFamily:"'Sora',sans-serif",letterSpacing:"-.5px",
    }}>{initials(name)}</div>
  );
}

/* ─── BADGE ──────────────────────────────────────────────── */
function Badge({status}) {
  const m = {
    Pending: {bg:C.amberBg,c:C.amber,bd:C.amberBd},
    Approved:{bg:C.greenBg,c:C.green,bd:C.greenBd},
    Rejected:{bg:C.redBg,  c:C.red,  bd:C.redBd},
  };
  const s = m[status]||m.Pending;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:"3px 10px",borderRadius:99,
      background:s.bg,color:s.c,border:`1px solid ${s.bd}`,
      fontSize:11,fontWeight:600,letterSpacing:".3px",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.c}}/>
      {status}
    </span>
  );
}

/* ─── SPINNER ────────────────────────────────────────────── */
const Spin = ({size=14,color=C.acc}) => (
  <span style={{
    display:"inline-block",width:size,height:size,
    border:`2px solid ${color}30`,borderTopColor:color,
    borderRadius:"50%",animation:"spin .65s linear infinite",flexShrink:0,
  }}/>
);

/* ─── TOAST ──────────────────────────────────────────────── */
function Toast({msg,type="success",onClose}) {
  useEffect(()=>{if(!msg)return;const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[msg]);
  if(!msg) return null;
  const m={success:{ic:"✓",c:C.green,bg:C.greenBg,bd:C.greenBd},error:{ic:"✕",c:C.red,bg:C.redBg,bd:C.redBd},info:{ic:"i",c:C.blue,bg:C.blueBg,bd:C.blueBd}};
  const s=m[type]||m.success;
  return (
    <div style={{
      position:"fixed",bottom:24,right:24,zIndex:9999,
      background:C.bg3,border:`1px solid ${C.borderLt}`,
      borderRadius:16,padding:"14px 18px",
      boxShadow:"0 24px 64px rgba(0,0,0,.8)",maxWidth:340,
      animation:"toastIn .3s cubic-bezier(.16,1,.3,1)",
      display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(20px)",
    }}>
      <span style={{
        width:26,height:26,borderRadius:"50%",flexShrink:0,
        background:s.bg,border:`1px solid ${s.bd}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:11,fontWeight:700,color:s.c,
      }}>{s.ic}</span>
      <span style={{flex:1,fontSize:13,color:C.ink,lineHeight:1.5}}>{msg}</span>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:18,lineHeight:1,padding:2}}>×</button>
    </div>
  );
}

/* ─── FIELD ──────────────────────────────────────────────── */
function Field({label,style:st={},textarea=false,sel=false,children,...p}) {
  return (
    <div style={{marginBottom:16,...st}}>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:C.inkMid,marginBottom:6,letterSpacing:".7px",textTransform:"uppercase"}}>{label}</label>}
      {textarea
        ?<textarea className="inp" style={{minHeight:84,resize:"vertical",lineHeight:1.6}} {...p}/>
        :sel
        ?<select className="inp inp-sel" {...p}>{children}</select>
        :<input className="inp" {...p}/>
      }
    </div>
  );
}

/* ─── BUTTON ─────────────────────────────────────────────── */
function Btn({children,v="primary",style:st={},...p}) {
  const vs={
    primary:{background:`linear-gradient(135deg,${C.acc},${C.accDark})`,color:"#000",border:"none",boxShadow:`0 4px 20px ${C.accDim}`,fontWeight:700},
    outline:{background:"transparent",color:C.acc,border:`1px solid ${C.acc}`,boxShadow:"none"},
    ghost:  {background:C.glass,color:C.inkMid,border:`1px solid ${C.border}`,boxShadow:"none",backdropFilter:"blur(8px)"},
    success:{background:C.greenBg,color:C.green,border:`1px solid ${C.greenBd}`,boxShadow:"none"},
    danger: {background:C.redBg,  color:C.red,  border:`1px solid ${C.redBd}`,  boxShadow:"none"},
    dark:   {background:C.glassMd,color:C.ink,  border:`1px solid ${C.borderLt}`,boxShadow:"none",backdropFilter:"blur(8px)"},
  };
  return (
    <button className="btn" style={{
      padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:600,
      cursor:"pointer",display:"inline-flex",alignItems:"center",
      gap:7,whiteSpace:"nowrap",lineHeight:1,...vs[v],...st,
    }} {...p}>{children}</button>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────── */
function Stat({label,value,icon,color=C.acc,sub}) {
  return (
    <div style={{
      background:C.glass,border:`1px solid ${C.border}`,
      borderRadius:16,padding:"22px",backdropFilter:"blur(12px)",
      position:"relative",overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${color}25,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:600,color:C.inkMid,textTransform:"uppercase",letterSpacing:".7px"}}>{label}</span>
        <span style={{width:36,height:36,borderRadius:10,background:color+"1E",border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{icon}</span>
      </div>
      <div style={{fontSize:34,fontWeight:800,color:C.ink,fontFamily:"'Sora',sans-serif",lineHeight:1,letterSpacing:"-1px"}}>{value}</div>
      {sub&&<div style={{fontSize:11.5,color:C.inkFaint,marginTop:6}}>{sub}</div>}
    </div>
  );
}

/* ─── MODAL ──────────────────────────────────────────────── */
function Modal({children,onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,6,14,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.bg3,borderRadius:20,padding:32,width:"100%",maxWidth:460,border:`1px solid ${C.borderLt}`,boxShadow:"0 40px 100px rgba(0,0,0,.85)",animation:"popIn .28s cubic-bezier(.16,1,.3,1)"}}>{children}</div>
    </div>
  );
}

/* ─── NOTIFICATION BELL ──────────────────────────────────── */
function Bell({userId}) {
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);
  const [shake,setShake]=useState(false);
  const prevUnread=useRef(0);
  const ref=useRef(null);

  const load=useCallback(async()=>{
    try{
      const r=await fetch(`${API}/Notification/user/${userId}`);
      if(!r.ok)return;
      const data=await r.json();
      const unread=data.filter(n=>!n.isRead).length;
      if(unread>prevUnread.current){setShake(true);setTimeout(()=>setShake(false),550);}
      prevUnread.current=unread;setItems(data);
    }catch{}
  },[userId]);

  useEffect(()=>{load();const iv=setInterval(load,10000);return()=>clearInterval(iv);},[load]);
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  const unread=items.filter(n=>!n.isRead).length;
  const markAll=async()=>{try{await fetch(`${API}/Notification/markread/${userId}`,{method:"PUT"});}catch{}setItems(p=>p.map(n=>({...n,isRead:true})));prevUnread.current=0;};
  const remove=async(id,e)=>{e.stopPropagation();try{await fetch(`${API}/Notification/${id}`,{method:"DELETE"});}catch{}setItems(p=>p.filter(n=>n.id!==id));};
  const ago=s=>{const m=Math.floor((Date.now()-new Date(s))/60000);if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;};
  const iconf=msg=>{const m=msg.toLowerCase();if(m.includes("approved"))return{bg:C.greenBg,bd:C.greenBd,c:C.green,i:"✓"};if(m.includes("rejected"))return{bg:C.redBg,bd:C.redBd,c:C.red,i:"✕"};if(m.includes("welcome"))return{bg:C.blueBg,bd:C.blueBd,c:C.blue,i:"★"};return{bg:C.amberBg,bd:C.amberBd,c:C.amber,i:"●"};};

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button className={`btn${shake?" bell-s":""}`}
        onClick={()=>{setOpen(o=>{if(!o&&unread>0)markAll();return!o;});}}
        style={{width:40,height:40,borderRadius:11,cursor:"pointer",background:C.glass,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",fontSize:17,backdropFilter:"blur(8px)"}}>
        🔔
        {unread>0&&<span style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,${C.acc},${C.purple})`,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.bg}`}}>{unread>9?"9+":unread}</span>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:48,right:0,width:340,background:C.bg3,border:`1px solid ${C.borderLt}`,borderRadius:16,boxShadow:"0 24px 60px rgba(0,0,0,.8)",zIndex:200,animation:"popIn .22s cubic-bezier(.16,1,.3,1)",overflow:"hidden",backdropFilter:"blur(20px)"}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:700,color:C.ink,fontFamily:"'Sora',sans-serif"}}>Notifications</span>
            {items.length>0&&<button onClick={()=>setItems([])} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.inkFaint}}>Clear all</button>}
          </div>
          <div style={{maxHeight:340,overflowY:"auto"}}>
            {items.length===0
              ?<div style={{padding:"36px 16px",textAlign:"center",color:C.inkFaint,fontSize:13}}>All caught up ✓</div>
              :items.map(n=>{const ic=iconf(n.message);return(
                <div key={n.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"flex-start",background:n.isRead?"transparent":C.accDim,transition:"background .15s"}}>
                  <span style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:ic.bg,border:`1px solid ${ic.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:ic.c}}>{ic.i}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12.5,color:C.ink,lineHeight:1.5,marginBottom:3}}>{n.message}</p>
                    <span style={{fontSize:11,color:C.inkFaint}}>{ago(n.createdAt)}</span>
                  </div>
                  <button onClick={e=>remove(n.id,e)} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:16,padding:2,flexShrink:0,lineHeight:1}}>×</button>
                </div>
              );})
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ADD EMPLOYEE MODAL ─────────────────────────────────── */
function AddEmpModal({onClose,onSuccess}) {
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setL]=useState(false);

  const submit=async()=>{
    setErr("");
    if(!form.name.trim()||!form.email.trim()||!form.password.trim()){setErr("All fields are required.");return;}
    setL(true);
    try{
      const r=await fetch(`${API}/User/AddEmployee`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name.trim(),email:form.email.trim().toLowerCase(),password:form.password.trim()})});
      const d=await r.json();
      if(!r.ok){setErr(d.message||"Something went wrong.");setL(false);return;}
      onSuccess(d.name);
    }catch{setErr("Can't reach the server.");}
    setL(false);
  };

  return(
    <Modal onClose={onClose}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:700,color:C.ink,marginBottom:6,letterSpacing:"-.4px"}}>Add New Employee</h3>
        <p style={{fontSize:13,color:C.inkMid}}>Create a team member account instantly.</p>
      </div>
      {err&&<div style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:10,padding:"10px 14px",color:C.red,fontSize:12.5,fontWeight:500,marginBottom:18,display:"flex",alignItems:"center",gap:8}}>⚠ {err}</div>}
      <Field label="Full Name" type="text" placeholder="e.g. Priya Sharma" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <Field label="Email Address" type="email" placeholder="priya@company.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <Field label="Password" type="password" placeholder="Set a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()} style={{marginBottom:24}}/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn v="primary" onClick={submit} disabled={loading}>{loading?<><Spin size={12} color="#000"/>Adding…</>:"Add Employee →"}</Btn>
      </div>
    </Modal>
  );
}

/* ─── LOGIN ──────────────────────────────────────────────── */
function Login({onLogin}) {
  const [role,setRole]=useState("Employee");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setL]=useState(false);

  useEffect(()=>{setEmail("");setPw("");setErr("");},[role]);

  const go=async()=>{
    setErr("");
    if(!email.trim()||!pw.trim()){setErr("Both fields are required.");return;}
    setL(true);
    try{
      const r=await fetch(`${API}/User/Login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase(),password:pw.trim()})});
      const d=await r.json();
      if(!r.ok){setErr(d.message||"Invalid credentials.");setL(false);return;}
      onLogin(d);
    }catch{setErr("Backend unreachable. Make sure it's running on port 5123.");}
    setL(false);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"grid",gridTemplateColumns:"1fr 1fr",position:"relative"}}>
      {/* mesh bg */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:`radial-gradient(ellipse 80% 60% at 20% 40%,rgba(0,212,180,.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 70%,rgba(139,92,246,.07) 0%,transparent 60%)`}}/>

      {/* ── Left brand panel ── */}
      <div style={{position:"relative",zIndex:1,padding:"56px 60px",display:"flex",flexDirection:"column",justifyContent:"space-between",borderRight:`1px solid ${C.border}`}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${C.acc},${C.accDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`0 8px 24px ${C.accDim}`}}>⬡</div>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.ink,letterSpacing:"-.5px"}}>LeaveFlow</span>
        </div>

        {/* Hero */}
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:99,marginBottom:24,background:C.accDim,border:`1px solid ${C.acc}40`,fontSize:11,fontWeight:600,color:C.acc,letterSpacing:"1px",textTransform:"uppercase"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:C.acc,animation:"pulse 2s infinite"}}/>
            Leave Management Platform
          </div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:46,fontWeight:800,lineHeight:1.08,letterSpacing:"-2px",marginBottom:20,color:C.ink}}>
            Manage time off,{" "}
            <span style={{background:`linear-gradient(135deg,${C.acc} 0%,#8B5CF6 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>beautifully.</span>
          </h1>
          <p style={{fontSize:15,color:C.inkMid,lineHeight:1.8,maxWidth:340}}>
            Submit requests, approve leaves, and keep your team in sync — all in one elegant place.
          </p>

          <div style={{marginTop:36,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{icon:"⚡",text:"Real-time alerts"},{icon:"✓",text:"One-click approvals"},{icon:"📊",text:"Leave analytics"},{icon:"🔒",text:"Role-based access"}].map(({icon,text})=>(
              <div key={text} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,background:C.glass,border:`1px solid ${C.border}`,backdropFilter:"blur(8px)"}}>
                <span style={{fontSize:15}}>{icon}</span>
                <span style={{fontSize:12.5,color:C.inkMid,fontWeight:500}}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{fontSize:11,color:C.inkFaint}}>© 2026 LeaveFlow · All rights reserved</p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
        <div className="fu" style={{width:"100%",maxWidth:400}}>

          <div style={{marginBottom:34}}>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.ink,letterSpacing:"-1px",marginBottom:8}}>Welcome back</h2>
            <p style={{fontSize:14,color:C.inkMid}}>Sign in to continue to your dashboard.</p>
          </div>

          {/* Role toggle */}
          <div style={{display:"flex",gap:4,padding:4,background:C.glass,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:28,backdropFilter:"blur(8px)"}}>
            {["Employee","Manager"].map(r=>(
              <button key={r} onClick={()=>setRole(r)} className="btn" style={{
                flex:1,padding:"10px 0",border:"none",borderRadius:11,
                fontSize:13,fontWeight:700,cursor:"pointer",
                color:role===r?"#000":C.inkMid,
                background:role===r?`linear-gradient(135deg,${C.acc},${C.accDark})`:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                boxShadow:role===r?`0 4px 16px ${C.accDim}`:"none",
              }}>
                <span>{r==="Employee"?"👤":"👔"}</span>{r}
              </button>
            ))}
          </div>

          {/* Card */}
          <div style={{background:C.glass,border:`1px solid ${C.borderLt}`,borderRadius:20,padding:"32px",boxShadow:"0 32px 80px rgba(0,0,0,.6)",backdropFilter:"blur(20px)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.acc}60,transparent)`}}/>

            {err&&<div style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:10,padding:"10px 14px",color:C.red,fontSize:13,fontWeight:500,marginBottom:22,display:"flex",alignItems:"center",gap:8}}>⚠ {err}</div>}

            <Field label="Email Address" type="email" value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder={role==="Employee"?"jashika@test.com":"manager@test.com"}
              onKeyDown={e=>e.key==="Enter"&&go()}/>
            <Field label="Password" type="password" value={pw}
              onChange={e=>setPw(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&go()}
              placeholder="Enter your password"
              style={{marginBottom:24}}/>

            <Btn v="primary" onClick={go} disabled={loading}
              style={{width:"100%",justifyContent:"center",padding:"13px",fontSize:14,borderRadius:12}}>
              {loading?<><Spin size={14} color="#000"/>Signing in…</>:`Sign in as ${role} →`}
            </Btn>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────── */
function Sidebar({role,tab,setTab,user,onLogout}) {
  const nav=(role==="Manager"
    ?[{id:"requests",icon:"≡",label:"Leave Requests"},{id:"employees",icon:"◎",label:"Team"}]
    :[{id:"apply",icon:"✦",label:"Apply for Leave"},{id:"history",icon:"≡",label:"My Requests"}]
  );

  return(
    <aside style={{width:C.sideW,flexShrink:0,background:C.bg2,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,borderRight:`1px solid ${C.border}`}}>
      {/* Logo */}
      <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.acc},${C.accDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 4px 14px ${C.accDim}`}}>⬡</div>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:C.ink,letterSpacing:"-.5px"}}>LeaveFlow</span>
        </div>
      </div>

      {/* Role badge */}
      <div style={{padding:"12px 16px 6px"}}>
        <div style={{padding:"5px 12px",borderRadius:8,background:C.accDim,border:`1px solid ${C.acc}35`,fontSize:10.5,fontWeight:700,color:C.acc,letterSpacing:"1px",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:6}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:C.acc}}/>
          {role}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{padding:"8px 10px",flex:1,overflowY:"auto"}}>
        {nav.map(({id,icon,label})=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`nav-i${tab===id?" nav-act":""}`}
            style={{width:"100%",padding:"11px 12px",borderRadius:11,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:11,textAlign:"left",color:tab===id?C.ink:C.inkMid,marginBottom:3,position:"relative"}}>
            {tab===id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:99,background:`linear-gradient(180deg,${C.acc},${C.purple})`}}/>}
            <span style={{width:30,height:30,borderRadius:8,flexShrink:0,background:tab===id?C.accDim:"transparent",border:tab===id?`1px solid ${C.acc}35`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:tab===id?C.acc:C.inkFaint,transition:"all .15s"}}>{icon}</span>
            <span style={{fontSize:13,fontWeight:tab===id?700:400,letterSpacing:"-.2px"}}>{label}</span>
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{padding:"14px",borderTop:`1px solid ${C.border}`}}>
        <div style={{padding:"11px 12px",borderRadius:12,background:C.glass,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,marginBottom:10,backdropFilter:"blur(8px)"}}>
          <Av name={user.name} size={32} r={9}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12.5,fontWeight:700,color:C.ink,fontFamily:"'Sora',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{fontSize:10.5,color:C.inkFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn" style={{width:"100%",padding:"9px",borderRadius:9,background:C.glass,border:`1px solid ${C.border}`,color:C.inkMid,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,backdropFilter:"blur(8px)"}}>
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  );
}

/* ─── TOPBAR ─────────────────────────────────────────────── */
function TopBar({title,subtitle,userId,actions}) {
  return(
    <div style={{padding:"20px 30px",background:C.bg2,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(20px)"}}>
      <div>
        <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.ink,letterSpacing:"-.6px",lineHeight:1}}>{title}</h2>
        {subtitle&&<p style={{fontSize:12.5,color:C.inkMid,marginTop:3}}>{subtitle}</p>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {actions}
        {userId&&<Bell userId={userId}/>}
      </div>
    </div>
  );
}

/* ─── EMPLOYEE DASHBOARD ─────────────────────────────────── */
function EmpDash({user,activeTab}) {
  const [leaves,setLeaves]=useState([]);
  const [loading,setL]=useState(false);
  const [tab,setTab]=useState(activeTab||"apply");
  const [subbing,setSub]=useState(false);
  const [toast,setToast]=useState({msg:"",type:"success"});
  const [form,setForm]=useState({leaveType:"Annual",startDate:"",endDate:"",reason:""});

  const load=async()=>{setL(true);try{const r=await fetch(`${API}/LeaveRequest/user/${user.userId}`);if(r.ok)setLeaves(await r.json());}catch{}setL(false);};
  useEffect(()=>{load();},[]);

  const submit=async()=>{
    if(!form.startDate||!form.endDate||!form.reason.trim()){setToast({msg:"Please fill all fields.",type:"error"});return;}
    if(new Date(form.endDate)<new Date(form.startDate)){setToast({msg:"End date must be after start date.",type:"error"});return;}
    setSub(true);
    try{
      const r=await fetch(`${API}/LeaveRequest/Create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,userId:user.userId})});
      const d=await r.json();
      if(r.ok){setToast({msg:"Leave submitted — manager notified!",type:"success"});setForm({leaveType:"Annual",startDate:"",endDate:"",reason:""});load();}
      else setToast({msg:d.message||"Submission failed.",type:"error"});
    }catch{setToast({msg:"Server error.",type:"error"});}
    setSub(false);
  };

  const pend=leaves.filter(l=>l.status==="Pending").length;
  const appr=leaves.filter(l=>l.status==="Approved").length;
  const rej =leaves.filter(l=>l.status==="Rejected").length;
  const days=leaves.filter(l=>l.status==="Approved").reduce((a,l)=>a+dur(l.startDate,l.endDate),0);
  const daysPrev=form.startDate&&form.endDate&&new Date(form.endDate)>=new Date(form.startDate)?dur(form.startDate,form.endDate):null;

  return(
    <div style={{background:C.bg,minHeight:"100vh"}}>
      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:"",type:"success"})}/>
      <TopBar title={`Hello, ${user.name.split(" ")[0]} 👋`} subtitle="Manage your leave requests" userId={user.userId}/>

      {/* Stats */}
      <div className="fu1" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"24px 28px 0"}}>
        <Stat label="Total" value={leaves.length} icon="📋" color={C.acc}/>
        <Stat label="Pending" value={pend} icon="⏳" color={C.amber} sub="Awaiting review"/>
        <Stat label="Approved" value={appr} icon="✓" color={C.green} sub={`${days} days approved`}/>
        <Stat label="Rejected" value={rej} icon="✕" color={C.red}/>
      </div>

      {/* Tabs */}
      <div style={{padding:"22px 28px 0",display:"flex",gap:4}}>
        {[["apply","✦  Apply"],["history","≡  History"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`btn tab-pill${tab===id?" tab-pill-act":""}`}
            style={{padding:"9px 22px",borderRadius:10,cursor:"pointer",fontSize:12.5,fontWeight:700,background:tab===id?C.glassMd:C.glass,color:tab===id?C.ink:C.inkMid,border:`1px solid ${tab===id?C.borderLt:C.border}`,backdropFilter:"blur(8px)"}}>{label}</button>
        ))}
      </div>

      <div style={{padding:"18px 28px 48px"}}>
        {tab==="apply"&&(
          <div className="fu" style={{display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:16}}>
            {/* Form */}
            <div style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:18,padding:"28px",backdropFilter:"blur(12px)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.acc}50,transparent)`}}/>
              <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:C.ink,marginBottom:22,letterSpacing:"-.3px"}}>New Leave Request</h3>
              <Field label="Leave Type" sel value={form.leaveType} onChange={e=>setForm({...form,leaveType:e.target.value})}>
                {["Annual","Sick","Casual","Emergency","Unpaid"].map(t=><option key={t}>{t}</option>)}
              </Field>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Field label="Start Date" type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/>
                <Field label="End Date" type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/>
              </div>
              {daysPrev&&<div style={{background:C.accDim,border:`1px solid ${C.acc}30`,borderRadius:10,padding:"9px 14px",marginBottom:14,fontSize:13,color:C.acc,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>📅 {daysPrev} day{daysPrev!==1?"s":""} requested</div>}
              <Field label="Reason" textarea placeholder="Briefly describe your reason…" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
              <Btn v="primary" onClick={submit} disabled={subbing} style={{width:"100%",justifyContent:"center",padding:"13px",marginTop:4,borderRadius:12}}>
                {subbing?<><Spin size={13} color="#000"/>Submitting…</>:"Submit Request →"}
              </Btn>
            </div>

            {/* Guide */}
            <div style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:18,padding:"28px",backdropFilter:"blur(12px)"}}>
              <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:C.ink,marginBottom:18,letterSpacing:"-.3px"}}>Leave Types</h3>
              {[{type:"Annual",desc:"Planned holidays & vacations",days:"15 days/yr"},{type:"Sick",desc:"Medical appointments & illness",days:"10 days/yr"},{type:"Casual",desc:"Personal errands & short breaks",days:"7 days/yr"},{type:"Emergency",desc:"Urgent unforeseen circumstances",days:"5 days/yr"},{type:"Unpaid",desc:"Beyond paid leave allowance",days:"Approval"}].map(({type,desc,days:d})=>(
                <div key={type} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:LC[type]||C.acc,boxShadow:`0 0 8px ${LC[type]||C.acc}`}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.ink,letterSpacing:"-.2px"}}>{type}</div>
                    <div style={{fontSize:11.5,color:C.inkMid}}>{desc}</div>
                  </div>
                  <span style={{fontSize:10.5,color:C.inkFaint,fontWeight:500,background:C.glass,padding:"3px 8px",borderRadius:6,border:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{d}</span>
                </div>
              ))}
              <div style={{marginTop:22}}>
                <div style={{fontSize:11,fontWeight:600,color:C.inkMid,textTransform:"uppercase",letterSpacing:".7px",marginBottom:14}}>Your Status</div>
                {[{label:"Pending",val:pend,color:C.amber},{label:"Approved",val:appr,color:C.green},{label:"Rejected",val:rej,color:C.red}].map(({label,val,color})=>(
                  <div key={label} style={{marginBottom:11}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:11.5,color:C.inkMid}}>{label}</span>
                      <span style={{fontSize:11.5,fontWeight:700,color}}>{val}</span>
                    </div>
                    <div style={{height:4,background:C.glass,borderRadius:99,overflow:"hidden",border:`1px solid ${C.border}`}}>
                      <div className="prog" style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg,${color},${color}80)`,width:`${leaves.length?Math.round(val/leaves.length*100):0}%`,boxShadow:`0 0 8px ${color}80`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="history"&&(
          <div className="fu">
            <div style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden",backdropFilter:"blur(12px)"}}>
              <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:C.ink,letterSpacing:"-.3px"}}>
                  All Requests
                  <span style={{marginLeft:10,background:C.accDim,color:C.acc,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{leaves.length}</span>
                </span>
                <button onClick={load} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,color:C.inkMid}}>↺ Refresh</button>
              </div>
              {loading?<div style={{padding:52,textAlign:"center"}}><Spin size={22}/></div>
              :leaves.length===0?<div style={{padding:64,textAlign:"center",color:C.inkFaint}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:C.inkMid}}>No requests yet</div><div style={{fontSize:12.5,marginTop:5}}>Submit your first leave request above</div></div>
              :(
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Type","From","To","Days","Reason","Status","Remark"].map(h=><th key={h} style={{padding:"11px 18px",textAlign:"left",fontSize:10,fontWeight:700,color:C.inkFaint,textTransform:"uppercase",letterSpacing:"1px",background:"rgba(255,255,255,.02)",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {leaves.map(l=>(
                      <tr key={l.id} className="row-h" style={{borderTop:`1px solid ${C.border}`}}>
                        <td style={{padding:"13px 18px"}}><span style={{fontSize:12.5,fontWeight:700,color:LC[l.leaveType]||C.acc}}>{l.leaveType}</span></td>
                        <td style={{padding:"13px 18px",fontSize:12.5,color:C.inkMid}}>{fmtS(l.startDate)}</td>
                        <td style={{padding:"13px 18px",fontSize:12.5,color:C.inkMid}}>{fmtS(l.endDate)}</td>
                        <td style={{padding:"13px 18px"}}><span style={{fontSize:12,fontWeight:700,color:C.ink,background:C.glass,border:`1px solid ${C.border}`,padding:"3px 9px",borderRadius:7}}>{dur(l.startDate,l.endDate)}d</span></td>
                        <td style={{padding:"13px 18px",maxWidth:180}}><span style={{display:"block",fontSize:12,color:C.inkMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.reason}</span></td>
                        <td style={{padding:"13px 18px"}}><Badge status={l.status}/></td>
                        <td style={{padding:"13px 18px",fontSize:12,color:C.inkMid,fontStyle:l.managerRemark?"normal":"italic"}}>{l.managerRemark||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MANAGER DASHBOARD ──────────────────────────────────── */
function MgrDash({user,activeTab}) {
  const [leaves,setLeaves]=useState([]);
  const [emps,setEmps]=useState([]);
  const [loading,setL]=useState(false);
  const [tab,setTab]=useState(activeTab||"requests");
  const [fStat,setFStat]=useState("All");
  const [fEmp,setFEmp]=useState("All");
  const [remark,setRemark]=useState({});
  const [acting,setActing]=useState({});
  const [toast,setToast]=useState({msg:"",type:"success"});
  const [showAdd,setShowAdd]=useState(false);

  const loadLeaves=async()=>{setL(true);try{const r=await fetch(`${API}/LeaveRequest`);if(r.ok)setLeaves(await r.json());}catch{}setL(false);};
  const loadEmps=async()=>{try{const r=await fetch(`${API}/User/employees`);if(r.ok)setEmps(await r.json());}catch{}};
  useEffect(()=>{loadLeaves();loadEmps();},[]);

  const act=async(id,status)=>{
    setActing(p=>({...p,[id]:true}));
    try{
      const r=await fetch(`${API}/LeaveRequest/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,managerRemark:remark[id]||""})});
      if(r.ok){setLeaves(p=>p.map(l=>l.id===id?{...l,status,managerRemark:remark[id]||""}:l));setToast({msg:`Request ${status.toLowerCase()} successfully.`,type:"success"});}
    }catch{setToast({msg:"Action failed.",type:"error"});}
    setActing(p=>({...p,[id]:false}));
  };

  const names=[...new Set(leaves.map(l=>l.userName||l.user?.name).filter(Boolean))];
  const filt=leaves.filter(l=>{const name=l.userName||l.user?.name||"";return(fStat==="All"||l.status===fStat)&&(fEmp==="All"||name===fEmp);});
  const pend=leaves.filter(l=>l.status==="Pending").length;
  const appr=leaves.filter(l=>l.status==="Approved").length;

  return(
    <div style={{background:C.bg,minHeight:"100vh"}}>
      {showAdd&&<AddEmpModal onClose={()=>setShowAdd(false)} onSuccess={name=>{setShowAdd(false);loadEmps();setToast({msg:`${name} added successfully!`,type:"success"});}}/>}
      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:"",type:"success"})}/>

      <TopBar title="Manager Dashboard" subtitle="Review and manage your team's leave requests" userId={user.userId}
        actions={<Btn v="primary" onClick={()=>setShowAdd(true)} style={{gap:8,paddingLeft:14}}><span style={{fontSize:18,fontWeight:300,lineHeight:1}}>+</span>Add Employee</Btn>}/>

      {/* Stats */}
      <div className="fu1" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"24px 28px 0"}}>
        <Stat label="Total Requests" value={leaves.length} icon="📋" color={C.acc}/>
        <Stat label="Pending" value={pend} icon="⏳" color={C.amber} sub="Need action"/>
        <Stat label="Approved" value={appr} icon="✓" color={C.green}/>
        <Stat label="Team Size" value={emps.length} icon="👥" color={C.purple}/>
      </div>

      {/* Tabs */}
      <div style={{padding:"22px 28px 0",display:"flex",gap:4}}>
        {[["requests","≡  Requests"],["employees","◎  Team"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`btn tab-pill${tab===id?" tab-pill-act":""}`}
            style={{padding:"9px 22px",borderRadius:10,cursor:"pointer",fontSize:12.5,fontWeight:700,background:tab===id?C.glassMd:C.glass,color:tab===id?C.ink:C.inkMid,border:`1px solid ${tab===id?C.borderLt:C.border}`,backdropFilter:"blur(8px)"}}>{label}</button>
        ))}
      </div>

      <div style={{padding:"18px 28px 48px"}}>
        {tab==="requests"&&(
          <div className="fu">
            {/* Filters */}
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:3,background:C.glass,padding:3,borderRadius:10,border:`1px solid ${C.border}`,backdropFilter:"blur(8px)"}}>
                {["All","Pending","Approved","Rejected"].map(s=>(
                  <button key={s} onClick={()=>setFStat(s)} className="btn" style={{padding:"5px 14px",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:fStat===s?C.glassMd:"transparent",color:fStat===s?C.ink:C.inkMid,boxShadow:fStat===s?`inset 0 0 0 1px ${C.borderLt}`:"none"}}>{s}</button>
                ))}
              </div>
              <select value={fEmp} onChange={e=>setFEmp(e.target.value)} className="inp inp-sel" style={{maxWidth:190,marginBottom:0,padding:"7px 32px 7px 12px"}}>
                <option value="All">All employees</option>
                {names.map(n=><option key={n}>{n}</option>)}
              </select>
              {fEmp!=="All"&&<button onClick={()=>setFEmp("All")} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,color:C.inkMid}}>✕ Clear</button>}
              <span style={{marginLeft:"auto",fontSize:12,color:C.inkMid}}>{filt.length} result{filt.length!==1?"s":""}</span>
              <button onClick={loadLeaves} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,color:C.inkMid}}>↺ Refresh</button>
            </div>

            {/* Table */}
            <div style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden",backdropFilter:"blur(12px)"}}>
              {loading?<div style={{padding:52,textAlign:"center"}}><Spin size={22}/></div>
              :filt.length===0?<div style={{padding:64,textAlign:"center",color:C.inkFaint}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:C.inkMid}}>No requests found</div></div>
              :(
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Employee","Type","Period","Days","Reason","Status","Remark","Action"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:C.inkFaint,textTransform:"uppercase",letterSpacing:"1px",background:"rgba(255,255,255,.02)",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filt.map(l=>{
                      const name=l.userName||l.user?.name||"?";
                      return(
                        <tr key={l.id} className="row-h" style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><Av name={name} size={30} r={8}/><span style={{fontSize:13,fontWeight:600,color:C.ink}}>{name}</span></div></td>
                          <td style={{padding:"13px 16px"}}><span style={{fontSize:12.5,fontWeight:700,color:LC[l.leaveType]||C.acc}}>{l.leaveType}</span></td>
                          <td style={{padding:"13px 16px",fontSize:12,color:C.inkMid,whiteSpace:"nowrap"}}>{fmtS(l.startDate)} → {fmtS(l.endDate)}</td>
                          <td style={{padding:"13px 16px"}}><span style={{fontSize:12,fontWeight:700,color:C.ink,background:C.glass,border:`1px solid ${C.border}`,padding:"3px 9px",borderRadius:7}}>{dur(l.startDate,l.endDate)}d</span></td>
                          <td style={{padding:"13px 16px",maxWidth:150}}><span style={{display:"block",fontSize:12,color:C.inkMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.reason}</span></td>
                          <td style={{padding:"13px 16px"}}><Badge status={l.status}/></td>
                          <td style={{padding:"13px 16px",minWidth:140}}><input className="inp" placeholder="Add remark…" defaultValue={l.managerRemark||""} onChange={e=>setRemark(p=>({...p,[l.id]:e.target.value}))} style={{fontSize:12,padding:"6px 10px"}}/></td>
                          <td style={{padding:"13px 16px"}}>
                            {l.status==="Pending"?(
                              <div style={{display:"flex",gap:6}}>
                                <Btn v="success" onClick={()=>act(l.id,"Approved")} disabled={acting[l.id]} style={{padding:"5px 12px",fontSize:12,borderRadius:8}}>{acting[l.id]?<Spin size={11} color={C.green}/>:"✓"}</Btn>
                                <Btn v="danger"  onClick={()=>act(l.id,"Rejected")} disabled={acting[l.id]} style={{padding:"5px 12px",fontSize:12,borderRadius:8}}>{acting[l.id]?<Spin size={11} color={C.red}/>:"✕"}</Btn>
                              </div>
                            ):<span style={{fontSize:11.5,color:C.inkFaint,fontStyle:"italic"}}>Done</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab==="employees"&&(
          <div className="fu">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:C.ink,letterSpacing:"-.3px"}}>
                  Team Members
                  <span style={{marginLeft:10,background:C.accDim,color:C.acc,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{emps.length}</span>
                </h3>
                <p style={{fontSize:12,color:C.inkMid,marginTop:3}}>All active employees in your organisation</p>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={loadEmps} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,color:C.inkMid,backdropFilter:"blur(8px)"}}>↺ Refresh</button>
                <Btn v="primary" onClick={()=>setShowAdd(true)}><span style={{fontSize:16,fontWeight:300}}>+</span> Add Employee</Btn>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {emps.map(e=>{
                const emp_leaves=leaves.filter(l=>(l.userName||l.user?.name)===e.name);
                const ep=emp_leaves.filter(l=>l.status==="Pending").length;
                const ea=emp_leaves.filter(l=>l.status==="Approved").length;
                const col=aColor(e.name);
                return(
                  <div key={e.id} className="card-h" style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px",backdropFilter:"blur(12px)",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,${col}18,transparent 70%)`,pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:16}}>
                      <Av name={e.name} size={46} r={13}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.ink,fontFamily:"'Sora',sans-serif",letterSpacing:"-.3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                        <div style={{fontSize:11.5,color:C.inkMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.email}</div>
                      </div>
                    </div>
                    <div style={{marginBottom:16}}>
                      <span style={{fontSize:10.5,fontWeight:700,color:C.green,background:C.greenBg,border:`1px solid ${C.greenBd}`,padding:"3px 10px",borderRadius:99,display:"inline-flex",alignItems:"center",gap:5}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:C.green}}/>Active
                      </span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
                      {[{l:"Requests",v:emp_leaves.length,c:C.inkMid},{l:"Pending",v:ep,c:C.amber},{l:"Approved",v:ea,c:C.green}].map(({l,v,c})=>(
                        <div key={l} style={{textAlign:"center",padding:"8px 4px",background:C.glass,borderRadius:8,border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:20,fontWeight:800,color:c,fontFamily:"'Sora',sans-serif",lineHeight:1,letterSpacing:"-1px"}}>{v}</div>
                          <div style={{fontSize:9.5,color:C.inkFaint,marginTop:3,textTransform:"uppercase",letterSpacing:".4px",fontWeight:600}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────── */
export default function App() {
  const [user,setUser]=useState(null);
  const [sideTab,setSideTab]=useState(null);
  const handleLogin=u=>{setUser(u);setSideTab(u.role==="Manager"?"requests":"apply");};

  return(
    <>
      <style>{CSS}</style>
      {!user?(
        <Login onLogin={handleLogin}/>
      ):(
        <div style={{display:"flex",minHeight:"100vh"}}>
          <Sidebar role={user.role} tab={sideTab} setTab={setSideTab} user={user} onLogout={()=>{setUser(null);setSideTab(null);}}/>
          <main style={{flex:1,minWidth:0,overflowX:"hidden"}}>
            {user.role==="Manager"
              ?<MgrDash user={user} key={sideTab} activeTab={sideTab}/>
              :<EmpDash user={user} key={sideTab} activeTab={sideTab}/>
            }
          </main>
        </div>
      )}
    </>
  );
}