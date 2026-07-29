package io.pingram.model;

public class SendSmsRequest {
    private String type;
    private String to;
    private String message;

    public SendSmsRequest type(String type) {
        this.type = type;
        return this;
    }

    public SendSmsRequest to(String to) {
        this.to = to;
        return this;
    }

    public SendSmsRequest message(String message) {
        this.message = message;
        return this;
    }

    // Getters
    public String getType() { return type; }
    public String getTo() { return to; }
    public String getMessage() { return message; }
}
