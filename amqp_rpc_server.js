#!/usr/bin/env node

const AmqpConnection = require('./src/AmqpConnectFunction.js');
fs = require('fs');

AmqpConnection.setQueueRpcServer("test_rpc");
AmqpConnection.connect('amqp://localhost');

AmqpConnection.amqpEmitter.on('queue_rpc_receive', (data) => {

    data.data = fs.readFileSync('read.file.json', 'utf8');
    console.log('Received event:', data);

});

