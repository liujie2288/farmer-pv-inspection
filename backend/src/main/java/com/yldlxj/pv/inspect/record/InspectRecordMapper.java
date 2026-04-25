package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yldlxj.pv.inspect.record.dto.vo.RecordSimpleVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InspectRecordMapper extends BaseMapper<InspectRecord> {

    List<RecordSimpleVo> listByStationId(@Param("stationId") Long stationId);
}
