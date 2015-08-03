///<reference path="typings/tsd.d.ts"/>

import repositories = require('./lib/repositories');
import fetcher = require('./lib/fetcher');
import webhook = require('./lib/server/webhook_listener');

import q = require('q');

fetcher.Fetcher.initPullRequestCollection().then(() => {
    console.log(repositories.PullRequestRepository.findAll());
    webhook.WebhookListener.createServer();
}).catch((error) => {
   console.error(error);
});
