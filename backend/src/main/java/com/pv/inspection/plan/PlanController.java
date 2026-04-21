package com.pv.inspection.plan;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.pv.inspection.common.ApiResponse;
import com.pv.inspection.plan.dto.GlobalPlanDTO;
import com.pv.inspection.plan.dto.PlanDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ApiResponse<IPage<Map<String, Object>>> listPlans(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Integer status) {
        return ApiResponse.success(planService.listPlans(page, size, planName, projectId, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createPlan(@Valid @RequestBody PlanDTO dto) {
        return ApiResponse.created(planService.createPlan(dto));
    }

    @PostMapping("/global")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createGlobalPlan(@Valid @RequestBody GlobalPlanDTO dto) {
        return ApiResponse.created(planService.createGlobalPlan(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updatePlan(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        LocalDateTime startTime = body.get("startTime") != null ? LocalDateTime.parse(body.get("startTime")) : null;
        LocalDateTime endTime = body.get("endTime") != null ? LocalDateTime.parse(body.get("endTime")) : null;
        planService.updatePlan(id, startTime, endTime);
        return ApiResponse.success();
    }

    @PutMapping("/{id}/finish")
    public ApiResponse<Void> finishPlan(@PathVariable Long id) {
        planService.finishPlan(id);
        return ApiResponse.success();
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<Map<String, Object>> getPlanStats(@PathVariable Long id) {
        return ApiResponse.success(planService.getPlanStats(id));
    }

    @GetMapping("/active")
    public ApiResponse<InspectPlan> getActivePlan(@RequestParam Long projectId) {
        return ApiResponse.success(planService.getActivePlan(projectId));
    }
}
