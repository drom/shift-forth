module.exports = function(grunt) {
    'use strict';
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        eslint: {
            all: ['Gruntfile.js', 'lib/*.js']
        },
        browserify: {
          dist: {
            files: {
              'demo/compiler.all.js': ['lib/compiler.js']
            }
          }
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
        },
        watch: {
            scripts: {
                files: ['lib/*.js'],
                tasks: ['default'],
                options: {
                    spawn: false
                }
            }
        },
        'bower-install-simple': {
            options: {
                color: true,
                directory: 'components'
            },
            prod: {
                options: {
                    production: true
                }
            },
            dev: {
                options: {
                    production: false
                }
            }
        }
    });

    // plugins
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bower-install-simple');

    // tasks
    grunt.registerTask('mocha', ['mochaTest']);
    grunt.registerTask('default', ['bower-install-simple', 'eslint', 'mocha', 'browserify']);
};
