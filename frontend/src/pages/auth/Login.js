import React,{useState} from 'react';
import {useNavigate,Link} from 'react-router-dom';
import {authService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

export default function Login() {
  const {login} = useAuth(); const navigate = useNavigate();
  const [form,setForm] = useState({email:'',password:''});
  const [error,setError] = useState(''); const [loading,setLoading] = useState(false);
  const handle = e => setForm({...form,[e.target.name]:e.target.value});
  // Seeded demo users use the password 'password' (matches DB seed hashes)
  const fill = role => setForm(role==='farmer'?{email:'ravi@farm.com',password:'password'}:{email:'priya@buyer.com',password:'password'});

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const {data} = await authService.login(form); login(data);
      navigate(data.role==='FARMER'?'/dashboard/farmer':'/dashboard/buyer');
    } catch(err) { setError(err.response?.data?.message||'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>🌾 KisanConnect</h1>
        <h2 style={s.sub}>Sign In</h2>
        <div style={s.demoRow}>
          <span style={s.demoLbl}>Demo:</span>
          <button style={s.demoBtn} onClick={()=>fill('farmer')}>🌱 Farmer</button>
          <button style={s.demoBtn} onClick={()=>fill('buyer')}>🛒 Buyer</button>
        </div>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>Email</label>
          <input style={s.input} name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required/>
          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required/>
          <button style={s.btn} type="submit" disabled={loading}>{loading?'Signing in…':'Login'}</button>
        </form>
        <p style={s.foot}>New here? <Link to="/register" style={s.link}>Create account</Link></p>
      </div>
    </div>
  );
}
const G='#2d6a4f';
const s={page:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f7f0',padding:16},card:{background:'#fff',borderRadius:12,padding:36,width:'100%',maxWidth:400,boxShadow:'0 4px 24px rgba(0,0,0,.08)'},logo:{textAlign:'center',fontSize:28,margin:'0 0 4px',color:G},sub:{textAlign:'center',fontSize:17,color:'#555',margin:'0 0 16px',fontWeight:400},demoRow:{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'7px 10px',background:'#f8fdf9',borderRadius:8,border:'1px solid #d1e8da'},demoLbl:{fontSize:12,color:'#888'},demoBtn:{padding:'4px 12px',fontSize:12,border:'1px solid #b7d9c4',borderRadius:6,cursor:'pointer',background:'#fff',color:G,fontFamily:'inherit'},label:{display:'block',fontSize:12,color:'#444',marginBottom:4,marginTop:12,fontWeight:500},input:{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'},err:{background:'#fff0f0',border:'1px solid #f5c6c6',color:'#c0392b',borderRadius:8,padding:'9px 12px',marginBottom:10,fontSize:12},btn:{width:'100%',marginTop:18,padding:'11px 0',background:G,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},foot:{textAlign:'center',marginTop:14,fontSize:12,color:'#888'},link:{color:G,textDecoration:'none',fontWeight:600}};
