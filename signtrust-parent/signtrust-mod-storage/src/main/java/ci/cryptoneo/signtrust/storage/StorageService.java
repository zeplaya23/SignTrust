package ci.cryptoneo.signtrust.storage;

import java.io.InputStream;

public interface StorageService {
    void upload(String bucket, String key, byte[] data, String contentType);
    byte[] download(String bucket, String key);
    void delete(String bucket, String key);
    void createBucket(String bucket);
}
