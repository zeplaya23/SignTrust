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
        SubscriptionEntity sub = subscriptionService.createSubscription(
                req.userId(), req.planId(), req.paymentMethod(), reference, req.amount());

        boolean isDiscovery = "discovery".equals(req.planId());
        String planLabel = getPlanLabel(req.planId());

        // Send confirmation email
        try {
            UserProfileEntity user = em.createQuery(
                    "SELECT u FROM UserProfileEntity u WHERE u.id = :id", UserProfileEntity.class)
                    .setParameter("id", req.userId())
                    .getSingleResult();

            String planInfo;
            if (isDiscovery) {
                String trialEnd = sub.getTrialEndDate() != null
                    ? sub.getTrialEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                planInfo = "<div style='background:#ECFDF3;border-radius:12px;padding:16px;margin:16px 0'>"
                    + "<p style='color:#177A4B;font-weight:600'>Essai gratuit de 14 jours activé</p>"
                    + "<p style='color:#5F6B7A;font-size:14px'>Fin de l'essai : " + trialEnd + "</p>"
                    + "<p style='color:#5F6B7A;font-size:14px'>5 enveloppes/mois — 1 utilisateur</p>"
                    + "</div>";
            } else {
                String endDate = sub.getEndDate() != null
                    ? sub.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                planInfo = "<div style='background:#ECFDF3;border-radius:12px;padding:16px;margin:16px 0'>"
                    + "<p style='color:#177A4B;font-weight:600'>Plan " + planLabel + " activé</p>"
                    + "<p style='color:#5F6B7A;font-size:14px'>Prochain renouvellement : " + endDate + "</p>"
                    + "</div>";
            }

            mailer.send(Mail.withHtml(user.getEmail(),
                    "DigiSign — Confirmation d'abonnement",
                    "<div style='font-family:DM Sans,sans-serif;max-width:500px;margin:0 auto;padding:20px'>"
                    + "<h2 style='color:#0083BF'>Bienvenue sur DigiSign !</h2>"
                    + "<p>Votre abonnement <strong>" + planLabel + "</strong> est activé.</p>"
                    + planInfo
                    + "<p style='font-size:14px'>Référence : <strong>" + reference + "</strong></p>"
                    + (req.amount() > 0 ? "<p style='color:#5F6B7A;font-size:14px'>Montant : " + req.amount() + " FCFA/mois</p>" : "")
                    + "<hr style='border:none;border-top:1px solid #E8ECF1;margin:20px 0'>"
                    + "<p style='color:#94A3B8;font-size:12px'>Cryptoneo — Côte d'Ivoire</p>"
                    + "</div>"
            ));
        } catch (Exception e) {
            // Don't fail payment if email fails
        }

        String message = isDiscovery
            ? "Essai gratuit de 14 jours activé avec succès."
            : "Abonnement " + planLabel + " activé avec succès.";
        return new PaymentInitResponse(reference, "success", message);
    }

    public PaymentVerifyResponse verifyPayment(String reference) {
        // Look up the actual subscription status from DB
        String subStatus = "ACTIVE";
        try {
            SubscriptionEntity sub = em.createQuery(
                "SELECT s FROM SubscriptionEntity s WHERE s.paymentReference = :ref ORDER BY s.createdAt DESC",
                SubscriptionEntity.class)
                .setParameter("ref", reference).setMaxResults(1).getSingleResult();
            subStatus = sub.getStatus();
        } catch (Exception ignored) {}

        return new PaymentVerifyResponse(
                reference,
                "success",
                0,
                "XOF",
                "mock",
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                subStatus
        );
    }

    private String getPlanLabel(String planId) {
        return switch (planId) {
            case "discovery" -> "Découverte";
            case "pro" -> "Pro";
            case "business" -> "Business";
            case "integration" -> "Intégration API";
            case "enterprise" -> "Enterprise";
            default -> planId;
        };
    }
}
