import React,{useState,useEffect,useCallback} from 'react';
import {productService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import {useNavigate} from 'react-router-dom';

const SCALES=['ALL','SMALL','MEDIUM','LARGE'];
const SI={SMALL:{label:'Small',emoji:'🌱',color:'#e8f5e9',border:'#81c784'},MEDIUM:{label:'Medium',emoji:'🌿',color:'#fff8e1',border:'#ffb300'},LARGE:{label:'Large',emoji:'🌾',color:'#e3f2fd',border:'#42a5f5'}};
const G='#2d6a4f';

export default function Products() {
  const {user,isBuyer,isFarmer}=useAuth(); const navigate=useNavigate();
  const [products,setProducts]=useState([]); const [scale,setScale]=useState('ALL');
  const [keyword,setKeyword]=useState(''); const [loading,setLoading]=useState(true);
  const [cart,setCart]=useState([]); const [placing,setPlacing]=useState(false);
  const [msg,setMsg]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);
    try { const params={}; if(scale!=='ALL') params.scale=scale; if(keyword.trim()) params.keyword=keyword.trim();
      const {data}=await productService.list(params); setProducts(data); }
    catch { setProducts([]); } finally { setLoading(false); }
  },[scale,keyword]);

  useEffect(()=>{load();},[load]);

  const addToCart=p=>setCart(prev=>{
    const ex=prev.find(i=>i.productId===p.id);
    if(ex) return prev.map(i=>i.productId===p.id?{...i,quantity:i.quantity+1}:i);
    return [...prev,{productId:p.id,farmerId:p.farmerId,unitPrice:p.price,scale:p.scale,quantity:1,name:p.name}];
  });

  const placeOrder=async()=>{
    if(!user){navigate('/login');return;} if(!cart.length) return;
    localStorage.setItem('kc_checkout_cart', JSON.stringify(cart));
    navigate('/checkout');
  };

  const total=cart.reduce((s,i)=>s+i.unitPrice*i.quantity,0);

  return (
    <div style={{fontFamily:'system-ui,sans-serif',background:'#f5f7f5',minHeight:'100vh'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 22px',background:G,color:'#fff'}}>
        <h1 style={{margin:0,fontSize:20,fontWeight:700}}>🌾 KisanConnect</h1>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {user&&<span style={{fontSize:12,background:'rgba(255,255,255,.15)',borderRadius:20,padding:'3px 11px'}}>{user.name} ({user.role})</span>}
          {isFarmer&&<button style={nb} onClick={()=>navigate('/products/new')}>+ List Product</button>}
          {user&&<button style={nb} onClick={()=>navigate('/dashboard/'+user.role.toLowerCase())}>Dashboard</button>}
          {!user&&<button style={{...nb,background:'#fff',color:G,fontWeight:600}} onClick={()=>navigate('/login')}>Login</button>}
        </div>
      </div>
      <div style={{padding:'12px 22px',background:'#fff',borderBottom:'1px solid #e8e8e8',display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
        <input style={{flex:1,minWidth:160,padding:'8px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,fontFamily:'inherit'}}
          placeholder="🔍  Search products…" value={keyword} onChange={e=>setKeyword(e.target.value)}/>
        <div style={{display:'flex',gap:5}}>
          {SCALES.map(s=><button key={s} onClick={()=>setScale(s)}
            style={{padding:'6px 14px',border:'1px solid #ddd',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontSize:12,
              background:scale===s?G:'#fff',color:scale===s?'#fff':'#666',borderColor:scale===s?G:'#ddd',fontWeight:scale===s?600:400}}>{s}</button>)}
        </div>
      </div>
      <div style={{display:'flex',padding:'18px 22px',gap:0,maxWidth:1200,margin:'0 auto'}}>
        <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:14,alignContent:'start'}}>
          {loading&&<p style={{color:'#aaa',gridColumn:'1/-1',textAlign:'center',paddingTop:40}}>Loading products…</p>}
          {!loading&&!products.length&&<p style={{color:'#aaa',gridColumn:'1/-1',textAlign:'center',paddingTop:40}}>No products found.</p>}
          {products.map(p=>{const si=SI[p.scale]||{};return(
            <div key={p.id} style={{background:'#fff',borderRadius:10,padding:14,border:'1.5px solid '+(si.border||'#e0e0e0'),display:'flex',flexDirection:'column',gap:5}}>
              <span style={{display:'inline-block',padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:si.color,color:si.border,alignSelf:'flex-start'}}>{si.emoji} {si.label}</span>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:'#222'}}>{p.name}</p>
              <p style={{margin:0,fontSize:11,color:'#888',flexGrow:1}}>{p.description||'No description'}</p>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#aaa'}}><span>{p.category}</span><span>Stock: {p.stockQty} {p.unit}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:3}}>
                <span style={{fontSize:15,fontWeight:700,color:G}}>₹{p.price}/{p.unit}</span>
                {isBuyer&&<button onClick={()=>addToCart(p)} style={{padding:'5px 12px',background:G,color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>+ Add</button>}
              </div>
            </div>
          );})}
        </div>
        {isBuyer&&(
          <div style={{width:240,marginLeft:20,background:'#fff',borderRadius:10,padding:14,border:'1px solid #e8e8e8',alignSelf:'flex-start',position:'sticky',top:18}}>
            <h3 style={{margin:'0 0 10px',fontSize:15,fontWeight:700}}>🛒 Cart</h3>
            {!cart.length&&<p style={{color:'#aaa',fontSize:12,textAlign:'center',padding:'16px 0'}}>No items yet.</p>}
            {cart.map(item=>(
              <div key={item.productId} style={{borderBottom:'1px solid #f0f0f0',paddingBottom:8,marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:500,display:'block',marginBottom:3}}>{item.name}</span>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <button style={qb} onClick={()=>setCart(c=>c.map(i=>i.productId===item.productId?{...i,quantity:Math.max(1,i.quantity-1)}:i))}>−</button>
                  <span style={{fontSize:13,minWidth:18,textAlign:'center'}}>{item.quantity}</span>
                  <button style={qb} onClick={()=>setCart(c=>c.map(i=>i.productId===item.productId?{...i,quantity:i.quantity+1}:i))}>+</button>
                  <span style={{marginLeft:'auto',fontSize:12,fontWeight:600,color:G}}>₹{(item.unitPrice*item.quantity).toFixed(2)}</span>
                  <button style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:12}} onClick={()=>setCart(c=>c.filter(i=>i.productId!==item.productId))}>✕</button>
                </div>
              </div>
            ))}
            {cart.length>0&&<>
              <div style={{fontWeight:700,fontSize:14,textAlign:'right',padding:'6px 0',borderTop:'1px solid #eee'}}>Total: ₹{total.toFixed(2)}</div>
              <button onClick={placeOrder} disabled={placing} style={{width:'100%',padding:'9px 0',background:G,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,marginTop:6,fontFamily:'inherit'}}>{placing?'Redirecting…':'Checkout & Pay'}</button>
            </>}
            {msg&&<div style={{marginTop:8,fontSize:11,color:'#444',textAlign:'center'}}>{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
const nb={padding:'6px 13px',background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:7,cursor:'pointer',fontSize:12,fontFamily:'inherit'};
const qb={width:24,height:24,border:'1px solid #ddd',borderRadius:4,cursor:'pointer',background:'#f9f9f9',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'};
