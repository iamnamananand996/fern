/**
 * This file was auto-generated by Fern from our API Definition.
 */

import { mockServerPool } from "../mock-server/MockServerPool";
import { SeedContentTypesClient } from "../../src/Client";

describe("Service", () => {
    test("patch", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedContentTypesClient({ environment: server.baseUrl });
        const rawRequestBody = { application: "application", require_auth: true };

        server.mockEndpoint().patch("").jsonBody(rawRequestBody).respondWith().statusCode(200).build();

        const response = await client.service.patch({
            application: "application",
            require_auth: true,
        });
        expect(response).toEqual(undefined);
    });
});
