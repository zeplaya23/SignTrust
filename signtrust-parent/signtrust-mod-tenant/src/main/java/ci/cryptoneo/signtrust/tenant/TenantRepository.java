package ci.cryptoneo.signtrust.tenant;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Abstract repository that automatically enables Hibernate's tenant filter
 * before every query, ensuring tenant isolation at the data layer.
 *
 * @param <T> the entity type, must extend {@link TenantEntity}
 */
public abstract class TenantRepository<T extends TenantEntity> implements PanacheRepository<T> {

    @Inject
    EntityManager entityManager;

    protected void enableTenantFilter() {
        String tenantId = TenantContext.get();
        if (tenantId != null) {
            entityManager.unwrap(Session.class)
                    .enableFilter("tenantFilter")
                    .setParameter("tenantId", tenantId);
        }
    }

    @Override
    public T findById(Long id) {
        enableTenantFilter();
        return PanacheRepository.super.findById(id);
    }

    @Override
    public Optional<T> findByIdOptional(Long id) {
        enableTenantFilter();
        return PanacheRepository.super.findByIdOptional(id);
    }

    @Override
    public PanacheQuery<T> find(String query, Object... params) {
        enableTenantFilter();
        return PanacheRepository.super.find(query, params);
    }

    @Override
    public PanacheQuery<T> find(String query, Map<String, Object> params) {
        enableTenantFilter();
        return PanacheRepository.super.find(query, params);
    }

    @Override
    public PanacheQuery<T> findAll() {
        enableTenantFilter();
        return PanacheRepository.super.findAll();
    }

    @Override
    public List<T> listAll() {
        enableTenantFilter();
        return PanacheRepository.super.listAll();
    }

    @Override
    public List<T> list(String query, Object... params) {
        enableTenantFilter();
        return PanacheRepository.super.list(query, params);
    }

    @Override
    public List<T> list(String query, Map<String, Object> params) {
        enableTenantFilter();
        return PanacheRepository.super.list(query, params);
    }

    @Override
    public Stream<T> streamAll() {
        enableTenantFilter();
        return PanacheRepository.super.streamAll();
    }

    @Override
    public long count() {
        enableTenantFilter();
        return PanacheRepository.super.count();
    }

    @Override
    public long count(String query, Object... params) {
        enableTenantFilter();
        return PanacheRepository.super.count(query, params);
    }
}
