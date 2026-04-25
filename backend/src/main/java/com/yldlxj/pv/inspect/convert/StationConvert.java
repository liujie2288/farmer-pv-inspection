package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.station.Station;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface StationConvert {
    StationConvert INSTANCE = Mappers.getMapper(StationConvert.class);

    @Mapping(target = "status", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "records", ignore = true)
    StationViewVo toViewVo(Station station);

    List<StationViewVo> toVoList(List<Station> list);
}
