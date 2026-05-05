package ci.cryptoneo.signtrust.signature;

import jakarta.enterprise.context.ApplicationScoped;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.jboss.logging.Logger;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * Stamps a visual signature image on a PDF page using PDFBox.
 * Shared by both MockSignatureService and ApplicationSignatureService.
 */
@ApplicationScoped
public class VisualStampService {

    private static final Logger LOG = Logger.getLogger(VisualStampService.class);

    /**
     * Trims transparent/white space around a signature PNG image.
     * Returns cropped PNG bytes with a small padding around the actual content.
     */
    public static byte[] trimImage(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) return imageBytes;

        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (img == null) return imageBytes;

            int width = img.getWidth();
            int height = img.getHeight();
            boolean hasAlpha = img.getColorModel().hasAlpha();

            int minX = width, minY = height, maxX = 0, maxY = 0;

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int pixel = img.getRGB(x, y);
                    if (!isEmptyPixel(pixel, hasAlpha)) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // No content found — return original
            if (maxX < minX || maxY < minY) return imageBytes;

            // Add small padding (5px or 3% of dimension, whichever is smaller)
            int padX = Math.min(5, Math.max(1, width / 30));
            int padY = Math.min(5, Math.max(1, height / 30));
            minX = Math.max(0, minX - padX);
            minY = Math.max(0, minY - padY);
            maxX = Math.min(width - 1, maxX + padX);
            maxY = Math.min(height - 1, maxY + padY);

            int cropW = maxX - minX + 1;
            int cropH = maxY - minY + 1;

            // Skip trim if less than 10% would be removed
            if (cropW > width * 0.9 && cropH > height * 0.9) return imageBytes;

            BufferedImage cropped = img.getSubimage(minX, minY, cropW, cropH);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(cropped, "PNG", baos);

            LOG.infof("Trimmed signature image: %dx%d → %dx%d", width, height, cropW, cropH);
            return baos.toByteArray();

        } catch (Exception e) {
            LOG.warnf("Failed to trim signature image: %s", e.getMessage());
            return imageBytes;
        }
    }

    private static boolean isEmptyPixel(int argb, boolean hasAlpha) {
        if (hasAlpha) {
            int alpha = (argb >> 24) & 0xFF;
            return alpha < 10; // Nearly transparent
        }
        // No alpha — check if pixel is white or near-white
        int r = (argb >> 16) & 0xFF;
        int g = (argb >> 8) & 0xFF;
        int b = argb & 0xFF;
        return r > 245 && g > 245 && b > 245;
    }

    public byte[] stamp(byte[] pdfContent, byte[] signatureImage,
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

            float x = (float) (xPct / 100.0 * pageWidth);
            float w = (float) (widthPct / 100.0 * pageWidth);
            float h = (float) (heightPct / 100.0 * pageHeight);
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
}
