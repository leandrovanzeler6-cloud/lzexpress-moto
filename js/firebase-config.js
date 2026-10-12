// =====================================================================
// CONFIGURAÇÃO DO FIREBASE  (arquivo de exemplo: troque pelos SEUS dados)
//
// Onde pegar: Firebase Console > Configurações do projeto (engrenagem)
//             > "Seus aplicativos" > app Web > "Configuração do SDK".
//
// IMPORTANTE: estes dados NÃO são secretos. Qualquer pessoa que abrir o
// site consegue vê-los. A segurança de verdade vem das regras do
// Firestore (arquivo firestore.rules) e do Firebase Authentication.
// NUNCA coloque senha, token secreto ou chave privada aqui.
// =====================================================================

export const firebaseConfig = {
apiKey: "AIzaSyDKQpaRd0IXbCw2jwBtIuwqqp_u8vw8HqM",
  authDomain: "lz-express-moto.firebaseapp.com",
  projectId: "lz-express-moto",
  storageBucket: "lz-express-moto.firebasestorage.app",
  messagingSenderId: "558583858793",
  appId: "1:558583858793:web:4c25611ad7c2018e8044f8"
};

// UID da conta do mototaxista (administrador).
// Como descobrir: README, passo 6. Use o MESMO UID em firestore.rules.
// Aqui ele só decide qual tela mostrar; quem protege os dados são as regras.
export const ADMIN_UID = "oaCnlYkvjUhPhJARjGYanij7Pk62";
