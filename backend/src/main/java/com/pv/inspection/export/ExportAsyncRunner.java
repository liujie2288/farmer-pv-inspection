package com.pv.inspection.export;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExportAsyncRunner {

    private final ExportService exportService;

    @Autowired
    public ExportAsyncRunner(@Lazy ExportService exportService) {
        this.exportService = exportService;
    }

    @Async("exportTaskExecutor")
    public void runExportAsync(Long taskId) {
        try {
            exportService.doExport(taskId);
        } catch (Exception e) {
            log.error("导出任务 {} 异步执行失败", taskId, e);
            exportService.markTaskFailed(taskId, e.getMessage());
        }
    }
}
