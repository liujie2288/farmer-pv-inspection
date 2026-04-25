package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.section.InspectSection;
import com.yldlxj.pv.inspect.section.InspectSectionItem;
import com.yldlxj.pv.inspect.section.dto.SectionItemViewVo;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface SectionConvert {
    SectionConvert INSTANCE = Mappers.getMapper(SectionConvert.class);

    @Mapping(target = "items", ignore = true)
    SectionViewVo toViewVo(InspectSection section);

    List<SectionViewVo> toVoList(List<InspectSection> list);

    SectionItemViewVo toItemViewVo(InspectSectionItem item);

    List<SectionItemViewVo> toItemVoList(List<InspectSectionItem> list);
}
