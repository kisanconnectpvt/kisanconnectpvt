import React,{useState} from 'react';
import {useNavigate,Link} from 'react-router-dom';
import {authService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

export default function Register() {
  const {login} = useAuth(); const navigate = useNavigate();
  const [form,setForm] = useState({name:'',email:'',phone:'',addressLine1:'',addressLine2:'',city:'',state:'',postalCode:'',password:'',role:'BUYER'});
  const [error,setError] = useState(''); const [loading,setLoading] = useState(false);
  const handle = e => setForm({...form,[e.target.name]:e.target.value});

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const {data} = await authService.register(form); login(data);
      navigate(data.role==='FARMER'?'/dashboard/farmer':'/dashboard/buyer');
    } catch(err) { setError(err.response?.data?.message||'Registration failed.'); }
    finally { setLoading(false); }
  };

  const G='#2d6a4f';
  const s={page:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f7f0',padding:16},card:{background:'#fff',borderRadius:12,padding:36,width:'100%',maxWidth:420,boxShadow:'0 4px 24px rgba(0,0,0,.08)'},logo:{textAlign:'center',fontSize:28,margin:'0 0 4px',color:G},sub:{textAlign:'center',fontSize:17,color:'#555',margin:'0 0 20px',fontWeight:400},label:{display:'block',fontSize:12,color:'#444',marginBottom:4,marginTop:12,fontWeight:500},input:{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'},err:{background:'#fff0f0',border:'1px solid #f5c6c6',color:'#c0392b',borderRadius:8,padding:'9px 12px',marginBottom:10,fontSize:12},roleRow:{display:'flex',gap:10,margin:'6px 0 0'},roleBtn:{flex:1,padding:'9px 0',border:'2px solid #ddd',borderRadius:8,cursor:'pointer',background:'#fff',fontSize:13,color:'#555',fontFamily:'inherit'},roleActive:{borderColor:G,background:'#e8f5ee',color:G,fontWeight:600},btn:{width:'100%',marginTop:18,padding:'11px 0',background:G,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},foot:{textAlign:'center',marginTop:14,fontSize:12,color:'#888'},link:{color:G,textDecoration:'none',fontWeight:600}};

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>🌾 KisanConnect</h1>
        <h2 style={s.sub}>Create Account</h2>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} name="name" value={form.name} onChange={handle} placeholder="Your full name" required/>
          <label style={s.label}>Email</label>
          <input style={s.input} name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required/>
          <label style={s.label}>Phone</label>
          <input style={s.input} name="phone" value={form.phone} onChange={handle} placeholder="10-digit mobile number"/>
          <div style={{fontSize:12,color:'#666',margin:'10px 0 0'}}>Address is optional during signup. Farmers need it when listing products and buyers need it when placing orders.</div>
          <label style={s.label}>Address line 1</label>
          <input style={s.input} name="addressLine1" value={form.addressLine1} onChange={handle} placeholder="House number, street, village"/>
          <label style={s.label}>Address line 2</label>
          <input style={s.input} name="addressLine2" value={form.addressLine2} onChange={handle} placeholder="Colony / Landmark (optional)"/>
          <label style={s.label}>City</label>
          <input style={s.input} name="city" value={form.city} onChange={handle} placeholder="City"/>
          <label style={s.label}>State</label>
          <input style={s.input} name="state" value={form.state} onChange={handle} placeholder="State"/>
          <label style={s.label}>Postal code</label>
          <input style={s.input} name="postalCode" value={form.postalCode} onChange={handle} placeholder="PIN code"/>
          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handle} placeholder="Min 6 characters" required minLength={6}/>
          <label style={s.label}>I am a</label>
          <div style={s.roleRow}>
            {['FARMER','BUYER'].map(r=>(
              <button key={r} type="button"
                style={{...s.roleBtn,...(form.role===r?s.roleActive:{})}}
                onClick={()=>setForm({...form,role:r})}>
                {r==='FARMER'?'🌱 Farmer':'🛒 Buyer'}
              </button>
            ))}
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading?'Creating…':'Register'}</button>
        </form>
        <p style={s.foot}>Already have an account? <Link to="/login" style={s.link}>Login</Link></p>
      </div>
    </div>
  );
}
