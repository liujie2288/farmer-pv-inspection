package com.yldlxj.pv.inspect.station;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface StationMapper extends BaseMapper<Station> {

    @Select("SELECT COUNT(*) FROM station WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);

    @Update("UPDATE station SET last_inspect_record_id = #{inspectRecordId},last_inspect_time=NOW() WHERE id = #{id}")
    void updateLastInspectRecordId(Long id, Long inspectRecordId);

    List<StationViewVo> listByProjectId(@Param("projectId") Long projectId,
                                        @Param("planProjectId") Long planProjectId,
                                        @Param("keyword") String keyword,
                                        @Param("inspectStatus") Integer inspectStatus,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    long countByProjectIdFiltered(@Param("projectId") Long projectId,
                                  @Param("planProjectId") Long planProjectId,
                                  @Param("keyword") String keyword,
                                  @Param("inspectStatus") Integer inspectStatus);

    List<StationViewVo> listByProjectIdNoPlan(@Param("projectId") Long projectId,
                                              @Param("keyword") String keyword,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);

    long countByProjectIdFilteredNoPlan(@Param("projectId") Long projectId,
                                        @Param("keyword") String keyword);
}
