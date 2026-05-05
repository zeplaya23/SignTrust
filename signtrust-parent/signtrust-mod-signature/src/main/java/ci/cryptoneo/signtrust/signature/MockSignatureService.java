package ci.cryptoneo.signtrust.signature;

import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Mock implementation of SignatureService.
 * Activated when signtrust.signing.mode=mock (default for dev).
 * Stamps the visual signature image on the PDF but does not apply real crypto.
 */
@ApplicationScoped
@IfBuildProperty(name = "signtrust.signing.mode", stringValue = "mock", enableIfMissing = true)
public class MockSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(MockSignatureService.class);

    @Inject
    VisualStampService visualStampService;

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location,
                          byte[] signatureImage, int pageNumber, double xPct, double yPct,
                          double widthPct, double heightPct) {
        LOG.infof("Mock signing PDF (%d bytes) for name=%s, email=%s, location=%s",
                pdfContent.length, signerName, signerEmail, location);

        // In mock mode, just stamp the visual image (no real crypto)
        if (signatureImage != null && signatureImage.length > 0) {
            pdfContent = visualStampService.stamp(pdfContent, signatureImage,
                    pageNumber, xPct, yPct, widthPct, heightPct, signerName);
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LOG.infof("Mock signature: Signed by %s (%s) at %s", signerName, signerEmail, timestamp);
        return pdfContent;
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        LOG.info("Mock signature validation - returning true");
        return true;
    }
}
