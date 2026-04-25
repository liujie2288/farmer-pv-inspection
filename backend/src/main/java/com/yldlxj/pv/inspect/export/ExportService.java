package com.yldlxj.pv.inspect.export;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.exception.BusinessException;
import com.yldlxj.pv.inspect.section.InspectSection;
import com.yldlxj.pv.inspect.section.InspectSectionItem;
import com.yldlxj.pv.inspect.section.InspectSectionItemMapper;
import com.yldlxj.pv.inspect.section.InspectSectionMapper;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.record.InspectRecord;
import com.yldlxj.pv.inspect.record.InspectRecordMapper;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.InspectPlanMapper;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.storage.StorageService;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.SysUserMapper;
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
    private final StationMapper stationMapper;
    private final ProjectMapper projectMapper;
    private final SysUserMapper userMapper;
    private final InspectPlanMapper planMapper;
    private final InspectSectionMapper sectionMapper;
    private final InspectSectionItemMapper sectionItemMapper;

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
                            .orderByAsc(InspectRecord::getStationId)
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
            Station station = ctx.getStations().get(record.getStationId());
            String fileName = station != null
                    ? station.getStationCode() + "_" + station.getOwnerName() + ".pdf"
                    : "record_" + record.getId() + ".pdf";
            zos.putNextEntry(new ZipEntry(fileName));
            zos.write(pdf);
            zos.closeEntry();

            processed++;
            updateProgress(task, processed);
        }
    }

    // ---- Photo export ----

    private void generatePhotoEntries(ZipOutputStream zos, List<InspectRecord> records,
                                       ExportDataContext ctx, ExportTask task) throws IOException {
        int processed = 0;
        for (InspectRecord record : records) {
            Station station = ctx.getStations().get(record.getStationId());
            String stationDir = station != null
                    ? station.getStationCode() + "_" + station.getOwnerName() + "/"
                    : "unknown_" + record.getStationId() + "/";

            java.util.List<com.yldlxj.pv.inspect.record.dto.PhotoSectionDto> photos = record.getPhotos();
            if (photos != null) {
                for (com.yldlxj.pv.inspect.record.dto.PhotoSectionDto section : photos) {
                    int sectionId = section.getSectionId() != null ? section.getSectionId().intValue() : 0;
                    String sectionName = ctx.getSectionNameMap().getOrDefault(sectionId, "section_" + sectionId);
                    String sectionDir = stationDir + "section_" + sectionId + "_" + sectionName + "/";

                    int photoIdx = 0;
                    for (com.yldlxj.pv.inspect.record.dto.PhotoItemDto item : section.getItems()) {
                        for (String url : item.getUrls()) {
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
            return new ExportDataContext(null, Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
        }

        Long planId = records.get(0).getPlanId();
        Set<Long> stationIds = records.stream().map(InspectRecord::getStationId).collect(Collectors.toSet());
        Set<Long> projectIds = records.stream().map(InspectRecord::getProjectId).collect(Collectors.toSet());
        Set<Long> inspectorIds = records.stream().map(InspectRecord::getInspectorId).collect(Collectors.toSet());

        InspectPlan plan = planMapper.selectById(planId);
        Map<Long, Station> stations = stationMapper.selectBatchIds(stationIds)
                .stream().collect(Collectors.toMap(Station::getId, Function.identity()));
        Map<Long, Project> projects = projectMapper.selectBatchIds(projectIds)
                .stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        Map<Long, SysUser> users = userMapper.selectBatchIds(inspectorIds)
                .stream().collect(Collectors.toMap(SysUser::getId, Function.identity()));

        // Section name map from inspect_section
        List<InspectSection> sections = sectionMapper.selectList(null);
        Map<Integer, String> sectionNameMap = sections.stream()
                .collect(Collectors.toMap(s -> s.getId().intValue(), InspectSection::getSectionName, (a, b) -> a, LinkedHashMap::new));

        // Item map from inspect_section_item
        List<InspectSectionItem> allItems = sectionItemMapper.selectList(null);
        Map<Long, InspectSectionItem> itemMap = allItems.stream()
                .collect(Collectors.toMap(InspectSectionItem::getId, Function.identity()));

        return new ExportDataContext(plan, stations, projects, users, sectionNameMap, itemMap);
    }

    private ExportDataContext buildSingleContext(InspectRecord record) {
        InspectPlan plan = planMapper.selectById(record.getPlanId());
        Station station = stationMapper.selectById(record.getStationId());
        Project project = projectMapper.selectById(record.getProjectId());
        SysUser user = userMapper.selectById(record.getInspectorId());

        List<InspectSection> sections = sectionMapper.selectList(null);
        Map<Integer, String> sectionNameMap = sections.stream()
                .collect(Collectors.toMap(s -> s.getId().intValue(), InspectSection::getSectionName, (a, b) -> a, LinkedHashMap::new));

        List<InspectSectionItem> allItems = sectionItemMapper.selectList(null);
        Map<Long, InspectSectionItem> itemMap = allItems.stream()
                .collect(Collectors.toMap(InspectSectionItem::getId, Function.identity()));

        Map<Long, Station> stations = station != null ? Map.of(station.getId(), station) : Map.of();
        Map<Long, Project> projects = project != null ? Map.of(project.getId(), project) : Map.of();
        Map<Long, SysUser> users = user != null ? Map.of(user.getId(), user) : Map.of();

        return new ExportDataContext(plan, stations, projects, users, sectionNameMap, itemMap);
    }
}
