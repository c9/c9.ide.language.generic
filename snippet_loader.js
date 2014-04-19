/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
var snippetManager = require("ace/snippets").snippetManager;
var config = require("ace/config");

exports.init = function(worker) {
    var loadSnippetsForMode = function(mode) {
        var id = mode.$id;
        if (!snippetManager.files)
            snippetManager.files = {};
        loadSnippetFile(id);
        if (mode.modes)
            mode.modes.forEach(loadSnippetsForMode);
    };

    var loadSnippetFile = function(id) {
        if (!id || snippetManager.files[id])
            return;
        var snippetFilePath = id.replace("mode", "snippets");
        snippetManager.files[id] = {};
        config.loadModule(snippetFilePath, function(m) {
            if (m) {
                snippetManager.files[id] = m;
                m.snippets = snippetManager.parseSnippetFile(m.snippetText);
                snippetManager.register(m.snippets, m.scope);
                if (m.includeScopes) {
                    snippetManager.snippetMap[m.scope].includeScopes = m.includeScopes;
                    m.includeScopes.forEach(function(x) {
                        loadSnippetFile("ace/mode/" + x);
                    });
                }
            }
        });
    };
    
    worker.on("changeMode", function(e) {
        loadSnippetsForMode(worker.$doc.$mode);
    });
    snippetManager.on("registerSnippets", function(e) {
        worker.emit("loadSnippets", {data : {
            language: e.scope,
            snippets: snippetManager.snippetNameMap[e.scope]
        }});
    });
};

});
