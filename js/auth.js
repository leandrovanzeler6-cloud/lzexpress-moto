import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// Evita que o "onAuthStateChanged" rode no meio do cadastro,
// antes do perfil ser salvo.
export const estado = { cadastrando: false };

// A senha fica só no Firebase Authentication. Nunca vai para o Firestore.
export async function cadastrar({ nome, telefone, email, senha }) {
  estado.cadastrando = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    try {
      await salvarPerfil(cred.user, { nome, telefone });
    } catch (e) {
      // Se o perfil falhar, a tela "Complete seu cadastro" cuida disso.
      console.error("Perfil não foi salvo no cadastro:", e);
    }
    return cred.user;
  } finally {
    estado.cadastrando = false;
  }
}

export function entrar(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha);
}

export function sair() {
  return signOut(auth);
}

// Perfil mínimo: userId, nome, telefone, email, tipo, criadoEm
export function salvarPerfil(user, { nome, telefone }) {
  return setDoc(doc(db, "users", user.uid), {
    userId: user.uid,
    nome,
    telefone,
    email: (user.email || "").toLowerCase(),
    tipo: "passageiro",
    criadoEm: serverTimestamp()
  });
}

// Lê o perfil UMA vez por sessão (não fica relendo)
export async function lerPerfil(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
