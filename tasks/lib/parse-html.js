var fs;

var parseHtml = function parseHtml(a, options, stats, css) {

    fs = a.fs;

    var styles = fs.readFileSync(__dirname + '/resources/styles.css', 'utf8');
    var template = fs.readFileSync(__dirname + '/resources/template.html', 'utf8');
    var output = '';


    if (options.addHtmlStyles) {
        styles += css;
    }

    for (var prop in stats) {
        if (stats.hasOwnProperty(prop)) {

            switch (prop) {
                case 'fileSize':
                case 'selectorSpecifity':
                    output += '<section class="cssstats_' + prop + '">' + "\n";
                    output += getSizeSection(stats[prop], prop);
                    output += '</section>' + "\n";
                    break;
                case 'uniqueValues':
                    output += getUniqueValuesSection(stats[prop], prop);
                    break;
                case 'rawCss':
                    output += '<section class="cssstats_' + prop + '">' + "\n";
                    output += '<code class="cssstats_' + prop + '_code"><pre>' + stats[prop] + '</pre></code>' + "\n";
                    output += '</section>' + "\n";
                    break;
                case 'uniqueMediaQueries':
                    output += '<section class="cssstats_' + prop + '">' + "\n";
                    output += getMediaQueriesSection(stats[prop], prop);
                    output += '</section>' + "\n";
                    break;
                case 'graphs':
                    output += getGraphs(stats[prop], prop) + "\n";
                    break;
                case 'origin':
                    break;
                case 'lint':
                    output += '<section class="cssstats_' + prop + '">' + "\n";
                    output += options.csslint.groupResults ? getGroupedLintSection(stats[prop], prop) : getLintSection(stats[prop], prop);
                    output += '</section>' + "\n";
                    break;
                default:
                    output += '<section class="cssstats_' + prop + '">' + "\n";
                    output += getDefaultSection(stats[prop], prop);
                    output += '</section>' + "\n";
            }
        }
    }


    template = template.replace('{{ main_content }}', output + "\n")
        .replace('{{ styles }}', styles + "\n");

    return template + "\n";
};


/**
 * converts camelCase to uppercased space separated string parts
 * @param str
 * @returns {string}
 */
var camelCaseToSpace = function camelCaseToSpace(str) {

    var spaced = str.replace(/([A-Z])/g, function ($1) {
        return " " + $1;
    });

    var spaced = spaced.split(' ');
    var spacedUppercased = '';
    var i = 1;

    spaced.forEach(function (s) {
        spacedUppercased += s.charAt(0).toUpperCase() + s.substr(1);
        if (i < spaced.length) {
            spacedUppercased += ' ';
        }
        i++;
    });

    return spacedUppercased;

};

/**
 * replaces placeholders in markup
 * for each property in object
 *
 * @param obj
 * @param markup
 * @returns {string}
 */
var getHtmlByKeyVal = function getHtmlByKeyVal(obj, markup) {

    var output = '';
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {

            var val = obj[prop];

            if (typeof val === 'number' && val % 1 != 0) {
                val = val.toFixed(2);
            }

            output += markup.replace(/{{ class }}/g, prop)
                .replace(/{{ prop.upper }}/g, camelCaseToSpace(prop))
                .replace(/{{ prop }}/g, prop)
                .replace(/{{ value }}/g, val);
        }
    }

    return output.replace(/{{.+?}}/g, '');
};

/**
 * returns section headline
 *
 * @param str
 * @returns {string}
 */
var getHeadline = function getHeadline(str) {
    return '<h2>' + camelCaseToSpace(str) + '</h2>' + "\n";
};


/**
 * uses getHtmlByKeyVal()
 * returns markup for size section
 *
 * @param obj
 * @param parent
 * @returns {string}
 */
var getSizeSection = function getSizeSection(obj, parent) {

    var output = getHeadline(parent);

    var markUp = '<div class="cssstats_col cssstats_' + parent + '_{{ class }}">' +
        '<span class="cssstats_' + parent + '_prop">{{ prop.upper }}:</span>' +
        '<span class="cssstats_' + parent + '_value">{{ value }}</span>' +
        '</div>';

    output += getHtmlByKeyVal(obj, markUp);

    return output + "\n";
};

/**
 * uses getHtmlByKeyVal()
 * returns markup for default sections
 *
 * @param obj
 * @param parent
 * @returns {string}
 */
