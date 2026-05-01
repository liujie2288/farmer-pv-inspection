package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.plan.dto.PlanDto;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import com.yldlxj.pv.inspect.plan.dto.UpdatePlanDto;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.station.StationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectPlanService {

    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;
    private final ProjectMapper projectMapper;
    private final StationMapper stationMapper;

    public PageDto<PlanViewVo> listPlans(int page, int size, String keyword, Integer status) {
        long total = planMapper.countPlan(keyword, status);
        if (total == 0) {
            return PageDto.of(Collections.emptyList(), 0, page, size);
        }

        List<PlanViewVo> records = planMapper.listPlan(keyword, status, (page - 1) * size, size);

        return PageDto.of(records, total, page, size);
    }

    @Transactional
    public Map<String, Object> createPlan(Long userId, PlanDto dto) {
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        for (Long projectId : dto.getProjectIds()) {
            if (projectMapper.selectById(projectId) == null) {
                throw new BusinessException("项目不存在");
            }
            if (planProjectMapper.countActiveByProjectId(projectId) > 0) {
                throw new BusinessException("勾选的项目中关联有未结束的巡检任务");
            }
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
    public void updatePlan(Long planId, UpdatePlanDto dto) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("任务不存在");
        }
        if (plan.getStatus() == PlanStatus.FINISHED) {
            throw new BusinessException("已结束的任务不可修改");
        }
        if (dto.getStartTime() != null) plan.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) plan.setEndTime(dto.getEndTime());
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

    @Transactional
    public void deletePlan(Long planId) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("任务不存在");
        }
        if (plan.getStatus() != PlanStatus.PENDING) {
            throw new BusinessException("仅未开始的任务可以删除");
        }
        planProjectMapper.delete(new LambdaQueryWrapper<InspectPlanProject>()
                .eq(InspectPlanProject::getPlanId, planId));
        planMapper.deleteById(planId);
    }

    public PlanViewVo getPlanDetail(Long planId) {
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            return null;
        }

        List<InspectPlanProject> pps = planProjectMapper.selectList(
                new LambdaQueryWrapper<InspectPlanProject>().eq(InspectPlanProject::getPlanId, planId)
        );

        PlanViewVo vo = new PlanViewVo();
        vo.setPlanId(planId);
        vo.setPlanName(plan.getPlanName());
        vo.setStatus(plan.getStatus());
        vo.setTotalCount(plan.getTotalCount());
        vo.setInspectedCount(plan.getInspectedCount());

        List<PlanProjectViewVo> ranking = pps.stream().map(pp -> {
            PlanProjectViewVo item = new PlanProjectViewVo();
            item.setPlanProjectId(pp.getId());
            item.setProjectId(pp.getProjectId());
            item.setProjectName(getProjectName(pp.getProjectId()));
            item.setTotalCount(pp.getTotalCount());
            item.setInspectedCount(pp.getInspectedCount());
            return item;
        }).sorted((a, b) -> Double.compare(b.getCompletionRate(), a.getCompletionRate()))
        .collect(Collectors.toList());

        vo.setItems(ranking);
        return vo;
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

    @Transactional
    public void autoTransitionStatus() {
        // 先校准所有进行中计划的统计数据
        List<Long> activePlanIds = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .in(InspectPlan::getStatus, PlanStatus.PENDING, PlanStatus.IN_PROGRESS)
        ).stream().map(InspectPlan::getId).collect(Collectors.toList());

        if(!activePlanIds.isEmpty()){
            planProjectMapper.selectList(
                    new LambdaQueryWrapper<InspectPlanProject>()
                            .in(InspectPlanProject::getPlanId, activePlanIds)
            ).forEach(p -> planProjectMapper.recalculateCounts(p.getId()));
            activePlanIds.forEach(planMapper::recalculateCounts);
        }

        int started = planMapper.transitionToInProgress();
        int finished = planMapper.transitionToFinished();
        if (started > 0 || finished > 0) {
            log.info("定时任务-计划状态流转: 校准计划数={}, 启动={}, 结束={}", activePlanIds.size(), started, finished);
        }
    }

    private void validateTimeRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start) || end.isEqual(start)) {
            throw new BusinessException("结束时间必须晚于开始时间");
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
