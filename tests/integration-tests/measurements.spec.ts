import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import exportedApp from "../../src/app";

describe("Measurements integration tests", () => {
    test("Invalid date at measurements", async () => {
        await request(exportedApp.app)
            .get("/api/measurements/report?ip=192.168.1.237&fromdate=2024-01-01&todate=2023-07-18&details=hourly")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.err).toBeDefined();
            })
            .expect(StatusCodes.BAD_REQUEST);
    })

    test("Invalid IP at measurements", async () => {
        await request(exportedApp.app)
            .get("/api/measurements/report?ip=192.168.1&fromdate=2023-06-01&todate=2023-07-18&details=hourly")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.err).toBeDefined();
            })
            .expect(StatusCodes.BAD_REQUEST);
    })

    test("Invalid details at measurements", async () => {
        await request(exportedApp.app)
            .get("/api/measurements/report?ip=192.168.1.237&fromdate=2023-06-01&todate=2023-07-18&details=h")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.err).toBeDefined();
            })
            .expect(StatusCodes.BAD_REQUEST);
    })

    test("Request measurements list", async () => {
        await request(exportedApp.app)
            .get("/api/measurements/report?ip=192.168.1.237&fromdate=2023-06-26&todate=2023-07-18&details=hourly")
            .set("Accept", "application/json")
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.length).toBeGreaterThanOrEqual(0);
            })
            .expect(StatusCodes.OK);
    })

    afterAll(() => {
        exportedApp.server.close();
    })
});