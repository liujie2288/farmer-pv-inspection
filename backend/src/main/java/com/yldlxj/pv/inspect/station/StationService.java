package com.yldlxj.pv.inspect.station;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.enums.InspectStatus;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.StationConvert;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.project.ProjectService;
import com.yldlxj.pv.inspect.record.InspectRecord;
import com.yldlxj.pv.inspect.record.InspectRecordMapper;
import com.yldlxj.pv.inspect.record.dto.vo.RecordSimpleVo;
import com.yldlxj.pv.inspect.station.dto.StationDto;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationMapper stationMapper;
    private final ProjectMapper projectMapper;
    private final InspectRecordMapper inspectRecordMapper;
    private final InspectPlanMapper planMapper;

    private final UserService userService;
    private final ProjectService projectService;

    public PageDto<StationViewVo> listStations(Long projectId, int page, int size, String keyword, Integer inspectStatus) {
        PlanProjectViewVo activePlan = planMapper.findActiveByProjectId(projectId);
        int offset = (page - 1) * size;

        List<StationViewVo> records;
        long total;

        if (activePlan != null) {
            Long planProjectId = activePlan.getId();
            // 有活跃计划且筛选已巡检，但没有记录 → 直接返回空
            if (inspectStatus != null && inspectStatus == InspectStatus.INSPECTED.getCode()) {
                long recordCount = inspectRecordMapper.selectCount(
                        new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanProjectId, planProjectId)
                );
                if (recordCount == 0) {
                    return PageDto.of(Collections.emptyList(), 0, page, size);
                }
            }
            records = stationMapper.listByProjectId(projectId, planProjectId, keyword, inspectStatus, offset, size);
            total = stationMapper.countByProjectIdFiltered(projectId, planProjectId, keyword, inspectStatus);
        } else {
            // 无活跃计划：所有电站都是未巡检状态
            if (inspectStatus != null && inspectStatus == InspectStatus.INSPECTED.getCode()) {
                return PageDto.of(Collections.emptyList(), 0, page, size);
            }
            records = stationMapper.listByProjectIdNoPlan(projectId, keyword, offset, size);
            total = stationMapper.countByProjectIdFilteredNoPlan(projectId, keyword);
        }

        return PageDto.of(records, total, page, size);
    }

    public Long createStation(Long projectId, StationDto dto) {
        if (!projectService.existsById(projectId)) {
            throw new BusinessException("项目不存在");
        }
        checkStationCodeUnique(dto.getStationCode(), null);

        Station station = new Station();
        copyDtoToStation(dto, station);
        station.setProjectId(projectId);
        stationMapper.insert(station);
        return station.getId();
    }

    public void updateStation(Long projectId, Long id, StationDto dto) {
        if (!projectService.existsById(projectId)) {
            throw new BusinessException("项目不存在");
        }
        Station station = stationMapper.selectById(id);
        if (station == null || !station.getProjectId().equals(projectId)) {
            throw new BusinessException("电站不存在");
        }

        checkStationCodeUnique(dto.getStationCode(), id);
        copyDtoToStation(dto, station);
        stationMapper.updateById(station);
    }

    @Transactional
    public void deleteStation(Long projectId, Long id) {
        Station station = stationMapper.selectById(id);
        if (station == null || !station.getProjectId().equals(projectId)) {
            throw new BusinessException("电站不存在");
        }

        stationMapper.deleteById(id);
    }

    @Transactional
    public int batchDeleteStations(Long projectId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        LambdaQueryWrapper<Station> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Station::getProjectId, projectId).in(Station::getId, ids);
        return stationMapper.delete(wrapper);
    }

    public StationViewVo getStationDetail(Long projectId, Long stationId) {
        Station station = stationMapper.selectById(stationId);
        if (station == null || !station.getProjectId().equals(projectId)) {
            throw new BusinessException("电站不存在");
        }

        StationViewVo vo = StationConvert.INSTANCE.toViewVo(station);
        vo.setProjectName(projectService.getNameByProjectId(projectId));

        // 巡检状态：有进行中的计划且该电站有记录 → 已巡检(1)，否则 → 未巡检(0)
        PlanProjectViewVo activePlan = planMapper.findActiveByProjectId(projectId);
        if (activePlan != null) {
            Long recordCount = inspectRecordMapper.selectCount(
                    new LambdaQueryWrapper<InspectRecord>()
                            .eq(InspectRecord::getPlanProjectId, activePlan.getId())
                            .eq(InspectRecord::getStationId, stationId)
            );
            vo.setStatus(recordCount > 0 ? InspectStatus.INSPECTED : InspectStatus.UNINSPECTED);
        } else {
            vo.setStatus(InspectStatus.UNINSPECTED);
        }

        vo.setRecords(inspectRecordMapper.listByStationId(stationId));
        vo.getRecords().forEach(record -> record.setInspectorName(userService.findRealNameByUserId(record.getInspectorId())));

        return vo;
    }

    @Transactional
    public Map<String, Object> importStations(Long projectId, MultipartFile file) {
        if (!projectService.existsById(projectId)) {
            throw new BusinessException("项目不存在");
        }

        List<Map<String, Object>> errors = new ArrayList<>();
        int[] successCount = {0};
        int[] rowCount = {0};

        try (InputStream is = file.getInputStream()) {
            EasyExcel.read(is, new ReadListener<Map<Integer, String>>() {
                @Override
                public void invoke(Map<Integer, String> row, AnalysisContext context) {
                    rowCount[0]++;
                    try {
                        String stationCode = row.get(0);
                        String ownerName = row.get(1);
                        if (stationCode == null || stationCode.trim().isEmpty() || ownerName == null || ownerName.trim().isEmpty()) {
                            errors.add(Map.of("row", rowCount[0], "reason", "电站编号或户主姓名为空"));
                            return;
                        }

                        Long existing = stationMapper.selectCount(
                                new LambdaQueryWrapper<Station>().eq(Station::getStationCode, stationCode.trim())
                        );
                        if (existing > 0) {
                            errors.add(Map.of("row", rowCount[0], "reason", "电站编号已存在: " + stationCode));
                            return;
                        }

                        Station station = new Station();
                        station.setProjectId(projectId);
                        station.setStationCode(stationCode.trim());
                        station.setOwnerName(ownerName.trim());
                        station.setAddress(row.get(2) != null ? row.get(2).trim() : null);
                        station.setPowerAccount(row.get(3) != null ? row.get(3).trim() : null);
                        station.setInverterSn(row.get(4) != null ? row.get(4).trim() : null);
                        station.setInverterBrand(row.get(5) != null ? row.get(5).trim() : null);
                        station.setCapacityKw(row.get(6) != null ? new BigDecimal(row.get(6).trim().replaceAll("[^0-9.]", "")) : null);
                        station.setModuleCount(row.get(7) != null ? Integer.parseInt(row.get(7).trim()) : null);
                        station.setModuleSpec(row.get(8) != null ? row.get(8).trim() : null);
                        station.setLongitude(row.get(9) != null ? new BigDecimal(row.get(9).trim().replaceAll("[^0-9.]", "")) : null);
                        station.setLatitude(row.get(10) != null ? new BigDecimal(row.get(10).trim().replaceAll("[^0-9.]", "")) : null);
                        stationMapper.insert(station);
                        successCount[0]++;
                    } catch (Exception e) {
                        errors.add(Map.of("row", rowCount[0], "reason", "数据格式错误: " + e.getMessage()));
                    }
                }

                @Override
                public void doAfterAllAnalysed(AnalysisContext context) {}
            }).sheet().doRead();
        } catch (Exception e) {
            throw new BusinessException("Excel文件读取失败: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount[0]);
        result.put("failCount", errors.size());
        result.put("errors", errors);
        return result;
    }

    private void checkStationCodeUnique(String stationCode, Long excludeId) {
        LambdaQueryWrapper<Station> wrapper = new LambdaQueryWrapper<Station>()
                .eq(Station::getStationCode, stationCode);
        if (excludeId != null) {
            wrapper.ne(Station::getId, excludeId);
        }
        if (stationMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("电站编号已存在");
        }
    }

    private void copyDtoToStation(StationDto dto, Station station) {
        station.setStationCode(dto.getStationCode());
        station.setOwnerName(dto.getOwnerName());
        station.setAddress(dto.getAddress());
        station.setPowerAccount(dto.getPowerAccount());
        station.setInverterSn(dto.getInverterSn());
        station.setInverterBrand(dto.getInverterBrand());
        station.setModuleSpec(dto.getModuleSpec());
        station.setModuleCount(dto.getModuleCount());
        station.setCapacityKw(dto.getCapacityKw());
        station.setLongitude(dto.getLongitude());
        station.setLatitude(dto.getLatitude());
    }
}
