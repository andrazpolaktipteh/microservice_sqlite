#!/usr/bin/env node

const AmqpConnection = require('./src/AmqpConnectFunction.js');


AmqpConnection.setQueueRpcClient("ms_sqlite_rpc");


AmqpConnection.connect('amqp://localhost');


const testData = {
    countInsideCorrection: 2,
    countInsideMax: 2,
    countInsideMaxDisplay: 2,
    countInsideLockDoor: 2,
    doorMode: "Open"
}


setInterval(sendData,1000);

setInterval(readData,1000);

function sendData(){
    testData.countInsideCorrection++;
   // AmqpConnection.send2queueRpc({command: "write", table:"settings", data: testData})
}

function readData(){
    testData.countInsideCorrection++;
    AmqpConnection.send2queueRpc({command: "read", table:"settings"})
}


AmqpConnection.amqpEmitter.on('queue_rpc_receive_back', (data) => {

    console.log('Received event:', data);

});