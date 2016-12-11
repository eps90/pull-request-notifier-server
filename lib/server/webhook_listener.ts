import logger from './../logger';
import * as http from 'http';
import {EventPayloadHandler} from './event_payload_handler';
import {Config} from '../config';

export class WebhookListener {
    static createServer(): http.Server {
        logger.logHttpServerStart();
        var server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
            logger.logIncomingHttpRequest();

            if (req.method === 'POST') {
                var reqBody  = '';
                req.on('data', (chunk) => {
                    reqBody += chunk;
                });

                req.on('end', () => {
                    logger.logRequestDecoded(reqBody);

                    if (req.headers.hasOwnProperty('x-event-key')) {
                        var eventType = req.headers['x-event-key'];
                        logger.logRequestWithPayload(eventType);
                        EventPayloadHandler.handlePayload(eventType, reqBody).then(() => {
                            res.writeHead(200, 'OK');
                            res.end();
                        });
                    } else {
                        logger.logRequestWithNoEvent(reqBody);
                        res.writeHead(400, 'Bad request');
                        res.end();
                    }
                });
            } else {
                logger.logUnsupportedRequestMethod(req.method);
                res.writeHead(405, 'Method not allowed');
                res.end();
            }
        });

        var config = Config.getConfig();
        var webhookPort = config.webhook_port;
        server.listen(webhookPort);
        logger.logHttpServerStartListening(webhookPort.toString());

        return server;
    }
}
