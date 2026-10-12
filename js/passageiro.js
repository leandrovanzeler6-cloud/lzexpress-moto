import {
  collection, addDoc, updateDoc, doc, query, where,
  orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

export const STATUS_ATIVOS = ["pendente", "aceita"];
export const ativa = (corrida) => !!corrida && STATUS_ATIVOS.includes(corrida.status);

// Pede a localização UMA vez, só quando o passageiro toca em "Chamar mototáxi".
// Usa getCurrentPosition (e não watchPosition), então não há rastreamento.
export function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: "sem-suporte" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      (erro) => reject(erro),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

export function mensagemLocalizacao(e) {
  if (e && e.code === 1) {
    return "Sem a sua localização não dá para chamar o mototáxi. Permita o acesso à localização nas configurações do navegador e tente de novo.";
  }
  if (e && e.code === 2) {
    return "Não conseguimos descobrir onde você está. Ligue o GPS do celular e tente de novo.";
  }
  if (e && e.code === 3) {
    return "A localização demorou demais. Vá para um lugar aberto e tente de novo.";
  }
  return "Este aparelho ou navegador não permite usar a localização.";
}

// Acompanha SÓ a corrida mais recente deste passageiro (1 documento).
export function observarCorrida(uid, aoMudar, aoErro) {
  const q = query(
    collection(db, "corridas"),
    where("passengerId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => {
      const d = snap.docs[0];
      aoMudar(d ? { id: d.id, ...d.data() } : null);
    },
    aoErro
  );
}

// Salva só os campos essenciais. A localização fica dentro da própria corrida.
export function criarCorrida({ uid, perfil, posicao, destino, observacao }) {
  const dados = {
    passengerId: uid,
    nome: perfil.nome,
    telefone: perfil.telefone,
    latitude: posicao.latitude,
    longitude: posicao.longitude,
    status: "pendente",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (typeof posicao.accuracy === "number") dados.accuracy = Math.round(posicao.accuracy);
  if (destino) dados.destino = destino;
  if (observacao) dados.observacao = observacao;
  return addDoc(collection(db, "corridas"), dados);
}

export function cancelarCorrida(id) {
  return updateDoc(doc(db, "corridas", id), {
    status: "cancelada",
    updatedAt: serverTimestamp()
  });
}
