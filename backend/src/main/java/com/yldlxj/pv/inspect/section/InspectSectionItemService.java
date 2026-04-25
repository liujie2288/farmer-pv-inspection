package com.yldlxj.pv.inspect.section;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.section.dto.SectionItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InspectSectionItemService {

    private final InspectSectionItemMapper itemMapper;

    public List<InspectSectionItem> listItems(Long sectionId) {
        LambdaQueryWrapper<InspectSectionItem> wrapper = new LambdaQueryWrapper<>();
        if (sectionId != null) {
            wrapper.eq(InspectSectionItem::getSectionId, sectionId);
        }
        wrapper.orderByAsc(InspectSectionItem::getItemNo);
        return itemMapper.selectList(wrapper);
    }

    public InspectSectionItem getItemById(Long id) {
        InspectSectionItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new BusinessException("巡检小项不存在");
        }
        return item;
    }

    @Transactional
    public Long createItem(SectionItemDto dto) {
        InspectSectionItem item = new InspectSectionItem();
        item.setSectionId(dto.getSectionId());
        item.setCategory(dto.getCategory());
        item.setItemNo(dto.getItemNo());
        item.setContent(dto.getContent());
        item.setItemType(dto.getItemType() != null ? dto.getItemType() : ItemType.CHECK);
        itemMapper.insert(item);
        return item.getId();
    }

    @Transactional
    public void updateItem(Long id, SectionItemDto dto) {
        InspectSectionItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new BusinessException("巡检小项不存在");
        }
        if (dto.getSectionId() != null) {
            item.setSectionId(dto.getSectionId());
        }
        if (dto.getCategory() != null) {
            item.setCategory(dto.getCategory());
        }
        if (dto.getItemNo() != null) {
            item.setItemNo(dto.getItemNo());
        }
        if (dto.getContent() != null) {
            item.setContent(dto.getContent());
        }
        if (dto.getItemType() != null) {
            item.setItemType(dto.getItemType());
        }
        itemMapper.updateById(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        InspectSectionItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new BusinessException("巡检小项不存在");
        }
        itemMapper.deleteById(id);
    }
}
