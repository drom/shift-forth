module.exports = function(grunt) {
    'use strict';
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        eslint: {
            all: ['Gruntfile.js', 'lib/*.js']
        },
        mochaTest: {
            test: {
                options: {
                    mochaOptions: {
                        'inline-diffs': true
                    }
                },
                src: ['test/*.js']
            }
        },
        clean: {
            node: ['node_modules']
        }
    });

    // plugins
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');

    // tasks
    grunt.registerTask('mocha', ['mochaTest']);
    grunt.registerTask('default', ['eslint', 'mocha']);
};
