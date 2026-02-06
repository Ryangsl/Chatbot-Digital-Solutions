const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// ===============================
// 🔐 CONTROLE DE ESTADO
// ===============================
const estados = new Map();

// ===============================
// 📺 INSTRUÇÕES POR TV
// ===============================
const instrucoesTV = {
  "1": {
    nome: "Samsung",
    mensagem:
      "📺 *Samsung*\n\n" +
      "1️⃣ Acesse a loja de aplicativos\n" +
      "2️⃣ Busque por *IPTV App*\n" +
      "3️⃣ Instale o aplicativo",
    imagem: "./imagens/app.png",
  },
  "2": {
    nome: "LG",
    mensagem:
      "📺 *LG*\n\n" +
      "Baixe o aplicativo pelo link abaixo:",
    link: "https://exemplo.com/lg",
    imagem: "./imagens/app.png",
  },
  "3": {
    nome: "TCL",
    mensagem:
      "📺 *TCL*\n\n" +
      "Acesse pelo navegador da TV:",
    link: "https://exemplo.com/tcl",
    imagem: "./imagens/app.png",
  },
};

// ===============================
// QR CODE
// ===============================
client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

// ===============================
// WHATSAPP CONECTADO
// ===============================
client.on("ready", () => {
  console.log("✅ Tudo certo! WhatsApp conectado.");
});

// ===============================
// DESCONEXÃO
// ===============================
client.on("disconnected", (reason) => {
  console.log("⚠️ Desconectado:", reason);
});

client.initialize();

// ===============================
// ⏳ DELAY
// ===============================
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function typing(chat) {
  await delay(1000);
  await chat.sendStateTyping();
  await delay(1000);
}

// ===============================
// 🔥 MENU PRINCIPAL
// ===============================
async function processarMenu(opcao, msg, chat) {
  switch (opcao) {
    case "1":
      await typing(chat);
      await msg.reply(
        "📺 Selecione o modelo da sua TV:\n\n" +
          "*1️⃣ - Samsung*\n" +
          "*2️⃣ - LG*\n" +
          "*3️⃣ - TCL*\n\n" +
          "Digite o número do modelo."
      );

      estados.set(msg.from, "escolhendo_tv");
      break;

    case "2":
      await typing(chat);
      await msg.reply(
        "⏰ *Horário de Atendimento:*\n\n" +
          "Segunda a Sexta: *08h às 18h*\n" +
          "Sábado: *09h às 13h*\n" +
          "Domingos e feriados: *Fechado*\n\n" +
          "Digite *menu* para retornar."
      );
      break;

    case "3":
      await typing(chat);
      await msg.reply(
        "📍 *Suporte Técnico*\n\n" +
          "Descreva seu problema que nossa equipe irá ajudar.\n\n" +
          "Ou digite *menu* para voltar."
      );
      break;

    default:
      await typing(chat);
      await msg.reply("❌ Opção inválida.\nDigite *menu* para ver as opções.");
      break;
  }
}

// ===============================
// 📩 RECEBIMENTO DE MENSAGENS
// ===============================
client.on("message", async (msg) => {
  try {
    if (!msg.from || msg.from.endsWith("@g.us")) return;

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body?.trim().toLowerCase() || "";
    const estadoAtual = estados.get(msg.from);

    // ==========================
    // 🏁 MENU INICIAL
    // ==========================
    if (/^(menu|oi|olá|ola|bom dia|boa tarde|boa noite)$/i.test(texto)) {
      await typing(chat);

      const hora = new Date().getHours();
      let saudacao = "Olá";

      if (hora >= 5 && hora < 12) saudacao = "Bom dia";
      else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
      else saudacao = "Boa noite";

      await msg.reply(
        `${saudacao}! 👋\n\n` +
          "Como posso ajudar?\n\n" +
          "*1️⃣ - Solicitar um teste grátis*\n" +
          "*2️⃣ - Horário de Atendimento*\n" +
          "*3️⃣ - Suporte Técnico*\n\n" +
          "Digite o número da opção desejada."
      );

      estados.set(msg.from, "menu_principal");
      return;
    }

    // ==========================
    // 📺 ESCOLHENDO TV
    // ==========================
    if (estadoAtual === "escolhendo_tv") {
      const tv = instrucoesTV[texto];

      if (!tv) {
        await msg.reply("❌ Modelo inválido. Escolha uma das opções.");
        return;
      }

      await typing(chat);

      const media = MessageMedia.fromFilePath(tv.imagem);

      await client.sendMessage(msg.from, media, {
        caption:
          tv.mensagem + (tv.link ? `\n\n🔗 ${tv.link}` : ""),
      });

      estados.set(msg.from, "menu_principal");
      return;
    }

    // ==========================
    // 🎯 MENU PRINCIPAL
    // ==========================
    if (/^[1-9]$/.test(texto)) {
      await processarMenu(texto, msg, chat);
      return;
    }

    // ==========================
    // 🔁 FALLBACK
    // ==========================
    if (texto.length > 0) {
      await typing(chat);
      await msg.reply("Não entendi 🤔\nDigite *menu* para ver as opções.");
    }

  } catch (error) {
    console.error("Erro no processamento da mensagem:", error);
  }
});
