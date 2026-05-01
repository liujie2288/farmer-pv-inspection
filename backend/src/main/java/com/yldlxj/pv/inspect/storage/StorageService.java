package com.yldlxj.pv.inspect.storage;

import com.aliyun.oss.OSS;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.OSSObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;

@Slf4j
@Service
public class StorageService {

    @Autowired(required = false)
    private OSS ossClient;

    @Value("${aliyun.oss.bucket}")
    private String bucket;

    @Value("${aliyun.oss.endpoint}")
    private String endpoint;

    @PostConstruct
    public void initBucket() {
        if (ossClient == null) {
            log.info("OSS client not available, storage features disabled");
            return;
        }
        try {
            if (!ossClient.doesBucketExist(bucket)) {
                ossClient.createBucket(bucket);
            }
        } catch (Exception e) {
            log.warn("OSS bucket init failed: {}", e.getMessage());
        }
    }

    private void ensureClient() {
        if (ossClient == null) {
            throw new RuntimeException("OSS 未配置，文件操作不可用");
        }
    }

    public String upload(String objectName, InputStream stream, long size, String contentType) {
        ensureClient();
        try {
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentType(contentType);
            meta.setContentLength(size);
            ossClient.putObject(bucket, objectName, stream, meta);
            return getPresignedUrl(objectName, 60 * 24 * 7);
        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    public InputStream download(String objectName) {
        ensureClient();
        try {
            OSSObject obj = ossClient.getObject(bucket, objectName);
            return obj.getObjectContent();
        } catch (Exception e) {
            throw new RuntimeException("文件下载失败: " + e.getMessage(), e);
        }
    }

    public void delete(String objectName) {
        if (ossClient == null) return;
        try {
            ossClient.deleteObject(bucket, objectName);
        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage());
        }
    }

    public String getPresignedUrl(String objectName, int expiryMinutes) {
        ensureClient();
        try {
            Date expiration = new Date(System.currentTimeMillis() + (long) expiryMinutes * 60 * 1000);
            URL url = ossClient.generatePresignedUrl(bucket, objectName, expiration);
            return url.toString();
        } catch (Exception e) {
            throw new RuntimeException("获取文件URL失败: " + e.getMessage(), e);
        }
    }

    public String extractObjectKey(String presignedOrFullUrl) {
        try {
            URI uri = new URI(presignedOrFullUrl);
            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) {
                return null;
            }

            // Virtual-hosted style: bucket.oss-cn-xxx.aliyuncs.com/object/key
            if (uri.getHost() != null && uri.getHost().startsWith(bucket + ".")) {
                return path.startsWith("/") ? path.substring(1) : path;
            }

            // Path-style fallback: host/bucket/object/key
            String prefix = "/" + bucket + "/";
            if (path.startsWith(prefix)) {
                return path.substring(prefix.length());
            }

            return path.startsWith("/") ? path.substring(1) : path;
        } catch (Exception e) {
            return null;
        }
    }

    public String generateUploadUrl(String objectKey, String contentType, int expiryMinutes) {
        ensureClient();
        Date expiration = new Date(System.currentTimeMillis() + (long) expiryMinutes * 60 * 1000);
        GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucket, objectKey, HttpMethod.PUT);
        request.setExpiration(expiration);
        request.setContentType(contentType);
        return ossClient.generatePresignedUrl(request).toString();
    }

    public String getObjectUrl(String objectKey) {
        return "https://" + bucket + "." + endpoint + "/" + objectKey;
    }

    public String uploadFile(String objectName, Path filePath, String contentType) {
        try (InputStream is = Files.newInputStream(filePath)) {
            long size = Files.size(filePath);
            return upload(objectName, is, size, contentType);
        } catch (Exception e) {
            throw new RuntimeException("大文件上传失败: " + e.getMessage(), e);
        }
    }
}
