package ci.cryptoneo.signtrust.iam;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.Collections;
import java.util.List;

@ApplicationScoped
public class KeycloakAdminService {

    @Inject
    Keycloak keycloak;

    @Inject
    KeycloakConfig config;

    /**
     * Creates a new Keycloak realm for the given tenant.
     * The realm is named "{realmPrefix}{tenantId}" (e.g. "signtrust-acme").
     */
    public void createRealm(String tenantId) {
        String realmName = config.realmPrefix() + tenantId;

        RealmRepresentation realm = new RealmRepresentation();
        realm.setRealm(realmName);
        realm.setEnabled(true);
        realm.setDisplayName("diSign Parapheur — " + tenantId);

        // Login theme
        realm.setLoginTheme("keycloak");

        // OTP policy — enable TOTP
        realm.setOtpPolicyType("totp");
        realm.setOtpPolicyAlgorithm("HmacSHA1");
        realm.setOtpPolicyDigits(6);
        realm.setOtpPolicyPeriod(30);
        realm.setOtpPolicyInitialCounter(0);

        // Registration and email settings
        realm.setRegistrationAllowed(false);
        realm.setResetPasswordAllowed(true);
        realm.setVerifyEmail(true);
        realm.setLoginWithEmailAllowed(true);

        keycloak.realms().create(realm);
    }

    /**
     * Creates an OIDC client in the tenant realm.
     */
    public void createClient(String tenantId, String clientId, String redirectUri) {
        String realmName = config.realmPrefix() + tenantId;

        ClientRepresentation client = new ClientRepresentation();
        client.setClientId(clientId);
        client.setName(clientId);
        client.setEnabled(true);
        client.setProtocol("openid-connect");
        client.setPublicClient(false);
        client.setStandardFlowEnabled(true);
        client.setDirectAccessGrantsEnabled(false);
        client.setRedirectUris(List.of(redirectUri));
        client.setWebOrigins(List.of("+"));

        keycloak.realm(realmName).clients().create(client);
    }

    /**
     * Creates a user in the tenant realm with the given credentials.
     * The user's email is marked as verified.
     */
    public String createUser(String tenantId, String email, String firstName, String lastName, String password) {
        String realmName = config.realmPrefix() + tenantId;

        UserRepresentation user = new UserRepresentation();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);

        user.setCredentials(Collections.singletonList(credential));

        try (var response = keycloak.realm(realmName).users().create(user)) {
            // Extract user ID from the Location header
            String locationPath = response.getLocation().getPath();
            return locationPath.substring(locationPath.lastIndexOf('/') + 1);
        }
    }

    /**
     * Assigns a realm-level role to a user in the tenant realm.
     */
    public void assignRole(String tenantId, String userId, String roleName) {
        String realmName = config.realmPrefix() + tenantId;

        // Retrieve the role representation
        RoleRepresentation role = keycloak.realm(realmName)
                .roles()
                .get(roleName)
                .toRepresentation();

        // Assign the role to the user
        keycloak.realm(realmName)
                .users()
                .get(userId)
                .roles()
                .realmLevel()
                .add(Collections.singletonList(role));
    }
}
