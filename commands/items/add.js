const commando = require('discord.js-commando');
let {getConfig} = require('../../app');

module.exports = class AddCommand extends commando.Command{
    constructor(client){
        super(client,{
            name: 'add',
            group: 'items',
            memberName: 'add',
            description: 'Add an item to track, and a price threshold for notifications.',
            args: [
                {
                    key: "itemId",
                    prompt: "You need to give it an item id to track. Use the search command to find item ids.",
                    type: "string"
                }
            ]
        });
    }

    async run(msg, args){
        console.log(msg);
        if(getConfig()[msg.author.id]){
            console.log(getConfig())
        }
    }
}