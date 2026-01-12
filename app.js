const VERBS=["Fazer","Querer","Cuidar","Conhecer","Conversar","Compartilhar","Curtir"];
const PIN_KEY="fq5c_pin";
const DATA_KEY="fq5c_data";

function hasPIN(){return !!localStorage.getItem(PIN_KEY);}
function checkPIN(v){return localStorage.getItem(PIN_KEY)===v;}
function showPIN(){document.getElementById("pinOverlay").classList.remove("hidden");}
function hidePIN(){document.getElementById("pinOverlay").classList.add("hidden");}

document.addEventListener("DOMContentLoaded",()=>{
  if(hasPIN()) showPIN();
  document.getElementById("pinBtn").onclick=()=>{
    const v=document.getElementById("pinInput").value;
    if(checkPIN(v)) hidePIN(); else alert("Código incorreto");
  };
  document.getElementById("pinSkip").onclick=()=>hidePIN();

  const data=JSON.parse(localStorage.getItem(DATA_KEY)||"{}");
  const today=new Date().toISOString().slice(0,10);
  data[today]=data[today]||{verbs:{},memory:""};

  const verbsDiv=document.getElementById("verbs");
  VERBS.forEach(v=>{
    const d=document.createElement("div");
    d.className="verb";
    d.innerHTML=`<label><input type="checkbox"/> ${v}</label>
    <textarea placeholder="Registro livre"></textarea>`;
    const chk=d.querySelector("input");
    const ta=d.querySelector("textarea");
    chk.checked=!!data[today].verbs[v];
    ta.value=data[today].verbs[v]||"";
    chk.onchange=()=>{data[today].verbs[v]=ta.value;save();updatePresence();};
    ta.oninput=()=>{data[today].verbs[v]=ta.value;save();};
    verbsDiv.appendChild(d);
  });

  const mem=document.getElementById("memoryInput");
  mem.value=data[today].memory||"";
  mem.oninput=()=>{data[today].memory=mem.value;save();};
  document.getElementById("saveMemory").onclick=()=>alert("Memória guardada");

  function updatePresence(){
    const c=Object.values(data[today].verbs).filter(v=>v&&v.trim()).length;
    document.getElementById("presence").innerText=`Presença de hoje: ${c}/7`;
  }
  function save(){localStorage.setItem(DATA_KEY,JSON.stringify(data));}
  updatePresence();
});
