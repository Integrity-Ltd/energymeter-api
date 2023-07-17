import { Router } from "express";
import moment from "moment-timezone";
import path from "path";
import { Database } from "sqlite3";
import DBUtils from "../../../energymeter-utils/src/utils/DBUtils";
import fs from "fs";
import report from "../models/report";
import Joi from "joi";
import { time } from "console";
import { channel } from "diagnostics_channel";

const router = Router();

router.get("/report", async (req, res) => {
    let valid: Joi.ValidationResult = report.validate(req.query);

    if (valid.error) {
        console.log("Invalid query!");
        res.status(400).send({ err: valid.error.message });
        return;
    }

    const fromDate = moment(req.query.fromdate as string, "YYYY-MM-DD");
    const toDate = moment(req.query.todate as string, "YYYY-MM-DD");
    const ip = req.query.ip as string;
    const details = req.query.details as string;
    const channel = parseInt(req.query.channel as string);

    if (!fromDate.isBefore(toDate)) {
        res.status(400).send({ err: "invalid date range" });
        return;
    }

    const configDB = new Database(process.env.CONFIG_DB_FILE as string);

    let timeZone = moment.tz.guess();
    const tzone = await DBUtils.runQuery(configDB, "select time_zone from energy_meter where ip_address=? and enabled = 1", [ip]);
    if (tzone.length > 0) {
        timeZone = tzone[0].time_zone;
    }

    let measurements = await getMeasurementsFromDBs(fromDate, toDate, ip, channel);
    let result: any[] = [];
    let prevElement: any = {};
    let lastElement: any = {};
    const isHourlyEnabled = details == 'hourly';
    const isDaily = details == 'daily';
    const isMonthly = details == 'monthly';
    let isAddableEntry = false;
    measurements.forEach((element: any, idx: number) => {
        if (prevElement[element.channel] == undefined) {
            prevElement[element.channel] = { recorded_time: element.recorded_time, measured_value: element.measured_value, channel: element.channel, diff: 0 };
        } else {
            const roundedPrevDay = moment.unix(prevElement[element.channel].recorded_time).tz(timeZone).set("hour", 0).set("minute", 0).set("second", 0);
            const roundedDay = moment.unix(element.recorded_time).tz(timeZone).set("hour", 0).set("minute", 0).set("second", 0);
            const diffDays = roundedDay.diff(roundedPrevDay, "days");
            const isDailyEnabled = isDaily && diffDays >= 1;

            const roundedPrevMonth = moment.unix(prevElement[element.channel].recorded_time).tz(timeZone).set("date", 1).set("hour", 0).set("minute", 0).set("second", 0);
            const roundedMonth = moment.unix(element.recorded_time).tz(timeZone).set("date", 1).set("hour", 0).set("minute", 0).set("second", 0);
            const diffMonths = roundedMonth.diff(roundedPrevMonth, "months");
            const isMonthlyEnabled = isMonthly && diffMonths >= 1;
            isAddableEntry = isHourlyEnabled || isDailyEnabled || isMonthlyEnabled;
            if (isAddableEntry) {
                prevElement[element.channel] = {
                    recorded_time: element.recorded_time,
                    from_utc_time: moment.unix(prevElement[element.channel].recorded_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                    to_utc_time: moment.unix(element.recorded_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                    from_local_time: moment.unix(prevElement[element.channel].recorded_time).tz(timeZone).format("YYYY-MM-DD HH:mm:ss"),
                    to_local_time: moment.unix(element.recorded_time).tz(timeZone).format("YYYY-MM-DD HH:mm:ss"),
                    measured_value: element.measured_value,
                    channel: element.channel,
                    diff: element.measured_value - prevElement[element.channel].measured_value
                };
                result.push({ ...prevElement[element.channel] });
            }

            lastElement[element.channel] = { recorded_time: element.recorded_time, measured_value: element.measured_value, channel: element.channel };
        }
    });
    if (!isAddableEntry) {
        Object.keys(lastElement).forEach((key) => {
            try {
                const diff = lastElement[key].measured_value - prevElement[lastElement[key].channel].measured_value;
                prevElement[lastElement[key].channel] = {
                    recorded_time: lastElement[key].recorded_time,
                    from_utc_time: moment.unix(prevElement[lastElement[key].channel].recorded_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                    to_utc_time: moment.unix(lastElement[key].recorded_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                    from_local_time: moment.unix(prevElement[lastElement[key].channel].recorded_time).format("YYYY-MM-DD HH:mm:ss"),
                    to_local_time: moment.unix(lastElement[key].recorded_time).format("YYYY-MM-DD HH:mm:ss"),
                    measured_value: lastElement[key].measured_value,
                    channel: lastElement[key].channel,
                    diff: diff
                };
                if (diff != 0) {
                    result.push({ ...prevElement[lastElement[key].channel] });
                }
            } catch (err) {
                console.error(moment().format(), err);
            }
        });
    }
    res.send(result);
});

export default router;

async function getMeasurementsFromDBs(fromDate: moment.Moment, toDate: moment.Moment, ip: string, channel: number): Promise<any[]> {
    let monthlyIterator = moment(fromDate);
    let result: any[] = [];
    while (monthlyIterator.isBefore(toDate) || monthlyIterator.isSame(toDate)) {
        const filePath = (process.env.WORKDIR as string);
        const dbFile = filePath + (filePath.endsWith(path.sep) ? "" : path.sep) + ip + path.sep + monthlyIterator.format("YYYY-MM") + "-monthly.sqlite";
        if (fs.existsSync(dbFile)) {
            const db = new Database(dbFile);
            try {
                const fromSec = fromDate.unix();
                const toSec = toDate.unix();
                let options = [fromSec, toSec];
                if (channel) {
                    options.push(channel);
                }
                let measurements = await DBUtils.runQuery(db, "select * from measurements where recorded_time between ? and ? " + (channel ? "and channel=?" : "") + " order by recorded_time, channel", options);
                measurements.forEach((element: any) => {
                    result.push(element);
                })
            } catch (err) {
                console.error(moment().format(), err);
            } finally {
                db.close();
            }
        }
        monthlyIterator.add(1, "months");
    }

    return result;
}