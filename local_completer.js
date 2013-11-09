define(function(require, exports, module) {

var baseLanguageHandler = require('plugins/c9.ide.language/base_handler');
var completeUtil = require("plugins/c9.ide.language/complete_util");

var SPLIT_REGEX = /[^a-zA-Z_0-9\$]+/;
var MAX_SCORE = 1000000;

var completer = module.exports = Object.create(baseLanguageHandler);
    
completer.handlesLanguage = function(language) {
    return true;
};

completer.handlesEditor = function() {
    return this.HANDLES_ANY;
};

// For the current document, gives scores to identifiers not on frequency, but on distance from the current prefix
function wordDistanceAnalyzer(doc, pos, prefix) {
    var text = doc.getValue().trim();
    
    // Determine cursor's word index
    // TODO: optimize
    var textBefore = doc.getLines(0, pos.row-1).join("\n") + "\n";
    var currentLine = doc.getLine(pos.row);
    textBefore += currentLine.substr(0, pos.column);
    var splitRegex = getSplitRegex();
    var prefixPosition = textBefore.trim().split(splitRegex).length - 1;
    
    // Split entire document into words
    var identifiers = text.split(splitRegex);
    var identDict = {};
    
    // Find prefix to find other identifiers close it
    for (var i = 0; i < identifiers.length; i++) {
        if (i === prefixPosition)
            continue;
        var ident = identifiers[i];
        if (ident.length === 0)
            continue;
        var distance = Math.max(prefixPosition, i) - Math.min(prefixPosition, i);
        // Score substracted from 100000 to force descending ordering
        if (Object.prototype.hasOwnProperty.call(identDict, ident))
            identDict[ident] = Math.max(MAX_SCORE - distance, identDict[ident]);
        else
            identDict[ident] = MAX_SCORE - distance;
        
    }
    return identDict;
}

function getSplitRegex() {
    var idRegex = completer.$getIdentifierRegex();
    if (!idRegex || !idRegex.source.match(/\[[^^][^\]]*\]/))
        return SPLIT_REGEX;
    return new RegExp("[^" + idRegex.source.substr(1, idRegex.source.length - 2) + "]+");
}

function analyze(doc, pos) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePrecedingIdentifier(line, pos.column, completer.$getIdentifierRegex());
         
    var analysisCache = wordDistanceAnalyzer(doc, pos, identifier);
    return analysisCache;
}
    
completer.complete = function(doc, fullAst, pos, currentNode, callback) {
    var identDict = analyze(doc, pos);
    var line = doc.getLine(pos.row);
    var regex = this.$getIdentifierRegex();
    var identifier = completeUtil.retrievePrecedingIdentifier(line, pos.column, regex);
    var fullIdentifier = identifier + completeUtil.retrieveFollowingIdentifier(line, pos.column, regex);
         
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    
    matches = matches.slice(0, 40); // limits results for performance

    var isSlashRegex = regex.source.match(/^\[.*\/.*]/);
    
    callback(matches.filter(function(m) {
        return !m.match(isSlashRegex ? /^([0-9$_\/]|\/[^\/])/ : /^[0-9$_\/]/);
    }).map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : m === fullIdentifier ? MAX_SCORE : identDict[m],
          meta        : "",
          isGeneric   : true,
          priority    : 0
        };
    }));
};

});
