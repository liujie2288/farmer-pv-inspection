package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.plan.dto.PlanViewVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InspectPlanMapper extends BaseMapper<InspectPlan> {

    List<PlanViewVo> listPlanView(@Param("keyword") String keyword, @Param("status") Integer status, @Param("offset") int offset, @Param("limit") int limit);

    long countPlanView(@Param("keyword") String keyword, @Param("status") Integer status);

    PlanViewVo findActiveByProjectId(@Param("projectId") Long projectId);

    List<PlanViewVo> findActiveByProjectIds(@Param("projectIds") List<Long> projectIds);
}
