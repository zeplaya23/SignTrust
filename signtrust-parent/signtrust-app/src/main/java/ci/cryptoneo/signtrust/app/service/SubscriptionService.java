package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.entity.SubscriptionEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class SubscriptionService {

    @Inject
    EntityManager em;

    /**
     * Creates a subscription for the given user.
     * - Plan "discovery" → status TRIAL (Découverte, gratuit, pas d'expiration)
     * - Plans payants (pro, business, enterprise) → status ACTIVE
     */
    @Transactional
    public SubscriptionEntity createSubscription(Long userId, String planId, String paymentMethod,
                                                  String paymentReference, long amount) {
        SubscriptionEntity sub = new SubscriptionEntity();
        sub.setUserId(userId);
        sub.setPlanId(planId);
        sub.setPaymentMethod(paymentMethod);
        sub.setPaymentReference(paymentReference);
        sub.setAmount(amount);
        sub.setStartDate(LocalDateTime.now());

        if ("discovery".equals(planId)) {
            // Découverte = essai gratuit 14 jours
            sub.setStatus("TRIAL");
            sub.setAmount(0L);
            sub.setTrialEndDate(LocalDateTime.now().plusDays(14));
            sub.setEndDate(LocalDateTime.now().plusDays(14));
        } else {
            // Plan payant = ACTIVE, renouvelable chaque mois
            sub.setStatus("ACTIVE");
            sub.setEndDate(LocalDateTime.now().plusMonths(1));
        }

        em.persist(sub);
        return sub;
    }

    /**
     * @deprecated Use {@link #createSubscription} instead
     */
    @Deprecated
    @Transactional
    public SubscriptionEntity createTrialSubscription(Long userId, String planId, String paymentMethod,
                                                       String paymentReference, long amount) {
        return createSubscription(userId, planId, paymentMethod, paymentReference, amount);
    }
}
