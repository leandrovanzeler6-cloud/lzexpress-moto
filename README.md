# LZEXPRESS – Mototáxi

Site simples e gratuito para chamar mototáxi em Cametá.
O passageiro cria conta, entra, toca em **Chamar mototáxi**, a localização é enviada **uma única vez**, e o mototaxista recebe o pedido no painel com um botão que abre o Google Maps.

- Tecnologias: HTML, CSS e JavaScript puro (sem instalar nada) + Firebase (plano gratuito Spark) + GitHub Pages.
- Sem API paga do Google Maps, sem SMS, sem Cloud Functions, sem conta de faturamento.

---

## Estrutura de arquivos

```
lzexpress/
├── index.html              <- página única (todas as telas)
├── css/style.css           <- visual
├── js/
│   ├── firebase-config.js  <- SEUS dados do Firebase + UID do admin (você edita)
│   ├── firebase.js         <- inicia o Firebase
│   ├── util.js             <- funções de apoio
│   ├── auth.js             <- cadastro, login, perfil
│   ├── passageiro.js       <- localização e pedidos
│   ├── admin.js            <- painel do mototaxista
│   └── main.js             <- controla as telas
├── firestore.rules         <- regras de segurança (você cola no Firebase)
├── .gitignore
└── README.md
```

---

## Passo 1 – Abrir no VS Code

1. Descompacte o `.zip` e abra a pasta `lzexpress` no VS Code (Arquivo > Abrir Pasta).
2. Instale a extensão **Live Server** (ícone de quadradinhos à esquerda > pesquise "Live Server" > Instalar).

## Passo 2 – Criar o projeto no Firebase

1. Entre em https://console.firebase.google.com
2. **Adicionar projeto** > nome: `lzexpress` > pode **desativar** o Google Analytics > Criar.
3. **Não** ative o plano Blaze e **não** vincule conta de faturamento. Fique no plano **Spark** (gratuito).
4. Na tela inicial do projeto, clique no ícone **`</>`** (Web) para registrar um app web:
   - apelido: `lzexpress-web`
   - **não** marque "Firebase Hosting"
   - Registrar app.
5. Vai aparecer um bloco `firebaseConfig`. Copie os valores para o arquivo `js/firebase-config.js` (substitua os textos `COLE_AQUI...` e `SEU-PROJETO`).

> Esses dados não são secretos. A segurança real vem das regras do Firestore (passo 5) e do Firebase Authentication.

## Passo 3 – Ativar o login por e-mail e senha

1. No menu esquerdo: **Build > Authentication > Vamos começar** (Get started).
2. Aba **Sign-in method** > **E-mail/senha** > ative o primeiro botão (**E-mail/senha**, sem "link por e-mail") > Salvar.
3. Não ative "Telefone" (SMS pode gerar cobrança).

## Passo 4 – Criar o banco Firestore

1. Menu esquerdo: **Build > Firestore Database > Criar banco de dados**.
2. ID do banco: deixe **`(default)`**.
3. Local: **`southamerica-east1` (São Paulo)** (não dá para mudar depois).
4. Modo: **produção** (as regras do passo 5 liberam só o necessário).
5. Criar.

## Passo 5 – Colocar as regras de segurança (depois do passo 6)

Faça este passo **depois** de descobrir o UID (passo 6), porque o UID vai dentro das regras.

1. Abra o arquivo `firestore.rules` no VS Code.
2. Troque `COLOQUE_AQUI_O_UID_DO_ADMIN` pelo seu UID (mantenha as aspas simples).
3. Copie **todo** o conteúdo do arquivo.
4. No Firebase: **Firestore Database > aba Regras**, apague o que estiver lá, cole e clique em **Publicar**.

## Passo 6 – Descobrir e colocar o UID do administrador

O admin é a conta do mototaxista (você). Primeiro a conta precisa existir:

1. Rode o site localmente (passo 8) e **crie sua conta** pela tela "Criar conta" com o seu e-mail.
   - Se o cadastro mostrar erro de permissão, é porque as regras ainda não foram publicadas. Sem problema: a conta de login já foi criada.
2. No Firebase: **Authentication > aba Usuários**. Na linha do seu e-mail, copie o **UID do usuário** (código comprido de letras e números).
3. Cole esse UID em **dois lugares**:
   - `js/firebase-config.js` → `ADMIN_UID`
   - `firestore.rules` → dentro de `isAdmin()`
4. Publique as regras (passo 5).
5. Saia e entre de novo no site com essa conta: agora aparece o **Painel do mototaxista**.

> A conta admin só mostra o painel. Para testar como passageiro, crie **outra conta** com outro e-mail.

## Passo 7 – Criar o índice do passageiro (uma vez só)

O passageiro consulta "a minha corrida mais recente", e o Firestore pede um índice para isso.

1. Firebase: **Firestore Database > aba Índices > Compostos > Adicionar índice**.
2. Coleção: `corridas`
3. Campos:
   - `passengerId` → Crescente
   - `createdAt` → Decrescente
4. Escopo da consulta: **Coleção**. Criar. Leva 1 a 3 minutos para ficar "Ativado".

(Alternativa: se aparecer erro no console do navegador com um link, clique no link e confirme.)

## Passo 8 – Rodar no computador

1. No VS Code, clique com o botão direito em `index.html` > **Open with Live Server**.
2. Abre em `http://127.0.0.1:5500`. O endereço `localhost` / `127.0.0.1` conta como seguro, então a localização funciona no computador.
3. Se o domínio não for aceito no login, vá em **Authentication > Configurações > Domínios autorizados** e confira se `localhost` está na lista (vem por padrão).

