package com.yldlxj.pv.inspect.inverter;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.inverter.dto.InverterDto;
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
public class InverterService {

    private final InverterMapper inverterMapper;
    private final ProjectMapper projectMapper;

    public IPage<Inverter> listInverters(Long projectId, int page, int size, String keyword, Integer status) {
        LambdaQueryWrapper<Inverter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Inverter::getProjectId, projectId);
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(Inverter::getOwnerName, keyword).or().like(Inverter::getInverterCode, keyword));
        }
        if (status != null) {
            wrapper.eq(Inverter::getStatus, status);
        }
        wrapper.orderByAsc(Inverter::getInverterCode);
        return inverterMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public Long createInverter(Long projectId, InverterDto dto) {
        validateProject(projectId);
        checkInverterCodeUnique(dto.getInverterCode(), null);

        Inverter inverter = new Inverter();
        copyDtoToInverter(dto, inverter);
        inverter.setProjectId(projectId);
        inverterMapper.insert(inverter);
        updateProjectInverterCount(projectId);
        return inverter.getId();
    }

    public void updateInverter(Long projectId, Long id, InverterDto dto) {
        validateProject(projectId);
        Inverter inverter = inverterMapper.selectById(id);
        if (inverter == null || !inverter.getProjectId().equals(projectId)) {
            throw new BusinessException("逆变器不存在");
        }

        checkInverterCodeUnique(dto.getInverterCode(), id);
        copyDtoToInverter(dto, inverter);
        inverterMapper.updateById(inverter);
    }

    @Transactional
    public void deleteInverter(Long projectId, Long id) {
        Inverter inverter = inverterMapper.selectById(id);
        if (inverter == null || !inverter.getProjectId().equals(projectId)) {
            throw new BusinessException("逆变器不存在");
        }

        inverterMapper.deleteById(id);
        updateProjectInverterCount(projectId);
    }

    @Transactional
    public int batchDeleteInverters(Long projectId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        LambdaQueryWrapper<Inverter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Inverter::getProjectId, projectId).in(Inverter::getId, ids);
        int count = inverterMapper.delete(wrapper);
        updateProjectInverterCount(projectId);
        return count;
    }

    public Map<String, Object> getInverterDetail(Long projectId, Long id) {
        Inverter inverter = inverterMapper.selectById(id);
        if (inverter == null || !inverter.getProjectId().equals(projectId)) {
            throw new BusinessException("逆变器不存在");
        }

        Project project = projectMapper.selectById(projectId);

        Map<String, Object> detail = new HashMap<>();
        detail.put("id", inverter.getId());
        detail.put("inverterCode", inverter.getInverterCode());
        detail.put("ownerName", inverter.getOwnerName());
        detail.put("address", inverter.getAddress());
        detail.put("powerAccount", inverter.getPowerAccount());
        detail.put("inverterSn", inverter.getInverterSn());
        detail.put("inverterBrand", inverter.getInverterBrand());
        detail.put("capacityKw", inverter.getCapacityKw());
        detail.put("moduleCount", inverter.getModuleCount());
        detail.put("moduleSpec", inverter.getModuleSpec());
        detail.put("longitude", inverter.getLongitude());
        detail.put("latitude", inverter.getLatitude());
        detail.put("status", inverter.getStatus());
        detail.put("lastInspectTime", inverter.getLastInspectTime());
        detail.put("projectName", project != null ? project.getProjectName() : "");
        detail.put("records", Collections.emptyList());
        return detail;
    }

    @Transactional
    public Map<String, Object> importInverters(Long projectId, MultipartFile file) {
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
                        String inverterCode = row.get(0);
                        String ownerName = row.get(1);
                        if (inverterCode == null || inverterCode.trim().isEmpty() || ownerName == null || ownerName.trim().isEmpty()) {
                            errors.add(Map.of("row", rowCount[0], "reason", "逆变器编号或户主姓名为空"));
                            return;
                        }

                        Long existing = inverterMapper.selectCount(
                                new LambdaQueryWrapper<Inverter>().eq(Inverter::getInverterCode, inverterCode.trim())
                        );
                        if (existing > 0) {
                            errors.add(Map.of("row", rowCount[0], "reason", "逆变器编号已存在: " + inverterCode));
                            return;
                        }

                        Inverter inverter = new Inverter();
                        inverter.setProjectId(projectId);
                        inverter.setInverterCode(inverterCode.trim());
                        inverter.setOwnerName(ownerName.trim());
                        inverter.setAddress(row.get(2) != null ? row.get(2).trim() : null);
                        inverter.setPowerAccount(row.get(3) != null ? row.get(3).trim() : null);
                        inverter.setInverterSn(row.get(4) != null ? row.get(4).trim() : null);
                        inverter.setInverterBrand(row.get(5) != null ? row.get(5).trim() : null);
                        inverter.setCapacityKw(row.get(6) != null ? new BigDecimal(row.get(6).trim().replaceAll("[^0-9.]", "")) : null);
                        inverter.setModuleCount(row.get(7) != null ? Integer.parseInt(row.get(7).trim()) : null);
                        inverter.setModuleSpec(row.get(8) != null ? row.get(8).trim() : null);
                        inverter.setLongitude(row.get(9) != null ? new BigDecimal(row.get(9).trim().replaceAll("[^0-9.]", "")) : null);
                        inverter.setLatitude(row.get(10) != null ? new BigDecimal(row.get(10).trim().replaceAll("[^0-9.]", "")) : null);
                        inverterMapper.insert(inverter);
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

        updateProjectInverterCount(projectId);

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

    private void checkInverterCodeUnique(String inverterCode, Long excludeId) {
        LambdaQueryWrapper<Inverter> wrapper = new LambdaQueryWrapper<Inverter>()
                .eq(Inverter::getInverterCode, inverterCode);
        if (excludeId != null) {
            wrapper.ne(Inverter::getId, excludeId);
        }
        if (inverterMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("逆变器编号已存在");
        }
    }

    private void copyDtoToInverter(InverterDto dto, Inverter inverter) {
        inverter.setInverterCode(dto.getInverterCode());
        inverter.setOwnerName(dto.getOwnerName());
        inverter.setAddress(dto.getAddress());
        inverter.setPowerAccount(dto.getPowerAccount());
        inverter.setInverterSn(dto.getInverterSn());
        inverter.setInverterBrand(dto.getInverterBrand());
        inverter.setModuleSpec(dto.getModuleSpec());
        inverter.setModuleCount(dto.getModuleCount());
        inverter.setCapacityKw(dto.getCapacityKw());
        inverter.setLongitude(dto.getLongitude());
        inverter.setLatitude(dto.getLatitude());
    }

    private void updateProjectInverterCount(Long projectId) {
        int count = inverterMapper.countByProjectId(projectId);
        Project project = projectMapper.selectById(projectId);
        if (project != null) {
            projectMapper.updateById(project);
        }
    }
}
