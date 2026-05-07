package com.yldlxj.pv.inspect.report;

import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.record.InspectRecordService;
import com.yldlxj.pv.inspect.record.dto.vo.RecordDetailVo;
import com.yldlxj.pv.inspect.station.StationService;
import com.yldlxj.pv.inspect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/reports")
public class ReportController {

    private final ProjectMapper projectMapper;
    private final StationService stationService;
    private final InspectRecordService recordService;
    private final StorageService storageService;

    @GetMapping("/records/{id}")
    public String report(@PathVariable Long id, Model model) {
        RecordDetailVo record = recordService.getReportDetail(id);

        Project project = projectMapper.selectById(record.getProjectId());
        project.setDroneCertificateUrl(storageService.getImageUrl(project.getDroneCertificateUrl(), "large"));
        project.setSpecialOperationCertUrl(storageService.getImageUrl(project.getSpecialOperationCertUrl(), "large"));

        model.addAttribute("record", record);
        model.addAttribute("station", stationService.getStation(record.getStationId()));
        model.addAttribute("recordProject", project);
        return "report";
    }
}
