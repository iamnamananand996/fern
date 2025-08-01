/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from "../../../../../../core/index.js";
export declare namespace Urls {
    interface Options {
        environment: core.Supplier<string>;
        /** Specify a custom URL to connect the client to. */
        baseUrl?: core.Supplier<string>;
        token?: core.Supplier<core.BearerToken | undefined>;
        /** Additional headers to include in requests. */
        headers?: Record<string, string | core.Supplier<string | undefined> | undefined>;
    }
    interface RequestOptions {
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
export declare class Urls {
    protected readonly _options: Urls.Options;
    constructor(_options: Urls.Options);
    /**
     * @param {Urls.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.endpoints.urls.withMixedCase()
     */
    withMixedCase(requestOptions?: Urls.RequestOptions): core.HttpResponsePromise<string>;
    private __withMixedCase;
    /**
     * @param {Urls.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.endpoints.urls.noEndingSlash()
     */
    noEndingSlash(requestOptions?: Urls.RequestOptions): core.HttpResponsePromise<string>;
    private __noEndingSlash;
    /**
     * @param {Urls.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.endpoints.urls.withEndingSlash()
     */
    withEndingSlash(requestOptions?: Urls.RequestOptions): core.HttpResponsePromise<string>;
    private __withEndingSlash;
    /**
     * @param {Urls.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.endpoints.urls.withUnderscores()
     */
    withUnderscores(requestOptions?: Urls.RequestOptions): core.HttpResponsePromise<string>;
    private __withUnderscores;
    protected _getAuthorizationHeader(): Promise<string | undefined>;
}
