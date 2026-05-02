package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.project.ProjectMapper;
import com.yldlxj.pv.inspect.record.InspectRecordService;
import com.yldlxj.pv.inspect.record.dto.vo.RecordDetailVo;
import com.yldlxj.pv.inspect.station.StationMapper;
import com.yldlxj.pv.inspect.station.StationService;
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
    private final StationMapper stationMapper;
    private final InspectRecordService recordService;

    @GetMapping("/records/{id}")
    public String report(@PathVariable Long id, Model model) {
        RecordDetailVo record = recordService.getRecordDetail(id);

        model.addAttribute("record", record);
        model.addAttribute("station",
                record.getStationId() != null ? stationMapper.selectById(record.getStationId()) : null);
        model.addAttribute("project",
                record.getProjectId() != null ? projectMapper.selectById(record.getProjectId()) : null);
        return "report";
    }
}
