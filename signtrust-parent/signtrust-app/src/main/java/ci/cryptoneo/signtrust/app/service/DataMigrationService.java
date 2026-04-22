package ci.cryptoneo.signtrust.app.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * One-time data migrations executed at startup.
 * Migrates legacy "free" planId to "discovery" (Découverte).
 */
@ApplicationScoped
public class DataMigrationService {

    private static final Logger LOG = Logger.getLogger(DataMigrationService.class);

    @Inject
    EntityManager em;

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        migrateFreeToDiscovery();
    }

    private void migrateFreeToDiscovery() {
        int updated = em.createQuery(
            "UPDATE SubscriptionEntity s SET s.planId = 'discovery' WHERE s.planId = 'free'"
        ).executeUpdate();

        if (updated > 0) {
            LOG.infof("Migration: %d subscription(s) migrated from planId 'free' to 'discovery'", updated);
        }
    }
}
