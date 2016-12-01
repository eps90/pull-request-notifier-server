import {PullRequestRepository} from './lib/repositories';
import {Fetcher} from './lib/fetcher';
import {WebhookListener} from './lib/server/webhook_listener';
import {SocketServer} from './lib/server/socket_server';

Fetcher.initPullRequestCollection().then(() => {
    console.log(PullRequestRepository.findAll());
    WebhookListener.createServer();
    SocketServer.startSocketServer();
}).catch((error) => {
   console.error(error);
});
