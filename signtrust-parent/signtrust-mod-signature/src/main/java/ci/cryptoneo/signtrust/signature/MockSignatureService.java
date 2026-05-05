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
 * Simulates digital signing by logging metadata and stamps
 * the visual signature image on the PDF using PDFBox.
 */
@ApplicationScoped
@IfBuildProperty(name = "signtrust.signing.mode", stringValue = "mock", enableIfMissing = true)
public class MockSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(MockSignatureService.class);

    @Inject
    VisualStampService visualStampService;

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location) {
        LOG.infof("Mock signing PDF (%d bytes) for name=%s, email=%s, location=%s",
                pdfContent.length, signerName, signerEmail, location);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LOG.infof("Mock signature: Signed by %s (%s) at %s", signerName, signerEmail, timestamp);
        return pdfContent;
    }

    @Override
    public byte[] stampSignatureImage(byte[] pdfContent, byte[] signatureImage,
                                       int pageNumber, double xPct, double yPct,
                                       double widthPct, double heightPct, String signerName) {
        return visualStampService.stamp(pdfContent, signatureImage, pageNumber, xPct, yPct, widthPct, heightPct, signerName);
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        LOG.info("Mock signature validation - returning true");
        return true;
    }
}
