import { useState, useRef, useEffect, useCallback } from "react";

/* ─────────── STYLES ─────────── */
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#07080d;color:#eef0f8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e2235;border-radius:99px}
  button,input,select,textarea{font-family:inherit}
  input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes shimmer{0%{background-position:-500px 0}100%{background-position:500px 0}}
  .fu{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
  .fu1{animation:fadeUp .4s .07s cubic-bezier(.16,1,.3,1) both}
  .fu2{animation:fadeUp .4s .14s cubic-bezier(.16,1,.3,1) both}
  .fi{animation:fadeIn .3s ease both}
  .shimmer{background:linear-gradient(90deg,#131826 25%,#1c2236 50%,#131826 75%);background-size:500px 100%;animation:shimmer 1.5s linear infinite}
  .press:active{transform:scale(.97)}
  .tab-on{background:#3b82f6!important;color:#fff!important}
  .meal-chip.active{border-color:#3b82f6!important;background:#3b82f620!important;color:#3b82f6!important}
`;

/* ─────────── GOAL PRESETS ─────────── */
const GOAL_PRESETS = [
  {
    id:"lean_bulk", label:"Prise de masse sèche", icon:"💪", color:"#3b82f6",
    desc:"Surplus modéré, gain musculaire minimal de graisse",
    macroSplit:{protein:35,carbs:45,fat:20},
    advice:"Vise +200-300 kcal/jour. Priorité aux protéines pour construire du muscle sans stocker de graisse.",
    training:"4-5 séances/semaine. Focus musculation composée (squat, bench, deadlift) + 2 cardio légers.",
    calories_formula: (bmr) => Math.round(bmr * 1.55 + 250),
  },
  {
    id:"aggressive_bulk", label:"Prise de masse agressive", icon:"🏋️", color:"#f97316",
    desc:"Surplus important, gain de force et de volume maximal",
    macroSplit:{protein:30,carbs:50,fat:20},
    advice:"Vise +500 kcal/jour. Mange gros, dors 8h, soulève lourd. La graisse se perd après.",
    training:"5-6 séances/semaine. Lourds et volumeux. Repos minimum entre les séries.",
    calories_formula: (bmr) => Math.round(bmr * 1.725 + 500),
  },
  {
    id:"cut", label:"Sèche / Perte de graisse", icon:"🔥", color:"#ef4444",
    desc:"Déficit calorique, préservation du muscle",
    macroSplit:{protein:40,carbs:35,fat:25},
    advice:"Vise -300-500 kcal/jour. Protéines hautes pour préserver le muscle en déficit.",
    training:"4 séances muscu/semaine + 3 cardios HIIT 20-30 min. Maintiens l'intensité.",
    calories_formula: (bmr) => Math.round(bmr * 1.375 - 400),
  },
  {
    id:"recomp", label:"Recomposition corporelle", icon:"⚡", color:"#8b5cf6",
    desc:"Maintien du poids, perte de graisse et gain musculaire simultanés",
    macroSplit:{protein:38,carbs:38,fat:24},
    advice:"Mange à maintenance. Cyclise les glucides selon les jours d'entraînement.",
    training:"5 séances/semaine. Musculation + cardio modéré. Cohérence > intensité.",
    calories_formula: (bmr) => Math.round(bmr * 1.55),
  },
  {
    id:"perf", label:"Performance sportive", icon:"🏃", color:"#10b981",
    desc:"Énergie maximale, endurance et récupération",
    macroSplit:{protein:25,carbs:55,fat:20},
    advice:"Glucides timing crucial. Charge en carbs avant les séances, protéines après.",
    training:"6 séances/semaine. Spécifique à ton sport + musculation fonctionnelle.",
    calories_formula: (bmr) => Math.round(bmr * 1.725),
  },
  {
    id:"maintain", label:"Maintien & Santé", icon:"🎯", color:"#06b6d4",
    desc:"Équilibre global, bien-être et énergie stable",
    macroSplit:{protein:30,carbs:45,fat:25},
    advice:"Varie tes sources alimentaires. L'équilibre sur la semaine prime sur chaque repas.",
    training:"3-4 séances/semaine. Mix musculation et cardio selon tes préférences.",
    calories_formula: (bmr) => Math.round(bmr * 1.55),
  },
];

/* ─────────── NUTRIENTS ─────────── */
const CATS = [
  { id:"macros", label:"Macronutriments", color:"#3b82f6", items:[
    {k:"calories",l:"Calories",u:"kcal",c:"#f97316",ico:"🔥"},
    {k:"protein", l:"Protéines",u:"g",  c:"#38bdf8",ico:"💪"},
    {k:"carbs",   l:"Glucides", u:"g",  c:"#a78bfa",ico:"🌾"},
    {k:"fat",     l:"Lipides",  u:"g",  c:"#fbbf24",ico:"🫙"},
    {k:"fiber",   l:"Fibres",   u:"g",  c:"#4ade80",ico:"🌿"},
    {k:"sugar",   l:"Sucres",   u:"g",  c:"#f87171",ico:"🍭"},
    {k:"sodium",  l:"Sodium",   u:"mg", c:"#c084fc",ico:"🧂"},
  ]},
  { id:"fats", label:"Acides gras", color:"#06b6d4", items:[
    {k:"omega3",l:"Oméga-3",u:"g",c:"#06b6d4",ico:"🐟"},
  ]},
  { id:"vitamins", label:"Vitamines", color:"#fbbf24", items:[
    {k:"vitA",  l:"Vitamine A",  u:"μg",c:"#fb923c",ico:"🥕"},
    {k:"vitC",  l:"Vitamine C",  u:"mg",c:"#fbbf24",ico:"🍊"},
    {k:"vitD",  l:"Vitamine D",  u:"μg",c:"#fde047",ico:"☀️"},
    {k:"vitE",  l:"Vitamine E",  u:"mg",c:"#a3e635",ico:"🌻"},
    {k:"vitK",  l:"Vitamine K",  u:"μg",c:"#4ade80",ico:"🥦"},
    {k:"vitB12",l:"Vitamine B12",u:"μg",c:"#f9a8d4",ico:"🔴"},
    {k:"vitB6", l:"Vitamine B6", u:"mg",c:"#e879f9",ico:"🟣"},
  ]},
  { id:"minerals", label:"Minéraux", color:"#10b981", items:[
    {k:"calcium",   l:"Calcium",   u:"mg",c:"#e2e8f0",ico:"🦴"},
    {k:"iron",      l:"Fer",       u:"mg",c:"#fca5a5",ico:"⚙️"},
    {k:"magnesium", l:"Magnésium", u:"mg",c:"#6ee7b7",ico:"✨"},
    {k:"zinc",      l:"Zinc",      u:"mg",c:"#93c5fd",ico:"⚡"},
    {k:"potassium", l:"Potassium", u:"mg",c:"#fdba74",ico:"🍌"},
    {k:"selenium",  l:"Sélénium",  u:"μg",c:"#fef08a",ico:"🌰"},
    {k:"iodine",    l:"Iode",      u:"μg",c:"#67e8f9",ico:"🌊"},
  ]},
];

const TIPS = {
  omega3:{f:"Saumon 100g · graines de chia 2cs · noix 30g",t:"Poisson gras 2-3×/sem ou lin moulu au petit-déj."},
  vitA:{f:"Foie de volaille · carotte · patate douce",t:"Les aliments orange et les abats sont les meilleures sources."},
  vitC:{f:"Poivron rouge ½ · kiwi · brocoli cru · persil",t:"Consommer cru — la cuisson détruit jusqu'à 50%."},
  vitD:{f:"Sardines 85g (12μg) · saumon · œuf entier",t:"15-20 min de soleil/j ou D3 1000-2000 UI en hiver."},
  vitE:{f:"Amandes 30g · huile de tournesol · noisettes",t:"Les oléagineux et huiles végétales sont les sources clés."},
  vitK:{f:"Kale cuit 50g · épinards crus · brocoli",t:"Les légumes verts foncés couvrent facilement les besoins."},
  vitB12:{f:"Palourdes · foie · saumon · œufs · laitages",t:"Végans : supplémenter à 250μg/j obligatoirement."},
  vitB6:{f:"Thon · poulet · banane · pois chiches",t:"Présente dans la plupart des protéines animales."},
  calcium:{f:"Yaourt grec 150g · fromage · sardines avec arêtes",t:"Max 500mg à la fois. Associer avec vitamine D."},
  iron:{f:"Lentilles 150g · épinards · viande rouge · tofu",t:"Associer avec vitamine C pour ×3 l'absorption."},
  magnesium:{f:"Graines de courge 30g · chocolat 70%+ · épinards",t:"Bisglycinate de magnésium = mieux absorbé en complément."},
  zinc:{f:"Huîtres · bœuf 100g · graines de courge",t:"Sources animales mieux absorbées. Tremper les légumineuses."},
  potassium:{f:"Patate douce 150g · avocat ½ · haricots blancs",t:"8-10 portions fruits/légumes/jour = besoins couverts."},
  selenium:{f:"Noix du Brésil 1-2 · thon · sardines · œufs",t:"1-2 noix du Brésil/jour suffisent. Max 400μg."},
  iodine:{f:"Sel iodé ½cc · algue nori · poisson blanc",t:"Le sel iodé couvre facilement les besoins."},
  fiber:{f:"Avoine 40g · pomme avec peau · lentilles 150g",t:"+3-5g/semaine progressivement + 2L d'eau/jour."},
};

const MEAL_TYPES = [
  {id:"breakfast",l:"Petit-déjeuner",ico:"🌅"},
  {id:"snack_am", l:"Collation matin",ico:"🍎"},
  {id:"lunch",    l:"Déjeuner",      ico:"☀️"},
  {id:"snack_pm", l:"Collation soir",ico:"🥜"},
  {id:"dinner",   l:"Dîner",         ico:"🌙"},
  {id:"post_workout",l:"Post-workout",ico:"💪"},
];

/* ─────────── STORAGE ─────────── */
const SK_PRO   = "ns_profile_v3";
const SK_DAY   = () => "ns_day_"   + new Date().toISOString().slice(0,10);
const SK_MEALS = () => "ns_meals_" + new Date().toISOString().slice(0,10);
const load = (k,fb=null)=>{ try{return JSON.parse(localStorage.getItem(k))??fb;}catch{return fb;}};
const save = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

/* ─────────── BMR / GOALS ─────────── */
function calcBMR(profile) {
  const w = parseFloat(profile.weight)||75;
  const h = parseFloat(profile.height)||175;
  const a = parseFloat(profile.age)||25;
  if (profile.sex==="m") return Math.round(10*w + 6.25*h - 5*a + 5);
  return Math.round(10*w + 6.25*h - 5*a - 161);
}

function buildGoals(profile) {
  const preset = GOAL_PRESETS.find(g=>g.id===profile.goal) || GOAL_PRESETS[0];
  const bmr = calcBMR(profile);
  const cal = preset.calories_formula(bmr);
  const {protein:pp, carbs:cp, fat:fp} = preset.macroSplit;
  return {
    calories: cal,
    protein:  Math.round(cal * pp/100 / 4),
    carbs:    Math.round(cal * cp/100 / 4),
    fat:      Math.round(cal * fp/100 / 9),
    fiber:30, sugar:40, sodium:2300, omega3:1.8,
    vitA:900, vitC:100, vitD:15, vitE:15, vitK:120, vitB12:2.4, vitB6:1.7,
    calcium:1000, iron:14, magnesium:380, zinc:10, potassium:3500, selenium:60, iodine:150,
  };
}

/* ─────────── IMAGE ─────────── */
function resizeB64(file) {
  return new Promise((res,rej)=>{
    const reader = new FileReader();
    reader.onerror = rej;
    reader.onload = ()=>{
      const img = new Image();
      img.onerror = rej;
      img.onload = ()=>{
        // Always convert to JPEG regardless of source format (fixes iOS HEIC/HEIF)
        const MAX=1024; let w=img.width,h=img.height;
        if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
        if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
        const c=document.createElement("canvas");
        c.width=w;c.height=h;
        const ctx=c.getContext("2d");
        // White background before drawing (in case of transparent PNG)
        ctx.fillStyle="#ffffff";
        ctx.fillRect(0,0,w,h);
        ctx.drawImage(img,0,0,w,h);
        const dataUrl=c.toDataURL("image/jpeg",0.85);
        res(dataUrl.split(",")[1]);
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ─────────── API ─────────── */
async function analyseImage(b64, description, mealType, profile) {
  const preset = GOAL_PRESETS.find(g=>g.id===profile?.goal) || GOAL_PRESETS[0];
  const goals  = buildGoals(profile||{weight:75,height:175,age:25,sex:"m",goal:"lean_bulk"});
  const descPart = description?.trim() ? ` Note: "${description.trim()}".` : "";
  const context = profile
    ? ` Profil: ${profile.name}, ${profile.age}ans, ${profile.weight}kg, objectif: ${preset.label} (${goals.calories} kcal/j, protéines ${goals.protein}g).`
    : "";

  const prompt = `Tu es un nutritionniste sportif expert.${context} Analyse cette image de plat ou emballage.${descPart}
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni explication.
{"name":"nom précis de l'aliment","confidence":"haute|moyenne|faible","note":"1 phrase sur qualité nutritionnelle","advice":"1-2 phrases conseil personnalisé selon l'objectif","total":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0,"omega3":0,"vitA":0,"vitC":0,"vitD":0,"vitE":0,"vitK":0,"vitB12":0,"vitB6":0,"calcium":0,"iron":0,"magnesium":0,"zinc":0,"potassium":0,"selenium":0,"iodine":0}}
Toutes les valeurs de total sont des nombres. Estime pour la portion visible.`;

  function parseResult(raw) {
    if(!raw) throw new Error("Réponse vide");
    const s=raw.indexOf("{"), e=raw.lastIndexOf("}");
    if(s===-1||e===-1) throw new Error(`Format inattendu: "${raw.slice(0,120)}"`);
    return JSON.parse(raw.slice(s,e+1));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? "";
  return parseResult(raw);
}

/* ─────────── BAR ─────────── */
function Bar({pct,color,h=5}){
  const cap=Math.min(pct,100),over=pct>104;
  return(
    <div style={{height:h,background:"#1a1e30",borderRadius:99,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${cap}%`,borderRadius:99,
        background:over?"linear-gradient(90deg,#f97316,#ef4444)":`linear-gradient(90deg,${color}70,${color})`,
        boxShadow:cap>2?`0 0 8px ${color}40`:"none",
        transition:"width 1.2s cubic-bezier(.34,1.56,.64,1)"}}/>
    </div>
  );
}

