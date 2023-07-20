import * as express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { rejects } from 'assert';
import { Server } from 'http';
import exportedApp from "../../src/app";

describe('EnergyMeter integration tests', () => {
    let lastID: number;
    beforeAll(async () => { })

    it('Create energymeter', async () => {
        const energymeter = {
            asset_name: "test1",
            ip_address: "192.168.1.239",
            port: 50003,
            time_zone: "Europe/Budapest",
            use_dst: true,
            enabled: false
        }
        await request(exportedApp.app)
            .post('/api/admin/crud/energy_meter/')
            .send(energymeter)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                lastID = parsedObj.lastID;
                expect(parsedObj.lastID).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    it('Request energymeters list', async () => {
        await request(exportedApp.app)
            .get('/api/admin/crud/energy_meter/')
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.length).toBeGreaterThanOrEqual(1);
                expect(parsedObj[0].id).toBeDefined();
            })
            .expect(StatusCodes.OK);
    })

    it('Update energymeter', async () => {
        const energymeter = {
            asset_name: "test12",
            ip_address: "192.168.1.239",
            port: 50003,
            time_zone: "Europe/Budapest",
            use_dst: true,
            enabled: false
        }
        await request(exportedApp.app)
            .put('/api/admin/crud/energy_meter/' + lastID)
            .send(energymeter)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.count).toEqual(1);
            })
            .expect(StatusCodes.OK);
    })

    it('Get specified energymeter', async () => {
        const energymeter = {
            asset_name: "test12",
            ip_address: "192.168.1.239",
            port: 50003,
            time_zone: "Europe/Budapest",
            use_dst: true,
            enabled: false
        }
        await request(exportedApp.app)
            .get('/api/admin/crud/energy_meter/' + lastID)
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                const parsedObj = JSON.parse(res.text);
                expect(parsedObj.asset_name).toEqual("test12");
            })
            .expect(StatusCodes.OK);
    })


    it('Delete energymeter', async () => {
        await request(exportedApp.app)
            .delete('/api/admin/crud/energy_meter/' + lastID)
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