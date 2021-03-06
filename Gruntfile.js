/*
 * grunt-cssstats
 * https://github.com/thotzl/grunt-css-statistics
 *
 * Copyright (c) 2015 Torsten 'thotzl' Hötzel
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    cssstats: {
      options: {
        logConsole:   false,
        jsonOutput:   true,
        htmlOutput:   true,

        addOrigin:      false,
        addRawCss:      false,
        addHtmlStyles:  false,
        addGraphs:      true,
        csslint:            {
          clearDefaults: false,                         // true = deletes all standard rules
          ruleset:  {// path to your ruleset file
            'zero-units': true,                      // adds zero-units to ruleset
            'adjoining-classes': false
          },
          groupResults: true                           // group analysis by rules
        }
      },
      compact: {
        files: {
          'tmp/default': ['test/fixtures/*.css']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'cssstats', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
