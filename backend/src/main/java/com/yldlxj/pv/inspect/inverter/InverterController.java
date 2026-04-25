package com.yldlxj.pv.inspect.inverter;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.inverter.dto.InverterDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/inverters")
@RequiredArgsConstructor
public class InverterController {

    private final InverterService inverterService;

    @GetMapping
    public ApiResponse<IPage<Inverter>> listInverters(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return ApiResponse.success(inverterService.listInverters(projectId, page, size, keyword, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createInverter(
            @PathVariable Long projectId,
            @Valid @RequestBody InverterDto dto) {
        Long id = inverterService.createInverter(projectId, dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PostMapping("/import")
    public ApiResponse<Map<String, Object>> importInverters(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(inverterService.importInverters(projectId, file));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateInverter(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @Valid @RequestBody InverterDto dto) {
        inverterService.updateInverter(projectId, id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteInverter(@PathVariable Long projectId, @PathVariable Long id) {
        inverterService.deleteInverter(projectId, id);
        return ApiResponse.success();
    }

    @DeleteMapping("/batch")
    public ApiResponse<Map<String, Integer>> batchDeleteInverters(
            @PathVariable Long projectId,
            @RequestBody Map<String, List<Long>> body) {
        int count = inverterService.batchDeleteInverters(projectId, body.get("ids"));
        return ApiResponse.success(Map.of("deletedCount", count));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getInverterDetail(
            @PathVariable Long projectId,
            @PathVariable Long id) {
        return ApiResponse.success(inverterService.getInverterDetail(projectId, id));
    }
}
