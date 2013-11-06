/*global describe it before*/

"use client";

if (typeof define === "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {
    var Document = require("ace/document").Document;
    var assert = require("lib/chai/chai").assert;
    var completer = require("./snippet_completer");
    
    function matchSorter(matches) {
        matches.sort(function(a, b) {
            if (a.name < b.name)
                return -1;
            else if (a.name > b.name)
                return 1;
            else
                return 0;
        });
    }
    
    describe("Snippet Completer", function(){
        it("test javascript found completions", function(done) {
            var doc = new Document("while(true) {\n    fn\n}");
            completer.language = 'javascript';
            completer.complete(doc, null, {row: 1, column: 6}, null, function(matches) {
                matchSorter(matches);
                assert.equal(matches.length, 1);
                assert.equal(matches[0].name, "fn");
                done();
            });
        });
    });
    
    onload && onload();

});
