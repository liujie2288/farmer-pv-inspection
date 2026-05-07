package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.Constants;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import com.yldlxj.pv.inspect.common.enums.UserRole;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.plan.InspectPlanProjectMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.project.ProjectService;
import com.yldlxj.pv.inspect.record.dto.*;
import com.yldlxj.pv.inspect.record.dto.vo.*;
import com.yldlxj.pv.inspect.section.InspectSectionService;
import com.yldlxj.pv.inspect.storage.StorageService;
import com.yldlxj.pv.inspect.section.dto.SectionItemViewVo;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectRecordService {

    private final StationMapper stationMapper;
    private final InspectRecordMapper recordMapper;
    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;

    private final UserService userService;
    private final ProjectService projectService;
    private final StorageService storageService;
    private final InspectSectionService sectionService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public Long submitRecord(InspectRecordDto dto) {
        Long inspectorId = SecurityUtils.checkAndGetCurrentUserId();

        Station station = stationMapper.selectById(dto.getStationId());
        if (station == null || !station.getProjectId().equals(dto.getProjectId())) {
            throw new BusinessException("电站不存在");
        }

        PlanProjectViewVo planProject = planMapper.findActiveByProjectId(station.getProjectId());
        if (planProject == null) {
            throw new BusinessException("巡检任务不存在或已结束");
        } else if (planProject.getStatus() != PlanStatus.IN_PROGRESS) {
            throw new BusinessException("当前巡检任务未在进行中");
        }

        Long existing = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getPlanProjectId, planProject.getPlanProjectId())
                        .eq(InspectRecord::getStationId, dto.getStationId())
                        .eq(InspectRecord::getInspectorId, inspectorId)
                        .eq(InspectRecord::getStatus, 1)
        );
        if (existing > 0) {
            throw new BusinessException("您已提交过该电站的巡检记录");
        }

        InspectRecord record = new InspectRecord();
        record.setPlanId(planProject.getPlanId());
        record.setPlanProjectId(planProject.getPlanProjectId());
        record.setProjectId(dto.getProjectId());
        record.setStationId(dto.getStationId());
        record.setInspectorId(inspectorId);
        record.setWeather(dto.getWeather());
        record.setDeviceName(dto.getDeviceName());
        record.setDeviceModel(dto.getDeviceModel());
        record.setWatermarkConfig(dto.getWatermarkConfig());
        record.setChecklistResult(dto.getChecklistResult());
        record.setPhotos(convertPhotoUrls(dto.getPhotos()));
        record.setThermalImageUrl(stripOssHost(dto.getThermalImageUrl()));
        record.setLongitude(station.getLongitude());
        record.setLatitude(station.getLatitude());
        recordMapper.insert(record);

        // 更新电站最后巡检记录
        stationMapper.updateLastInspectRecordId(station.getId(), record.getId());

        // 更新已巡检数量
        planProjectMapper.updateInspectedCount(planProject.getPlanProjectId());
        planMapper.updateInspectedCount(planProject.getPlanId());

        return record.getId();
    }

    @Transactional
    public void updateRecord(Long id, InspectRecordDto dto) {
        InspectRecord record = recordMapper.selectById(id);

        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }

        SysUser currentUser = SecurityUtils.getCurrentUser();
        if (!canEditRecord(record, currentUser)) {
            throw new BusinessException("当前无权修改该巡检记录");
        }

        int oldStatus = record.getStatus() == null ? 0 : record.getStatus();

        record.cleanPdf();
        record.setStatus(1);
        record.setWeather(dto.getWeather());
        record.setDeviceName(dto.getDeviceName());
        record.setDeviceModel(dto.getDeviceModel());
        record.setWatermarkConfig(dto.getWatermarkConfig());
        record.setChecklistResult(dto.getChecklistResult());
        record.setPhotos(convertPhotoUrls(dto.getPhotos()));
        record.setThermalImageUrl(stripOssHost(dto.getThermalImageUrl()));
        if (dto.getLongitude() != null) record.setLongitude(dto.getLongitude());
        if (dto.getLatitude() != null) record.setLatitude(dto.getLatitude());
        recordMapper.updateById(record);

        if (oldStatus != 1) {
            planProjectMapper.updateInspectedCount(record.getPlanProjectId());
            planMapper.updateInspectedCount(record.getPlanId());
        }
    }

    public RecordDetailVo getRecordDetail(Long id) {
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }

        InspectPlan plan = planMapper.selectById(record.getPlanId());
        Station station = stationMapper.selectById(record.getStationId());

        SysUser currentUser = SecurityUtils.getCurrentUser();

        RecordDetailVo vo = new RecordDetailVo();
        vo.setId(record.getId());
        vo.setPlanName(plan != null ? plan.getPlanName() : null);
        vo.setPlanStatus(plan != null ? plan.getStatus().getCode() : null);
        vo.setStationId(station != null ? station.getId() : null);
        vo.setStationName(station != null ? station.getOwnerName() : null);
        vo.setStationCode(station != null ? station.getStationCode() : null);
        vo.setProjectId(record.getProjectId());
        vo.setProjectName(projectService.getNameByProjectId(record.getProjectId()));
        vo.setInspectorName(userService.findRealNameByUserId(record.getInspectorId()));
        vo.setChecklistResult(buildChecklistVo(record.getChecklistResult()));
        vo.setPhotos(buildPhotoVo(record.getPhotos(), "small", null));
        if (record.getThermalImageUrl() != null && !record.getThermalImageUrl().isEmpty()) {
            vo.setThermalImageUrl(storageService.getImageUrl(record.getThermalImageUrl(), 100, "small"));
        }
        vo.setLongitude(record.getLongitude());
        vo.setLatitude(record.getLatitude());
        vo.setWeather(record.getWeather());
        vo.setDeviceName(record.getDeviceName());
        vo.setDeviceModel(record.getDeviceModel());
        vo.setCreateTime(record.getCreateTime());
        vo.setEditDeadline(record.getEditDeadline());
        vo.setStatus(record.getStatus());
        vo.setRejectReason(record.getRejectReason());
        vo.setWatermarkConfig(record.getWatermarkConfig());
        vo.setCanEdit(canEditRecord(record, plan, currentUser));
        if (record.getPdfUrl() != null && !record.getPdfUrl().isEmpty()) {
            vo.setPdfUrl(storageService.getPresignedUrl(record.getPdfUrl(), 100));
        }
        return vo;
    }

    public RecordDetailVo getReportDetail(Long id) {
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }


        RecordDetailVo vo = new RecordDetailVo();
        vo.setId(record.getId());
        vo.setStationId(record.getStationId());
        vo.setProjectId(record.getProjectId());
        vo.setProjectName(projectService.getNameByProjectId(record.getProjectId()));
        vo.setInspectorName(userService.findRealNameByUserId(record.getInspectorId()));
        vo.setChecklistResult(buildChecklistVo(record.getChecklistResult()));
        vo.setLongitude(record.getLongitude());
        vo.setLatitude(record.getLatitude());
        vo.setWeather(record.getWeather());
        vo.setDeviceName(record.getDeviceName());
        vo.setDeviceModel(record.getDeviceModel());
        vo.setRejectReason(record.getRejectReason());
        vo.setCreateTime(record.getCreateTime());
        vo.setStatus(record.getStatus());

        WatermarkConfigDto configDto = record.getWatermarkConfig();
        vo.setWatermarkConfig(configDto);

        List<String> watermarks = new ArrayList<>();

        if (configDto != null && configDto.hasField(Constants.WM_PROJECT_NAME)) {
            watermarks.add("项目：" + projectService.getNameByProjectId(record.getProjectId()));
        }
        if (configDto != null && configDto.hasField(Constants.WM_OWNER_NAME)) {
            Station station = stationMapper.selectById(record.getStationId());
            watermarks.add("户主：" + (station == null ? "" : station.getOwnerName()));
        }
        if (configDto != null && configDto.hasField(Constants.WM_COORDINATES)) {
            if (record.getLatitude() != null && record.getLongitude() != null) {
                watermarks.add(formatLatLng(record.getLatitude(), record.getLongitude()));
            }
        }
        if (configDto != null && configDto.hasField(Constants.WM_TIMESTAMP)) {
            watermarks.add("时间：" + DATE_TIME_FORMATTER.format(record.getCreateTime()));
        }
        if (configDto != null && configDto.getCustomTexts() != null) {
            configDto.getCustomTexts().forEach(text -> watermarks.add("备注：" + text));
        }

        vo.setPhotos(buildPhotoVo(record.getPhotos(), null, watermarks));

        if (vo.getChecklistResult() != null && vo.getPhotos() != null) {
            Map<Long, List<PhotoItemVo>> photoMap = vo.getPhotos().stream().collect(Collectors.toMap(i -> i.getSectionId(), i -> i.getItems()));
            for (ChecklistSectionVo checklist : vo.getChecklistResult()) {
                checklist.setPhotos(photoMap.get(checklist.getSectionId()));
            }
        }

        if (record.getThermalImageUrl() != null && !record.getThermalImageUrl().isEmpty()) {
            vo.setThermalImageUrl(storageService.getImageUrl(record.getThermalImageUrl(), 100, "large"));
        }


        return vo;
    }

    public PageDto<RecordSimpleVo> listRecords(Long stationId, Long planId, String keyword, Integer status, int page, int size) {
        SysUser currentUser = SecurityUtils.getCurrentUser();
        boolean isInspector = currentUser != null && UserRole.INSPECTOR == currentUser.getRole();
        Long inspectorId = isInspector ? currentUser.getId() : null;

        long total = recordMapper.countRecords(stationId, planId, keyword, status, inspectorId);
        List<RecordSimpleVo> records = recordMapper.listRecords(stationId, planId, keyword, status, inspectorId, (page - 1) * size, size);

        records.forEach(vo -> vo.setCanEdit(canEditSimpleRecord(vo, currentUser)));

        return PageDto.of(records, total, page, size);
    }

    public Long findMyRejectedRecord(Long stationId, Long planProjectId) {
        Long inspectorId = SecurityUtils.checkAndGetCurrentUserId();
        InspectRecord record = recordMapper.selectOne(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getStationId, stationId)
                        .eq(InspectRecord::getPlanProjectId, planProjectId)
                        .eq(InspectRecord::getInspectorId, inspectorId)
                        .eq(InspectRecord::getStatus, 2)
                        .orderByDesc(InspectRecord::getId)
                        .last("LIMIT 1")
        );
        return record != null ? record.getId() : null;
    }

    public void extendDeadline(Long id) {
        SysUser currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null || currentUser.getRole() != UserRole.ADMIN) {
            throw new BusinessException("仅管理员可操作");
        }
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        InspectPlan plan = planMapper.selectById(record.getPlanId());
        if (plan == null || plan.getStatus() != PlanStatus.IN_PROGRESS) {
            throw new BusinessException("巡检任务已结束，无法开放编辑");
        }
        recordMapper.updateEditDeadline(id, LocalDateTime.now().plusDays(2));
    }

    @Transactional
    public void rejectRecord(Long id, String reason) {
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        if (record.getStatus() == null || record.getStatus() != 1) {
            throw new BusinessException("只能驳回已提交的记录");
        }

        record.setStatus(2);
        record.setRejectReason(reason);
        recordMapper.updateById(record);

        // 重新计算 planProject inspectedCount
        planProjectMapper.updateInspectedCount(record.getPlanProjectId());

        // 重新计算 plan inspectedCount
        planMapper.updateInspectedCount(record.getPlanId());

        // 处理 station lastInspectRecordId：重新查该 station 的最新 status=1 记录
        InspectRecord latestApproved = recordMapper.selectOne(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getStationId, record.getStationId())
                        .eq(InspectRecord::getStatus, 1)
                        .orderByDesc(InspectRecord::getId)
                        .last("LIMIT 1")
        );
        stationMapper.updateLastInspectRecordId(record.getStationId(),
                latestApproved != null ? latestApproved.getId() : null);
    }

    private boolean canEditRecord(InspectRecord record, SysUser currentUser) {
        InspectPlan plan = planMapper.selectById(record.getPlanId());
        return canEditRecord(record, plan, currentUser);
    }

    private boolean canEditRecord(InspectRecord record, InspectPlan plan, SysUser currentUser) {
        if (plan == null || plan.getStatus() != PlanStatus.IN_PROGRESS) {
            return false;
        }
        if (currentUser == null) {
            return false;
        }
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }
        LocalDateTime now = LocalDateTime.now();
        if (record.getEditDeadline() != null && !now.isAfter(record.getEditDeadline())) {
            return true;
        }
        if (record.getInspectorId().equals(currentUser.getId())) {
            if (record.getStatus() == 2) {
                return true;
            } else if (record.getCreateTime() != null && !now.isAfter(record.getCreateTime().plusDays(2))) {
                return true;
            }
        }
        return false;
    }

    private boolean canEditSimpleRecord(RecordSimpleVo vo, SysUser currentUser) {
        if (vo.getPlanStatus() == null || vo.getPlanStatus() != PlanStatus.IN_PROGRESS.getCode()) {
            return false;
        }
        if (currentUser == null) {
            return false;
        }
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }
        LocalDateTime now = LocalDateTime.now();
        if (vo.getEditDeadline() != null && !now.isAfter(vo.getEditDeadline())) {
            return true;
        }
        if (vo.getInspectorId().equals(currentUser.getId())
                && vo.getInspectorTime() != null
                && !now.isAfter(vo.getInspectorTime().plusDays(2))) {
            return true;
        }
        return false;
    }

    private List<ChecklistSectionVo> buildChecklistVo(List<ChecklistSectionDto> sections) {
        if (sections == null) return Collections.emptyList();
        List<ChecklistSectionVo> result = new ArrayList<>();
        for (ChecklistSectionDto dto : sections) {
            ChecklistSectionVo vo = new ChecklistSectionVo();
            vo.setSectionId(dto.getSectionId());

            SectionViewVo section = sectionService.getSectionBySectionId(dto.getSectionId());
            if (section != null) {
                vo.setSectionName(section.getSectionName());
                vo.setSectionNo(section.getSectionNo());
            }

            if (dto.getItems() != null) {
                List<ChecklistItemVo> itemVos = new ArrayList<>();
                for (ChecklistItemDto item : dto.getItems()) {
                    ChecklistItemVo itemVo = new ChecklistItemVo();
                    itemVo.setItemId(item.getItemId());
                    itemVo.setResult(item.getResult());
                    itemVo.setRemark(item.getRemark());
                    itemVo.setValue(item.getValue());

                    SectionItemViewVo templateItem = sectionService.getSectionItemByItemId(item.getItemId());
                    if (templateItem != null) {
                        itemVo.setItemNo(templateItem.getItemNo());
                        itemVo.setCategory(templateItem.getCategory());
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

    private List<PhotoSectionVo> buildPhotoVo(List<PhotoSectionDto> photos, String style, List<String> watermarks) {
        if (photos == null) return Collections.emptyList();
        List<PhotoSectionVo> result = new ArrayList<>();
        for (PhotoSectionDto dto : photos) {
            PhotoSectionVo vo = new PhotoSectionVo(dto.getSectionId());
            vo.setSectionName(sectionService.getSectionNameBySectionId(dto.getSectionId()));

            if (dto.getItems() != null) {
                List<PhotoItemVo> itemVos = new ArrayList<>();
                for (PhotoItemDto item : dto.getItems()) {
                    PhotoItemVo itemVo = new PhotoItemVo(item.getItemId(), item.getItemName());
                    Optional.ofNullable(sectionService.getSectionItemByItemId(item.getItemId())).map(SectionItemViewVo::getContent).ifPresent(itemVo::setItemName);
                    if (style != null || watermarks == null) {
                        itemVo.setUrls(item.getUrls().stream()
                                .map(url -> storageService.getImageUrl(url, 100, style))
                                .collect(Collectors.toList()));
                    } else {
                        itemVo.setUrls(item.getUrls().stream()
                                .map(url -> storageService.getWatermarkedImageUrl(url, 100, watermarks))
                                .collect(Collectors.toList()));
                    }

                    itemVos.add(itemVo);
                }
                vo.setItems(itemVos);
            }
            result.add(vo);
        }
        return result;
    }

    /**
     * 格式化经纬度为：30.23°N 120.34°E
     * 保留2位小数，中国默认 N、E
     */
    private String formatLatLng(BigDecimal latitude, BigDecimal longitude) {
        // 保留2位小数，四舍五入
        String latStr = latitude.setScale(2, RoundingMode.HALF_UP).toPlainString();
        String lngStr = longitude.setScale(2, RoundingMode.HALF_UP).toPlainString();

        return String.format("位置：%s°N  %s°E", latStr, lngStr);
    }

    private List<PhotoSectionDto> convertPhotoUrls(List<PhotoSectionDto> photos) {
        if (photos == null) return null;
        for (PhotoSectionDto section : photos) {
            if (section.getItems() == null) continue;
            for (PhotoItemDto item : section.getItems()) {
                if (item.getUrls() == null) continue;
                item.setUrls(item.getUrls().stream()
                        .map(this::stripOssHost)
                        .collect(Collectors.toList()));
            }
        }
        return photos;
    }

    private String stripOssHost(String url) {
        if (url == null || !url.startsWith("http")) return url;
        String key = storageService.extractObjectKey(url);
        return key != null ? key : url;
    }
}
