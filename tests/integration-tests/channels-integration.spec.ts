import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import exportedApp from "../../src/app";
import { channel } from 'diagnostics_channel';

describe('EnergyMeter integration tests', () => {
    let lastID: number;
    let energy_meter_id: number;
    beforeAll(async () => { })

    it('Create channel', async () => {
        await request(exportedApp.app)
            .get("/api/admin/crud/energy_meter")
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                if (parsedObj.length > 0) {
                    energy_meter_id = parsedObj[0].id;
                }
            })
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

    it('Request channels list', async () => {
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

    it('Update channel', async () => {
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


    it('Delete channel', async () => {
        await request(exportedApp.app)
            .delete('/api/admin/crud/channels/' + lastID)
            .set('Accept', 'application/json')
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