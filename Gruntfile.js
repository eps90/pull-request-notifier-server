module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.initConfig({
        typescript: {
            dist: {
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
            }
        },
        mochaTest: {
            unit: {
                options: {
                    reporter: 'spec'
                },
                src: ['build/test/*.js']
            }
        }
    });

    grunt.registerTask('default', ['typescript:dist']);
    grunt.registerTask('test', ['typescript:test', 'mochaTest:unit']);
};
