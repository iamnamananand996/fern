/**
 * This file was auto-generated by Fern from our API Definition.
 */

import { mockServerPool } from "../../mock-server/MockServerPool.js";
import { SeedExhaustiveClient } from "../../../Client.js";

describe("Params", () => {
    test("getWithPath", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        const rawResponseBody = "string";
        server.mockEndpoint().get("/params/path/param").respondWith().statusCode(200).jsonBody(rawResponseBody).build();

        const response = await client.endpoints.params.getWithPath("param");
        expect(response).toEqual("string");
    });

    test("getWithInlinePath", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        const rawResponseBody = "string";
        server.mockEndpoint().get("/params/path/param").respondWith().statusCode(200).jsonBody(rawResponseBody).build();

        const response = await client.endpoints.params.getWithInlinePath({
            param: "param",
        });
        expect(response).toEqual("string");
    });

    test("getWithQuery", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        server.mockEndpoint().get("/params").respondWith().statusCode(200).build();

        const response = await client.endpoints.params.getWithQuery({
            query: "query",
            number: 1,
        });
        expect(response).toEqual(undefined);
    });

    test("getWithAllowMultipleQuery", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        server.mockEndpoint().get("/params").respondWith().statusCode(200).build();

        const response = await client.endpoints.params.getWithAllowMultipleQuery({
            query: "query",
            number: 1,
        });
        expect(response).toEqual(undefined);
    });

    test("getWithPathAndQuery", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        server.mockEndpoint().get("/params/path-query/param").respondWith().statusCode(200).build();

        const response = await client.endpoints.params.getWithPathAndQuery("param", {
            query: "query",
        });
        expect(response).toEqual(undefined);
    });

    test("getWithInlinePathAndQuery", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });

        server.mockEndpoint().get("/params/path-query/param").respondWith().statusCode(200).build();

        const response = await client.endpoints.params.getWithInlinePathAndQuery({
            param: "param",
            query: "query",
        });
        expect(response).toEqual(undefined);
    });

    test("modifyWithPath", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });
        const rawRequestBody = "string";
        const rawResponseBody = "string";
        server
            .mockEndpoint()
            .put("/params/path/param")
            .jsonBody(rawRequestBody)
            .respondWith()
            .statusCode(200)
            .jsonBody(rawResponseBody)
            .build();

        const response = await client.endpoints.params.modifyWithPath("param", "string");
        expect(response).toEqual("string");
    });

    test("modifyWithInlinePath", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedExhaustiveClient({ token: "test", environment: server.baseUrl });
        const rawRequestBody = "string";
        const rawResponseBody = "string";
        server
            .mockEndpoint()
            .put("/params/path/param")
            .jsonBody(rawRequestBody)
            .respondWith()
            .statusCode(200)
            .jsonBody(rawResponseBody)
            .build();

        const response = await client.endpoints.params.modifyWithInlinePath({
            param: "param",
            body: "string",
        });
        expect(response).toEqual("string");
    });
});
