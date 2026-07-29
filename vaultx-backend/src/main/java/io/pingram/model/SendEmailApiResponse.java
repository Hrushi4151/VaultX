package io.pingram.model;

import java.util.UUID;

public class SendEmailApiResponse {
    private String trackingId;

    public SendEmailApiResponse() {
        this.trackingId = UUID.randomUUID().toString();
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }
}
