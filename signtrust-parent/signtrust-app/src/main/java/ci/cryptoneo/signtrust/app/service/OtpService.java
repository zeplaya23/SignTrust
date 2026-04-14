package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.entity.OtpEntity;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class OtpService {

    @Inject
    EntityManager em;

    @Inject
    Mailer mailer;

    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public String generateAndSend(String email) {
        // Invalidate previous unused OTPs for this email
        em.createQuery("UPDATE OtpEntity o SET o.used = true WHERE o.email = :email AND o.used = false")
                .setParameter("email", email)
                .executeUpdate();

        // Generate 6-digit code
        String code = String.format("%06d", random.nextInt(1_000_000));

        // Persist
        OtpEntity otp = new OtpEntity();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setUsed(false);
        em.persist(otp);

        // Send email via Mailpit
        mailer.send(Mail.withHtml(email,
                "SignTrust — Code de vérification",
                "<div style='font-family:DM Sans,sans-serif;max-width:400px;margin:0 auto;padding:20px'>"
                + "<h2 style='color:#1E3A5F'>SignTrust</h2>"
                + "<p>Votre code de vérification est :</p>"
                + "<div style='background:#EBF2FA;border-radius:12px;padding:20px;text-align:center;margin:20px 0'>"
                + "<span style='font-size:32px;font-weight:700;letter-spacing:8px;color:#1E3A5F'>" + code + "</span>"
                + "</div>"
                + "<p style='color:#5F6B7A;font-size:14px'>Ce code expire dans 5 minutes.</p>"
                + "<p style='color:#94A3B8;font-size:12px'>Si vous n'avez pas demandé ce code, ignorez cet email.</p>"
                + "</div>"
        ));

        return code;
    }

    @Transactional
    public boolean verify(String email, String code) {
        List<OtpEntity> results = em.createQuery(
                "SELECT o FROM OtpEntity o WHERE o.email = :email AND o.code = :code AND o.used = false AND o.expiresAt > :now ORDER BY o.createdAt DESC",
                OtpEntity.class)
                .setParameter("email", email)
                .setParameter("code", code)
                .setParameter("now", LocalDateTime.now())
                .setMaxResults(1)
                .getResultList();

        if (results.isEmpty()) {
            return false;
        }

        OtpEntity otp = results.get(0);
        otp.setUsed(true);
        em.merge(otp);
        return true;
    }
}
