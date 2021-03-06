const auth = require('../auth');
const util = require('./meta/util');
const axios = require('axios');
const ezArray = require('fixed-2d-array');

bot.registerCommand('ping', (msg, args) => {
    bot.createMessage(msg.channel.id, 'pong').
    then(newMsg => {
        bot.editMessage(newMsg.channel.id, newMsg.id, `\`\`\`javascript\npong | Time taken: ${newMsg.timestamp - msg.timestamp} ms\`\`\``);
    });
}, {
    description: 'Ping me to make sure I\'m alive',
    fullDescription: 'The bot will reply with the amount of time taken'
});

bot.registerCommand('roll', (msg, args) => {
    if(args.length === 0) return Math.floor(Math.random() * 100) + 1;

    let roll = parseInt(args[0]);
    if(!roll) return 'Please supply a number';

    return Math.floor(Math.random() * roll) + 1;
}, {
    description: 'Roll a 100sided die',
    fullDescription: 'Have the bot roll a number between 0 and 100, or a different specified max',
    usage: '<max number for roll>'
});

bot.registerCommand('remindme', (msg, args) => {
    if(args.length === 0) return 'Please supply a time and reason';

    let time = util.strToMs(args.join(' '));
    if(!time) {
        return `${msg.author.mention} you didn\'t give me a valid time`;
    }

    if(!time.content) {
        setTimeout(() =>
            bot.createMessage(msg.channel.id, `${msg.author.mention}, you wanted me to remind you`),
            time.ms);
        return `${msg.author.mention}, I will remind you in ${time.str}`;
    }

    setTimeout(() =>
        bot.createMessage(msg.channel.id,`${msg.author.mention}, you wanted me to remind you: ${time.content}`),
        time.ms);
    return `${msg.author.mention}, I will remind you in ${time.str}`;
}, {
    description: 'Have me remind you of something',
    fullDescription: 'The bot will remind you about something - only works if you have mention notifications on!',
    usage: '<time string> <reason>'
});

bot.registerCommand('word', (msg, args) => {
    let strParts = msg.author.username.split('').map(s => s.toLowerCase());
    let newPart = strParts.slice().reverse();
    let ezCalcArr = strParts.concat(newPart);

    let len = ezCalcArr.length;
    let arr = new ezArray(len, len, ' ');

    for(let x = 0; x < len; x++) {
        for(let y = 0; y < len; y++) {
            if(ezCalcArr[x] === ezCalcArr[y]) {
                arr.set(x, y, ' ');
            }
            if(ezCalcArr[x] > ezCalcArr[y]) {
                arr.set(x, y, '―');
            }
            if(ezCalcArr[x] < ezCalcArr[y]) {
                arr.set(x, y, '|');
            }
        }
    }

    let ret = '```\n';
    for(let x = 0; x < len; x++) {
        for(let y = 0; y < len; y++) {
            ret += arr.get(y, x);

            if(y === arr.getWidth() - 1) ret += '\n';
        }
    }
    ret += '```';

    return ret;
}, {
    description: 'Get your wordenticon',
    fullDescription: 'The bot will reply with a wordenticon based off of your name (https://en.wikipedia.org/wiki/Identicon)'
});

bot.registerCommand('love', (msg, args) => {
    let members = msg.channel.guild.members;

    members = members.filter(m =>
        m.status === 'online' || m.status === 'idle'
    );

    let removed = members.splice([Math.floor(Math.random()*members.length)], 1);
    let lover = removed[0];
    let otherLover = members[Math.floor(Math.random()*members.length)];

    return `:heartpulse: ${lover.nick ? lover.nick : lover.user.username} loves ${otherLover.nick ? otherLover.nick : otherLover.user.username} :heartpulse:`;
}, {
    description: 'Ship em`',
    fullDescription: 'The bot will pair up two lovebirds'
});

bot.registerCommand('avi', (msg, args) => {
    if(args.length === 0 || msg.mentions.length === 0) return 'Please specify a user by mentioning them';

    let members = msg.channel.guild.members;
    let count = 0;
    let retStr = `Requested by: **${msg.author.username}**\n`;

    msg.mentions.forEach(userid => {
        let member = members.find(m =>
            m.id === userid && m.user.avatar
        );

        if(member) {
            retStr += `https://discordapp.com/api/users/${member.id}/avatars/${member.user.avatar}.jpg\n`;
            count++;
        }
    });

    if(count < msg.mentions.length) retStr += `\`Could not find avatar for ${msg.mentions.length - count} mentioned user(s)\``;

    return retStr;
}, {
    description: 'Get peoples avatars',
    fullDescription: 'The bot will reply with the avatar of the specified users',
    usage: '<space separated mentions>'
});

bot.registerCommand('weather', (msg, args) => {
    if(args.length === 0) return "Please specify a location";

    let options = {
        url: '/data/2.5/weather',
        baseURL: 'http://api.openweathermap.org',
        params: {
            APPID: auth.weather_key,
            q: args.join()
        },
        responseType: 'json',
        validateStatus: (status) => {
            return status >= 200 && status < 300;
        }
    };

    axios(options).then(resp => {
        let temp = resp.data.main.temp;
        temp = (temp - 273.15) * 1.8000 + 32.00;

        let retStr = '';
        if (temp > 75) retStr += ':fire:';
        else if (temp > 45) retStr += ':leaves:';
        else retStr += ':snowman:';

        retStr += ` \`${resp.data.name}\` | Temp: ${temp.toFixed(1)}°F `;

        for (let w of resp.data.weather) {
            if (w.main === 'Rain' || w.main === 'Drizzle') retStr += ':cloud_rain:';
            if (w.main === 'Thunderstorm') retStr += ':thunder_cloud_rain:';
            if (w.main === 'Clear') retStr += ':sunny:';
            if (w.main === 'Snow') retStr += ':snowflake:';
            if (w.main === 'Atmosphere') retStr += ':fireworks:';
            if (w.main === 'Additional') retStr += ':dash:';
            if (w.main === 'Clouds') retStr += ':cloud:';
            if (w.main === 'Extreme') retStr += ':skull::cloud_tornado::ocean:'; //lol
        }

        bot.createMessage(msg.channel.id, retStr);
    }).catch(err => {
        console.log(`Error getting weather: ${err.stack}`);
        bot.createMessage(msg.channel.id, `${msg.author.mention}, your location could not be found`);
    });
}, {
    description: 'Get the weather',
    fullDescription: 'The bot will get the weather for a specified location',
    usage: '<city>,<state/country>'
});
