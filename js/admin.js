import {
  collection, doc, query, where, orderBy, limit, onSnapshot,
  updateDoc, getDocs, writeBatch, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";
import { el } from "./util.js";

const ROTULOS = {
  pendente: "Pendente",
  aceita: "Aceita",
  recusada: "Recusada",
  finalizada: "Finalizada",
  cancelada: "Cancelada"
};

// Só as 30 solicitações mais recentes (consulta limitada = gasto baixo).
export function observarSolicitacoes(aoMudar, aoErro) {
  const q = query(
    collection(db, "corridas"),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => aoMudar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    aoErro
  );
}

export function atualizarStatus(id, status) {
  return updateDoc(doc(db, "corridas", id), { status, updatedAt: serverTimestamp() });
}

// Link comum do Google Maps (Maps URLs). Não usa API nem chave.
export function linkMapa(latitude, longitude) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

// Apaga pedidos antigos que já terminaram (até 100 por vez).
export async function apagarAntigas(dias = 7) {
  const limiteData = Timestamp.fromDate(new Date(Date.now() - dias * 24 * 60 * 60 * 1000));
  const q = query(collection(db, "corridas"), where("createdAt", "<", limiteData), limit(100));
  const snap = await getDocs(q);
  const lote = writeBatch(db);
  let total = 0;
  snap.forEach((d) => {
    const status = d.data().status;
    if (status !== "pendente" && status !== "aceita") {
      lote.delete(d.ref);
      total++;
    }
  });
  if (total > 0) await lote.commit();
  return total;
}

function mesmoDia(data) {
  return data && data.toDateString() === new Date().toDateString();
}

function textoHorario(data) {
  if (!data) return "agora";
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return mesmoDia(data) ? `hoje às ${hora}` : `${data.toLocaleDateString("pt-BR")} às ${hora}`;
}

// Desenha a lista. Mostra: pendentes, aceitas e as de hoje.
export function desenharLista(container, corridas, aoAtualizar, aoErroAcao) {
  const visiveis = corridas.filter((c) => {
    const quando = c.createdAt ? c.createdAt.toDate() : new Date();
    return c.status === "pendente" || c.status === "aceita" || mesmoDia(quando);
  });

  // Pendentes primeiro, depois aceitas, depois o resto (mais novas antes)
  const peso = { pendente: 0, aceita: 1 };
  visiveis.sort((a, b) => (peso[a.status] ?? 2) - (peso[b.status] ?? 2));

  container.replaceChildren();

  if (visiveis.length === 0) {
    container.append(el("p", { class: "vazio", texto: "Nenhum pedido por enquanto." }));
    return visiveis;
  }

  for (const c of visiveis) {
    const quando = c.createdAt ? c.createdAt.toDate() : null;

    const executar = async (novoStatus, confirmacao) => {
      if (confirmacao && !window.confirm(confirmacao)) return;
      try {
        await atualizarStatus(c.id, novoStatus);
      } catch (e) {
        aoErroAcao(e);
      }
    };

    const botoes = [];
    botoes.push(el("a", {
      class: "btn btn-mapa",
      href: linkMapa(c.latitude, c.longitude),
      target: "_blank",
      rel: "noopener noreferrer",
      texto: "Abrir localização no Google Maps"
    }));
    if (c.status === "pendente") {
      botoes.push(el("button", {
        class: "btn btn-verde", type: "button", texto: "Aceitar corrida",
        onclick: () => executar("aceita")
      }));
      botoes.push(el("button", {
        class: "btn btn-vermelho", type: "button", texto: "Recusar corrida",
        onclick: () => executar("recusada", "Recusar esta corrida?")
      }));
    }
    if (c.status === "aceita") {
      botoes.push(el("button", {
        class: "btn btn-principal", type: "button", texto: "Finalizar corrida",
        onclick: () => executar("finalizada", "Finalizar esta corrida?")
      }));
    }

    const precisao = typeof c.accuracy === "number" ? ` (±${c.accuracy} m)` : "";

    container.append(
      el("article", { class: `card s-${c.status}` },
        el("div", { class: "card-topo" },
          el("strong", { texto: c.nome }),
          el("span", { class: "selo", texto: ROTULOS[c.status] || c.status })
        ),
        el("p", {}, el("a", { class: "tel", href: `tel:${c.telefone}`, texto: c.telefone })),
        el("p", { class: "discreto", texto: `Pedido ${textoHorario(quando)}` }),
        c.destino ? el("p", { texto: `Destino: ${c.destino}` }) : null,
        c.observacao ? el("p", { texto: `Referência: ${c.observacao}` }) : null,
        el("p", {
          class: "discreto",
          texto: `Lat ${Number(c.latitude).toFixed(5)}, Lng ${Number(c.longitude).toFixed(5)}${precisao}`
        }),
        ...botoes
      )
    );
  }
  return visiveis;
}
