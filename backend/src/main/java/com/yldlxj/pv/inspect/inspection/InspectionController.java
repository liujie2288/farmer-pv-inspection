package com.yldlxj.pv.inspect.inspection;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yldlxj.pv.inspect.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;
    private final ChecklistTemplateService checklistTemplateService;

    @GetMapping("/checklist-template")
    public ApiResponse<Map<String, Object>> getChecklistTemplate() {
        return ApiResponse.success(checklistTemplateService.getTemplate());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> submitRecord(@RequestBody Map<String, Object> body) {
        Long planId = Long.valueOf(body.get("planId").toString());
        Long stationId = Long.valueOf(body.get("stationId").toString());
        Long projectId = Long.valueOf(body.get("projectId").toString());
        @SuppressWarnings("unchecked")
        Map<String, Object> checklistResult = (Map<String, Object>) body.get("checklistResult");
        @SuppressWarnings("unchecked")
        Map<String, Object> photos = (Map<String, Object>) body.get("photos");
        BigDecimal longitude = body.get("longitude") != null ? new BigDecimal(body.get("longitude").toString()) : BigDecimal.ZERO;
        BigDecimal latitude = body.get("latitude") != null ? new BigDecimal(body.get("latitude").toString()) : BigDecimal.ZERO;

        Long id = inspectionService.submitRecord(planId, stationId, projectId, checklistResult, photos, longitude, latitude);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateRecord(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> checklistResult = (Map<String, Object>) body.get("checklistResult");
        @SuppressWarnings("unchecked")
        Map<String, Object> photos = (Map<String, Object>) body.get("photos");
        BigDecimal longitude = body.get("longitude") != null ? new BigDecimal(body.get("longitude").toString()) : null;
        BigDecimal latitude = body.get("latitude") != null ? new BigDecimal(body.get("latitude").toString()) : null;

        inspectionService.updateRecord(id, checklistResult, photos, longitude, latitude);
        return ApiResponse.success();
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getRecordDetail(@PathVariable Long id) {
        return ApiResponse.success(inspectionService.getRecordDetail(id));
    }

    @GetMapping
    public ApiResponse<IPage<Map<String, Object>>> listRecords(
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(inspectionService.listRecords(stationId, planId, keyword, status, page, size));
    }

    @PostMapping("/photos/upload")
    public ApiResponse<Map<String, String>> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sectionId") Integer sectionId,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "latitude", required = false) Double latitude) {
        String url = inspectionService.uploadPhoto(file, sectionId, longitude, latitude);
        return ApiResponse.success(Map.of("url", url));
    }
}
