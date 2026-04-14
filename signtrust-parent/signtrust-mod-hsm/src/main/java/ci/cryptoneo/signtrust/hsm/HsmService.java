package ci.cryptoneo.signtrust.hsm;

public interface HsmService {
    byte[] sign(byte[] data, String keyAlias);
    byte[] getPublicKey(String keyAlias);
    boolean keyExists(String keyAlias);
}
