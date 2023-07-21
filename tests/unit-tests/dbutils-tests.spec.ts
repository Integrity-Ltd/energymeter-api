import "jest";
import DBUtils from "../../../energymeter-utils/src/utils/DBUtils";
import path from "path";

describe("Utils tests", () => {
    beforeEach(() => { })
    it("DBUtils getDBFilePath should be string", async () => {
        const ip = "192.168.1.237";
        const filePath = DBUtils.getDBFilePath(ip);
        const matchPath = path.join(process.env.WORKDIR as string, ip);
        expect(filePath).toEqual(matchPath);
    })
    afterAll(() => { });
});