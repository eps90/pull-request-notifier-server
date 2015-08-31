module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shipit');
    grunt.loadNpmTasks('shipit-deploy');

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
            },
            bin: {
                src: ['bin/install.ts'],
                dest: 'dist',
                options: {
                    module: "commonjs",
                    target: "es5"
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
        },

        // @todo Clean up unnecessary files
        // @todo Clean up local node modules on deploy
        // @todo Stop/start supervisor program on deploy
        shipit: {
            options: {
                workspace: '/tmp/bitbucket-notifier',
                deployTo: '/tmp/bitbucket-notifier',
                repositoryUrl: 'git@bitbucket.org:dacsoftware/bitbucket-notifier.git',
                ignores: ['.git'],
                keepReleases: 3
            },
            staging: {
                servers: 'root@127.0.0.1'
            }
        }
    });

    grunt.registerTask('install:deps', function () {
        grunt.shipit.local('npm install', {cwd: '/tmp/bitbucket-notifier'}, this.async());
    });

    grunt.registerTask('ts:build', function () {
        grunt.shipit.local('grunt dist', {cwd: '/tmp/bitbucket-notifier'}, this.async());
    });

    grunt.registerTask('install:config', function() {
        grunt.shipit.remote('cd /tmp/bitbucket-notifier && node dist/bin/install.js', this.async());
    });

    grunt.shipit.on('fetched', function () {
        grunt.task.run(['install:deps', 'typescript:build']);
    });

    grunt.shipit.on('updated', function () {
        grunt.task.run('install:config');
    });

    grunt.registerTask('default', ['clean:build', 'typescript:build']);
    grunt.registerTask('test', ['clean:build', 'typescript:test', 'mochaTest:unit']);
    grunt.registerTask('dist', ['clean:dist', 'typescript:dist', 'typescript:bin']);
};
