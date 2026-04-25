package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.auth.AuthService;
import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.common.exception.ForbiddenException;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.plan.InspectPlanProject;
import com.yldlxj.pv.inspect.plan.InspectPlanProjectMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.record.dto.ChecklistSectionDto;
import com.yldlxj.pv.inspect.record.dto.InspectRecordDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import com.yldlxj.pv.inspect.record.dto.vo.*;
import com.yldlxj.pv.inspect.section.InspectSection;
import com.yldlxj.pv.inspect.section.InspectSectionItem;
import com.yldlxj.pv.inspect.section.InspectSectionItemMapper;
import com.yldlxj.pv.inspect.section.InspectSectionMapper;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.storage.StorageService;
import com.yldlxj.pv.inspect.storage.WatermarkService;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectRecordService {

    private final InspectRecordMapper recordMapper;
    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;
    private final StationMapper stationMapper;
    private final SysUserMapper userMapper;
    private final ProjectMapper projectMapper;
    private final InspectSectionMapper sectionMapper;
    private final InspectSectionItemMapper sectionItemMapper;
    private final AuthService authService;
    private final StorageService storageService;
    private final WatermarkService watermarkService;

    @Transactional
    public Long submitRecord(InspectRecordDto dto) {
        Long inspectorId = SecurityUtils.getCurrentUserId();

        Station station = stationMapper.selectById(dto.getStationId());
        if (station == null || !station.getProjectId().equals(dto.getProjectId())) {
            throw new BusinessException("电站不存在");
        }

        PlanProjectViewVo planProject = planMapper.findActiveByProjectId(station.getProjectId());
        if (planProject == null) {
            throw new BusinessException("巡检计划不存在或已结束");
        } else if (planProject.getStatus() != PlanStatus.IN_PROGRESS) {
            throw new BusinessException("当前巡检计划未在进行中");
        }

        Long existing = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getPlanProjectId, planProject.getId())
                        .eq(InspectRecord::getStationId, dto.getStationId())
                        .eq(InspectRecord::getInspectorId, inspectorId)
        );
        if (existing > 0) {
            throw new BusinessException("您已提交过该电站的巡检记录");
        }

        InspectRecord record = new InspectRecord();
        record.setPlanId(planProject.getPlanId());
        record.setPlanProjectId(planProject.getId());
        record.setProjectId(dto.getProjectId());
        record.setStationId(dto.getStationId());
        record.setInspectorId(inspectorId);
        record.setWeather(dto.getWeather());
        record.setChecklistResult(dto.getChecklistResult());
        record.setPhotos(dto.getPhotos());
        record.setLongitude(dto.getLongitude());
        record.setLatitude(dto.getLatitude());
        recordMapper.insert(record);

        // 更新电站最后巡检记录
        stationMapper.updateLastInspectRecordId(station.getId(), record.getId());

        // 更新已巡检数量
        Long inspectedCount1 = recordMapper.selectCount(new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanProjectId, planProject.getId()));
        planProjectMapper.updateInspectedCount(planProject.getId(), inspectedCount1);

        Long inspectedCount2 = recordMapper.selectCount(new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanId, planProject.getPlanId()));
        planMapper.updateInspectedCount(planProject.getPlanId(), inspectedCount2);

        return record.getId();
    }

    @Transactional
    public void updateRecord(Long id, InspectRecordDto dto) {
        Long inspectorId = authService.getCurrentUserId();
        InspectRecord record = recordMapper.selectById(id);

        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        if (!record.getInspectorId().equals(inspectorId)) {
            throw new ForbiddenException("只能修改本人的巡检记录");
        }

        InspectPlan plan = planMapper.selectById(record.getPlanId());
        if (plan != null && plan.getStatus() == PlanStatus.FINISHED) {
            throw new BusinessException("巡检计划已结束，记录不可修改");
        }

        if (dto.getWeather() != null) record.setWeather(dto.getWeather());
        if (dto.getChecklistResult() != null) record.setChecklistResult(dto.getChecklistResult());
        if (dto.getPhotos() != null) record.setPhotos(dto.getPhotos());
        if (dto.getLongitude() != null) record.setLongitude(dto.getLongitude());
        if (dto.getLatitude() != null) record.setLatitude(dto.getLatitude());
        recordMapper.updateById(record);
    }

    public RecordDetailVo getRecordDetail(Long id) {
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }

        InspectPlan plan = planMapper.selectById(record.getPlanId());
        Station station = stationMapper.selectById(record.getStationId());
        SysUser inspector = userMapper.selectById(record.getInspectorId());

        Long currentUserId = authService.getCurrentUserId();
        boolean canEdit = record.getInspectorId().equals(currentUserId) && plan != null && plan.getStatus() == PlanStatus.IN_PROGRESS;

        // Lookup template data
        Map<Long, InspectSection> sectionMap = sectionMapper.selectList(null).stream()
                .collect(Collectors.toMap(InspectSection::getId, Function.identity()));
        Map<Long, InspectSectionItem> itemMap = sectionItemMapper.selectList(null).stream()
                .collect(Collectors.toMap(InspectSectionItem::getId, Function.identity()));

        // Build enriched checklistResult
        List<ChecklistSectionVo> checklistVo = buildChecklistVo(record.getChecklistResult(), sectionMap, itemMap);

        // Build enriched photos
        List<PhotoSectionVo> photoVo = buildPhotoVo(record.getPhotos(), sectionMap);

        RecordDetailVo vo = new RecordDetailVo();
        vo.setId(record.getId());
        vo.setPlanName(plan != null ? plan.getPlanName() : "");
        vo.setStationName(station != null ? station.getOwnerName() : "");
        vo.setStationCode(station != null ? station.getStationCode() : "");
        vo.setProjectName(getProjectName(record.getProjectId()));
        vo.setInspectorName(inspector != null ? inspector.getRealName() : "");
        vo.setChecklistResult(checklistVo);
        vo.setPhotos(photoVo);
        vo.setLongitude(record.getLongitude());
        vo.setLatitude(record.getLatitude());
        vo.setWeather(record.getWeather());
        vo.setCreateTime(record.getCreateTime());
        vo.setCanEdit(canEdit);
        return vo;
    }

    public IPage<Map<String, Object>> listRecords(Long stationId, Long planId, String keyword, Integer status, int page, int size) {
        Long currentUserId = authService.getCurrentUserId();
        SysUser currentUser = userMapper.selectById(currentUserId);
        boolean isInspector = currentUser != null && "inspector".equals(currentUser.getRole());

        LambdaQueryWrapper<InspectRecord> wrapper = new LambdaQueryWrapper<>();
        if (stationId != null && stationId > 0) {
            wrapper.eq(InspectRecord::getStationId, stationId);
        }
        if (planId != null) {
            wrapper.eq(InspectRecord::getPlanId, planId);
        }

        if (status != null) {
            List<InspectPlan> statusPlans = planMapper.selectList(
                    new LambdaQueryWrapper<InspectPlan>().eq(InspectPlan::getStatus, status));
            List<Long> statusPlanIds = statusPlans.stream().map(InspectPlan::getId).toList();
            if (statusPlanIds.isEmpty()) {
                Page<Map<String, Object>> emptyPage = new Page<>(page, size, 0);
                emptyPage.setRecords(Collections.emptyList());
                return emptyPage;
            }
            wrapper.in(InspectRecord::getPlanId, statusPlanIds);
        }

        if (keyword != null && !keyword.isBlank()) {
            List<Long> matchedPlanIds = planMapper.selectList(
                            new LambdaQueryWrapper<InspectPlan>().like(InspectPlan::getPlanName, keyword))
                    .stream().map(InspectPlan::getId).toList();
            List<Long> matchedInspectorIds = userMapper.selectList(
                            new LambdaQueryWrapper<SysUser>().like(SysUser::getRealName, keyword))
                    .stream().map(SysUser::getId).toList();
            List<Long> matchedStationIds = stationMapper.selectList(
                            new LambdaQueryWrapper<Station>().like(Station::getOwnerName, keyword))
                    .stream().map(Station::getId).toList();

            if (matchedPlanIds.isEmpty() && matchedInspectorIds.isEmpty() && matchedStationIds.isEmpty()) {
                Page<Map<String, Object>> emptyPage = new Page<>(page, size, 0);
                emptyPage.setRecords(Collections.emptyList());
                return emptyPage;
            }
            wrapper.and(w -> {
                if (!matchedPlanIds.isEmpty()) {
                    w.in(InspectRecord::getPlanId, matchedPlanIds);
                }
                if (!matchedInspectorIds.isEmpty()) {
                    if (!matchedPlanIds.isEmpty()) w.or();
                    w.in(InspectRecord::getInspectorId, matchedInspectorIds);
                }
                if (!matchedStationIds.isEmpty()) {
                    if (!matchedPlanIds.isEmpty() || !matchedInspectorIds.isEmpty()) w.or();
                    w.in(InspectRecord::getStationId, matchedStationIds);
                }
            });
        }

        if (isInspector) {
            wrapper.eq(InspectRecord::getInspectorId, currentUserId);
        }
        wrapper.orderByDesc(InspectRecord::getCreateTime);

        IPage<InspectRecord> recordPage = recordMapper.selectPage(new Page<>(page, size), wrapper);

        Page<Map<String, Object>> resultPage = new Page<>(recordPage.getCurrent(), recordPage.getSize(), recordPage.getTotal());
        List<Map<String, Object>> records = new ArrayList<>();
        for (InspectRecord r : recordPage.getRecords()) {
            InspectPlan plan = planMapper.selectById(r.getPlanId());
            SysUser inspector = userMapper.selectById(r.getInspectorId());
            Station station = stationMapper.selectById(r.getStationId());
            boolean canEdit = r.getInspectorId().equals(currentUserId) && plan != null && plan.getStatus() == PlanStatus.IN_PROGRESS;

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("planName", plan != null ? plan.getPlanName() : "");
            map.put("stationName", station != null ? station.getOwnerName() : "");
            map.put("projectName", getProjectName(r.getProjectId()));
            map.put("createTime", r.getCreateTime());
            map.put("inspectorName", inspector != null ? inspector.getRealName() : "");
            map.put("canEdit", canEdit);
            map.put("planStatus", plan != null ? plan.getStatus() : null);
            records.add(map);
        }
        resultPage.setRecords(records);
        return resultPage;
    }

    public String uploadPhoto(MultipartFile file, Integer sectionId,
                              Double longitude, Double latitude) {
        Long inspectorId = authService.getCurrentUserId();
        SysUser inspector = userMapper.selectById(inspectorId);

        try {
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String coordinates = "";
            if (longitude != null && latitude != null && (longitude != 0 || latitude != 0)) {
                coordinates = String.format("%.6f, %.6f", longitude, latitude);
            }
            java.io.InputStream watermarked = watermarkService.addWatermark(
                    new ByteArrayInputStream(file.getBytes()),
                    inspector != null ? inspector.getRealName() : "未知",
                    timeStr,
                    coordinates
            );

            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : ".jpg";
            String objectName = "inspection/" + sectionId + "/" + UUID.randomUUID() + ext;

            byte[] watermarkedBytes = watermarked.readAllBytes();
            return storageService.upload(objectName,
                    new ByteArrayInputStream(watermarkedBytes),
                    watermarkedBytes.length,
                    file.getContentType());
        } catch (Exception e) {
            throw new BusinessException("照片上传失败: " + e.getMessage());
        }
    }

    private List<ChecklistSectionVo> buildChecklistVo(List<ChecklistSectionDto> sections,
                                                      Map<Long, InspectSection> sectionMap,
                                                      Map<Long, InspectSectionItem> itemMap) {
        if (sections == null) return Collections.emptyList();
        List<ChecklistSectionVo> result = new ArrayList<>();
        for (ChecklistSectionDto dto : sections) {
            ChecklistSectionVo vo = new ChecklistSectionVo();
            vo.setSectionId(dto.getSectionId());

            InspectSection section = sectionMap.get(dto.getSectionId());
            if (section != null) {
                vo.setSectionName(section.getSectionName());
                vo.setSectionNo(section.getSectionNo());
            }

            if (dto.getItems() != null) {
                List<ChecklistItemVo> itemVos = new ArrayList<>();
                for (com.yldlxj.pv.inspect.record.dto.ChecklistItemDto item : dto.getItems()) {
                    ChecklistItemVo itemVo = new ChecklistItemVo();
                    itemVo.setItemId(item.getItemId());
                    itemVo.setResult(item.getResult());
                    itemVo.setRemark(item.getRemark());
                    itemVo.setValue(item.getValue());

                    InspectSectionItem templateItem = itemMap.get(item.getItemId());
                    if (templateItem != null) {
                        itemVo.setItemNo(templateItem.getItemNo());
                        itemVo.setContent(templateItem.getContent());
                        itemVo.setItemType(templateItem.getItemType() != null ? templateItem.getItemType().getCode() : null);
                    }
                    itemVos.add(itemVo);
                }
                vo.setItems(itemVos);
            }
            result.add(vo);
        }
        return result;
    }

    private List<PhotoSectionVo> buildPhotoVo(List<PhotoSectionDto> photos,
                                              Map<Long, InspectSection> sectionMap) {
        if (photos == null) return Collections.emptyList();
        List<PhotoSectionVo> result = new ArrayList<>();
        for (PhotoSectionDto dto : photos) {
            PhotoSectionVo vo = new PhotoSectionVo();
            vo.setSectionId(dto.getSectionId());

            InspectSection section = sectionMap.get(dto.getSectionId());
            if (section != null) {
                vo.setSectionName(section.getSectionName());
            }

            if (dto.getItems() != null) {
                List<PhotoItemVo> itemVos = new ArrayList<>();
                for (com.yldlxj.pv.inspect.record.dto.PhotoItemDto item : dto.getItems()) {
                    PhotoItemVo itemVo = new PhotoItemVo();
                    itemVo.setItemId(item.getItemId());
                    itemVo.setUrls(item.getUrls());
                    itemVos.add(itemVo);
                }
                vo.setItems(itemVos);
            }
            result.add(vo);
        }
        return result;
    }

    private String getProjectName(Long projectId) {
        if (projectId == null) return "";
        Project p = projectMapper.selectById(projectId);
        return p != null ? p.getProjectName() : "";
    }
}
