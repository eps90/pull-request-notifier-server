module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        typescript: {
            build: {
                src: ['lib/**/*.ts'],
                dest: 'build',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: "."
                }
            },
            test: {
                src: ['test/**/*.ts'],
                dest: 'build',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: "."
                }
            },
            dist: {
                src: ['index.ts'],
                dest: 'dist',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: "."
                }
            }
        },
        mochaTest: {
            unit: {
                options: {
                    reporter: 'spec',
                    require: 'build/test/bootstrap.js'
                },
                src: ['build/test/**/*_test.js']
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['lib/**/*.ts', 'test/**/*.ts']
            }
        },
        clean: {
            build: ['build'],
            dist: ['dist']
        }
    });

    grunt.registerTask('default', ['clean:build', 'typescript:build']);
    grunt.registerTask('test', ['clean:build', 'typescript:test', 'mochaTest:unit']);
    grunt.registerTask('dist', ['clean:dist', 'typescript:dist']);
};
