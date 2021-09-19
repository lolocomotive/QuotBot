const {
    MessageEmbed,
    MessageActionRow,
    Client,
    Intents,
    MessageButton,
} = require('discord.js');
const fs = require('fs');
const http = require('http');
const { google } = require('googleapis');

require('dotenv').config();
let auth, sheets;
async function main() {
    auth = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth });
}
main();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const buffer = new Map();
const channels = ['849229270463283210', '768193335986225163'];
//Capitalize first letter
function cfl(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
http.createServer(function (req, res) {
    res.write('<h1>NodeJS Running</h1>');
    const data = fs.readFileSync('quots.csv', 'utf8');
    res.write('Author, Quotation<hr>');
    res.write(data.replace(/\n/g, '<br>').replace(/"/g, ''));
    res.end();
}).listen(parseInt(process.env.PORT));
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
    if (!channels.includes(message.channel.id)) return;
    if (message.author == process.env.BOT_ID) return;
    const lines = message.content.split('\n');
    const quots = [];
    const authors = [];

    for (line of lines) {
        if (/.*-.*/g.exec(line) == null) continue;
        quots.push(
            cfl(
                /.*(?=-.*)/g
                    .exec(line)[0]
                    .trim()
                    .replace(/"|»|«|„|“|”|‘|’/g, '')
            )
        );
        authors.push(
            cfl(
                /(?!.*-).*/g
                    .exec(line)[0]
                    .trim()
                    .replace(/"|»|«|„|“|”|‘|’/g, '')
            )
        );
    }
    if (quots.length == 0) return;
    let quotsFinal = [];
    for (let i in quots) {
        quotsFinal.push([authors[i], quots[i]]);
    }
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('yes')
                .setLabel("Oui c'est bon")
                .setStyle('PRIMARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('no')
                .setLabel("Non c'était pas une citation lol")
                .setStyle('SECONDARY')
        );
    const embed = new MessageEmbed()
        .setColor('#3CA45C')
        .setTitle(
            (quots.length == 1 ? 'Une' : quots.length) +
                ' citation' +
                (quots.length == 1 ? '' : 's') +
                ' détectée' +
                (quots.length == 1 ? '' : 's') +
                '!'
        )
        .setDescription("Est-ce que c'est correct comme ca?");

    for (let i in quots) {
        embed.addField(`“${quots[i]}”`, authors[i]);
    }
    const reply = await message.channel.send({
        embeds: [embed],
        components: [row],
    });
    buffer.set(reply.id, quotsFinal);
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'yes') {
        //fs.appendFileSync('quots.csv', buffer.get(interaction.message.id));
        const range = `Bot!A:B`;

        const response = await sheets.spreadsheets.values.append({
            auth,
            spreadsheetId: process.env.SHEET_ID,
            range,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: buffer.get(interaction.message.id),
            },
        });
        buffer.delete(interaction.message.id);
    }
    interaction.message.delete();
});
client.login(process.env.TOKEN);
