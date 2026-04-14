package ci.cryptoneo.signtrust.notification;

public interface NotificationService {
    void sendEmail(String to, String subject, String htmlBody);
    void sendSms(String to, String message);
}
