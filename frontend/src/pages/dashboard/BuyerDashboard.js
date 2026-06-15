import React,{useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {orderService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

const SS={PENDING:{bg:'#fff8e1',color:'#f57f17',label:'⏳ Pending'},CONFIRMED:{bg:'#e3f2fd',color:'#1565c0',label:'✅ Confirmed'},SHIPPED:{bg:'#f3e5f5',color:'#7b1fa2',label:'🚚 Shipped'},DELIVERED:{bg:'#e8f5e9',color:'#2e7d32',label:'📦 Delivered'},CANCELLED:{bg:'#ffebee',color:'#c62828',label:'❌ Cancelled'}};
const SB={SMALL:{bg:'#e8f5e9',color:'#2e7d32'},MEDIUM:{bg:'#fff8e1',color:'#f57f17'},LARGE:{bg:'#e3f2fd',color:'#1565c0'}};
const G='#2d6a4f';

export default function BuyerDashboard() {
  const {user,logout}=useAuth(); const navigate=useNavigate();
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true); const [expanded,setExpanded]=useState(null);

  useEffect(()=>{ if(!user){navigate('/login');return;} orderService.myOrders().then(({data})=>setOrders(data)).catch(()=>setOrders([])).finally(()=>setLoading(false)); },[user]);

  const stats={total:orders.length,pending:orders.filter(o=>o.status==='PENDING').length,delivered:orders.filter(o=>o.status==='DELIVERED').length,spent:orders.filter(o=>o.status!=='CANCELLED').reduce((s,o)=>s+Number(o.totalAmount),0)};

  return (
    <div style={{fontFamily:'system-ui,sans-serif',background:'#f5f7f5',minHeight:'100vh'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 28px',background:G,color:'#fff'}}>
        <span style={{fontSize:19,fontWeight:700}}>🌾 KisanConnect</span>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:12,opacity:.85}}>👤 {user?.name}</span>
          <button style={nb} onClick={()=>navigate('/products')}>Browse Products</button>
          <button style={{...nb,background:'#c0392b',border:'none'}} onClick={()=>{logout();navigate('/login');}}>Logout</button>
        </div>
      </div>
      <div style={{maxWidth:900,margin:'0 auto',padding:28}}>
        <h2 style={{margin:'0 0 20px',fontSize:20,color:'#1a1a1a'}}>My Orders</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
          {[{label:'Total Orders',value:stats.total,icon:'📋',bg:'#f3f4f6'},{label:'Pending',value:stats.pending,icon:'⏳',bg:'#fff8e1'},{label:'Delivered',value:stats.delivered,icon:'📦',bg:'#e8f5e9'},{label:'Total Spent',value:'₹'+stats.spent.toFixed(0),icon:'💰',bg:'#e3f2fd'}].map(st=>(
            <div key={st.label} style={{borderRadius:10,padding:'15px 16px',display:'flex',flexDirection:'column',gap:3,border:'1px solid rgba(0,0,0,.06)',background:st.bg}}>
              <span style={{fontSize:19}}>{st.icon}</span><span style={{fontSize:24,fontWeight:700,color:'#1a1a1a'}}>{st.value}</span><span style={{fontSize:11,color:'#666'}}>{st.label}</span>
            </div>
          ))}
        </div>
        {loading&&<div style={{textAlign:'center',color:'#aaa',padding:40}}>Loading orders…</div>}
        {!loading&&!orders.length&&<div style={{textAlign:'center',padding:40,color:'#888'}}><p>No orders yet.</p><button style={{marginTop:10,padding:'9px 18px',background:G,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontFamily:'inherit'}} onClick={()=>navigate('/products')}>Browse Marketplace →</button></div>}
        {orders.map(order=>{const st=SS[order.status]||{}; const isOpen=expanded===order.id; return(
          <div key={order.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e8e8e8',marginBottom:10,overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 16px',cursor:'pointer',userSelect:'none'}} onClick={()=>setExpanded(isOpen?null:order.id)}>
              <div><div style={{fontWeight:700,fontSize:13,fontFamily:'monospace',color:'#222'}}>#{order.id.slice(0,8).toUpperCase()}</div><div style={{fontSize:11,color:'#aaa'}}>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span>
                <span style={{fontWeight:700,fontSize:14,color:G}}>₹{Number(order.totalAmount).toFixed(2)}</span>
                <span style={{fontSize:10,color:'#aaa'}}>{isOpen?'▲':'▼'}</span>
              </div>
            </div>
            {isOpen&&<div style={{borderTop:'1px solid #f0f0f0',padding:'12px 16px'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>{['Product ID','Scale','Qty','Unit Price','Line Total'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 8px',fontWeight:600,color:'#555',fontSize:10,borderBottom:'1px solid #f0f0f0'}}>{h}</th>)}</tr></thead>
                <tbody>{order.items.map(item=>{const sb=SB[item.scale]||{}; return(
                  <tr key={item.id}>
                    <td style={{padding:'6px 8px',borderBottom:'1px solid #f9f9f9'}}><code style={{fontFamily:'monospace',fontSize:11,background:'#f5f5f5',padding:'1px 5px',borderRadius:3}}>{item.productId.slice(0,8)}</code></td>
                    <td style={{padding:'6px 8px',borderBottom:'1px solid #f9f9f9'}}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,background:sb.bg,color:sb.color}}>{item.scale}</span></td>
                    <td style={{padding:'6px 8px',borderBottom:'1px solid #f9f9f9'}}>{item.quantity}</td>
                    <td style={{padding:'6px 8px',borderBottom:'1px solid #f9f9f9'}}>₹{item.unitPrice}</td>
                    <td style={{padding:'6px 8px',borderBottom:'1px solid #f9f9f9'}}>₹{Number(item.lineTotal).toFixed(2)}</td>
                  </tr>
                );})}
                </tbody>
              </table>
              <div style={{textAlign:'right',paddingTop:8,fontSize:13,color:G,fontWeight:700}}>Order Total: ₹{Number(order.totalAmount).toFixed(2)}</div>
            </div>}
          </div>
        );})}
      </div>
    </div>
  );
}
const nb={padding:'6px 13px',background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:7,cursor:'pointer',fontSize:12,fontFamily:'inherit'};
