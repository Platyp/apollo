#!/usr/bin/env node

exports.parse = function(arr) {
    // spells require their own format
    if (lookup(arr, "Spell?") == "Y") {
        var ret = lookup(arr, "Name");
        ret += " (supply: "+ lookup(arr, "Supply") +", cost: "+ lookup(arr, "Cost") +") Spell; ";
        ret += lookup(arr, "When bought");
        return ret;
    }
    
    // all non-spells
    var ret = lookup(arr, "Name");
    
    // basic unit attributes
    ret += " (supply: "+ lookup(arr, "Supply");
    ret += ", cost: "+ lookup(arr, "Cost");
    if (lookup(arr, "Additional Cost") != "-") {
        ret += " and " + lookup(arr, "Additional Cost");
    }
    ret += ", ";
    ret += lookup(arr, "Health");
    if (lookup(arr, "Fragile?") == "Y") {
        ret += " fragile";
    }
    ret += " hp";
    if (lookup(arr, "Blocker?") == "Y") {
        if (lookup(arr, "Prompt?") == "Y") {
            ret += " prompt";
        }
        ret += " blocker";
    }
    ret += ") ";
    
    // additional attributes
    semi_reset();
    if (lookup(arr, "Frontline?") == "Y") {
        ret += semi() +"Frontline";
    }
    if (lookup(arr, "Buildtime") != "-") {
        ret += semi() +"Buildtime "+ lookup(arr, "Buildtime");
    }
    if (lookup(arr, "Lifespan") != "-") {
        ret += semi() +"Lifespan "+ lookup(arr, "Lifespan");
    }
    if (lookup(arr, "Stamina") != "-") {
        ret += semi() +"Stamina "+ lookup(arr, "Stamina");
    }
    
    // abilities
    if (lookup(arr, "When bought") != "-") {
        ret += semi() +"When bought: "+ lookup(arr, "When bought");
    }
    if (lookup(arr, "Start turn ability") != "-") {
        ret += semi() +"At start of turn: "+ lookup(arr, "Start turn ability");
    }
    if (lookup(arr, "Click ability") != "-") {
        ret += semi() +"Click: "+ lookup(arr, "Click ability");
    }
    return ret;
   
}


// global variables
var columns = ["Name", "Supply", "Spell?", "Cost", "Additional Cost", "Health", "Fragile?", "Blocker?", "Prompt?", "Frontline?", "Buildtime", "Lifespan", "Stamina", "When bought", "Start turn ability", "Click ability"];
var column_lookup = null;
var semi_is_first;

function lookup(arr, col) {
    // create the lookup table dynamically the first time it's called
    if (column_lookup == null) {
        column_lookup = {};
        for (var i = 0; i < columns.length; i++) {
            column_lookup[columns[i]] = i;
        }
    }
    return arr[column_lookup[col]];
}

// Uses global state to determine whether or not this is the first item after the parens.
// If not, use a semicolon to separate statements. Otherwise, don't use a semicolon separator.
function semi() {
    if (semi_is_first) {
        semi_is_first = false;
        return "";
    }
    return "; ";
}

function semi_reset() {
    semi_is_first = true;
}
