package com.yldlxj.pv.inspect.plan;

import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.common.annotation.AdminOnly;
import com.yldlxj.pv.inspect.plan.dto.PlanDto;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import com.yldlxj.pv.inspect.plan.dto.UpdatePlanDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;

import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@Slf4j
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

    @AdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createPlan(@Valid @RequestBody PlanDto dto) {
        Long operatorId = SecurityUtils.getCurrentUserId();
        Map<String, Object> result = inspectPlanService.createPlan(operatorId, dto);
        log.info("创建巡检计划: operatorId={}, planId={}, planName={}", operatorId, result.get("planId"), dto.getPlanName());
        return ApiResponse.created(result);
    }

    @AdminOnly
    @PutMapping("/{planId}")
    public ApiResponse<Void> updatePlan(
            @PathVariable Long planId,
            @RequestBody UpdatePlanDto dto) {
        inspectPlanService.updatePlan(planId, dto);
        return ApiResponse.success();
    }

    @AdminOnly
    @DeleteMapping("/{planId}")
    public ApiResponse<Void> deletePlan(@PathVariable Long planId) {
        inspectPlanService.deletePlan(planId);
        log.info("删除巡检计划: operatorId={}, planId={}", SecurityUtils.getCurrentUserId(), planId);
        return ApiResponse.success();
    }

    @AdminOnly
    @PutMapping("/{planId}/finish")
    public ApiResponse<Void> finishPlan(@PathVariable Long planId) {
        inspectPlanService.finishPlan(planId);
        log.info("手动结束巡检计划: operatorId={}, planId={}", SecurityUtils.getCurrentUserId(), planId);
        return ApiResponse.success();
    }

    @GetMapping("/{planId}/detail")
    public ApiResponse<PlanViewVo> getPlanDetail(@PathVariable Long planId) {
        return ApiResponse.success(inspectPlanService.getPlanDetail(planId));
    }

    @GetMapping("/active")
    public ApiResponse<InspectPlan> getActivePlan(@RequestParam Long projectId) {
        return ApiResponse.success(inspectPlanService.getActivePlan(projectId));
    }
}
