#!/usr/bin/env node

var secrets = require('../secrets.json');
var util    = require('util');
var mysql      = require('mysql');

var irc     = require('../node_modules/irc/lib/irc.js');
var parser  = require('./prismata_unit_parser/parser.js');
var units   = require('./prismata_unit_parser/unit-data.js');

//init db
var connection = mysql.createConnection({
    host: secrets.dbHost,
    user: secrets.dbUsername,
    password: secrets.dbPass,
    database: secrets.database
});

connection.connect();

// Test connection
connection.query('select * from users', function(error, results, fields){
    if(error){
        console.log('Database connection error!');
        console.log('Error: +' + error);
        process.exit();
    }
});

// init apollo object
var apollo = {};
apollo.nick = secrets.botName;
apollo.pass = secrets.botPass;
apollo.channels = secrets.botChans;
apollo.requester = null;
apollo.target = null;
apollo.client = new irc.Client(
    'irc.foonetic.net',
    apollo.nick,
    {
        channels: Object.keys(apollo.channels),
        //debug: true
    }
);

var commands = {
    "!snipe" : function(from, to, message){
        var tokens = message.split(' ');

        if(to in apollo.channels && tokens.length >= 2){
            apollo.target = tokens[1];
            if(apollo.target === apollo.nick){
                apollo.client.say(to, "Sorry chief. Mag's empty.");
                apollo.target = null;
                return;
            }
            apollo.requester = from;
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
                    apollo.client.say(receiver, parser.parse(units.unitList[unit]));
                }
            }
        }
    },
    "!ign"   : function(from, to, message){
        var receiver = from;
        if(to in apollo.channels){
            receiver = to;
        }    

        var tokens = message.split(" ");
        if(tokens.length < 2){
            apollo.client.say(receiver, "Usage: !ign ircNick");
            return;
        }

        var ircName = tokens[1];
        var sql = "SELECT inGameName FROM users WHERE ircName = " + connection.escape(ircName) + ";";
        connection.query(sql, function(err, results){
            if(err){
                console.log("error in transaction");
                console.log(err);
            }
            else{
                if(results.length === 0){
                    apollo.client.say(receiver, from + ": that user hasn't revealed an in-game name.");
                }
                for(i in results){
                    apollo.client.say(receiver, from + ": " + ircName + "'s in-game name is " + results[i].inGameName);
                }
            }
        });
    },

    "!setign": function(from, to, message){
        var receiver = from;
        if(to in apollo.channels){
            receiver = to;
        }

        var ircName = from;
        var tokens = message.split(" ");
        if(tokens.length < 2){
            apollo.client.say(receiver, "Usage: !setign newign");
            return;
        }
        var inGameName = tokens.slice(1).join(" ");

        var sql = "INSERT INTO users (ircName, inGameName) VALUES (" + 
            connection.escape(ircName) + ", " + connection.escape(inGameName) +
            ") ON DUPLICATE KEY UPDATE inGameName = " + connection.escape(inGameName) + ";";

        connection.query(sql, function(err, results){
            if(err){
                console.log("error in transaction");
                console.log(err);
            }
            else{
                apollo.client.say(receiver, ircName + ": your in-game name has been updated to " + inGameName);
            }
        });
    },

    "!delign": function(from, to, message){
        var receiver = from;
        if(to in apollo.channels){
            receiver = to;
        }

        var ircName = from;
        var sql = "DELETE FROM users WHERE ircName = " + connection.escape(ircName) + ";";
        connection.query(sql, function(err, results){
            if(err){
                console.log("error in transaction");
                console.log(err);
            }
            else{
                apollo.client.say(receiver, ircName + ": your in-game name has been removed");
            }
        });
    }

}

// debug logging
apollo.client.addListener('raw', function(message) { console.log('raw: ', message) });

apollo.client.addListener('ping', function(server){

	apollo.client.send('PONG', server);

});

// listener for various commands
apollo.client.addListener('message', function(from, to, message){
    var command = message.split(" ")[0];
    if(command in commands){
        commands[command](from, to, message);
    }
});

// listener for names request, kicks user if the user is in the channel
apollo.client.addListener('names', function(chan, nicks){
    if(chan in apollo.channels && 
       apollo.target in nicks && 
           (nicks[apollo.requester] === '~' || 
            nicks[apollo.requester] === '@' || 
            nicks[apollo.requester] === '+') &&
       nicks[apollo.nick] === '@'){
        apollo.client.say(chan, 'Goodbye.');
        apollo.client.send('KICK', chan, apollo.target, 'One shot, one kill.');
        apollo.requester = null;
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
