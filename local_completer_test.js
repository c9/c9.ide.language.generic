/*global describe it before*/

"use client";

if (typeof define === "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {
    var Document  = require("ace/document").Document;
    var assert = require("lib/chai/chai").assert;
    var completer = require("./local_completer");

    function matchSorter(matches) {
        matches.sort(function(a, b) {
            if (a.score < b.score)
                return 1;
            else if (a.score > b.score)
                return -1;
            else
                return 0;
        });
    }
    
    function determineDistance(score) {
        return 1000000 - score;
    }
    
    describe("Local Completer", function() {
        it("test basic completion", function(next) {
            var doc = new Document("hel hello2 hello3  hello2 abc");
            var matches = completer.complete(doc, null, {row: 0, column: 3}, null, function(matches) {
                matchSorter(matches);
                console.log("Matches:", matches);
                assert.equal(matches.length, 2);
                assert.equal(matches[0].name, "hello2");
                assert.equal(determineDistance(matches[0].score), 1);
                assert.equal(matches[1].name, "hello3");
                assert.equal(determineDistance(matches[1].score), 2);
                next();
            });
        });
    
        it("test basic completion 2", function(next) {
            var doc = new Document("assert.equal(matchers[0].name, matches[0].score);\nassert.eq(matches[0].name, mat[0].score);\n");
            completer.complete(doc, null, {row: 1, column: 9}, null, function(matches) { // .eq|
                matchSorter(matches);
                assert.equal(matches.length, 1);
                assert.equal(matches[0].name, "equal");
                assert.equal(determineDistance(matches[0].score), 8);
            });
    
            completer.complete(doc, null, {row: 1, column: 30}, null, function(matches) {  // .mat|[0]
                matchSorter(matches);
                assert.equal(matches.length, 2);
                assert.equal(matches[0].name, "matches");
                assert.equal(determineDistance(matches[0].score), 3);
                assert.equal(matches[1].name, "matchers");
                assert.equal(determineDistance(matches[1].score), 11);
            });
            next();
        });
    });
    onload && onload();
});
