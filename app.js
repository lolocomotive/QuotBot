const Discord = require('discord.js');
require('dotenv').config();
const client = new Discord.Client();
const fs = require('fs');
const buffer = [];
var http = require('http');

http.createServer(function (req, res) {
    res.write('<h1>NodeJS Running</h1>');
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
    buffer.push(quotsAsCSV);
    for (let i in quots) {
        const quot = quots[i];
        const author = authors[i];
        quotsAsStr += '\nCitation: `' + quot + '`\nAuteur:`' + author + '`\n';
    }
    const reply = await message.channel.send(
        '||tempID:' +
            (buffer.length - 1) +
            "||\nCitation détectée! Est-ce que c'est correct comme ca?" +
            quotsAsStr
    );
    reply.react('✅').then(() => reply.react('❌'));
});
client.on('messageReactionAdd', (reaction, user) => {
    if (user.id === process.env.BOT_ID) return;
    if (reaction._emoji.name === '✅') {
        if (reaction.message.author.id === process.env.BOT_ID) {
            var tempID = parseInt(
                /(?!^\|\|tempID:)[0-9]+(?=|\|)/g.exec(
                    reaction.message.content
                )[0]
            );

            fs.appendFileSync('quots.csv', buffer[tempID]);
            reaction.message.delete();
        }
    }
    if (reaction._emoji.name === '❌') {
        console.log('Reaction is a ❌');
        if (reaction.message.author.id === process.env.BOT_ID) {
            reaction.message.delete();
        }
    }
});

client.login(process.env.TOKEN);
