// Bot do WhatsApp
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', qr => {
    console.log('Escaneie o QR Code abaixo:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot conectado ao WhatsApp!');
});

// pegar mês atual
function getMesAtual() {
    const data = new Date();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${ano}-${mes}`;
}

client.on('message_create', async msg => {

    const texto = msg.body.toLowerCase().trim();

    console.log('Mensagem recebida:', texto);

    const mes = getMesAtual();

    if (texto === 'bot contas') {
        await msg.reply(`📊 *Contas disponíveis:*

1 - Água
2 - Luz

Digite o número da conta.`);
        return;
    }

    if (texto === '1') {
        await enviarFatura(msg, 'agua', mes);
        return;
    }

    if (texto === '2') {
        await enviarFatura(msg, 'luz', mes);
        return;
    }

});

function enviarFatura(msg, tipo, mes) {
    const caminho = path.join(__dirname, `../faturas/${mes}/${tipo}.pdf`);

    if (fs.existsSync(caminho)) {
        const media = MessageMedia.fromFilePath(caminho);

        msg.reply(`📄 Enviando sua fatura de ${tipo}`);
        msg.reply(media);
    } else {
        msg.reply('❌ Fatura ainda não encontrada.');
    }
}

client.initialize();