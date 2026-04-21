package com.pv.inspection.farmer;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.farmer.dto.FarmerDTO;
import com.pv.inspection.project.Project;
import com.pv.inspection.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerMapper farmerMapper;
    private final ProjectMapper projectMapper;

    public IPage<Farmer> listFarmers(Long projectId, int page, int size, String farmerName, String farmerCode, Integer status) {
        LambdaQueryWrapper<Farmer> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Farmer::getProjectId, projectId);
        if (farmerName != null && !farmerName.isEmpty()) {
            wrapper.like(Farmer::getFarmerName, farmerName);
        }
        if (farmerCode != null && !farmerCode.isEmpty()) {
            wrapper.like(Farmer::getFarmerCode, farmerCode);
        }
        if (status != null) {
            wrapper.eq(Farmer::getStatus, status);
        }
        wrapper.orderByAsc(Farmer::getFarmerCode);
        return farmerMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public Long createFarmer(Long projectId, FarmerDTO dto) {
        validateProject(projectId);
        checkFarmerCodeUnique(dto.getFarmerCode(), null);

        Farmer farmer = new Farmer();
        copyDtoToFarmer(dto, farmer);
        farmer.setProjectId(projectId);
        farmer.setStatus(0);
        farmer.setCreateTime(LocalDateTime.now());
        farmer.setUpdateTime(LocalDateTime.now());

        farmerMapper.insert(farmer);
        updateProjectFarmerCount(projectId);
        return farmer.getId();
    }

    public void updateFarmer(Long projectId, Long id, FarmerDTO dto) {
        validateProject(projectId);
        Farmer farmer = farmerMapper.selectById(id);
        if (farmer == null || !farmer.getProjectId().equals(projectId)) {
            throw new BusinessException("农户不存在");
        }

        checkFarmerCodeUnique(dto.getFarmerCode(), id);
        copyDtoToFarmer(dto, farmer);
        farmer.setUpdateTime(LocalDateTime.now());
        farmerMapper.updateById(farmer);
    }

    @Transactional
    public void deleteFarmer(Long projectId, Long id) {
        Farmer farmer = farmerMapper.selectById(id);
        if (farmer == null || !farmer.getProjectId().equals(projectId)) {
            throw new BusinessException("农户不存在");
        }

        // TODO: cascade delete inspection records and photos when implemented
        farmerMapper.deleteById(id);
        updateProjectFarmerCount(projectId);
    }

    @Transactional
    public int batchDeleteFarmers(Long projectId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        LambdaQueryWrapper<Farmer> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Farmer::getProjectId, projectId).in(Farmer::getId, ids);
        // TODO: cascade delete inspection records and photos
        int count = farmerMapper.delete(wrapper);
        updateProjectFarmerCount(projectId);
        return count;
    }

    public Map<String, Object> getFarmerDetail(Long projectId, Long id) {
        Farmer farmer = farmerMapper.selectById(id);
        if (farmer == null || !farmer.getProjectId().equals(projectId)) {
            throw new BusinessException("农户不存在");
        }

        Project project = projectMapper.selectById(projectId);

        Map<String, Object> detail = new HashMap<>();
        detail.put("id", farmer.getId());
        detail.put("farmerCode", farmer.getFarmerCode());
        detail.put("farmerName", farmer.getFarmerName());
        detail.put("powerAccount", farmer.getPowerAccount());
        detail.put("inverterSn", farmer.getInverterSn());
        detail.put("inverterBrand", farmer.getInverterBrand());
        detail.put("moduleSpec", farmer.getModuleSpec());
        detail.put("moduleCount", farmer.getModuleCount());
        detail.put("capacityKw", farmer.getCapacityKw());
        detail.put("status", farmer.getStatus());
        detail.put("lastInspectTime", farmer.getLastInspectTime());
        detail.put("projectName", project != null ? project.getProjectName() : "");
        detail.put("records", Collections.emptyList()); // Populated when inspection is implemented
        return detail;
    }

    @Transactional
    public Map<String, Object> importFarmers(Long projectId, MultipartFile file) {
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
                        String farmerCode = row.get(0);
                        String farmerName = row.get(1);
                        if (farmerCode == null || farmerCode.trim().isEmpty() || farmerName == null || farmerName.trim().isEmpty()) {
                            errors.add(Map.of("row", rowCount[0], "reason", "农户编号或姓名为空"));
                            return;
                        }

                        Long existing = farmerMapper.selectCount(
                                new LambdaQueryWrapper<Farmer>().eq(Farmer::getFarmerCode, farmerCode.trim())
                        );
                        if (existing > 0) {
                            errors.add(Map.of("row", rowCount[0], "reason", "农户编号已存在: " + farmerCode));
                            return;
                        }

                        Farmer farmer = new Farmer();
                        farmer.setProjectId(projectId);
                        farmer.setFarmerCode(farmerCode.trim());
                        farmer.setFarmerName(farmerName.trim());
                        farmer.setPowerAccount(row.get(2) != null ? row.get(2).trim() : null);
                        farmer.setInverterSn(row.get(3) != null ? row.get(3).trim() : null);
                        farmer.setInverterBrand(row.get(4) != null ? row.get(4).trim() : null);
                        farmer.setModuleSpec(row.get(5) != null ? row.get(5).trim() : null);
                        farmer.setModuleCount(row.get(6) != null ? Integer.parseInt(row.get(6).trim()) : null);
                        farmer.setStatus(0);
                        farmer.setCreateTime(LocalDateTime.now());
                        farmer.setUpdateTime(LocalDateTime.now());

                        farmerMapper.insert(farmer);
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

        updateProjectFarmerCount(projectId);

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

    private void checkFarmerCodeUnique(String farmerCode, Long excludeId) {
        LambdaQueryWrapper<Farmer> wrapper = new LambdaQueryWrapper<Farmer>()
                .eq(Farmer::getFarmerCode, farmerCode);
        if (excludeId != null) {
            wrapper.ne(Farmer::getId, excludeId);
        }
        if (farmerMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("农户编号已存在");
        }
    }

    private void copyDtoToFarmer(FarmerDTO dto, Farmer farmer) {
        farmer.setFarmerCode(dto.getFarmerCode());
        farmer.setFarmerName(dto.getFarmerName());
        farmer.setPowerAccount(dto.getPowerAccount());
        farmer.setInverterSn(dto.getInverterSn());
        farmer.setInverterBrand(dto.getInverterBrand());
        farmer.setModuleSpec(dto.getModuleSpec());
        farmer.setModuleCount(dto.getModuleCount());
        farmer.setCapacityKw(dto.getCapacityKw());
    }

    private void updateProjectFarmerCount(Long projectId) {
        int count = farmerMapper.countByProjectId(projectId);
        Project project = projectMapper.selectById(projectId);
        if (project != null) {
            project.setFarmerCount(count);
            project.setUpdateTime(LocalDateTime.now());
            projectMapper.updateById(project);
        }
    }
}
