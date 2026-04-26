package com.yldlxj.pv.inspect.stats;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import com.yldlxj.pv.inspect.record.InspectRecord;
import com.yldlxj.pv.inspect.record.InspectRecordMapper;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ProjectMapper projectMapper;
    private final StationMapper stationMapper;
    private final InspectPlanMapper planMapper;
    private final InspectRecordMapper recordMapper;

    public Map<String, Object> getGlobalStats() {
        List<Project> projects = projectMapper.selectList(null);
        int totalProjects = projects.size();
        int totalStations = projects.stream()
                .mapToInt(p -> stationMapper.countByProjectId(p.getId()))
                .sum();

        // 本周已巡检
        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = today.with(DayOfWeek.MONDAY).atStartOfDay();
        long weekInspected = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>()
                        .ge(InspectRecord::getCreateTime, weekStart)
        );

        // 本月已巡检
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        long monthInspected = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>()
                        .ge(InspectRecord::getCreateTime, monthStart)
        );

        // 进行中的计划
        List<InspectPlan> activePlans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, PlanStatus.IN_PROGRESS)
        );

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", totalProjects);
        stats.put("totalStations", totalStations);
        stats.put("weekInspected", weekInspected);
        stats.put("monthInspected", monthInspected);
        stats.put("activePlans", activePlans.stream().map(p -> {
            Map<String, Object> ap = new HashMap<>();
            ap.put("id", p.getId());
            ap.put("planName", p.getPlanName());
            ap.put("endTime", p.getEndTime());
            return ap;
        }).collect(Collectors.toList()));
        return stats;
    }

    public Map<String, Object> getProjectStats(Long projectId) {
        int stationCount = stationMapper.countByProjectId(projectId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("stationCount", stationCount);

        List<InspectPlan> activePlans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, PlanStatus.IN_PROGRESS)
        );
        if (!activePlans.isEmpty()) {
            InspectPlan plan = activePlans.get(0);
            Map<String, Object> ap = new HashMap<>();
            ap.put("id", plan.getId());
            ap.put("planName", plan.getPlanName());
            stats.put("activePlan", ap);
        } else {
            stats.put("activePlan", null);
        }
        return stats;
    }
}
