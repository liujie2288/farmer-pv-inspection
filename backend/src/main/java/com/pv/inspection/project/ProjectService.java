package com.pv.inspection.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.farmer.FarmerMapper;
import com.pv.inspection.project.dto.ProjectDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final FarmerMapper farmerMapper;

    public IPage<Project> listProjects(int page, int size, String projectName) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        if (projectName != null && !projectName.isEmpty()) {
            wrapper.like(Project::getProjectName, projectName);
        }
        wrapper.orderByDesc(Project::getCreateTime);
        return projectMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public Long createProject(ProjectDTO dto) {
        Long count = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>().eq(Project::getProjectName, dto.getProjectName())
        );
        if (count > 0) {
            throw new BusinessException("项目名称已存在");
        }

        Project project = new Project();
        project.setProjectName(dto.getProjectName());
        project.setPropertyCompany(dto.getPropertyCompany());
        project.setStationType(dto.getStationType());
        project.setFarmerCount(0);
        project.setCreateTime(LocalDateTime.now());
        project.setUpdateTime(LocalDateTime.now());

        projectMapper.insert(project);
        return project.getId();
    }

    public void updateProject(Long id, ProjectDTO dto) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        // Check name uniqueness excluding self
        Long count = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getProjectName, dto.getProjectName())
                        .ne(Project::getId, id)
        );
        if (count > 0) {
            throw new BusinessException("项目名称已存在");
        }

        project.setProjectName(dto.getProjectName());
        project.setPropertyCompany(dto.getPropertyCompany());
        project.setStationType(dto.getStationType());
        project.setUpdateTime(LocalDateTime.now());
        projectMapper.updateById(project);
    }

    public void deleteProject(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        int farmerCount = farmerMapper.countByProjectId(id);
        if (farmerCount > 0) {
            throw new BusinessException("该项目下存在农户，请先删除");
        }

        projectMapper.deleteById(id);
    }

    public Map<String, Object> getProjectStats(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        int farmerCount = farmerMapper.countByProjectId(id);
        int inspectedCount = farmerMapper.countInspectedByProjectId(id);
        int uninspectedCount = farmerCount - inspectedCount;
        double completionRate = farmerCount > 0 ? (inspectedCount * 100.0 / farmerCount) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("farmerCount", farmerCount);
        stats.put("inspectedCount", inspectedCount);
        stats.put("uninspectedCount", uninspectedCount);
        stats.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        stats.put("activePlan", null); // Will be populated when plans are implemented
        return stats;
    }

    public Project getProjectById(Long id) {
        return projectMapper.selectById(id);
    }
}
