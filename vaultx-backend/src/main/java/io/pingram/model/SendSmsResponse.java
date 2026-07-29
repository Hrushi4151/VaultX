package io.pingram.model;

import java.util.UUID;

public class SendSmsResponse {
    private String trackingId;

    public SendSmsResponse() {
        this.trackingId = UUID.randomUUID().toString();
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }
}
