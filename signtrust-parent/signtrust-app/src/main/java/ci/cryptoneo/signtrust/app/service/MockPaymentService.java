package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.PaymentInitRequest;
import ci.cryptoneo.signtrust.app.dto.PaymentInitResponse;
import ci.cryptoneo.signtrust.app.dto.PaymentVerifyResponse;
import ci.cryptoneo.signtrust.app.entity.SubscriptionEntity;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;

@ApplicationScoped
public class MockPaymentService {

    @Inject
    EntityManager em;

    @Inject
    SubscriptionService subscriptionService;

    @Inject
    Mailer mailer;

    @Transactional
    public PaymentInitResponse initializePayment(PaymentInitRequest req) {
        String reference = "ST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Auto-create subscription (mock = always succeeds)
        SubscriptionEntity sub = subscriptionService.createTrialSubscription(
                req.userId(), req.planId(), req.paymentMethod(), reference, req.amount());

        // Send confirmation email
        try {
            UserProfileEntity user = em.createQuery(
                    "SELECT u FROM UserProfileEntity u WHERE u.id = :id", UserProfileEntity.class)
                    .setParameter("id", req.userId())
                    .getSingleResult();

            String trialEnd = sub.getTrialEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

            mailer.send(Mail.withHtml(user.getEmail(),
                    "SignTrust — Confirmation d'abonnement",
                    "<div style='font-family:DM Sans,sans-serif;max-width:500px;margin:0 auto;padding:20px'>"
                    + "<h2 style='color:#1E3A5F'>Bienvenue sur SignTrust !</h2>"
                    + "<p>Votre abonnement <strong>" + req.planId() + "</strong> est activé.</p>"
                    + "<div style='background:#ECFDF3;border-radius:12px;padding:16px;margin:16px 0'>"
                    + "<p style='color:#177A4B;font-weight:600'>Essai gratuit de 14 jours</p>"
                    + "<p style='color:#5F6B7A;font-size:14px'>Fin de l'essai : " + trialEnd + "</p>"
                    + "</div>"
                    + "<p style='font-size:14px'>Référence : <strong>" + reference + "</strong></p>"
                    + "<p style='color:#5F6B7A;font-size:14px'>Montant : " + req.amount() + " FCFA</p>"
                    + "<hr style='border:none;border-top:1px solid #E8ECF1;margin:20px 0'>"
                    + "<p style='color:#94A3B8;font-size:12px'>Cryptoneo — Côte d'Ivoire</p>"
                    + "</div>"
            ));
        } catch (Exception e) {
            // Don't fail payment if email fails
        }

        return new PaymentInitResponse(reference, "success",
                "Paiement simulé avec succès. Essai gratuit 14 jours activé.");
    }

    public PaymentVerifyResponse verifyPayment(String reference) {
        return new PaymentVerifyResponse(
                reference,
                "success",
                0,
                "XOF",
                "mock",
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "TRIAL"
        );
    }
}
