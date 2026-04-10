import { useState, useRef, useEffect } from "react";

const ADMIN_PASSWORD = "Daddup28";
const ADMIN_EMAIL = "nijesh01abhi@gmail.com";
const COLORS = ["#FBBF24","#34D399","#60A5FA","#F472B6","#A78BFA"];

const initFreeNotes = [
  { id: 1, title: "Biology - Cell Structure", subject: "Biology", premium: false, content: "The cell is the basic unit of life.\n\n1. Prokaryotic cells - No nucleus, found in bacteria\n2. Eukaryotic cells - Have a nucleus, found in plants and animals\n\nKey organelles:\n- Mitochondria: powerhouse of the cell\n- Nucleus: contains DNA\n- Ribosome: site of protein synthesis", createdAt: "2024-01-10" },
  { id: 2, title: "Physics - Newton's Laws", subject: "Physics", premium: false, content: "Newton's Three Laws of Motion:\n\n1st Law: An object at rest stays at rest unless acted upon by an external force.\n2nd Law: F = ma\n3rd Law: For every action, there is an equal and opposite reaction.", createdAt: "2024-01-12" },
];
const initPremiumNotes = [
  { id: 3, title: "Chemistry - Organic Reactions", subject: "Chemistry", premium: true, content: "Organic Chemistry Master Notes\n\nKey Reaction Types:\n1. Substitution (SN1 & SN2)\n2. Elimination (E1 & E2)\n3. Addition reactions\n4. Oxidation/Reduction\n\nImportant reagents and mechanisms explained with examples for board exams.", createdAt: "2024-01-15" },
  { id: 4, title: "Maths - Integration Formulas", subject: "Maths", premium: true, content: "Complete Integration Formula Sheet\n\n∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n∫eˣ dx = eˣ + C\n∫sin x dx = -cos x + C\n∫cos x dx = sin x + C\n∫1/x dx = ln|x| + C\n\nBy Parts: ∫u dv = uv - ∫v du\nSubstitution methods and solved examples.", createdAt: "2024-01-18" },
];

