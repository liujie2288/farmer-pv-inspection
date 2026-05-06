package com.yldlxj.pv.inspect.project;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {

    @Update("UPDATE station SET last_inspect_record_id = #{inspectRecordId},last_inspect_time=NOW() WHERE id = #{id}")
    void updateLastInspectRecordId(Long id, Long inspectRecordId);

}
