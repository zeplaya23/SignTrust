package ci.cryptoneo.signtrust.storage;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "signtrust.storage")
public interface StorageConfig {

    String endpoint();

    String accessKey();

    String secretKey();

    @WithDefault("signtrust-")
    String bucketPrefix();
}
