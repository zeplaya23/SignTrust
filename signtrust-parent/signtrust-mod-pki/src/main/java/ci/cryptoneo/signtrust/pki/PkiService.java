package ci.cryptoneo.signtrust.pki;

public interface PkiService {
    byte[] issueCertificate(String commonName, String tenantId);
    void revokeCertificate(String serialNumber, int reason);
    byte[] getCertificate(String serialNumber);
}
