package com.yldlxj.pv.inspect.inverter;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface InverterMapper extends BaseMapper<Inverter> {

    @Select("SELECT COUNT(*) FROM inverter WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);

    @Select("SELECT COUNT(*) FROM inverter WHERE project_id = #{projectId} AND status = 1")
    int countInspectedByProjectId(Long projectId);
}
