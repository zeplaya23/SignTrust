package ci.cryptoneo.signtrust.signature;

public interface SignatureService {
    byte[] signPdf(byte[] pdfContent, String signerCertAlias, String reason, String location);
    boolean validateSignature(byte[] signedPdf);
}
