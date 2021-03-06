/*
 * grunt-css-statistics
 * https://github.com/thotzl/grunt-css-statistics
 *
 * Copyright (c) 2015 Torsten 'thotzl' Hötzel
 * Licensed under the MIT license.
 */

'use strict';

var app = {
    fs: require("fs"),
    cssstats: require("cssstats"),
    path: require("path"),
    q: require("q"),
    chalk: require('chalk'),

    parseHtml: require('./lib/parse-html.js'),
    parseCsslint: require('./lib/parse-csslint.js')
};

    app.chalkError = app.chalk.red;
    app.chalkNeutral = app.chalk.bgWhite.gray;
    app.chalkWarn = app.chalk.yellow;
    app.chalkSuccess = app.chalk.green;
    app.chalkInfo = app.chalk.blue;
    app.chalkDebug = app.chalk.bgYellow.black;


module.exports = function (grunt) {

    app.grunt = grunt;

    var options,
        defaultOptions = {
            logConsole: false,
            jsonOutput: true,
            htmlOutput: true,

            fileSize:           true,
            uniqueDeclarations: [
                'font-size',
                'float',
                'width',
                'height',
                'color',
                'background-color'
            ],
            addOrigin:          false,
            addRawCss:          false,
            addHtmlStyles:      false,
            addGraphs:          false,
            csslint:            false
        };

    /**
     * generates cssstats object
     * parses it for html output and better readability
     *
     * if options.addOrigin == true
     * adds the original cssstats object as 'origin'
     *
     *
     * @param css
     * @returns {{fileSize: {size: string, gzipSize: string}, selectorSpecifity: {}, totals: {rules: (result.total|*|List.total|results.total|test.total|total), selectors: *, declarations: (result.total|*|List.total|results.total|test.total|total), properties: number, vendorPrefixes: *, mediaQueries: (result.total|*|List.total|results.total|test.total|total), importants: *}, uniqueDeclarations: {}, selectors: {type: *, class: *, id: *, pseudoClass: *, pseudoElement: *}, propertyResets: {}, uniqueValues: {colors: {}, backgroundColors: {}, fontSizes: {}, fontFamilies: {}}, uniqueMediaQueries: {}}}
     */
    var parseStats = function parseStats(cssObject) {

        var css = cssObject.concat;

        grunt.log.writeln(app.chalkSuccess('grunt-css-statistics start to build object from cssstats result ...'));

        var origin = app.cssstats(css);
        var stats = {
            fileSize:          {
                size:     getSizeUnit(origin.size),
                gzipSize: getSizeUnit(origin.gzipSize)
            },
            selectorSpecifity: {},

            totals: {
                rules:          origin.rules.total,
                selectors:      origin.selectors.total,
                declarations:   origin.declarations.total,
                properties:     0,
                vendorPrefixes: origin.declarations.getVendorPrefixed().length,
                mediaQueries:   origin.mediaQueries.total,
                importants:     css.match(/!important/g || []) ? css.match(/!important/g || []).length : 0
            },


            uniqueDeclarations: {},

            selectors: {
                "type":          origin.selectors.type,
                "class":         origin.selectors.class,
                "id":            origin.selectors.id,
                "pseudoClass":   origin.selectors.pseudoClass,
                "pseudoElement": origin.selectors.pseudoElement
            },

            propertyResets: {},

            uniqueValues: {
                colors:           getValueCount(origin.declarations.properties['color'], 'color'),
                backgroundColors: {},
                fontSizes:        {},
                fontFamilies:     getValueCount(origin.declarations.properties['font-family'], 'font-family')
            },

            uniqueMediaQueries: getValueCount(origin.mediaQueries.values, 'mediaQueries')
        };

        if (options.addGraphs) {
            grunt.log.writeln('adding graph data ...');

            stats.graphs = {};
            stats.graphs.selectorSpecificity = origin.selectors.getSpecificityGraph();
            stats.graphs.rulesetSize = origin.rules.size.graph;
        }

        if (options.addRawCss) {
            grunt.log.writeln('adding concatinated raw css ...');
            stats.rawCss = css;
        }

        if (options.addOrigin) {
            grunt.log.writeln(app.chalkInfo('adding original cssstats object ...'));
            stats.origin = origin;
        }

        // get all unique declarations
        for (var prop in origin.declarations.properties) {
            if (origin.declarations.properties.hasOwnProperty(prop)) {
                if (options.uniqueDeclarations.indexOf(prop) > -1) {

                    grunt.log.writeln('determine unique declarations of "' + app.chalkInfo(prop) + '" ...');

                    stats.uniqueDeclarations[prop] = origin.declarations.properties[prop].length;
                }
                stats.totals.properties = stats.totals.properties + 1;
            }
        }
        // get colors from shorthand attribute 'background'
        var bgColors = origin.declarations.properties['background-color'] ?
            origin.declarations.properties['background-color'] :
            [];

        if (origin.declarations.properties['background']) {
            grunt.log.writeln('determine background-colors from background properties ...');

            origin.declarations.properties['background'].forEach(function (bg) {

                var bgColor = bg.match(/#[0-9a-fA-F]+|#[0-9]|#[A-F]+|#[a-f]+|(rgba|rgb)\([0-9,.]+?\)/g);

                if (bgColor) {
                    bgColors.push(bgColor[0]);
                }
            });
        }

        stats.uniqueValues.backgroundColors = getValueCount(bgColors, 'bgColors');

        // get font sizes from shorthand attribute 'font'
        var fontSizes = origin.declarations.properties['font-size'] ?
            origin.declarations.properties['font-size'] :
            [];

        if (origin.declarations.properties['font']) {
            grunt.log.writeln('determine font-sizes from font properties ...');

            origin.declarations.properties['font'].forEach(function (f) {
                var fontSize = f.match(/([\d.])+ ?(em|ex|%|dpx|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)\/?[\d.]?|(inherit|small|smaller|big|bigger)/g);

                if (fontSize) {
                    fontSizes.push(fontSize[0]);
                }
            });
        }

        stats.uniqueValues.fontSizes = sortFontSizes(getValueCount(fontSizes), 'fontSizes');


        stats.propertyResets = origin.declarations.getPropertyResets();
        stats.selectorSpecifity = origin.selectors.specificity;

        if (options.csslint) {

            var linted = app.parseCsslint(app, options.csslint, cssObject);

            if (linted) {
                stats.lint = linted;
            }
        }

        return stats;
    };

    /**
     * returns a string with the right unit:
     * KB, MB, GB, TB
     *
     * @param size
     * @returns {string}
     */
    var getSizeUnit = function getSizeUnit(size) {
        var kbFactor = 1024;
        var mbFactor = kbFactor * 1024;
        var gbFactor = mbFactor * 1024;
        var tbFactor = gbFactor * 1024;

        if ((size / kbFactor) < 1024) {
            var r = (size / kbFactor).toFixed(2) + ' KB';
        }
        else if ((size / mbFactor) < 1024) {
            var r = (size / mbFactor).toFixed(2) + ' MB';
        }
        else if ((size / gbFactor) < 1024) {
            var r = (size / gbFactor).toFixed(2) + ' GB';
        }
        else if ((size / tbFactor) < 1024) {
            var r = (size / tbFactor).toFixed(2) + ' TB';
        }
        else {
            var r = (size).toFixed(2) + ' B';
        }

        return r;

    };

    /**
     * sorts the font sizes from big too small
     *
     * @param fontSizes
     * @returns {{}}
     */
    var sortFontSizes = function sortFontSizes(fontSizes) {
        var r = {};
        var temp = [];
        var size = 0;
        var biggest = 0;

        for (var prop in fontSizes) {
            if (fontSizes.hasOwnProperty(prop)) {

                size++;

                var val = prop.replace(/[^0-9.\/]/g, '').replace(/\/[0-9]/g, '');

                if (prop.indexOf('%') > -1) {
                    val = 16 / 100 * val;
                }

                if (prop.indexOf('em') > -1
                    || prop.indexOf('rem') > -1
                    || prop.indexOf('vw') > -1
                    || prop.indexOf('vh') > -1) {
                    val = 16 * val;
                }

                if (val === '') {
                    val = prop;
                }

                biggest = val > biggest ? val : biggest;

                if (/[0-9.]/g.test(val)) {
                    temp.push({
                                  viewSizePx:  val,
                                  viewSizeStr: '',
                                  cssSize:     prop,
                                  amount:      fontSizes[prop]
                              });
                } else {
                    temp.push({
                                  viewSizePx:  0,
                                  viewSizeStr: val,
                                  cssSize:     prop,
                                  amount:      fontSizes[prop]
                              });
                }


            }
        }


        r = temp.sort(function (a, b) {
            return b.viewSizePx - a.viewSizePx;
        });

        return r;
    };

    /**
     * sets the css property as key
     * set the amount of the property as value
     *
     * @param values
     * @returns {{}}
     */
    var getValueCount = function getValueCount(values, property) {

        var arr = {};

        property = property ? property : '';

        if (!values) {
            grunt.log.writeln(app.chalkWarn('no ' + property + ' defined in your css'));
            return arr;
        }

        values.forEach(function (v) {
            v = v.replace(/['"]/g, '');

            if (arr.hasOwnProperty(v)) {
                arr[v] = arr[v] + 1;
            } else {
                arr[v] = 1;
            }
        });

        return arr;
    };

    /**
     * the main task
     * maps the css files from grunt config
     * and triggers the other tasks (html, json, log) if set to true
     */
    var mainTask = function mainTask() {
        options = this.options(defaultOptions);
        var target = this.target;

        this.files.forEach(function (file) {

            var destJson = app.path.join(file.dest, target + '.cssstats.json');
            var destHtml = app.path.join(file.dest, target + '.cssstats.html');

            var css = {
                concat: ''
            };

            css.concat = file.src.filter(function (filepath) {
                // Remove nonexistent files (it's up to you to filter or warn here).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filepath) {
                // Read and return the file's source.

                css[filepath] = app.fs.readFileSync(filepath, 'utf8');

                return '/****\n    source: ' + filepath + '\n****/\n\n' + css[filepath];

            }).join('\n');

            var stats = parseStats(css);

            if (options.logConsole) {
                console.log(stats);
            }

            if (options.jsonOutput) {
                var statsString = JSON.stringify(stats, undefined, 4);
                grunt.file.write(destJson, statsString);
            }

            if (options.htmlOutput) {
                var output = app.parseHtml(app, options, stats, css);
                grunt.file.write(destHtml, output);
            }
        });

    };

    /**
     * grunt register
     */
    grunt.registerMultiTask('cssstats', 'Grunt plugin of cssstats.com', mainTask);

};
