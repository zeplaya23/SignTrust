package ci.cryptoneo.signtrust.app;

import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Contact;
import org.eclipse.microprofile.openapi.annotations.info.Info;

@OpenAPIDefinition(
    info = @Info(
        title = "DigiSign Parapheur API",
        version = "1.0.0",
        description = "Parapheur Electronique Grand Public — Cryptoneo",
        contact = @Contact(name = "Cryptoneo", url = "https://cryptoneo.ci")
    )
)
public class SignTrustApplication extends Application {
}
