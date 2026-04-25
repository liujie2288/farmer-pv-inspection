package com.yldlxj.pv.inspect.station;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface StationMapper extends BaseMapper<Station> {

    @Select("SELECT COUNT(*) FROM station WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);
}
