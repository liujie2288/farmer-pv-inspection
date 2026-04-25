package com.yldlxj.pv.inspect.station;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.StationConvert;
import com.yldlxj.pv.inspect.station.dto.StationDto;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
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

    public PageDto<StationViewVo> listStations(Long projectId, int page, int size, String keyword) {
        LambdaQueryWrapper<Station> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Station::getProjectId, projectId);
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(Station::getOwnerName, keyword).or().like(Station::getStationCode, keyword));
        }
        wrapper.orderByAsc(Station::getStationCode);
        IPage<Station> stationPage = stationMapper.selectPage(new Page<>(page, size), wrapper);
        return PageDto.of(StationConvert.INSTANCE.toVoList(stationPage.getRecords()),
                stationPage.getTotal(), stationPage.getCurrent(), stationPage.getSize());
    }

    public Long createStation(Long projectId, StationDto dto) {
        validateProject(projectId);
        checkStationCodeUnique(dto.getStationCode(), null);

        Station station = new Station();
        copyDtoToStation(dto, station);
        station.setProjectId(projectId);
        stationMapper.insert(station);
        updateProjectStationCount(projectId);
        return station.getId();
    }

    public void updateStation(Long projectId, Long id, StationDto dto) {
        validateProject(projectId);
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
        updateProjectStationCount(projectId);
    }

    @Transactional
    public int batchDeleteStations(Long projectId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        LambdaQueryWrapper<Station> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Station::getProjectId, projectId).in(Station::getId, ids);
        int count = stationMapper.delete(wrapper);
        updateProjectStationCount(projectId);
        return count;
    }

    public StationViewVo getStationDetail(Long projectId, Long id) {
        Station station = stationMapper.selectById(id);
        if (station == null || !station.getProjectId().equals(projectId)) {
            throw new BusinessException("电站不存在");
        }

        Project project = projectMapper.selectById(projectId);
        StationViewVo vo = StationConvert.INSTANCE.toViewVo(station);
        vo.setProjectName(project != null ? project.getProjectName() : "");
        vo.setRecords(Collections.emptyList());
        return vo;
    }

    @Transactional
    public Map<String, Object> importStations(Long projectId, MultipartFile file) {
        validateProject(projectId);

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

        updateProjectStationCount(projectId);

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount[0]);
        result.put("failCount", errors.size());
        result.put("errors", errors);
        return result;
    }

    private void validateProject(Long projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }
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

    private void updateProjectStationCount(Long projectId) {
        int count = stationMapper.countByProjectId(projectId);
        Project project = projectMapper.selectById(projectId);
        if (project != null) {
            projectMapper.updateById(project);
        }
    }
}
