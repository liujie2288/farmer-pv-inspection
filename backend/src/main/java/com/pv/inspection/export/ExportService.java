package com.pv.inspection.export;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.inspection.InspectRecord;
import com.pv.inspection.inspection.InspectRecordMapper;
import com.pv.inspection.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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

    public byte[] generateSinglePdf(Long recordId) {
        InspectRecord record = recordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException("巡检记录不存在");
        }
        return pdfReportService.generatePdf(record);
    }

    public ExportTask createExportTask(Long planId, Long operatorId) {
        Long count = recordMapper.selectCount(
                new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanId, planId)
        );

        ExportTask task = new ExportTask();
        task.setPlanId(planId);
        task.setOperatorId(operatorId);
        task.setStatus(0); // Processing
        task.setTotalCount(count.intValue());
        task.setCreateTime(LocalDateTime.now());

        exportTaskMapper.insert(task);

        // If small dataset, do synchronously
        if (count <= 1000) {
            try {
                doExport(task.getId());
            } catch (Exception e) {
                task.setStatus(2);
                task.setErrorMessage(e.getMessage());
                task.setCompleteTime(LocalDateTime.now());
                exportTaskMapper.updateById(task);
            }
        } else {
            // Async for large datasets
            doExportAsync(task.getId());
        }

        return exportTaskMapper.selectById(task.getId());
    }

    @Async
    public void doExportAsync(Long taskId) {
        try {
            doExport(taskId);
        } catch (Exception e) {
            ExportTask task = exportTaskMapper.selectById(taskId);
            if (task != null) {
                task.setStatus(2);
                task.setErrorMessage(e.getMessage());
                task.setCompleteTime(LocalDateTime.now());
                exportTaskMapper.updateById(task);
            }
        }
    }

    private void doExport(Long taskId) {
        ExportTask task = exportTaskMapper.selectById(taskId);
        if (task == null) return;

        List<InspectRecord> records = recordMapper.selectList(
                new LambdaQueryWrapper<InspectRecord>().eq(InspectRecord::getPlanId, task.getPlanId())
        );

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);

            for (InspectRecord record : records) {
                byte[] pdf = pdfReportService.generatePdf(record);
                String fileName = "巡检报告_" + record.getId() + ".pdf";
                zos.putNextEntry(new ZipEntry(fileName));
                zos.write(pdf);
                zos.closeEntry();
            }
            zos.close();

            byte[] zipData = baos.toByteArray();
            String objectName = "export/" + UUID.randomUUID() + ".zip";
            String url = storageService.upload(objectName,
                    new ByteArrayInputStream(zipData), zipData.length, "application/zip");

            task.setStatus(1); // Completed
            task.setFileUrl(url);
            task.setFileSize((long) zipData.length);
            task.setCompleteTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);

        } catch (Exception e) {
            task.setStatus(2);
            task.setErrorMessage(e.getMessage());
            task.setCompleteTime(LocalDateTime.now());
            exportTaskMapper.updateById(task);
            throw new RuntimeException(e);
        }
    }

    public ExportTask getExportTaskStatus(Long taskId) {
        return exportTaskMapper.selectById(taskId);
    }
}
