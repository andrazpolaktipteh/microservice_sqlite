#!/usr/bin/env node

const AmqpConnection = require('./src/AmqpConnectFunction.js');


AmqpConnection.setQueueRpcClient("test_rpc");


AmqpConnection.connect('amqp://localhost');


setInterval(sendData,1000);

function sendData(){
    AmqpConnection.send2queueRpc({data: "test data"})
}


AmqpConnection.amqpEmitter.on('queue_rpc_receive_back', (data) => {

    console.log('Received event:', data);

});