#!/usr/bin/env node

// requires
var util    = require('util');
var mysql   = require('mysql');
var secrets = require('./secrets.json');
var apollo  = require('./lib/apollo.js');

console.log(secrets);
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
