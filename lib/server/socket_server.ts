///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');

export class SocketServer {
    private static io: SocketIO.Server;
    static startSocketServer() {
        this.io = Server(8765);

        this.io.on('connection', (socket) => {
            socket.on('client:introduce', (username: string) => {
                socket.join(username);

                var userPullRequests = new models.UserPullRequestsSet();
                userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(username);
                userPullRequests.assigned = repositories.PullRequestRepository.findByReviewer(username);

                this.io.to(username).emit('server:introduced', userPullRequests);
            });
        });
    }

    static stopSocketServer() {
        this.io.close();
    }
}
