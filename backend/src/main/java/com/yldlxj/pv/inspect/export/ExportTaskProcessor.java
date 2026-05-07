package com.yldlxj.pv.inspect.export;

import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.OSSObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.CommonUtils;
import com.yldlxj.pv.inspect.export.dto.ExportTaskFileDto;
import com.yldlxj.pv.inspect.project.ProjectService;
import com.yldlxj.pv.inspect.record.InspectRecord;
import com.yldlxj.pv.inspect.record.InspectRecordMapper;
import com.yldlxj.pv.inspect.record.dto.PhotoItemDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import com.yldlxj.pv.inspect.section.InspectSectionService;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExportTaskProcessor {

    private static final int BATCH_SIZE = 200;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ExportTaskMapper exportTaskMapper;
    private final InspectRecordMapper recordMapper;
    private final StationMapper stationMapper;
    private final StorageService storageService;
    private final ProjectService projectService;
    private final InspectSectionService sectionService;

    public void processPackagingTasks() {
        List<ExportTask> tasks = exportTaskMapper.selectList(
                new LambdaQueryWrapper<ExportTask>()
                        .eq(ExportTask::getStatus, 2)
                        .last("LIMIT 2")
        );
        for (ExportTask task : tasks) {
            try {
                if ("pdf".equals(task.getType())) {
                    packagePdfAndUpload(task);
                } else if ("photo".equals(task.getType())) {
                    packagePhotoAndUpload(task);
                } else {
                    failTask(task, "not support type " + task.getType());
                }
            } catch (Exception e) {
                log.error("Export task {} packaging failed", task.getId(), e);
                failTask(task, e.getMessage());
            }
        }
    }

    private void packagePhotoAndUpload(ExportTask task) {
        List<InspectRecord> records = recordMapper.selectList(
                new LambdaQueryWrapper<InspectRecord>()
                        .select(InspectRecord::getId, InspectRecord::getStationId, InspectRecord::getPhotos)
                        .eq(InspectRecord::getPlanId, task.getPlanId())
                        .eq(InspectRecord::getProjectId, task.getProjectId())
                        .eq(InspectRecord::getStatus, 1)
        );

        // 无记录时直接标记完成，不创建空 ZIP
        if (records.isEmpty()) {
            task.setTotalCount(0);
            task.setFiles(new ArrayList<>());
            task.setStatus(3);
            task.setFinishTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);
            log.info("Export task {} completed with no records", task.getId());
            return;
        }

        String projectName = CommonUtils.truncateFileName(projectService.getNameByProjectId(task.getProjectId()));
        task.setTotalCount(records.size());

        // 一次性查询所有涉及的电站，避免每批重复查
        List<Long> stationIds = records.stream()
                .map(InspectRecord::getStationId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Station> stationMap = stationMapper.selectBatchIds(stationIds).stream()
                .collect(Collectors.toMap(Station::getId, s -> s));

        List<ExportTaskFileDto> fileDtos = new ArrayList<>();
        int totalBatches = (int) Math.ceil((double) records.size() / BATCH_SIZE);

        for (int batch = 0; batch < totalBatches; batch++) {
            int from = batch * BATCH_SIZE;
            int to = Math.min(from + BATCH_SIZE, records.size());

            ExportTaskFileDto fileDto = new ExportTaskFileDto();
            fileDto.setBatchNo(batch + 1);
            fileDto.setFileName(projectName + "_照片_(" + (from + 1) + "-" + to + ").zip");

            Path tempZip = null;
            try {
                tempZip = Files.createTempFile("export-" + task.getId() + "-" + batch, ".zip");
                writePhotoZip(tempZip, projectName, records.subList(from, to), stationMap);

                fileDto.setOssKey(buildExportOssKey(task, fileDto));
                storageService.uploadFile(fileDto.getOssKey(), tempZip, "application/zip");

                fileDto.setFileSize(Files.size(tempZip));
                fileDtos.add(fileDto);
            } catch (Exception e) {
                throw new RuntimeException("打包第" + (batch + 1) + "批失败: " + e.getMessage(), e);
            } finally {
                if (tempZip != null) {
                    try {
                        Files.deleteIfExists(tempZip);
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        task.setFiles(fileDtos);
        task.setStatus(3);
        task.setFinishTime(LocalDateTime.now());
        exportTaskMapper.updateById(task);
        log.info("Export task {} completed, {} batches", task.getId(), totalBatches);
    }

    private void writePhotoZip(Path zipPath, String projectName, List<InspectRecord> inspectRecords,
                               Map<Long, Station> stationMap) throws Exception {
        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {
            for (InspectRecord record : inspectRecords) {
                Station station = stationMap.get(record.getStationId());
                if (station == null) continue;

                String stationDir = projectName + "/" + station.getStationCode() + "_" + station.getOwnerName() + "/";

                int photoIdx = 0;
                if (record.getPhotos() == null && record.getThermalImageUrl() == null) {
                    zos.putNextEntry(new ZipEntry(stationDir));
                    continue;
                }

                if (record.getThermalImageUrl() != null) {
                    String entryName = String.format("%s%03d_%02d_红外热成像%s", stationDir, record.getId() % 1000, ++photoIdx, CommonUtils.getExtension(record.getThermalImageUrl()));
                    downloadAndPutZip(zos, record.getThermalImageUrl(), entryName);
                }

                if (record.getPhotos() == null) {
                    continue;
                }

                for (PhotoSectionDto section : record.getPhotos()) {
                    if (section.getItems() == null) continue;

                    String sectionName = Optional.ofNullable(sectionService.getSectionNameBySectionId(section.getSectionId())).orElse("other");
                    for (PhotoItemDto item : section.getItems()) {
                        if (item.getUrls() == null) continue;

                        String itemName = CommonUtils.truncateFileName(item.getItemName(), 10);
                        for (String url : item.getUrls()) {
                            String key = storageService.extractObjectKey(url);
                            if (key == null || key.isEmpty()) continue;

                            String entryName = String.format("%s%03d_%02d_%s_%s%s", stationDir, record.getId() % 1000, ++photoIdx, sectionName, itemName, CommonUtils.getExtension(key));

                            // 先创建 entry，再尝试下载；任何异常都先关闭当前 entry 再写 .error.txt
                            downloadAndPutZip(zos, key, entryName);
                        }
                    }
                }
            }
        }
    }

    private void packagePdfAndUpload(ExportTask task) {
        List<InspectRecord> records = recordMapper.selectList(
                new LambdaQueryWrapper<InspectRecord>()
                        .select(InspectRecord::getId, InspectRecord::getStationId, InspectRecord::getPdfUrl, InspectRecord::getCreateTime)
                        .eq(InspectRecord::getPlanId, task.getPlanId())
                        .eq(InspectRecord::getProjectId, task.getProjectId())
                        .eq(InspectRecord::getStatus, 1)
                        .isNotNull(InspectRecord::getPdfUrl)
        );

        if (records.isEmpty()) {
            task.setTotalCount(0);
            task.setFiles(new ArrayList<>());
            task.setStatus(3);
            task.setFinishTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);
            log.info("PDF export task {} completed with no PDFs", task.getId());
            return;
        }

        String projectName = CommonUtils.truncateFileName(projectService.getNameByProjectId(task.getProjectId()));
        task.setTotalCount(records.size());

        List<Long> stationIds = records.stream()
                .map(InspectRecord::getStationId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Station> stationMap = stationMapper.selectBatchIds(stationIds).stream()
                .collect(Collectors.toMap(Station::getId, s -> s));

        List<ExportTaskFileDto> fileDtos = new ArrayList<>();
        int totalBatches = (int) Math.ceil((double) records.size() / BATCH_SIZE);

        for (int batch = 0; batch < totalBatches; batch++) {
            int from = batch * BATCH_SIZE;
            int to = Math.min(from + BATCH_SIZE, records.size());

            ExportTaskFileDto fileDto = new ExportTaskFileDto();
            fileDto.setBatchNo(batch + 1);
            fileDto.setFileName(projectName + "_报告_(" + (from + 1) + "-" + to + ").zip");

            Path tempZip = null;
            try {
                tempZip = Files.createTempFile("pdf-export-" + task.getId() + "-" + batch, ".zip");
                writePdfZip(tempZip, projectName, records.subList(from, to), stationMap);

                fileDto.setFileSize(Files.size(tempZip));
                fileDto.setOssKey(buildExportOssKey(task, fileDto));
                storageService.uploadFile(fileDto.getOssKey(), tempZip, "application/zip");

                fileDtos.add(fileDto);
            } catch (Exception e) {
                throw new RuntimeException("打包第" + (batch + 1) + "批报告失败: " + e.getMessage(), e);
            } finally {
                if (tempZip != null) {
                    try {
                        Files.deleteIfExists(tempZip);
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        task.setFiles(fileDtos);
        task.setStatus(3);
        task.setFinishTime(LocalDateTime.now());
        exportTaskMapper.updateById(task);
        log.info("PDF export task {} completed, {} batches, {} records", task.getId(), totalBatches, records.size());
    }

    private void writePdfZip(Path zipPath, String projectName, List<InspectRecord> records,
                             Map<Long, Station> stationMap) throws Exception {
        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {
            for (InspectRecord record : records) {
                Station station = stationMap.get(record.getStationId());
                if (station == null) continue;

                String key = storageService.extractObjectKey(record.getPdfUrl());
                if (key == null || key.isEmpty()) continue;

                String entryName = projectName + "/" + station.getStationCode() + "_" + station.getOwnerName() + "_" + DATE_FORMATTER.format(record.getCreateTime()) + ".pdf";

                downloadAndPutZip(zos, key, entryName);
            }
        }
    }

    private void failTask(ExportTask task, String reason) {
        task.setStatus(4);
        task.setFailReason(reason != null && reason.length() > 500 ? reason.substring(0, 500) : reason);
        exportTaskMapper.updateById(task);
    }

    private String buildExportOssKey(ExportTask task, ExportTaskFileDto fileDto) {
        return "export/" + task.getType() + "/" + task.getPlanId() + "_" + task.getProjectId() + "_" + fileDto.getFileName();
    }

    private void downloadAndPutZip(ZipOutputStream zos, String key, String entryName) throws IOException {
        zos.putNextEntry(new ZipEntry(entryName));
        try {
            try (OSSObject ossObject = storageService.getObject(key);
                 InputStream is = ossObject.getObjectContent()) {
                is.transferTo(zos);
            }
            zos.closeEntry();
        } catch (Exception e) {
            try {
                zos.closeEntry();
            } catch (Exception ignored) {
            }
            String reason = e instanceof OSSException
                    ? ((OSSException) e).getErrorCode() : e.getMessage();
            zos.putNextEntry(new ZipEntry(entryName + ".error.txt"));
            zos.write(("下载失败原因：" + reason).getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
    }
}
