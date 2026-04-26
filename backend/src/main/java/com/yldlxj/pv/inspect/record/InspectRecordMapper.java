package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.record.dto.vo.RecordSimpleVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InspectRecordMapper extends BaseMapper<InspectRecord> {

    List<RecordSimpleVo> listByStationId(@Param("stationId") Long stationId);

    List<RecordSimpleVo> listRecords(@Param("stationId") Long stationId,
                                     @Param("planId") Long planId,
                                     @Param("keyword") String keyword,
                                     @Param("status") Integer status,
                                     @Param("inspectorId") Long inspectorId,
                                     @Param("offset") int offset,
                                     @Param("limit") int limit);

    long countRecords(@Param("stationId") Long stationId,
                      @Param("planId") Long planId,
                      @Param("keyword") String keyword,
                      @Param("status") Integer status,
                      @Param("inspectorId") Long inspectorId);

    void updateEditDeadline(@Param("id") Long id, @Param("editDeadline") java.time.LocalDateTime editDeadline);
}
