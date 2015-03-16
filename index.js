#!/usr/bin/env node

// requires
var mysql  = require('mysql');
var apollo = require('./lib/apollo.js');

var filename = 'apollo.js';

if(process.argv.length != 4){
    console.log('Usage: node ' + filename + ' dbUsername dbPass');
    process.exit();
}

//init db
var connection = mysql.createConnection({
    host: 'localhost',
    user: process.argv[2],
    password: process.argv[3],
    database: 'apollo'
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
