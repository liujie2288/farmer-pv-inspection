package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.section.InspectSectionItem;
import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.user.SysUser;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ExportDataContext {
    private InspectPlan plan;
    private Map<Long, Station> stations;
    private Map<Long, Project> projects;
    private Map<Long, SysUser> users;
    private Map<Integer, String> sectionNameMap;
    private Map<Long, InspectSectionItem> itemMap;
}
