/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.websocket.resources.realtime.types;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.seed.websocket.core.ObjectMappers;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.jetbrains.annotations.NotNull;

@JsonInclude(JsonInclude.Include.NON_ABSENT)
@JsonDeserialize(builder = SendSnakeCase.Builder.class)
public final class SendSnakeCase {
    private final String sendText;

    private final int sendParam;

    private final Map<String, Object> additionalProperties;

    private SendSnakeCase(String sendText, int sendParam, Map<String, Object> additionalProperties) {
        this.sendText = sendText;
        this.sendParam = sendParam;
        this.additionalProperties = additionalProperties;
    }

    @JsonProperty("send_text")
    public String getSendText() {
        return sendText;
    }

    @JsonProperty("send_param")
    public int getSendParam() {
        return sendParam;
    }

    @java.lang.Override
    public boolean equals(Object other) {
        if (this == other) return true;
        return other instanceof SendSnakeCase && equalTo((SendSnakeCase) other);
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return this.additionalProperties;
    }

    private boolean equalTo(SendSnakeCase other) {
        return sendText.equals(other.sendText) && sendParam == other.sendParam;
    }

    @java.lang.Override
    public int hashCode() {
        return Objects.hash(this.sendText, this.sendParam);
    }

    @java.lang.Override
    public String toString() {
        return ObjectMappers.stringify(this);
    }

    public static SendTextStage builder() {
        return new Builder();
    }

    public interface SendTextStage {
        SendParamStage sendText(@NotNull String sendText);

        Builder from(SendSnakeCase other);
    }

    public interface SendParamStage {
        _FinalStage sendParam(int sendParam);
    }

    public interface _FinalStage {
        SendSnakeCase build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static final class Builder implements SendTextStage, SendParamStage, _FinalStage {
        private String sendText;

        private int sendParam;

        @JsonAnySetter
        private Map<String, Object> additionalProperties = new HashMap<>();

        private Builder() {}

        @java.lang.Override
        public Builder from(SendSnakeCase other) {
            sendText(other.getSendText());
            sendParam(other.getSendParam());
            return this;
        }

        @java.lang.Override
        @JsonSetter("send_text")
        public SendParamStage sendText(@NotNull String sendText) {
            this.sendText = Objects.requireNonNull(sendText, "sendText must not be null");
            return this;
        }

        @java.lang.Override
        @JsonSetter("send_param")
        public _FinalStage sendParam(int sendParam) {
            this.sendParam = sendParam;
            return this;
        }

        @java.lang.Override
        public SendSnakeCase build() {
            return new SendSnakeCase(sendText, sendParam, additionalProperties);
        }
    }
}
