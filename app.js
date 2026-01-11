// FQ5C PWA — versão simples e funcional (offline)
// Criado por Ricardo de Faria Barros · ricardodefariobarros@gmail.com

// =====================
// Helpers básicos
// =====================
const $ = (id) => document.getElementById(id);

function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/\'/g,"&#039;");
}

function openModal(el){ el.classList.add("show"); el.setAttribute("aria-hidden","false"); }
function closeModal(el){ el.classList.remove("show"); el.setAttribute("aria-hidden","true"); }

function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function loadJSON(key, fallback){
  try{
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  }catch(e){ return fallback; }
}

function hashString(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0);
}

function pickDeterministic(arr, seed, offset=0){
  if(!arr || arr.length===0) return "";
  const idx = (seed + offset) % arr.length;
  return arr[idx];
}

function dateKey(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function todayDateKey(){ return dateKey(new Date()); }

function getISOWeekKey(d=new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}

function randInt(max){
  if(max<=0) return 0;
  if(window.crypto && crypto.getRandomValues){
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  }
  return Math.floor(Math.random() * max);
}

// =====================
// Verbos (FQ5C = 7 eixos)
// =====================
const VERBS = [
  { key:"fazer", label:"Fazer" },
  { key:"querer", label:"Querer" },
  { key:"cuidar", label:"Cuidar" },
  { key:"conhecer", label:"Conhecer" },
  { key:"conversar", label:"Conversar" },
  { key:"compartilhar", label:"Compartilhar" },
  { key:"curtir", label:"Curtir" }
];

const ICONS = {
  fazer:"🛠️",
  querer:"🎯",
  cuidar:"🫶",
  conhecer:"📚",
  conversar:"💬",
  compartilhar:"🤝",
  curtir:"🌿"
};

// =====================
// LocalStorage keys
// =====================
const LS = {
  entries: "fq5c_entries_v1",
  swaps: "fq5c_swaps_v1",
  diary: "fq5c_diary_v1",
  photos: "fq5c_photos_v1",
  missions: "fq5c_missions_v1",
  alerts: "fq5c_alerts_v1",
  weekly: "fq5c_weekly_review_v1",
  savings: "fq5c_savings_v1",
  gentleMode: "fq5c_gentle_mode_v1",
  welcomeSeen: "fq5c_welcome_seen_v1"
};

// entries[dateKey] = { statuses: {verb:"done|partial"}, notes? }
let entries = loadJSON(LS.entries, {});
let swaps = loadJSON(LS.swaps, {}); // swaps[dateKey] = {verb: offset}
let diary = loadJSON(LS.diary, []);
let photos = loadJSON(LS.photos, {}); // photos[dateKey] = { dataUrl, createdAt }
let savingsLog = loadJSON(LS.savings, []);
let weeklyReview = loadJSON(LS.weekly, { byWeek:{} });

let gentleMode = !!loadJSON(LS.gentleMode, false);

// =====================
// Banco base (geral) + PP
// (mantido — você pode expandir à vontade)
// =====================
const BANK = {
  fazer: [
    "Atividade física por 30 minutos (no seu ritmo).",
    "Dar uma volta curta e registrar mentalmente 3 coisas bonitas no caminho.",
    "Arrumar um cantinho da casa (um espaço pequeno).",
    "Organizar um arquivo pessoal (papéis, fotos, celular).",
    "Fazer uma tarefa adiada há tempo (10 minutos só).",
    "Fazer um prato simples seguindo uma receita (bem fácil, passo a passo).",
    "Fazer um registro fotográfico do dia: 3 fotos (céu, detalhe, gente/vida).",
    "Fazer uma mini-limpeza da casa: 1 superfície + 1 objeto no lugar.",
    "Fazer uma coisa com as mãos: dobrar roupas, regar plantas, consertar algo pequeno.",
    "Fazer uma página do seu livro: 'Minha História de Vida' (uma lembrança por vez)."
  ],
  querer: [
    "Definir uma micro-meta para 7 dias (bem pequena).",
    "Escrever 1 desejo e o motivo do desejo.",
    "Escolher uma prioridade do dia (uma só).",
    "Trocar 'tenho que' por 'eu escolho'.",
    "Planejar um pequeno prazer para a semana.",
    "Querer aprender algo novo: escolher 1 tema-curiosidade e dar o primeiro passo.",
    "Querer uma melhoria pequena: 'hoje eu melhoro 1% em…'.",
    "Querer conexão: escolher 1 pessoa para procurar hoje (mensagem curta já vale).",
    "Querer propósito: responder 'para que eu levanto hoje?' em uma frase.",
    "Querer leveza: decidir não alimentar culpa/mágoa hoje — só um passo possível."
  ],
  cuidar: [
    "Beber água (um copo agora).",
    "Tomar remédios no horário (se você usa).",
    "Dormir melhor hoje: reduzir telas e desacelerar.",
    "Fazer uma limpeza da alma: soltar um peso antigo em 60s.",
    "Cuidar de algo, alguém ou uma causa (um gesto real).",
    "Cuidar de um pet: carinho, água fresca, passeio ou brincadeira curta.",
    "Cuidar do corpo com um ritual simples: banho devagar ou alongamento sentado.",
    "Cuidar da alimentação: colocar mais cor no prato (uma cor a mais já conta).",
    "Cuidar do ambiente: abrir a janela e deixar o ar circular por 5 minutos.",
    "Cuidar do coração: agradecer alguém (em mensagem ou em pensamento)."
  ],
  conhecer: [
    "Ler 10 minutos (um capítulo, uma crônica).",
    "Aprender algo novo (um vídeo curto e útil).",
    "Descobrir um lugar perto de você para visitar.",
    "Pesquisar um tema que te dá curiosidade.",
    "Conhecer uma história da família e registrar.",
    "Conhecer uma receita nova e salvar no seu caderno (ou no celular).",
    "Conhecer o nome de uma planta/árvore do seu caminho (uma só).",
    "Conhecer uma palavra antiga: pesquisar significado e usar numa frase.",
    "Conhecer uma música: ouvir e descobrir de quem é e de que ano.",
    "Conhecer um grupo/atividade: procurar 1 encontro (presencial ou online)."
  ],
  conversar: [
    "Ligar para alguém e ouvir de verdade (5–10 min).",
    "Mandar mensagem carinhosa para alguém.",
    "Conversar com alguém sobre um assunto leve e bom.",
    "Pedir ajuda pequena (sem vergonha).",
    "Elogiar uma qualidade de alguém (específica).",
    "Interagir com um vizinho: um 'bom dia' com presença e sorriso.",
    "Convidar alguém para um café (em casa, padaria ou clube).",
    "Puxar papo com alguém do seu dia a dia (porteiro, atendente, motorista).",
    "Telefonar para um parente e pedir uma história antiga (e ouvir).",
    "Fazer uma 'conversa de gratidão': agradecer algo específico a alguém."
  ],
  compartilhar: [
    "Compartilhar tempo: acompanhar alguém por um momento.",
    "Compartilhar afeto: um gesto de cuidado.",
    "Compartilhar solidariedade: ajudar alguém com o possível.",
    "Doar algo útil que você não usa mais.",
    "Partilhar um aprendizado seu (uma dica).",
    "Compartilhar presença: sentar com alguém sem pressa (nem que seja 10 min).",
    "Compartilhar um registro: mandar 1 foto bonita do dia com uma frase curta.",
    "Compartilhar um pedaço de comida: oferecer algo simples (fruta, café, bolo).",
    "Compartilhar com quem sofre: uma mensagem, uma visita, uma pequena ajuda prática.",
    "Compartilhar um talento: ensinar uma coisinha (receita, truque, aplicativo)."
  ],
  curtir: [
    "Ver o céu por 1 minuto inteiro (sem pressa).",
    "Ouvir uma música que te faz bem.",
    "Saborear um café/chá devagar.",
    "Curtir um banho como ritual de paz.",
    "Curtir um encontro simples (sem obrigação).",
    "Curtir um passeio lento: caminhar sem destino por 10 minutos.",
    "Curtir um 'cinema em casa': 20 minutos de algo leve e bom.",
    "Curtir beleza: reparar 3 detalhes bonitos (cor, luz, som, cheiro).",
    "Curtir o corpo: sentar ao sol/sombra e sentir a respiração por 1 minuto.",
    "Curtir memória boa: lembrar 1 alegria antiga e sorrir por dentro."
  ]
};

const PP_BANK = {
  fazer: [
    "Fazer 10 minutos do 'começar pequeno': só iniciar já conta.",
    "Fazer um registro de vitória: anotar 1 coisa que você conseguiu hoje.",
    "Fazer um 'cuidado ativo': arrumar um cantinho que te dá paz.",
    "Fazer 5 minutos de movimento com música (movimento como alegria).",
    "Fazer um registro fotográfico intencional: 1 foto do Bom, 1 do Belo, 1 do Virtuoso.",
    "Fazer 30 minutos de movimento no seu ritmo (caminhar, dançar, alongar).",
    "Fazer um passo financeiro: separar um valor mínimo para reserva (mesmo simbólico).",
    "Fazer um passo de prevenção: checar se existe exame/consulta pendente este mês."
  ],
  querer: [
    "Querer com esperança: escrever 1 meta pequena e possível para 7 dias.",
    "Querer com sentido: completar a frase 'Meu dia fica melhor quando eu…'.",
    "Querer com direção: escolher 1 prioridade e deixar o resto para depois.",
    "Querer com propósito: 'Eu quero porque isso me aproxima de…'.",
    "Querer curiosidade: escolher 1 coisa para aprender hoje (bem pequena).",
    "Querer autonomia: definir uma micro-meta financeira para 30 dias (valor mínimo).",
    "Querer leveza mental: decidir não alimentar culpa hoje — aprender e seguir."
  ],
  cuidar: [
    "Cuidar com gentileza: falar consigo como falaria com um amigo querido.",
    "Cuidar do emocional: nomear a emoção do momento (sem brigar com ela).",
    "Cuidar com espiritualidade: 2 minutos de prece/mantra/silêncio.",
    "Cuidar do perdão possível: soltar 1 grão de rancor (sem se violentar).",
    "Cuidar do sal: reduzir um excesso hoje (um item a menos já é vitória).",
    "Cuidar do açúcar: fazer uma troca possível (menos doce, mais fruta/água).",
    "Cuidar do álcool: hoje, se beber, beber menos — ou escolher zero.",
    "Limpeza da alma (60s): nomeie a culpa/mágoa, diga 'aprendo e sigo', escolha 1 passo possível."
  ],
  conhecer: [
    "Conhecer forças pessoais: lembrar 1 qualidade sua em ação hoje.",
    "Conhecer gratidão: descobrir 1 forma nova de agradecer alguém.",
    "Conhecer sentido: ler 1 parágrafo que te eleve (fé/poema/crônica).",
    "Conhecer 'saborear': comer devagar por 5 minutos.",
    "Conhecer seu calendário preventivo: anotar quais exames precisa fazer e quando.",
    "Conhecer um rótulo: olhar só 1 item (sal/açúcar/gordura) antes de escolher."
  ],
  conversar: [
    "Conversar com conexão: perguntar 'como você está de verdade?' e escutar.",
    "Conversar com gratidão: agradecer algo específico a alguém.",
    "Conversar com afeto: dizer 'pensei em você' do seu jeito.",
    "Conversar para fortalecer: reconhecer uma qualidade do outro.",
    "Conversar com vizinhos como ritual de pertencimento: um 'bom dia' presente."
  ],
  compartilhar: [
    "Compartilhar bondade: fazer 1 ato de gentileza anônimo.",
    "Compartilhar esperança: mandar uma mensagem que levante alguém.",
    "Compartilhar vínculo: visitar/ligar para alguém que anda sozinho.",
    "Compartilhar propósito: ajudar alguém com uma coisa prática.",
    "Compartilhar história: escrever 1 parágrafo autobiográfico e enviar a alguém da família."
  ],
  curtir: [
    "Curtir e saborear: escolher um momento e viver devagar (sem pressa).",
    "Curtir com gratidão: anotar 3 coisas boas do dia (simples).",
    "Curtir beleza: olhar uma planta/foto/pôr do sol por 1 minuto inteiro.",
    "Curtir orgulho manso: reconhecer uma pequena evolução sua.",
    "Bom-Belo-Virtuoso (30s): notar 1 coisa boa, 1 coisa bela e 1 atitude virtuosa agora."
  ]
};

// =====================
// Modo “Dias Difíceis” — baixa energia, mais gentileza
// (use quando estiver cansado, triste, doente, sem ânimo)
// =====================
const GENTLE_BANK = {
  fazer: [
    "Fazer o mínimo possível: levantar, beber água e respirar 3 vezes.",
    "Fazer 3 minutos de alongamento sentado (pescoço e ombros).",
    "Fazer uma micro-ordem: colocar 3 coisas no lugar.",
    "Fazer uma pequena higiene do espaço: limpar só uma superfície.",
    "Fazer um mini-passeio até a janela/porta e olhar o mundo por 30 segundos.",
    "Fazer uma receita 'de um passo': fruta + iogurte (ou o que você tiver).",
    "Fazer uma foto do dia (uma só) e pronto.",
    "Fazer um carinho num pet/numa planta por 1 minuto.",
    "Fazer uma página 'mini' da autobiografia: 3 linhas apenas.",
    "Fazer um cuidado do corpo: banho morno ou lavar o rosto devagar."
  ],
  querer: [
    "Querer só por hoje: escolher 1 coisa pequena para sustentar.",
    "Querer descanso sem culpa: permitir-se pausar um pouco.",
    "Querer um contato: mandar um 'oi' para alguém (sem conversa longa).",
    "Querer alívio: pensar em 1 coisa que te acalma e fazer por 2 minutos.",
    "Querer esperança: escrever 'eu vou ficar melhor' e assinar embaixo.",
    "Querer curiosidade leve: pesquisar uma palavra ou uma música (2 minutos).",
    "Querer orientação: escolher 1 prioridade e dizer 'o resto fica pra depois'.",
    "Querer gentileza: falar consigo com carinho (uma frase).",
    "Querer presença: 'agora eu volto para o meu corpo' (respirar 5 vezes).",
    "Querer um pequeno amanhã: combinar um café simples com alguém (sem data fixa)."
  ],
  cuidar: [
    "Cuidar com água: um copo agora.",
    "Cuidar do remédio (se usa): checar o horário.",
    "Cuidar do corpo: sentar confortável e relaxar a mandíbula.",
    "Cuidar do emocional: nomear a emoção (sem brigar).",
    "Cuidar do sono hoje: diminuir telas 15 minutos antes de dormir.",
    "Cuidar da alimentação: uma fruta ou uma sopa simples (o que for possível).",
    "Cuidar do sal/açúcar: reduzir uma coisinha (um gesto, não um sacrifício).",
    "Cuidar com espiritualidade: 1 minuto de prece/silêncio.",
    "Cuidar da alma: dizer 'aprendo e sigo' para uma culpa antiga.",
    "Cuidar do ambiente: abrir a janela por 2 minutos."
  ],
  conhecer: [
    "Conhecer sem esforço: ler 1 parágrafo (só um).",
    "Conhecer uma curiosidade rápida: 'o que é isso?' e pesquisar 1 minuto.",
    "Conhecer uma foto antiga e lembrar uma alegria.",
    "Conhecer uma música e ouvir em silêncio.",
    "Conhecer uma palavra bonita e guardar.",
    "Conhecer um aplicativo/função do celular: aprender 1 coisa.",
    "Conhecer o próprio corpo: notar respiração e postura por 30 segundos.",
    "Conhecer um tema de fé/poesia: uma frase que eleve.",
    "Conhecer um lugar perto: olhar no mapa (sem sair de casa).",
    "Conhecer um grupo: ver horários de um encontro (sem obrigação de ir)."
  ],
  conversar: [
    "Conversar curto: mandar um 'pensei em você'.",
    "Conversar com um vizinho: um bom dia com presença.",
    "Conversar pedindo colo: 'hoje não tô bem, só queria um oi'.",
    "Conversar agradecendo: uma frase de gratidão.",
    "Conversar sem peso: falar de algo leve por 2 minutos.",
    "Conversar por áudio de 15 segundos.",
    "Conversar com você mesmo: 'eu estou aqui' (em voz baixa).",
    "Conversar com alguém do cotidiano (atendente/porteiro) com gentileza.",
    "Conversar com a família: pedir uma história antiga (e só ouvir).",
    "Conversar e encerrar: 'obrigado por me ouvir' (sem ruminar)."
  ],
  compartilhar: [
    "Compartilhar um sorriso, um bom dia ou uma gentileza.",
    "Compartilhar uma foto bonita do dia com uma frase curta.",
    "Compartilhar uma oração/pensamento bom por alguém.",
    "Compartilhar presença: sentar ao lado de alguém por 5 minutos.",
    "Compartilhar um pedaço de comida/um café simples.",
    "Compartilhar uma dica útil (sem ensinar demais).",
    "Compartilhar tempo no telefone: 3 minutos valem.",
    "Compartilhar cuidado com alguém sozinho: mensagem breve.",
    "Compartilhar algo que você não usa (um item).",
    "Compartilhar um abraço (quando possível)."
  ],
  curtir: [
    "Curtir o agora: olhar o céu por 30 segundos.",
    "Curtir um café/chá devagar (3 goles conscientes).",
    "Curtir uma música (uma só).",
    "Curtir um banho como abraço do corpo.",
    "Curtir beleza: notar 1 detalhe bonito na casa.",
    "Curtir uma memória boa: lembrar e sorrir por dentro.",
    "Curtir o corpo: relaxar ombros e respirar 5 vezes.",
    "Curtir um minuto de silêncio.",
    "Curtir o cheiro de algo (café, sabonete, comida).",
    "Curtir sem culpa: descansar 10 minutos."
  ]
};

// =====================
// Month boosts (simples)
// =====================
const PP_MONTH_BOOSTS = {
  1: { // Janeiro
    fazer:["Fazer um começo pequeno por dia (10 minutos)."],
    querer:["Querer direção: escolher 1 prioridade da semana."],
    cuidar:["Cuidar do corpo com água e sono."],
    conhecer:["Conhecer um tema que te dá curiosidade."],
    conversar:["Conversar para reaproximar: 'pode falar 5 min?'"],
    compartilhar:["Compartilhar presença com alguém que anda só."],
    curtir:["Curtir o simples: céu, café, música."]
  },
  12: { // Dezembro
    fazer:["Fazer revisão do ano: 5 coisas que você fez bem."],
    querer:["Querer recomeçar: 1 desejo simples para o próximo ano."],
    cuidar:["Cuidar da alma: gratidão e prece/silêncio."],
    conhecer:["Conhecer sua história: escrever uma lembrança do ano."],
    conversar:["Conversar para agradecer com detalhes."],
    compartilhar:["Compartilhar presença com quem está só."],
    curtir:["Curtir beleza do simples."]
  }
};

function mergeBanks(a, b){
  const out = {};
  for(const v of VERBS){
    out[v.key] = [...(a?.[v.key]||[]), ...(b?.[v.key]||[])];
  }
  return out;
}

function getMonthBankForDate(dKey){
  const mm = Number(dKey.split("-")[1]);
  const ppMonth = PP_MONTH_BOOSTS[mm] || null;
  // Ordem: PP do mês, PP universal, geral
  const merged1 = mergeBanks(ppMonth, PP_BANK);
  const merged2 = mergeBanks(merged1, BANK);
  return merged2;
}

function getActiveBankForDate(dKey){
  const base = getMonthBankForDate(dKey);
  if(!gentleMode) return base;
  // Dias difíceis: começa pelo banco gentil e depois cai no padrão
  return mergeBanks(GENTLE_BANK, base);
}

// =====================
// Equilíbrio recente (ajuste automático)
// =====================
function recentBalance(daysBack = 7){
  const now = new Date();
  const totals = {};
  for(const v of VERBS) totals[v.key] = { any:0 };

  for(let i=0;i<daysBack;i++){
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
    const k = dateKey(d);
    const e = entries[k];
    const st = e?.statuses || {};
    for(const v of VERBS){
      const val = st[v.key];
      if(val === "done" || val === "partial") totals[v.key].any++;
    }
  }
  return totals;
}

function priorityVerbsForBalance(){
  const t = recentBalance(7);
  const scored = VERBS.map(v => ({ key:v.key, any:t[v.key].any }))
    .sort((a,b)=> a.any - b.any);
  return scored.slice(0,2).map(x=>x.key);
}

function computeSuggestionsForDate(dKey){
  const seed = hashString(dKey);
  const daySwaps = swaps[dKey] || {};
  const bank = getActiveBankForDate(dKey);

  const prio = new Set(priorityVerbsForBalance());
  const sugg = {};
  for(const v of VERBS){
    const offset = Number(daySwaps[v.key] || 0);
    const arr = bank[v.key] || [];
    // prioridade: em modo normal, puxa levemente para verbos menos feitos
    const extra = (!gentleMode && prio.has(v.key)) ? -1 : 0;
    const pickOffset = Math.max(0, offset + extra);
    sugg[v.key] = pickDeterministic(arr, seed ^ hashString(v.key), pickOffset);
  }
  return sugg;
}

// =====================
// Render do dia (hoje)
// =====================
const todayPanel = $("todayPanel");
const btnOpenToday = $("btnOpenToday");
const btnToday = $("btnToday");
const dayModal = $("dayModal");
const btnCloseDay = $("btnCloseDay");
const dayTitle = $("dayTitle");
const dayContent = $("dayContent");

function ensureEntry(k){
  entries[k] = entries[k] || { statuses:{}, notes:{}, expenses:[], avoided:null };
  entries[k].statuses = entries[k].statuses || {};
  entries[k].notes = entries[k].notes || {};
  entries[k].expenses = entries[k].expenses || [];
  if(typeof entries[k].avoided === "undefined") entries[k].avoided = null;
  return entries[k];
}


/* =====================
   Finanças (Gastos do dia)
   ===================== */
function parseMoneyBR(v){
  const s = String(v ?? "").trim().replace(/\./g,"").replace(",",".").replace(/[^0-9.\-]/g,"");
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}
function formatBRL(n){
  try{
    return (n||0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }catch(e){
    return "R$ " + (n||0).toFixed(2).replace(".",",");
  }
}
function addExpense(dayKey, reason, value, category){
  const e = ensureEntry(dayKey);
  const v = parseMoneyBR(value);
  const r = (reason || "").trim();
  if(!r) return { ok:false, msg:"Informe o motivo do gasto." };
  if(!isFinite(v) || v <= 0) return { ok:false, msg:"Informe um valor válido (ex.: 12,50)." };

  e.expenses.push({
    reason: r,
    value: v,
    category: (category || "").trim(),
    ts: Date.now()
  });
  saveJSON(LS.entries, entries);
  return { ok:true };
}
function removeExpense(dayKey, idx){
  const e = ensureEntry(dayKey);
  e.expenses.splice(idx, 1);
  saveJSON(LS.entries, entries);
}
function clearExpenses(dayKey){
  const e = ensureEntry(dayKey);
  e.expenses = [];
  saveJSON(LS.entries, entries);
}
function getExpenses(dayKey){
  return (ensureEntry(dayKey).expenses || []);
}
function setAvoided(dayKey, reason, value){
  const e = ensureEntry(dayKey);
  const r = (reason || "").trim();
  const v = String(value||"").trim() ? parseMoneyBR(value) : null;
  e.avoided = r ? { reason:r, value: (isFinite(v) && v>0) ? v : null, ts: Date.now() } : null;
  saveJSON(LS.entries, entries);
}
function getAvoided(dayKey){
  return ensureEntry(dayKey).avoided || null;
}
function weeklyExpenseSummary(endDayKey){
  const end = new Date(endDayKey + "T00:00:00");
  const keys = [];
  for(let i=6;i>=0;i--){
    const d = new Date(end);
    d.setDate(end.getDate()-i);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    keys.push(`${y}-${m}-${dd}`);
  }
  let total = 0;
  const byReason = new Map();
  const byCat = new Map();
  for(const k of keys){
    const exps = (entries[k]?.expenses) || [];
    for(const it of exps){
      total += (it.value||0);
      const rk = (it.reason||"").trim();
      if(rk) byReason.set(rk, (byReason.get(rk)||0) + (it.value||0));
      const ck = (it.category||"").trim() || "Sem categoria";
      byCat.set(ck, (byCat.get(ck)||0) + (it.value||0));
    }
  }
  const topReasons = [...byReason.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topCats = [...byCat.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  return { keys, total, topReasons, topCats };
}
function exportExpensesCSV(daysBack=30){
  const rows = [["data","motivo","categoria","valor"]];
  const d0 = new Date();
  d0.setHours(0,0,0,0);

  for(let i=daysBack-1;i>=0;i--){
    const d = new Date(d0);
    d.setDate(d0.getDate()-i);
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const dd=String(d.getDate()).padStart(2,"0");
    const k=`${y}-${m}-${dd}`;
    const exps = (entries[k]?.expenses) || [];
    for(const it of exps){
      rows.push([k, (it.reason||"").replace(/
/g," "), (it.category||""), String(it.value||0).replace(".",",")]);
    }
  }
  const csv = rows.map(r => r.map(cell => {
    const s = String(cell ?? "");
    const safe = s.includes('"') ? s.replace(/"/g,'""') : s;
    return (safe.includes(",") || safe.includes("
") || safe.includes('"')) ? `"${safe}"` : safe;
  }).join(",")).join("
");

  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fq5c_gastos_${daysBack}d.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}


function setStatus(dayKey, verbKey, status){
  const e = ensureEntry(dayKey);
  if(status === "") delete e.statuses[verbKey];
  else e.statuses[verbKey] = status;
  saveJSON(LS.entries, entries);
}

function bumpSwap(dayKey, verbKey, by=1){
  swaps[dayKey] = swaps[dayKey] || {};
  swaps[dayKey][verbKey] = (swaps[dayKey][verbKey] || 0) + by;
  saveJSON(LS.swaps, swaps);
}

function randomizeSuggestion(dayKey, verbKey){
  const bank = getActiveBankForDate(dayKey);
  const len = (bank[verbKey] || []).length;
  if(len <= 1){
    bumpSwap(dayKey, verbKey, 1);
    return;
  }
  swaps[dayKey] = swaps[dayKey] || {};
  const current = Number(swaps[dayKey][verbKey] || 0);
  let jump = randInt(len);
  if(jump === current) jump = (jump + 1) % len;
  swaps[dayKey][verbKey] = jump;
  saveJSON(LS.swaps, swaps);
}

function renderVerbCard({container, dayKey, verbKey, verbLabel, practiceText, status, showSwap=true, compact=false}){
  const card = document.createElement("div");
  card.className = "pill";

  card.innerHTML = `
    <div class="pill-head">
      <div class="verb-chip">
        <div class="verb-icon">${ICONS[verbKey] || "•"}</div>
        <div class="verb-label">${verbLabel}</div>
      </div>
      ${showSwap ? `<button class="secondary" data-act="roll">🎲 Sortear</button>` : ``}
    </div>
    <div class="practice-text">${practiceText || ""}</div>
    <div class="card-actions"></div>
  `;

  const actions = card.querySelector(".card-actions");
  const opts = compact
    ? [
        {key:"done", label:"Fiz"},
        {key:"partial", label:"Em parte"}
      ]
    : [
        {key:"done", label:"Fiz"},
        {key:"partial", label:"Em parte"},
        {key:"", label:"Em branco"}
      ];

  for(const opt of opts){
    const b = document.createElement("button");
    b.className = "mtask-pill" + (status === opt.key ? " active":"");
    b.textContent = opt.label;
    b.onclick = () => {
      setStatus(dayKey, verbKey, opt.key);
      renderTodayMini();
      if(dayModal.classList.contains("show")) renderDayPanel(dayKey);
    };
    actions.appendChild(b);
  }

  // clear button in compact mode
  if(compact){
    const b = document.createElement("button");
    b.className = "mtask-pill";
    b.textContent = "Limpar";
    b.onclick = () => {
      setStatus(dayKey, verbKey, "");
      renderTodayMini();
      if(dayModal.classList.contains("show")) renderDayPanel(dayKey);
    };
    actions.appendChild(b);
  }

  if(showSwap){
    const rollBtn = card.querySelector('[data-act="roll"]');
    rollBtn.onclick = () => {
      randomizeSuggestion(dayKey, verbKey);
      renderTodayMini();
      if(dayModal.classList.contains("show")) renderDayPanel(dayKey);
    };
  }

  container.appendChild(card);
}

function renderTodayMini(){
  const k = todayDateKey();
  const sugg = computeSuggestionsForDate(k);
  const e = ensureEntry(k);

  todayPanel.innerHTML = "";
  for(const v of VERBS){
    renderVerbCard({
      container: todayPanel,
      dayKey: k,
      verbKey: v.key,
      verbLabel: v.label,
      practiceText: sugg[v.key],
      status: e.statuses[v.key] || "",
      showSwap: true,
      compact: true
    });
  }
}

function renderDayPanel(k){
  const d = new Date(k + "T00:00:00");
  dayTitle.textContent = `Dia • ${d.toLocaleDateString()}`;

  const sugg = computeSuggestionsForDate(k);
  const e = ensureEntry(k);

  dayContent.innerHTML = "";

  // Foto do dia (se existir)
  const ph = photos[k]?.dataUrl;
  const photoBox = document.createElement("div");
  photoBox.className = "pill";
  photoBox.innerHTML = `
    <div class="pill-head">
      <div class="verb-chip">
        <div class="verb-icon">📷</div>
        <div class="verb-label">Foto do dia</div>
      </div>
      <button class="secondary" id="btnOpenDiaryFromDay">Abrir Diário</button>
    </div>
    <div class="practice-text">${ph ? "Foto salva para este dia." : "Sem foto ainda. Você pode registrar no Diário de Bordo."}</div>
    ${ph ? `<div style="margin-top:10px"><img alt="Foto do dia" src="${ph}" style="width:100%;max-height:260px;object-fit:cover;border-radius:16px;border:1px solid var(--line)"></div>` : ``}
  `;
  dayContent.appendChild(photoBox);
  photoBox.querySelector("#btnOpenDiaryFromDay").onclick = () => btnDiary?.click?.();


// Gastos do dia (agenda financeira simples)
const financeBox = document.createElement("div");
financeBox.className = "pill";
financeBox.innerHTML = `
  <div class="pill-head">
    <div class="verb-chip">
      <div class="verb-icon">💰</div>
      <div class="verb-label">Gastos do dia</div>
    </div>
    <div class="pill-actions">
      <button class="secondary" id="btnExportCSV">Exportar CSV (30d)</button>
    </div>
  </div>

  <div class="grid2" style="margin-top:10px">
    <input id="expReason" type="text" placeholder="Motivo do gasto (ex.: mercado, remédio, café)" />
    <input id="expValue" type="text" inputmode="decimal" placeholder="Valor (R$) ex.: 12,50" />
  </div>

  <div class="grid2" style="margin-top:10px">
    <select id="expCat">
      <option value="">Categoria (opcional)</option>
      <option>Essencial</option>
      <option>Saúde</option>
      <option>Casa</option>
      <option>Transporte</option>
      <option>Lazer</option>
      <option>Outros</option>
    </select>
    <div class="row" style="gap:10px; justify-content:flex-end">
      <button class="primary" id="btnAddExp">Adicionar</button>
      <button class="ghost" id="btnClearExp">Limpar</button>
    </div>
  </div>

  <div class="muted" id="expMsg" style="margin-top:8px"></div>

  <div class="table-wrap">
    <table class="table" id="expTable">
      <thead>
        <tr>
          <th>Motivo</th>
          <th>R$</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td><strong>Total do dia</strong></td>
          <td id="expTotal"><strong>R$ 0,00</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="note-wrap" style="margin-top:12px">
    <div class="note-label">Gasto evitado hoje (vitória silenciosa)</div>
    <div class="grid2">
      <input id="avoReason" type="text" placeholder="Ex.: não comprei doce / não pedi delivery" />
      <input id="avoValue" type="text" inputmode="decimal" placeholder="Valor evitado (opcional) ex.: 35,00" />
    </div>
    <div class="row" style="justify-content:flex-end; margin-top:10px">
      <button class="secondary" id="btnSaveAvoided">Salvar</button>
    </div>
    <div class="muted" id="avoMsg" style="margin-top:6px"></div>
  </div>

  <div class="note-wrap" style="margin-top:12px">
    <div class="note-label">Resumo da semana (últimos 7 dias)</div>
    <div id="weekSummary" class="practice-text"></div>
  </div>
`;
dayContent.appendChild(financeBox);

function renderExpensesUI(){
  const tbody = financeBox.querySelector("#expTable tbody");
  const totalEl = financeBox.querySelector("#expTotal");
  const list = getExpenses(k);
  tbody.innerHTML = "";
  let total = 0;

  list.forEach((it, idx) => {
    total += (it.value||0);
    const tr = document.createElement("tr");
    const cat = it.category ? `<span class="tag">${escapeHtml(it.category)}</span>` : ``;
    tr.innerHTML = `
      <td>${escapeHtml(it.reason)} ${cat}</td>
      <td>${formatBRL(it.value||0)}</td>
      <td><button class="ghost small" data-del="${idx}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });

  totalEl.innerHTML = `<strong>${formatBRL(total)}</strong>`;

  tbody.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      removeExpense(k, Number(btn.getAttribute("data-del")));
      renderExpensesUI();
      renderWeekSummary();
    });
  });
}

function renderWeekSummary(){
  const sumEl = financeBox.querySelector("#weekSummary");
  const s = weeklyExpenseSummary(k);
  const lines = [];
  lines.push(`<strong>Total na semana:</strong> ${formatBRL(s.total)}`);

  if(s.topCats.length){
    lines.push(`<div style="margin-top:8px"><strong>Top categorias:</strong></div>`);
    lines.push(`<ul class="mini-list">` + s.topCats.map(([c,v])=>`<li>${escapeHtml(c)} • ${formatBRL(v)}</li>`).join("") + `</ul>`);
  }
  if(s.topReasons.length){
    lines.push(`<div style="margin-top:8px"><strong>Top motivos:</strong></div>`);
    lines.push(`<ul class="mini-list">` + s.topReasons.map(([r,v])=>`<li>${escapeHtml(r)} • ${formatBRL(v)}</li>`).join("") + `</ul>`);
  }

  const av = getAvoided(k);
  if(av){
    lines.push(`<div style="margin-top:8px"><strong>Gasto evitado hoje:</strong> ${escapeHtml(av.reason)}${(av.value?` • ${formatBRL(av.value)}`:"")}</div>`);
  }
  sumEl.innerHTML = lines.join("");
}

// Wire finance controls
const expReason = financeBox.querySelector("#expReason");
const expValue = financeBox.querySelector("#expValue");
const expCat = financeBox.querySelector("#expCat");
const expMsg = financeBox.querySelector("#expMsg");
const btnAddExp = financeBox.querySelector("#btnAddExp");
const btnClearExp = financeBox.querySelector("#btnClearExp");
const btnExportCSV = financeBox.querySelector("#btnExportCSV");

btnAddExp.onclick = () => {
  const res = addExpense(k, expReason.value, expValue.value, expCat.value);
  expMsg.textContent = res.ok ? "" : res.msg;
  if(res.ok){
    expReason.value = "";
    expValue.value = "";
    expCat.value = "";
    renderExpensesUI();
    renderWeekSummary();
    expReason.focus();
  }
};
btnClearExp.onclick = () => {
  if(confirm("Limpar todos os gastos deste dia?")){
    clearExpenses(k);
    renderExpensesUI();
    renderWeekSummary();
  }
};
btnExportCSV.onclick = () => exportExpensesCSV(30);

[expReason, expValue].forEach(el=>{
  el.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") btnAddExp.click();
  });
});

// Avoided
const avoReason = financeBox.querySelector("#avoReason");
const avoValue = financeBox.querySelector("#avoValue");
const avoMsg = financeBox.querySelector("#avoMsg");
const btnSaveAvoided = financeBox.querySelector("#btnSaveAvoided");
const existingAvoided = getAvoided(k);
if(existingAvoided){
  avoReason.value = existingAvoided.reason || "";
  avoValue.value = existingAvoided.value ? String(existingAvoided.value).replace(".",",") : "";
}
btnSaveAvoided.onclick = () => {
  setAvoided(k, avoReason.value, avoValue.value);
  avoMsg.textContent = "Salvo.";
  setTimeout(()=>{ avoMsg.textContent=""; }, 1200);
  renderWeekSummary();
};

renderExpensesUI();
renderWeekSummary();


  for(const v of VERBS){
    renderVerbCard({
      container: dayContent,
      dayKey: k,
      verbKey: v.key,
      verbLabel: v.label,
      practiceText: sugg[v.key],
      status: e.statuses[v.key] || "",
      showSwap: true,
      compact: false
    });
  }
}

btnOpenToday.onclick = () => {
  const k = todayDateKey();
  renderDayPanel(k);
  openModal(dayModal);
};
btnToday.onclick = btnOpenToday.onclick;
btnCloseDay.onclick = () => closeModal(dayModal);

// =====================
// Modo “Dias Difíceis” — UI
// =====================
const toggleGentleMode = $("toggleGentleMode");
if(toggleGentleMode){
  toggleGentleMode.checked = gentleMode;
  toggleGentleMode.onchange = () => {
    gentleMode = !!toggleGentleMode.checked;
    saveJSON(LS.gentleMode, gentleMode);
    // quando liga o modo gentil, dá um “respiro” nas sugestões de hoje
    renderTodayMini();
    if(dayModal.classList.contains("show")) renderDayPanel(todayDateKey());
  };
}

// =====================
// Mês
// =====================
const btnMonth = $("btnMonth");
const monthModal = $("monthModal");
const btnCloseMonth = $("btnCloseMonth");
const btnPrevMonth = $("btnPrevMonth");
const btnNextMonth = $("btnNextMonth");
const monthLabel = $("monthLabel");
const monthGrid = $("monthGrid");
const monthHint = $("monthHint");

let monthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function renderMonth(){
  const y = monthCursor.getFullYear();
  const m = monthCursor.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m+1, 0);
  monthLabel.textContent = first.toLocaleDateString(undefined, { month:"long", year:"numeric" });

  const startDow = first.getDay();
  const daysInMonth = last.getDate();

  monthGrid.innerHTML = "";

  const prevLast = new Date(y, m, 0).getDate();
  for(let i=0;i<startDow;i++){
    const d = document.createElement("div");
    d.className = "day off";
    d.textContent = String(prevLast - (startDow-1-i));
    monthGrid.appendChild(d);
  }

  const todayK = todayDateKey();

  for(let day=1; day<=daysInMonth; day++){
    const dk = dateKey(new Date(y, m, day));
    const d = document.createElement("div");
    const e = entries[dk];
    const any = e && Object.keys(e.statuses||{}).length>0;
    d.className = "day" + (any ? " done":"") + (dk===todayK ? " sel":"");
    d.textContent = String(day);
    d.onclick = () => {
      renderDayPanel(dk);
      openModal(dayModal);
    };
    monthGrid.appendChild(d);
  }

  const cells = startDow + daysInMonth;
  const tail = (7 - (cells % 7)) % 7;
  for(let i=1;i<=tail;i++){
    const d = document.createElement("div");
    d.className = "day off";
    d.textContent = String(i);
    monthGrid.appendChild(d);
  }

  monthHint.textContent = "Dica: clique em um dia para abrir o painel e marcar o possível.";
}

btnMonth.onclick = () => { renderMonth(); openModal(monthModal); };
btnCloseMonth.onclick = () => closeModal(monthModal);
btnPrevMonth.onclick = () => { monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth()-1, 1); renderMonth(); };
btnNextMonth.onclick = () => { monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 1); renderMonth(); };

// =====================
// Missões Semanais (Combate)
// =====================
const MISSIONS = [
  {
    id: "anti_isolamento",
    title: "Contra o isolamento",
    kicker: "Missão combativa",
    desc: "Fortalecer conexões humanas reais, com leveza e presença.",
    tasks: {
      fazer: "Sair de casa ao menos 3 vezes na semana (nem que seja um passeio curto).",
      querer: "Escolher se aproximar de uma pessoa (um passo real).",
      cuidar: "Cuidar do vínculo: lembrar alguém, responder com carinho, manter contato.",
      conhecer: "Descobrir algo novo sobre alguém (uma pergunta que aproxime).",
      conversar: "Fazer 3 conversas reais (voz ou presença).",
      compartilhar: "Compartilhar tempo e escuta (sem pressa, sem conselho).",
      curtir: "Rir junto pelo menos uma vez (mensagem, áudio, encontro)."
    }
  },
  {
    id: "saude_preventiva",
    title: "Saúde preventiva (combate silencioso)",
    kicker: "Missão combativa",
    desc: "Reduzir excessos (sal, açúcar, álcool, gorduras), mover o corpo e organizar exames. Sem radicalismo: constância possível.",
    tasks: {
      fazer: "Mover o corpo 10–30 minutos em 4 dias da semana (o possível).",
      querer: "Definir 1 micro-meta de saúde para 7 dias (ex.: água, caminhada, sono).",
      cuidar: "Reduzir um excesso hoje (sal OU açúcar OU álcool OU gordura) — escolha 1.",
      conhecer: "Conferir/planejar exames e consultas (listar o que está pendente).",
      conversar: "Falar com alguém sobre saúde (médico/familiar/amigo) sem adiar.",
      compartilhar: "Convidar alguém para caminhar ou fazer um pacto leve de saúde.",
      curtir: "Notar melhora pequena e celebrar (energia, sono, humor, disposição)."
    }
  },
  {
    id: "autonomia_financeira",
    title: "Autonomia financeira mínima",
    kicker: "Missão combativa",
    desc: "Criar chão: reserva mínima, controle simples e menos ansiedade com dinheiro. Pequenos passos, consistência.",
    tasks: {
      fazer: "Separar um valor mínimo (mesmo simbólico) para sua reserva.",
      querer: "Definir um objetivo simples: 'minha reserva é para…'.",
      cuidar: "Evitar um gasto impulsivo nesta semana (um só já vale).",
      conhecer: "Anotar despesas fixas e 1 gasto que pode reduzir.",
      conversar: "Conversar com alguém de confiança sobre planejamento (sem vergonha).",
      compartilhar: "Ajudar alguém com orientação prática (sem bancar salvador).",
      curtir: "Curtir a tranquilidade de ter um plano (mesmo pequeno)."
    }
  },
  {
    id: "anti_apatia",
    title: "Contra a apatia",
    kicker: "Missão combativa",
    desc: "Quebrar a inércia com começos pequenos. Movimento gera ânimo.",
    tasks: {
      fazer: "Começar algo pequeno todos os dias (10 minutos contam).",
      querer: "Escrever um motivo do dia: 'eu quero porque…'.",
      cuidar: "Respeitar limites e ainda assim se mexer um pouco.",
      conhecer: "Aprender algo simples (10 minutos).",
      conversar: "Falar do desânimo sem vergonha com alguém de confiança.",
      compartilhar: "Dividir incentivo com alguém (uma frase já ajuda).",
      curtir: "Celebrar qualquer passo (sem se cobrar perfeição)."
    }
  }
];

function pickMissionForWeek(weekKey){
  const seed = hashString("mission::" + weekKey);
  const idx = seed % MISSIONS.length;
  return MISSIONS[idx];
}

let missionsState = loadJSON(LS.missions, {
  currentWeekKey: null,
  currentMissionId: null,
  progress: {},
  history: []
});

function ensureMissionForThisWeek(){
  const wk = getISOWeekKey(new Date());
  if(missionsState.currentWeekKey !== wk){
    if(missionsState.currentWeekKey && missionsState.currentMissionId){
      missionsState.history.unshift({
        weekKey: missionsState.currentWeekKey,
        missionId: missionsState.currentMissionId,
        progress: missionsState.progress || {},
        savedAt: new Date().toISOString()
      });
      missionsState.history = missionsState.history.slice(0, 24);
    }
    const m = pickMissionForWeek(wk);
    missionsState.currentWeekKey = wk;
    missionsState.currentMissionId = m.id;
    missionsState.progress = {};
    saveJSON(LS.missions, missionsState);
  }
}

function missionScore(progress){
  let score=0;
  for(const v of VERBS){
    const st = progress?.[v.key];
    if(st === "done") score += 2;
    else if(st === "partial") score += 1;
  }
  const max = VERBS.length * 2;
  const pct = Math.round((score / max) * 100);
  return { score, max, pct };
}

const missionModal = $("missionModal");
const missionHistoryModal = $("missionHistoryModal");
const btnMission = $("btnMission");
const btnCloseMission = $("btnCloseMission");
const btnResetMission = $("btnResetMission");
const btnMissionHistory = $("btnMissionHistory");
const btnCloseMissionHistory = $("btnCloseMissionHistory");
const elMissionTitle = $("missionTitle");
const elMissionKicker = $("missionKicker");
const elMissionDesc = $("missionDesc");
const elMissionBar = $("missionBar");
const elMissionProgressText = $("missionProgressText");
const elMissionTasks = $("missionTasks");
const elMissionHistoryList = $("missionHistoryList");

btnMission.onclick = () => { ensureMissionForThisWeek(); openModal(missionModal); renderMission(); };
btnCloseMission.onclick = () => closeModal(missionModal);
btnResetMission.onclick = () => {
  if(!confirm("Reiniciar a missão desta semana? Isso apaga as marcações da semana atual.")) return;
  missionsState.progress = {};
  saveJSON(LS.missions, missionsState);
  renderMission();
};
btnMissionHistory.onclick = () => { renderMissionHistory(); openModal(missionHistoryModal); };
btnCloseMissionHistory.onclick = () => closeModal(missionHistoryModal);

function getCurrentMission(){
  ensureMissionForThisWeek();
  return MISSIONS.find(x => x.id === missionsState.currentMissionId) || pickMissionForWeek(missionsState.currentWeekKey);
}

function renderMission(){
  const m = getCurrentMission();
  const wk = missionsState.currentWeekKey;

  elMissionTitle.textContent = `Missão da semana • ${wk}`;
  elMissionKicker.textContent = m.kicker;
  elMissionDesc.textContent = `${m.title}: ${m.desc}`;

  const sc = missionScore(missionsState.progress);
  elMissionBar.style.width = `${sc.pct}%`;
  elMissionProgressText.textContent = `Progresso: ${sc.pct}% • (marque o possível, sem cobrança)`;

  elMissionTasks.innerHTML = "";
  for(const v of VERBS){
    const wrap = document.createElement("div");
    wrap.className = "mtask";
    const current = missionsState.progress?.[v.key] || "";
    wrap.innerHTML = `
      <div class="mtask-head"><div class="mtask-verb">${v.label}</div></div>
      <div class="mtask-text">${m.tasks[v.key] || ""}</div>
      <div class="mtask-pills"></div>
    `;
    const pills = wrap.querySelector(".mtask-pills");
    const options = [
      { key:"done", label:"Fiz" },
      { key:"partial", label:"Em parte" },
      { key:"", label:"Em branco" }
    ];
    for(const opt of options){
      const b = document.createElement("button");
      b.className = "mtask-pill" + (current === opt.key ? " active" : "");
      b.textContent = opt.label;
      b.onclick = () => {
        missionsState.progress = missionsState.progress || {};
        if(opt.key === "") delete missionsState.progress[v.key];
        else missionsState.progress[v.key] = opt.key;
        saveJSON(LS.missions, missionsState);
        renderMission();
      };
      pills.appendChild(b);
    }
    elMissionTasks.appendChild(wrap);
  }
}

function renderMissionHistory(){
  const hist = missionsState.history || [];
  elMissionHistoryList.innerHTML = "";
  if(hist.length === 0){
    elMissionHistoryList.innerHTML = "<p class='small'>Sem histórico ainda. A primeira semana já é um começo.</p>";
    return;
  }
  for(const item of hist){
    const m = MISSIONS.find(x => x.id === item.missionId);
    const sc = missionScore(item.progress);
    const div = document.createElement("div");
    div.className = "mhis";
    div.innerHTML = `
      <div class="t">${item.weekKey} • ${m ? m.title : "Missão"}</div>
      <div class="p">${m ? m.desc : ""}</div>
      <div class="chips">
        <span class="chip">${sc.pct}%</span>
        <span class="chip">${sc.score}/${sc.max} pontos de presença</span>
      </div>
    `;
    elMissionHistoryList.appendChild(div);
  }
}

// =====================
// Diário de Bordo (áudio) + Foto do dia
// =====================
const diaryModal = $("diaryModal");
const btnDiary = $("btnDiary");
const btnCloseDiary = $("btnCloseDiary");
const btnRecord = $("btnRecord");
const btnStop = $("btnStop");
const recStatus = $("recStatus");
const diaryList = $("diaryList");

btnDiary.onclick = () => { openModal(diaryModal); renderDiary(); renderPhotoUI(); };
btnCloseDiary.onclick = () => closeModal(diaryModal);

let mediaRecorder;
let audioChunks = [];

btnRecord.onclick = async () => {
  if(!navigator.mediaDevices) return alert("Gravação não suportada neste dispositivo.");
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type:"audio/webm" });
    const reader = new FileReader();
    reader.onloadend = () => {
      diary.unshift({ date: new Date().toISOString(), audio: reader.result });
      diary = diary.slice(0, 120);
      saveJSON(LS.diary, diary);
      renderDiary();
    };
    reader.readAsDataURL(blob);
  };
  mediaRecorder.start();
  btnRecord.disabled = true;
  btnStop.disabled = false;
  recStatus.textContent = "Gravando… fale com calma";
};

btnStop.onclick = () => {
  if(!mediaRecorder) return;
  mediaRecorder.stop();
  btnRecord.disabled = false;
  btnStop.disabled = true;
  recStatus.textContent = "Gravação salva";
};

function renderDiary(){
  diaryList.innerHTML = "";
  if(diary.length === 0){
    diaryList.innerHTML = "<p class='small'>Nenhum registro ainda.</p>";
    return;
  }
  diary.forEach(item => {
    const div = document.createElement("div");
    div.className = "diary-item";
    const d = new Date(item.date);
    div.innerHTML = `
      <div class="d">${d.toLocaleDateString()} · ${d.toLocaleTimeString()}</div>
      <audio controls src="${item.audio}"></audio>
    `;
    diaryList.appendChild(div);
  });
}

// ----- Fotos
const photoInput = $("photoInput");
const btnSavePhoto = $("btnSavePhoto");
const btnClearPhoto = $("btnClearPhoto");
const photoTodayPreview = $("photoTodayPreview");
const photoGallery = $("photoGallery");

async function fileToResizedDataUrl(file, maxSide=1280, quality=0.82){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = reject;
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, maxSide / Math.max(w,h));
      const nw = Math.round(w * scale);
      const nh = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, nw, nh);

      try{
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      }catch(e){
        resolve(fr.result); // fallback original
      }
    };
    img.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function savePhotoForDay(dayKey, dataUrl){
  photos[dayKey] = { dataUrl, createdAt: new Date().toISOString() };
  saveJSON(LS.photos, photos);
}

function clearPhotoForDay(dayKey){
  delete photos[dayKey];
  saveJSON(LS.photos, photos);
}

function renderPhotoUI(){
  if(!photoTodayPreview || !photoGallery) return;
  const k = todayDateKey();
  const p = photos[k]?.dataUrl;
  photoTodayPreview.innerHTML = p ? `<img alt="Foto de hoje" src="${p}">` : `<p class="small">Sem foto hoje. Que tal registrar um detalhe bom do seu dia?</p>`;
}

function renderPhotoGallery(){
  if(!photoGallery) return;
  const items = Object.entries(photos)
    .map(([k,v])=>({k, ...v}))
    .sort((a,b)=> (a.k < b.k ? 1 : -1))
    .slice(0, 90);

  if(items.length === 0){
    photoGallery.innerHTML = `<p class="small">Ainda sem fotos. Quando quiser, registre 1 por dia.</p>`;
    return;
  }

  photoGallery.innerHTML = "";
  for(const it of items){
    const d = new Date(it.k + "T00:00:00");
    const card = document.createElement("div");
    card.className = "photo-card";
    card.innerHTML = `
      <img alt="Foto do dia ${it.k}" src="${it.dataUrl}">
      <div class="cap">${d.toLocaleDateString()}</div>
    `;
    card.onclick = () => {
      // abrir o dia correspondente
      closeModal(diaryModal);
      renderDayPanel(it.k);
      openModal(dayModal);
    };
    photoGallery.appendChild(card);
  }
}

function renderPhotoUIAll(){
  renderPhotoUI();
  renderPhotoGallery();
}

if(btnSavePhoto){
  btnSavePhoto.onclick = async () => {
    const files = photoInput?.files;
    if(!files || files.length === 0){
      alert("Escolha uma foto primeiro.");
      return;
    }
    const file = files[0];
    const k = todayDateKey();
    const dataUrl = await fileToResizedDataUrl(file);
    savePhotoForDay(k, dataUrl);
    if(photoInput) photoInput.value = "";
    renderPhotoUIAll();
    if(dayModal.classList.contains("show")) renderDayPanel(k);
  };
}
if(btnClearPhoto){
  btnClearPhoto.onclick = () => {
    const k = todayDateKey();
    if(!photos[k]) return;
    if(!confirm("Remover a foto de hoje?")) return;
    clearPhotoForDay(k);
    renderPhotoUIAll();
    if(dayModal.classList.contains("show")) renderDayPanel(k);
  };
}

// =====================
// Revisão semanal + checklist (3 itens)
// =====================
const weeklyModal = $("weeklyModal");
const btnCloseWeekly = $("btnCloseWeekly");
const weeklyChecklist = $("weeklyChecklist");
const weeklyBar = $("weeklyBar");
const weeklyProgressText = $("weeklyProgressText");
const btnGoMission = $("btnGoMission");
const btnGoMonth = $("btnGoMonth");
const btnGoSavings = $("btnGoSavings");

btnCloseWeekly.onclick = () => closeModal(weeklyModal);

const WEEKLY_ITEMS = [
  { key:"health", title:"Saúde: reduzir um excesso", desc:"Escolha 1 foco na semana: menos sal OU menos açúcar OU menos álcool OU menos ultraprocessado/gorduras." },
  { key:"prevention", title:"Agenda e prevenção", desc:"Conferi exames/consultas/medicação/pressão e organizei a semana (um passo já vale)." },
  { key:"human", title:"Conexão humana", desc:"Fiz 1 contato real: mensagem carinhosa, ligação ou visita (sem pressa, sem cobrança)." }
];

function getWeeklyBucket(){
  const wk = getISOWeekKey(new Date());
  weeklyReview.byWeek[wk] = weeklyReview.byWeek[wk] || { items:{}, savedAt:new Date().toISOString() };
  return { wk, bucket: weeklyReview.byWeek[wk] };
}
function weeklyScore(items){
  let score=0;
  const max = WEEKLY_ITEMS.length * 2;
  for(const it of WEEKLY_ITEMS){
    const st = items?.[it.key];
    if(st === "done") score += 2;
    else if(st === "partial") score += 1;
  }
  const pct = Math.round((score / max) * 100);
  return { score, max, pct };
}

function renderWeeklyChecklist(){
  const { wk, bucket } = getWeeklyBucket();
  weeklyChecklist.innerHTML = "";
  for(const it of WEEKLY_ITEMS){
    const div = document.createElement("div");
    div.className = "witem";
    const current = bucket.items?.[it.key] || "";
    div.innerHTML = `
      <div class="t">${it.title}</div>
      <div class="p">${it.desc}</div>
      <div class="pills"></div>
    `;
    const pills = div.querySelector(".pills");
    const options = [
      { key:"done", label:"Fiz" },
      { key:"partial", label:"Em parte" },
      { key:"", label:"Em branco" }
    ];
    for(const opt of options){
      const b = document.createElement("button");
      b.className = "mtask-pill" + (current === opt.key ? " active" : "");
      b.textContent = opt.label;
      b.onclick = () => {
        bucket.items = bucket.items || {};
        if(opt.key === "") delete bucket.items[it.key];
        else bucket.items[it.key] = opt.key;
        bucket.savedAt = new Date().toISOString();
        weeklyReview.byWeek[wk] = bucket;
        saveJSON(LS.weekly, weeklyReview);
        renderWeeklyChecklist();
      };
      pills.appendChild(b);
    }
    weeklyChecklist.appendChild(div);
  }

  const sc = weeklyScore(bucket.items);
  weeklyBar.style.width = `${sc.pct}%`;
  weeklyProgressText.textContent = `Progresso da semana: ${sc.pct}% • presença, não perfeição`;
}

function openWeeklyPanel(){
  openModal(weeklyModal);
  renderWeeklyChecklist();
}

// =====================
// Poupança mínima
// =====================
const savingsModal = $("savingsModal");
const btnCloseSavings = $("btnCloseSavings");
const savingsAmount = $("savingsAmount");
const btnSaveSavings = $("btnSaveSavings");
const savingsHint = $("savingsHint");
const savingsMonth = $("savingsMonth");

btnCloseSavings.onclick = () => closeModal(savingsModal);

function currentYM(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function openSavings(){
  openModal(savingsModal);
  renderSavings();
}
function renderSavings(){
  const todayKey = todayDateKey();
  const ym = currentYM();
  const monthItems = savingsLog.filter(x => (x.date || "").startsWith(ym));
  const total = monthItems.reduce((s,x)=> s + (Number(x.amount)||0), 0);
  const todayItem = savingsLog.find(x => x.date === todayKey);
  if(todayItem) savingsHint.textContent = `Hoje já foi registrado: ${Number(todayItem.amount).toFixed(2)}`;
  else savingsHint.textContent = `Nenhum registro hoje. Se guardar um pouquinho, já vale.`;
  savingsMonth.textContent = `Total guardado em ${ym}: ${total.toFixed(2)} (${monthItems.length} registro(s))`;
}
btnSaveSavings.onclick = () => {
  const raw = String(savingsAmount.value || "0").replace(",", ".");
  const val = Number(raw);
  if(!isFinite(val) || val < 0){
    alert("Digite um valor válido (0 ou mais).");
    return;
  }
  const todayKey = todayDateKey();
  savingsLog = savingsLog.filter(x => x.date !== todayKey);
  savingsLog.unshift({ date: todayKey, amount: val });
  savingsLog = savingsLog.slice(0, 400);
  saveJSON(LS.savings, savingsLog);
  savingsAmount.value = "";
  renderSavings();
};

// Botões do painel semanal
if(btnGoMission) btnGoMission.onclick = () => { closeModal(weeklyModal); btnMission.onclick(); };
if(btnGoMonth) btnGoMonth.onclick = () => { closeModal(weeklyModal); btnMonth.onclick(); };
if(btnGoSavings) btnGoSavings.onclick = () => { closeModal(weeklyModal); openSavings(); };

// =====================
// Alertas opcionais + semanal
// =====================
const alertsModal = $("alertsModal");

const btnJourney = $("btnJourney");
const journeyModal = $("journeyModal");
const btnCloseJourney = $("btnCloseJourney");
const btnJourneyStart = $("btnJourneyStart");

const welcomeModal = $("welcomeModal");
const btnWelcomeStart = $("btnWelcomeStart");
const btnCloseWelcome = $("btnCloseWelcome");
const btnOpenJourneyFromWelcome = $("btnOpenJourneyFromWelcome");
const btnAlerts = $("btnAlerts");
const btnCloseAlerts = $("btnCloseAlerts");
const btnAskNotif = $("btnAskNotif");
const notifState = $("notifState");
const alertsGrid = $("alertsGrid");
const btnOpenWeeklyNow = $("btnOpenWeeklyNow");
const btnOpenWeeklyNow2 = $("btnOpenWeeklyNow2");

if(btnOpenWeeklyNow) btnOpenWeeklyNow.onclick = () => openWeeklyPanel();
if(btnOpenWeeklyNow2) btnOpenWeeklyNow2.onclick = () => openWeeklyPanel();

btnAlerts.onclick = () => { openModal(alertsModal); renderAlerts(); refreshNotifState(); };
btnCloseAlerts.onclick = () => closeModal(alertsModal);


// Jornada (guia)
if(btnJourney){
  btnJourney.onclick = ()=> openModal(journeyModal);
}
if(btnCloseJourney){
  btnCloseJourney.onclick = ()=> closeModal(journeyModal);
}
if(btnJourneyStart){
  btnJourneyStart.onclick = ()=> { closeModal(journeyModal); window.scrollTo({top:0, behavior:"smooth"}); };
}

// Boas-vindas (primeiro acesso)
function markWelcomeSeen(){
  localStorage.setItem(LS.welcomeSeen, "1");
}
if(btnWelcomeStart){
  btnWelcomeStart.onclick = ()=> { markWelcomeSeen(); closeModal(welcomeModal); };
}
if(btnCloseWelcome){
  btnCloseWelcome.onclick = ()=> { markWelcomeSeen(); closeModal(welcomeModal); };
}
if(btnOpenJourneyFromWelcome){
  btnOpenJourneyFromWelcome.onclick = ()=> { markWelcomeSeen(); closeModal(welcomeModal); openModal(journeyModal); };
}
btnAskNotif.onclick = async () => {
  if(!("Notification" in window)){
    alert("Este navegador não suporta notificações.");
    return;
  }
  const res = await Notification.requestPermission();
  refreshNotifState();
  if(res !== "granted"){
    alert("Sem permissão, os alertas aparecem apenas como avisos internos enquanto o app estiver aberto.");
  }
};

function refreshNotifState(){
  if(!("Notification" in window)){
    notifState.textContent = "Status: notificações não suportadas";
    return;
  }
  notifState.textContent = `Status: ${Notification.permission}`;
}

const DEFAULT_ALERTS = [
  { id:"water",   title:"Beber água", desc:"Um copo já é cuidado. Sem exagero.", enabled:false, time:"09:30" },
  { id:"meds",    title:"Tomar remédios", desc:"Se você usa medicação, lembre com tranquilidade.", enabled:false, time:"08:00" },
  { id:"move",    title:"Movimento", desc:"10–30 min no seu ritmo. Um passo já conta.", enabled:false, time:"17:30" },
  { id:"food",    title:"Comer melhor", desc:"Menos sal/açúcar/ultraprocessado. Mais cor no prato.", enabled:false, time:"11:30" },
  { id:"grat",    title:"Gratidão", desc:"3 coisas boas do dia. Bem simples.", enabled:false, time:"20:30" },
  { id:"human",   title:"Conexão humana", desc:"Uma mensagem ou ligação curta para alguém.", enabled:false, time:"16:00" },
  { id:"virtue",  title:"Bom • Belo • Virtuoso", desc:"Notar 1 coisa boa, 1 bela e 1 virtuosa agora.", enabled:false, time:"14:00" },
  { id:"mind",    title:"Limpeza da alma", desc:"Soltar culpa/mágoa: 'aprendo e sigo' + 1 passo possível.", enabled:false, time:"21:30" },
  { id:"checkup", title:"Prevenção", desc:"Exames/consultas/pressão, se necessário.", enabled:false, time:"10:00" },
  { id:"weekly_review", title:"Revisão semanal", desc:"Agenda, exames, saúde, contatos e poupança mínima. Um fechamento leve para a semana.", enabled:false, time:"10:00" }
];

let alertsState = loadJSON(LS.alerts, { items:{}, lastFired:{} });

(function ensureAlertDefaults(){
  for(const a of DEFAULT_ALERTS){
    if(!alertsState.items[a.id]){
      alertsState.items[a.id] = { enabled:a.enabled, time:a.time };
    }
  }
  const it = alertsState.items["weekly_review"];
  if(it && (it.dow === undefined || it.dow === null)) it.dow = 0; // domingo
  saveJSON(LS.alerts, alertsState);
})();

function renderAlerts(){
  alertsGrid.innerHTML = "";
  for(const def of DEFAULT_ALERTS){
    const cur = alertsState.items[def.id] || { enabled:false, time:def.time };
    const isWeekly = def.id === "weekly_review";
    const dow = (alertsState.items[def.id]?.dow ?? 0);
    const dowLabel = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

    const row = document.createElement("div");
    row.className = "alert-item";
    row.innerHTML = `
      <div class="alert-left">
        <div class="alert-title">${def.title}</div>
        <div class="alert-desc">${def.desc}</div>
      </div>
      <div class="alert-right">
        <div class="toggle">
          <input type="checkbox" id="al_${def.id}" ${cur.enabled ? "checked":""}/>
          <label for="al_${def.id}">Ativo</label>
        </div>

        ${isWeekly ? `
          <label>Dia</label>
          <select class="alert-time" id="dw_${def.id}">
            ${dowLabel.map((d,i)=>`<option value="${i}" ${i===dow?"selected":""}>${d}</option>`).join("")}
          </select>
        ` : ``}

        <label>Horário</label>
        <input class="alert-time" type="time" id="tm_${def.id}" value="${cur.time || def.time}" />
      </div>
    `;
    alertsGrid.appendChild(row);

    const cb = row.querySelector(`#al_${def.id}`);
    const tm = row.querySelector(`#tm_${def.id}`);
    const dw = row.querySelector(`#dw_${def.id}`);

    cb.onchange = () => {
      alertsState.items[def.id] = alertsState.items[def.id] || {};
      alertsState.items[def.id].enabled = cb.checked;
      saveJSON(LS.alerts, alertsState);
    };
    tm.onchange = () => {
      alertsState.items[def.id] = alertsState.items[def.id] || {};
      alertsState.items[def.id].time = tm.value;
      saveJSON(LS.alerts, alertsState);
    };
    if(dw){
      dw.onchange = () => {
        alertsState.items[def.id] = alertsState.items[def.id] || {};
        alertsState.items[def.id].dow = Number(dw.value);
        saveJSON(LS.alerts, alertsState);
      };
    }
  }
}

function shouldFire(alertId){
  const k = `${todayDateKey()}|${alertId}`;
  return !alertsState.lastFired[k];
}
function markFired(alertId){
  const k = `${todayDateKey()}|${alertId}`;
  alertsState.lastFired[k] = true;
  saveJSON(LS.alerts, alertsState);
}
function weekFireKey(alertId){
  const wk = getISOWeekKey(new Date());
  return `${wk}|${alertId}`;
}
function shouldFireWeekly(alertId){
  return !alertsState.lastFired[weekFireKey(alertId)];
}
function markFiredWeekly(alertId){
  alertsState.lastFired[weekFireKey(alertId)] = true;
  saveJSON(LS.alerts, alertsState);
}

function alertMessageById(id){
  switch(id){
    case "water": return { t:"Água", b:"Um copo agora já é cuidado." };
    case "meds": return { t:"Remédios", b:"Se for seu horário, lembre com tranquilidade." };
    case "move": return { t:"Movimento", b:"Um passo já conta. 10 minutos valem." };
    case "food": return { t:"Alimentação", b:"Menos sal/açúcar/ultraprocessado. Mais cor no prato." };
    case "grat": return { t:"Gratidão", b:"Três coisas boas do dia. Bem simples." };
    case "human": return { t:"Conexão", b:"Mande uma mensagem curta para alguém." };
    case "virtue": return { t:"Bom • Belo • Virtuoso", b:"Ache 1 coisa boa, 1 bela e 1 virtuosa agora." };
    case "mind": return { t:"Limpeza da alma", b:"Nomeie, solte: 'aprendo e sigo' + 1 passo possível." };
    case "checkup": return { t:"Prevenção", b:"Você está em dia com exames/consultas? Um passo pequeno resolve." };
    case "weekly_review": return {
      t:"Revisão semanal",
      b:"5 minutos: saúde, agenda/exames, 1 contato humano e 1 passo de poupança mínima.",
      route:"weekly"
    };
    default: return { t:"Lembrete", b:"Um cuidado possível agora." };
  }
}

function fireNotification(title, body, route){
  if(("Notification" in window) && Notification.permission === "granted"){
    try{
      const n = new Notification(title, { body });
      n.onclick = () => {
        window.focus?.();
        if(route === "weekly") openWeeklyPanel();
        if(route === "savings") openSavings();
        n.close();
      };
      return;
    }catch(e){ /* fallback */ }
  }
  console.log("[ALERTA]", title, body);
}

function checkAlertsTick(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const curTime = `${hh}:${mm}`;
  const dow = now.getDay();

  for(const def of DEFAULT_ALERTS){
    const cfg = alertsState.items[def.id];
    if(!cfg?.enabled) continue;

    if(def.id === "weekly_review"){
      const targetDow = (cfg.dow ?? 0);
      if(dow !== targetDow) continue;
      if(cfg.time !== curTime) continue;
      if(!shouldFireWeekly(def.id)) continue;

      const msg = alertMessageById(def.id);
      fireNotification(msg.t, msg.b, msg.route);
      markFiredWeekly(def.id);
      continue;
    }

    if(cfg.time !== curTime) continue;
    if(!shouldFire(def.id)) continue;

    const msg = alertMessageById(def.id);
    fireNotification(msg.t, msg.b, msg.route);
    markFired(def.id);
  }
}

let alertsTimer = null;
function startAlertsLoop(){
  if(alertsTimer) return;
  alertsTimer = setInterval(checkAlertsTick, 30 * 1000);
  checkAlertsTick();
}
startAlertsLoop();

// =====================
// Boot
// =====================
ensureMissionForThisWeek();
renderTodayMini();
renderPhotoUIAll();

// Mostrar boas-vindas apenas no primeiro acesso
try{
  if(welcomeModal && !localStorage.getItem(LS.welcomeSeen)){
    openModal(welcomeModal);
  }
}catch(e){}


// Fechar modal clicando fora
document.addEventListener("click", (e)=>{
  const modals = [dayModal, monthModal, missionModal, missionHistoryModal, diaryModal, alertsModal, weeklyModal, savingsModal, welcomeModal, journeyModal];
  for(const m of modals){
    if(!m || !m.classList.contains("show")) continue;
    if(e.target === m) closeModal(m);
  }
});



/* ===== PDF Diário + Finanças ===== */
function generateDailyPDF(dayKey){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });

  let y = 15;
  const lh = 7;
  const margin = 15;

  function title(t){
    doc.setFontSize(16);
    doc.text(t, margin, y); y += lh+2;
    doc.setFontSize(11);
  }
  function line(t){
    doc.text(String(t), margin, y); y += lh;
    if(y > 280){ doc.addPage(); y = 15; }
  }

  title("Diário FQ5C — " + dayKey);

  // Verbs statuses
  const e = ensureEntry(dayKey);
  line("Verbos:");
  for(const v of VERBS){
    const st = e.statuses[v.key] ? "✓" : "—";
    line(`• ${v.label}: ${st}`);
  }
  y += 4;

  // Notes
  line("Registros livres:");
  for(const v of VERBS){
    const n = (e.notes && e.notes[v.key]) ? e.notes[v.key] : "";
    if(n) line(`• ${v.label}: ${n}`);
  }
  y += 4;

  // Expenses
  line("Gastos do dia:");
  let total = 0;
  (e.expenses||[]).forEach(it=>{
    total += it.value||0;
    line(`• ${it.reason} — ${formatBRL(it.value||0)} ${it.category?("("+it.category+")"):""}`);
  });
  line("Total do dia: " + formatBRL(total));

  // Avoided
  if(e.avoided){
    y += 4;
    line("Gasto evitado:");
    line(`• ${e.avoided.reason} ${e.avoided.value?("— "+formatBRL(e.avoided.value)):""}`);
  }

  doc.save(`FQ5C_${dayKey}.pdf`);
}



/* ===== PDF Semanal ===== */
function generateWeeklyPDF(endDayKey){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });

  let y = 15;
  const lh = 7;
  const margin = 15;

  function title(t){
    doc.setFontSize(16);
    doc.text(t, margin, y); y += lh+2;
    doc.setFontSize(11);
  }
  function line(t){
    doc.text(String(t), margin, y); y += lh;
    if(y > 280){ doc.addPage(); y = 15; }
  }

  const sum = weeklyExpenseSummary(endDayKey);
  title("Diário FQ5C — Resumo Semanal");

  line("Período:");
  line(sum.keys[0] + " a " + sum.keys[sum.keys.length-1]);
  y+=4;

  // Verb counts
  line("Frequência dos verbos:");
  const counts={};
  VERBS.forEach(v=>counts[v.key]=0);

  sum.keys.forEach(k=>{
    const e = entries[k];
    if(!e) return;
    VERBS.forEach(v=>{
      if(e.statuses && e.statuses[v.key]) counts[v.key]++;
    });
  });

  VERBS.forEach(v=>{
    line(`• ${v.label}: ${counts[v.key]} dias`);
  });

  y+=4;
  line("Gastos da semana:");
  line("Total: " + formatBRL(sum.total));

  if(sum.topCats.length){
    y+=2; line("Principais categorias:");
    sum.topCats.forEach(([c,v])=> line(`• ${c}: ${formatBRL(v)}`));
  }

  if(sum.topReasons.length){
    y+=2; line("Principais motivos:");
    sum.topReasons.forEach(([r,v])=> line(`• ${r}: ${formatBRL(v)}`));
  }

  y+=4;
  line("Vitórias silenciosas (gastos evitados):");
  sum.keys.forEach(k=>{
    const e = entries[k];
    if(e && e.avoided){
      line(`• ${k}: ${e.avoided.reason}${e.avoided.value?(" ("+formatBRL(e.avoided.value)+")"):""}`);
    }
  });

  doc.save(`FQ5C_Semanal_${endDayKey}.pdf`);
}
