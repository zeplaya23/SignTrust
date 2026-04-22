package ci.cryptoneo.signtrust.app;

import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Contact;
import org.eclipse.microprofile.openapi.annotations.info.Info;

@OpenAPIDefinition(
    info = @Info(
        title = "DigiSign API",
        version = "1.0.0",
        description = "Plateforme de Signature Electronique Multi-tenant — Cryptoneo",
        contact = @Contact(name = "Cryptoneo", url = "https://cryptoneo.ci")
    )
)
public class SignTrustApplication extends Application {
}
