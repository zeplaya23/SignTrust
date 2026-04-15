package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.LoginRequest;
import ci.cryptoneo.signtrust.app.dto.LoginResponse;
import ci.cryptoneo.signtrust.app.dto.RegisterRequest;
import ci.cryptoneo.signtrust.app.entity.SubscriptionEntity;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@ApplicationScoped
public class AuthService {

    private static final Logger LOG = Logger.getLogger(AuthService.class);

    @Inject
    Keycloak keycloak;

    @Inject
    EntityManager em;

    @ConfigProperty(name = "signtrust.keycloak.server-url")
    String keycloakUrl;

    @Transactional
    public UserProfileEntity register(RegisterRequest req) {
        // Check if email already exists
        try {
            em.createQuery("SELECT u FROM UserProfileEntity u WHERE u.email = :email", UserProfileEntity.class)
                    .setParameter("email", req.email())
                    .getSingleResult();
            throw new WebApplicationException("Un compte existe déjà avec cet email", Response.Status.CONFLICT);
        } catch (NoResultException ignored) {
            // Good — email is available
        }

        // Create user in Keycloak signtrust realm
        String realmName = "signtrust";

        UserRepresentation kcUser = new UserRepresentation();
        kcUser.setUsername(req.email());
        kcUser.setEmail(req.email());
        kcUser.setFirstName(req.firstName());
        kcUser.setLastName(req.lastName());
        kcUser.setEnabled(true);
        kcUser.setEmailVerified(true);

        CredentialRepresentation cred = new CredentialRepresentation();
        cred.setType(CredentialRepresentation.PASSWORD);
        cred.setValue(req.password());
        cred.setTemporary(false);
        kcUser.setCredentials(Collections.singletonList(cred));

        String keycloakId;
        try (var response = keycloak.realm(realmName).users().create(kcUser)) {
            if (response.getStatus() == 409) {
                throw new WebApplicationException("Utilisateur déjà existant dans Keycloak", Response.Status.CONFLICT);
            }
            if (response.getStatus() >= 400) {
                throw new WebApplicationException("Erreur création Keycloak: " + response.getStatus(),
                        Response.Status.INTERNAL_SERVER_ERROR);
            }
            String location = response.getLocation().getPath();
            keycloakId = location.substring(location.lastIndexOf('/') + 1);
        }

        // Assign 'member' role
        try {
            RoleRepresentation memberRole = keycloak.realm(realmName)
                    .roles().get("member").toRepresentation();
            keycloak.realm(realmName).users().get(keycloakId)
                    .roles().realmLevel().add(Collections.singletonList(memberRole));
        } catch (Exception e) {
            LOG.warn("Could not assign member role: " + e.getMessage());
        }

        // Save user profile in DB
        UserProfileEntity profile = new UserProfileEntity();
        profile.setKeycloakId(keycloakId);
        profile.setTenantId("default");
        profile.setEmail(req.email());
        profile.setFirstName(req.firstName());
        profile.setLastName(req.lastName());
        profile.setPhone(req.phone());
        profile.setCompanyName(req.companyName());
        profile.setAccountType(req.accountType());
        em.persist(profile);

        return profile;
    }

    public LoginResponse login(LoginRequest req) {
        // Get token from Keycloak token endpoint
        String tokenUrl = keycloakUrl + "/realms/signtrust/protocol/openid-connect/token";

        String formBody = "grant_type=password"
                + "&client_id=signtrust-app"
                + "&username=" + URLEncoder.encode(req.email(), StandardCharsets.UTF_8)
                + "&password=" + URLEncoder.encode(req.password(), StandardCharsets.UTF_8);

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401 || response.statusCode() == 400) {
                throw new WebApplicationException("Email ou mot de passe incorrect", Response.Status.UNAUTHORIZED);
            }

            // Parse JSON manually (avoid jackson dependency in service)
            String body = response.body();
            String accessToken = extractJsonValue(body, "access_token");
            String refreshToken = extractJsonValue(body, "refresh_token");
            long expiresIn = Long.parseLong(extractJsonValue(body, "expires_in"));

            // Find user profile
            UserProfileEntity profile;
            try {
                profile = em.createQuery("SELECT u FROM UserProfileEntity u WHERE u.email = :email", UserProfileEntity.class)
                        .setParameter("email", req.email())
                        .getSingleResult();
            } catch (NoResultException e) {
                throw new WebApplicationException("Profil utilisateur introuvable", Response.Status.NOT_FOUND);
            }

            // Find subscription status
            String subscriptionStatus = "NONE";
            try {
                SubscriptionEntity sub = em.createQuery(
                        "SELECT s FROM SubscriptionEntity s WHERE s.userId = :userId ORDER BY s.createdAt DESC",
                        SubscriptionEntity.class)
                        .setParameter("userId", profile.getId())
                        .setMaxResults(1)
                        .getSingleResult();
                subscriptionStatus = sub.getStatus();
            } catch (NoResultException ignored) {}

            LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo(
                    profile.getKeycloakId(),
                    profile.getEmail(),
                    profile.getFirstName(),
                    profile.getLastName(),
                    profile.getPhone(),
                    "member",
                    profile.getTenantId(),
                    subscriptionStatus
            );

            return new LoginResponse(accessToken, refreshToken, expiresIn, userInfo);
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            LOG.error("Login error", e);
            throw new WebApplicationException("Erreur de connexion: " + e.getMessage(),
                    Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    public LoginResponse refresh(String refreshToken) {
        String tokenUrl = keycloakUrl + "/realms/signtrust/protocol/openid-connect/token";

        String formBody = "grant_type=refresh_token"
                + "&client_id=signtrust-app"
                + "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new WebApplicationException("Session expirée, veuillez vous reconnecter",
                        Response.Status.UNAUTHORIZED);
            }

            String body = response.body();
            String newAccessToken = extractJsonValue(body, "access_token");
            String newRefreshToken = extractJsonValue(body, "refresh_token");
            long expiresIn = Long.parseLong(extractJsonValue(body, "expires_in"));

            return new LoginResponse(newAccessToken, newRefreshToken, expiresIn, null);
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            LOG.error("Refresh token error", e);
            throw new WebApplicationException("Erreur de rafraîchissement du token",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) return "";
        int colonIndex = json.indexOf(':', keyIndex);
        int valueStart = colonIndex + 1;
        // Skip whitespace
        while (valueStart < json.length() && json.charAt(valueStart) == ' ') valueStart++;
        if (json.charAt(valueStart) == '"') {
            int valueEnd = json.indexOf('"', valueStart + 1);
            return json.substring(valueStart + 1, valueEnd);
        } else {
            int valueEnd = valueStart;
            while (valueEnd < json.length() && json.charAt(valueEnd) != ',' && json.charAt(valueEnd) != '}') valueEnd++;
            return json.substring(valueStart, valueEnd).trim();
        }
    }
}
