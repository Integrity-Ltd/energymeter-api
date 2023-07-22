import request from "supertest";
import { StatusCodes } from "http-status-codes";
import exportedApp from "../../src/app";

jest.setTimeout(60000);
describe("EnergyMeter integration tests", () => {
    let lastID: number;
    beforeAll(async () => { })


    test("Create unfilled energymeter", async () => {
        const energymeter = {
            asset_name: "test1",
            ip_address: "192.168.1.239",
            enabled: false
        };
        await request(exportedApp.app)
            .post("/api/admin/crud/energy_meter/")
            .send(energymeter)
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.message).toBeDefined();
            })
            .expect(StatusCodes.BAD_REQUEST);
    })

    test("Create energymeter", async () => {
        const energymeter = {
            asset_name: "test1",
            ip_address: "192.168.1.237",
            port: 50003,
            time_zone: "Europe/Budapest",
            enabled: false
        };
        await request(exportedApp.app)
            .post("/api/admin/crud/energy_meter/")
            .send(energymeter)
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                lastID = parsedObj.lastID;
                expect(parsedObj.lastID).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    test("Energymeters count", async () => {
        await request(exportedApp.app)
            .get("/api/admin/crud/energy_meter/count")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toBeGreaterThanOrEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    test("Request energymeters list", async () => {
        await request(exportedApp.app)
            .get("/api/admin/crud/energy_meter/")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.length).toBeGreaterThanOrEqual(1);
                expect(parsedObj[0].id).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    test("Update energymeter", async () => {
        const energymeter = {
            asset_name: "test12",
            ip_address: "192.168.1.239",
            port: 50003,
            time_zone: "Europe/Budapest",
            enabled: false
        }
        await request(exportedApp.app)
            .put("/api/admin/crud/energy_meter/" + lastID)
            .send(energymeter)
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    test("Get specified energymeter", async () => {
        await request(exportedApp.app)
            .get("/api/admin/crud/energy_meter/" + lastID)
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.asset_name).toEqual("test12");
            })
            .expect(StatusCodes.OK);
    })


    test("Delete energymeter", async () => {
        await request(exportedApp.app)
            .delete("/api/admin/crud/energy_meter/" + lastID)
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    afterAll(() => {
        exportedApp.server.close();
    })
})