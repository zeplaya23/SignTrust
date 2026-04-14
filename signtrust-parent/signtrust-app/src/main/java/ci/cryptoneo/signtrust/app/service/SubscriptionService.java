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

    @Transactional
    public SubscriptionEntity createTrialSubscription(Long userId, String planId, String paymentMethod,
                                                       String paymentReference, long amount) {
        SubscriptionEntity sub = new SubscriptionEntity();
        sub.setUserId(userId);
        sub.setPlanId(planId);
        sub.setStatus("TRIAL");
        sub.setPaymentMethod(paymentMethod);
        sub.setPaymentReference(paymentReference);
        sub.setAmount(amount);
        sub.setStartDate(LocalDateTime.now());
        sub.setTrialEndDate(LocalDateTime.now().plusDays(14));
        sub.setEndDate(LocalDateTime.now().plusDays(14));
        em.persist(sub);
        return sub;
    }
}
