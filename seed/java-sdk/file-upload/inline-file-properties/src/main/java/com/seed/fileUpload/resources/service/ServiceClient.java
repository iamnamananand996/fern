/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.fileUpload.resources.service;

import com.seed.fileUpload.core.ClientOptions;
import com.seed.fileUpload.core.RequestOptions;
import com.seed.fileUpload.resources.service.requests.InlineTypeRequest;
import com.seed.fileUpload.resources.service.requests.JustFileRequest;
import com.seed.fileUpload.resources.service.requests.JustFileWithQueryParamsRequest;
import com.seed.fileUpload.resources.service.requests.MyOtherRequest;
import com.seed.fileUpload.resources.service.requests.MyRequest;
import com.seed.fileUpload.resources.service.requests.OptionalArgsRequest;
import com.seed.fileUpload.resources.service.requests.WithContentTypeRequest;
import com.seed.fileUpload.resources.service.requests.WithFormEncodingRequest;

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

    public void post(MyRequest request) {
        this.rawClient.post(request).body();
    }

    public void post(MyRequest request, RequestOptions requestOptions) {
        this.rawClient.post(request, requestOptions).body();
    }

    public void justFile(JustFileRequest request) {
        this.rawClient.justFile(request).body();
    }

    public void justFile(JustFileRequest request, RequestOptions requestOptions) {
        this.rawClient.justFile(request, requestOptions).body();
    }

    public void justFileWithQueryParams(JustFileWithQueryParamsRequest request) {
        this.rawClient.justFileWithQueryParams(request).body();
    }

    public void justFileWithQueryParams(JustFileWithQueryParamsRequest request, RequestOptions requestOptions) {
        this.rawClient.justFileWithQueryParams(request, requestOptions).body();
    }

    public void withContentType(WithContentTypeRequest request) {
        this.rawClient.withContentType(request).body();
    }

    public void withContentType(WithContentTypeRequest request, RequestOptions requestOptions) {
        this.rawClient.withContentType(request, requestOptions).body();
    }

    public void withFormEncoding(WithFormEncodingRequest request) {
        this.rawClient.withFormEncoding(request).body();
    }

    public void withFormEncoding(WithFormEncodingRequest request, RequestOptions requestOptions) {
        this.rawClient.withFormEncoding(request, requestOptions).body();
    }

    public void withFormEncodedContainers(MyOtherRequest request) {
        this.rawClient.withFormEncodedContainers(request).body();
    }

    public void withFormEncodedContainers(MyOtherRequest request, RequestOptions requestOptions) {
        this.rawClient.withFormEncodedContainers(request, requestOptions).body();
    }

    public String optionalArgs() {
        return this.rawClient.optionalArgs().body();
    }

    public String optionalArgs(OptionalArgsRequest request) {
        return this.rawClient.optionalArgs(request).body();
    }

    public String optionalArgs(OptionalArgsRequest request, RequestOptions requestOptions) {
        return this.rawClient.optionalArgs(request, requestOptions).body();
    }

    public String withInlineType(InlineTypeRequest request) {
        return this.rawClient.withInlineType(request).body();
    }

    public String withInlineType(InlineTypeRequest request, RequestOptions requestOptions) {
        return this.rawClient.withInlineType(request, requestOptions).body();
    }

    public void simple() {
        this.rawClient.simple().body();
    }

    public void simple(RequestOptions requestOptions) {
        this.rawClient.simple(requestOptions).body();
    }
}
