import { Router } from "express";
import energy_meter from "../models/energy_meter";
import Joi from "joi";
import { Database } from "sqlite3";
import moment from "moment";
import path from "path";
import fs from "fs";
import DBUtils from "../../../energymeter-utils/src/utils/DBUtils";
const router = Router();

router.get("/", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    if (req.query.first && req.query.rowcount) {
        db.all("select * from energy_meter limit ? offset ?", [parseInt(req.query.rowcount as string), parseInt(req.query.first as string)], (err, rows) => {
            if (err) {
                res.send(JSON.stringify({ "error": err.message }));
            } else {
                res.send(rows);
            }
            db.close();
        });
    } else {
        db.all("select * from energy_meter", (err, rows) => {
            if (err) {
                res.send(JSON.stringify({ "error": err.message }));
            } else {
                res.send(rows);
            }
            db.close();
        });
    }
});

router.get("/count", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.get("select count(*) as count from energy_meter", (err, rows) => {
        if (err) {
            res.send(JSON.stringify({ "error": err.message }));
        } else {
            res.send(rows);
        }
        db.close();
    });
});

router.get("/:id", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.get("select * from energy_meter where id = ? ", [req.params.id], (err, rows) => {
        if (err) {
            res.send(JSON.stringify({ "error": err.message }));
        } else {
            res.send(rows);
        }
        db.close();
    });
});

router.delete("/:id", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.run("delete from channels where energy_meter_id = ? ", [req.params.id], async function (err) {
        if (err) {
            res.send(JSON.stringify({ "error": err.message }));
            db.close();
        } else {
            let path = "";
            const row = await DBUtils.runQuery(db, "select ip_address from energy_meter where id = ?", [req.params.id]);
            if (row && row.length > 0) {
                path = DBUtils.getDBFilePath(row[0].ip_address);
            }
            db.run("delete from energy_meter where id = ? ", [req.params.id], function (err) {
                if (err) {
                    res.send(JSON.stringify({ "error": err.message }));
                } else {
                    if (fs.existsSync(path)) {
                        try {
                            fs.rmSync(path, { recursive: true });
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    res.send(JSON.stringify({ count: this.changes }));
                }
                db.close();
            });
        }
    });
});

router.put("/:id", async (req, res) => {
    let valid: Joi.ValidationResult = energy_meter.validate(req.body);
    if (!valid.error) {
        let db = new Database(process.env.CONFIG_DB_FILE as string);
        db.run("update energy_meter set asset_name = ?, ip_address = ?, port = ?, time_zone = ?, enabled = ? where id = ? ",
            [
                req.body.asset_name,
                req.body.ip_address,
                req.body.port,
                req.body.time_zone,
                req.body.enabled,
                req.params.id
            ], function (err) {
                if (err) {
                    res.send(JSON.stringify({ "error": err.message }));
                } else {
                    res.send(JSON.stringify({ count: this.changes }));
                }
                db.close();
            });
    } else {
        res.status(400).send({ message: valid.error });
    }
});

router.post("/", async (req, res) => {
    let valid: Joi.ValidationResult = energy_meter.validate(req.body);
    if (!valid.error) {
        let db = new Database(process.env.CONFIG_DB_FILE as string);
        let rows = await DBUtils.runQuery(db, "select * from energy_meter where ip_address=?", [req.body.ip_address]);
        if (rows && rows.length > 0) {
            res.status(400).send({ message: "Duplicated IP address" });
        } else {
            db.run("insert into energy_meter (asset_name, ip_address, port, time_zone, enabled) values (?,?,?,?,?)",
                [
                    req.body.asset_name,
                    req.body.ip_address,
                    req.body.port,
                    req.body.time_zone,
                    req.body.enabled
                ], async function (err) {
                    if (err) {
                        res.send(JSON.stringify({ "error": err.message }));
                    } else {
                        const lastID = this.lastID;
                        let message: any[] = [];
                        message.push({ lastID: lastID });
                        const insertMoment = moment();
                        const filePath = (process.env.WORKDIR as string);
                        const subdir = path.join(filePath, req.body.ip_address);
                        if (!fs.existsSync(subdir)) {
                            fs.mkdirSync(subdir, { recursive: true });
                        }
                        const dbFile = path.join(subdir, insertMoment.format("YYYY-MM") + "-monthly.sqlite");
                        let measurementsDB: Database;
                        try {
                            if (!fs.existsSync(dbFile)) {
                                measurementsDB = new Database(dbFile);
                                await DBUtils.runQuery(measurementsDB, `CREATE TABLE "Measurements" ("id" INTEGER NOT NULL,"channel" INTEGER,"measured_value" REAL,"recorded_time" INTEGER, PRIMARY KEY("id" AUTOINCREMENT))`, []);
                            } else {
                                measurementsDB = new Database(dbFile);
                            }
                            let channels: string[] = [];
                            for (let i: number = 1; i <= 12; i++) {
                                await DBUtils.runQuery(db, "insert into channels (energy_meter_id, channel, channel_name, enabled) values (?,?,?,?)", [lastID, i, `ch${i}`, true]);
                                channels.push(i.toString())
                            }
                            measurementsDB.close();
                            await DBUtils.getMeasurementsFromEnergyMeter(moment(), req.body, channels);
                        } catch (err) {
                            console.error(moment().format(), err);
                            if (err) {
                                message.push({ message: err.toString() });
                            }
                        }

                        res.send(JSON.stringify(message));
                    }
                    db.close();
                });
        }
    } else {
        res.status(400).send({ message: valid.error });
    }
});

export default router;
