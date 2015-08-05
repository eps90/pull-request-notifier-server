///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');

export class SocketServer {
    static startSocketServer() {
        var io = Server(8765);

        io.on('connection', (socket) => {
            socket.on('client:introduce', (username: string) => {
                socket.join(username);

                var userPullRequests = new models.UserPullRequestsSet();
                userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(username);
                userPullRequests.assigned = repositories.PullRequestRepository.findByReviewer(username);

                io.to(username).emit('server:introduced', userPullRequests);
            });
        });
    }
}
