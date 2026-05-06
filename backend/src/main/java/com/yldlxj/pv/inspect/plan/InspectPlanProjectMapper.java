package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface InspectPlanProjectMapper extends BaseMapper<InspectPlanProject> {

    void updateInspectedCount(@Param("id") Long id);

    void recalculateCounts(@Param("planId") Long planId);

    long countActiveByProjectId(@Param("projectId") Long projectId);

}
