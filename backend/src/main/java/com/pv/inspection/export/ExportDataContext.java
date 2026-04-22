package com.pv.inspection.export;

import com.pv.inspection.farmer.Farmer;
import com.pv.inspection.plan.InspectPlan;
import com.pv.inspection.project.Project;
import com.pv.inspection.user.SysUser;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ExportDataContext {
    private InspectPlan plan;
    private Map<Long, Farmer> farmers;
    private Map<Long, Project> projects;
    private Map<Long, SysUser> users;
    private Map<Integer, String> sectionNameMap;
}
