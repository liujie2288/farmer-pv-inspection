package com.yldlxj.pv.inspect.farmer;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface FarmerMapper extends BaseMapper<Farmer> {

    @Select("SELECT COUNT(*) FROM farmer WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);

    @Select("SELECT COUNT(*) FROM farmer WHERE project_id = #{projectId} AND status = 1")
    int countInspectedByProjectId(Long projectId);
}
