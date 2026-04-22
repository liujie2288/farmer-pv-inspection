package com.pv.inspection.config;

import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.annotation.PostConstruct;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import javax.imageio.ImageIO;

/**
 * Uploads placeholder test images to MinIO for export testing.
 * Only active in dev profile.
 */
@Slf4j
@Configuration
@Profile("dev")
public class DevDataInitializer {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public DevDataInitializer(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @PostConstruct
    public void uploadTestPhotos() {
        try {
            // List of object keys from V12 seed data
            List<String> keys = List.of(
                "inspection/section_1/f001_s1_1.jpg", "inspection/section_1/f001_s1_2.jpg",
                "inspection/section_3/f001_s3_1.jpg", "inspection/section_5/f001_s5_1.jpg",
                "inspection/section_1/f002_s1_1.jpg", "inspection/section_2/f002_s2_1.jpg",
                "inspection/section_2/f002_s2_2.jpg",
                "inspection/section_1/f003_s1_1.jpg", "inspection/section_4/f003_s4_1.jpg",
                "inspection/section_3/f004_s3_1.jpg", "inspection/section_3/f004_s3_2.jpg",
                "inspection/section_1/f005_s1_1.jpg", "inspection/section_6/f005_s6_1.jpg",
                "inspection/section_1/f006_s1_1.jpg", "inspection/section_2/f006_s2_1.jpg",
                "inspection/section_3/f006_s3_1.jpg",
                "inspection/section_1/f007_s1_1.jpg", "inspection/section_4/f007_s4_1.jpg",
                "inspection/section_4/f007_s4_2.jpg",
                "inspection/section_5/f008_s5_1.jpg",
                "inspection/section_2/f010_s2_1.jpg", "inspection/section_6/f010_s6_1.jpg",
                "inspection/section_1/f011_s1_1.jpg",
                "inspection/section_1/f012_s1_1.jpg", "inspection/section_1/f012_s1_2.jpg",
                "inspection/section_3/f012_s3_1.jpg",
                "inspection/section_3/f014_s3_1.jpg",
                "inspection/section_4/f015_s4_1.jpg",
                "inspection/section_1/f016_s1_1.jpg", "inspection/section_2/f016_s2_1.jpg",
                "inspection/section_4/f017_s4_1.jpg", "inspection/section_4/f017_s4_2.jpg",
                "inspection/section_5/f017_s5_1.jpg",
                "inspection/section_6/f019_s6_1.jpg",
                "inspection/section_1/f020_s1_1.jpg", "inspection/section_3/f020_s3_1.jpg",
                "inspection/section_2/f021_s2_1.jpg", "inspection/section_5/f021_s5_1.jpg",
                "inspection/section_1/f022_s1_1.jpg",
                "inspection/section_1/f024_s1_1.jpg", "inspection/section_1/f024_s1_2.jpg",
                "inspection/section_4/f024_s4_1.jpg",
                "inspection/section_3/f025_s3_1.jpg", "inspection/section_6/f025_s6_1.jpg"
            );

            for (String key : keys) {
                try {
                    minioClient.statObject(StatObjectArgs.builder()
                            .bucket(bucket).object(key).build());
                    // Object exists, skip
                } catch (Exception e) {
                    // Object doesn't exist, upload placeholder
                    byte[] img = createPlaceholderImage(key);
                    minioClient.putObject(PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .stream(new ByteArrayInputStream(img), img.length, -1)
                            .contentType("image/jpeg")
                            .build());
                    log.info("Uploaded test image: {}", key);
                }
            }
            log.info("Test photo initialization complete");
        } catch (Exception e) {
            log.warn("Test photo init skipped (MinIO not available): {}", e.getMessage());
        }
    }

    private byte[] createPlaceholderImage(String label) {
        try {
            BufferedImage img = new BufferedImage(640, 480, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setColor(new Color(200, 220, 240));
            g.fillRect(0, 0, 640, 480);
            g.setColor(Color.DARK_GRAY);
            g.drawString("PV Inspection Test Photo", 20, 30);
            g.drawString(label, 20, 60);
            g.drawString("Placeholder for export testing", 20, 90);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "jpg", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            // Fallback: tiny 1x1 JPEG
            return new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xD9};
        }
    }
}
