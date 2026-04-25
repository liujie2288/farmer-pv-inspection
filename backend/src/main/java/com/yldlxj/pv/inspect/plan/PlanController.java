package com.yldlxj.pv.inspect.plan;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.plan.dto.PlanDto;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ApiResponse<PageDto<PlanViewVo>> listPlans(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Integer status) {
        return ApiResponse.success(planService.listPlans(page, size, planName, projectId, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createPlan(@Valid @RequestBody PlanDto dto) {
        return ApiResponse.created(planService.createPlan(dto));
    }

    @PutMapping("/{planGroupId}")
    public ApiResponse<Void> updatePlan(
            @PathVariable Long planGroupId,
            @RequestBody Map<String, String> body) {
        LocalDate startTime = body.get("startTime") != null ? LocalDate.parse(body.get("startTime")) : null;
        LocalDate endTime = body.get("endTime") != null ? LocalDate.parse(body.get("endTime")) : null;
        planService.updatePlan(planGroupId, startTime, endTime);
        return ApiResponse.success();
    }

    @PutMapping("/{planGroupId}/finish")
    public ApiResponse<Void> finishPlan(@PathVariable Long planGroupId) {
        planService.finishPlan(planGroupId);
        return ApiResponse.success();
    }

    @GetMapping("/{planGroupId}/stats")
    public ApiResponse<Map<String, Object>> getPlanStats(@PathVariable Long planGroupId) {
        return ApiResponse.success(planService.getPlanStats(planGroupId));
    }

    @GetMapping("/active")
    public ApiResponse<InspectPlan> getActivePlan(@RequestParam Long projectId) {
        return ApiResponse.success(planService.getActivePlan(projectId));
    }
}
