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
                "diSign Parapheur — Code de vérification",
                "<div style='font-family:Inter,system-ui,sans-serif;max-width:460px;margin:0 auto;padding:0'>"
                + "<div style='background:linear-gradient(135deg,#0083BF,#005A8C);padding:28px 32px;border-radius:16px 16px 0 0'>"
                + "<h2 style='color:#fff;margin:0;font-size:20px;font-weight:700'>diSign <span style=\"font-weight:400;opacity:.7\">Parapheur</span></h2>"
                + "</div>"
                + "<div style='background:#fff;padding:32px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 16px 16px'>"
                + "<p style='color:#1E293B;font-size:15px;margin:0 0 8px'>Votre code de vérification</p>"
                + "<p style='color:#64748B;font-size:13px;margin:0 0 20px'>Utilisez le code ci-dessous pour continuer :</p>"
                + "<div style='background:#F0F9FF;border:2px solid #0083BF20;border-radius:12px;padding:24px;text-align:center;margin:0 0 20px'>"
                + "<span style='font-size:36px;font-weight:800;letter-spacing:10px;color:#0083BF'>" + code + "</span>"
                + "</div>"
                + "<p style='color:#94A3B8;font-size:12px;margin:0'>Ce code expire dans 5 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.</p>"
                + "</div>"
                + "<p style='text-align:center;color:#94A3B8;font-size:11px;margin-top:16px'>Cryptoneo — Cote d'Ivoire</p>"
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
