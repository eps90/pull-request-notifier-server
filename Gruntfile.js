module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shipit');
    grunt.loadNpmTasks('shipit-deploy');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bump');

    grunt.initConfig({
        typescript: {
            build: {
                src: ["typings/index.d.ts", 'lib/**/*.ts'],
                dest: 'build',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: ".",
                    moduleResolution: "node"
                }
            },
            test: {
                src: ["typings/index.d.ts", "custom_typings/*.d.ts", 'test/**/*.ts'],
                dest: 'build',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: ".",
                    moduleResolution: "node",
                    sourceMap: true,
                    files: [
                        "typings/index.d.ts"
                    ]
                }
            },
            dist: {
                src: ["typings/index.d.ts", 'index.ts'],
                dest: 'dist',
                options: {
                    module: "commonjs",
                    target: "es5",
                    basepath: ".",
                    moduleResolution: "node"
                }
            },
            bin: {
                src: ["typings/index.d.ts", 'bin/install.ts'],
                dest: 'dist',
                options: {
                    module: "commonjs",
                    target: "es5",
                    moduleResolution: "node"
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
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        src: ['node_modules/**', 'paramfile.json', 'config/*'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        bump: {
            options: {
                files: ['package.json'],
                commit: true,
                push: false,
                tagName: 'v%VERSION%',
                tagMessage: 'Release version v%VERSION%'
            }
        },

        // @todo Stop/start supervisor program on deploy
        shipit: {
            options: {
                workspace: '/tmp/bitbucket-notifier',
                deployTo: '/tmp/bitbucket-notifier',
                dirToCopy: 'dist',
                repositoryUrl: 'git@bitbucket.org:dacsoftware/bitbucket-notifier.git',
                ignores: ['.git'],
                keepReleases: 3
            },
            staging: {
                servers: 'root@127.0.0.1'
            }
        }
    });

    grunt.registerTask('deploy:install', function () {
        grunt.shipit.local('npm install', {cwd: grunt.shipit.config.workspace}, this.async());
    });

    grunt.registerTask('deploy:build', function () {
        grunt.shipit.local('grunt dist', {cwd: grunt.shipit.config.workspace}, this.async());
    });

    grunt.registerTask('deploy:config', function () {
        grunt.shipit.remote('cd ' + grunt.shipit.currentPath +' && node bin/install.js', this.async());
    });

    grunt.registerTask('supervisor:stop', function () {
        grunt.shipit.remote('sudo supervisorctl stop bitbucket:* ');
    });

    grunt.registerTask('supervisor:start', function () {
        grunt.shipit.remote('sudo supervisorctl start bitbucket:* ');
    });

    grunt.shipit.on('deploy', function () {
        grunt.task.run(['supervisor:stop']);
    });

    grunt.shipit.on('fetched', function () {
        grunt.task.run(['deploy:install', 'deploy:build']);
    });

    grunt.shipit.on('published', function () {
        grunt.task.run(['deploy:config', 'supervisor:start']);
    });

    grunt.registerTask('default', ['clean:build', 'typescript:build']);
    grunt.registerTask('test', ['clean:build', 'typescript:test', 'mochaTest:unit']);
    grunt.registerTask('dist', ['clean:dist', 'typescript:dist', 'typescript:bin', 'copy:dist']);
};
