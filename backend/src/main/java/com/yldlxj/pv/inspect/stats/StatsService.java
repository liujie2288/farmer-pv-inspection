package com.yldlxj.pv.inspect.stats;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.plan.InspectPlanProject;
import com.yldlxj.pv.inspect.plan.InspectPlanProjectMapper;
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
    private final StationMapper stationMapper;
    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;

    public Map<String, Object> getGlobalStats() {
        List<Project> projects = projectMapper.selectList(null);
        int totalProjects = projects.size();
        int totalStations = projects.stream()
                .mapToInt(p -> stationMapper.countByProjectId(p.getId()))
                .sum();

        List<InspectPlan> activePlans = planMapper.selectList(
                new LambdaQueryWrapper<InspectPlan>()
                        .eq(InspectPlan::getStatus, 1)
        );

        List<Map<String, Object>> ranking = projects.stream().map(p -> {
            int fc = stationMapper.countByProjectId(p.getId());
            Map<String, Object> item = new HashMap<>();
            item.put("projectId", p.getId());
            item.put("projectName", p.getProjectName());
            item.put("stationCount", fc);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", totalProjects);
        stats.put("totalStations", totalStations);
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
        int stationCount = stationMapper.countByProjectId(projectId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("stationCount", stationCount);

        List<InspectPlanProject> pps = planProjectMapper.selectList(
                new LambdaQueryWrapper<InspectPlanProject>().eq(InspectPlanProject::getProjectId, projectId)
        );
        if (!pps.isEmpty()) {
            List<Long> planIds = pps.stream().map(InspectPlanProject::getPlanId).collect(Collectors.toList());
            InspectPlan activeInspectPlan = planMapper.selectOne(
                    new LambdaQueryWrapper<InspectPlan>()
                            .in(InspectPlan::getId, planIds)
                            .eq(InspectPlan::getStatus, 1)
                            .last("LIMIT 1")
            );
            if (activeInspectPlan != null) {
                Map<String, Object> ap = new HashMap<>();
                ap.put("id", activeInspectPlan.getId());
                ap.put("planName", activeInspectPlan.getPlanName());
                stats.put("activePlan", ap);
            } else {
                stats.put("activePlan", null);
            }
        } else {
            stats.put("activePlan", null);
        }
        return stats;
    }
}
