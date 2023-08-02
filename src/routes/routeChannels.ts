import { Router } from "express";
import channels from "../models/channels";
import Joi from "joi";
import { Database } from "sqlite3";
const router = Router();

/**
 * Get all channels
 */
router.get("/", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    if (req.query.first && req.query.rowcount) {
        db.all("select * from channels limit ? offset ?", [parseInt(req.query.rowcount as string), parseInt(req.query.first as string)], (err, rows) => {
            if (err) {
                res.send(JSON.stringify({ "error": err.message }));
            } else {
                res.send(rows);
            }
            db.close();
        });
    } else if (req.query.filter) {
        try {
            const filter = JSON.parse(decodeURIComponent(req.query.filter as string));
            if (filter.energy_meter_id) {
                db.all("select * from channels where energy_meter_id=?", [parseInt(filter.energy_meter_id)], (err, rows) => {
                    if (err) {
                        res.send(JSON.stringify({ "error": err.message }));
                    } else {
                        res.send(rows);
                    }
                    db.close();
                });
            }
        } catch (err) {
            res.status(400).send(err);
        }
    } else {
        db.all("select * from channels", (err, rows) => {
            if (err) {
                res.send(JSON.stringify({ "error": err.message }));
            } else {
                res.send(rows);
            }
            db.close();
        });
    }
});

/**
 * Get all channels count
 */
router.get("/count", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.get("select count(*) as count from channels", (err, rows) => {
        if (err) {
            res.send(JSON.stringify({ "error": err.message }));
        } else {
            res.send(rows);
        }
        db.close();
    });
});

/**
 * Get channel by ID
 */
router.get("/:id", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.get("select * from channels where id = ? ", [req.params.id], (err, rows) => {
        if (err) {
            res.send(JSON.stringify({ "error": err.message }));
        } else {
            res.send(rows);
        }
        db.close();
    });
});

/**
 * Delete channel by ID
 */
router.delete("/:id", async (req, res) => {
    let db = new Database(process.env.CONFIG_DB_FILE as string);
    db.run("delete from channels where id = ? ", [req.params.id], function (err) {
        if (err) {
            res.send(JSON.stringify({ error: err.message }));
        } else {
            res.send(JSON.stringify({ count: this.changes }));
        }
        db.close();
    });
});

/**
 * Update channel by ID
 */
router.put("/:id", async (req, res) => {
    let valid: Joi.ValidationResult = channels.validate(req.body);
    if (!valid.error) {
        let db = new Database(process.env.CONFIG_DB_FILE as string);
        db.run("update channels set energy_meter_id = ?, channel = ?, channel_name = ?, enabled = ? where id = ? ",
            [
                req.body.energy_meter_id,
                req.body.channel,
                req.body.channel_name,
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

/**
 * Create channel
 */
router.post("/", async (req, res) => {
    let valid: Joi.ValidationResult = channels.validate(req.body);
    if (!valid.error) {
        let db = new Database(process.env.CONFIG_DB_FILE as string);
        db.run("insert into channels (energy_meter_id, channel, channel_name, enabled) values (?,?,?,?)",
            [
                req.body.energy_meter_id,
                req.body.channel,
                req.body.channel_name,
                req.body.enabled
            ], function (err) {
                if (err) {
                    res.send(JSON.stringify({ "error": err.message }));
                } else {
                    res.send(JSON.stringify({ "lastID": this.lastID }));
                }
                db.close();
            });
    } else {
        res.status(400).send({ message: valid.error });
    }
});

export default router;
