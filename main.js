"use strict";
/* ===== CONFIGURAÇÃO DE CONTATO (preencha antes de publicar) =====
   formEndpoint: URL de um serviço de formulários (ex.: Formspree, Web3Forms, Basin).
   whatsappNumber: número comercial com DDI+DDD, só dígitos (ex.: "5511999999999").
   Se ambos estiverem vazios, o formulário informa que o envio ainda não foi configurado. */
const CONFIG = { formEndpoint: "", whatsappNumber: "" };

/* ===== CONTEÚDO DA DEMONSTRAÇÃO (dados fictícios) ===== */
const HELLO = "Olá! Sou o assistente virtual do consultório. Posso ajudar com agendamento e informações. Para falar com uma pessoa, digite 1.";
const SCEN = {
  agendamento: { label: "Agendamento", cap: "Ilustração: a assistente conduz a marcação com horários cadastrados.", msgs: [
    ["in","Oi, quero marcar consulta com cardiologista."],["bot",HELLO],
    ["bot","Qual é o seu nome e o convênio, se tiver?"],["in","Ana Souza, Convênio Exemplo."],
    ["bot","Obrigada, Ana. Horários livres: quinta 14h ou sexta 9h30. Qual prefere?"],["in","Quinta, 14h."],
    ["bot","Consulta registrada para quinta, às 14h. Enviarei um lembrete antes."]] },
  lembrete: { label: "Lembrete", cap: "Ilustração: mensagem de lembrete com opções para o paciente.", msgs: [
    ["bot","Lembrete: sua consulta é amanhã, às 14h. Responda CONFIRMAR, REMARCAR ou CANCELAR."],
    ["in","Confirmar"],["bot","Presença confirmada. Até lá!"]] },
  urgencia: { label: "Urgência", cap: "Resposta fixa por regra, sem avaliação clínica da IA. A equipe é alertada.", msgs: [
    ["in","Estou com dor no peito."],
    ["bot","Não posso avaliar sintomas. Procure agora um pronto-socorro ou ligue 192 (SAMU). A equipe do consultório já foi avisada.","fix"]] },
  painel: { label: "Painel", cap: "Prévia ilustrativa do painel de acompanhamento, com dados fictícios.", panel: true }
};

const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
let runId = 0;

async function play(box, msgs, id) {
  box.textContent = "";
  for (const [who, text, cls] of msgs) {
    if (id !== runId && box.id === "demo-chat") return;
    await wait(700);
    if (id !== runId && box.id === "demo-chat") return;
    const m = document.createElement("div");
    m.className = `m ${who} ${cls || ""}`; m.textContent = text; box.append(m);
  }
}

/* Hero */
play($("#hero-chat"), SCEN.agendamento.msgs.slice(0, 5), 0);

/* Demonstração interativa */
const tabs = $(".tabs"), chat = $("#demo-chat"), panel = $("#demo-panel"), cap = $("#demo-cap");
let current = "agendamento";
Object.entries(SCEN).forEach(([k, s]) => {
  const b = document.createElement("button");
  b.textContent = s.label; b.setAttribute("role", "tab"); b.dataset.k = k;
  b.onclick = () => show(k); tabs.append(b);
});
function renderPanel() {
  const rows = [["Ana S.","Agendamento","Assistente",true],["Carlos M.","Dúvida de convênio","Assistente",true],["Paula R.","Pediu atendimento humano","Aguardando equipe",false]];
  panel.innerHTML = "<b>Conversas (exemplo)</b>" + rows.map((r, i) =>
    `<div class="row"><div>${r[0]}<small>${r[1]}</small></div><span class="tag ${r[3] ? "on" : ""}">${r[2]}</span>${r[3] ? "" : `<button class="btn ghost sm" data-take="${i}">Assumir conversa</button>`}</div>`).join("");
  panel.querySelectorAll("[data-take]").forEach(b => b.onclick = () => {
    const row = b.closest(".row"), t = $(".tag", row); t.textContent = "Com a equipe"; t.classList.add("on"); b.remove();
  });
}
function show(k) {
  current = k; const s = SCEN[k]; runId++;
  tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.k === k));
  cap.textContent = s.cap;
  chat.parentElement.hidden = !!s.panel; panel.hidden = !s.panel;
  if (s.panel) renderPanel(); else play(chat, s.msgs, runId);
}
$("#replay").onclick = () => show(current);
show("agendamento");

/* Menu móvel */
const burger = $(".burger"), menu = $("#menu");
burger.onclick = () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
menu.addEventListener("click", e => { if (e.target.closest("a,button")) { menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); } });

/* Entrada das seções */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll(".rv").forEach(el => io.observe(el));
$("#yr").textContent = new Date().getFullYear();

/* Formulário */
const dlg = $("#dlg"), form = $("#form"), status = $("#status");
document.querySelectorAll("[data-open-demo]").forEach(b => b.onclick = () => { status.textContent = ""; status.className = ""; dlg.showModal(); });
$("[data-close]").onclick = () => dlg.close();
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

function validate() {
  let ok = true;
  form.querySelectorAll("[required]").forEach(i => {
    const v = i.value.trim(); let msg = "";
    if (!v) msg = "Campo obrigatório.";
    else if (i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Informe um e-mail válido.";
    i.setAttribute("aria-invalid", !!msg); i.nextElementSibling.textContent = msg; if (msg) ok = false;
  });
  return ok;
}
form.addEventListener("submit", async e => {
  e.preventDefault(); status.className = "";
  if (!validate()) { status.textContent = "Revise os campos destacados."; status.className = "err"; form.querySelector("[aria-invalid=true]").focus(); return; }
  const d = Object.fromEntries(new FormData(form)); if (d.website) return; delete d.website;
  const btn = $("button[type=submit]", form), label = $("span", btn);
  if (!CONFIG.formEndpoint && !CONFIG.whatsappNumber) {
    status.textContent = "O envio ainda não foi configurado neste site. Tente novamente em breve."; status.className = "err"; return;
  }
  btn.disabled = true; label.textContent = "Enviando...";
  try {
    if (CONFIG.formEndpoint) {
      const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error(r.status);
      form.reset(); status.textContent = "Solicitação enviada. Entraremos em contato pelo e-mail informado."; status.className = "ok";
    } else {
      const t = `Olá! Quero solicitar uma demonstração da Nexxa.\nNome: ${d.nome}\nConsultório: ${d.clinica}\nE-mail: ${d.email}\nEspecialidade: ${d.especialidade}\nNecessidade: ${d.necessidade || "-"}`;
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(t)}`, "_blank", "noopener");
      status.textContent = "Abrimos o WhatsApp com a sua mensagem pronta. Basta enviar."; status.className = "ok";
    }
  } catch { status.textContent = "Não foi possível enviar agora. Verifique a conexão e tente novamente."; status.className = "err"; }
  finally { btn.disabled = false; label.textContent = "Enviar solicitação"; }
});