package com.yldlxj.pv.inspect.storage;

import com.aliyun.oss.OSS;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final OSS ossClient;

    @Value("${aliyun.oss.bucket}")
    private String bucket;

    @Value("${aliyun.oss.endpoint}")
    private String endpoint;

    @PostConstruct
    public void initBucket() {
        try {
            if (!ossClient.doesBucketExist(bucket)) {
                ossClient.createBucket(bucket);
            }
        } catch (Exception e) {
            log.warn("OSS bucket init failed: {}", e.getMessage());
        }
    }

    public String upload(String objectName, InputStream stream, long size, String contentType) {
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

    public OSSObject getObject(String objectName) {
        return ossClient.getObject(bucket, objectName);
    }

    public InputStream download(String objectName) {
        return ossClient.getObject(bucket, objectName).getObjectContent();
    }

    public void delete(String objectName) {
        try {
            ossClient.deleteObject(bucket, objectName);
        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage());
        }
    }

    public String getPresignedUrl(String objectName, int expiryMinutes) {
        if (objectName == null || objectName.isEmpty()) return objectName;
        if (objectName.startsWith("http")) return objectName;

        try {
            Date expiration = new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L);
            URL url = ossClient.generatePresignedUrl(bucket, objectName, expiration);
            return url.toString();
        } catch (Exception e) {
            throw new RuntimeException("获取文件URL失败: " + e.getMessage(), e);
        }
    }

    public String getDownloadPresignedUrl(String objectName, String fileName, int expiryMinutes) {
        if (objectName == null || objectName.isEmpty()) return objectName;

        try {
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucket, objectName, HttpMethod.GET);
            request.setExpiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L));
            ResponseHeaderOverrides overrides = new ResponseHeaderOverrides();
            overrides.setContentDisposition("attachment; filename=\"" + fileName + "\"");
            request.setResponseHeaders(overrides);
            return ossClient.generatePresignedUrl(request).toString();
        } catch (Exception e) {
            throw new RuntimeException("获取下载URL失败: " + e.getMessage(), e);
        }
    }

    public String getImageUrl(String objectKey, int expiryMinutes, String style) {
        if (objectKey == null || objectKey.isEmpty()) return objectKey;
        if (objectKey.startsWith("http")) return objectKey;

        GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucket, objectKey, HttpMethod.GET);
        request.setExpiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L));

        if (style != null && !style.isBlank()) {
            request.setProcess("style/" + style);
        }

        ResponseHeaderOverrides overrides = new ResponseHeaderOverrides();
        overrides.setContentDisposition("inline");
        request.setResponseHeaders(overrides);

        return ossClient.generatePresignedUrl(request).toString();
    }

    /**
     * 生成带 OSS 水印处理参数的图片 URL。
     * 自动附加上传时间，水印叠加在图片左下角。
     *
     * @param objectKey     OSS 对象 key
     * @param expiryMinutes URL 有效期（分钟）
     * @param watermarks    水印文字列表（不含时间，时间自动追加）
     * @return 带水印处理参数的 presigned URL
     */
    public String getWatermarkedImageUrl(String objectKey, int expiryMinutes, List<String> watermarks) {
        if (objectKey == null || objectKey.isEmpty()) return objectKey;
        if (objectKey.startsWith("http")) return objectKey;

        GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucket, objectKey, HttpMethod.GET);
        request.setExpiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L));

        StringBuilder process = new StringBuilder("image/resize,w_1600/quality,q_90/format,jpg");

        int total = watermarks.size();
        for (int i = 0; i < total; i++) {
            String text = watermarks.get(i);
            if (text == null || text.isBlank()) continue;

            String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(text.getBytes(StandardCharsets.UTF_8));

            process.append("/watermark")
                    .append(",text_").append(encoded)
                    .append(",g_sw")
                    .append(",x_30,y_").append((total - i) * 30)
                    .append(",t_80,shadow_50,color_FFFFFF,size_20");
        }

        request.setProcess(process.toString());
        return ossClient.generatePresignedUrl(request).toString();
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
        Date expiration = new Date(System.currentTimeMillis() + (long) expiryMinutes * 60 * 1000);
        GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucket, objectKey, HttpMethod.PUT);
        request.setExpiration(expiration);
        request.setContentType(contentType);
        return ossClient.generatePresignedUrl(request).toString();
    }

    public String uploadFile(String objectName, Path filePath, String contentType) {
        try (InputStream is = Files.newInputStream(filePath)) {
            long size = Files.size(filePath);
            return upload(objectName, is, size, contentType);
        } catch (Exception e) {
            log.error("上传文件失败！{},{},{}", objectName, contentType, filePath, e);
            throw new RuntimeException("大文件上传失败: " + e.getMessage(), e);
        }
    }
}
