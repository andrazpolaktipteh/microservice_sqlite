const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databseFolder = process.env.NODE_SQLITE_DIR || "./db/";
const databseFile = path.resolve(databseFolder, "sqlite.db");
class Sqllite_db {

    constructor() {

        this._db;
    }

    open() {
        this._db = new sqlite3.Database(databseFile, (err) => {
            if (err) {

                return console.error(err.message);
            }

            console.log('Connected to SQlite database:', databseFile);
            this.createTable();
        });
    }

    createTable() {
        this._db.run("CREATE TABLE IF NOT EXISTS settings( \
            countInsideCorrection INTEGER, \
            countInsideMax INTEGER, \
            countInsideMaxDisplay INTEGER, \
            countInsideLockDoor INTEGER, \
            doorMode TEXT)" );
    }

    close() {
        this._db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Close the database connection.');
        });

    }

    write(settings) {
        const sql = "INSERT INTO settings \
        (countInsideCorrection, countInsideMax, countInsideMaxDisplay, countInsideLockDoor, doorMode) \
        VALUES (?, ?, ?, ?, ?);";
        const values = [settings.countInsideCorrection, settings.countInsideMax, settings.countInsideMaxDisplay, settings.countInsideLockDoor, settings.doorMode];

        this._db.run(sql, values, (err) => {
            if (err) {
                this._state = "error";
                return console.error(err.message);
            }
        });
    }

    readLastRow(tableName) {
        const sql = "SELECT * FROM " + tableName + " \
        ORDER BY rowid DESC LIMIT 1;";
        console.log("read last row");
        return new Promise((resolve, reject) => {
            this._db.get(sql, (err, row) => {
                if (err) {
                    console.log("read last row:", "Error");
                    reject(err);
                    return;
                }
                console.log("read last row:", row);
                resolve(row);
            });
        });
    }
}

module.exports = Sqllite_db;