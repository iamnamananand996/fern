/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.builderExtension.resources.service;

import com.seed.builderExtension.core.ClientOptions;
import com.seed.builderExtension.core.RequestOptions;
import com.seed.builderExtension.resources.service.types.HelloResponse;

public class ServiceClient {
    protected final ClientOptions clientOptions;

    private final RawServiceClient rawClient;

    public ServiceClient(ClientOptions clientOptions) {
        this.clientOptions = clientOptions;
        this.rawClient = new RawServiceClient(clientOptions);
    }

    /**
     * Get responses with HTTP metadata like headers
     */
    public RawServiceClient withRawResponse() {
        return this.rawClient;
    }

    public HelloResponse hello() {
        return this.rawClient.hello().body();
    }

    public HelloResponse hello(RequestOptions requestOptions) {
        return this.rawClient.hello(requestOptions).body();
    }
}
