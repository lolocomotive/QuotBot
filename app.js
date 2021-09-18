const Discord = require('discord.js');
require('dotenv').config();
const client = new Discord.Client();
const fs = require('fs');
var http = require('http');
const buffer = new Map();

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
    if (message.author == process.env.BOT_ID) return;
    const lines = message.content.split('\n');
    const quots = [];
    const authors = [];
    for (line of lines) {
        if (/.*-.*/g.exec(line) == null) return;
        quots.push(
            /.*(?=-.*)/g
                .exec(line)[0]
                .trim()
                .replace(/"|»|«|„|“|”|‘|’/g, '')
        );
        authors.push(
            /(?!.*-).*/g
                .exec(line)[0]
                .trim()
                .replace(/"|»|«|„|“|”|‘|’/g, '')
        );
    }
    let quotsAsStr = '';
    let quotsAsCSV = '';
    for (let i in quots) {
        quotsAsCSV += '"' + authors[i] + '"' + ',"' + quots[i] + '"\n';
    }
    for (let i in quots) {
        const quot = quots[i];
        const author = authors[i];
        quotsAsStr += '\nCitation: `' + quot + '`\nAuteur:`' + author + '`\n';
    }
    const reply = await message.channel.send(
        "Citation(s) détectée(s)! Est-ce que c'est correct comme ca?" +
            quotsAsStr
    );
    buffer.set(reply.id, quotsAsCSV);
    reply.react('✅').then(() => reply.react('❌'));
});
client.on('messageReactionAdd', (reaction, user) => {
    if (user.id === process.env.BOT_ID) return;
    if (reaction._emoji.name === '✅') {
        if (reaction.message.author.id === process.env.BOT_ID) {
            fs.appendFileSync('quots.csv', buffer.get(reaction.message.id));
            reaction.message.delete();
        }
    }
    if (reaction._emoji.name === '❌') {
        if (reaction.message.author.id === process.env.BOT_ID) {
            reaction.message.delete();
        }
    }
});

client.login(process.env.TOKEN);
