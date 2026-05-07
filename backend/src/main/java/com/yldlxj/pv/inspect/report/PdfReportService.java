package com.yldlxj.pv.inspect.report;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.PlaywrightException;
import com.microsoft.playwright.options.Margin;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.microsoft.playwright.options.WaitUntilState;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.project.ProjectService;
import com.yldlxj.pv.inspect.record.InspectRecord;
import com.yldlxj.pv.inspect.record.InspectRecordMapper;
import com.yldlxj.pv.inspect.record.InspectRecordService;
import com.yldlxj.pv.inspect.record.dto.vo.RecordDetailVo;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.StationService;
import com.yldlxj.pv.inspect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring5.ISpringTemplateEngine;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "playwright.enabled", havingValue = "true")
public class PdfReportService {

    private final Browser browser;
    private final ISpringTemplateEngine templateEngine;

    private final StationService stationService;
    private final StorageService storageService;

    private final ProjectMapper projectMapper;
    private final InspectRecordMapper recordMapper;
    private final InspectRecordService recordService;

    private static final int MAX_RETRY_COUNT = 3;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/");

    /**
     * 扫描未生成PDF的巡检记录，逐个生成并上传OSS。
     */
    public void processPendingPdfRecords() {
        List<InspectRecord> records = recordMapper.selectList(
                new LambdaQueryWrapper<InspectRecord>()
                        .eq(InspectRecord::getStatus, 1)
                        .eq(InspectRecord::getPdfStatus, 0)
                        .last("LIMIT 10")
        );

        for (InspectRecord record : records) {
            // 先标记生成中，防止重复拾起
            record.setPdfStatus(1);
            recordMapper.updateById(record);

            try {
                generateAndUploadPdf(record);
            } catch (Exception e) {
                log.error("PDF generation failed for record {}", record.getId(), e);
                int retryCount = record.getPdfRetry() != null ? record.getPdfRetry() + 1 : 1;
                record.setPdfRetry(retryCount);
                if (retryCount >= MAX_RETRY_COUNT) {
                    record.setPdfStatus(3);
                    log.error("PDF generation permanently failed for record {} after {} attempts", record.getId(), retryCount);
                } else {
                    record.setPdfStatus(0);
                }
                recordMapper.updateById(record);
            }
        }
    }

    private void generateAndUploadPdf(InspectRecord record) {
        String html = renderReportHtml(record.getId());
        byte[] pdfBytes = convertHtmlToPdf(html);

        String ossKey = "pdf/" + DATE_FORMATTER.format(LocalDate.now()) + record.getProjectId() + "/" + record.getStationId() + "_" + record.getId() + ".pdf";
        Path tempPdf = null;
        try {
            tempPdf = Files.createTempFile("report-" + record.getId(), ".pdf");
            Files.write(tempPdf, pdfBytes);
            storageService.uploadFile(ossKey, tempPdf, "application/pdf");
        } catch (Exception e) {
            throw new RuntimeException("PDF上传失败: " + e.getMessage(), e);
        } finally {
            if (tempPdf != null) {
                try {
                    Files.deleteIfExists(tempPdf);
                } catch (Exception ignored) {
                }
            }
        }

        record.setPdfUrl(ossKey);
        record.setPdfStatus(2);
        recordMapper.updateById(record);
        log.info("PDF report generated for record {}, size={} bytes", record.getId(), pdfBytes.length);
    }

    private String renderReportHtml(Long recordId) {
        RecordDetailVo record = recordService.getReportDetail(recordId);
        Station station = stationService.getStation(record.getStationId());

        Project project = projectMapper.selectById(record.getProjectId());
        project.setDroneCertificateUrl(storageService.getImageUrl(project.getDroneCertificateUrl(), "large"));
        project.setSpecialOperationCertUrl(storageService.getImageUrl(project.getSpecialOperationCertUrl(), "large"));


        Context context = new Context();
        context.setVariable("record", record);
        context.setVariable("station", station);
        context.setVariable("recordProject", project);

        return templateEngine.process("report", context);
    }

    private byte[] convertHtmlToPdf(String html) {
        BrowserContext ctx = browser.newContext();
        try {
            Page page = ctx.newPage();
            page.setContent(html, new Page.SetContentOptions()
                    .setWaitUntil(WaitUntilState.NETWORKIDLE)
                    .setTimeout(60_000));

            // 等待所有图片加载完成
            page.waitForFunction(
                    "Array.from(document.images).every(img => img.complete)"
            );

            return page.pdf(new Page.PdfOptions()
                    .setFormat("A4")
                    .setPrintBackground(true)
                    .setMargin(new Margin()
                            .setTop("20mm").setRight("18mm")
                            .setBottom("20mm").setLeft("18mm")));
        } catch (Exception e) {
            log.error("Playwright PDF generation failed", e);
            throw new RuntimeException("PDF生成失败: " + e.getMessage(), e);
        } finally {
            ctx.close();
        }
    }
}
