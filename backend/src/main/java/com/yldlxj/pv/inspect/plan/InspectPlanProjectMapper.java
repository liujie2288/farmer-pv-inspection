package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface InspectPlanProjectMapper extends BaseMapper<InspectPlanProject> {

    @Update("UPDATE inspect_plan_project SET inspected_count = #{inspectedCount} WHERE id = #{id}")
    void updateInspectedCount(@Param("id") Long id, @Param("inspectedCount") Long inspectedCount);

}
