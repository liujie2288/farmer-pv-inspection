package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.PlanConvert;
import com.yldlxj.pv.inspect.inverter.InverterMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanDto;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final InspectPlanMapper planMapper;
    private final ProjectMapper projectMapper;
    private final InverterMapper inverterMapper;

    public PageDto<PlanViewVo> listPlans(int page, int size, String planName, Long projectId, Integer status) {
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
        wrapper.orderByDesc(InspectPlan::getEndTime)
               .orderByDesc(InspectPlan::getPlanGroupId)
               .orderByAsc(InspectPlan::getProjectId);

        IPage<InspectPlan> planPage = planMapper.selectPage(new Page<>(page, size), wrapper);

        // Batch load project names
        List<Long> projectIds = planPage.getRecords().stream()
                .map(InspectPlan::getProjectId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Collections.emptyMap() :
                projectMapper.selectBatchIds(projectIds).stream()
                        .collect(Collectors.toMap(Project::getId, Project::getProjectName));

        List<PlanViewVo> vos = PlanConvert.INSTANCE.toVoList(planPage.getRecords());
        vos.forEach(vo -> {
            vo.setProjectName(projectNameMap.getOrDefault(vo.getProjectId(), "未知项目"));
            double rate = vo.getInverterCount() != null && vo.getInverterCount() > 0
                    ? (vo.getInspectedCount() * 100.0 / vo.getInverterCount()) : 0;
            vo.setCompletionRate(Math.round(rate * 100.0) / 100.0);
        });

        return PageDto.of(vos, planPage.getTotal(), planPage.getCurrent(), planPage.getSize());
    }

    @Transactional
    public Map<String, Object> createPlan(PlanDto dto) {
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        for (Long pid : dto.getProjectIds()) {
            validateProject(pid);
            checkOneActiveConstraint(pid);
        }

        int initialStatus = !dto.getStartTime().isAfter(LocalDate.now()) ? 1 : 0;

        // Insert first plan to get auto-generated ID as planGroupId
        Long firstPid = dto.getProjectIds().get(0);
        InspectPlan firstPlan = new InspectPlan();
        firstPlan.setPlanName(dto.getPlanName());
        firstPlan.setProjectId(firstPid);
        firstPlan.setStartTime(dto.getStartTime());
        firstPlan.setEndTime(dto.getEndTime());
        firstPlan.setStatus(initialStatus);
        firstPlan.setInverterCount(inverterMapper.countByProjectId(firstPid));
        firstPlan.setInspectedCount(0);
        firstPlan.setPlanGroupId(0L); // temporary
        planMapper.insert(firstPlan);

        Long planGroupId = firstPlan.getId();
        firstPlan.setPlanGroupId(planGroupId);
        planMapper.updateById(firstPlan);

        // Insert remaining plans
        List<Long> planIds = new ArrayList<>();
        planIds.add(planGroupId);

        for (int i = 1; i < dto.getProjectIds().size(); i++) {
            Long pid = dto.getProjectIds().get(i);
            InspectPlan plan = new InspectPlan();
            plan.setPlanGroupId(planGroupId);
            plan.setPlanName(dto.getPlanName());
            plan.setProjectId(pid);
            plan.setStartTime(dto.getStartTime());
            plan.setEndTime(dto.getEndTime());
            plan.setStatus(initialStatus);
            plan.setInverterCount(inverterMapper.countByProjectId(pid));
            plan.setInspectedCount(0);
            planMapper.insert(plan);
            planIds.add(plan.getId());
        }

        return Map.of("planGroupId", planGroupId, "planIds", planIds);
    }

    @Transactional
    public void updatePlan(Long planGroupId, LocalDate startTime, LocalDate endTime) {
        List<InspectPlan> plans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getPlanGroupId, planGroupId)
        );
        if (plans.isEmpty()) {
            throw new BusinessException("计划不存在");
        }
        if (plans.get(0).getStatus() == 2) {
            throw new BusinessException("已结束的计划不可修改");
        }

        for (InspectPlan plan : plans) {
            if (startTime != null) plan.setStartTime(startTime);
            if (endTime != null) plan.setEndTime(endTime);
            validateTimeRange(plan.getStartTime(), plan.getEndTime());
            planMapper.updateById(plan);
        }
    }

    @Transactional
    public void finishPlan(Long planGroupId) {
        List<InspectPlan> plans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getPlanGroupId, planGroupId)
        );
        if (plans.isEmpty()) {
            throw new BusinessException("计划不存在");
        }

        for (InspectPlan plan : plans) {
            if (plan.getStatus() == 2) continue;
            plan.setStatus(2);
            planMapper.updateById(plan);
        }
    }

    public Map<String, Object> getPlanStats(Long planGroupId) {
        List<InspectPlan> plans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getPlanGroupId, planGroupId)
        );
        if (plans.isEmpty()) {
            throw new BusinessException("计划不存在");
        }

        int totalInverters = plans.stream().mapToInt(InspectPlan::getInverterCount).sum();
        int totalInspected = plans.stream().mapToInt(InspectPlan::getInspectedCount).sum();
        double rate = totalInverters > 0 ? (totalInspected * 100.0 / totalInverters) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("planGroupId", planGroupId);
        stats.put("planName", plans.get(0).getPlanName());
        stats.put("status", plans.stream().mapToInt(InspectPlan::getStatus).max().orElse(0));
        stats.put("inverterCount", totalInverters);
        stats.put("inspectedCount", totalInspected);
        stats.put("completionRate", Math.round(rate * 100.0) / 100.0);

        List<Map<String, Object>> ranking = plans.stream().map(plan -> {
            Map<String, Object> item = new HashMap<>();
            item.put("planId", plan.getId());
            item.put("projectId", plan.getProjectId());
            item.put("projectName", getProjectName(plan.getProjectId()));
            item.put("inverterCount", plan.getInverterCount());
            item.put("inspectedCount", plan.getInspectedCount());
            item.put("status", plan.getStatus());
            double subRate = plan.getInverterCount() > 0 ? (plan.getInspectedCount() * 100.0 / plan.getInverterCount()) : 0;
            item.put("completionRate", Math.round(subRate * 100.0) / 100.0);
            return item;
        }).sorted((a, b) -> Double.compare((Double) b.get("completionRate"), (Double) a.get("completionRate")))
          .collect(Collectors.toList());

        stats.put("projectRanking", ranking);
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

    @org.springframework.scheduling.annotation.Scheduled(cron = "5 0 * * * *")
    @Transactional
    public void autoTransitionStatus() {
        LocalDate today = LocalDate.now();

        List<InspectPlan> toStart = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 0)
                        .le(InspectPlan::getStartTime, today)
        );
        for (InspectPlan plan : toStart) {
            plan.setStatus(1);
            planMapper.updateById(plan);
        }

        List<InspectPlan> toEnd = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 1)
                        .lt(InspectPlan::getEndTime, today)
        );
        for (InspectPlan plan : toEnd) {
            plan.setStatus(2);
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

}
