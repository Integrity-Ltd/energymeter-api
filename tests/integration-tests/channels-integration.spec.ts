import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import exportedApp from "../../src/app";

describe('EnergyMeter integration tests', () => {
    let lastID: number;
    let energy_meter_id: number;
    beforeAll(async () => {
        const energymeter = {
            asset_name: "test1",
            ip_address: "192.168.1.239",
            port: 50003,
            time_zone: "Europe/Budapest",
            use_dst: true,
            enabled: false
        };

        await request(exportedApp.app)
            .post("/api/admin/crud/energy_meter")
            .send(energymeter)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                energy_meter_id = parsedObj.lastID;
                expect(parsedObj.lastID).toBeDefined();
            })
            .expect(StatusCodes.OK);

    })

    test('Create channel', async () => {
        const chennelObj = {
            channel_name: "testCH1",
            channel: 1,
            energy_meter_id: energy_meter_id,
            enabled: false
        };

        await request(exportedApp.app)
            .post('/api/admin/crud/channels/')
            .send(chennelObj)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                lastID = parsedObj.lastID;
                expect(parsedObj.lastID).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    it('Channels count', async () => {
        await request(exportedApp.app)
            .get('/api/admin/crud/channels/count')
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toBeGreaterThanOrEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    test('Request channels list', async () => {
        await request(exportedApp.app)
            .get('/api/admin/crud/channels/')
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.length).toBeGreaterThanOrEqual(1);
                expect(parsedObj[0].id).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    test('Update channel', async () => {
        const chennelObj = {
            channel_name: "testCH12",
            channel: 1,
            energy_meter_id: energy_meter_id,
            enabled: false
        };
        await request(exportedApp.app)
            .put('/api/admin/crud/channels/' + lastID)
            .send(chennelObj)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    it('Get specified energymeter', async () => {
        await request(exportedApp.app)
            .get('/api/admin/crud/channels/' + lastID)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.channel_name).toEqual("testCH12");
            })
            .expect(StatusCodes.OK);
    })


    test('Delete channel', async () => {
        await request(exportedApp.app)
            .delete('/api/admin/crud/channels/' + lastID)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    afterAll(async () => {
        await request(exportedApp.app)
            .delete('/api/admin/crud/energy_meter/' + energy_meter_id)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
        exportedApp.server.close();
    })
})