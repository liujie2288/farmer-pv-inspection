package com.pv.inspection.plan;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.farmer.FarmerMapper;
import com.pv.inspection.plan.dto.GlobalPlanDTO;
import com.pv.inspection.plan.dto.PlanDTO;
import com.pv.inspection.project.Project;
import com.pv.inspection.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final InspectPlanMapper planMapper;
    private final ProjectMapper projectMapper;
    private final FarmerMapper farmerMapper;

    public IPage<Map<String, Object>> listPlans(int page, int size, String planName, Long projectId, Integer status) {
        LambdaQueryWrapper<InspectPlan> wrapper = new LambdaQueryWrapper<>();
        if (planName != null && !planName.isEmpty()) {
            wrapper.like(InspectPlan::getPlanName, planName);
        }
        if (projectId != null) {
            wrapper.eq(InspectPlan::getProjectId, projectId);
        }
        if (status != null) {
            wrapper.eq(InspectPlan::getStatus, status);
        }
        // Only show top-level plans
        wrapper.eq(InspectPlan::getParentId, 0);
        wrapper.orderByDesc(InspectPlan::getCreateTime);

        IPage<InspectPlan> planPage = planMapper.selectPage(new Page<>(page, size), wrapper);

        // Convert to response with additional fields
        IPage<Map<String, Object>> result = planPage.convert(this::toPlanResponse);
        return result;
    }

    @Transactional
    public Map<String, Object> createPlan(PlanDTO dto) {
        validateProject(dto.getProjectId());
        validateTimeRange(dto.getStartTime(), dto.getEndTime());
        checkOneActiveConstraint(dto.getProjectId());

        int farmerCount = farmerMapper.countByProjectId(dto.getProjectId());

        InspectPlan plan = new InspectPlan();
        plan.setPlanName(dto.getPlanName());
        plan.setProjectId(dto.getProjectId());
        plan.setStartTime(dto.getStartTime());
        plan.setEndTime(dto.getEndTime());
        plan.setStatus(0); // 未开始
        plan.setParentId(0L);
        plan.setFarmerCount(farmerCount);
        plan.setInspectedCount(0);
        plan.setCreateTime(LocalDateTime.now());
        plan.setUpdateTime(LocalDateTime.now());

        // Auto-start if start time has passed
        if (!dto.getStartTime().isAfter(LocalDateTime.now())) {
            plan.setStatus(1);
        }

        planMapper.insert(plan);
        return Map.of("id", plan.getId());
    }

    @Transactional
    public Map<String, Object> createGlobalPlan(GlobalPlanDTO dto) {
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        // Check one-active for all projects
        for (Long pid : dto.getProjectIds()) {
            validateProject(pid);
            checkOneActiveConstraint(pid);
        }

        // Create parent plan
        InspectPlan parent = new InspectPlan();
        parent.setPlanName(dto.getPlanName());
        parent.setProjectId(null);
        parent.setStartTime(dto.getStartTime());
        parent.setEndTime(dto.getEndTime());
        parent.setStatus(0);
        parent.setParentId(0L);
        parent.setFarmerCount(0);
        parent.setInspectedCount(0);
        parent.setCreateTime(LocalDateTime.now());
        parent.setUpdateTime(LocalDateTime.now());

        if (!dto.getStartTime().isAfter(LocalDateTime.now())) {
            parent.setStatus(1);
        }

        planMapper.insert(parent);

        // Create sub-plans for each project
        List<Long> subPlanIds = new ArrayList<>();
        int totalFarmers = 0;
        for (Long pid : dto.getProjectIds()) {
            int farmerCount = farmerMapper.countByProjectId(pid);
            totalFarmers += farmerCount;

            InspectPlan sub = new InspectPlan();
            sub.setPlanName(dto.getPlanName() + " - " + getProjectName(pid));
            sub.setProjectId(pid);
            sub.setStartTime(dto.getStartTime());
            sub.setEndTime(dto.getEndTime());
            sub.setStatus(parent.getStatus());
            sub.setParentId(parent.getId());
            sub.setFarmerCount(farmerCount);
            sub.setInspectedCount(0);
            sub.setCreateTime(LocalDateTime.now());
            sub.setUpdateTime(LocalDateTime.now());

            planMapper.insert(sub);
            subPlanIds.add(sub.getId());
        }

        // Update parent totals
        parent.setFarmerCount(totalFarmers);
        planMapper.updateById(parent);

        Map<String, Object> result = new HashMap<>();
        result.put("parentPlanId", parent.getId());
        result.put("subPlanIds", subPlanIds);
        return result;
    }

    public void updatePlan(Long id, LocalDateTime startTime, LocalDateTime endTime) {
        InspectPlan plan = planMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException("计划不存在");
        }
        if (plan.getStatus() == 2) {
            throw new BusinessException("已结束的计划不可修改");
        }

        if (startTime != null) plan.setStartTime(startTime);
        if (endTime != null) plan.setEndTime(endTime);
        validateTimeRange(plan.getStartTime(), plan.getEndTime());
        plan.setUpdateTime(LocalDateTime.now());
        planMapper.updateById(plan);

        // Also update sub-plans if this is a global plan
        if (plan.getParentId() == 0 && plan.getProjectId() == null) {
            List<InspectPlan> subs = planMapper.selectList(
                    new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getParentId, id)
            );
            for (InspectPlan sub : subs) {
                if (startTime != null) sub.setStartTime(startTime);
                if (endTime != null) sub.setEndTime(endTime);
                sub.setUpdateTime(LocalDateTime.now());
                planMapper.updateById(sub);
            }
        }
    }

    @Transactional
    public void finishPlan(Long id) {
        InspectPlan plan = planMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException("计划不存在");
        }
        if (plan.getStatus() == 2) {
            throw new BusinessException("计划已结束");
        }
        plan.setStatus(2);
        plan.setUpdateTime(LocalDateTime.now());
        planMapper.updateById(plan);

        // Also finish sub-plans
        if (plan.getParentId() == 0) {
            List<InspectPlan> subs = planMapper.selectList(
                    new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getParentId, id)
            );
            for (InspectPlan sub : subs) {
                sub.setStatus(2);
                sub.setUpdateTime(LocalDateTime.now());
                planMapper.updateById(sub);
            }
        }
    }

    public Map<String, Object> getPlanStats(Long id) {
        InspectPlan plan = planMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException("计划不存在");
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("planName", plan.getPlanName());
        stats.put("status", plan.getStatus());
        stats.put("farmerCount", plan.getFarmerCount());
        stats.put("inspectedCount", plan.getInspectedCount());
        double rate = plan.getFarmerCount() > 0 ? (plan.getInspectedCount() * 100.0 / plan.getFarmerCount()) : 0;
        stats.put("completionRate", Math.round(rate * 100.0) / 100.0);

        // Project ranking for global plans
        if (plan.getProjectId() == null && plan.getParentId() == 0) {
            List<InspectPlan> subs = planMapper.selectList(
                    new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getParentId, id)
            );
            List<Map<String, Object>> ranking = subs.stream().map(sub -> {
                Map<String, Object> item = new HashMap<>();
                item.put("projectId", sub.getProjectId());
                item.put("projectName", getProjectName(sub.getProjectId()));
                double subRate = sub.getFarmerCount() > 0 ? (sub.getInspectedCount() * 100.0 / sub.getFarmerCount()) : 0;
                item.put("completionRate", Math.round(subRate * 100.0) / 100.0);
                return item;
            }).sorted((a, b) -> Double.compare((Double) b.get("completionRate"), (Double) a.get("completionRate")))
              .collect(Collectors.toList());
            stats.put("projectRanking", ranking);
        } else {
            stats.put("projectRanking", Collections.emptyList());
        }

        return stats;
    }

    public InspectPlan getActivePlan(Long projectId) {
        return planMapper.selectOne(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getProjectId, projectId)
                        .eq(InspectPlan::getStatus, 1)
                        .last("LIMIT 1")
        );
    }

    /**
     * Auto-transition plan statuses based on time
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void autoTransitionStatus() {
        LocalDateTime now = LocalDateTime.now();

        // 未开始 → 进行中
        List<InspectPlan> toStart = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 0)
                        .le(InspectPlan::getStartTime, now)
        );
        for (InspectPlan plan : toStart) {
            plan.setStatus(1);
            plan.setUpdateTime(now);
            planMapper.updateById(plan);
        }

        // 进行中 → 已结束
        List<InspectPlan> toEnd = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 1)
                        .lt(InspectPlan::getEndTime, now)
        );
        for (InspectPlan plan : toEnd) {
            plan.setStatus(2);
            plan.setUpdateTime(now);
            planMapper.updateById(plan);
        }
    }

    private void validateProject(Long projectId) {
        if (projectMapper.selectById(projectId) == null) {
            throw new BusinessException("项目不存在");
        }
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (end.isBefore(start) || end.isEqual(start)) {
            throw new BusinessException("结束时间必须晚于开始时间");
        }
    }

    private void checkOneActiveConstraint(Long projectId) {
        Long count = planMapper.selectCount(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getProjectId, projectId)
                        .in(InspectPlan::getStatus, Arrays.asList(0, 1))
        );
        if (count > 0) {
            throw new BusinessException("该项目当前已有未结束的巡检计划");
        }
    }

    private String getProjectName(Long projectId) {
        Project p = projectMapper.selectById(projectId);
        return p != null ? p.getProjectName() : "未知项目";
    }

    private Map<String, Object> toPlanResponse(InspectPlan plan) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", plan.getId());
        map.put("planName", plan.getPlanName());
        map.put("projectId", plan.getProjectId());
        map.put("projectName", plan.getProjectId() != null ? getProjectName(plan.getProjectId()) : null);
        map.put("startTime", plan.getStartTime());
        map.put("endTime", plan.getEndTime());
        map.put("status", plan.getStatus());
        map.put("farmerCount", plan.getFarmerCount());
        map.put("inspectedCount", plan.getInspectedCount());
        double rate = plan.getFarmerCount() > 0 ? (plan.getInspectedCount() * 100.0 / plan.getFarmerCount()) : 0;
        map.put("completionRate", Math.round(rate * 100.0) / 100.0);
        map.put("parentId", plan.getParentId());
        map.put("isGlobal", plan.getProjectId() == null && plan.getParentId() == 0);
        return map;
    }
}