var getDefaultSection = function getSizeSection(obj, parent) {

    var output = getHeadline(parent);

    var markUp = '<div class="cssstats_col cssstats_' + parent + '_{{ class }}">' +
        '<span class="cssstats_' + parent + '_value">{{ value }}</span>' +
        '<span class="cssstats_' + parent + '_prop">{{ prop }}</span>' +
        '</div>';

    output += getHtmlByKeyVal(obj, markUp);

    return output + "\n";
};

/**
 * uses getHtmlByKeyVal()
 * returns markup for MediaQueries section
 *
 * @param obj
 * @param parent
 * @returns {string}
 */
var getMediaQueriesSection = function getMediaQueriesSection(obj, parent) {

    var output = getHeadline(parent);

    var markUp = '<div class="cssstats_col">' +
        '<span>{{ prop }} ' +
        '<span class="cssstats_multiplier"> ({{ value }}&times;)</span>' +
        '</span>' +
        '</div>';

    output += getHtmlByKeyVal(obj, markUp);

    return output + "\n";
};

/**
 * generates sections for all graphs
 * generates SVG from graph data and returns
 * complete markup for all graph sections
 *
 * @param obj
 * @param parent
 * @returns {string}
 */
var getGraphs = function getGraphs(obj, parent) {

    var output = '';
    var chartWidth = 1200;
    var chartHeight = 320;

    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {

            var i = 1;
            var highest = 0;

            obj[prop].forEach(function (val) {
                highest = val > highest ? val : highest;
            });

            output += '<section class="cssstats_' + prop + '">' + "\n";
            output += getHeadline(prop);
            output += '<svg viewBox="0 0 ' + chartWidth + ' ' +
            chartHeight + '" class="cssstats_chart" preserveAspectRatio="none">' + "\n";

            for (var j = 0; j <= 5; j++) {
                var y = (chartHeight / 5 * j) + 0.5;


                output += '<line x1="0" y1="' + y + '" x2="' + chartWidth + '" y2="' + y + '"/>' + "\n";
                output += '<text x="3" y="' + (y + 15) + '">' +
                (highest / (j + 1)).toFixed(0) +
                '</text>' + "\n";
            }


            output += '<path d="M 0 ' + chartHeight + ' L ' + "\n";

            obj[prop].forEach(function (val) {

                var x = ((chartWidth / obj[prop].length) * i),
                    y = (chartHeight - (chartHeight / highest * val));

                output += x + ' ' + y + ' L ' + "\n";

                if (i >= obj[prop].length) {
                    output += chartWidth + ' ' + chartHeight;
                }

                i++;
            });

            output += ' z"/>' + "\n";
            output += '</svg>' + "\n";

            if (prop === 'selectorSpecificity') {
                output += '<p class="cssstats_col">' +
                'Base 10 specificity score for each selector by source order. ' +
                'Generally, lower scores and flatter curves are better for maintainability. ' +
                '<a href="http://csswizardry.com/2014/10/the-specificity-graph/">Learn More</a>' +
                '</p>' + "\n";
            } else {
                output += '<p class="cssstats_col">Number of declarations per ruleset</p>' + "\n"
            }
            output += '</section>' + "\n";
        }
    }

    return output + "\n";
};

/**
 * uses getHtmlByKeyVal()
 * for each unique value object
 * switch case for markup
 *
 * @param obj
 * @param parent
 * @returns {string}
 */
var getUniqueValuesSection = function getUniqueValuesSection(obj, parent) {

    var output = '';

    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {

            switch (prop) {
                case 'colors':
                    var markUp = '<div class="cssstats_col"><span style="color: {{ prop }}">Aa</span>' +
                        '<span class="cssstats_colors_prop">' + '{{ prop }}' +
                        '<span class="cssstats_multiplier"> ({{ value }}&times;)</span>' +
                        '</span>' +
                        '</div>';
                    break;
                case 'backgroundColors':
                    var markUp = '<div class="cssstats_col" style="background: {{ prop }}">' +
                        '<span class="cssstats_backgroundColors_prop">{{ prop }} ' +
                        '<span class="cssstats_multiplier"> ({{ value }}&times;)</span>' +
                        '</span>' +
                        '</div>';
                    break;
                case 'fontSizes':
                    var markUp = false;
                    break;
                case 'fontFamilies':
                    var markUp = '<div class="cssstats_col">' +
                        '<span style="font-family: {{ prop }}">{{ prop }} ' +
                        '<span class="cssstats_multiplier"> ({{ value }}&times;)</span>' +
                        '</span>' +
                        '</div>';
                    break;
                default:
                    var markUp = '<div class="cssstats_col cssstats_' + parent + '_{{ class }}">' +
                        '{{ prop }}: {{ value }}' +
                        '</div>';
            }


            output += '<section class="cssstats_' + prop + '">' + "\n";

            if (markUp) {
                output += getHeadline(prop);
                output += getHtmlByKeyVal(obj[prop], markUp);
            }
            else {

                output += getHeadline(obj[prop].length + ' Font Sizes');
                obj[prop].forEach(function (o) {
                    var style = o.viewSizeStr ? o.viewSizeStr : o.viewSizePx + 'px';

                    output += '<div class="cssstats_col">' +
                    '<span style="font-size: ' + style + '">Font Size: ' + o.cssSize +
                    '<span class="cssstats_multiplier"> (' + +o.amount + '&times;)</span>' +
                    '</span>' +
                    '</div>';
                });

            }
            output += '</section>' + "\n";

        }
    }

    output += getHtmlByKeyVal(obj, '');

    return output + "\n";
};

