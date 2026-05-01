package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InspectPlanMapper extends BaseMapper<InspectPlan> {

    List<PlanViewVo> listPlan(@Param("keyword") String keyword, @Param("status") Integer status, @Param("offset") int offset, @Param("limit") int limit);

    long countPlan(@Param("keyword") String keyword, @Param("status") Integer status);

    List<PlanProjectViewVo> listPlanView(@Param("keyword") String keyword, @Param("status") Integer status, @Param("offset") int offset, @Param("limit") int limit);

    long countPlanView(@Param("keyword") String keyword, @Param("status") Integer status);

    PlanProjectViewVo findActiveByProjectId(@Param("projectId") Long projectId);

    List<PlanProjectViewVo> findActiveByProjectIds(@Param("projectIds") List<Long> projectIds);

    void updateInspectedCount(@Param("id") Long id, @Param("inspectedCount") Long inspectedCount);

    void recalculateCounts(@Param("id") Long id);

    int transitionToInProgress();

    int transitionToFinished();
}
