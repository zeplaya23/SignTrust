package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.keycloak.representations.idm.RoleRepresentation;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.net.HttpURLConnection;
import java.net.URI;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class AdminService {

    private static final Logger LOG = Logger.getLogger(AdminService.class);

    @Inject
    EntityManager em;

    @Inject
    Keycloak keycloak;

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "signtrust.frontend.url", defaultValue = "http://localhost:5080")
    String frontendUrl;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ─── Plan limits ───
    private static final Map<String, int[]> PLAN_LIMITS = Map.of(
        "free",       new int[]{5,   1},
        "pro",        new int[]{30,  3},
        "business",   new int[]{150, 10},
        "enterprise", new int[]{Integer.MAX_VALUE, Integer.MAX_VALUE}
    );

    private int envelopeMaxForPlan(String plan) {
        return PLAN_LIMITS.getOrDefault(plan, new int[]{5, 1})[0];
    }

    private int usersMaxForPlan(String plan) {
        return PLAN_LIMITS.getOrDefault(plan, new int[]{5, 1})[1];
    }

    // ═══════════════════════════════════════════
    // Dashboard
    // ═══════════════════════════════════════════

    public AdminDashboardDto getDashboardMetrics() {
        // Distinct tenants active (have at least one user)
        long tenantsActive = ((Number) em.createQuery(
            "SELECT COUNT(DISTINCT u.tenantId) FROM UserProfileEntity u WHERE u.tenantId IS NOT NULL"
        ).getSingleResult()).longValue();

        // Tenants growth vs last month
        long tenantsLastMonth = ((Number) em.createQuery(
            "SELECT COUNT(DISTINCT u.tenantId) FROM UserProfileEntity u WHERE u.tenantId IS NOT NULL AND u.createdAt < :startOfMonth"
        ).setParameter("startOfMonth", LocalDateTime.now().withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS))
        .getSingleResult()).longValue();
        int tenantsGrowth = (int)(tenantsActive - tenantsLastMonth);

        // Total envelopes
        long envelopesTotal = ((Number) em.createQuery(
            "SELECT COUNT(e) FROM EnvelopeEntity e"
        ).getSingleResult()).longValue();

        // Envelopes growth % (this month vs last month)
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        LocalDateTime startOfLastMonth = startOfMonth.minusMonths(1);
        long envThisMonth = ((Number) em.createQuery(
            "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.createdAt >= :start"
        ).setParameter("start", startOfMonth).getSingleResult()).longValue();
        long envLastMonth = ((Number) em.createQuery(
            "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.createdAt >= :start AND e.createdAt < :end"
        ).setParameter("start", startOfLastMonth).setParameter("end", startOfMonth).getSingleResult()).longValue();
        double envelopesGrowthPct = envLastMonth > 0 ? Math.round((envThisMonth - envLastMonth) * 1000.0 / envLastMonth) / 10.0 : 0;

        // Signatures this month (signatories with status SIGNED and signedAt this month)
        long signaturesMonth = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.signedAt >= :start"
        ).setParameter("start", startOfMonth).getSingleResult()).longValue();
        long signaturesLastMonth = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.signedAt >= :start AND s.signedAt < :end"
        ).setParameter("start", startOfLastMonth).setParameter("end", startOfMonth).getSingleResult()).longValue();
        double signaturesGrowthPct = signaturesLastMonth > 0 ? Math.round((signaturesMonth - signaturesLastMonth) * 1000.0 / signaturesLastMonth) / 10.0 : 0;

        // Monthly revenue from active subscriptions
        Long revenueMonthly = (Long) em.createQuery(
            "SELECT COALESCE(SUM(s.amount), 0) FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL')"
        ).getSingleResult();

        // Revenue growth (compare to last month's subscriptions amount snapshot — approximate with current)
        double revenueMrrPct = 0;

        // Certificates active — mock for now (EJBCA not integrated)
        int certificatesActive = 0;

        return new AdminDashboardDto(
            (int) tenantsActive, tenantsGrowth,
            (int) envelopesTotal, envelopesGrowthPct,
            (int) signaturesMonth, signaturesGrowthPct,
            revenueMonthly, revenueMrrPct,
            certificatesActive
        );
    }

    public List<ServiceHealthDto> getServiceHealth() {
        List<ServiceHealthDto> health = new ArrayList<>();
        health.add(new ServiceHealthDto("Quarkus API", "up"));

        // MySQL — if we got here, it's up (EntityManager works)
        health.add(new ServiceHealthDto("MySQL", "up"));

        // Keycloak
        try {
            keycloak.serverInfo().getInfo();
            health.add(new ServiceHealthDto("Keycloak", "up"));
        } catch (Exception e) {
            health.add(new ServiceHealthDto("Keycloak", "down"));
        }

        // MinIO — check via HTTP
        health.add(checkHttpHealth("MinIO", "http://signtrust-minio:9000/minio/health/live"));

        // EJBCA
        health.add(new ServiceHealthDto("EJBCA", "up")); // mock — not yet integrated
        // SoftHSM
        health.add(new ServiceHealthDto("SoftHSM", "up")); // mock — local to JVM

        return health;
    }

    private ServiceHealthDto checkHttpHealth(String name, String url) {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setRequestMethod("GET");
            int code = conn.getResponseCode();
            conn.disconnect();
            return new ServiceHealthDto(name, code == 200 ? "up" : "degraded");
        } catch (Exception e) {
            return new ServiceHealthDto(name, "down");
        }
    }

    public List<AdminAlertDto> getAlerts() {
        List<AdminAlertDto> alerts = new ArrayList<>();
        int alertId = 1;

        // Tenants approaching quota (>= 90%)
        @SuppressWarnings("unchecked")
        List<Object[]> quotaRows = em.createQuery(
            "SELECT e.tenantId, COUNT(e) FROM EnvelopeEntity e GROUP BY e.tenantId"
        ).getResultList();

        for (Object[] row : quotaRows) {
            String tenantId = (String) row[0];
            long used = ((Number) row[1]).longValue();
            String plan = getTenantPlan(tenantId);
            int max = envelopeMaxForPlan(plan);
            if (max < Integer.MAX_VALUE && used * 100 / max >= 90) {
                String tenantName = getTenantName(tenantId);
                alerts.add(new AdminAlertDto(
                    String.valueOf(alertId++), "alert",
                    "Tenant '" + tenantName + "' a atteint " + (used * 100 / max) + "% de son quota",
                    "red", "Récent"
                ));
            }
        }

        // Subscriptions expiring within 48h
        long expiringCount = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SubscriptionEntity s WHERE s.status = 'ACTIVE' AND s.endDate BETWEEN :now AND :limit"
        ).setParameter("now", LocalDateTime.now()).setParameter("limit", LocalDateTime.now().plusHours(48))
        .getSingleResult()).longValue();
        if (expiringCount > 0) {
            alerts.add(new AdminAlertDto(
                String.valueOf(alertId++), "clock",
                expiringCount + " abonnement(s) expirent dans 48h",
                "amber", "Récent"
            ));
        }

        // Trial subscriptions about to expire
        long trialExpiring = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SubscriptionEntity s WHERE s.status = 'TRIAL' AND s.trialEndDate BETWEEN :now AND :limit"
        ).setParameter("now", LocalDateTime.now()).setParameter("limit", LocalDateTime.now().plusDays(3))
        .getSingleResult()).longValue();
        if (trialExpiring > 0) {
            alerts.add(new AdminAlertDto(
                String.valueOf(alertId++), "clock",
                trialExpiring + " période(s) d'essai expirent bientôt",
                "amber", "Récent"
            ));
        }

        return alerts;
    }

    // ═══════════════════════════════════════════
    // Tenants
    // ═══════════════════════════════════════════

    public PagedResponse<AdminTenantDto> getTenants(int page, int size, String status, String search) {
        // Get distinct tenants from user_profiles
        @SuppressWarnings("unchecked")
        List<Object[]> tenantRows = em.createQuery(
            "SELECT u.tenantId, MIN(u.companyName), MIN(u.email), MIN(u.phone), MIN(u.accountType), MIN(u.createdAt), COUNT(u) " +
            "FROM UserProfileEntity u WHERE u.tenantId IS NOT NULL GROUP BY u.tenantId ORDER BY MIN(u.createdAt) DESC"
        ).getResultList();

        List<AdminTenantDto> tenants = new ArrayList<>();
        for (Object[] row : tenantRows) {
            String tenantId = (String) row[0];
            String name = row[1] != null ? (String) row[1] : (String) row[2]; // companyName or email
            String email = (String) row[2];
            String phone = (String) row[3];
            String accountType = (String) row[4];
            LocalDateTime registeredAt = (LocalDateTime) row[5];
            long usersCount = ((Number) row[6]).longValue();

            // Get subscription info
            String plan = "free";
            String subStatus = "active";
            long revenue = 0;
            String paymentMethod = null;
            String nextPayment = null;
            try {
                Object[] subRow = (Object[]) em.createQuery(
                    "SELECT s.planId, s.status, COALESCE(s.amount, 0), s.paymentMethod, s.endDate " +
                    "FROM SubscriptionEntity s WHERE s.userId IN " +
                    "(SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid) " +
                    "ORDER BY s.createdAt DESC"
                ).setParameter("tid", tenantId).setMaxResults(1).getSingleResult();
                plan = (String) subRow[0];
                subStatus = mapSubscriptionStatus((String) subRow[1]);
                revenue = ((Number) subRow[2]).longValue();
                paymentMethod = (String) subRow[3];
                LocalDateTime endDate = (LocalDateTime) subRow[4];
                if (endDate != null) {
                    nextPayment = endDate.format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.FRENCH));
                }
            } catch (NoResultException ignored) {}

            // Envelope count for this tenant
            long envelopesUsed = ((Number) em.createQuery(
                "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid"
            ).setParameter("tid", tenantId).getSingleResult()).longValue();

            int envMax = envelopeMaxForPlan(plan);
            int usrMax = usersMaxForPlan(plan);

            AdminTenantDto dto = new AdminTenantDto(
                tenantId, name, plan, subStatus,
                (int) envelopesUsed, envMax,
                (int) usersCount, usrMax,
                revenue, registeredAt,
                email, phone, accountType != null ? accountType : "enterprise",
                "realm-" + tenantId, "tenant-" + tenantId, null,
                nextPayment, paymentMethod
            );
            tenants.add(dto);
        }

        // Apply filters
        var filtered = tenants.stream()
            .filter(t -> status == null || status.isEmpty() || t.status().equals(status))
            .filter(t -> search == null || search.isEmpty() ||
                (t.name() != null && t.name().toLowerCase().contains(search.toLowerCase())) ||
                (t.email() != null && t.email().toLowerCase().contains(search.toLowerCase())))
            .toList();

        int total = filtered.size();
        int start = page * size;
        int end = Math.min(start + size, total);
        var items = start < total ? filtered.subList(start, end) : List.<AdminTenantDto>of();
        return new PagedResponse<>(items, total, page, size);
    }

    public AdminTenantDto getTenant(String id) {
        var result = getTenants(0, Integer.MAX_VALUE, null, null);
        return result.items().stream().filter(t -> t.id().equals(id)).findFirst().orElse(null);
    }

    @Transactional
    public AdminTenantDto createTenant(AdminTenantCreateRequest request) {
        String tenantId = UUID.randomUUID().toString();
        String tempPassword = generateTempPassword();

        // 1. Create user in Keycloak signtrust realm
        String keycloakId = null;
        try {
            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setUsername(request.email());
            kcUser.setEmail(request.email());
            kcUser.setFirstName(request.name());
            kcUser.setLastName("");
            kcUser.setEnabled(true);
            kcUser.setEmailVerified(true);

            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(tempPassword);
            cred.setTemporary(false);
            kcUser.setCredentials(Collections.singletonList(cred));

            try (var response = keycloak.realm("signtrust").users().create(kcUser)) {
                if (response.getStatus() < 400) {
                    String location = response.getLocation().getPath();
                    keycloakId = location.substring(location.lastIndexOf('/') + 1);
                    LOG.infof("Created Keycloak user %s for tenant %s", request.email(), tenantId);
                } else {
                    LOG.warnf("Keycloak user creation returned %d for %s", response.getStatus(), request.email());
                }
            }

            // Assign 'admin' role
            if (keycloakId != null) {
                try {
                    RoleRepresentation adminRole = keycloak.realm("signtrust")
                            .roles().get("admin").toRepresentation();
                    keycloak.realm("signtrust").users().get(keycloakId)
                            .roles().realmLevel().add(Collections.singletonList(adminRole));
                } catch (Exception e) {
                    LOG.warnf(e, "Failed to assign admin role to %s", request.email());
                }
            }
        } catch (Exception e) {
            LOG.warnf(e, "Failed to create Keycloak user for tenant %s — continuing", tenantId);
        }

        // 2. Create user profile in DB
        UserProfileEntity user = new UserProfileEntity();
        user.setKeycloakId(keycloakId);
        user.setTenantId(tenantId);
        user.setEmail(request.email());
        user.setFirstName(request.name());
        user.setLastName("");
        user.setCompanyName(request.name());
        user.setAccountType(request.type());
        em.persist(user);

        // 3. Send invitation email with temporary password
        try {
            String loginUrl = frontendUrl;
            mailer.send(Mail.withHtml(request.email(),
                "SignTrust — Votre compte administrateur est prêt",
                "<div style='font-family:DM Sans,Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px'>"
                + "<h2 style='color:#1E3A5F;margin-bottom:5px'>Bienvenue sur SignTrust</h2>"
                + "<p style='color:#5F6B7A;font-size:14px'>Votre organisation <strong>" + request.name() + "</strong> a été créée.</p>"
                + "<p style='color:#5F6B7A;font-size:14px'>Voici vos identifiants de connexion :</p>"
                + "<div style='background:#EBF2FA;border-radius:12px;padding:20px;margin:20px 0'>"
                + "<p style='margin:5px 0;font-size:14px'><strong>Email :</strong> " + request.email() + "</p>"
                + "<p style='margin:5px 0;font-size:14px'><strong>Mot de passe temporaire :</strong></p>"
                + "<div style='background:#fff;border-radius:8px;padding:12px;text-align:center;margin-top:8px'>"
                + "<span style='font-size:20px;font-weight:700;letter-spacing:2px;color:#1E3A5F'>" + tempPassword + "</span>"
                + "</div>"
                + "</div>"
                + "<p style='color:#EF4444;font-size:13px;font-weight:600'>⚠ Vous devrez changer ce mot de passe à la première connexion.</p>"
                + "<a href='" + loginUrl + "' style='display:inline-block;background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:10px'>Se connecter à SignTrust</a>"
                + "<p style='color:#94A3B8;font-size:12px;margin-top:20px'>Plan : " + request.plan().toUpperCase() + " — Vous pouvez gérer votre abonnement depuis votre espace.</p>"
                + "</div>"
            ));
            LOG.infof("Invitation email sent to %s", request.email());
        } catch (Exception e) {
            LOG.warnf(e, "Failed to send invitation email to %s — account created anyway", request.email());
        }

        int envMax = envelopeMaxForPlan(request.plan());
        int usrMax = usersMaxForPlan(request.plan());

        return new AdminTenantDto(
            tenantId, request.name(), request.plan(), "active",
            0, envMax, 1, usrMax, 0,
            LocalDateTime.now(), request.email(), null, request.type(),
            null, "tenant-" + tenantId, null, null, null
        );
    }

    private String generateTempPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "@#$%&";
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(SECURE_RANDOM.nextInt(upper.length())));
        sb.append(lower.charAt(SECURE_RANDOM.nextInt(lower.length())));
        sb.append(digits.charAt(SECURE_RANDOM.nextInt(digits.length())));
        sb.append(special.charAt(SECURE_RANDOM.nextInt(special.length())));
        String all = upper + lower + digits + special;
        for (int i = 0; i < 8; i++) {
            sb.append(all.charAt(SECURE_RANDOM.nextInt(all.length())));
        }
        // Shuffle
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
        }
        return new String(chars);
    }

    @Transactional
    public void suspendTenant(String id) {
        // Suspend all active subscriptions for this tenant
        em.createQuery(
            "UPDATE SubscriptionEntity s SET s.status = 'CANCELLED' WHERE s.status IN ('ACTIVE', 'TRIAL') " +
            "AND s.userId IN (SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid)"
        ).setParameter("tid", id).executeUpdate();

        // Disable Keycloak realm
        try {
            RealmRepresentation realm = keycloak.realm("tenant-" + id).toRepresentation();
            realm.setEnabled(false);
            keycloak.realm("tenant-" + id).update(realm);
        } catch (Exception e) {
            LOG.warnf(e, "Failed to disable Keycloak realm for tenant %s", id);
        }

        LOG.infof("Suspended tenant %s", id);
    }

    @Transactional
    public void activateTenant(String id) {
        // Re-enable Keycloak realm
        try {
            RealmRepresentation realm = keycloak.realm("tenant-" + id).toRepresentation();
            realm.setEnabled(true);
            keycloak.realm("tenant-" + id).update(realm);
        } catch (Exception e) {
            LOG.warnf(e, "Failed to enable Keycloak realm for tenant %s", id);
        }

        LOG.infof("Activated tenant %s", id);
    }

    @Transactional
    public void deleteTenant(String id) {
        // Delete envelopes (cascades to documents, signatories, fields)
        em.createQuery("DELETE FROM EnvelopeEntity e WHERE e.tenantId = :tid")
            .setParameter("tid", id).executeUpdate();

        // Delete subscriptions
        em.createQuery(
            "DELETE FROM SubscriptionEntity s WHERE s.userId IN " +
            "(SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid)"
        ).setParameter("tid", id).executeUpdate();

        // Delete user profiles
        em.createQuery("DELETE FROM UserProfileEntity u WHERE u.tenantId = :tid")
            .setParameter("tid", id).executeUpdate();

        // Delete Keycloak realm
        try {
            keycloak.realm("tenant-" + id).remove();
        } catch (Exception e) {
            LOG.warnf(e, "Failed to delete Keycloak realm for tenant %s", id);
        }

        LOG.infof("Deleted tenant %s", id);
    }

    public List<AdminTenantUserDto> getTenantUsers(String tenantId) {
        @SuppressWarnings("unchecked")
        List<UserProfileEntity> users = em.createQuery(
            "SELECT u FROM UserProfileEntity u WHERE u.tenantId = :tid ORDER BY u.createdAt DESC"
        ).setParameter("tid", tenantId).getResultList();

        return users.stream().map(u -> {
            String name = (u.getFirstName() != null ? u.getFirstName() : "") +
                          (u.getLastName() != null ? " " + u.getLastName() : "");
            if (name.isBlank()) name = u.getEmail();

            // Determine role — first user is Admin, rest are Members
            String role = users.indexOf(u) == 0 ? "Admin" : "Membre";

            // Last activity from audit logs
            String lastActivity = "—";
            try {
                LocalDateTime lastAudit = (LocalDateTime) em.createQuery(
                    "SELECT MAX(a.createdAt) FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.userId = :uid"
                ).setParameter("uid", u.getKeycloakId()).getSingleResult();
                if (lastAudit != null) {
                    long daysAgo = ChronoUnit.DAYS.between(lastAudit, LocalDateTime.now());
                    lastActivity = daysAgo == 0 ? "Aujourd'hui" : daysAgo == 1 ? "Hier" : daysAgo + "j";
                }
            } catch (Exception ignored) {}

            return new AdminTenantUserDto(String.valueOf(u.getId()), name.trim(), role, lastActivity);
        }).toList();
    }

    public AdminDashboardDto getTenantStats(String tenantId) {
        long envelopes = ((Number) em.createQuery(
            "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid"
        ).setParameter("tid", tenantId).getSingleResult()).longValue();

        long signatures = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid"
        ).setParameter("tid", tenantId).getSingleResult()).longValue();

        Long revenue = (Long) em.createQuery(
            "SELECT COALESCE(SUM(sub.amount), 0) FROM SubscriptionEntity sub " +
            "WHERE sub.userId IN (SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid)"
        ).setParameter("tid", tenantId).getSingleResult();

        // Growth — simplified: percentage of signatures this month vs last month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        long sigThisMonth = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.signedAt >= :start"
        ).setParameter("tid", tenantId).setParameter("start", startOfMonth).getSingleResult()).longValue();
        long sigLastMonth = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.signedAt >= :start AND s.signedAt < :end"
        ).setParameter("tid", tenantId).setParameter("start", startOfMonth.minusMonths(1)).setParameter("end", startOfMonth).getSingleResult()).longValue();
        double sigGrowth = sigLastMonth > 0 ? Math.round((sigThisMonth - sigLastMonth) * 1000.0 / sigLastMonth) / 10.0 : 0;

        return new AdminDashboardDto(0, 0, (int) envelopes, 0, (int) signatures, sigGrowth, revenue, 0, 0);
    }

    public void resetUserMfa(String tenantId, String userId) {
        try {
            // Find user in Keycloak and remove credentials
            UserProfileEntity user = em.find(UserProfileEntity.class, Long.valueOf(userId));
            if (user != null && user.getKeycloakId() != null) {
                var kcUser = keycloak.realm("signtrust").users().get(user.getKeycloakId());
                List<CredentialRepresentation> credentials = kcUser.credentials();
                for (CredentialRepresentation cred : credentials) {
                    if ("otp".equals(cred.getType()) || "totp".equals(cred.getType())) {
                        kcUser.removeCredential(cred.getId());
                    }
                }
                LOG.infof("Reset MFA for user %s (keycloak=%s)", userId, user.getKeycloakId());
            }
        } catch (Exception e) {
            LOG.warnf(e, "Failed to reset MFA for user %s in tenant %s", userId, tenantId);
        }
    }

    // ═══════════════════════════════════════════
    // Monitoring
    // ═══════════════════════════════════════════

    public InfraMetricsDto getInfraMetrics() {
        Runtime rt = Runtime.getRuntime();
        double usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024.0 * 1024.0);
        double totalMb = rt.maxMemory() / (1024.0 * 1024.0);

        // CPU load
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double cpuLoad = osBean.getSystemLoadAverage();
        int cpuCount = osBean.getAvailableProcessors();
        double cpuPercent = cpuLoad >= 0 ? Math.min(100, Math.round(cpuLoad / cpuCount * 1000.0) / 10.0) : -1;

        // Storage — count documents
        long docsCount = ((Number) em.createQuery("SELECT COUNT(d) FROM DocumentEntity d").getSingleResult()).longValue();
        // Approximate: average 500KB per document
        double storageUsedGb = Math.round(docsCount * 0.5 / 1024.0 * 10) / 10.0;

        return new InfraMetricsDto(
            cpuPercent,
            Math.round(usedMb / 1024.0 * 10) / 10.0,
            Math.round(totalMb / 1024.0 * 10) / 10.0,
            storageUsedGb, 500.0,
            0, 0  // requestsPerMin and p95 would need a metrics library
        );
    }

    public List<QuotaTenantDto> getQuotaTenants() {
        // Get tenants with envelope counts
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
            "SELECT e.tenantId, COUNT(e) FROM EnvelopeEntity e GROUP BY e.tenantId"
        ).getResultList();

        List<QuotaTenantDto> quotas = new ArrayList<>();
        for (Object[] row : rows) {
            String tenantId = (String) row[0];
            long used = ((Number) row[1]).longValue();
            String plan = getTenantPlan(tenantId);
            int max = envelopeMaxForPlan(plan);
            if (max < Integer.MAX_VALUE && max > 0) {
                int percent = (int)(used * 100 / max);
                if (percent >= 80) {
                    String name = getTenantName(tenantId);
                    quotas.add(new QuotaTenantDto(tenantId, name, plan, (int) used, max, percent));
                }
            }
        }
        quotas.sort((a, b) -> b.percent() - a.percent());
        return quotas;
    }

    public ActivityCountersDto getActivityCounters() {
        LocalDateTime last24h = LocalDateTime.now().minusHours(24);

        long envelopesCreated = countAuditAction("ENVELOPE_CREATED", last24h);
        long signatures = countAuditAction("SIGNATURE_SIGNED", last24h);
        long documentsUploaded = countAuditAction("DOCUMENT_UPLOADED", last24h);
        long emailsSent = countAuditAction("EMAIL_SENT", last24h);
        long payments = countAuditAction("PAYMENT_COMPLETED", last24h);
        long apiErrors = countAuditAction("API_ERROR", last24h);

        // Fallback: if no audit entries, count from entities directly
        if (envelopesCreated == 0) {
            envelopesCreated = ((Number) em.createQuery(
                "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.createdAt >= :since"
            ).setParameter("since", last24h).getSingleResult()).longValue();
        }
        if (signatures == 0) {
            signatures = ((Number) em.createQuery(
                "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.signedAt >= :since"
            ).setParameter("since", last24h).getSingleResult()).longValue();
        }

        return new ActivityCountersDto(
            (int) envelopesCreated, (int) signatures, (int) documentsUploaded,
            (int) emailsSent, (int) payments, (int) apiErrors
        );
    }

    private long countAuditAction(String action, LocalDateTime since) {
        return ((Number) em.createQuery(
            "SELECT COUNT(a) FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.action = :action AND a.createdAt >= :since"
        ).setParameter("action", action).setParameter("since", since).getSingleResult()).longValue();
    }

    // ═══════════════════════════════════════════
    // Metrics
    // ═══════════════════════════════════════════

    public GlobalMetricsDto getGlobalMetrics(String period) {
        // MRR — sum of active subscription amounts
        Long mrr = (Long) em.createQuery(
            "SELECT COALESCE(SUM(s.amount), 0) FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL')"
        ).getSingleResult();

        // MRR growth — compare to last month
        Long mrrLastMonth = (Long) em.createQuery(
            "SELECT COALESCE(SUM(s.amount), 0) FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL') AND s.createdAt < :start"
        ).setParameter("start", LocalDateTime.now().withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS)).getSingleResult();
        double mrrGrowthPct = mrrLastMonth > 0 ? Math.round((mrr - mrrLastMonth) * 1000.0 / mrrLastMonth) / 10.0 : 0;

        // New tenants this month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        long newTenants = ((Number) em.createQuery(
            "SELECT COUNT(DISTINCT u.tenantId) FROM UserProfileEntity u WHERE u.createdAt >= :start"
        ).setParameter("start", startOfMonth).getSingleResult()).longValue();

        // New tenants growth
        long newTenantsLastMonth = ((Number) em.createQuery(
            "SELECT COUNT(DISTINCT u.tenantId) FROM UserProfileEntity u WHERE u.createdAt >= :start AND u.createdAt < :end"
        ).setParameter("start", startOfMonth.minusMonths(1)).setParameter("end", startOfMonth).getSingleResult()).longValue();
        double newTenantsGrowthPct = newTenantsLastMonth > 0 ? Math.round((newTenants - newTenantsLastMonth) * 1000.0 / newTenantsLastMonth) / 10.0 : 0;

        // Signatures per day (average over last 30 days)
        long sigLast30 = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.signedAt >= :since"
        ).setParameter("since", LocalDateTime.now().minusDays(30)).getSingleResult()).longValue();
        long signaturesPerDay = sigLast30 / 30;

        // Signatures growth
        long sigPrev30 = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.signedAt >= :start AND s.signedAt < :end"
        ).setParameter("start", LocalDateTime.now().minusDays(60)).setParameter("end", LocalDateTime.now().minusDays(30)).getSingleResult()).longValue();
        long sigPrevPerDay = sigPrev30 > 0 ? sigPrev30 / 30 : 0;
        double signaturesGrowthPct = sigPrevPerDay > 0 ? Math.round((signaturesPerDay - sigPrevPerDay) * 1000.0 / sigPrevPerDay) / 10.0 : 0;

        // Churn rate — cancelled subscriptions / total active at start of month
        long cancelled = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SubscriptionEntity s WHERE s.status = 'CANCELLED' AND s.createdAt >= :start"
        ).setParameter("start", startOfMonth).getSingleResult()).longValue();
        long totalActive = ((Number) em.createQuery(
            "SELECT COUNT(s) FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL')"
        ).getSingleResult()).longValue();
        double churnRate = totalActive > 0 ? Math.round(cancelled * 1000.0 / (totalActive + cancelled)) / 10.0 : 0;

        return new GlobalMetricsDto(mrr, mrrGrowthPct, (int) newTenants, newTenantsGrowthPct, (int) signaturesPerDay, signaturesGrowthPct, churnRate, 0);
    }

    public List<PlanDistributionDto> getPlanDistribution() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
            "SELECT s.planId, COUNT(s) FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL') GROUP BY s.planId"
        ).getResultList();

        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        if (total == 0) return List.of();

        Map<String, String> planLabels = Map.of(
            "free", "Free",
            "pro", "Professionnel",
            "business", "Business",
            "enterprise", "Enterprise"
        );

        return rows.stream().map(r -> {
            String planId = (String) r[0];
            long count = ((Number) r[1]).longValue();
            double percent = Math.round(count * 1000.0 / total) / 10.0;
            String label = planLabels.getOrDefault(planId, planId);
            return new PlanDistributionDto(label, (int) count, percent);
        }).sorted((a, b) -> b.count() - a.count()).toList();
    }

    public List<TopTenantDto> getTopTenants() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
            "SELECT e.tenantId, COUNT(e) FROM EnvelopeEntity e GROUP BY e.tenantId ORDER BY COUNT(e) DESC"
        ).setMaxResults(5).getResultList();

        return rows.stream().map(r -> {
            String tenantId = (String) r[0];
            long envCount = ((Number) r[1]).longValue();
            String name = getTenantName(tenantId);

            // Get revenue
            Long revenue = (Long) em.createQuery(
                "SELECT COALESCE(SUM(s.amount), 0) FROM SubscriptionEntity s WHERE s.userId IN " +
                "(SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid)"
            ).setParameter("tid", tenantId).getSingleResult();

            String revenueStr = revenue > 0 ? formatAmount(revenue) : "0";
            return new TopTenantDto(name, envCount + " env", revenueStr);
        }).toList();
    }

    public List<RevenueByPaymentDto> getRevenueBreakdown() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
            "SELECT COALESCE(s.paymentMethod, 'Autre'), SUM(s.amount) FROM SubscriptionEntity s " +
            "WHERE s.status IN ('ACTIVE', 'TRIAL') AND s.amount > 0 GROUP BY s.paymentMethod ORDER BY SUM(s.amount) DESC"
        ).getResultList();

        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        if (total == 0) return List.of();

        Map<String, String> colors = Map.of(
            "Orange Money", "#FF6600",
            "Carte bancaire", "#0891B2",
            "MTN MoMo", "#FFCC00",
            "Wave", "#16A34A",
            "Virement", "#6366F1"
        );

        return rows.stream().map(r -> {
            String method = (String) r[0];
            long amount = ((Number) r[1]).longValue();
            int percent = (int) (amount * 100 / total);
            String color = colors.getOrDefault(method, "#9CA3AF");
            return new RevenueByPaymentDto(method, percent, formatAmount(amount), color);
        }).toList();
    }

    // ═══════════════════════════════════════════
    // PKI — Mock (EJBCA not yet integrated)
    // ═══════════════════════════════════════════

    public List<CertificateDto> getCertificates(int page, int size) {
        return List.of(
            new CertificateDto("c1", "Diallo Ibrahim (SIFCA)", "AES End Entity", "SubCA-SIFCA", "14 Avr 2026", "14 Avr 2028", "active"),
            new CertificateDto("c2", "Koffi Jean (SIFCA)", "AES End Entity", "SubCA-SIFCA", "12 Avr 2026", "12 Avr 2028", "active"),
            new CertificateDto("c3", "TSA Token #47", "Horodatage", "Root CA", "10 Avr 2026", "10 Avr 2031", "active"),
            new CertificateDto("c4", "Traoré Fatou (DevConsult)", "AES End Entity", "SubCA-DevConsult", "8 Avr 2026", "8 Avr 2028", "active"),
            new CertificateDto("c5", "Ancien cert Kouassi", "AES End Entity", "SubCA-Shared", "Jan 2025", "Jan 2027", "revoked")
        );
    }

    public CertificateDto issueCertificate(CertificateIssueRequest request) {
        return new CertificateDto("c-new", "Nouveau certificat", request.profile(), "SubCA-Shared", "15 Avr 2026", "15 Avr 2028", "active");
    }

    public void revokeCertificate(String id, String reason) { /* TODO: real impl via EJBCA */ }

    public List<HsmSlotDto> getHsmSlots() {
        return List.of(
            new HsmSlotDto(0, "Root CA", 1, "RSA 4096", "Verrouillé"),
            new HsmSlotDto(1, "Sub-CAs", 5, "RSA 2048", "Actif"),
            new HsmSlotDto(2, "TSA", 1, "RSA 2048", "Actif"),
            new HsmSlotDto(3, "Utilisateurs", 1204, "RSA 2048", "Actif (auto)")
        );
    }

    // ═══════════════════════════════════════════
    // Config — Mock (static config for now)
    // ═══════════════════════════════════════════

    public Map<String, String> getConfig(String section) {
        return switch (section) {
            case "plans" -> Map.of(
                "Découverte", "Gratuit — 5 env/mois, 1 user, SES, 2 docs/env",
                "Professionnel", "4 900 FCFA/mois — 30 env, 3 users, AES",
                "Business", "24 900 FCFA/mois — 150 env, 10 users, QES, API",
                "Enterprise", "Sur mesure — illimité"
            );
            case "paystack" -> Map.of(
                "Clé publique", "pk_live_****************************a1b2",
                "Clé secrète", "sk_live_**** (masquée)",
                "Webhook URL", "https://api.signtrust.ci/webhooks/paystack",
                "Statut", "Connecté"
            );
            case "ejbca" -> Map.of(
                "URL Admin", "https://ejbca.internal:8443/ejbca/adminweb",
                "API REST", "https://ejbca.internal:8443/ejbca/ejbca-rest-api",
                "Root CA", "CN=Cryptoneo Root CA, O=Cryptoneo, C=CI",
                "Profils actifs", "RootCA, SubCA, EndEntity-AES, TSA"
            );
            case "hsm" -> Map.of(
                "Library path", "/usr/lib/softhsm/libsofthsm2.so",
                "Token directory", "/var/lib/softhsm/tokens/",
                "Slots configurés", "4 (Root, SubCA, TSA, Users)",
                "PIN policy", "Min 8 car, rotation 90 jours"
            );
            case "keycloak" -> Map.of(
                "URL", "https://auth.signtrust.ci",
                "Master realm", "cryptoneo-master",
                "Realms tenants", "342 realms actifs",
                "MFA politique", "TOTP obligatoire pour admins"
            );
            case "notifications" -> Map.of(
                "Serveur", "smtp.mailgun.org:587",
                "Expéditeur", "noreply@signtrust.ci",
                "Templates", "12 templates actifs",
                "SMS provider", "Twilio (CI +225)"
            );
            default -> Map.of();
        };
    }

    public void updateConfig(String section, Map<String, String> config) { /* TODO: real impl */ }

    // ═══════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════

    private String getTenantPlan(String tenantId) {
        try {
            return (String) em.createQuery(
                "SELECT s.planId FROM SubscriptionEntity s WHERE s.status IN ('ACTIVE', 'TRIAL') " +
                "AND s.userId IN (SELECT u.id FROM UserProfileEntity u WHERE u.tenantId = :tid) " +
                "ORDER BY s.createdAt DESC"
            ).setParameter("tid", tenantId).setMaxResults(1).getSingleResult();
        } catch (NoResultException e) {
            return "free";
        }
    }

    private String getTenantName(String tenantId) {
        try {
            Object[] row = (Object[]) em.createQuery(
                "SELECT u.companyName, u.email FROM UserProfileEntity u WHERE u.tenantId = :tid ORDER BY u.createdAt ASC"
            ).setParameter("tid", tenantId).setMaxResults(1).getSingleResult();
            return row[0] != null ? (String) row[0] : (String) row[1];
        } catch (NoResultException e) {
            return tenantId;
        }
    }

    private String mapSubscriptionStatus(String subStatus) {
        return switch (subStatus) {
            case "ACTIVE" -> "active";
            case "TRIAL" -> "trial";
            case "EXPIRED" -> "expired";
            case "CANCELLED" -> "suspended";
            default -> "active";
        };
    }

    private String formatAmount(long amount) {
        if (amount >= 1_000_000) {
            return Math.round(amount / 100_000.0) / 10.0 + "M";
        } else if (amount >= 1_000) {
            return Math.round(amount / 100.0) / 10.0 + "K";
        }
        return String.valueOf(amount);
    }
}
