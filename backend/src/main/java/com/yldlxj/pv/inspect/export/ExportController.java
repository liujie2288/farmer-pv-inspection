package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.auth.AuthService;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;
    private final AuthService authService;
    private final StorageService storageService;

    @GetMapping("/pdf/{recordId}")
    public ResponseEntity<byte[]> previewPdf(@PathVariable Long recordId) {
        byte[] pdf = exportService.generateSinglePdf(recordId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=inspection-report.pdf")
                .body(pdf);
    }

    @PostMapping("/plan/{planId}")
    public ApiResponse<ExportTask> exportPlan(
            @PathVariable Long planId,
            @RequestParam(defaultValue = "0") int exportType) {
        Long operatorId = authService.getCurrentUserId();
        return ApiResponse.success(exportService.createExportTask(planId, operatorId, exportType));
    }

    @GetMapping("/plan/{planId}/tasks")
    public ApiResponse<List<ExportTask>> listExportTasks(@PathVariable Long planId) {
        return ApiResponse.success(exportService.listTasksByPlan(planId));
    }

    @GetMapping("/task/{taskId}")
    public ApiResponse<ExportTask> getTaskStatus(@PathVariable Long taskId) {
        return ApiResponse.success(exportService.getExportTaskStatus(taskId));
    }

    @GetMapping("/task/{taskId}/download")
    public ApiResponse<Map<String, String>> downloadExport(@PathVariable Long taskId) {
        ExportTask task = exportService.getExportTaskStatus(taskId);
        if (task == null || task.getStatus() != 1) {
            return ApiResponse.error(400, "导出任务不存在或未完成");
        }
        String objectKey = storageService.extractObjectKey(task.getFileUrl());
        if (objectKey == null) {
            return ApiResponse.error(500, "无法解析文件路径");
        }
        String freshUrl = storageService.getPresignedUrl(objectKey, 60 * 24); // 24 hours
        return ApiResponse.success(Map.of("url", freshUrl));
    }
}