## Passo 9 – Publicar no GitHub

Usando o **GitHub Desktop** (mais fácil):

1. **File > Add local repository** > escolha a pasta `lzexpress` (se pedir, "create a repository").
2. Nome do repositório: `lzexpress` > **Commit to main**.
3. **Publish repository**. Pode ser **público** (necessário para o GitHub Pages gratuito).

Ou pelo terminal do VS Code:

```bash
git init
git add .
git commit -m "LZEXPRESS primeira versão"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/lzexpress.git
git push -u origin main
```

## Passo 10 – Ligar o GitHub Pages (link público com HTTPS)

1. No GitHub, abra o repositório > **Settings > Pages**.
2. Em **Build and deployment**: Source = **Deploy from a branch**; Branch = **main**; pasta **/ (root)** > Save.
3. Espere 1 a 2 minutos. O link será: `https://SEU-USUARIO.github.io/lzexpress/`

## Passo 11 – Autorizar o domínio do GitHub Pages no Firebase

1. Firebase: **Authentication > Configurações > Domínios autorizados > Adicionar domínio**.
2. Digite só o domínio, sem `https://` e sem caminho: `SEU-USUARIO.github.io`
3. Adicionar.

Sem isso, o login não funciona no link público.

## Passo 12 – Testar a localização (HTTPS)

1. No celular, abra o link `https://SEU-USUARIO.github.io/lzexpress/`.
2. Crie uma conta de passageiro (e-mail diferente do admin).
3. Toque em **Chamar mototáxi** e **permita** a localização quando o navegador perguntar.
4. Confirme o pedido. A tela mostra "Aguardando atendimento".
5. No outro aparelho (ou computador), entre com a conta admin: o pedido aparece. Toque em **Abrir localização no Google Maps**, depois em **Aceitar corrida**.
6. No celular do passageiro o status muda sozinho para "Corrida aceita!".

Se o navegador bloquear a localização, o site mostra uma mensagem explicando. Sem localização, não é possível pedir a corrida.

---

## Que dados são guardados

| Onde | O que | Observação |
|---|---|---|
| Firebase Authentication | e-mail e senha | a senha fica criptografada pelo Firebase; o site nunca a vê |
| Firestore `users/{uid}` | userId, nome, telefone, e-mail, tipo (`passageiro`), criadoEm | só a própria pessoa lê |
| Firestore `corridas/{id}` | passengerId, nome, telefone, latitude, longitude, accuracy, destino, observação, status, createdAt, updatedAt | a localização fica **só** dentro da corrida |

Não existe: rastreamento contínuo, histórico de localização, imagens, pagamento, chat ou avaliações.
A localização é lida **uma vez**, quando o passageiro confirma o pedido (`getCurrentPosition`, nunca `watchPosition`).

## Como o painel economiza leituras

- Consulta só as **30 solicitações mais recentes** e mostra pendentes, aceitas e as de hoje.
- Usa uma leitura em tempo real (`onSnapshot`), que só consome leitura quando algo muda. Não faz consulta a cada segundo.
- O passageiro acompanha **somente 1 documento** (a corrida mais recente).
- O perfil é lido **uma vez** por sessão.

Dica: com o painel aberto, o título da aba mostra `(2) LZEXPRESS` quando há pedidos pendentes. Deixe a aba aberta para ver os pedidos chegando.

## Apagar ou arquivar pedidos antigos

- **No painel:** botão **Apagar pedidos com mais de 7 dias**. Apaga até 100 por vez; só os finalizados, recusados ou cancelados (nunca os pendentes e aceitos).
- **Manual:** Firebase > Firestore Database > coleção `corridas` > ⋮ ao lado do documento > Excluir.
- **Arquivar:** antes de apagar, no Firestore Database dá para exportar/copiar os dados que quiser guardar.

## Segurança (o que as regras garantem)

- Quem não está logado não lê nem grava nada.
- Passageiro só lê o próprio perfil e as próprias corridas.
- Passageiro só cria corrida no próprio nome e sempre como `pendente`.
- Depois de criada, ninguém altera latitude, longitude, passengerId, nome etc. Só `status` e `updatedAt` mudam.
- Passageiro só consegue **cancelar** a própria corrida, e só se estiver pendente.
- Só o admin (UID) lê todas as corridas e muda para aceita, recusada ou finalizada.
- Só o admin apaga corridas (limpeza). Perfis não podem ser apagados.

## Limites desta versão (de propósito)

- Um mototaxista só (o admin). Vários motoristas ficam para o futuro.
- Sem notificação com o site fechado (notificações push dependem de configuração extra; fora do MVP).
- Sem pagamento, preço, chat, avaliação, mapa embutido ou histórico detalhado.
- O limite de "1 pedido ativo por passageiro" é garantido pelo site; as regras impedem fraude de dados, mas não conseguem contar pedidos.

## Problemas comuns

| Mensagem / sintoma | O que fazer |
|---|---|
| "Login por e-mail e senha não está ativado" | Refaça o passo 3 |
| "Sem permissão" | Publique as regras (passo 5) e confira o UID |
| "Falta criar um índice" | Faça o passo 7 e aguarde ficar "Ativado" |
| Login falha só no link do GitHub | Passo 11 (domínio autorizado) |
| Tela do admin não aparece | UID diferente em `firebase-config.js` ou nas regras; saia e entre de novo |
| Localização não funciona | Use HTTPS (GitHub Pages) e permita a localização no navegador |
| `Database '(default)' not found` | Crie o Firestore com ID `(default)` (passo 4) |
