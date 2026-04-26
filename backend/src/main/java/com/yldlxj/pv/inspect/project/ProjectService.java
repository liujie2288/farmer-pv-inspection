package com.yldlxj.pv.inspect.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.convert.ProjectConvert;
import com.yldlxj.pv.inspect.device.InspectDevice;
import com.yldlxj.pv.inspect.device.InspectDeviceMapper;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.project.dto.ProjectDto;
import com.yldlxj.pv.inspect.project.dto.ProjectViewVo;
import com.yldlxj.pv.inspect.section.InspectSectionService;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final StationMapper stationMapper;
    private final InspectDeviceMapper deviceMapper;
    private final InspectSectionService sectionService;

    private final Cache<Long, String> projectNameCache = Caffeine.newBuilder()
            .expireAfterWrite(12, TimeUnit.HOURS)
            .maximumSize(256)
            .build();

    public boolean existsById(Long projectId) {
        return projectMapper.selectById(projectId) != null;
    }

    public String getNameByProjectId(Long projectId) {
        return projectNameCache.get(projectId, id -> {
            Project p = projectMapper.selectById(id);
            return p != null ? p.getProjectName() : null;
        });
    }

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
        wrapper.orderByDesc(Project::getId);
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
        projectNameCache.invalidate(id);

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

        if (stationMapper.countByProjectId(id) > 0) {
            throw new BusinessException("该项目下存在电站，请先删除");
        }

        projectMapper.deleteById(id);
        projectNameCache.invalidate(id);
        deviceMapper.delete(new LambdaQueryWrapper<InspectDevice>().eq(InspectDevice::getProjectId, id));
    }

    public List<SectionViewVo> getProjectSections(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null || project.getSectionIds() == null || project.getSectionIds().isBlank()) {
            return List.of();
        }
        Set<Long> ids = Arrays.stream(project.getSectionIds().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toSet());
        return sectionService.listSectionTree().stream()
                .filter(s -> ids.contains(s.getId()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getProjectStats(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        int stationCount = stationMapper.countByProjectId(id);

        Map<String, Object> stats = new HashMap<>();
        stats.put("stationCount", stationCount);
        stats.put("activePlan", null);
        return stats;
    }


}
