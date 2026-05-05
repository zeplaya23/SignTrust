package ci.cryptoneo.signtrust.signature;

public interface SignatureService {
    /**
     * Sign a PDF document with a visible signature field.
     *
     * @param pdfContent     PDF bytes to sign
     * @param signerName     Full name of the signer
     * @param signerEmail    Email of the signer
     * @param location       Signing location / app name
     * @param signatureImage PNG image bytes of the drawn signature (may be null)
     * @param pageNumber     1-based page number for the signature field
     * @param xPct           X position as percentage of page width (0-100)
     * @param yPct           Y position as percentage of page height (0-100)
     * @param widthPct       Width as percentage of page width (0-100)
     * @param heightPct      Height as percentage of page height (0-100)
     * @return signed PDF bytes
     */
    byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location,
                   byte[] signatureImage, int pageNumber, double xPct, double yPct,
                   double widthPct, double heightPct);

    boolean validateSignature(byte[] signedPdf);
}
