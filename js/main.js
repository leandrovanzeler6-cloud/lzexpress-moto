import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";
import { ADMIN_UID } from "./firebase-config.js";
import { $, mostrar, aviso, comBotao, traduzirErro } from "./util.js";
import { estado, cadastrar, entrar, sair, lerPerfil, salvarPerfil } from "./auth.js";
import {
  ativa, obterLocalizacao, mensagemLocalizacao,
  observarCorrida, criarCorrida, cancelarCorrida
} from "./passageiro.js";
import { observarSolicitacoes, desenharLista, apagarAntigas } from "./admin.js";

// ---------- Estado da sessão (fica só na memória) ----------
let usuario = null;
let perfil = null;
let corrida = null;          // corrida mais recente do passageiro
let dispensada = null;       // id da corrida final que o passageiro já fechou
let posicao = null;          // localização capturada (só até confirmar)
let telaLocal = null;        // "confirmar" enquanto o passageiro preenche o pedido
let pararCorrida = null;
let pararAdmin = null;

function pararObservadores() {
  if (pararCorrida) { pararCorrida(); pararCorrida = null; }
  if (pararAdmin) { pararAdmin(); pararAdmin = null; }
  document.title = "LZEXPRESS - Mototáxi";
}

function falhaCarregar(mensagem) {
  mostrar("carregando");
  $("texto-carregando").textContent = mensagem;
}

// ---------- Sessão ----------
onAuthStateChanged(auth, (user) => {
  if (estado.cadastrando) return;
  iniciarSessao(user);
});

async function iniciarSessao(user) {
  pararObservadores();
  usuario = user;
  perfil = null;
  corrida = null;
  dispensada = null;
  posicao = null;
  telaLocal = null;
  $("btn-sair").hidden = !user;

  if (!user) {
    mostrar("login");
    return;
  }

  if (user.uid === ADMIN_UID) {
    iniciarAdmin();
    return;
  }

  $("texto-carregando").textContent = "Carregando...";
  mostrar("carregando");
  try {
    perfil = await lerPerfil(user.uid);
  } catch (e) {
    console.error(e);
    falhaCarregar(traduzirErro(e));
    return;
  }

  if (!perfil) {
    mostrar("perfil");
    return;
  }

  pararCorrida = observarCorrida(
    user.uid,
    (c) => { corrida = c; desenharPassageiro(); },
    (e) => {
      console.error(e);
      falhaCarregar(traduzirErro(e));
    }
  );
}

// ---------- Passageiro ----------
function desenharPassageiro() {
  if (!usuario || !perfil) return;

  // Se o passageiro está preenchendo o pedido, não muda de tela,
  // a não ser que já exista uma corrida ativa.
  if (telaLocal === "confirmar") {
    if (!ativa(corrida)) return;
    telaLocal = null;
    posicao = null;
  }

  if (corrida && (ativa(corrida) || corrida.id !== dispensada)) {
    desenharAcompanhamento();
    return;
  }

  const primeiroNome = perfil.nome.split(" ")[0];
  $("ola").textContent = `Olá, ${primeiroNome}!`;
  mostrar("home");
}

const TEXTOS_STATUS = {
  pendente: ["Aguardando atendimento", "Seu pedido foi enviado. Aguarde: o mototaxista vai responder em breve."],
  aceita: ["Corrida aceita!", "O mototaxista aceitou o pedido e está a caminho. Fique no local informado."],
  recusada: ["Não foi possível atender", "O mototaxista não pode atender agora. Tente de novo em alguns minutos."],
  finalizada: ["Corrida finalizada", "Obrigado por usar o LZEXPRESS!"],
  cancelada: ["Pedido cancelado", "Você cancelou este pedido."]
};

function desenharAcompanhamento() {
  const [titulo, texto] = TEXTOS_STATUS[corrida.status] || ["Pedido", ""];
  $("status-titulo").textContent = titulo;
  $("status-texto").textContent = texto;
  $("status-caixa").className = `status-caixa s-${corrida.status}`;
  $("btn-cancelar").hidden = corrida.status !== "pendente";
  $("btn-ok").hidden = ativa(corrida);
  mostrar("acompanhar");
}

$("btn-chamar").addEventListener("click", () => {
  comBotao($("btn-chamar"), "Buscando sua localização...", async () => {
    if (ativa(corrida)) { desenharPassageiro(); return; }
    try {
      posicao = await obterLocalizacao();
    } catch (e) {
      aviso(mensagemLocalizacao(e));
      return;
    }
    const precisao = Math.round(posicao.accuracy);
    $("info-local").textContent = Number.isFinite(precisao)
      ? `Localização capturada (precisão aproximada: ${precisao} metros).`
      : "Localização capturada.";
    $("ped-destino").value = "";
    $("ped-obs").value = "";
    telaLocal = "confirmar";
    mostrar("confirmar");
  });
});

