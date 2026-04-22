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
                    "diSign Parapheur — Confirmation d'abonnement",
                    "<div style='font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:0'>"
                    + "<div style='background:linear-gradient(135deg,#0083BF,#005A8C);padding:28px 32px;border-radius:16px 16px 0 0'>"
                    + "<h2 style='color:#fff;margin:0;font-size:20px;font-weight:700'>diSign <span style=\"font-weight:400;opacity:.7\">Parapheur</span></h2>"
                    + "</div>"
                    + "<div style='background:#fff;padding:32px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 16px 16px'>"
                    + "<p style='color:#1E293B;font-size:18px;font-weight:700;margin:0 0 4px'>Bienvenue !</p>"
                    + "<p style='color:#64748B;font-size:14px;margin:0 0 20px'>Votre abonnement <strong style='color:#0083BF'>" + planLabel + "</strong> est active.</p>"
                    + planInfo
                    + "<div style='background:#F8FAFC;border-radius:12px;padding:16px;margin:16px 0'>"
                    + "<p style='font-size:13px;color:#64748B;margin:0'>Reference : <strong style='color:#1E293B'>" + reference + "</strong></p>"
                    + (req.amount() > 0 ? "<p style='font-size:13px;color:#64748B;margin:8px 0 0'>Montant : <strong style='color:#1E293B'>" + req.amount() + " FCFA/mois</strong></p>" : "")
                    + "</div>"
                    + "</div>"
                    + "<p style='text-align:center;color:#94A3B8;font-size:11px;margin-top:16px'>Cryptoneo — Cote d'Ivoire</p>"
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
