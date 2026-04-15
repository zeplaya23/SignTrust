package ci.cryptoneo.signtrust.signature;

public interface SignatureService {
    byte[] signPdf(byte[] pdfContent, String signerCertAlias, String reason, String location);

    /**
     * Stamp a visual signature image on a PDF at the given field position.
     *
     * @param pdfContent     original PDF bytes
     * @param signatureImage PNG image bytes of the signature
     * @param pageNumber     1-based page number
     * @param xPct           X position as percentage of page width (0-100)
     * @param yPct           Y position as percentage of page height (0-100)
     * @param widthPct       width as percentage of page width (0-100)
     * @param heightPct      height as percentage of page height (0-100)
     * @param signerName     name of the signer (for text label below signature)
     * @return modified PDF bytes with the signature image stamped
     */
    byte[] stampSignatureImage(byte[] pdfContent, byte[] signatureImage,
                               int pageNumber, double xPct, double yPct,
                               double widthPct, double heightPct, String signerName);

    boolean validateSignature(byte[] signedPdf);
}
