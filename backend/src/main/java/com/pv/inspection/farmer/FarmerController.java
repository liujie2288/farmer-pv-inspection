package com.pv.inspection.farmer;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.pv.inspection.common.ApiResponse;
import com.pv.inspection.farmer.dto.FarmerDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/farmers")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    @GetMapping
    public ApiResponse<IPage<Farmer>> listFarmers(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String farmerName,
            @RequestParam(required = false) String farmerCode,
            @RequestParam(required = false) Integer status) {
        return ApiResponse.success(farmerService.listFarmers(projectId, page, size, farmerName, farmerCode, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createFarmer(
            @PathVariable Long projectId,
            @Valid @RequestBody FarmerDTO dto) {
        Long id = farmerService.createFarmer(projectId, dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PostMapping("/import")
    public ApiResponse<Map<String, Object>> importFarmers(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(farmerService.importFarmers(projectId, file));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateFarmer(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @Valid @RequestBody FarmerDTO dto) {
        farmerService.updateFarmer(projectId, id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteFarmer(@PathVariable Long projectId, @PathVariable Long id) {
        farmerService.deleteFarmer(projectId, id);
        return ApiResponse.success();
    }

    @DeleteMapping("/batch")
    public ApiResponse<Map<String, Integer>> batchDeleteFarmers(
            @PathVariable Long projectId,
            @RequestBody Map<String, List<Long>> body) {
        int count = farmerService.batchDeleteFarmers(projectId, body.get("ids"));
        return ApiResponse.success(Map.of("deletedCount", count));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getFarmerDetail(
            @PathVariable Long projectId,
            @PathVariable Long id) {
        return ApiResponse.success(farmerService.getFarmerDetail(projectId, id));
    }
}
