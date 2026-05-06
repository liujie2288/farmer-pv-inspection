package com.yldlxj.pv.inspect.config;

import com.yldlxj.pv.inspect.auth.RefreshTokenService;
import com.yldlxj.pv.inspect.export.ExportTaskProcessor;
import com.yldlxj.pv.inspect.plan.InspectPlanService;
import com.yldlxj.pv.inspect.report.PdfReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    @Autowired(required = false)
    private PdfReportService pdfReportService;

    private final InspectPlanService inspectPlanService;
    private final ExportTaskProcessor exportTaskProcessor;
    private final RefreshTokenService refreshTokenService;

    // 每天0点第0、10分钟自动切换巡检计划状态（未开始→进行中→已结束）
    @Scheduled(cron = "5 0 0 * * *")
    public void autoTransitionPlanStatus() {
        inspectPlanService.autoTransitionStatus();
    }

    // 每天凌晨3点清理过期的RefreshToken
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupExpiredTokens() {
        refreshTokenService.cleanupExpiredTokens();
    }

    // 每30秒扫描打包中的导出任务，按批次打包ZIP并上传OSS
    @Scheduled(fixedDelay = 30_000, initialDelay = 30_000)
    public void processPackagingExportTasks() {
        exportTaskProcessor.processPackagingTasks();
    }

    // 每60秒扫描未生成PDF的巡检记录，自动生成并上传OSS
    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public void processPdfReportGeneration() {
        if (pdfReportService != null) {
            pdfReportService.processPendingPdfRecords();
        }
    }

}
