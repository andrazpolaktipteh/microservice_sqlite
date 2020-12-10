#!/usr/bin/env node

const AmqpConnection = require('./src/AmqpConnectFunction.js');
AmqpConnection.setQueueRpcClient("ms_sqlite_rpc");

AmqpConnection.connect('amqp://localhost');

setInterval(readData,500);

function readData(){

    AmqpConnection.sendRpc({command: "read", table:"settings"})
    .then((data) => {

        console.log('Received event1:', data);

    })
}
