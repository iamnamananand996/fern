/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.builderExtension.resources.service;

import com.seed.builderExtension.core.ClientOptions;
import com.seed.builderExtension.core.ObjectMappers;
import com.seed.builderExtension.core.RequestOptions;
import com.seed.builderExtension.core.SeedBuilderExtensionApiException;
import com.seed.builderExtension.core.SeedBuilderExtensionException;
import com.seed.builderExtension.core.SeedBuilderExtensionHttpResponse;
import com.seed.builderExtension.resources.service.types.HelloResponse;
import java.io.IOException;
import okhttp3.Headers;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class RawServiceClient {
    protected final ClientOptions clientOptions;

    public RawServiceClient(ClientOptions clientOptions) {
        this.clientOptions = clientOptions;
    }

    public SeedBuilderExtensionHttpResponse<HelloResponse> hello() {
        return hello(null);
    }

    public SeedBuilderExtensionHttpResponse<HelloResponse> hello(RequestOptions requestOptions) {
        HttpUrl httpUrl = HttpUrl.parse(this.clientOptions.environment().getUrl())
                .newBuilder()
                .addPathSegments("api")
                .addPathSegments("hello")
                .build();
        Request okhttpRequest = new Request.Builder()
                .url(httpUrl)
                .method("GET", null)
                .headers(Headers.of(clientOptions.headers(requestOptions)))
                .addHeader("Accept", "application/json")
                .build();
        OkHttpClient client = clientOptions.httpClient();
        if (requestOptions != null && requestOptions.getTimeout().isPresent()) {
            client = clientOptions.httpClientWithTimeout(requestOptions);
        }
        try (Response response = client.newCall(okhttpRequest).execute()) {
            ResponseBody responseBody = response.body();
            if (response.isSuccessful()) {
                return new SeedBuilderExtensionHttpResponse<>(
                        ObjectMappers.JSON_MAPPER.readValue(responseBody.string(), HelloResponse.class), response);
            }
            String responseBodyString = responseBody != null ? responseBody.string() : "{}";
            throw new SeedBuilderExtensionApiException(
                    "Error with status code " + response.code(),
                    response.code(),
                    ObjectMappers.JSON_MAPPER.readValue(responseBodyString, Object.class),
                    response);
        } catch (IOException e) {
            throw new SeedBuilderExtensionException("Network error executing HTTP request", e);
        }
    }
}
