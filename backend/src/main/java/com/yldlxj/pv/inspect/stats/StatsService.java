package com.yldlxj.pv.inspect.stats;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.inverter.InverterMapper;
import com.yldlxj.pv.inspect.inspection.InspectRecordMapper;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ProjectMapper projectMapper;
    private final InverterMapper inverterMapper;
    private final InspectPlanMapper planMapper;
    private final InspectRecordMapper recordMapper;

    public Map<String, Object> getGlobalStats() {
        List<Project> projects = projectMapper.selectList(null);
        int totalProjects = projects.size();
        int totalInverters = 0;

        // Count inspected inverters globally
        Long totalInspected = 0L;
        for (Project p : projects) {
            totalInspected += inverterMapper.countInspectedByProjectId(p.getId());
        }

        // Active plan groups (deduplicated by planGroupId)
        List<InspectPlan> activePlans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 1)
                        .groupBy(InspectPlan::getPlanGroupId)
        );

        // Project ranking by completion rate
        List<Map<String, Object>> ranking = projects.stream().map(p -> {
            int fc = inverterMapper.countByProjectId(p.getId());
            int ic = inverterMapper.countInspectedByProjectId(p.getId());
            double rate = fc > 0 ? (ic * 100.0 / fc) : 0;
            Map<String, Object> item = new HashMap<>();
            item.put("projectId", p.getId());
            item.put("projectName", p.getProjectName());
            item.put("inverterCount", fc);
            item.put("inspectedCount", ic);
            item.put("completionRate", Math.round(rate * 100.0) / 100.0);
            return item;
        }).sorted((a, b) -> Double.compare((Double) b.get("completionRate"), (Double) a.get("completionRate")))
          .collect(Collectors.toList());

        double globalRate = totalInverters > 0 ? (totalInspected * 100.0 / totalInverters) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", totalProjects);
        stats.put("totalInverters", totalInverters);
        stats.put("totalInspected", totalInspected.intValue());
        stats.put("completionRate", Math.round(globalRate * 100.0) / 100.0);
        stats.put("activePlans", activePlans.stream().map(p -> {
            Map<String, Object> ap = new HashMap<>();
            ap.put("id", p.getId());
            ap.put("planName", p.getPlanName());
            ap.put("endTime", p.getEndTime());
            return ap;
        }).collect(Collectors.toList()));
        stats.put("projectRanking", ranking);
        return stats;
    }

    public Map<String, Object> getProjectStats(Long projectId) {
        int inverterCount = inverterMapper.countByProjectId(projectId);
        int inspectedCount = inverterMapper.countInspectedByProjectId(projectId);
        double rate = inverterCount > 0 ? (inspectedCount * 100.0 / inverterCount) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("inverterCount", inverterCount);
        stats.put("inspectedCount", inspectedCount);
        stats.put("uninspectedCount", inverterCount - inspectedCount);
        stats.put("completionRate", Math.round(rate * 100.0) / 100.0);

        InspectPlan activePlan = planMapper.selectOne(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getProjectId, projectId)
                        .eq(InspectPlan::getStatus, 1)
                        .last("LIMIT 1")
        );
        if (activePlan != null) {
            Map<String, Object> ap = new HashMap<>();
            ap.put("id", activePlan.getId());
            ap.put("planName", activePlan.getPlanName());
            stats.put("activePlan", ap);
        } else {
            stats.put("activePlan", null);
        }
        return stats;
    }
}