/* ─────────── NUTRIENT ROW ─────────── */
function NRow({item,current,goal}){
  const val=current<1&&current>0?+current.toFixed(2):Math.round(current*10)/10;
  const pct=goal>0?(current/goal)*100:0;
  const over=pct>104,low=pct>0&&pct<45,zero=current===0;
  const tip=TIPS[item.k];
  return(
    <div style={{padding:"10px 14px",borderBottom:"1px solid #131826"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:16,lineHeight:1,flexShrink:0}}>{item.ico}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
            <span style={{fontSize:13,fontWeight:600,color:zero?"#2a2f4a":"#dde2f5"}}>{item.l}</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              {over&&<span style={{fontSize:9,fontWeight:700,color:"#f97316",background:"#f9731618",padding:"2px 5px",borderRadius:99}}>DÉPASSÉ</span>}
              <span style={{fontSize:11.5,fontWeight:700,color:zero?"#1e2235":item.c}}>
                {zero?"—":`${val}`}<span style={{fontSize:9,color:"#3a3f58",marginLeft:1}}>{item.u}</span>
              </span>
              <span style={{fontSize:10,color:"#252940"}}>/{goal}{item.u}</span>
            </div>
          </div>
          <Bar pct={pct} color={item.c}/>
        </div>
      </div>
      {low&&tip&&(
        <div style={{marginLeft:24,marginTop:4,padding:"9px 11px",background:item.c+"0d",border:`1px solid ${item.c}1f`,borderRadius:11}}>
          <p style={{fontSize:10,fontWeight:700,color:item.c,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>💡 Combler le déficit</p>
          <p style={{fontSize:11.5,color:"#7a84a8",lineHeight:1.7}}><span style={{color:"#bdc5e0",fontWeight:600}}>Aliments : </span>{tip.f}</p>
          <p style={{fontSize:11.5,color:"#7a84a8",marginTop:3,lineHeight:1.7}}><span style={{color:"#bdc5e0",fontWeight:600}}>Conseil : </span>{tip.t}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────── CAT BLOCK ─────────── */
function CatBlock({cat,daily,goals}){
  const [open,setOpen]=useState(true);
  return(
    <div style={{marginBottom:8,background:"#0e1018",borderRadius:18,overflow:"hidden",border:"1px solid #171b2c"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:cat.color,boxShadow:`0 0 7px ${cat.color}`}}/>
          <span style={{fontSize:12.5,fontWeight:700,color:"#dde2f5"}}>{cat.label}</span>
          <span style={{fontSize:10.5,color:"#2e3352"}}>({cat.items.length})</span>
        </div>
        <span style={{fontSize:10,color:"#2e3352"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&<div style={{borderTop:"1px solid #131826"}}>
        {cat.items.map(item=><NRow key={item.k} item={item} current={daily[item.k]||0} goal={goals[item.k]||1}/>)}
      </div>}
    </div>
  );
}

/* ─────────── ONBOARDING ─────────── */
function Onboarding({onDone}){
  const [step,setStep]=useState(0);
  const [p,setP]=useState({name:"",age:"",weight:"",height:"",sex:"m",goal:"lean_bulk"});
  const [err,setErr]=useState("");
  const s=(k,v)=>setP(prev=>({...prev,[k]:v}));
  const ACC="#3b82f6";

  function next(){
    if(step===0&&!p.name.trim()){setErr("Entre ton prénom.");return;}
    if(step===1&&(!p.age||!p.weight||!p.height)){setErr("Remplis tous les champs.");return;}
    setErr("");
    if(step<2)setStep(s=>s+1);
    else{save(SK_PRO,p);onDone(p);}
  }

  const inp={width:"100%",background:"#0a0c16",border:"1.5px solid #1a1e30",borderRadius:13,padding:"13px 15px",color:"#eef0f8",fontSize:15,transition:"border-color .2s"};

  return(
    <div style={{minHeight:"100vh",background:"#07080d",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <style>{CSS}</style>
      <div className="fu" style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:48,marginBottom:10}}>🥗</div>
        <h1 style={{fontSize:34,fontWeight:800,letterSpacing:-1.5,color:"#eef0f8"}}>nutri<span style={{color:ACC}}>scan</span></h1>
        <p style={{fontSize:13,color:"#3a3f58",marginTop:5}}>Coach nutrition IA · Personnalisé</p>
      </div>
      <div className="fu1" style={{display:"flex",gap:5,marginBottom:20}}>
        {[0,1,2].map(i=><div key={i} style={{height:3,borderRadius:99,transition:"all .3s",width:step===i?28:10,background:step>=i?ACC:"#1a1e30"}}/>)}
      </div>
      <div className="fu2" style={{width:"100%",maxWidth:420,background:"#0e1018",borderRadius:24,padding:"24px 20px",border:"1px solid #171b2c"}}>

        {step===0&&(
          <div className="fu">
            <p style={{fontSize:22,fontWeight:800,color:"#eef0f8",marginBottom:5}}>Bienvenue 👋</p>
            <p style={{fontSize:13,color:"#4a5175",marginBottom:18}}>Comment tu t'appelles ?</p>
            <input autoFocus style={inp} placeholder="Ex : Ramy" value={p.name}
              onChange={e=>s("name",e.target.value)} onKeyDown={e=>e.key==="Enter"&&next()}
              onFocus={e=>e.target.style.borderColor=ACC} onBlur={e=>e.target.style.borderColor="#1a1e30"}/>
          </div>
        )}

        {step===1&&(
          <div className="fu">
            <p style={{fontSize:22,fontWeight:800,color:"#eef0f8",marginBottom:5}}>Ton profil {p.name} 📊</p>
            <p style={{fontSize:13,color:"#4a5175",marginBottom:16}}>Pour calibrer tes besoins précisément</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
              {[{k:"age",l:"Âge",ph:"22"},{k:"weight",l:"Poids (kg)",ph:"80"},{k:"height",l:"Taille (cm)",ph:"180"}].map(f=>(
                <div key={f.k} style={{gridColumn:f.k==="age"?"1/-1":"auto"}}>
                  <label style={{fontSize:10,fontWeight:700,color:"#3a3f58",textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:5}}>{f.l}</label>
                  <input type="number" style={inp} placeholder={f.ph} value={p[f.k]}
                    onChange={e=>s(f.k,e.target.value)}
                    onFocus={e=>e.target.style.borderColor=ACC} onBlur={e=>e.target.style.borderColor="#1a1e30"}/>
                </div>
              ))}
            </div>
            <label style={{fontSize:10,fontWeight:700,color:"#3a3f58",textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:7}}>Genre</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {[{v:"m",l:"👨 Homme"},{v:"f",l:"👩 Femme"}].map(x=>(
                <button key={x.v} onClick={()=>s("sex",x.v)} style={{padding:"11px",borderRadius:12,border:`1.5px solid ${p.sex===x.v?ACC:"#1a1e30"}`,background:p.sex===x.v?ACC+"14":"#0a0c16",color:p.sex===x.v?ACC:"#4a5175",fontSize:13,fontWeight:700,transition:"all .2s"}}>{x.l}</button>
              ))}
            </div>
          </div>
        )}

        {step===2&&(
          <div className="fu">
            <p style={{fontSize:22,fontWeight:800,color:"#eef0f8",marginBottom:5}}>Ton objectif 🎯</p>
            <p style={{fontSize:13,color:"#4a5175",marginBottom:14}}>Je calibrerai tes besoins et conseils en fonction</p>
            <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:360,overflowY:"auto"}}>
              {GOAL_PRESETS.map(g=>(
                <button key={g.id} onClick={()=>s("goal",g.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:16,border:`1.5px solid ${p.goal===g.id?g.color:"#1a1e30"}`,background:p.goal===g.id?g.color+"0e":"#0a0c16",textAlign:"left",transition:"all .2s"}}>
                  <span style={{fontSize:24,flexShrink:0}}>{g.icon}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13.5,fontWeight:700,color:p.goal===g.id?g.color:"#c8cfe8"}}>{g.label}</p>
                    <p style={{fontSize:11,color:"#3a3f58",marginTop:1}}>{g.desc}</p>
                  </div>
                  {p.goal===g.id&&<span style={{color:g.color,fontSize:14,flexShrink:0}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {err&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",marginTop:10}}>{err}</p>}
        <button className="press" onClick={next} style={{marginTop:18,width:"100%",padding:"15px",background:`linear-gradient(135deg,${ACC},#2563eb)`,border:"none",borderRadius:14,color:"#fff",fontSize:15,fontWeight:800,boxShadow:`0 8px 28px ${ACC}28`,transition:"transform .15s"}}>
          {step<2?"Continuer →":"C'est parti →"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App(){
  const [profile,setProfile]   = useState(()=>load(SK_PRO));
  const [tab,setTab]           = useState("scan"); // scan | track | history
  const [mealType,setMealType] = useState("lunch");
  const [b64,setB64]           = useState(null);
  const [previewURL,setPreviewURL] = useState(null);
  const [desc,setDesc]         = useState("");
  const [loading,setLoading]   = useState(false);
  const [phase,setPhase]       = useState("");
  const [error,setError]       = useState("");
  const [scanResult,setScanResult] = useState(null);
  const [daily,setDaily]       = useState(()=>load(SK_DAY(),{}));
  const [meals,setMeals]       = useState(()=>load(SK_MEALS(),[]));
  const cameraRef  = useRef();
  const galleryRef = useRef();
  const nutriRef   = useRef();

  const goals  = profile ? buildGoals(profile) : buildGoals({weight:75,height:175,age:25,sex:"m",goal:"lean_bulk"});
  const preset = GOAL_PRESETS.find(g=>g.id===profile?.goal)||GOAL_PRESETS[0];
  const ACC    = "#3b82f6";

  useEffect(()=>{ save(SK_DAY(),daily); },[daily]);
  useEffect(()=>{ save(SK_MEALS(),meals.map(m=>({...m,thumb:null}))); },[meals]);

  const handleFile = useCallback(async(e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    setError("");setScanResult(null);
    console.log("FILE:", file.name, file.type, file.size);
    try{
      const base64=await resizeB64(file);
      console.log("B64 LENGTH:", base64.length, "STARTS:", base64.slice(0,20));
      if(!base64||base64.length<100) throw new Error("Image trop petite ou corrompue");
      setB64(base64);
      setPreviewURL("data:image/jpeg;base64,"+base64);
    }catch(err){
      console.error("handleFile error:", err);
      setError("Erreur lecture image: "+err.message);
    }
    e.target.value="";
  },[]);

  async function handleAnalyse(){
    if(!b64){setError("Prends ou importe d'abord une photo.");return;}
    setError("");setLoading(true);
    const PH=["Identification de l'aliment…","Calcul des macronutriments…","Analyse vitamines & minéraux…","Conseils personnalisés…"];
    let pi=0;setPhase(PH[0]);
    const iv=setInterval(()=>{pi=Math.min(pi+1,PH.length-1);setPhase(PH[pi]);},900);
    try{
      const res=await analyseImage(b64,desc,mealType,profile);
      clearInterval(iv);setScanResult(res);
      const t=res.total;
      setDaily(prev=>{
        const next={...prev};
        Object.keys(t).forEach(k=>{next[k]=parseFloat(((next[k]||0)+(parseFloat(t[k])||0)).toFixed(3));});
        return next;
      });
      const mt=MEAL_TYPES.find(x=>x.id===mealType);
      setMeals(prev=>[{
        name:res.name,confidence:res.confidence,note:res.note,advice:res.advice,
        total:res.total,desc,mealType,mealLabel:mt?.l||mealType,mealIco:mt?.ico||"🍽️",
        time:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),
        thumb:previewURL
      },...prev]);
      setDesc("");
      setTimeout(()=>nutriRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),400);
    }catch(e){
      clearInterval(iv);
      console.error("NUTRISCAN ERROR:", e);
      setError(e.message||"Erreur inconnue");
    }
    setLoading(false);setPhase("");
  }

  function resetDay(){
    setDaily({});setMeals([]);setScanResult(null);setB64(null);setPreviewURL(null);setDesc("");
    save(SK_DAY(),{});save(SK_MEALS(),[]);
  }

  if(!profile) return <Onboarding onDone={p=>setProfile(p)}/>;

  const calNow  = Math.round(daily.calories||0);
  const calGoal = goals.calories;
  const calPct  = Math.min((calNow/calGoal)*100,100);
  const remain  = Math.max(calGoal-calNow,0);

  /* ── Meal history grouped by meal type ── */
  const mealsByType = MEAL_TYPES.map(mt=>({
    ...mt,
    meals: meals.filter(m=>m.mealType===mt.id)
  })).filter(mt=>mt.meals.length>0);

  return(
    <div style={{minHeight:"100vh",background:"#07080d",paddingBottom:50}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"#07080dee",backdropFilter:"blur(18px)",borderBottom:"1px solid #121520",padding:"11px 14px 9px"}}>
        <div style={{maxWidth:560,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:-1,color:"#eef0f8"}}>nutri<span style={{color:ACC}}>scan</span></span>
            <p style={{fontSize:10,color:"#252940",marginTop:1}}>{profile.name} · <span style={{color:preset.color}}>{preset.label}</span></p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:19,fontWeight:800,color:ACC,lineHeight:1}}>{calNow}</p>
            <p style={{fontSize:9,color:"#252940"}}>/ {calGoal} kcal</p>
          </div>
        </div>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"0 12px"}}>

        {/* ── CALORIE CARD ── */}
        <div className="fu" style={{margin:"12px 0 10px",background:"#0e1018",borderRadius:22,border:"1px solid #171b2c",overflow:"hidden"}}>
          <div style={{padding:"16px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div>
              <p style={{fontSize:10,fontWeight:700,color:"#252940",textTransform:"uppercase",letterSpacing:".12em"}}>Aujourd'hui</p>
              <p style={{fontSize:34,fontWeight:800,color:"#eef0f8",lineHeight:1.1,marginTop:3,letterSpacing:-1}}>
                {calNow}<span style={{fontSize:14,fontWeight:400,color:"#2e3352",marginLeft:4}}>kcal</span>
              </p>
            </div>
            <div style={{textAlign:"right",paddingBottom:3}}>
              <p style={{fontSize:10,color:"#252940"}}>Restant</p>
              <p style={{fontSize:22,fontWeight:800,color:remain===0?ACC:"#60a5fa",lineHeight:1.1,marginTop:2}}>
                {remain}<span style={{fontSize:12,fontWeight:400,color:"#2e3352",marginLeft:3}}>kcal</span>
              </p>
            </div>
          </div>
          <div style={{padding:"0 18px 12px"}}>
            <div style={{height:8,background:"#131826",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${calPct}%`,background:`linear-gradient(90deg,${ACC}80,${ACC})`,borderRadius:99,transition:"width 1.4s cubic-bezier(.34,1.56,.64,1)",boxShadow:`0 0 12px ${ACC}50`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:9.5,color:"#252940"}}>0</span>
              <span style={{fontSize:9.5,fontWeight:700,color:ACC}}>{Math.round(calPct)}%</span>
              <span style={{fontSize:9.5,color:"#252940"}}>{calGoal}</span>
            </div>
          </div>
          <div style={{borderTop:"1px solid #131826",padding:"12px 18px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px 14px"}}>
            {[{k:"protein",l:"Protéines",c:"#38bdf8"},{k:"carbs",l:"Glucides",c:"#a78bfa"},{k:"fat",l:"Lipides",c:"#fbbf24"},{k:"fiber",l:"Fibres",c:"#4ade80"}].map(m=>{
              const val=Math.round(daily[m.k]||0),pct=Math.min((val/goals[m.k])*100,100);
              return(
                <div key={m.k}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10.5,fontWeight:600,color:"#4a5175"}}>{m.l}</span>
                    <span style={{fontSize:10.5,fontWeight:700,color:m.c}}>{val}g</span>
                  </div>
                  <Bar pct={pct} color={m.c} h={4}/>
                  <p style={{fontSize:8.5,color:"#1e2235",marginTop:2,textAlign:"right"}}>/{goals[m.k]}g</p>
                </div>
              );
            })}
          </div>
          {/* Goal advice banner */}
          <div style={{borderTop:"1px solid #131826",padding:"10px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>{preset.icon}</span>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:preset.color}}>{preset.label}</p>
              <p style={{fontSize:11,color:"#4a5175",lineHeight:1.5,marginTop:2}}>{preset.advice}</p>
              <p style={{fontSize:10.5,color:"#3a3f58",marginTop:3}}>🏋️ {preset.training}</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="fu1" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,background:"#0e1018",padding:4,borderRadius:16,border:"1px solid #171b2c",marginBottom:12}}>
          {[{k:"scan",l:"📷 Scanner"},{k:"track",l:"📊 Suivi"},{k:"history",l:"🍽️ Historique"}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              className={tab===t.k?"tab-on":""}
              style={{padding:"10px 4px",borderRadius:12,border:"none",background:"transparent",color:tab===t.k?"#fff":"#3a3f58",fontSize:12.5,fontWeight:700,transition:"all .2s"}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ════════ SCAN ════════ */}
        {tab==="scan"&&(
          <div className="fu2">
            {/* hidden inputs — NO capture attr so both camera + gallery work on mobile */}
            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
            <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>

            {/* Meal type selector */}
            <div style={{marginBottom:10}}>
              <p style={{fontSize:10,fontWeight:700,color:"#3a3f58",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Type de repas</p>
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
                {MEAL_TYPES.map(mt=>(
                  <button key={mt.id} onClick={()=>setMealType(mt.id)}
                    className={`meal-chip ${mealType===mt.id?"active":""}`}
                    style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:99,border:`1.5px solid ${mealType===mt.id?ACC:"#1a1e30"}`,background:mealType===mt.id?ACC+"18":"#0e1018",color:mealType===mt.id?ACC:"#4a5175",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s"}}>
                    <span style={{fontSize:14}}>{mt.ico}</span>{mt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo zone */}
            <div style={{position:"relative",width:"100%",aspectRatio:"16/10",borderRadius:18,overflow:"hidden",background:"#0e1018",border:`1.5px solid ${previewURL?ACC+"40":"#171b2c"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {!previewURL&&!loading&&(
                <div style={{textAlign:"center",padding:"18px",userSelect:"none"}}>
                  <div style={{width:64,height:64,borderRadius:20,background:"#07080d",border:"1.5px solid #1a1e30",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                      <rect x="2" y="8" width="26" height="16" rx="3.5" stroke={ACC} strokeWidth="1.5" fill="none" opacity=".3"/>
                      <path d="M9 8l2-3h8l2 3" stroke={ACC} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                      <circle cx="15" cy="16" r="4.5" stroke={ACC} strokeWidth="1.5" fill="none"/>
                      <circle cx="15" cy="16" r="2" fill={ACC} opacity=".5"/>
                    </svg>
                  </div>
                  <p style={{fontSize:14,fontWeight:700,color:"#3a3f58"}}>Photo de ton plat</p>
                  <p style={{fontSize:11,color:"#1e2338",marginTop:3}}>emballage nutritionnel ou plat cuisiné</p>
                  <div style={{marginTop:14,display:"flex",gap:7,justifyContent:"center"}}>
                    <button onClick={()=>cameraRef.current?.click()} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:ACC+"14",border:`1.5px solid ${ACC}30`,borderRadius:99,color:ACC,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      📷 Caméra
                    </button>
                    <button onClick={()=>galleryRef.current?.click()} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#171b2c",border:"1.5px solid #222640",borderRadius:99,color:"#6272a4",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      🖼️ Galerie
                    </button>
                  </div>
                </div>
              )}
              {previewURL&&(
                <>
                  <img src={previewURL} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#07080de0 0%,transparent 50%)"}}/>
                  <div style={{position:"absolute",bottom:10,left:12,right:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{background:ACC+"20",backdropFilter:"blur(8px)",border:`1px solid ${ACC}30`,borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:700,color:ACC}}>✓ Prête</span>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>cameraRef.current?.click()} style={{background:"#00000060",backdropFilter:"blur(8px)",border:"none",borderRadius:99,padding:"4px 10px",fontSize:11,color:"#94a3b8",cursor:"pointer"}}>📷</button>
                      <button onClick={()=>galleryRef.current?.click()} style={{background:"#00000060",backdropFilter:"blur(8px)",border:"none",borderRadius:99,padding:"4px 10px",fontSize:11,color:"#94a3b8",cursor:"pointer"}}>🖼️</button>
                    </div>
                  </div>
                </>
              )}
              {loading&&(
                <div style={{position:"absolute",inset:0,background:"#07080df5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
                  <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid #131826`,borderTopColor:ACC,animation:"spin .8s linear infinite",boxShadow:`0 0 16px ${ACC}30`}}/>
                  <p style={{fontSize:13,fontWeight:600,color:ACC,textAlign:"center",maxWidth:220}}>{phase}</p>
                  <div style={{width:130,height:2,background:"#131826",borderRadius:99,overflow:"hidden"}}>
                    <div className="shimmer" style={{height:"100%",borderRadius:99}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <textarea placeholder="Description optionnelle… ex : 200g de riz, 2 œufs, sauce tomate maison" value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
              style={{width:"100%",marginTop:9,background:"#0e1018",border:"1.5px solid #171b2c",borderRadius:13,padding:"11px 14px",color:"#eef0f8",fontSize:13,resize:"none",lineHeight:1.5,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor=ACC} onBlur={e=>e.target.style.borderColor="#171b2c"}/>

            {error&&(
              <div style={{marginTop:8,padding:"10px 13px",background:"#f8717110",border:"1px solid #f8717128",borderRadius:12,fontSize:12,color:"#f87171",display:"flex",gap:6}}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <button className="press" onClick={handleAnalyse} disabled={loading}
              style={{marginTop:10,width:"100%",padding:"15px",border:"none",borderRadius:14,background:loading?"#0e1018":`linear-gradient(135deg,${ACC},#2563eb)`,color:loading?"#2e3352":"#fff",fontSize:15,fontWeight:800,boxShadow:loading?"none":`0 8px 28px ${ACC}28`,transition:"all .2s",cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Analyse en cours…":"🔍 Analyser avec l'IA"}
            </button>

            {/* Scan result */}
            {scanResult&&!loading&&(
              <div className="fu" style={{marginTop:14,background:"#0e1018",borderRadius:18,border:`1.5px solid ${ACC}18`,overflow:"hidden"}}>
                <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #131826",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:800,color:"#eef0f8"}}>{scanResult.name}</p>
                    <p style={{fontSize:11,color:"#2e3352",marginTop:2}}>
                      Confiance : <span style={{color:scanResult.confidence==="haute"?"#4ade80":scanResult.confidence==="moyenne"?"#fbbf24":"#f87171",fontWeight:700}}>{scanResult.confidence}</span>
                    </p>
                  </div>
                  <div style={{textAlign:"right",marginLeft:10}}>
                    <p style={{fontSize:30,fontWeight:800,color:ACC,lineHeight:1}}>{Math.round(scanResult.total.calories)}</p>
                    <p style={{fontSize:9,color:"#2e3352"}}>kcal</p>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:"#131826"}}>
                  {[{l:"Protéines",k:"protein",u:"g",c:"#38bdf8"},{l:"Glucides",k:"carbs",u:"g",c:"#a78bfa"},{l:"Lipides",k:"fat",u:"g",c:"#fbbf24"},{l:"Fibres",k:"fiber",u:"g",c:"#4ade80"},{l:"Oméga-3",k:"omega3",u:"g",c:"#06b6d4"},{l:"Sodium",k:"sodium",u:"mg",c:"#c084fc"}].map(x=>(
                    <div key={x.k} style={{padding:"10px 6px",background:"#0e1018",textAlign:"center"}}>
                      <p style={{fontSize:13.5,fontWeight:800,color:x.c,lineHeight:1}}>{Math.round((scanResult.total[x.k]||0)*10)/10}<span style={{fontSize:8,color:"#2e3352",marginLeft:1}}>{x.u}</span></p>
                      <p style={{fontSize:9.5,color:"#2e3352",marginTop:2}}>{x.l}</p>
                    </div>
                  ))}
                </div>
                {/* vitamins mini */}
                <div style={{padding:"10px 14px",borderTop:"1px solid #131826"}}>
                  <p style={{fontSize:9.5,fontWeight:700,color:"#1e2235",textTransform:"uppercase",letterSpacing:".1em",marginBottom:7}}>Vitamines & Minéraux</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                    {[{k:"vitC",l:"Vit. C",u:"mg",c:"#fbbf24"},{k:"vitD",l:"Vit. D",u:"μg",c:"#fde047"},{k:"vitA",l:"Vit. A",u:"μg",c:"#fb923c"},{k:"vitB12",l:"B12",u:"μg",c:"#f9a8d4"},{k:"calcium",l:"Ca",u:"mg",c:"#e2e8f0"},{k:"iron",l:"Fer",u:"mg",c:"#fca5a5"},{k:"magnesium",l:"Mg",u:"mg",c:"#6ee7b7"},{k:"potassium",l:"K",u:"mg",c:"#fdba74"}].map(x=>(
                      <div key={x.k} style={{padding:"7px 3px",background:"#07080d",borderRadius:9,textAlign:"center"}}>
                        <p style={{fontSize:11.5,fontWeight:700,color:x.c,lineHeight:1}}>{Math.round((scanResult.total[x.k]||0)*10)/10}<span style={{fontSize:7.5,color:"#1e2235"}}>{x.u}</span></p>
                        <p style={{fontSize:9,color:"#1e2235",marginTop:1}}>{x.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AI advice */}
                {scanResult.advice&&(
                  <div style={{padding:"10px 14px",borderTop:"1px solid #131826",background:ACC+"08"}}>
                    <p style={{fontSize:10,fontWeight:700,color:ACC,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>🤖 Analyse personnalisée</p>
                    <p style={{fontSize:12,color:"#6272a4",lineHeight:1.7}}>{scanResult.advice}</p>
                  </div>
                )}
                {scanResult.note&&(
                  <div style={{padding:"9px 14px",borderTop:"1px solid #131826",fontSize:12,color:"#4a5175",lineHeight:1.6}}>💬 {scanResult.note}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════ TRACK ════════ */}
        {tab==="track"&&(
          <div ref={nutriRef}>
            {calNow===0?(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <p style={{fontSize:40,marginBottom:10}}>📊</p>
                <p style={{fontSize:15,color:"#3a3f58"}}>Aucun repas scanné aujourd'hui</p>
                <button onClick={()=>setTab("scan")} style={{marginTop:14,padding:"11px 24px",background:ACC+"14",border:`1px solid ${ACC}28`,borderRadius:12,color:ACC,fontSize:13,fontWeight:700,cursor:"pointer"}}>Scanner →</button>
              </div>
            ):(
              CATS.map(cat=><CatBlock key={cat.id} cat={cat} daily={daily} goals={goals}/>)
            )}
          </div>
        )}

        {/* ════════ HISTORY ════════ */}
        {tab==="history"&&(
          <div>
            {meals.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <p style={{fontSize:40,marginBottom:10}}>🍽️</p>
                <p style={{fontSize:15,color:"#3a3f58"}}>Aucun repas aujourd'hui</p>
              </div>
            ):(
              <>
                {/* Summary by meal type */}
                {mealsByType.map(mt=>(
                  <div key={mt.id} style={{marginBottom:10,background:"#0e1018",borderRadius:18,overflow:"hidden",border:"1px solid #171b2c"}}>
                    {/* meal type header */}
                    <div style={{padding:"11px 14px",borderBottom:"1px solid #131826",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{mt.ico}</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#c8cfe8"}}>{mt.l}</span>
                      <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:ACC}}>
                        {Math.round(mt.meals.reduce((s,m)=>s+(m.total.calories||0),0))} kcal
                      </span>
                    </div>
                    {/* meals in this slot */}
                    {mt.meals.map((m,i)=>(
                      <div key={i} className="fi" style={{display:"flex",borderBottom:i<mt.meals.length-1?"1px solid #0d1018":"none"}}>
                        <div style={{width:64,height:64,background:"#07080d",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                          {m.thumb?<img src={m.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🍽️"}
                        </div>
                        <div style={{padding:"10px 12px",flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                            <p style={{fontSize:13,fontWeight:700,color:"#dde2f5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</p>
                            <span style={{fontSize:10,color:"#252940",flexShrink:0}}>{m.time}</span>
                          </div>
                          {m.desc&&<p style={{fontSize:10.5,color:"#252940",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.desc}</p>}
                          <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:13,fontWeight:800,color:ACC}}>{Math.round(m.total.calories)} kcal</span>
                            <span style={{fontSize:11,color:"#38bdf8"}}>P {Math.round(m.total.protein)}g</span>
                            <span style={{fontSize:11,color:"#a78bfa"}}>G {Math.round(m.total.carbs)}g</span>
                            <span style={{fontSize:11,color:"#fbbf24"}}>L {Math.round(m.total.fat)}g</span>
                          </div>
                          {m.advice&&(
                            <p style={{fontSize:11,color:"#3b5280",marginTop:4,lineHeight:1.5,borderTop:"1px solid #131826",paddingTop:4}}>🤖 {m.advice}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={resetDay} style={{width:"100%",marginTop:6,padding:"12px",background:"transparent",border:"1px solid #f8717118",borderRadius:13,color:"#f87171",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  🗑️ Réinitialiser la journée
                </button>
              </>
            )}
          </div>
        )}

        <p style={{textAlign:"center",marginTop:22}}>
          <button onClick={()=>{localStorage.removeItem(SK_PRO);setProfile(null);}} style={{fontSize:11,color:"#1e2235",fontWeight:600,textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}>
            Modifier le profil
          </button>
        </p>
      </div>
    </div>
  );
}
