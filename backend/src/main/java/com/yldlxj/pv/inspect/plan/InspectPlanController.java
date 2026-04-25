package com.yldlxj.pv.inspect.plan;

import com.yldlxj.pv.inspect.auth.SecurityUtils;
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
@RequestMapping("/api/inspect/plans")
@RequiredArgsConstructor
public class InspectPlanController {

    private final InspectPlanService inspectPlanService;

    @GetMapping
    public ApiResponse<PageDto<PlanViewVo>> listPlans(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return ApiResponse.success(inspectPlanService.listPlans(page, size, keyword, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createPlan(@Valid @RequestBody PlanDto dto) {
        return ApiResponse.created(inspectPlanService.createPlan(SecurityUtils.getCurrentUserId(), dto));
    }

    @PutMapping("/{planId}")
    public ApiResponse<Void> updatePlan(
            @PathVariable Long planId,
            @RequestBody Map<String, String> body) {
        LocalDate startTime = body.get("startTime") != null ? LocalDate.parse(body.get("startTime")) : null;
        LocalDate endTime = body.get("endTime") != null ? LocalDate.parse(body.get("endTime")) : null;
        inspectPlanService.updatePlan(planId, startTime, endTime);
        return ApiResponse.success();
    }

    @PutMapping("/{planId}/finish")
    public ApiResponse<Void> finishPlan(@PathVariable Long planId) {
        inspectPlanService.finishPlan(planId);
        return ApiResponse.success();
    }

    @GetMapping("/{planId}/stats")
    public ApiResponse<Map<String, Object>> getPlanStats(@PathVariable Long planId) {
        return ApiResponse.success(inspectPlanService.getPlanStats(planId));
    }

    @GetMapping("/active")
    public ApiResponse<InspectPlan> getActivePlan(@RequestParam Long projectId) {
        return ApiResponse.success(inspectPlanService.getActivePlan(projectId));
    }
}
