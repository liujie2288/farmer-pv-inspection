package com.pv.inspection.export;

import com.pv.inspection.auth.AuthService;
import com.pv.inspection.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;
    private final AuthService authService;

    @GetMapping("/pdf/{recordId}")
    public ResponseEntity<byte[]> previewPdf(@PathVariable Long recordId) {
        byte[] pdf = exportService.generateSinglePdf(recordId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=inspection-report.pdf")
                .body(pdf);
    }

    @PostMapping("/plan/{planId}")
    public ApiResponse<ExportTask> exportPlan(@PathVariable Long planId) {
        Long operatorId = authService.getCurrentUserId();
        return ApiResponse.success(exportService.createExportTask(planId, operatorId));
    }

    @GetMapping("/task/{taskId}")
    public ApiResponse<ExportTask> getTaskStatus(@PathVariable Long taskId) {
        return ApiResponse.success(exportService.getExportTaskStatus(taskId));
    }
}
