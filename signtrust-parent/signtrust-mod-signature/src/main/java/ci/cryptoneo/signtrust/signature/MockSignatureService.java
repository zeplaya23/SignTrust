package ci.cryptoneo.signtrust.signature;

import jakarta.enterprise.context.ApplicationScoped;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.jboss.logging.Logger;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Mock implementation of SignatureService.
 * Simulates digital signing by logging metadata and stamps
 * the visual signature image on the PDF using PDFBox.
 */
@ApplicationScoped
public class MockSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(MockSignatureService.class);

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerCertAlias, String reason, String location) {
        LOG.infof("Mock signing PDF (%d bytes) for alias=%s, reason=%s, location=%s",
                pdfContent.length, signerCertAlias, reason, location);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LOG.infof("Mock signature: Signed by %s at %s (reason: %s)", signerCertAlias, timestamp, reason);
        return pdfContent;
    }

    @Override
    public byte[] stampSignatureImage(byte[] pdfContent, byte[] signatureImage,
                                       int pageNumber, double xPct, double yPct,
                                       double widthPct, double heightPct, String signerName) {
        try (PDDocument doc = Loader.loadPDF(pdfContent)) {
            int pageIdx = pageNumber - 1;
            if (pageIdx < 0 || pageIdx >= doc.getNumberOfPages()) {
                LOG.warnf("Page %d out of range (total %d), skipping stamp", pageNumber, doc.getNumberOfPages());
                return pdfContent;
            }

            PDPage page = doc.getPage(pageIdx);
            PDRectangle mediaBox = page.getMediaBox();
            float pageWidth = mediaBox.getWidth();
            float pageHeight = mediaBox.getHeight();

            // Convert percentage coordinates to PDF points (origin = bottom-left)
            float x = (float) (xPct / 100.0 * pageWidth);
            float w = (float) (widthPct / 100.0 * pageWidth);
            float h = (float) (heightPct / 100.0 * pageHeight);
            // PDF Y origin is bottom-left, frontend Y origin is top-left
            float y = pageHeight - (float) (yPct / 100.0 * pageHeight) - h;

            PDImageXObject image = PDImageXObject.createFromByteArray(doc, signatureImage, "signature.png");

            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                cs.drawImage(image, x, y, w, h);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            LOG.infof("Stamped signature on page %d at (%.1f%%, %.1f%%) size (%.1f%% x %.1f%%) for %s",
                    pageNumber, xPct, yPct, widthPct, heightPct, signerName);
            return baos.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to stamp signature image on PDF");
            return pdfContent;
        }
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        LOG.info("Mock signature validation - returning true");
        return true;
    }
}
