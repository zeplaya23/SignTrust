package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class AdminService {

    // Dashboard
    public AdminDashboardDto getDashboardMetrics() {
        return new AdminDashboardDto(342, 18, 45230, 12.3, 8741, 8.7, 4200000, 15.0, 1204);
    }

    public List<ServiceHealthDto> getServiceHealth() {
        return List.of(
            new ServiceHealthDto("Quarkus API", "up"),
            new ServiceHealthDto("Keycloak", "up"),
            new ServiceHealthDto("MySQL", "up"),
            new ServiceHealthDto("MinIO", "up"),
            new ServiceHealthDto("EJBCA", "up"),
            new ServiceHealthDto("SoftHSM", "up")
        );
    }

    public List<AdminAlertDto> getAlerts() {
        return List.of(
            new AdminAlertDto("1", "alert", "Tenant 'BTP+ SARL' a atteint 95% de son quota", "red", "Il y a 1h"),
            new AdminAlertDto("2", "clock", "3 abonnements expirent dans 48h", "amber", "Il y a 2h"),
            new AdminAlertDto("3", "shield", "Certificat Sub-CA 'SIFCA' expire dans 30j", "amber", "Il y a 5h"),
            new AdminAlertDto("4", "check", "Backup quotidien complété avec succès", "green", "Il y a 6h"),
            new AdminAlertDto("5", "refresh", "EJBCA redémarré après mise à jour", "green", "Hier")
        );
    }

    // Tenants
    private final List<AdminTenantDto> mockTenants = List.of(
        new AdminTenantDto("1", "Groupe SIFCA", "business", "active", 234, 150, 8, 10, 24900, LocalDateTime.of(2025, 9, 15, 0, 0), "admin@sifca.ci", "+225 27 20 30 40", "enterprise", "realm-sifca-001", "tenant-sifca-001", "SubCA-SIFCA", "15 Mai 2026", "Carte Visa ****4242"),
        new AdminTenantDto("2", "SIB Technologies", "pro", "active", 28, 30, 3, 3, 4900, LocalDateTime.of(2026, 2, 1, 0, 0), "contact@sib.ci", null, "enterprise", "realm-sib-002", "tenant-sib-002", null, "1 Mar 2026", "Orange Money"),
        new AdminTenantDto("3", "Cabinet Koné", "pro", "trial", 5, 30, 1, 3, 0, LocalDateTime.of(2026, 4, 13, 0, 0), "kone@avocat.ci", null, "enterprise", "realm-kone-003", "tenant-kone-003", null, null, null),
        new AdminTenantDto("4", "BTP+ SARL", "pro", "active", 29, 30, 2, 3, 4900, LocalDateTime.of(2026, 3, 1, 0, 0), "info@btpplus.ci", null, "enterprise", "realm-btp-004", "tenant-btp-004", null, "1 Avr 2026", "MTN MoMo"),
        new AdminTenantDto("5", "Marie Kouassi", "free", "active", 3, 5, 1, 1, 0, LocalDateTime.of(2026, 4, 11, 0, 0), "marie.k@gmail.com", null, "particular", "realm-marie-005", "tenant-marie-005", null, null, null),
        new AdminTenantDto("6", "Pharmacie Adjamé", "pro", "suspended", 0, 30, 2, 3, 4900, LocalDateTime.of(2025, 12, 1, 0, 0), "pharma@adjame.ci", null, "enterprise", "realm-pharma-006", "tenant-pharma-006", null, null, null),
        new AdminTenantDto("7", "DevConsult CI", "business", "active", 89, 150, 6, 10, 24900, LocalDateTime.of(2025, 10, 1, 0, 0), "admin@devconsult.ci", null, "enterprise", "realm-dev-007", "tenant-dev-007", "SubCA-DevConsult", "1 Nov 2026", "Carte bancaire"),
        new AdminTenantDto("8", "École ISM", "pro", "expired", 0, 30, 2, 3, 0, LocalDateTime.of(2025, 11, 1, 0, 0), "contact@ism.ci", null, "enterprise", "realm-ism-008", "tenant-ism-008", null, null, null),
        new AdminTenantDto("9", "Auto Prestige", "free", "active", 4, 5, 1, 1, 0, LocalDateTime.of(2026, 3, 1, 0, 0), "contact@autoprestige.ci", null, "enterprise", "realm-auto-009", "tenant-auto-009", null, null, null),
        new AdminTenantDto("10", "Groupe CIE", "enterprise", "active", 1230, Integer.MAX_VALUE, 45, Integer.MAX_VALUE, 0, LocalDateTime.of(2025, 9, 1, 0, 0), "admin@cie.ci", null, "enterprise", "realm-cie-010", "tenant-cie-010", "SubCA-CIE", "Sur mesure", "Virement")
    );

    public PagedResponse<AdminTenantDto> getTenants(int page, int size, String status, String search) {
        var filtered = mockTenants.stream()
            .filter(t -> status == null || status.isEmpty() || t.status().equals(status))
            .filter(t -> search == null || search.isEmpty() || t.name().toLowerCase().contains(search.toLowerCase()))
            .toList();
        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        var items = start < filtered.size() ? filtered.subList(start, end) : List.<AdminTenantDto>of();
        return new PagedResponse<>(items, filtered.size(), page, size);
    }

    public AdminTenantDto getTenant(String id) {
        return mockTenants.stream().filter(t -> t.id().equals(id)).findFirst().orElse(null);
    }

    public AdminTenantDto createTenant(AdminTenantCreateRequest request) {
        return new AdminTenantDto("new-" + System.currentTimeMillis(), request.name(), request.plan(), "active",
            0, request.plan().equals("free") ? 5 : request.plan().equals("pro") ? 30 : 150,
            0, request.plan().equals("free") ? 1 : request.plan().equals("pro") ? 3 : 10,
            0, LocalDateTime.now(), request.email(), null, request.type(), null, null, null, null, null);
    }

    public void suspendTenant(String id) { /* TODO: real impl */ }
    public void activateTenant(String id) { /* TODO: real impl */ }
    public void deleteTenant(String id) { /* TODO: real impl */ }

    public List<AdminTenantUserDto> getTenantUsers(String tenantId) {
        return List.of(
            new AdminTenantUserDto("u1", "Diallo Ibrahim", "Admin", "Aujourd'hui"),
            new AdminTenantUserDto("u2", "Koffi Jean", "Manager", "Hier"),
            new AdminTenantUserDto("u3", "Traoré Fatou", "Membre", "3j"),
            new AdminTenantUserDto("u4", "Yao Marc", "Membre", "5j")
        );
    }

    public AdminDashboardDto getTenantStats(String tenantId) {
        return new AdminDashboardDto(0, 0, 234, 0, 412, 22.0, 248000, 0, 0);
    }

    public void resetUserMfa(String tenantId, String userId) { /* TODO: real impl via Keycloak admin API */ }

    // Monitoring
    public InfraMetricsDto getInfraMetrics() {
        Runtime rt = Runtime.getRuntime();
        double usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024.0 * 1024.0);
        double totalMb = rt.maxMemory() / (1024.0 * 1024.0);
        return new InfraMetricsDto(34.0, Math.round(usedMb / 1024.0 * 10) / 10.0, Math.round(totalMb / 1024.0 * 10) / 10.0, 124.0, 500.0, 847, 230);
    }

    public List<QuotaTenantDto> getQuotaTenants() {
        return mockTenants.stream()
            .filter(t -> t.envelopesMax() > 0 && t.envelopesMax() < Integer.MAX_VALUE)
            .filter(t -> (t.envelopesUsed() * 100 / t.envelopesMax()) >= 80)
            .map(t -> new QuotaTenantDto(t.id(), t.name(), t.plan(), t.envelopesUsed(), t.envelopesMax(), t.envelopesUsed() * 100 / t.envelopesMax()))
            .sorted((a, b) -> b.percent() - a.percent())
            .toList();
    }

    public ActivityCountersDto getActivityCounters() {
        return new ActivityCountersDto(47, 132, 89, 215, 12, 3);
    }

    // Metrics
    public GlobalMetricsDto getGlobalMetrics(String period) {
        return new GlobalMetricsDto(4200000, 15.2, 38, 24.0, 291, 8.7, 2.1, -0.4);
    }

    public List<PlanDistributionDto> getPlanDistribution() {
        return List.of(
            new PlanDistributionDto("Free", 124, 36.0),
            new PlanDistributionDto("Professionnel", 156, 46.0),
            new PlanDistributionDto("Business", 54, 16.0),
            new PlanDistributionDto("Enterprise", 8, 2.0)
        );
    }

    public List<TopTenantDto> getTopTenants() {
        return List.of(
            new TopTenantDto("Groupe CIE", "1 230 env", "Sur mesure"),
            new TopTenantDto("Groupe SIFCA", "234 env", "24 900"),
            new TopTenantDto("DevConsult CI", "89 env", "24 900"),
            new TopTenantDto("SIB Technologies", "28 env", "4 900"),
            new TopTenantDto("BTP+ SARL", "29 env", "4 900")
        );
    }

    public List<RevenueByPaymentDto> getRevenueBreakdown() {
        return List.of(
            new RevenueByPaymentDto("Orange Money", 48, "2.02M", "#FF6600"),
            new RevenueByPaymentDto("Carte bancaire", 28, "1.18M", "#0891B2"),
            new RevenueByPaymentDto("MTN MoMo", 16, "672K", "#FFCC00"),
            new RevenueByPaymentDto("Wave / Moov / Virement", 8, "336K", "#16A34A")
        );
    }

    // PKI
    public List<CertificateDto> getCertificates(int page, int size) {
        var certs = List.of(
            new CertificateDto("c1", "Diallo Ibrahim (SIFCA)", "AES End Entity", "SubCA-SIFCA", "14 Avr 2026", "14 Avr 2028", "active"),
            new CertificateDto("c2", "Koffi Jean (SIFCA)", "AES End Entity", "SubCA-SIFCA", "12 Avr 2026", "12 Avr 2028", "active"),
            new CertificateDto("c3", "TSA Token #47", "Horodatage", "Root CA", "10 Avr 2026", "10 Avr 2031", "active"),
            new CertificateDto("c4", "Traoré Fatou (DevConsult)", "AES End Entity", "SubCA-DevConsult", "8 Avr 2026", "8 Avr 2028", "active"),
            new CertificateDto("c5", "Ancien cert Kouassi", "AES End Entity", "SubCA-Shared", "Jan 2025", "Jan 2027", "revoked")
        );
        return certs;
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

    // Config
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
}
