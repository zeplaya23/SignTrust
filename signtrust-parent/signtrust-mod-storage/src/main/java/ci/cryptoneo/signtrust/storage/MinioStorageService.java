package ci.cryptoneo.signtrust.storage;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;

@ApplicationScoped
public class MinioStorageService implements StorageService {

    private static final Logger LOG = Logger.getLogger(MinioStorageService.class);

    @Inject
    StorageConfig config;

    private S3Client s3Client;

    @PostConstruct
    void init() {
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(config.endpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(config.accessKey(), config.secretKey())))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
        LOG.infof("MinIO storage initialized at %s", config.endpoint());
    }

    @Override
    public void upload(String bucket, String key, byte[] data, String contentType) {
        String fullBucket = config.bucketPrefix() + bucket;
        ensureBucketExists(fullBucket);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(fullBucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(data));
        LOG.debugf("Uploaded %s/%s (%d bytes)", fullBucket, key, data.length);
    }

    @Override
    public byte[] download(String bucket, String key) {
        String fullBucket = config.bucketPrefix() + bucket;
        try {
            return s3Client.getObjectAsBytes(
                    GetObjectRequest.builder()
                            .bucket(fullBucket)
                            .key(key)
                            .build()).asByteArray();
        } catch (NoSuchKeyException e) {
            LOG.warnf("Object not found: %s/%s", fullBucket, key);
            return null;
        }
    }

    @Override
    public void delete(String bucket, String key) {
        String fullBucket = config.bucketPrefix() + bucket;
        s3Client.deleteObject(
                DeleteObjectRequest.builder()
                        .bucket(fullBucket)
                        .key(key)
                        .build());
        LOG.debugf("Deleted %s/%s", fullBucket, key);
    }

    @Override
    public void createBucket(String bucket) {
        String fullBucket = config.bucketPrefix() + bucket;
        ensureBucketExists(fullBucket);
    }

    private void ensureBucketExists(String bucket) {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            LOG.infof("Created bucket: %s", bucket);
        }
    }
}
