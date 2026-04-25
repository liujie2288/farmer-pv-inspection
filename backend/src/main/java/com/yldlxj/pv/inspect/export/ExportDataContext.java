package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.inverter.Inverter;
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
    private Map<Long, Inverter> inverters;
    private Map<Long, Project> projects;
    private Map<Long, SysUser> users;
    private Map<Integer, String> sectionNameMap;
}
