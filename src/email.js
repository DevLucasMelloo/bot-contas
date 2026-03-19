const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

const config = require('../config/config.json');

function getMesAtual() {
    const data = new Date();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${ano}-${mes}`;
}

async function lerEmails() {
    const connection = await imaps.connect({
        imap: {
            user: config.email.user,
            password: config.email.password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000
        }
    });

    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: [''], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (let item of messages) {
        const all = item.parts.find(part => part.which === '');
        const parsed = await simpleParser(all.body);

        console.log('📩 Email de:', parsed.from.text);

        if (parsed.attachments.length > 0) {

            const mes = getMesAtual();
            const pasta = path.join(__dirname, `../faturas/${mes}`);

            if (!fs.existsSync(pasta)) {
                fs.mkdirSync(pasta, { recursive: true });
            }

            parsed.attachments.forEach(att => {

                let tipo = 'outros';

                const remetente = parsed.from.text.toLowerCase();

                if (remetente.includes('enel')) tipo = 'luz';
                if (remetente.includes('sabesp')) tipo = 'agua';
                if (remetente.includes('vivo')) tipo = 'vivo';
                if (remetente.includes('claro')) tipo = 'internet';

                const caminho = path.join(pasta, `${tipo}.pdf`);

                fs.writeFileSync(caminho, att.content);

                console.log(`✅ Salvo: ${caminho}`);
            });
        }
    }

    connection.end();
}

lerEmails();