package com.yldlxj.pv.inspect.station;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface StationMapper extends BaseMapper<Station> {

    @Select("SELECT COUNT(*) FROM station WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);

    @Update("UPDATE station SET last_inspect_record_id = #{inspectRecordId},last_inspect_time=NOW() WHERE id = #{id}")
    void updateLastInspectRecordId(Long id, Long inspectRecordId);
}
