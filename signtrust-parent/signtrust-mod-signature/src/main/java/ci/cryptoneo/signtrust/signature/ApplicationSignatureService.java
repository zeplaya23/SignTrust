package ci.cryptoneo.signtrust.signature;

import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Real signature implementation using the Augura Signing Service API.
 * Uses POST /api/sign (centralized PAdES_BASELINE_LT signing).
 * The visual stamp is still done locally via PDFBox before sending to Augura.
 */
@ApplicationScoped
@IfBuildProperty(name = "signtrust.signing.mode", stringValue = "augura")
public class ApplicationSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(ApplicationSignatureService.class);

    @ConfigProperty(name = "signtrust.signing.url", defaultValue = "https://127.0.0.1")
    String signingBaseUrl;

    @ConfigProperty(name = "signtrust.signing.username", defaultValue = "signtrust")
    String signingUsername;

    @ConfigProperty(name = "signtrust.signing.password", defaultValue = "changeme")
    String signingPassword;

    @ConfigProperty(name = "signtrust.signing.organization", defaultValue = "Cryptoneo")
    String signingOrganization;

    @ConfigProperty(name = "signtrust.signing.country", defaultValue = "CI")
    String signingCountry;

    @Inject
    VisualStampService visualStampService;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            // Accept self-signed certs (dev/internal)
            .sslContext(createTrustAllSslContext())
            .build();

    // Cached JWT token
    private volatile String accessToken;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location) {
        try {
            String token = getAccessToken();
            String pdfBase64 = Base64.getEncoder().encodeToString(pdfContent);

            // Build sign request
            ObjectNode body = mapper.createObjectNode();
            body.put("signer_name", signerName);
            body.put("signer_email", signerEmail);
            body.put("signer_organization", signingOrganization);
            body.put("signer_country", signingCountry);
            body.put("document", pdfBase64);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + "/api/sign"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + token)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401) {
                // Token expired, retry once
                LOG.info("Token expired during sign, re-authenticating...");
                accessToken = null;
                token = getAccessToken();
                request = HttpRequest.newBuilder()
                        .uri(URI.create(signingBaseUrl + "/api/sign"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + token)
                        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                        .timeout(Duration.ofSeconds(60))
                        .build();
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            }

            if (response.statusCode() != 200) {
                LOG.errorf("Augura sign API returned %d: %s", response.statusCode(), response.body());
                throw new RuntimeException("Signing failed with status " + response.statusCode());
            }

            JsonNode resp = mapper.readTree(response.body());

            if (resp.has("success") && !resp.get("success").asBoolean()) {
                String msg = resp.has("message") ? resp.get("message").asText() : "Unknown error";
                throw new RuntimeException("Signing failed: " + msg);
            }

            // Download the signed PDF
            String downloadUrl = resp.get("download_url").asText();
            String documentId = resp.has("document_id") ? resp.get("document_id").asText() : null;

            LOG.infof("Document signed successfully: id=%s, signer_dn=%s, level=%s, date=%s",
                    documentId,
                    resp.has("signer_dn") ? resp.get("signer_dn").asText() : "N/A",
                    resp.has("signature_level") ? resp.get("signature_level").asText() : "N/A",
                    resp.has("signing_date") ? resp.get("signing_date").asText() : "N/A");

            byte[] signedPdf = downloadSignedPdf(downloadUrl);

            // Cleanup: delete from Augura store (optional, it auto-expires in ~30min)
            if (documentId != null) {
                deleteFromStore(documentId, token);
            }

            return signedPdf;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to sign PDF via Augura API");
            throw new RuntimeException("Digital signature failed: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] stampSignatureImage(byte[] pdfContent, byte[] signatureImage,
                                       int pageNumber, double xPct, double yPct,
                                       double widthPct, double heightPct, String signerName) {
        return visualStampService.stamp(pdfContent, signatureImage, pageNumber, xPct, yPct, widthPct, heightPct, signerName);
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        try {
            String token = getAccessToken();
            String pdfBase64 = Base64.getEncoder().encodeToString(signedPdf);

            ObjectNode body = mapper.createObjectNode();
            body.put("document", pdfBase64);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + "/api/validate"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + token)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                LOG.warnf("Augura validate API returned %d: %s", response.statusCode(), response.body());
                return false;
            }

            JsonNode resp = mapper.readTree(response.body());
            LOG.infof("Signature validation result: %s", response.body());
            return resp.has("valid") && resp.get("valid").asBoolean();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to validate signature via Augura API");
            return false;
        }
    }

    // --- Internal helpers ---

    private synchronized String getAccessToken() {
        if (accessToken != null && Instant.now().isBefore(tokenExpiry)) {
            return accessToken;
        }

        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("username", signingUsername);
            body.put("password", signingPassword);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + "/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Auth failed with status " + response.statusCode() + ": " + response.body());
            }

            JsonNode resp = mapper.readTree(response.body());
            accessToken = resp.get("access_token").asText();
            int expiresIn = resp.has("expires_in") ? resp.get("expires_in").asInt() : 300;
            // Renew 30s before actual expiry
            tokenExpiry = Instant.now().plusSeconds(expiresIn - 30);

            LOG.infof("Authenticated with Augura Signing Service (token expires in %ds)", expiresIn);
            return accessToken;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to authenticate with Augura Signing Service at %s", signingBaseUrl);
            throw new RuntimeException("Signing service authentication failed: " + e.getMessage(), e);
        }
    }

    /**
     * Download the signed PDF from the public download URL.
     */
    private byte[] downloadSignedPdf(String downloadUrl) throws Exception {
        // If relative URL, prepend base
        if (downloadUrl.startsWith("/")) {
            downloadUrl = signingBaseUrl + downloadUrl;
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(downloadUrl))
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to download signed PDF: HTTP " + response.statusCode());
        }

        LOG.infof("Downloaded signed PDF (%d bytes) from %s", response.body().length, downloadUrl);
        return response.body();
    }

    /**
     * Delete the signed document from Augura store (cleanup).
     */
    private void deleteFromStore(String documentId, String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + "/api/documents/" + documentId))
                    .header("Authorization", "Bearer " + token)
                    .DELETE()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            LOG.debugf("Could not delete document %s from Augura store: %s", documentId, e.getMessage());
        }
    }

    /**
     * Creates an SSLContext that trusts all certificates (for internal/dev self-signed certs).
     */
    private static javax.net.ssl.SSLContext createTrustAllSslContext() {
        try {
            javax.net.ssl.SSLContext sslContext = javax.net.ssl.SSLContext.getInstance("TLS");
            sslContext.init(null, new javax.net.ssl.TrustManager[]{
                    new javax.net.ssl.X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                        public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                        public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                    }
            }, new java.security.SecureRandom());
            return sslContext;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create trust-all SSL context", e);
        }
    }
}
