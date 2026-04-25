package com.yldlxj.pv.inspect.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.convert.ProjectConvert;
import com.yldlxj.pv.inspect.device.InspectDevice;
import com.yldlxj.pv.inspect.device.InspectDeviceMapper;
import com.yldlxj.pv.inspect.inverter.InverterMapper;
import com.yldlxj.pv.inspect.project.dto.ProjectDto;
import com.yldlxj.pv.inspect.project.dto.ProjectViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final InverterMapper inverterMapper;
    private final InspectDeviceMapper deviceMapper;

    public ProjectViewVo getProjectById(Long id) {
        Project project = projectMapper.selectById(id);
        if (project != null) {
            project.setDevices(deviceMapper.selectList(
                    new LambdaQueryWrapper<InspectDevice>().eq(InspectDevice::getProjectId, id)
            ));
        }
        return ProjectConvert.INSTANCE.toViewVo(project);
    }

    public Page<Project> listProjects(int page, int size, String projectName) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        if (projectName != null && !projectName.isEmpty()) {
            wrapper.like(Project::getProjectName, projectName);
        }
        wrapper.orderByDesc(Project::getCreateTime);
        return projectMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Transactional
    public Long createProject(ProjectDto dto) {
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
        project.setProvince(dto.getProvince());
        project.setCity(dto.getCity());
        project.setDroneCertificateUrl(dto.getDroneCertificateUrl());
        project.setSpecialOperationCertUrl(dto.getSpecialOperationCertUrl());
        project.setSectionIds(dto.getSectionIds());
        projectMapper.insert(project);

        if (dto.getDevices() != null) {
            for (ProjectDto.DeviceItem item : dto.getDevices()) {
                deviceMapper.insert(new InspectDevice(project.getId(), item.getDeviceName(), item.getDeviceModel()));
            }
        }

        return project.getId();
    }

    @Transactional
    public void updateProject(Long id, ProjectDto dto) {
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
        project.setProvince(dto.getProvince());
        project.setCity(dto.getCity());
        project.setDroneCertificateUrl(dto.getDroneCertificateUrl());
        project.setSpecialOperationCertUrl(dto.getSpecialOperationCertUrl());
        project.setSectionIds(dto.getSectionIds());
        projectMapper.updateById(project);

        // Sync devices: items with id → update, items without id → insert, missing ids → delete
        List<InspectDevice> existing = deviceMapper.selectList(
                new LambdaQueryWrapper<InspectDevice>().eq(InspectDevice::getProjectId, id)
        );
        Set<Long> existingIds = existing.stream().map(InspectDevice::getId).collect(Collectors.toSet());
        Set<Long> submittedIds = new HashSet<>();

        if (dto.getDevices() != null) {
            for (ProjectDto.DeviceItem item : dto.getDevices()) {
                if (item.getId() != null) {
                    submittedIds.add(item.getId());
                    InspectDevice d = deviceMapper.selectById(item.getId());
                    if (d != null && d.getProjectId().equals(id)) {
                        d.setDeviceName(item.getDeviceName());
                        d.setDeviceModel(item.getDeviceModel());
                        deviceMapper.updateById(d);
                    }
                } else {
                    deviceMapper.insert(new InspectDevice(id, item.getDeviceName(), item.getDeviceModel()));
                }
            }
        }

        existingIds.stream().filter(iid -> !submittedIds.contains(iid)).forEach(deviceMapper::deleteById);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        if (inverterMapper.countByProjectId(id) > 0) {
            throw new BusinessException("该项目下存在逆变器，请先删除");
        }

        projectMapper.deleteById(id);
        deviceMapper.delete(new LambdaQueryWrapper<InspectDevice>().eq(InspectDevice::getProjectId, id));
    }

    public Map<String, Object> getProjectStats(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        int inverterCount = inverterMapper.countByProjectId(id);
        int inspectedCount = inverterMapper.countInspectedByProjectId(id);
        int uninspectedCount = inverterCount - inspectedCount;
        double completionRate = inverterCount > 0 ? (inspectedCount * 100.0 / inverterCount) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("inverterCount", inverterCount);
        stats.put("inspectedCount", inspectedCount);
        stats.put("uninspectedCount", uninspectedCount);
        stats.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        stats.put("activePlan", null); // Will be populated when plans are implemented
        return stats;
    }


}
