var grunt;
var app;
var csslint;

var parseCsslint = function parseCsslint(a, options, cssObject) {

    grunt = a.grunt;
    app = a;

    try {
        csslint = require('csslint').CSSLint;
    } catch (e) {
        grunt.log.warn(e);
        grunt.log.warn('make sure you have installed the npm package csslint');
        grunt.log.warn(app.chalkInfo('https://www.npmjs.com/package/csslint'));
        return false;
    }
    
    var ruleset = getRuleset(csslint.getRules(), parseOptions(options));
    var result = getLintResult(cssObject, ruleset);

    if (options.groupResults) {
        result = groupResults(result);
    }

    return result;
};

var getLintResult = function getLintResult(cssObject, ruleset) {

    var linted = {};

    for (var filepath in cssObject) {
        if (cssObject.hasOwnProperty(filepath) && filepath !== 'concat') {
            if (!grunt.file.exists(filepath)) {
                grunt.log.warn('Source file "' + filepath + '" not found.');
            } else {
                grunt.log.writeln(app.chalkWarn('linting ' + filepath + ' ...'));
                linted[filepath] = csslint.verify(cssObject[filepath], ruleset);
            }
        }
    }

    return linted;
};

var getRuleset = function getRuleset(defaultRules, options) {

    if (!options.hasOwnProperty('ruleset')) {
        return defaultRules;
    }

    var ruleset = {};


        defaultRules.forEach(function (rule) {
            if (options.ruleset.hasOwnProperty(rule.id)) {
                if (options.ruleset[rule.id]) {
                    ruleset[rule.id] = true;
                }
            } else if (!options.clearDefaults) {
                ruleset[rule.id] = true;
            }
        });

    return ruleset;
};

var parseOptions = function parseOptions(options) {

    var parsed = options;
    var fromFile = {};

    if (options.hasOwnProperty('ruleset')) {

        if (typeof options.ruleset === 'string') {

            try {
                parsed = JSON.parse(app.fs.readFileSync(options.ruleset, 'utf8'));
            } catch (e) {
                grunt.log.warn(app.chalkWarn(e));
            }
        } else {
            if (options.ruleset.rulesetFile) {
                try {
                    fromFile = JSON.parse(app.fs.readFileSync(options.ruleset.rulesetFile, 'utf8'));
                } catch (e) {
                    grunt.log.warn(app.chalkWarn(e));
                }

                delete options.ruleset.rulesetFile;
            }
        }

        for (var rule in fromFile) {
            parsed.ruleset[rule] = fromFile[rule];
        }
    }

    return parsed;
};


var groupResults = function groupResults(results) {

    var grouped = {};

    for (var source in results) {

        var r = results[source].messages;

        r.forEach(function (result) {

            if (!grouped[result.type]) {
                grouped[result.type] = {
                    amount:   0,
                    messages: {}
                }
            }

            var type = grouped[result.type];


            type.amount = type.amount + 1;

            if (!type.messages[result.rule.id]) {
                type.messages[result.rule.id] = {
                    amount: 0,
                    messages: []
                };
            }

            var i = type.messages[result.rule.id].amount;

            type.messages[result.rule.id].messages[i] = {
                file:     source,
                line:     result.line ? result.line : false,
                col:      result.col ? result.col : false,
                message:  result.message,
                evidence: result.evidence,
                rule: {
                    name:     result.rule.name,
                    desc:     result.rule.desc,
                    browsers: result.rule.browsers
                }

            }

            type.messages[result.rule.id].amount = type.messages[result.rule.id].amount + 1;

        });
    }

    return grouped;
};

module.exports = parseCsslint;

