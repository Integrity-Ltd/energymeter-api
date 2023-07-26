import { Router } from "express";
import moment from "moment-timezone";
import path from "path";
import { Database } from "sqlite3";
import DBUtils from "../../../energymeter-utils/src/utils/DBUtils";
import fs from "fs";
import report from "../models/report";
import Joi from "joi";

const router = Router();

/**
 * Report measurements
 */
router.get("/report", async (req, res) => {
    let valid: Joi.ValidationResult = report.validate(req.query);

    if (valid.error) {
        console.log("Invalid query!");
        res.status(400).send({ err: valid.error.message });
        return;
    }

    const ip = req.query.ip as string;
    const details = req.query.details as string;
    const channel = parseInt(req.query.channel as string);

    const configDB = new Database(process.env.CONFIG_DB_FILE as string);

    let timeZone = moment.tz.guess();
    const tzone = await DBUtils.runQuery(configDB, "select time_zone from energy_meter where ip_address=? and enabled = 1", [ip]);
    if (tzone.length > 0) {
        timeZone = tzone[0].time_zone;
    }
    const fromDate = moment.tz(req.query.fromdate as string, "YYYY-MM-DD", timeZone);
    const toDate = moment.tz(req.query.todate as string, "YYYY-MM-DD", timeZone);

    if (!fromDate.isBefore(toDate)) {
        res.status(400).send({ err: "invalid date range" });
        return;
    }

    let measurements: any[];
    if (fromDate.get("year") < moment().get("year")) {
        measurements = await getYearlyMeasurementsFromDBs(fromDate, toDate, ip, channel);
    } else {
        measurements = await DBUtils.getMeasurementsFromDBs(fromDate, toDate, ip, channel);
    }
    let result = DBUtils.getDetails(measurements, timeZone, details, false);
    res.send(result);
});

async function getYearlyMeasurementsFromDBs(fromDate: moment.Moment, toDate: moment.Moment, ip: string, channel: number): Promise<any[]> {
    let result: any[] = [];
    const filePath = (process.env.WORKDIR as string);
    const dbFile = path.join(filePath, ip, fromDate.format("YYYY") + "-yearly.sqlite");
    if (fs.existsSync(dbFile)) {
        const db = new Database(dbFile);
        try {
            const fromSec = fromDate.unix();
            const toSec = toDate.unix();
            let filters = [fromSec, toSec];
            if (channel) {
                filters.push(channel);
            }
            let measurements = await DBUtils.runQuery(db, "select * from measurements where recorded_time between ? and ? " + (channel ? "and channel=?" : "") + " order by recorded_time, channel", filters);
            measurements.forEach((element: any) => {
                result.push(element);
            })
        } catch (err) {
            console.error(moment().format(), err);
        } finally {
            db.close();
        }
    }

    return result;
}

export default router;