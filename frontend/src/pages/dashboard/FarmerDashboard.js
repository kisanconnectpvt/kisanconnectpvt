import React,{useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {productService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

const SC={SMALL:{bg:'#e8f5e9',color:'#2e7d32',label:'🌱 Small'},MEDIUM:{bg:'#fff8e1',color:'#f57f17',label:'🌿 Medium'},LARGE:{bg:'#e3f2fd',color:'#1565c0',label:'🌾 Large'}};
const G='#2d6a4f';

export default function FarmerDashboard() {
  const {user,logout}=useAuth(); const navigate=useNavigate();
  const [products,setProducts]=useState([]); const [loading,setLoading]=useState(true);
  const [deleting,setDeleting]=useState(null); const [msg,setMsg]=useState('');

  useEffect(()=>{ if(!user){navigate('/login');return;} loadProducts(); },[user]);

  const loadProducts=async()=>{
    setLoading(true);
    try { const {data}=await productService.listByFarmer(user.userId); setProducts(data); }
    catch { setProducts([]); } finally { setLoading(false); }
  };

  const handleDelete=async id=>{
    if(!window.confirm('Remove this product listing?')) return;
    setDeleting(id);
    try { await productService.remove(id); setMsg('Product removed.'); loadProducts(); }
    catch(e){ setMsg('Failed: '+(e.response?.data?.message||'error')); }
    finally { setDeleting(null); }
  };

  const stats={total:products.length,small:products.filter(p=>p.scale==='SMALL').length,medium:products.filter(p=>p.scale==='MEDIUM').length,large:products.filter(p=>p.scale==='LARGE').length};

  return (
    <div style={{fontFamily:'system-ui,sans-serif',background:'#f5f7f5',minHeight:'100vh'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 28px',background:G,color:'#fff'}}>
        <span style={{fontSize:19,fontWeight:700}}>🌾 KisanConnect</span>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:12,opacity:.85}}>👤 {user?.name}</span>
          <button style={nb} onClick={()=>navigate('/products')}>Marketplace</button>
          <button style={{...nb,background:'#c0392b',border:'none'}} onClick={()=>{logout();navigate('/login');}}>Logout</button>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
          <div><h2 style={{margin:0,fontSize:20,color:'#1a1a1a'}}>My Farm Dashboard</h2><p style={{margin:'3px 0 0',color:'#888',fontSize:12}}>Manage your product listings</p></div>
          <button style={{padding:'9px 18px',background:G,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}} onClick={()=>navigate('/products/new')}>+ Add Product</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
          {[{label:'Total Listings',value:stats.total,icon:'📦',bg:'#f3f4f6'},{label:'Small Scale',value:stats.small,icon:'🌱',bg:'#e8f5e9'},{label:'Medium Scale',value:stats.medium,icon:'🌿',bg:'#fff8e1'},{label:'Large Scale',value:stats.large,icon:'🌾',bg:'#e3f2fd'}].map(st=>(
            <div key={st.label} style={{borderRadius:10,padding:'16px 18px',display:'flex',flexDirection:'column',gap:3,border:'1px solid rgba(0,0,0,.06)',background:st.bg}}>
              <span style={{fontSize:20}}>{st.icon}</span><span style={{fontSize:26,fontWeight:700,color:'#1a1a1a'}}>{st.value}</span><span style={{fontSize:11,color:'#666'}}>{st.label}</span>
            </div>
          ))}
        </div>
        {msg&&<div style={{padding:'9px 14px',background:'#e8f5e9',borderRadius:8,color:G,fontSize:12,marginBottom:14}}>{msg}</div>}
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',border:'1px solid #e8e8e8'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#f9fafb'}}>
              {['Product','Scale','Category','Price','Stock','Status','Actions'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'#555',borderBottom:'1px solid #eee',whiteSpace:'nowrap'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={7} style={{padding:'28px',textAlign:'center',color:'#aaa',fontSize:13}}>Loading…</td></tr>}
              {!loading&&!products.length&&<tr><td colSpan={7} style={{padding:'28px',textAlign:'center',color:'#aaa',fontSize:13}}>No products yet. <button style={{background:'none',border:'none',color:G,cursor:'pointer',fontSize:13,fontWeight:600,textDecoration:'underline'}} onClick={()=>navigate('/products/new')}>Add your first product →</button></td></tr>}
              {products.map(p=>{const sc=SC[p.scale]||{}; return(
                <tr key={p.id} style={{borderBottom:'1px solid #f3f3f3'}}>
                  <td style={{padding:'11px 14px',fontSize:13}}><div style={{fontWeight:600,color:'#222'}}>{p.name}</div><div style={{fontSize:10,color:'#aaa',marginTop:1}}>{p.description?.slice(0,50)||'—'}</div></td>
                  <td style={{padding:'11px 14px'}}><span style={{display:'inline-block',padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'#333'}}>{p.category||'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'#333'}}>₹{p.price}/{p.unit}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'#333'}}>{p.stockQty} {p.unit}</td>
                  <td style={{padding:'11px 14px'}}><span style={{display:'inline-block',padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,background:'#e8f5e9',color:'#2e7d32'}}>{p.status}</span></td>
                  <td style={{padding:'11px 14px'}}>
                    <button style={{padding:'4px 10px',fontSize:11,border:'1px solid #ddd',borderRadius:6,cursor:'pointer',background:'#fff',marginRight:6,fontFamily:'inherit'}} onClick={()=>navigate('/products/edit/'+p.id)}>Edit</button>
                    <button style={{padding:'4px 10px',fontSize:11,border:'1px solid #f5c6c6',borderRadius:6,cursor:'pointer',background:'#fff0f0',color:'#c0392b',fontFamily:'inherit'}} disabled={deleting===p.id} onClick={()=>handleDelete(p.id)}>{deleting===p.id?'…':'Remove'}</button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const nb={padding:'6px 13px',background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:7,cursor:'pointer',fontSize:12,fontFamily:'inherit'};
