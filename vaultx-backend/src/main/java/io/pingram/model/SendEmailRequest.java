package io.pingram.model;

public class SendEmailRequest {
    private String type;
    private String to;
    private String subject;
    private String html;
    private String fromName;
    private String fromAddress;

    public SendEmailRequest type(String type) {
        this.type = type;
        return this;
    }

    public SendEmailRequest to(String to) {
        this.to = to;
        return this;
    }

    public SendEmailRequest subject(String subject) {
        this.subject = subject;
        return this;
    }

    public SendEmailRequest html(String html) {
        this.html = html;
        return this;
    }

    public SendEmailRequest fromName(String fromName) {
        this.fromName = fromName;
        return this;
    }

    public SendEmailRequest fromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
        return this;
    }

    // Getters
    public String getType() { return type; }
    public String getTo() { return to; }
    public String getSubject() { return subject; }
    public String getHtml() { return html; }
    public String getFromName() { return fromName; }
    public String getFromAddress() { return fromAddress; }
}
