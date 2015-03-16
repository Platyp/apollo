#!/usr/bin/env node

var irc    = require('../node_modules/irc/lib/irc.js');
var util   = require('util');
var parser = require('./prismata_unit_parser/parser.js');
var units  = require('./prismata_unit_parser/unit-data.js');

var commands = {
    "!snipe" : function(from, to, message){
        var tokens = message.split(' ');


        if((from in apollo.drivers) && to in apollo.channels && tokens.length >= 2){
            apollo.target = tokens[1];
            apollo.client.send('NAMES', to);
        } 
    },
    "!data"  : function(from, to, message){
        var receiver = from;
        if(to in apollo.channels){
            receiver = to;
        }
        var tokens = message.split(' ');
        if(tokens.length >= 1){
            if(tokens[0] === '!data'){
                var unit = tokens.slice(1).join('').toLowerCase();
                if(unit in units.unitList){
                    apollo.client.say(to, parser.parse(units.unitList[unit]));
                }
            }
        }
    },
    "!ign"   : null,
    "!setign": null

}

// init apollo object
var apollo = {};
apollo.nick = 'Apollo1';
apollo.pass = process.argv[4];
apollo.channels = {'#prismata-test': true}
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
    var command = message.split(" ")[0];
    if(command in commands){
        commands[command](from, to, message);
    }
});

// listener for names request, kicks user if the user is in the channel
apollo.client.addListener('names', function(chan, nicks){
    if(chan in apollo.channels && apollo.target in nicks && nicks[apollo.nick] === '@'){
        apollo.client.say(to, 'Goodbye.');
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
    connection.end();
});
