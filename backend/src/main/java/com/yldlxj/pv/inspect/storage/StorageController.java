package com.yldlxj.pv.inspect.storage;

import com.yldlxj.pv.inspect.common.ApiResponse;
import lombok.RequiredArgsConstructor;
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

    private static final Map<String, String> TYPE_TO_FOLDER = Map.of(
            "certificate", "certificates",
            "photo", "photo"
    );

    @GetMapping("/upload-url")
    public ApiResponse<Map<String, String>> getUploadUrl(
            @RequestParam String filename,
            @RequestParam String contentType,
            @RequestParam(defaultValue = "photo") String type) {
        String folder = TYPE_TO_FOLDER.getOrDefault(type, "other");
        if ("photo".equals(type)) {
            folder = "photo/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        }
        int dotIdx = filename.lastIndexOf('.');
        String ext = dotIdx >= 0 ? filename.substring(dotIdx) : "";
        String objectKey = folder + "/" + UUID.randomUUID() + ext;
        String uploadUrl = storageService.generateUploadUrl(objectKey, contentType, 15);
        return ApiResponse.success(Map.of("uploadUrl", uploadUrl, "objectKey", objectKey));
    }

    @GetMapping("/presigned-url")
    public ApiResponse<String> getPresignedUrl(@RequestParam String objectKey) {
        String url = storageService.getPresignedUrl(objectKey, 60);
        return ApiResponse.success(url);
    }
}
