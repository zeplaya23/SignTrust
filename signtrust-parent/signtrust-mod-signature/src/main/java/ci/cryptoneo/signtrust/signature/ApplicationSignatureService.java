package ci.cryptoneo.signtrust.signature;

import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureOptions;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.visible.PDVisibleSigProperties;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.visible.PDVisibleSignDesigner;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Calendar;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Real PAdES signature using Augura Signing Service Remote API.
 *
 * Uses PDFBox's high-level PDVisibleSignDesigner/PDVisibleSigProperties API
 * to create a proper visible signature field with the drawn signature image
 * as appearance. The cryptographic CMS is obtained via remote signing (hash only).
 *
 * Flow:
 * 1. POST /api/remote/prepare → session_id
 * 2. PDVisibleSignDesigner builds visible signature field at correct position
 * 3. PDFBox computes byte range; SHA-256 hash sent to POST /api/remote/sign → CMS
 * 4. CMS embedded in the signature field
 * 5. POST /api/remote/extend → PAdES_BASELINE_LT
 */
@ApplicationScoped
@IfBuildProperty(name = "signtrust.signing.mode", stringValue = "augura")
public class ApplicationSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(ApplicationSignatureService.class);

    @ConfigProperty(name = "signtrust.signing.url", defaultValue = "http://trust-signing-service:3000")
    String signingBaseUrl;

    @ConfigProperty(name = "signtrust.signing.username", defaultValue = "admin")
    String signingUsername;

    @ConfigProperty(name = "signtrust.signing.password", defaultValue = "admin")
    String signingPassword;

    @ConfigProperty(name = "signtrust.signing.organization", defaultValue = "Cryptoneo")
    String signingOrganization;

    @ConfigProperty(name = "signtrust.signing.country", defaultValue = "CI")
    String signingCountry;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .sslContext(createTrustAllSslContext())
            .build();

    private volatile String accessToken;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location,
                          byte[] signatureImage, int pageNumber, double xPct, double yPct,
                          double widthPct, double heightPct) {
        try {
            String token = getAccessToken();

            // Phase 1: Prepare — get session ID from signing service
            ObjectNode prepareBody = mapper.createObjectNode();
            prepareBody.put("signer_name", signerName);
            prepareBody.put("signer_organization", signingOrganization);
            prepareBody.put("signer_country", signingCountry);

            JsonNode prepareResp = postJson(token, "/api/remote/prepare", prepareBody);
            String sessionId = prepareResp.get("session_id").asText();
            String signerDn = prepareResp.has("signer_dn") ? prepareResp.get("signer_dn").asText() : signerName;

            LOG.infof("Remote signing session prepared: session_id=%s, signer_dn=%s", sessionId, signerDn);

            // Phase 2: Create visible signature field + sign via remote hash
            ByteArrayOutputStream signedOutput = new ByteArrayOutputStream();

            try (PDDocument doc = Loader.loadPDF(pdfContent)) {
                int pageIdx = Math.max(0, Math.min(pageNumber - 1, doc.getNumberOfPages() - 1));
                PDPage page = doc.getPage(pageIdx);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                // Convert percentages to PDF points
                float xPts = (float) (xPct / 100.0 * pageWidth);
                float yPts = (float) (yPct / 100.0 * pageHeight);
                float wPts = (float) (widthPct / 100.0 * pageWidth);
                float hPts = (float) (heightPct / 100.0 * pageHeight);

                PDSignature signature = new PDSignature();
                signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
                signature.setSubFilter(PDSignature.SUBFILTER_ETSI_CADES_DETACHED);
                signature.setName(signerDn);
                signature.setReason("Signed by " + signerName);
                signature.setLocation(location);
                signature.setSignDate(Calendar.getInstance());

                try (SignatureOptions options = new SignatureOptions()) {
                    options.setPreferredSignatureSize(32768);
                    options.setPage(pageIdx);

                    if (signatureImage != null && signatureImage.length > 0) {
                        // Image is already drawn at the correct field proportions (no trim needed)
                        PDVisibleSignDesigner visibleDesigner = new PDVisibleSignDesigner(
                                doc, new ByteArrayInputStream(signatureImage), pageNumber);
                        visibleDesigner
                                .xAxis(xPts)
                                .yAxis(yPts)
                                .width(wPts)
                                .height(hPts)
                                .signatureFieldName("Sig_" + signerName.replaceAll("[^a-zA-Z0-9]", "_"));

                        PDVisibleSigProperties visibleProps = new PDVisibleSigProperties();
                        visibleProps
                                .signerName(signerDn)
                                .signerLocation(location)
                                .signatureReason("Signed by " + signerName)
                                .page(pageIdx)
                                .visualSignEnabled(true)
                                .setPdVisibleSignature(visibleDesigner);
                        visibleProps.buildSignature();

                        options.setVisualSignature(visibleProps);
                    }

                    RemoteSignatureInterface remoteSign = new RemoteSignatureInterface(sessionId, token);
                    doc.addSignature(signature, remoteSign, options);
                    doc.saveIncremental(signedOutput);
                }
            }

            byte[] signedPdf = signedOutput.toByteArray();

            // Phase 3: Extend to PAdES_BASELINE_LT (add validation data)
            signedPdf = extendToLT(signedPdf, token);

            LOG.infof("PDF signed with visible field at page %d (%.1f%%, %.1f%%) size (%.1f%%x%.1f%%) for %s",
                    pageNumber, xPct, yPct, widthPct, heightPct, signerName);
            return signedPdf;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to sign PDF via remote signing");
            throw new RuntimeException("Digital signature failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        try {
            String token = getAccessToken();
            String pdfBase64 = Base64.getEncoder().encodeToString(signedPdf);

            ObjectNode body = mapper.createObjectNode();
            body.put("document", pdfBase64);

            JsonNode resp = postJson(token, "/api/validate", body);
            LOG.infof("Signature validation result: %s", resp.toString());
            return resp.has("valid") && resp.get("valid").asBoolean();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to validate signature");
            return false;
        }
    }

    // --- Remote signing interface for PDFBox ---

    private class RemoteSignatureInterface implements SignatureInterface {
        private final String sessionId;
        private final String token;

        RemoteSignatureInterface(String sessionId, String token) {
            this.sessionId = sessionId;
            this.token = token;
        }

        @Override
        public byte[] sign(InputStream content) throws java.io.IOException {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = content.read(buffer)) != -1) {
                    digest.update(buffer, 0, bytesRead);
                }
                byte[] hash = digest.digest();
                String hashBase64 = Base64.getEncoder().encodeToString(hash);

                LOG.debugf("Computed SHA-256 hash for remote signing: %s", hashBase64);

                ObjectNode signBody = mapper.createObjectNode();
                signBody.put("session_id", sessionId);
                signBody.put("hash", hashBase64);

                JsonNode signResp = postJson(token, "/api/remote/sign", signBody);
                String cmsBase64 = signResp.get("cms_signature").asText();

                LOG.infof("Remote sign successful: certificate_serial=%s",
                        signResp.has("certificate_serial") ? signResp.get("certificate_serial").asText() : "N/A");

                return Base64.getDecoder().decode(cmsBase64);

            } catch (Exception e) {
                throw new java.io.IOException("Remote signing failed: " + e.getMessage(), e);
            }
        }
    }

    // --- Extend to LT ---

    private byte[] extendToLT(byte[] signedPdf, String token) {
        try {
            String pdfBase64 = Base64.getEncoder().encodeToString(signedPdf);

            ObjectNode body = mapper.createObjectNode();
            body.put("document", pdfBase64);

            JsonNode resp = postJson(token, "/api/remote/extend", body);

            if (resp.has("document")) {
                byte[] extended = Base64.getDecoder().decode(resp.get("document").asText());
                String level = resp.has("signature_level") ? resp.get("signature_level").asText() : "unknown";
                LOG.infof("PDF extended to %s (%d bytes)", level, extended.length);
                return extended;
            }

            LOG.warn("Extend response did not contain document, returning BASELINE_T PDF");
            return signedPdf;

        } catch (Exception e) {
            LOG.warnf("Failed to extend to LT (keeping BASELINE_T): %s", e.getMessage());
            return signedPdf;
        }
    }

    // --- HTTP helpers ---

    private JsonNode postJson(String token, String path, ObjectNode body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(signingBaseUrl + path))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401) {
            accessToken = null;
            String newToken = getAccessToken();
            request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + newToken)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(60))
                    .build();
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        }

        if (response.statusCode() != 200) {
            throw new RuntimeException("API " + path + " returned " + response.statusCode() + ": " + response.body());
        }

        return mapper.readTree(response.body());
    }

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
                throw new RuntimeException("Auth failed: " + response.statusCode() + " " + response.body());
            }

            JsonNode resp = mapper.readTree(response.body());
            accessToken = resp.get("access_token").asText();
            int expiresIn = resp.has("expires_in") ? resp.get("expires_in").asInt() : 300;
            tokenExpiry = Instant.now().plusSeconds(expiresIn - 30);

            LOG.infof("Authenticated with signing service (expires in %ds)", expiresIn);
            return accessToken;

        } catch (Exception e) {
            throw new RuntimeException("Signing service auth failed: " + e.getMessage(), e);
        }
    }

    private static javax.net.ssl.SSLContext createTrustAllSslContext() {
        try {
            javax.net.ssl.SSLContext ctx = javax.net.ssl.SSLContext.getInstance("TLS");
            ctx.init(null, new javax.net.ssl.TrustManager[]{
                    new javax.net.ssl.X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                        public void checkClientTrusted(java.security.cert.X509Certificate[] c, String t) {}
                        public void checkServerTrusted(java.security.cert.X509Certificate[] c, String t) {}
                    }
            }, new java.security.SecureRandom());
            return ctx;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create SSL context", e);
        }
    }
}
