package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.farmer.Farmer;
import com.yldlxj.pv.inspect.inspection.InspectRecord;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.storage.StorageService;
import com.yldlxj.pv.inspect.user.SysUser;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PdfReportService {

    private final StorageService storageService;

    public PdfReportService(StorageService storageService) {
        this.storageService = storageService;
    }

    public byte[] generatePdf(InspectRecord record, ExportDataContext ctx) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.setMargins(36, 36, 36, 36);

        try {
            PdfFont font = PdfFontFactory.createFont("STSong-Light", "UniGB-UCS2-H");

            InspectPlan plan = ctx.getPlan();
            Farmer farmer = ctx.getFarmers().get(record.getFarmerId());
            Project project = ctx.getProjects().get(record.getProjectId());
            SysUser inspector = ctx.getUsers().get(record.getInspectorId());

            // Title
            document.add(new Paragraph("光伏巡检报告")
                    .setFont(font).setFontSize(20).setBold()
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
            document.add(new Paragraph("\n").setFont(font));

            // Basic info
            Table infoTable = new Table(2);
            infoTable.setWidth(UnitValue.createPercentValue(100));
            addInfoRow(infoTable, font, "项目名称", project != null ? project.getProjectName() : "");
            addInfoRow(infoTable, font, "农户姓名", farmer != null ? farmer.getFarmerName() : "");
            addInfoRow(infoTable, font, "农户编号", farmer != null ? farmer.getFarmerCode() : "");
            addInfoRow(infoTable, font, "巡检计划", plan != null ? plan.getPlanName() : "");
            addInfoRow(infoTable, font, "巡检人员", inspector != null ? inspector.getRealName() : "");
            addInfoRow(infoTable, font, "巡检时间", record.getCreateTime() != null ?
                    record.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
            addInfoRow(infoTable, font, "GPS坐标", record.getLongitude() + ", " + record.getLatitude());
            document.add(infoTable);
            document.add(new Paragraph("\n").setFont(font));

            // Checklist results
            if (record.getChecklistResult() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = record.getChecklistResult();
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sections = (List<Map<String, Object>>) result.get("sections");

                if (sections != null) {
                    for (Map<String, Object> section : sections) {
                        String sectionName = (String) section.get("sectionName");
                        document.add(new Paragraph(sectionName).setFont(font).setFontSize(14).setBold());

                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> items = (List<Map<String, Object>>) section.get("items");
                        if (items != null) {
                            Table itemTable = new Table(3);
                            itemTable.setWidth(UnitValue.createPercentValue(100));
                            itemTable.addHeaderCell(new Cell().add(new Paragraph("检查项").setFont(font)));
                            itemTable.addHeaderCell(new Cell().add(new Paragraph("结果").setFont(font)));
                            itemTable.addHeaderCell(new Cell().add(new Paragraph("备注").setFont(font)));

                            for (Map<String, Object> item : items) {
                                String content = String.valueOf(item.get("content"));
                                String itemResult = String.valueOf(item.get("result"));
                                String note = String.valueOf(item.getOrDefault("exceptionNote", ""));

                                itemTable.addCell(new Cell().add(new Paragraph(content).setFont(font).setFontSize(8)));
                                itemTable.addCell(new Cell().add(new Paragraph(itemResult).setFont(font)));
                                itemTable.addCell(new Cell().add(new Paragraph("null".equals(note) ? "" : note).setFont(font)));
                            }
                            document.add(itemTable);
                        }
                        document.add(new Paragraph("\n").setFont(font));
                    }
                }
            }

            // Photos
            addPhotos(document, font, record, ctx);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("PDF生成失败: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    @SuppressWarnings("unchecked")
    private void addPhotos(Document document, PdfFont font, InspectRecord record, ExportDataContext ctx) {
        if (record.getPhotoUrls() == null) return;

        Map<String, Object> photoUrls = record.getPhotoUrls();
        boolean hasPhotos = false;

        for (Map.Entry<String, Object> entry : photoUrls.entrySet()) {
            List<String> urls;
            Object val = entry.getValue();
            if (val instanceof List) {
                urls = (List<String>) val;
            } else {
                continue;
            }
            if (urls.isEmpty()) continue;

            if (!hasPhotos) {
                document.add(new Paragraph("巡检照片").setFont(font).setFontSize(14).setBold());
                hasPhotos = true;
            }

            int sectionId = Integer.parseInt(entry.getKey());
            String sectionName = ctx.getSectionNameMap().getOrDefault(sectionId, "区域" + sectionId);
            document.add(new Paragraph(sectionName).setFont(font).setFontSize(11).setBold());

            int photoIdx = 0;
            for (String url : urls) {
                try {
                    String objectKey = storageService.extractObjectKey(url);
                    if (objectKey == null) continue;

                    byte[] imageBytes;
                    try (InputStream is = storageService.download(objectKey)) {
                        imageBytes = is.readAllBytes();
                    }
                    if (imageBytes.length == 0) continue;

                    Image img = new Image(ImageDataFactory.create(imageBytes));
                    float maxWidth = 480;
                    float maxHeight = 360;
                    float scale = Math.min(maxWidth / img.getImageWidth(), maxHeight / img.getImageHeight());
                    if (scale < 1) {
                        img.scale(img.getImageWidth() * scale, img.getImageHeight() * scale);
                    }
                    photoIdx++;
                    document.add(new Paragraph("照片 " + photoIdx).setFont(font).setFontSize(9));
                    document.add(img);
                } catch (Exception e) {
                    log.warn("嵌入照片失败, url={}: {}", url, e.getMessage());
                }
            }
        }
    }

    private void addInfoRow(Table table, PdfFont font, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setFont(font).setBold()));
        table.addCell(new Cell().add(new Paragraph(value).setFont(font)));
    }
}
