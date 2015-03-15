#!/usr/bin/env node

// requires
var irc  = require('./node_modules/irc/lib/irc.js');
var util = require('util');
var parser = require('./prismata_unit_parser/parser.js');
var units = require('./prismata_unit_parser/unit-data.js');

// init apollo object
var apollo = {};
apollo.nick = 'Apollo';
apollo.pass = 'BlackfyreFries';
apollo.channels = {'#prismata': true}
apollo.drivers = {"Platyp": true, "BlaqkAngel": true};
apollo.target = null;
apollo.client = new irc.Client(
    'irc.foonetic.net',
    apollo.nick,
    {
        channels: Object.keys(apollo.channels),
        //debug: true
    }
);

// debug
apollo.client.addListener('raw', function(message) { console.log('raw: ', message) });

// listener for various commands, probably should reorganize this
// sends a names request to ensure that the user to kick is in the channel
apollo.client.addListener('message', function(from, to, message){
    if(to in apollo.channels){
        var tokens = message.split(' ');
        if(tokens.length >= 1){
            if(tokens[0] === '!data'){
                var unit = tokens.slice(1).join('').toLowerCase();
                if(unit in units.unitList){
                    apollo.client.say(to, parser.parse(units.unitList[unit]));
                }
            }
        }
    }

    else if((from in apollo.drivers) && to in apollo.channels){
        var tokens = message.split(' ');
        apollo.client.say(to, 'Goodbye.');
        if(tokens.length == 3 && tokens[0].toLowerCase() == 'apollo:' 
                && tokens[1].toLowerCase() == 'snipe'){
            apollo.target = tokens[2];
            apollo.client.send('NAMES', to);
        }
    }
});

// listener for names request, kicks user if the user is in the channel
apollo.client.addListener('names', function(chan, nicks){
    if(chan in apollo.channels && apollo.target in nicks && nicks[apollo.nick] === '@'){
        apollo.client.send('KICK', chan, apollo.target, 'One shot, one kill.');
        apollo.target = null;
    }
});

// ident listener
apollo.client.addListener('notice', function(nick, to, text, message){
    if(nick === 'NickServ' && to === apollo.nick && message.args.length >= 2 &&
            message.args[1] === 'This nickname is registered. Please choose a different nickname, or identify via \u0002/msg NickServ identify <password>\u0002.'){
        apollo.client.say('NickServ', 'identify ' + apollo.pass);
    }
});

var repl = require('repl').start('> ');
repl.context.repl = repl;
repl.context.util = util;
repl.context.irc = irc;
repl.context.c = apollo.client;

repl.inputStream.addListener('close', function() {
    console.log("\nClosing session");
    apollo.client.disconnect('OW. SHOT MAH GORRAM FOOT.');
});

