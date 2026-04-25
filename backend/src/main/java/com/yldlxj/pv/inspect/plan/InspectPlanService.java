package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.plan.dto.PlanDto;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.station.StationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InspectPlanService {

    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;
    private final ProjectMapper projectMapper;
    private final StationMapper stationMapper;

    public PageDto<PlanProjectViewVo> listPlans(int page, int size, String keyword, Integer status) {
        long total = planMapper.countPlanView(keyword, status);
        if (total == 0) {
            return PageDto.of(Collections.emptyList(), 0, page, size);
        }

        List<PlanProjectViewVo> records = planMapper.listPlanView(keyword, status, (page - 1) * size, size);

        records.forEach(vo -> {
            double rate = vo.getTotalCount() != null && vo.getTotalCount() > 0
                    ? (vo.getInspectedCount() * 100.0 / vo.getTotalCount()) : 0;
            vo.setCompletionRate(Math.round(rate * 100.0) / 100.0);
        });

        return PageDto.of(records, total, page, size);
    }

    @Transactional
    public Map<String, Object> createPlan(Long userId, PlanDto dto) {
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        for (Long pid : dto.getProjectIds()) {
            validateProject(pid);
            checkOneActiveConstraint(pid);
        }

        PlanStatus initialStatus = !dto.getStartTime().isAfter(LocalDate.now()) ? PlanStatus.IN_PROGRESS : PlanStatus.PENDING;

        // Create plan
        InspectPlan plan = new InspectPlan();
        plan.setPlanName(dto.getPlanName());
        plan.setStartTime(dto.getStartTime());
        plan.setEndTime(dto.getEndTime());
        plan.setStatus(initialStatus);
        plan.setCreatorId(userId);
        plan.setInspectedCount(0);

        planMapper.insert(plan);

        int totalStations = 0;
        List<Long> planProjectIds = new ArrayList<>();
        for (Long pid : dto.getProjectIds()) {
            int stationCount = stationMapper.countByProjectId(pid);
            totalStations += stationCount;

            InspectPlanProject pp = new InspectPlanProject();
            pp.setPlanId(plan.getId());
            pp.setProjectId(pid);
            pp.setTotalCount(stationCount);
            pp.setInspectedCount(0);
            planProjectMapper.insert(pp);
            planProjectIds.add(pp.getId());
        }

        plan.setTotalCount(totalStations);
        planMapper.updateById(plan);

        return Map.of("planId", plan.getId(), "planProjectIds", planProjectIds);
    }

    @Transactional
    public void updatePlan(Long planId, LocalDate startTime, LocalDate endTime) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("计划不存在");
        }
        if (plan.getStatus() == PlanStatus.FINISHED) {
            throw new BusinessException("已结束的计划不可修改");
        }
        if (startTime != null) plan.setStartTime(startTime);
        if (endTime != null) plan.setEndTime(endTime);
        validateTimeRange(plan.getStartTime(), plan.getEndTime());
        planMapper.updateById(plan);
    }

    @Transactional
    public void finishPlan(Long planId) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan != null) {
            if (plan.getStatus() != PlanStatus.FINISHED) {
                plan.setStatus(PlanStatus.FINISHED);
                planMapper.updateById(plan);
            }
        }
    }

    public Map<String, Object> getPlanStats(Long planId) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("计划不存在");
        }

        List<InspectPlanProject> pps = planProjectMapper.selectList(
                new LambdaQueryWrapper<InspectPlanProject>().eq(InspectPlanProject::getPlanId, planId)
        );

        Map<String, Object> stats = new HashMap<>();
        stats.put("planId", planId);
        stats.put("planName", plan.getPlanName());
        stats.put("status", plan.getStatus());
        stats.put("totalCount", plan.getTotalCount());
        stats.put("inspectedCount", plan.getInspectedCount());
        double rate = plan.getTotalCount() > 0 ? (plan.getInspectedCount() * 100.0 / plan.getTotalCount()) : 0;
        stats.put("completionRate", Math.round(rate * 100.0) / 100.0);

        List<Map<String, Object>> ranking = pps.stream().map(pp -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("planProjectId", pp.getId());
                    item.put("projectId", pp.getProjectId());
                    item.put("projectName", getProjectName(pp.getProjectId()));
                    item.put("totalCount", pp.getTotalCount());
                    item.put("inspectedCount", pp.getInspectedCount());
                    double subRate = pp.getTotalCount() > 0 ? (pp.getInspectedCount() * 100.0 / pp.getTotalCount()) : 0;
                    item.put("completionRate", Math.round(subRate * 100.0) / 100.0);
                    return item;
                }).sorted((a, b) -> Double.compare((Double) b.get("completionRate"), (Double) a.get("completionRate")))
                .collect(Collectors.toList());

        stats.put("projectRanking", ranking);
        return stats;
    }

    public InspectPlan getActivePlan(Long projectId) {
        List<InspectPlanProject> pps = planProjectMapper.selectList(
                new LambdaQueryWrapper<InspectPlanProject>().eq(InspectPlanProject::getProjectId, projectId)
        );
        if (pps.isEmpty()) return null;
        List<Long> planIds = pps.stream().map(InspectPlanProject::getPlanId).collect(Collectors.toList());
        InspectPlan plan = planMapper.selectOne(
                new LambdaQueryWrapper<InspectPlan>()
                        .in(InspectPlan::getId, planIds)
                        .eq(InspectPlan::getStatus, PlanStatus.IN_PROGRESS)
                        .last("LIMIT 1")
        );
        return plan;
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "5 0 * * * *")
    @Transactional
    public void autoTransitionStatus() {
        LocalDate today = LocalDate.now();

        List<InspectPlan> toStart = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, PlanStatus.PENDING)
                        .le(InspectPlan::getStartTime, today)
        );
        for (InspectPlan plan : toStart) {
            plan.setStatus(PlanStatus.IN_PROGRESS);
            planMapper.updateById(plan);
        }

        List<InspectPlan> toEnd = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, PlanStatus.IN_PROGRESS)
                        .lt(InspectPlan::getEndTime, today)
        );
        for (InspectPlan plan : toEnd) {
            plan.setStatus(PlanStatus.FINISHED);
            planMapper.updateById(plan);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 2 * * * *")
    @Transactional
    public void autoTransitionStatusRetry() {
        autoTransitionStatus();
    }

    private void validateProject(Long projectId) {
        if (projectMapper.selectById(projectId) == null) {
            throw new BusinessException("项目不存在");
        }
    }

    private void validateTimeRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start) || end.isEqual(start)) {
            throw new BusinessException("结束时间必须晚于开始时间");
        }
    }

    private void checkOneActiveConstraint(Long projectId) {
        List<InspectPlanProject> pps = planProjectMapper.selectList(
                new LambdaQueryWrapper<InspectPlanProject>().eq(InspectPlanProject::getProjectId, projectId)
        );
        if (!pps.isEmpty()) {
            Long count = planMapper.selectCount(
                    new LambdaQueryWrapper<InspectPlan>()
                            .in(InspectPlan::getId, pps.stream().map(InspectPlanProject::getPlanId).collect(Collectors.toList()))
                            .in(InspectPlan::getStatus, Arrays.asList(PlanStatus.PENDING, PlanStatus.IN_PROGRESS))
            );
            if (count > 0) {
                throw new BusinessException("该项目当前已有未结束的巡检计划");
            }
        }
    }

    private String getProjectName(Long projectId) {
        Project p = projectMapper.selectById(projectId);
        return p != null ? p.getProjectName() : "未知项目";
    }

    public PlanProjectViewVo getActivePlanByProjectId(Long projectId) {
        return planMapper.findActiveByProjectId(projectId);
    }

    public Map<Long, PlanProjectViewVo> getActivePlansByProjectIds(List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<PlanProjectViewVo> plans = planMapper.findActiveByProjectIds(projectIds);
        return plans.stream()
                .filter(p -> p.getProjectId() != null)
                .collect(Collectors.toMap(PlanProjectViewVo::getProjectId, p -> p, (a, b) -> a));
    }
}
