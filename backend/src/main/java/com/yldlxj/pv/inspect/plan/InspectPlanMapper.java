package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface InspectPlanMapper extends BaseMapper<InspectPlan> {

    List<PlanProjectViewVo> listPlanView(@Param("keyword") String keyword, @Param("status") Integer status, @Param("offset") int offset, @Param("limit") int limit);

    long countPlanView(@Param("keyword") String keyword, @Param("status") Integer status);

    PlanProjectViewVo findActiveByProjectId(@Param("projectId") Long projectId);

    List<PlanProjectViewVo> findActiveByProjectIds(@Param("projectIds") List<Long> projectIds);

    @Update("UPDATE inspect_plan SET inspected_count = #{inspectedCount} WHERE id = #{id}")
    void updateInspectedCount(Long id, Long inspectedCount);
}
