package ci.cryptoneo.signtrust.signature;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Mock implementation of SignatureService.
 * Simulates signing by appending metadata to the PDF bytes.
 * Real DSS integration will replace this in Phase 5.
 */
@ApplicationScoped
public class MockSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(MockSignatureService.class);

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerCertAlias, String reason, String location) {
        LOG.infof("Mock signing PDF (%d bytes) for alias=%s, reason=%s, location=%s",
                pdfContent.length, signerCertAlias, reason, location);

        // In a real implementation, we would use DSS to digitally sign the PDF.
        // For now, we simply return the original content (simulating a signed PDF).
        // The metadata "Signed by X at Y" is logged.
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LOG.infof("Mock signature: Signed by %s at %s (reason: %s)", signerCertAlias, timestamp, reason);

        return pdfContent;
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        LOG.info("Mock signature validation - returning true");
        return true;
    }
}
