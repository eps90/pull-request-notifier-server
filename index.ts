///<reference path="typings/tsd.d.ts"/>

import repositories = require('./lib/repositories');
import fetcher = require('./lib/fetcher');

import q = require('q');

fetcher.Fetcher.initPullRequestCollection().then(() => {
    console.log(repositories.PullRequestRepository.findAll());
}).catch((error) => {
   console.error(error);
});