export default function App() {
  const [notes, setNotes] = useState([...initFreeNotes, ...initPremiumNotes]);
  const [activeNote, setActiveNote] = useState(initFreeNotes[0]);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editPremium, setEditPremium] = useState(false);
  const [search, setSearch] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [highlights, setHighlights] = useState({});
  const [activeColor, setActiveColor] = useState(0);
  const [annotations, setAnnotations] = useState({});
  const [showAnnotation, setShowAnnotation] = useState(null);
  const [annotInput, setAnnotInput] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth
  const [view, setView] = useState("app"); // app | adminLogin | admin | premiumRequest | premiumPending
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [tab, setTab] = useState("free"); // free | premium

  // Premium requests (stored in state, admin can approve)
  const [requests, setRequests] = useState([]);
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);
  const [approvedEmails, setApprovedEmails] = useState([]);
  const [premiumEmail, setPremiumEmail] = useState("");
  const [premiumError, setPremiumError] = useState("");

  const chatEndRef = useRef();
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  const visibleNotes = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.subject.toLowerCase().includes(search.toLowerCase());
    if (tab === "free") return !n.premium && matchSearch;
    if (tab === "premium") return n.premium && matchSearch;
    return matchSearch;
  });

  const canAccess = (note) => {
    if (!note.premium) return true;
    if (isAdmin) return true;
    if (isPremium) return true;
    return false;
  };

  const selectNote = (note) => {
    if (!canAccess(note)) return;
    setActiveNote(note);
    setEditing(false);
    setShowAI(false);
    setAiMessages([]);
    setShowExport(false);
  };

  const startEdit = () => { setEditContent(activeNote.content); setEditTitle(activeNote.title); setEditSubject(activeNote.subject); setEditPremium(activeNote.premium); setEditing(true); };
  const saveEdit = () => {
    const updated = notes.map(n => n.id === activeNote.id ? { ...n, content: editContent, title: editTitle, subject: editSubject, premium: editPremium } : n);
    setNotes(updated);
    setActiveNote({ ...activeNote, content: editContent, title: editTitle, subject: editSubject, premium: editPremium });
    setEditing(false);
  };
  const newNote = () => {
    const n = { id: Date.now(), title: "New Note", subject: "General", premium: tab === "premium", content: "Start writing here...", createdAt: new Date().toISOString().slice(0,10) };
    setNotes([n, ...notes]);
    setActiveNote(n);
    setEditContent(n.content); setEditTitle(n.title); setEditSubject(n.subject); setEditPremium(n.premium);
    setEditing(true);
  };
  const deleteNote = (id) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeNote?.id === id) setActiveNote(remaining.find(n => !n.premium) || remaining[0] || null);
  };

  const handleHighlight = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;
    const key = `${activeNote.id}`;
    setHighlights({ ...highlights, [key]: [...(highlights[key]||[]), { text, color: COLORS[activeColor] }] });
    sel.removeAllRanges();
  };
  const handleAnnotate = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;
    setShowAnnotation(text); setAnnotInput(""); sel.removeAllRanges();
  };
  const saveAnnotation = () => {
    if (!annotInput.trim()) return;
    const key = `${activeNote.id}`;
    setAnnotations({ ...annotations, [key]: [...(annotations[key]||[]), { text: showAnnotation, note: annotInput }] });
    setShowAnnotation(null);
  };
  const getHighlightedContent = (content, noteId) => {
    let html = content.replace(/\n/g, "<br/>");
    (highlights[`${noteId}`]||[]).forEach(h => {
      const e = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(e,'g'), `<mark style="background:${h.color}88;border-radius:3px;padding:1px 2px;">${h.text}</mark>`);
    });
    (annotations[`${noteId}`]||[]).forEach(a => {
      const e = a.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(e,'g'), `<span style="border-bottom:2px dashed #6366f1;cursor:pointer;" title="${a.note}">${a.text}</span>`);
    });
    return html;
  };

  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim(); setAiInput("");
    const newMessages = [...aiMessages, { role:"user", content:userMsg }];
    setAiMessages(newMessages); setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are a helpful study assistant. The student is viewing a note titled "${activeNote?.title}" (${activeNote?.subject}).\n\nNote content:\n${activeNote?.content}\n\nHelp them understand, quiz, or summarize. Be concise and encouraging.`,
          messages: newMessages })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "Sorry, try again.";
      setAiMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch { setAiMessages([...newMessages, { role:"assistant", content:"Connection error. Please try again." }]); }
    setAiLoading(false);
  };

  const exportNote = () => {
    const text = `${activeNote.title}\nSubject: ${activeNote.subject}\nDate: ${activeNote.createdAt}\n\n${activeNote.content}`;
    const blob = new Blob([text],{type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`${activeNote.title}.txt`; a.click();
    URL.revokeObjectURL(url); setShowExport(false);
  };
  const copyNote = () => { navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`); setShowExport(false); };

  const handleAdminLogin = () => {
    if (adminPass === ADMIN_PASSWORD) { setIsAdmin(true); setView("app"); setAdminError(""); setAdminPass(""); setTab("free"); }
    else setAdminError("Incorrect password.");
  };

  const submitRequest = () => {
    if (!reqName.trim() || !reqEmail.trim()) return;
    setRequests([...requests, { id: Date.now(), name: reqName, email: reqEmail, status: "pending" }]);
    setReqSubmitted(true);
  };

  const approveRequest = (id) => {
    const req = requests.find(r => r.id === id);
    if (req) setApprovedEmails([...approvedEmails, req.email.toLowerCase()]);
    setRequests(requests.map(r => r.id === id ? {...r, status:"approved"} : r));
  };
  const rejectRequest = (id) => setRequests(requests.map(r => r.id === id ? {...r, status:"rejected"} : r));

  const handlePremiumAccess = () => {
    if (approvedEmails.includes(premiumEmail.toLowerCase())) { setIsPremium(true); setView("app"); setTab("premium"); setPremiumError(""); }
    else setPremiumError("Your email is not approved yet. Please wait for admin confirmation.");
  };

  const subjects = [...new Set(visibleNotes.map(n => n.subject))];

  // ---- VIEWS ----
  if (view === "adminLogin") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"600px",background:"var(--color-background-tertiary)"}}>
      <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"32px",width:"320px",border:"0.5px solid var(--color-border-secondary)"}}>
        <div style={{fontSize:"20px",fontWeight:500,marginBottom:"6px",color:"var(--color-text-primary)"}}>Admin Login</div>
        <div style={{fontSize:"13px",color:"var(--color-text-tertiary)",marginBottom:"20px"}}>Enter your admin password to manage notes and requests.</div>
        <input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} placeholder="Admin password" style={{width:"100%",padding:"9px 12px",fontSize:"14px",borderRadius:"8px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box",marginBottom:"8px",outline:"none"}} autoFocus />
        {adminError && <div style={{fontSize:"12px",color:"var(--color-text-danger)",marginBottom:"8px"}}>{adminError}</div>}
        <button onClick={handleAdminLogin} style={{width:"100%",background:"var(--color-background-info)",color:"var(--color-text-info)",border:"none",borderRadius:"8px",padding:"10px",fontSize:"14px",cursor:"pointer",fontWeight:500,marginBottom:"8px"}}>Login</button>
        <button onClick={()=>setView("app")} style={{width:"100%",background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"10px",fontSize:"13px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Cancel</button>
      </div>
    </div>
  );

  if (view === "premiumRequest") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"600px",background:"var(--color-background-tertiary)"}}>
      <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"32px",width:"360px",border:"0.5px solid var(--color-border-secondary)"}}>
        {!reqSubmitted ? <>
          <div style={{fontSize:"18px",fontWeight:500,marginBottom:"4px",color:"var(--color-text-primary)"}}>Request Premium Access</div>
          <div style={{fontSize:"13px",color:"var(--color-text-tertiary)",marginBottom:"20px",lineHeight:1.6}}>Fill in your details. The admin will review your request and share payment details via email.</div>
          <input value={reqName} onChange={e=>setReqName(e.target.value)} placeholder="Your full name" style={{width:"100%",padding:"9px 12px",fontSize:"13px",borderRadius:"8px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box",marginBottom:"10px",outline:"none"}} />
          <input value={reqEmail} onChange={e=>setReqEmail(e.target.value)} placeholder="Your email address" style={{width:"100%",padding:"9px 12px",fontSize:"13px",borderRadius:"8px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box",marginBottom:"16px",outline:"none"}} />
          <div style={{background:"var(--color-background-secondary)",borderRadius:"8px",padding:"12px",fontSize:"12px",color:"var(--color-text-secondary)",marginBottom:"16px",lineHeight:1.7}}>
            After submitting, the admin will contact you at your email with payment instructions.<br/>
            <span style={{fontWeight:500,color:"var(--color-text-primary)"}}>Admin contact: {ADMIN_EMAIL}</span>
          </div>
          <button onClick={submitRequest} style={{width:"100%",background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"none",borderRadius:"8px",padding:"10px",fontSize:"14px",cursor:"pointer",fontWeight:500,marginBottom:"8px"}}>Submit Request</button>
          <button onClick={()=>setView("app")} style={{width:"100%",background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"10px",fontSize:"13px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Cancel</button>
        </> : <>
          <div style={{textAlign:"center",padding:"10px 0"}}>
            <div style={{fontSize:"36px",marginBottom:"12px"}}>✅</div>
            <div style={{fontSize:"16px",fontWeight:500,marginBottom:"8px",color:"var(--color-text-primary)"}}>Request Submitted!</div>
            <div style={{fontSize:"13px",color:"var(--color-text-secondary)",lineHeight:1.7,marginBottom:"20px"}}>The admin will review your request and email you at <strong>{reqEmail}</strong> with payment instructions.<br/><br/>Once you've paid, come back and enter your email below to unlock premium access.</div>
            <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:"16px",marginBottom:"8px"}}>
              <div style={{fontSize:"12px",color:"var(--color-text-tertiary)",marginBottom:"8px"}}>Already paid? Enter your email to verify access:</div>
              <input value={premiumEmail} onChange={e=>setPremiumEmail(e.target.value)} placeholder="Your email" style={{width:"100%",padding:"8px 12px",fontSize:"13px",borderRadius:"8px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box",marginBottom:"8px",outline:"none"}} />
              {premiumError && <div style={{fontSize:"12px",color:"var(--color-text-danger)",marginBottom:"6px"}}>{premiumError}</div>}
              <button onClick={handlePremiumAccess} style={{width:"100%",background:"var(--color-background-success)",color:"var(--color-text-success)",border:"none",borderRadius:"8px",padding:"9px",fontSize:"13px",cursor:"pointer",fontWeight:500,marginBottom:"8px"}}>Verify & Unlock</button>
            </div>
            <button onClick={()=>setView("app")} style={{width:"100%",background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"9px",fontSize:"13px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Back to Notes</button>
          </div>
        </>}
      </div>
    </div>
  );

  // Admin requests panel
  if (view === "adminRequests") return (
    <div style={{display:"flex",flexDirection:"column",height:"600px",background:"var(--color-background-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden"}}>
      <div style={{padding:"14px 20px",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",gap:"12px"}}>
        <button onClick={()=>setView("app")} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",color:"var(--color-text-secondary)"}}>← Back</button>
        <span style={{fontWeight:500,fontSize:"15px",color:"var(--color-text-primary)"}}>Premium Membership Requests</span>
        <span style={{marginLeft:"auto",fontSize:"12px",color:"var(--color-text-tertiary)"}}>{requests.filter(r=>r.status==="pending").length} pending</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {requests.length === 0 && <div style={{textAlign:"center",color:"var(--color-text-tertiary)",marginTop:"60px",fontSize:"14px"}}>No requests yet.</div>}
        {requests.map(r => (
          <div key={r.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
              <div>
                <div style={{fontWeight:500,fontSize:"14px",color:"var(--color-text-primary)"}}>{r.name}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{r.email}</div>
              </div>
              <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                {r.status === "pending" && <>
                  <span style={{fontSize:"11px",background:"var(--color-background-warning)",color:"var(--color-text-warning)",padding:"3px 10px",borderRadius:"10px"}}>Pending</span>
                  <button onClick={()=>approveRequest(r.id)} style={{background:"var(--color-background-success)",color:"var(--color-text-success)",border:"none",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>Approve</button>
                  <button onClick={()=>rejectRequest(r.id)} style={{background:"var(--color-background-danger)",color:"var(--color-text-danger)",border:"none",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer"}}>Reject</button>
                </>}
                {r.status === "approved" && <span style={{fontSize:"11px",background:"var(--color-background-success)",color:"var(--color-text-success)",padding:"3px 10px",borderRadius:"10px"}}>Approved ✓</span>}
                {r.status === "rejected" && <span style={{fontSize:"11px",background:"var(--color-background-danger)",color:"var(--color-text-danger)",padding:"3px 10px",borderRadius:"10px"}}>Rejected</span>}
              </div>
            </div>
            {r.status === "pending" && (
              <div style={{marginTop:"10px",fontSize:"12px",color:"var(--color-text-tertiary)",background:"var(--color-background-secondary)",borderRadius:"6px",padding:"8px 10px",lineHeight:1.6}}>
                Send payment details to <strong style={{color:"var(--color-text-primary)"}}>{r.email}</strong> from {ADMIN_EMAIL}. Once paid, approve to grant access.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div style={{display:"flex",height:"600px",fontFamily:"var(--font-sans)",background:"var(--color-background-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden",border:"0.5px solid var(--color-border-tertiary)"}}>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{width:"220px",minWidth:"220px",background:"var(--color-background-primary)",borderRight:"0.5px solid var(--color-border-tertiary)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 12px 8px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <span style={{fontWeight:500,fontSize:"14px",color:"var(--color-text-primary)"}}>Study Notes</span>
              <div style={{display:"flex",gap:"4px"}}>
                {isAdmin && <button onClick={()=>setView("adminRequests")} style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"none",borderRadius:"5px",padding:"3px 7px",fontSize:"10px",cursor:"pointer",fontWeight:500}} title="View requests">Requests{requests.filter(r=>r.status==="pending").length>0?` (${requests.filter(r=>r.status==="pending").length})`:""}</button>}
                {isAdmin && <button onClick={newNote} style={{background:"var(--color-background-info)",color:"var(--color-text-info)",border:"none",borderRadius:"5px",padding:"3px 7px",fontSize:"10px",cursor:"pointer",fontWeight:500}}>+</button>}
              </div>
            </div>
            {/* Tabs */}
            <div style={{display:"flex",borderRadius:"6px",overflow:"hidden",border:"0.5px solid var(--color-border-secondary)",marginBottom:"8px"}}>
              <button onClick={()=>{setTab("free");setActiveNote(notes.find(n=>!n.premium)||null);}} style={{flex:1,padding:"5px",fontSize:"11px",fontWeight:tab==="free"?500:400,background:tab==="free"?"var(--color-background-secondary)":"transparent",border:"none",cursor:"pointer",color:tab==="free"?"var(--color-text-primary)":"var(--color-text-secondary)"}}>Free</button>
              <button onClick={()=>{setTab("premium");}} style={{flex:1,padding:"5px",fontSize:"11px",fontWeight:tab==="premium"?500:400,background:tab==="premium"?"var(--color-background-warning)":"transparent",border:"none",cursor:"pointer",color:tab==="premium"?"var(--color-text-warning)":"var(--color-text-secondary)"}}>⭐ Premium</button>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"5px 8px",fontSize:"12px",borderRadius:"6px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box",outline:"none"}} />
          </div>
          <div style={{overflowY:"auto",flex:1,padding:"6px 0"}}>
            {subjects.map(subj => (
              <div key={subj}>
                <div style={{padding:"4px 12px",fontSize:"10px",fontWeight:500,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{subj}</div>
                {visibleNotes.filter(n=>n.subject===subj).map(note => {
                  const locked = !canAccess(note);
                  return (
                    <div key={note.id} onClick={()=>locked?null:selectNote(note)} style={{padding:"7px 12px",cursor:locked?"not-allowed":"pointer",background:activeNote?.id===note.id?"var(--color-background-secondary)":"transparent",borderLeft:activeNote?.id===note.id?"2px solid var(--color-border-info)":"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"4px",opacity:locked?0.6:1}}>
                      <div style={{overflow:"hidden",flex:1}}>
                        <div style={{fontSize:"12px",fontWeight:activeNote?.id===note.id?500:400,color:"var(--color-text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{locked?"🔒 ":""}{note.title}</div>
                        <div style={{fontSize:"10px",color:"var(--color-text-tertiary)"}}>{note.createdAt}</div>
                      </div>
                      {isAdmin && <button onClick={e=>{e.stopPropagation();deleteNote(note.id);}} style={{background:"none",border:"none",color:"var(--color-text-tertiary)",cursor:"pointer",fontSize:"13px",padding:"1px 3px",flexShrink:0}}>×</button>}
                    </div>
                  );
                })}
              </div>
            ))}
            {visibleNotes.length===0 && tab==="premium" && !isAdmin && !isPremium && (
              <div style={{padding:"16px 12px",textAlign:"center"}}>
                <div style={{fontSize:"24px",marginBottom:"8px"}}>⭐</div>
                <div style={{fontSize:"12px",fontWeight:500,color:"var(--color-text-primary)",marginBottom:"4px"}}>Premium Notes</div>
                <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",marginBottom:"10px",lineHeight:1.5}}>Exclusive notes for premium members only.</div>
                <button onClick={()=>setView("premiumRequest")} style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"none",borderRadius:"6px",padding:"7px 12px",fontSize:"11px",cursor:"pointer",fontWeight:500,width:"100%"}}>Request Access</button>
              </div>
            )}
            {visibleNotes.length===0 && tab==="free" && <div style={{padding:"16px 12px",fontSize:"12px",color:"var(--color-text-tertiary)",textAlign:"center"}}>No free notes found.</div>}
          </div>

          {/* Bottom bar */}
          <div style={{padding:"8px 12px",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {!isAdmin && !isPremium && (
              <>
                <button onClick={()=>setView("adminLogin")} style={{flex:1,background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"5px",fontSize:"10px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Admin</button>
                <button onClick={()=>{setReqSubmitted(false);setReqName("");setReqEmail("");setView("premiumRequest");}} style={{flex:1,background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"none",borderRadius:"6px",padding:"5px",fontSize:"10px",cursor:"pointer",fontWeight:500}}>⭐ Get Premium</button>
              </>
            )}
            {isAdmin && <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",flex:1,textAlign:"center",alignSelf:"center"}}>Admin mode <button onClick={()=>{setIsAdmin(false);setTab("free");}} style={{background:"none",border:"none",color:"var(--color-text-danger)",cursor:"pointer",fontSize:"10px"}}>Logout</button></div>}
            {isPremium && !isAdmin && <div style={{fontSize:"11px",color:"var(--color-text-warning)",flex:1,textAlign:"center",alignSelf:"center"}}>⭐ Premium member</div>}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {activeNote && canAccess(activeNote) ? (
          <>
            {/* Toolbar */}
            <div style={{padding:"8px 14px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
              <button onClick={()=>setSidebarOpen(v=>!v)} style={{background:"none",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer",color:"var(--color-text-secondary)"}}>{sidebarOpen?"◀":"▶"}</button>
              {!editing ? (
                <>
                  {(isAdmin) && <button onClick={startEdit} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer",color:"var(--color-text-primary)"}}>✏ Edit</button>}
                  <div style={{display:"flex",alignItems:"center",gap:"3px"}}>
                    <span style={{fontSize:"10px",color:"var(--color-text-tertiary)"}}>Highlight:</span>
                    {COLORS.map((c,i)=><div key={i} onClick={()=>setActiveColor(i)} style={{width:"13px",height:"13px",borderRadius:"50%",background:c,cursor:"pointer",border:activeColor===i?"2px solid var(--color-text-primary)":"2px solid transparent"}} />)}
                    <button onClick={handleHighlight} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"5px",padding:"3px 6px",fontSize:"10px",cursor:"pointer",color:"var(--color-text-primary)"}}>Apply</button>
                    <button onClick={handleAnnotate} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"5px",padding:"3px 6px",fontSize:"10px",cursor:"pointer",color:"var(--color-text-primary)"}}>+ Annotate</button>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:"5px"}}>
                    {(isPremium||isAdmin) && <button onClick={()=>{setShowAI(v=>!v);}} style={{background:showAI?"var(--color-background-info)":"none",color:showAI?"var(--color-text-info)":"var(--color-text-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer"}}>AI Chat</button>}
                    <div style={{position:"relative"}}>
                      <button onClick={()=>setShowExport(v=>!v)} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer",color:"var(--color-text-primary)"}}>Export ▾</button>
                      {showExport && (
                        <div style={{position:"absolute",right:0,top:"100%",marginTop:"4px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"4px",zIndex:10,minWidth:"130px"}}>
                          <div onClick={exportNote} style={{padding:"7px 10px",fontSize:"12px",cursor:"pointer",borderRadius:"5px",color:"var(--color-text-primary)"}} onMouseEnter={e=>e.target.style.background="var(--color-background-secondary)"} onMouseLeave={e=>e.target.style.background="none"}>Download .txt</div>
                          <div onClick={copyNote} style={{padding:"7px 10px",fontSize:"12px",cursor:"pointer",borderRadius:"5px",color:"var(--color-text-primary)"}} onMouseEnter={e=>e.target.style.background="var(--color-background-secondary)"} onMouseLeave={e=>e.target.style.background="none"}>Copy text</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={saveEdit} style={{background:"var(--color-background-success)",color:"var(--color-text-success)",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"11px",cursor:"pointer",fontWeight:500}}>Save</button>
                  <button onClick={()=>setEditing(false)} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Cancel</button>
                  <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"11px",color:"var(--color-text-secondary)",marginLeft:"auto",cursor:"pointer"}}>
                    <input type="checkbox" checked={editPremium} onChange={e=>setEditPremium(e.target.checked)} />
                    Premium note
                  </label>
                </>
              )}
            </div>

            <div style={{flex:1,display:"flex",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
                {editing ? (
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{fontSize:"18px",fontWeight:500,border:"none",borderBottom:"0.5px solid var(--color-border-secondary)",background:"transparent",color:"var(--color-text-primary)",padding:"4px 0",outline:"none"}} />
                    <input value={editSubject} onChange={e=>setEditSubject(e.target.value)} placeholder="Subject" style={{fontSize:"12px",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"5px 8px",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",outline:"none",width:"150px"}} />
                    <textarea value={editContent} onChange={e=>setEditContent(e.target.value)} style={{minHeight:"340px",fontSize:"13px",lineHeight:1.8,border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"10px",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",resize:"vertical",outline:"none",fontFamily:"var(--font-sans)"}} />
                  </div>
                ) : (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                      <h2 style={{margin:0,fontSize:"18px",fontWeight:500,color:"var(--color-text-primary)"}}>{activeNote.title}</h2>
                      {activeNote.premium && <span style={{fontSize:"10px",background:"var(--color-background-warning)",color:"var(--color-text-warning)",padding:"2px 8px",borderRadius:"10px",fontWeight:500}}>⭐ Premium</span>}
                    </div>
                    <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",marginBottom:"14px"}}>{activeNote.subject} · {activeNote.createdAt}</div>
                    <div style={{fontSize:"13px",lineHeight:1.9,color:"var(--color-text-primary)",userSelect:"text"}} dangerouslySetInnerHTML={{__html:getHighlightedContent(activeNote.content,activeNote.id)}} />
                  </div>
                )}
              </div>

              {/* AI Chat */}
              {showAI && !editing && (
                <div style={{width:"260px",borderLeft:"0.5px solid var(--color-border-tertiary)",display:"flex",flexDirection:"column",background:"var(--color-background-primary)"}}>
                  <div style={{padding:"10px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)",fontWeight:500,fontSize:"12px",color:"var(--color-text-primary)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    AI Assistant
                    <button onClick={()=>setAiMessages([])} style={{background:"none",border:"none",fontSize:"10px",color:"var(--color-text-tertiary)",cursor:"pointer"}}>Clear</button>
                  </div>
                  <div style={{flex:1,overflowY:"auto",padding:"10px",display:"flex",flexDirection:"column",gap:"6px"}}>
                    {aiMessages.length===0 && (
                      <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",textAlign:"center",marginTop:"16px"}}>
                        Ask about this note:
                        <div style={{display:"flex",flexDirection:"column",gap:"5px",marginTop:"8px"}}>
                          {["Summarize this","Quiz me","Key points"].map(s=>(
                            <button key={s} onClick={()=>setAiInput(s)} style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"5px",padding:"5px 8px",fontSize:"10px",cursor:"pointer",color:"var(--color-text-secondary)",textAlign:"left"}}>{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiMessages.map((m,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                        <div style={{maxWidth:"92%",padding:"6px 10px",borderRadius:"8px",fontSize:"11px",lineHeight:1.6,background:m.role==="user"?"var(--color-background-info)":"var(--color-background-secondary)",color:m.role==="user"?"var(--color-text-info)":"var(--color-text-primary)"}}>{m.content}</div>
                      </div>
                    ))}
                    {aiLoading && <div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"6px 10px",borderRadius:"8px",fontSize:"11px",background:"var(--color-background-secondary)",color:"var(--color-text-tertiary)"}}>Thinking...</div></div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{padding:"8px",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:"5px"}}>
                    <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAI()} placeholder="Ask..." style={{flex:1,padding:"6px 8px",fontSize:"11px",borderRadius:"6px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",outline:"none"}} />
                    <button onClick={sendAI} disabled={aiLoading} style={{background:"var(--color-background-info)",color:"var(--color-text-info)",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"11px",cursor:"pointer",fontWeight:500}}>→</button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px",padding:"20px",textAlign:"center"}}>
            <button onClick={()=>setSidebarOpen(v=>!v)} style={{position:"absolute",top:"12px",left:"12px",background:"none",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer",color:"var(--color-text-secondary)"}}>{sidebarOpen?"◀":"▶"}</button>
            {tab==="premium" && !isPremium && !isAdmin ? (
              <>
                <div style={{fontSize:"40px"}}>⭐</div>
                <div style={{fontSize:"16px",fontWeight:500,color:"var(--color-text-primary)"}}>Premium Notes</div>
                <div style={{fontSize:"13px",color:"var(--color-text-secondary)",maxWidth:"260px",lineHeight:1.6}}>These notes are for premium members only. Request access and the admin will send you payment details.</div>
                <button onClick={()=>{setReqSubmitted(false);setReqName("");setReqEmail("");setView("premiumRequest");}} style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"none",borderRadius:"8px",padding:"10px 24px",fontSize:"13px",cursor:"pointer",fontWeight:500}}>⭐ Request Premium Access</button>
                <div style={{fontSize:"11px",color:"var(--color-text-tertiary)"}}>Already paid? <span style={{cursor:"pointer",color:"var(--color-text-info)",textDecoration:"underline"}} onClick={()=>{setReqSubmitted(true);setView("premiumRequest");}}>Verify your access</span></div>
              </>
            ) : (
              <>
                <div style={{fontSize:"32px"}}>📒</div>
                <div style={{fontSize:"13px",color:"var(--color-text-tertiary)"}}>Select a note to get started</div>
                {isAdmin && <button onClick={newNote} style={{background:"var(--color-background-info)",color:"var(--color-text-info)",border:"none",borderRadius:"8px",padding:"8px 18px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>+ Create note</button>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Annotation modal */}
      {showAnnotation && (
        <div style={{position:"fixed",inset:0,background:"#0004",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"20px",width:"300px",border:"0.5px solid var(--color-border-secondary)"}}>
            <div style={{fontWeight:500,marginBottom:"8px",fontSize:"13px"}}>Add annotation</div>
            <div style={{fontSize:"11px",color:"var(--color-text-secondary)",marginBottom:"8px",background:"var(--color-background-secondary)",padding:"6px 8px",borderRadius:"6px"}}>"{showAnnotation.slice(0,60)}{showAnnotation.length>60?"...":""}"</div>
            <textarea value={annotInput} onChange={e=>setAnnotInput(e.target.value)} placeholder="Your note..." style={{width:"100%",padding:"7px 8px",fontSize:"12px",borderRadius:"6px",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",resize:"none",height:"70px",outline:"none",boxSizing:"border-box"}} autoFocus />
            <div style={{display:"flex",gap:"6px",marginTop:"8px",justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAnnotation(null)} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",color:"var(--color-text-secondary)"}}>Cancel</button>
              <button onClick={saveAnnotation} style={{background:"var(--color-background-info)",color:"var(--color-text-info)",border:"none",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
