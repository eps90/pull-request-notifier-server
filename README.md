# Bitbucket Notifier - server side

## Requirements

* node.js >= 0.12.x
* npm >= 2.11
* grunt-cli >= 0.1.13

## Installation

### Grunt-cli
If you don't already have **grunt-cli** installed, you can install it with **npm**:

```bash
[sudo] npm install -g grunt-cli
```

### Project
To install project dependencies, simply run the following command from root directory of the project:
 
```bash
npm install
```

After successful installation there will be installed **typescript definitions** (see below). 

## Testing and development
### Foreword
1. Project sources are written in [TypeScript](http://www.typescriptlang.org/).
2. Unit/functional tests are written with [chai](http://chaijs.com) assertion framework
3. [Mocha](http://mochajs.org) has been used as a test runner
4. You can also find [tslint](https://github.com/palantir/tslint) as TypeScript code linter.
5. TypeScript requires **definition files** for proper compilation. This project uses [tsd](http://definitelytyped.org/tsd/) as definitions manager

### Playing with code
`Gruntfile.js` has been configured with couple of tasks useful while developing the application. All following tasks can be run with `grunt [task_name]`:

* **typescript:build** - compiles all `*.ts` files in `lib` directory into `build` directory
* **typescript:test** - compiles all `*.ts` files in `test` directory into `build` directory
* **typescript:dist** - compiles whole project (or at least all necessary files) into `dist` directory
* **mochaTest:unit** - executes whole project test suite
* **tslint** - executes `tslint` and displays errors
* **clean:build** - removes `build` directory
* **clean:dist** - removes `dist` directory

Moreover, there are some *bundled* tasks running some of the tasks above sequentially:

* `grunt` - default task; removes `build` directory and compiles scripts included in `lib` directory
* `grunt test` - removes `build` directory, compiles scripts included in `lib` directory and runs test suite
* `grunt dist` - removes `dist` directory and compiles whole project 

### Running the tests
Running the following in the command line will execute `grunt test` command:

```bash
npm test
```

### Starting the project 
Running the following command will execute `grunt test`:

```bash
npm start
```

## Deployment
The project uses [ShiptIt](https://github.com/shipitjs/shipit) for deployment. ShipIt has built-in Grunt integation so deploying the app can be done by running the following:
```bash
grunt shipit:[stage] deploy
```
Available stages:

* staging

ShipIt will create a `current` and `releases` directories, like **Capistrano**.

## Things to be done

* Little refactor :) Some things have been already marked as _@todo_ in code so keep an eye on it.
* Migrate from Grunt to Gulp

## Additional featutes (TBD)

1. **Tags parser** - parse tags from comments/description to provide additional custom metadata of project
2. **PR pub/sub** - subscribe to the pull request to follow the actions on it. In effect, subscribed user will get the same (or similar) notifications as well as assigned/authored user
3. **PR todo list** - in general for QA. After the PR has been merged, it should appear in _TODO LIST_ for client that has _QA_ role. Needs a local database.
