module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');

    grunt.initConfig({
        typescript: {
            dist: {
                src: ['lib/**/*.ts', 'test/**/*.ts'],
                dest: 'build',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: "."
                }
            }
        }
    });

    grunt.registerTask('default', ['typescript:dist']);
};
