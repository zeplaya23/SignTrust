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
     * Trims transparent/white space around a signature image, then fits it
     * into a canvas matching the field's aspect ratio (contain mode, centered).
     * This ensures no distortion when PDFBox stretches the image to fill the field.
     *
     * @param imageBytes     PNG bytes of the drawn signature
     * @param fieldWidth     field width in any unit (only ratio matters)
     * @param fieldHeight    field height in any unit (only ratio matters)
     * @return PNG bytes of the fitted image
     */
    public static byte[] trimAndFitImage(byte[] imageBytes, double fieldWidth, double fieldHeight) {
        if (imageBytes == null || imageBytes.length == 0) return imageBytes;
        if (fieldWidth <= 0 || fieldHeight <= 0) return imageBytes;

        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (img == null) return imageBytes;

            int width = img.getWidth();
            int height = img.getHeight();
            boolean hasAlpha = img.getColorModel().hasAlpha();

            // Step 1: Find bounding box of non-empty pixels
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

            int cropW = maxX - minX + 1;
            int cropH = maxY - minY + 1;

            BufferedImage cropped = img.getSubimage(minX, minY, cropW, cropH);

            // Step 2: Create canvas with field's aspect ratio and fit the signature inside (contain)
            double fieldAspect = fieldWidth / fieldHeight;
            // Use a reasonable canvas size (e.g. 600px wide max)
            int canvasW = 600;
            int canvasH = (int) Math.round(canvasW / fieldAspect);
            if (canvasH < 100) { canvasH = 100; canvasW = (int) Math.round(canvasH * fieldAspect); }

            // Add margin inside the canvas (10%)
            int marginX = canvasW / 10;
            int marginY = canvasH / 10;
            int availW = canvasW - 2 * marginX;
            int availH = canvasH - 2 * marginY;

            // Scale signature to fit within available area, preserving aspect ratio
            double sigAspect = (double) cropW / cropH;
            int drawW, drawH;
            if (sigAspect > (double) availW / availH) {
                // Signature is wider than available — fit by width
                drawW = availW;
                drawH = (int) Math.round(availW / sigAspect);
            } else {
                // Signature is taller — fit by height
                drawH = availH;
                drawW = (int) Math.round(availH * sigAspect);
            }

            // Center in canvas
            int drawX = marginX + (availW - drawW) / 2;
            int drawY = marginY + (availH - drawH) / 2;

            BufferedImage canvas = new BufferedImage(canvasW, canvasH, BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D g2d = canvas.createGraphics();
            g2d.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2d.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.drawImage(cropped, drawX, drawY, drawW, drawH, null);
            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(canvas, "PNG", baos);

            LOG.infof("Signature image: trimmed %dx%d → %dx%d, fitted into %dx%d canvas",
                    width, height, cropW, cropH, canvasW, canvasH);
            return baos.toByteArray();

        } catch (Exception e) {
            LOG.warnf("Failed to process signature image: %s", e.getMessage());
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
