export const $ = (id) => document.getElementById(id);

const TELAS = [
  "carregando", "login", "cadastro", "perfil",
  "home", "confirmar", "acompanhar", "admin"
];

// Mostra uma tela e esconde as outras
export function mostrar(nome) {
  for (const t of TELAS) $("view-" + t).hidden = t !== nome;
  limparAviso();
  window.scrollTo(0, 0);
}

export function aviso(texto, tipo = "erro") {
  const caixa = $("aviso");
  caixa.textContent = texto;
  caixa.className = tipo === "ok" ? "aviso ok" : "aviso";
  caixa.hidden = false;
}

export function limparAviso() {
  $("aviso").hidden = true;
}

// Cria elementos HTML com segurança (textContent, nunca innerHTML),
// porque nomes e observações digitados por passageiros não são confiáveis.
export function el(tag, atributos = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (chave === "class") e.className = valor;
    else if (chave === "texto") e.textContent = valor;
    else if (chave.startsWith("on")) e.addEventListener(chave.slice(2), valor);
    else e.setAttribute(chave, valor);
  }
  for (const f of filhos) {
    if (f) e.append(f);
  }
  return e;
}

// Desativa o botão enquanto a ação roda (evita toques duplos)
export async function comBotao(botao, textoOcupado, acao) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  if (textoOcupado) botao.textContent = textoOcupado;
  try {
    await acao();
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

// Traduz erros técnicos para mensagens simples
export function traduzirErro(e) {
  const codigo = (e && e.code) || "";
  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Toque em \"Já tenho conta\" para entrar.",
    "auth/invalid-email": "O e-mail não parece correto. Confira e tente de novo.",
    "auth/weak-password": "A senha é muito fraca. Use pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    "auth/network-request-failed": "Sem internet. Confira sua conexão e tente de novo.",
    "auth/operation-not-allowed": "Login por e-mail e senha não está ativado no Firebase (veja o README, passo 3).",
    "permission-denied": "Sem permissão. Confira as regras do Firestore e o UID do administrador (README).",
    "failed-precondition": "Falta criar um índice no Firestore (README, passo 7).",
    "unavailable": "Sem conexão com o servidor. Tente de novo em instantes."
  };
  const chave = codigo.replace("firestore/", "");
  return mensagens[codigo] || mensagens[chave] || "Algo deu errado. Tente de novo.";
}
