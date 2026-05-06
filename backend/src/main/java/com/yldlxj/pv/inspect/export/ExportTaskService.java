package com.yldlxj.pv.inspect.export;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.export.dto.ExportTaskFileDto;
import com.yldlxj.pv.inspect.export.dto.ExportTaskVo;
import com.yldlxj.pv.inspect.project.ProjectService;
import com.yldlxj.pv.inspect.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportTaskService {

    private final ExportTaskMapper exportTaskMapper;
    private final ProjectService projectService;
    private final UserService userService;

    public List<ExportTaskVo> createTasks(Long planId, List<Long> projectIds, String type) {
        Long operatorId = SecurityUtils.checkAndGetCurrentUserId();
        List<ExportTaskVo> results = new ArrayList<>();

        for (Long projectId : projectIds) {
            ExportTask existing = findExistingTask(planId, projectId, type);
            if (existing != null) {
                results.add(toVo(existing));
                continue;
            }

            ExportTask task = new ExportTask();
            task.setType(type);
            task.setStatus(2);
            task.setPlanId(planId);
            task.setProjectId(projectId);
            task.setOperatorId(operatorId);
            exportTaskMapper.insert(task);
            results.add(toVo(task));
        }

        return results;
    }

    public List<ExportTaskVo> listTasks(Long planId) {
        List<ExportTask> tasks = exportTaskMapper.selectList(
                new LambdaQueryWrapper<ExportTask>()
                        .eq(ExportTask::getPlanId, planId)
                        .orderByDesc(ExportTask::getId)
                        .last("LIMIT 50")
        );
        return tasks.stream().map(this::toVo).collect(Collectors.toList());
    }

    public ExportTaskVo getTask(Long id) {
        ExportTask task = exportTaskMapper.selectById(id);
        return task != null ? toVo(task) : null;
    }

    public ExportTask findExistingTask(Long planId, Long projectId, String type) {
        ExportTask task = exportTaskMapper.selectOne(
                new LambdaQueryWrapper<ExportTask>()
                        .eq(ExportTask::getPlanId, planId)
                        .eq(ExportTask::getProjectId, projectId)
                        .eq(ExportTask::getType, type)
                        .orderByDesc(ExportTask::getId)
                        .last("LIMIT 1")
        );

        if (task != null && task.getStatus() != null && task.getStatus() <= 2) {
            return task;
        } else if (task != null && Objects.equals(task.getStatus(), 3) && task.getFinishTime() != null
                && task.getFinishTime().isAfter(LocalDateTime.now().minusDays(1))) {
            return task;
        }
        return null;
    }

    ExportTaskVo toVo(ExportTask task) {
        ExportTaskVo vo = new ExportTaskVo();
        vo.setId(task.getId());
        vo.setType(task.getType());
        vo.setStatus(task.getStatus());
        vo.setPlanId(task.getPlanId());
        vo.setProjectId(task.getProjectId());
        vo.setProjectName(projectService.getNameByProjectId(task.getProjectId()));
        vo.setTotalCount(task.getTotalCount());
        vo.setFailReason(task.getFailReason());
        vo.setOperatorName(userService.findRealNameByUserId(task.getOperatorId()));
        vo.setFinishTime(task.getFinishTime());
        vo.setCreateTime(task.getCreateTime());
        vo.setFiles(task.getFiles());
        return vo;
    }
}
