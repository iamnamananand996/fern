/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as core from "./core/index.js";
import { mergeHeaders } from "./core/headers.js";
import * as errors from "./errors/index.js";

export declare namespace SeedLicenseClient {
    export interface Options {
        environment: core.Supplier<string>;
        /** Specify a custom URL to connect the client to. */
        baseUrl?: core.Supplier<string>;
        /** Additional headers to include in requests. */
        headers?: Record<string, string | core.Supplier<string | undefined> | undefined>;
    }

    export interface RequestOptions {
        /** The maximum time to wait for a response in seconds. */
        timeoutInSeconds?: number;
        /** The number of times to retry the request. Defaults to 2. */
        maxRetries?: number;
        /** A hook to abort the request. */
        abortSignal?: AbortSignal;
        /** Additional query string parameters to include in the request. */
        queryParams?: Record<string, unknown>;
        /** Additional headers to include in the request. */
        headers?: Record<string, string | core.Supplier<string | undefined> | undefined>;
    }
}

export class SeedLicenseClient {
    protected readonly _options: SeedLicenseClient.Options;

    constructor(_options: SeedLicenseClient.Options) {
        this._options = {
            ..._options,
            headers: mergeHeaders(
                {
                    "X-Fern-Language": "JavaScript",
                    "X-Fern-SDK-Name": "@fern/license",
                    "X-Fern-SDK-Version": "0.0.1",
                    "User-Agent": "@fern/license/0.0.1",
                    "X-Fern-Runtime": core.RUNTIME.type,
                    "X-Fern-Runtime-Version": core.RUNTIME.version,
                },
                _options?.headers,
            ),
        };
    }

    /**
     * @param {SeedLicenseClient.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.get()
     */
    public get(requestOptions?: SeedLicenseClient.RequestOptions): core.HttpResponsePromise<void> {
        return core.HttpResponsePromise.fromPromise(this.__get(requestOptions));
    }

    private async __get(requestOptions?: SeedLicenseClient.RequestOptions): Promise<core.WithRawResponse<void>> {
        const _response = await core.fetcher({
            url: core.url.join(
                (await core.Supplier.get(this._options.baseUrl)) ??
                    (await core.Supplier.get(this._options.environment)),
                "/",
            ),
            method: "GET",
            headers: mergeHeaders(this._options?.headers, requestOptions?.headers),
            queryParameters: requestOptions?.queryParams,
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return { data: undefined, rawResponse: _response.rawResponse };
        }

        if (_response.error.reason === "status-code") {
            throw new errors.SeedLicenseError({
                statusCode: _response.error.statusCode,
                body: _response.error.body,
                rawResponse: _response.rawResponse,
            });
        }

        switch (_response.error.reason) {
            case "non-json":
                throw new errors.SeedLicenseError({
                    statusCode: _response.error.statusCode,
                    body: _response.error.rawBody,
                    rawResponse: _response.rawResponse,
                });
            case "timeout":
                throw new errors.SeedLicenseTimeoutError("Timeout exceeded when calling GET /.");
            case "unknown":
                throw new errors.SeedLicenseError({
                    message: _response.error.errorMessage,
                    rawResponse: _response.rawResponse,
                });
        }
    }
}
