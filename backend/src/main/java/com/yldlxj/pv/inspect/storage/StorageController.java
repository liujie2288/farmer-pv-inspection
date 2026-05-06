package com.yldlxj.pv.inspect.storage;

import com.yldlxj.pv.inspect.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;
    private static final DateTimeFormatter CERT_FORMATTER = DateTimeFormatter.ofPattern("'certificate'/yyyy");
    private static final DateTimeFormatter PHOTO_FORMATTER = DateTimeFormatter.ofPattern("'photo'/yyyy/MM/dd");

    private static final Map<String, String> TYPE_TO_FOLDER = Map.of(
            "certificate", "certificate",
            "photo", "photo"
    );

    @GetMapping("/upload-url")
    public ApiResponse<Map<String, String>> getUploadUrl(
            @RequestParam String filename,
            @RequestParam String contentType,
            @RequestParam(defaultValue = "photo") String type) {
        String folder = TYPE_TO_FOLDER.getOrDefault(type, "other");
        if ("certificate".equals(type)) {
            folder = CERT_FORMATTER.format(LocalDate.now());
        } else if ("photo".equals(type)) {
            folder = PHOTO_FORMATTER.format(LocalDate.now());
        }
        int dotIdx = filename.lastIndexOf('.');
        String ext = dotIdx >= 0 ? filename.substring(dotIdx) : "";
        String objectKey = folder + "/" + UUID.randomUUID() + ext;
        String uploadUrl = storageService.generateUploadUrl(objectKey, contentType, 15);
        return ApiResponse.success(Map.of("uploadUrl", uploadUrl, "objectKey", objectKey));
    }

    @GetMapping("/image-url")
    public ApiResponse<String> getImageUrl(@RequestParam String objectKey, @RequestParam String style) {
        if (objectKey == null) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "object key is null");
        }
        if (objectKey.startsWith("http")) {
            objectKey = storageService.extractObjectKey(objectKey);
        }
        String url = storageService.getImageUrl(objectKey, 60, style == null ? "large" : style);
        return ApiResponse.success(url);
    }
}
