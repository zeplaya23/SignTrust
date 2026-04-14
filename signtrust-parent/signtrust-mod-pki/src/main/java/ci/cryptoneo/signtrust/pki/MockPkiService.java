package ci.cryptoneo.signtrust.pki;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock implementation of PkiService.
 * Returns a dummy self-signed certificate. Real EJBCA integration will replace this in Phase 5.
 */
@ApplicationScoped
public class MockPkiService implements PkiService {

    private static final Logger LOG = Logger.getLogger(MockPkiService.class);

    // In-memory store for mock certificates
    private final Map<String, byte[]> certificates = new ConcurrentHashMap<>();
    private int serialCounter = 1;

    @Override
    public byte[] issueCertificate(String commonName, String tenantId) {
        LOG.infof("Mock PKI: Issuing certificate for CN=%s, tenant=%s", commonName, tenantId);
        try {
            // Generate a simple self-signed certificate
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048, new SecureRandom());
            KeyPair keyPair = keyGen.generateKeyPair();

            // For mock purposes, we store the public key bytes as the "certificate"
            byte[] certBytes = keyPair.getPublic().getEncoded();
            String serial = String.valueOf(serialCounter++);
            certificates.put(serial, certBytes);

            LOG.infof("Mock PKI: Certificate issued with serial=%s for CN=%s", serial, commonName);
            return certBytes;
        } catch (Exception e) {
            LOG.errorf(e, "Mock PKI: Failed to generate certificate for CN=%s", commonName);
            throw new RuntimeException("Failed to issue mock certificate", e);
        }
    }

    @Override
    public void revokeCertificate(String serialNumber, int reason) {
        LOG.infof("Mock PKI: Revoking certificate serial=%s, reason=%d", serialNumber, reason);
        certificates.remove(serialNumber);
    }

    @Override
    public byte[] getCertificate(String serialNumber) {
        LOG.infof("Mock PKI: Getting certificate serial=%s", serialNumber);
        return certificates.get(serialNumber);
    }
}
