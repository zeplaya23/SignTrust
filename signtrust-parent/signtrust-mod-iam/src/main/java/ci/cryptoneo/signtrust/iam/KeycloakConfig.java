package ci.cryptoneo.signtrust.iam;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "signtrust.keycloak")
public interface KeycloakConfig {

    String serverUrl();

    @WithDefault("master")
    String masterRealm();

    String adminUsername();

    String adminPassword();

    @WithDefault("signtrust-")
    String realmPrefix();
}
