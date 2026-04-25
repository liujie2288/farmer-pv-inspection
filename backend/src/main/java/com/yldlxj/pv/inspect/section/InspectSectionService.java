package com.yldlxj.pv.inspect.section;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.convert.SectionConvert;
import com.yldlxj.pv.inspect.section.dto.SectionDto;
import com.yldlxj.pv.inspect.section.dto.SectionItemViewVo;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InspectSectionService {

    private final InspectSectionMapper sectionMapper;
    private final InspectSectionItemMapper itemMapper;

    public List<SectionViewVo> listSectionTree() {
        List<InspectSection> sections = sectionMapper.selectList(
                new LambdaQueryWrapper<InspectSection>().orderByAsc(InspectSection::getSectionNo)
        );
        List<InspectSectionItem> allItems = itemMapper.selectList(
                new LambdaQueryWrapper<InspectSectionItem>().orderByAsc(InspectSectionItem::getItemNo)
        );

        Map<Long, List<SectionItemViewVo>> itemMap = SectionConvert.INSTANCE.toItemVoList(allItems)
                .stream().collect(Collectors.groupingBy(SectionItemViewVo::getSectionId));

        List<SectionViewVo> vos = SectionConvert.INSTANCE.toVoList(sections);
        vos.forEach(vo -> vo.setItems(itemMap.getOrDefault(vo.getId(), List.of())));
        return vos;
    }

    public List<InspectSection> listSections() {
        return sectionMapper.selectList(
                new LambdaQueryWrapper<InspectSection>().orderByAsc(InspectSection::getSectionNo)
        );
    }

    public InspectSection getSectionById(Long id) {
        InspectSection section = sectionMapper.selectById(id);
        if (section == null) {
            throw new BusinessException("大项不存在");
        }
        return section;
    }

    @Transactional
    public Long createSection(SectionDto dto) {
        InspectSection section = new InspectSection();
        section.setSectionNo(dto.getSectionNo());
        section.setSectionName(dto.getSectionName());
        sectionMapper.insert(section);
        return section.getId();
    }

    @Transactional
    public void updateSection(Long id, SectionDto dto) {
        InspectSection section = sectionMapper.selectById(id);
        if (section == null) {
            throw new BusinessException("大项不存在");
        }
        if (dto.getSectionNo() != null) {
            section.setSectionNo(dto.getSectionNo());
        }
        if (dto.getSectionName() != null) {
            section.setSectionName(dto.getSectionName());
        }
        sectionMapper.updateById(section);
    }

    @Transactional
    public void deleteSection(Long id) {
        InspectSection section = sectionMapper.selectById(id);
        if (section == null) {
            throw new BusinessException("大项不存在");
        }
        sectionMapper.deleteById(id);
    }
}
