package com.pv.inspection.export;

import com.pv.inspection.farmer.Farmer;
import com.pv.inspection.farmer.FarmerMapper;
import com.pv.inspection.inspection.InspectRecord;
import com.pv.inspection.plan.InspectPlan;
import com.pv.inspection.plan.InspectPlanMapper;
import com.pv.inspection.project.Project;
import com.pv.inspection.project.ProjectMapper;
import com.pv.inspection.user.SysUser;
import com.pv.inspection.user.SysUserMapper;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final InspectPlanMapper planMapper;
    private final FarmerMapper farmerMapper;
    private final ProjectMapper projectMapper;
    private final SysUserMapper userMapper;

    public byte[] generatePdf(InspectRecord record) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        try {
            PdfFont font = PdfFontFactory.createFont("STSong-Light", "UniGB-UCS2-H");

            InspectPlan plan = planMapper.selectById(record.getPlanId());
            Farmer farmer = farmerMapper.selectById(record.getFarmerId());
            Project project = projectMapper.selectById(record.getProjectId());
            SysUser inspector = userMapper.selectById(record.getInspectorId());

            // Title
            Paragraph title = new Paragraph("光伏巡检报告")
                    .setFont(font).setFontSize(20).setBold()
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
            document.add(title);
            document.add(new Paragraph("\n").setFont(font));

            // Basic info
            Table infoTable = new Table(2);
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

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("PDF生成失败: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private void addInfoRow(Table table, PdfFont font, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setFont(font).setBold()));
        table.addCell(new Cell().add(new Paragraph(value).setFont(font)));
    }
}