var getLintSection = function getLintSection(obj, parent) {
    var output = getHeadline(parent);

    output += '<div class="cssstats_col"><table class="cssstats_lint_results">' +
    '<thead>' +
    '<tr>' +
    '    <th>Occurrences</th>' +
    '    <th>Message</th>' +
    '    <th>Browsers</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>';

    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {

            obj[prop]['messages'].forEach(function (message) {

                var occourrence = message.line && message.col ? message.line + ' : ' + message.col : '';
                var hint = getLintMessage(message.message, message.rule.name, message.rule.desc, message.evidence);

                output += '<tr>';
                output += '<td style="border-left-color:' + getLintTypeColor(message.type) +
                '" class="cssstats_lint_occurrences">' +
                '<span class="cssstats_lint_file">' + prop + '</span>' +
                occourrence + '</td>';
                output += '<td class="cssstats_lint_message">' + hint + '</td>';
                output += '<td class="cssstats_lint_browsers">' + message.rule.browsers + '</td>';
                output += '</tr>';
            });

        }
    }

    output += '</tbody></table></div>';

    return output;
};

var getGroupedLintSection = function getGroupedLintSection(obj, parent) {
    var output = getHeadline(parent);

    for (var prop in obj) {

        var amount = obj[prop].amount;
        var messages = obj[prop].messages;

        output += '<h2 style="background:' + getLintTypeColor(prop) + '">'+ amount + ' ' + prop;
        output += amount > 1 ? 's</h2>' : '</h2>';

        for (var type in messages) {

            output += '<div style="float: none;" class="cssstats_col">' +
            '<table class="cssstats_lint_results">' +
                '<caption>'+ messages[type].amount + ' ' + type + '</caption>' +
            '<thead>' +
            '<tr>' +
            '    <th>Occurrences</th>' +
            '    <th>Message</th>' +
            '    <th>Browsers</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

            messages[type].messages.forEach(function (message) {
                var occourrence = message.line && message.col ? message.line + ' : ' + message.col : '';
                var hint = getLintMessage(message.message, message.rule.name, message.rule.desc, message.evidence);

                output += '<tr>';
                output += '<td style="border-left-color:' + getLintTypeColor(prop) +
                '" class="cssstats_lint_occurrences">' +
                '<span class="cssstats_lint_file">' + message.file + '</span>' +
                occourrence + '</td>';
                output += '<td class="cssstats_lint_message">' + hint + '</td>';
                output += '<td class="cssstats_lint_browsers">' + message.rule.browsers + '</td>';
                output += '</tr>';

            });

            output += '</tbody></table></div><hr>';
        }
    }

    return output;
};

var getLintMessage = function getLintMessage(message, rule, desc, evidence) {

    var lintMessage = '<span class="cssstats_lint_rule">Lint Rule: ' + rule + '</span>' +
        '<p><b>' + message + '</b>';

    if (desc && message !== desc) {
        lintMessage += '<br>' + desc;
    }

    if (evidence) {
        lintMessage += '</p><code>' + evidence + '</code>';
    } else {
        lintMessage += '</p>';
    }

    return lintMessage;

};

var getLintTypeColor = function getLintTypeColor(type) {

    switch (type) {
        case 'warning':
            return '#fc0';
        case 'error':
            return '#f00';
        default :
            return strToColor(type);
    }

};

var strToColor = function strToColor(str) {

    function hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    function intToRGB(i) {
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
    }

    return intToRGB(hashCode(str));

};


module.exports = parseHtml;

