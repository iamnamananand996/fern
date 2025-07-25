/**
 * This file was auto-generated by Fern from our API Definition.
 */

import { mockServerPool } from "../mock-server/MockServerPool";
import { SeedObjectClient } from "../../src/Client";

describe("SeedObjectClient", () => {
    test("getRoot", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedObjectClient({ environment: server.baseUrl });
        const rawRequestBody = { bar: { foo: "foo" }, foo: "foo" };
        const rawResponseBody = {
            foo: "foo",
            bar: {
                foo: "foo",
                bar: { foo: "foo", bar: "bar", myEnum: "SUNNY", ref: { foo: "foo" } },
                ref: { foo: "foo" },
            },
            fooMap: { fooMap: { foo: "foo", ref: { foo: "foo" } } },
            fooList: [
                { foo: "foo", ref: { foo: "foo" } },
                { foo: "foo", ref: { foo: "foo" } },
            ],
            fooSet: [{ foo: "foo", ref: { foo: "foo" } }],
            ref: { foo: "foo" },
        };
        server
            .mockEndpoint()
            .post("/root/root")
            .jsonBody(rawRequestBody)
            .respondWith()
            .statusCode(200)
            .jsonBody(rawResponseBody)
            .build();

        const response = await client.getRoot({
            bar: {
                foo: "foo",
            },
            foo: "foo",
        });
        expect(response).toEqual({
            foo: "foo",
            bar: {
                foo: "foo",
                bar: {
                    foo: "foo",
                    bar: "bar",
                    myEnum: "SUNNY",
                    ref: {
                        foo: "foo",
                    },
                },
                ref: {
                    foo: "foo",
                },
            },
            fooMap: {
                fooMap: {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
            },
            fooList: [
                {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
                {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
            ],
            fooSet: [
                {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
            ],
            ref: {
                foo: "foo",
            },
        });
    });

    test("getDiscriminatedUnion", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedObjectClient({ environment: server.baseUrl });
        const rawRequestBody = {
            bar: { type: "type1", foo: "foo", bar: { foo: "foo", ref: { foo: "foo" } }, ref: { foo: "foo" } },
            foo: "foo",
        };

        server
            .mockEndpoint()
            .post("/root/discriminated-union")
            .jsonBody(rawRequestBody)
            .respondWith()
            .statusCode(200)
            .build();

        const response = await client.getDiscriminatedUnion({
            bar: {
                type: "type1",
                foo: "foo",
                bar: {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
                ref: {
                    foo: "foo",
                },
            },
            foo: "foo",
        });
        expect(response).toEqual(undefined);
    });

    test("getUndiscriminatedUnion", async () => {
        const server = mockServerPool.createServer();
        const client = new SeedObjectClient({ environment: server.baseUrl });
        const rawRequestBody = {
            bar: { foo: "foo", bar: { foo: "foo", ref: { foo: "foo" } }, ref: { foo: "foo" } },
            foo: "foo",
        };

        server
            .mockEndpoint()
            .post("/root/undiscriminated-union")
            .jsonBody(rawRequestBody)
            .respondWith()
            .statusCode(200)
            .build();

        const response = await client.getUndiscriminatedUnion({
            bar: {
                foo: "foo",
                bar: {
                    foo: "foo",
                    ref: {
                        foo: "foo",
                    },
                },
                ref: {
                    foo: "foo",
                },
            },
            foo: "foo",
        });
        expect(response).toEqual(undefined);
    });
});