$("form-pedido").addEventListener("submit", (ev) => {
  ev.preventDefault();
  comBotao($("btn-confirmar"), "Enviando...", async () => {
    if (!posicao) { aviso("A localização não foi capturada. Volte e tente de novo."); return; }
    if (ativa(corrida)) { desenharPassageiro(); return; }
    try {
      await criarCorrida({
        uid: usuario.uid,
        perfil,
        posicao,
        destino: $("ped-destino").value.trim().slice(0, 120),
        observacao: $("ped-obs").value.trim().slice(0, 120)
      });
      telaLocal = null;
      posicao = null; // não guardamos a localização na memória
      desenharPassageiro();
    } catch (e) {
      console.error(e);
      aviso(traduzirErro(e));
    }
  });
});

$("btn-voltar").addEventListener("click", () => {
  telaLocal = null;
  posicao = null;
  desenharPassageiro();
});

$("btn-cancelar").addEventListener("click", () => {
  if (!corrida || !window.confirm("Cancelar o pedido?")) return;
  comBotao($("btn-cancelar"), "Cancelando...", async () => {
    try {
      await cancelarCorrida(corrida.id);
    } catch (e) {
      console.error(e);
      aviso(traduzirErro(e));
    }
  });
});

$("btn-ok").addEventListener("click", () => {
  if (corrida) dispensada = corrida.id;
  desenharPassageiro();
});

// ---------- Painel do mototaxista ----------
function iniciarAdmin() {
  mostrar("admin");
  pararAdmin = observarSolicitacoes(
    (lista) => {
      const mostradas = desenharLista(
        $("lista-corridas"), lista, null,
        (e) => aviso(traduzirErro(e))
      );
      const pendentes = mostradas.filter((c) => c.status === "pendente").length;
      document.title = pendentes > 0 ? `(${pendentes}) LZEXPRESS` : "LZEXPRESS - Mototáxi";
    },
    (e) => {
      console.error(e);
      aviso(traduzirErro(e));
    }
  );
}

$("btn-limpar").addEventListener("click", () => {
  if (!window.confirm("Apagar os pedidos finalizados, recusados ou cancelados com mais de 7 dias?")) return;
  comBotao($("btn-limpar"), "Apagando...", async () => {
    try {
      const total = await apagarAntigas(7);
      aviso(total > 0 ? `${total} pedido(s) antigo(s) apagado(s).` : "Não há pedidos antigos para apagar.", "ok");
    } catch (e) {
      console.error(e);
      aviso(traduzirErro(e));
    }
  });
});

// ---------- Login, cadastro e perfil ----------
$("ir-cadastro").addEventListener("click", () => mostrar("cadastro"));
$("ir-login").addEventListener("click", () => mostrar("login"));

$("form-login").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const email = $("login-email").value.trim().toLowerCase();
  const senha = $("login-senha").value;
  if (!email || !senha) { aviso("Preencha o e-mail e a senha."); return; }
  comBotao($("btn-entrar"), "Entrando...", async () => {
    try {
      await entrar(email, senha);
      $("login-senha").value = "";
    } catch (e) {
      aviso(traduzirErro(e));
    }
  });
});

function telefoneValido(texto) {
  const digitos = texto.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 13;
}

$("form-cadastro").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const nome = $("cad-nome").value.trim();
  const telefone = $("cad-telefone").value.trim();
  const email = $("cad-email").value.trim().toLowerCase();
  const senha = $("cad-senha").value;

  if (nome.length < 3) { aviso("Digite seu nome completo."); return; }
  if (!telefoneValido(telefone)) { aviso("Digite o telefone com DDD. Exemplo: (91) 90000-0000."); return; }
  if (!email) { aviso("Digite seu e-mail."); return; }
  if (senha.length < 6) { aviso("A senha precisa ter pelo menos 6 caracteres."); return; }

  comBotao($("btn-cadastrar"), "Criando conta...", async () => {
    try {
      const user = await cadastrar({ nome, telefone, email, senha });
      $("cad-senha").value = "";
      await iniciarSessao(user);
    } catch (e) {
      console.error(e);
      aviso(traduzirErro(e));
    }
  });
});

$("form-perfil").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const nome = $("perfil-nome").value.trim();
  const telefone = $("perfil-telefone").value.trim();
  if (nome.length < 3) { aviso("Digite seu nome completo."); return; }
  if (!telefoneValido(telefone)) { aviso("Digite o telefone com DDD."); return; }
  comBotao($("btn-perfil"), "Salvando...", async () => {
    try {
      await salvarPerfil(usuario, { nome, telefone });
      await iniciarSessao(usuario);
    } catch (e) {
      console.error(e);
      aviso(traduzirErro(e));
    }
  });
});

$("btn-sair").addEventListener("click", () => {
  sair().catch((e) => aviso(traduzirErro(e)));
});
