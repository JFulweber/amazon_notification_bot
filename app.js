const Discord = require('discord.js');


const path = require('path');
const fs = require('fs');
const process = require('process');
const prefix = process.env.PREFIX || '!';
const jsonQuery = require('json-query');

const client = new Discord.Client();

let fileDesc;
let config = {};


if (!fs.existsSync('./config/')) {
    fs.mkdirSync('./config/');
}

fs.open('./config/people.json', 'wx', (err, fd) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.log('Config does not exist');
            return;
        }
        else if(err.code === "EEXIST"){
            console.log("already exists")
            
            return;
        }
    }
    fileDesc = fd;
});

fs.readFile('./config/people.json', {
    encoding: 'utf8'}, (err, data) => {
    config = JSON.parse(data);
})

let textChannels = [];

client.on('ready', () => {
    client.guilds.forEach((g) => {
        let channel = g.channels.find('name', 'amazon_notifications');
        if (!channel) {
            g.createChannel('amazon_notifications', 'text').then(channel => {
                //channel.send('Amazon Notification Bot is online and ready!')
                textChannels.push(channel);
            }).catch(err => console.log(err))
        } else {
            textChannels.push(channel);
            //channel.send('Amazon Notification Bot is online and ready!');
        }
    })
})

client.on('message', message => {
    if (message.author.id === client.user.id) return;

    if (textChannels.includes(message.channel) && message.content == '!anb') {
        message.author.send('Hi! This is the Amazon Notification Bot created by <@127150373931712512>. Type !help for available commands.')
        if(!config[message.author.id])
            config[message.author.id] = []
        return;
    }

    if (message.channel.type === 'dm' && config[message.author.id]) {
        var {content} = message;
        if (content.startsWith(prefix)) {
            args = content.split(' ');
            var command = args[0].toLowerCase();
            command = command.replace(prefix,"");
            args = args.slice(1, args.size);
            // ONLY THINGS AFTER COMMAND
            if(command=="add"){
                if(args.length!=2 || Number.isNaN(args[0])) {
                    message.reply(`Usage: ${prefix}add \`<ASIN>\` \`<PRICE THRESHOLD>\`. You can use ${prefix}search \`<Item name>\` to look up item's ASIN's.`)
                }
                else{
                    awsClient.itemLookup({
                        idType:"ASIN",
                        itemId:args[0]
                    }).then((res)=>{
                        config[message.author.id].push({
                            asin: args[0],
                            price: args[1]
                        })
                    }).catch((err)=>{
                        message.reply("An error occured. This is likely due to the provided ASIN ID being incorrect or not found by Amazon. Please double check that it is correct.")
                    })
                }
            }
        }
    } else {
        message.author.send('Hi! This is the Amazon Notification Bot created by <@127150373931712512>. Type !help for available commands.')
        if (!config[message.author.id])
            config[message.author.id] = []
        return;
    }
});

client.login('NDA0NDgzMjczMzgxOTA0NDA2.DUWgYA.Tnt57cSLndNHOfrm-nYqoT4QH88');


var amazon = require('amazon-product-api')
var awsClient = amazon.createClient({
    awsId: "AKIAJVB66QSE7KB4BUAQ",
    awsSecret: "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"
})

/* awsClient.itemSearch({
    title: "ASUS STRIX ROG RX 570",
    searchIndex: "PCHardware"
}).then(results => {
    console.log(results);
}).catch(err => {
    console.log(JSON.stringify(err));
    throw err;
}) */



var stdin = process.openStdin();

stdin.addListener("data", (data) => {
    console.log(data.toString())
    if (data.toString().trim() === "exit") {
        process.exit(0);
    }
})

process.on('exit', (code) => {
    fs.writeFileSync('./config/people.json', JSON.stringify(config), {
        encoding: 'utf8'
    });
})

var notification_cooldown = [];

function amazonCheck(){
    var asinList = [];
    for(var id in config){
        config[id].forEach((entry)=>{
            if(asinList.indexOf(entry.asin)==-1) asinList.push(entry.asin);
        })
    }
    asinList.forEach(asin=>{
        awsClient.itemLookup({
            idType:'ASIN',
            itemId:asin,
            responseGroup: 'Medium'
        }).then((res)=>{
            for(var id in config){
                config[id].forEach((entry)=>{
                    if(entry.asin == asin && res[0].OfferSummary[0].LowestNewPrice[0].Amount[0]/100 <= entry.price ){
                        if(notification_cooldown[id]==null) notification_cooldown[id] = {};
                        if (notification_cooldown[id].status == true && notification_cooldown[id].price >= res[0].OfferSummary[0].LowestNewPrice[0].Amount[0] / 100 ){
                            return;
                        }
                        client.fetchUser(id).then((user)=>{
                            user.send(`ALERT FROM AMAZON PRICE UPDATE! \`${res[0].ItemAttributes[0].Title[0]}\` has hit a price below your minimum threshold, currently at $${res[0].OfferSummary[0].LowestNewPrice[0].Amount[0] / 100}! Better snag it while you can!` )
                            notification_cooldown[id] = { price: res[0].OfferSummary[0].LowestNewPrice[0].Amount[0] / 100, status: true };
                            setTimeout(function () {
                                notification_cooldown[id] = { price: 0, status: false };
                            }, 1000 * 60)
                        })
                    }
                })
            }
        }).catch(err=>{
            console.log(JSON.stringify(err));
        })
    });
}

setInterval(amazonCheck, 1000 * 5);
