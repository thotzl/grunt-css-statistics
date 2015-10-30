# grunt-css-statistics
[![Current Version](https://img.shields.io/npm/v/ddp-dump.svg)](https://www.npmjs.org/package/ddp-dump)
[![Dependency Status](https://david-dm.org/hxseven/ddp-dump.svg)](https://david-dm.org/hxseven/ddp-dump)

> Grunt plugin like cssstats.com. Generates Json and HTML. Has CSSLint support.

This is beta. No unit tests yet. With some config variations it may be buggy. 

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-css-statistics --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-css-statistics');
```

## The "cssstats" task

### Overview
In your project's Gruntfile, add a section named `cssstats` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  cssstats: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.logConsole
Type: `Bool`
Default value: `false`

Writes the CssStats object to the console.

#### options.jsonOutput
Type: `Bool`
Default value: `true`

If set to `true` a JSON file with the CssStats Object will be written to the destination folder.
The filename will be `[TARGETNAME].cssstats.json`.

#### options.htmlOutput
Type: `Bool`
Default value: `true`

If set to `true` a HTML file with the CssStats results will be written to the destination folder.
The filename will be `[TARGETNAME].cssstats.html`.

#### options.uniqueDeclarations
Type: `Array`
Default value: 
```js
[
  'font-size',
  'float',
  'width',
  'height',
  'color',
  'background-color'
]
```

Every Css property in this array will be added to the uniqueDeclarations section.

#### options.addOrigin
Type: `Bool`
Default value: `false`

If set to `true` the original CssStats Object from the Node module will be added to the grunt-css-statistics object.
You will only get a viewable output in the JSON file.

#### options.addRawCss
Type: `Bool`
Default value: `false`

If set to `true` the analyzed CSS will be added to the object and a code tag with the the analyzed CSS will be added to the HTML output.
Warning: If you're working with really large CSS files this can slow down the process extremely.

#### options.addHtmlStyles
Type: `Bool`
Default value: `false`

If set to `true` the analyzed styles will be added to the head of the html file.
Warning: If you're working with really large CSS files this can slow down the process extremely.

#### options.addGraphs
Type: `Bool`
Default value: `false`

If set to `true` the you will get the 'Selector Specificity' and the 'Ruleset Size' as a graph in the html file.
Warning: If you're working with really large CSS files this can slow down the process extremely.

#### options.csslint
Type: `Bool | String | Object`
Default value: `false`

CSSLint is not included in the dependencies. You have to install it first with `npm install csslint --save-dev`.
For more information about CSSLint visit https://github.com/stubbornella/csslint/wiki.

For more information about CSSLint rules visit https://github.com/CSSLint/csslint/wiki/Rules.

##### Case `Bool`

```js
  csslint: true
```

You will get the analysis of your Stylesheets with CSSLint's standard ruleset. 

##### Case `String`

```js
  csslint: 'path/to/ruleset.json'
```
You will get the analysis of your Stylesheets with your own ruleset. Your own ruleset will be merged with the CSSLint standards.
You have to set rules to false if you don't want them.
Ruleset files have to be JSON.

##### Case `Object`

```js
  csslint:            {
    clearDefaults: false,                         // true = deletes all standard rules
    ruleset:  {
        rulesetFile: 'path/to/rulesetFile.json', // path to your ruleset file
        'zero-units': true,                      // adds zero-units to ruleset
        'adjoining-classes': false
    },
    groupResults: true                           // group analysis by rules
  }
```
Take a look at the comments.

##### todo
Add ability to define own rules.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  cssstats: {
    options: {},
    files: {
      'path/to/outputFolder': ['path/to/src/**/*.css', 'path/to/123.css'],
    },
  },
});
```

#### Custom Options
```js
grunt.initConfig({
  cssstats: {
    options: {
      logConsole: false,
      jsonOutput: true,
      htmlOutput: true,
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
      csslint:            {
        clearDefaults: false,
        ruleset:  {
            rulesetFile: 'path/to/rulesetFile.json',
            'zero-units': true,
            'adjoining-classes': true
        },
        groupResults: true
      }
    },
    files: {
      'path/to/outputFolder': ['path/to/src/**/*.css']
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 0.9.2 - a little bit of clean up …
- 0.9.1 - added csslint option - fix for rulesets
- 0.9.0 - added csslint option
- 0.8.4 - minor changes on readme.md
- 0.8.0
