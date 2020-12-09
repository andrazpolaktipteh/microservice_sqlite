#!/usr/bin/env node

let AmqpConnection = require('./src/AmqpConnectFunction.js');
const Sqlite_db = require('./src/sqlite_ap.js')
let sqlite_db = new Sqlite_db();

sqlite_db.open();





function rpcPromises(receive) {
    console.log('rpcPromises 1outside:', receive);

    return new Promise((resolve, reject) => {
        try {
            // if (receive.command === "write" && receive.table === "settings") {
            //     sqlite_db.write(receive.data);//TODO: Promise
            //     resolve({ data: receive });
            // }
            // else 
            if (receive.command === "read" && receive.table === "settings") {
                console.log('Read data1:');
                sqlite_db.readLastRow("settings")
                .then((res) => {
                    console.log('Read data:', res);
                    resolve({ data: res });
                    
                }).catch(err =>{
                    reject({error: err});

                }
                    
                    )
            }
        }
        catch (err) {
            reject({error: err});
        }

    });
};

AmqpConnection.setQueueRpcServer("ms_sqlite_rpc", rpcPromises);
AmqpConnection.connect('amqp://localhost');

const testData = {
    countInsideCorrection: 2,
    countInsideMax: 2,
    countInsideMaxDisplay: 2,
    countInsideLockDoor: 2,
    doorMode: "Open"
}
