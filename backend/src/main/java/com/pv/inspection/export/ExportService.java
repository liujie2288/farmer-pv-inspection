package com.pv.inspection.export;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.farmer.Farmer;
import com.pv.inspection.farmer.FarmerMapper;
import com.pv.inspection.inspection.InspectChecklistTemplate;
import com.pv.inspection.inspection.InspectChecklistTemplateMapper;
import com.pv.inspection.inspection.InspectRecord;
import com.pv.inspection.inspection.InspectRecordMapper;
import com.pv.inspection.plan.InspectPlan;
import com.pv.inspection.plan.InspectPlanMapper;
import com.pv.inspection.project.Project;
import com.pv.inspection.project.ProjectMapper;
import com.pv.inspection.storage.StorageService;
import com.pv.inspection.user.SysUser;
import com.pv.inspection.user.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final InspectRecordMapper recordMapper;
    private final ExportTaskMapper exportTaskMapper;
    private final PdfReportService pdfReportService;
    private final StorageService storageService;
    private final ExportAsyncRunner asyncRunner;
    private final FarmerMapper farmerMapper;
    private final ProjectMapper projectMapper;
    private final SysUserMapper userMapper;
    private final InspectPlanMapper planMapper;
    private final InspectChecklistTemplateMapper templateMapper;

    public byte[] generateSinglePdf(Long recordId) {
        InspectRecord record = recordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        ExportDataContext ctx = buildSingleContext(record);
        return pdfReportService.generatePdf(record, ctx);
    }

    public ExportTask createExportTask(Long planId, Long operatorId, int exportType) {
        Long count = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanId, planId)
        );

        ExportTask task = new ExportTask();
        task.setPlanId(planId);
        task.setOperatorId(operatorId);
        task.setStatus(0);
        task.setTotalCount(count.intValue());
        task.setExportType(exportType);
        task.setProcessedCount(0);
        task.setCreateTime(LocalDateTime.now());

        exportTaskMapper.insert(task);

        asyncRunner.runExportAsync(task.getId());

        return exportTaskMapper.selectById(task.getId());
    }

    public void doExport(Long taskId) {
        ExportTask task = exportTaskMapper.selectById(taskId);
        if (task == null) return;

        Path tempFile = null;
        try {
            List<InspectRecord> records = recordMapper.selectList(
                    new LambdaQueryWrapper<InspectRecord>()
                            .eq(InspectRecord::getPlanId, task.getPlanId())
                            .orderByAsc(InspectRecord::getFarmerId)
            );

            ExportDataContext ctx = batchLoadContext(records);

            tempFile = Files.createTempFile("export-", ".zip");
            try (FileOutputStream fos = new FileOutputStream(tempFile.toFile());
                 BufferedOutputStream bos = new BufferedOutputStream(fos);
                 ZipOutputStream zos = new ZipOutputStream(bos)) {

                if (task.getExportType() == 0) {
                    generatePdfEntries(zos, records, ctx, task);
                } else {
                    generatePhotoEntries(zos, records, ctx, task);
                }
            }

            long fileSize = Files.size(tempFile);
            String objectName = "export/" + UUID.randomUUID() + ".zip";
            String url = storageService.uploadFile(objectName, tempFile, "application/zip");

            task.setStatus(1);
            task.setFileUrl(url);
            task.setFileSize(fileSize);
            task.setProcessedCount(task.getTotalCount());
            task.setCompleteTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);

        } catch (Exception e) {
            log.error("导出任务 {} 执行失败", taskId, e);
            markTaskFailed(taskId, e.getMessage());
            throw new RuntimeException(e);
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (Exception ignored) {}
            }
        }
    }

    public void markTaskFailed(Long taskId, String message) {
        ExportTask task = exportTaskMapper.selectById(taskId);
        if (task != null && task.getStatus() != 2) {
            task.setStatus(2);
            task.setErrorMessage(message != null && message.length() > 500 ? message.substring(0, 500) : message);
            task.setCompleteTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);
        }
    }

    public ExportTask getExportTaskStatus(Long taskId) {
        return exportTaskMapper.selectById(taskId);
    }

    public List<ExportTask> listTasksByPlan(Long planId) {
        return exportTaskMapper.selectList(
                new LambdaQueryWrapper<ExportTask>()
                        .eq(ExportTask::getPlanId, planId)
                        .orderByDesc(ExportTask::getCreateTime)
        );
    }

    // ---- PDF export ----

    private void generatePdfEntries(ZipOutputStream zos, List<InspectRecord> records,
                                     ExportDataContext ctx, ExportTask task) throws IOException {
        int processed = 0;
        for (InspectRecord record : records) {
            byte[] pdf = pdfReportService.generatePdf(record, ctx);
            Farmer farmer = ctx.getFarmers().get(record.getFarmerId());
            String fileName = farmer != null
                    ? farmer.getFarmerCode() + "_" + farmer.getFarmerName() + ".pdf"
                    : "record_" + record.getId() + ".pdf";
            zos.putNextEntry(new ZipEntry(fileName));
            zos.write(pdf);
            zos.closeEntry();

            processed++;
            updateProgress(task, processed);
        }
    }

    // ---- Photo export ----

    @SuppressWarnings("unchecked")
    private void generatePhotoEntries(ZipOutputStream zos, List<InspectRecord> records,
                                       ExportDataContext ctx, ExportTask task) throws IOException {
        int processed = 0;
        for (InspectRecord record : records) {
            Farmer farmer = ctx.getFarmers().get(record.getFarmerId());
            String farmerDir = farmer != null
                    ? farmer.getFarmerCode() + "_" + farmer.getFarmerName() + "/"
                    : "unknown_" + record.getFarmerId() + "/";

            Map<String, Object> photoUrls = record.getPhotoUrls();
            if (photoUrls != null) {
                for (Map.Entry<String, Object> entry : photoUrls.entrySet()) {
                    int sectionId = Integer.parseInt(entry.getKey());
                    String sectionName = ctx.getSectionNameMap().getOrDefault(sectionId, "section_" + sectionId);
                    String sectionDir = farmerDir + "section_" + sectionId + "_" + sectionName + "/";

                    Object val = entry.getValue();
                    if (!(val instanceof List)) continue;
                    List<?> photos = (List<?>) val;
                    int photoIdx = 0;

                    for (Object photoObj : photos) {
                        String url = (photoObj instanceof String) ? (String) photoObj : null;
                        if (url == null || url.isEmpty()) continue;

                        String objectKey = storageService.extractObjectKey(url);
                        if (objectKey == null) continue;

                        try (InputStream imageStream = storageService.download(objectKey)) {
                            byte[] imageBytes = imageStream.readAllBytes();
                            if (imageBytes.length == 0) continue;

                            String ext = objectKey.contains(".") ? objectKey.substring(objectKey.lastIndexOf('.')) : ".jpg";
                            String photoName = "photo_" + (++photoIdx) + ext;

                            zos.putNextEntry(new ZipEntry(sectionDir + photoName));
                            zos.write(imageBytes);
                            zos.closeEntry();
                        } catch (Exception e) {
                            log.warn("照片下载失败, objectKey={}: {}", objectKey, e.getMessage());
                        }
                    }
                }
            }

            processed++;
            updateProgress(task, processed);
        }
    }

    // ---- Helpers ----

    private void updateProgress(ExportTask task, int processed) {
        task.setProcessedCount(processed);
        if (processed % 10 == 0 || processed == task.getTotalCount()) {
            exportTaskMapper.updateById(task);
        }
    }

    private ExportDataContext batchLoadContext(List<InspectRecord> records) {
        if (records.isEmpty()) {
            return new ExportDataContext(null, Map.of(), Map.of(), Map.of(), Map.of());
        }

        Long planId = records.get(0).getPlanId();
        Set<Long> farmerIds = records.stream().map(InspectRecord::getFarmerId).collect(Collectors.toSet());
        Set<Long> projectIds = records.stream().map(InspectRecord::getProjectId).collect(Collectors.toSet());
        Set<Long> inspectorIds = records.stream().map(InspectRecord::getInspectorId).collect(Collectors.toSet());

        InspectPlan plan = planMapper.selectById(planId);
        Map<Long, Farmer> farmers = farmerMapper.selectBatchIds(farmerIds)
                .stream().collect(Collectors.toMap(Farmer::getId, Function.identity()));
        Map<Long, Project> projects = projectMapper.selectBatchIds(projectIds)
                .stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        Map<Long, SysUser> users = userMapper.selectBatchIds(inspectorIds)
                .stream().collect(Collectors.toMap(SysUser::getId, Function.identity()));

        // Section name map from template
        List<InspectChecklistTemplate> templates = templateMapper.selectList(null);
        Map<Integer, String> sectionNameMap = new LinkedHashMap<>();
        for (InspectChecklistTemplate t : templates) {
            sectionNameMap.putIfAbsent(t.getSectionId(), t.getSectionName());
        }

        return new ExportDataContext(plan, farmers, projects, users, sectionNameMap);
    }

    private ExportDataContext buildSingleContext(InspectRecord record) {
        InspectPlan plan = planMapper.selectById(record.getPlanId());
        Farmer farmer = farmerMapper.selectById(record.getFarmerId());
        Project project = projectMapper.selectById(record.getProjectId());
        SysUser user = userMapper.selectById(record.getInspectorId());

        List<InspectChecklistTemplate> templates = templateMapper.selectList(null);
        Map<Integer, String> sectionNameMap = new LinkedHashMap<>();
        for (InspectChecklistTemplate t : templates) {
            sectionNameMap.putIfAbsent(t.getSectionId(), t.getSectionName());
        }

        Map<Long, Farmer> farmers = farmer != null ? Map.of(farmer.getId(), farmer) : Map.of();
        Map<Long, Project> projects = project != null ? Map.of(project.getId(), project) : Map.of();
        Map<Long, SysUser> users = user != null ? Map.of(user.getId(), user) : Map.of();

        return new ExportDataContext(plan, farmers, projects, users, sectionNameMap);
    }
}
