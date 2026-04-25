package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.plan.InspectPlan;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface PlanConvert {
    PlanConvert INSTANCE = Mappers.getMapper(PlanConvert.class);

    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "completionRate", ignore = true)
    PlanViewVo toViewVo(InspectPlan plan);

    List<PlanViewVo> toVoList(List<InspectPlan> list);
}
