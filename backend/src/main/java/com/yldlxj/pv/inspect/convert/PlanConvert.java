package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.plan.InspectPlanProject;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface PlanConvert {
    PlanConvert INSTANCE = Mappers.getMapper(PlanConvert.class);

    @Mapping(target = "planName", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "completionRate", ignore = true)
    PlanProjectViewVo toViewVo(InspectPlanProject pp);

    List<PlanProjectViewVo> toVoList(List<InspectPlanProject> list);
}
