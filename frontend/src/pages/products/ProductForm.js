import React,{useState,useEffect} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {productService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

const SCALES=[{value:'SMALL',label:'🌱 Small',desc:'Local/village — up to 100 kg'},{value:'MEDIUM',label:'🌿 Medium',desc:'District — 100 kg to 1 tonne'},{value:'LARGE',label:'🌾 Large',desc:'Bulk/export — above 1 tonne'}];
const CATS=['Vegetables','Fruits','Grains','Pulses','Spices','Cotton','Dairy','Other'];
const G='#2d6a4f';
const empty={name:'',description:'',category:'',scale:'SMALL',price:'',unit:'kg',stockQty:'',imageUrl:''};

export default function ProductForm() {
  const {user,isFarmer}=useAuth(); const navigate=useNavigate(); const {id}=useParams();
  const isEdit=Boolean(id);
  const [form,setForm]=useState(empty); const [error,setError]=useState(''); const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!user||!isFarmer){navigate('/login');return;}
    if(isEdit) productService.getById(id).then(({data})=>setForm({name:data.name,description:data.description||'',category:data.category||'',scale:data.scale,price:data.price,unit:data.unit,stockQty:data.stockQty,imageUrl:data.imageUrl||''})).catch(()=>setError('Could not load product.'));
  },[id]);

  const handle=e=>setForm({...form,[e.target.name]:e.target.value});

  const submit=async e=>{
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload={...form,price:parseFloat(form.price),stockQty:parseFloat(form.stockQty)};
      if(isEdit) await productService.update(id,payload);
      else await productService.create(payload);
      navigate('/dashboard/farmer');
    } catch(err){setError(err.response?.data?.message||'Save failed.');}
    finally{setSaving(false);}
  };

  const s={page:{fontFamily:'system-ui,sans-serif',background:'#f5f7f5',minHeight:'100vh'},nav:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 22px',background:G,color:'#fff'},brand:{fontSize:19,fontWeight:700},back:{padding:'6px 13px',background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:7,cursor:'pointer',fontSize:12,fontFamily:'inherit'},body:{maxWidth:720,margin:'0 auto',padding:'24px 20px'},title:{margin:'0 0 20px',fontSize:20,color:'#1a1a1a'},wrap:{display:'flex',flexDirection:'column',gap:16},section:{background:'#fff',borderRadius:10,padding:'18px 20px',border:'1px solid #e8e8e8'},sTitle:{fontSize:12,fontWeight:700,color:'#444',textTransform:'uppercase',letterSpacing:'.04em',margin:'0 0 14px'},row:{display:'flex',gap:12,flexWrap:'wrap'},field:{flex:1,minWidth:140,display:'flex',flexDirection:'column'},label:{fontSize:11,fontWeight:600,color:'#555',marginBottom:4},input:{padding:'8px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,fontFamily:'inherit',width:'100%',boxSizing:'border-box'},select:{padding:'8px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,fontFamily:'inherit',width:'100%',background:'#fff'},textarea:{padding:'8px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,fontFamily:'inherit',width:'100%',height:70,resize:'vertical'},scaleCards:{display:'flex',gap:10,flexWrap:'wrap'},scaleCard:{flex:1,minWidth:130,padding:'12px 14px',border:'2px solid #e0e0e0',borderRadius:10,cursor:'pointer',display:'flex',flexDirection:'column',gap:3},scaleActive:{borderColor:G,background:'#e8f5ee'},scaleLabel:{fontWeight:700,fontSize:13},scaleDesc:{fontSize:10,color:'#888'},preview:{background:'#f0f7f0',borderRadius:8,padding:'9px 14px',fontSize:12,color:G,border:'1px solid #c8e6c9',display:'flex',alignItems:'center',gap:10},prevScale:{marginLeft:'auto',padding:'2px 9px',background:G,color:'#fff',borderRadius:12,fontSize:10,fontWeight:700},actions:{display:'flex',gap:10,justifyContent:'flex-end'},cancelBtn:{padding:'9px 20px',border:'1px solid #ddd',borderRadius:8,cursor:'pointer',background:'#fff',fontSize:13,fontFamily:'inherit'},submitBtn:{padding:'9px 26px',background:G,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'},err:{background:'#fff0f0',border:'1px solid #f5c6c6',color:'#c0392b',borderRadius:8,padding:'10px 14px',fontSize:12}};

  return (
    <div style={s.page}>
      <div style={s.nav}><span style={s.brand}>🌾 KisanConnect</span><button style={s.back} onClick={()=>navigate('/dashboard/farmer')}>← Dashboard</button></div>
      <div style={s.body}>
        <h2 style={s.title}>{isEdit?'Edit Product':'List a New Product'}</h2>
        {error&&<div style={{...s.err,marginBottom:16}}>{error}</div>}
        <form onSubmit={submit} style={s.wrap}>
          <div style={s.section}>
            <p style={s.sTitle}>Product Details</p>
            <div style={s.row}>
              <div style={s.field}><label style={s.label}>Product Name *</label><input style={s.input} name="name" value={form.name} onChange={handle} placeholder="e.g. Fresh Tomatoes" required/></div>
              <div style={s.field}><label style={s.label}>Category</label><select style={s.select} name="category" value={form.category} onChange={handle}><option value="">Select category</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div style={{...s.field,marginTop:10}}><label style={s.label}>Description</label><textarea style={s.textarea} name="description" value={form.description} onChange={handle} placeholder="Describe your product, quality, harvest details…"/></div>
          </div>
          <div style={s.section}>
            <p style={s.sTitle}>Supply Scale *</p>
            <div style={s.scaleCards}>
              {SCALES.map(opt=><div key={opt.value} style={{...s.scaleCard,...(form.scale===opt.value?s.scaleActive:{})}} onClick={()=>setForm({...form,scale:opt.value})}><span style={s.scaleLabel}>{opt.label}</span><span style={s.scaleDesc}>{opt.desc}</span></div>)}
            </div>
          </div>
          <div style={s.section}>
            <p style={s.sTitle}>Pricing & Stock</p>
            <div style={s.row}>
              <div style={s.field}><label style={s.label}>Price (₹) *</label><input style={s.input} name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handle} placeholder="e.g. 45.00" required/></div>
              <div style={s.field}><label style={s.label}>Unit *</label><select style={s.select} name="unit" value={form.unit} onChange={handle}>{['kg','quintal','tonne','litre','dozen','piece','bundle'].map(u=><option key={u}>{u}</option>)}</select></div>
              <div style={s.field}><label style={s.label}>Available Stock *</label><input style={s.input} name="stockQty" type="number" min="0" value={form.stockQty} onChange={handle} placeholder="e.g. 500" required/></div>
            </div>
          </div>
          {form.name&&<div style={s.preview}><strong>Preview:</strong> {form.name}{form.price?' — ₹'+form.price+'/'+form.unit:''}<span style={s.prevScale}>{form.scale}</span></div>}
          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={()=>navigate('/dashboard/farmer')}>Cancel</button>
            <button type="submit" style={s.submitBtn} disabled={saving}>{saving?'Saving…':isEdit?'Update Product':'List Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
