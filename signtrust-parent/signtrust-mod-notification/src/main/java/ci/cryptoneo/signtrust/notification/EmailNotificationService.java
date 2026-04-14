package ci.cryptoneo.signtrust.notification;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class EmailNotificationService implements NotificationService {

    private static final Logger LOG = Logger.getLogger(EmailNotificationService.class);

    @Inject
    Mailer mailer;

    @Override
    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            mailer.send(Mail.withHtml(to, subject, htmlBody));
            LOG.infof("Email sent to %s: %s", to, subject);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send email to %s: %s", to, subject);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    public void sendSms(String to, String message) {
        // SMS is a no-op log for now
        LOG.infof("SMS (no-op) to %s: %s", to, message);
    }
}
