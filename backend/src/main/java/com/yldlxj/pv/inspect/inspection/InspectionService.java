package com.yldlxj.pv.inspect.inspection;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.auth.AuthService;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.common.ForbiddenException;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.plan.InspectPlanProject;
import com.yldlxj.pv.inspect.plan.InspectPlanProjectMapper;
import com.yldlxj.pv.inspect.storage.StorageService;
import com.yldlxj.pv.inspect.storage.WatermarkService;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.SysUserMapper;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectRecordMapper recordMapper;
    private final InspectPlanMapper planMapper;
    private final InspectPlanProjectMapper planProjectMapper;
    private final StationMapper stationMapper;
    private final SysUserMapper userMapper;
    private final ProjectMapper projectMapper;
    private final AuthService authService;
    private final StorageService storageService;
    private final WatermarkService watermarkService;

    @Transactional
    public Long submitRecord(Long planId, Long stationId, Long projectId,
                              Map<String, Object> checklistResult,
                              Map<String, Object> photos,
                              BigDecimal longitude, BigDecimal latitude) {
        Long inspectorId = authService.getCurrentUserId();

        // Validate plan is active
        InspectPlan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("巡检计划不存在");
        }
        if (plan.getStatus() != 1) {
            throw new BusinessException("当前巡检计划未在进行中");
        }

        // Validate station exists in project
        Station station = stationMapper.selectById(stationId);
        if (station == null || !station.getProjectId().equals(projectId)) {
            throw new BusinessException("电站不存在");
        }

        // Check duplicate
        Long existing = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getPlanId, planId)
                        .eq(InspectRecord::getStationId, stationId)
                        .eq(InspectRecord::getInspectorId, inspectorId)
        );
        if (existing > 0) {
            throw new BusinessException("您已提交过该电站的巡检记录");
        }

        InspectRecord record = new InspectRecord();
        record.setPlanId(planId);
        record.setStationId(stationId);
        record.setInspectorId(inspectorId);
        record.setProjectId(projectId);
        record.setChecklistResult(checklistResult);
        record.setPhotos(photos);
        record.setLongitude(longitude);
        record.setLatitude(latitude);
        recordMapper.insert(record);

        // Cascade status update
        updateStationStatus(stationId, inspectorId);
        updatePlanInspectedCount(planId, stationId);

        return record.getId();
    }

    @Transactional
    public void updateRecord(Long id, Map<String, Object> checklistResult,
                              Map<String, Object> photos,
                              BigDecimal longitude, BigDecimal latitude) {
        Long inspectorId = authService.getCurrentUserId();
        InspectRecord record = recordMapper.selectById(id);

        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        if (!record.getInspectorId().equals(inspectorId)) {
            throw new ForbiddenException("只能修改本人的巡检记录");
        }

        // Check plan is still active
        InspectPlan plan = planMapper.selectById(record.getPlanId());
        if (plan != null && plan.getStatus() == 2) {
            throw new BusinessException("巡检计划已结束，记录不可修改");
        }

        record.setChecklistResult(checklistResult);
        record.setPhotos(photos);
        record.setLongitude(longitude);
        record.setLatitude(latitude);
        recordMapper.updateById(record);
    }

    public Map<String, Object> getRecordDetail(Long id) {
        InspectRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }

        InspectPlan plan = planMapper.selectById(record.getPlanId());
        Station station = stationMapper.selectById(record.getStationId());
        SysUser inspector = userMapper.selectById(record.getInspectorId());

        Long currentUserId = authService.getCurrentUserId();
        boolean canEdit = record.getInspectorId().equals(currentUserId) && plan != null && plan.getStatus() == 1;

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("id", record.getId());
        detail.put("planName", plan != null ? plan.getPlanName() : "");
        detail.put("stationName", station != null ? station.getOwnerName() : "");
        detail.put("stationCode", station != null ? station.getStationCode() : "");
        detail.put("projectName", getProjectName(record.getProjectId()));
        detail.put("inspectorName", inspector != null ? inspector.getRealName() : "");
        detail.put("checklistResult", record.getChecklistResult());
        detail.put("photos", record.getPhotos());
        detail.put("longitude", record.getLongitude());
        detail.put("latitude", record.getLatitude());
        detail.put("createTime", record.getCreateTime());
        detail.put("canEdit", canEdit);
        return detail;
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

        // Status filter: filter by plan status (1=进行中, 2=已结束)
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

        // Keyword search across plan name, inspector name, station name
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
            boolean canEdit = r.getInspectorId().equals(currentUserId) && plan != null && plan.getStatus() == 1;

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("planName", plan != null ? plan.getPlanName() : "");
            map.put("stationName", station != null ? station.getOwnerName() : "");
            map.put("projectName", getProjectName(r.getProjectId()));
            map.put("createTime", r.getCreateTime());
            map.put("inspectorName", inspector != null ? inspector.getRealName() : "");
            map.put("canEdit", canEdit);
            map.put("planStatus", plan != null ? plan.getStatus() : 0);
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
            // Apply watermark
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

    private void updateStationStatus(Long stationId, Long inspectorId) {
        Station station = stationMapper.selectById(stationId);
        if (station != null) {
            station.setLastInspectTime(LocalDateTime.now());
            station.setLastInspectorId(inspectorId);
            stationMapper.updateById(station);
        }
    }

    private void updatePlanInspectedCount(Long planId, Long stationId) {
        Station station = stationMapper.selectById(stationId);
        if (station == null) return;

        // Update plan_project level
        InspectPlanProject pp = planProjectMapper.selectOne(
                new LambdaQueryWrapper<InspectPlanProject>()
                        .eq(InspectPlanProject::getPlanId, planId)
                        .eq(InspectPlanProject::getProjectId, station.getProjectId())
        );
        if (pp != null) {
            Long count = recordMapper.selectCount(
                    new LambdaQueryWrapper<InspectRecord>()
                            .eq(InspectRecord::getPlanId, planId)
                            .in(InspectRecord::getStationId,
                                    stationMapper.selectList(new LambdaQueryWrapper<Station>()
                                            .eq(Station::getProjectId, pp.getProjectId()))
                                            .stream().map(Station::getId).toList())
            );
            pp.setInspectedCount(count.intValue());
            planProjectMapper.updateById(pp);
        }

        // Update plan total
        InspectPlan plan = planMapper.selectById(planId);
        if (plan != null) {
            Long totalCount = recordMapper.selectCount(
                    new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanId, planId)
            );
            plan.setInspectedCount(totalCount.intValue());
            planMapper.updateById(plan);
        }
    }

    private String getProjectName(Long projectId) {
        if (projectId == null) return "";
        Project p = projectMapper.selectById(projectId);
        return p != null ? p.getProjectName() : "";
    }
}
