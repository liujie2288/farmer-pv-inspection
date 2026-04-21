package com.pv.inspection.inspection;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistTemplateService {

    private final InspectChecklistTemplateMapper templateMapper;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getTemplate() {
        List<InspectChecklistTemplate> items = templateMapper.selectList(
                new LambdaQueryWrapper<InspectChecklistTemplate>()
                        .orderByAsc(InspectChecklistTemplate::getSectionId)
                        .orderByAsc(InspectChecklistTemplate::getItemOrder)
        );

        Map<Integer, List<InspectChecklistTemplate>> grouped = items.stream()
                .collect(Collectors.groupingBy(InspectChecklistTemplate::getSectionId, LinkedHashMap::new, Collectors.toList()));

        List<Map<String, Object>> sections = new ArrayList<>();
        for (Map.Entry<Integer, List<InspectChecklistTemplate>> entry : grouped.entrySet()) {
            Map<String, Object> section = new LinkedHashMap<>();
            section.put("sectionId", entry.getKey());
            section.put("sectionName", entry.getValue().get(0).getSectionName());
            section.put("hasPhoto", entry.getValue().get(0).getHasPhoto());

            List<Map<String, Object>> sectionItems = entry.getValue().stream().map(item -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("itemId", item.getId());
                map.put("content", item.getContent());
                map.put("category", item.getCategory());
                map.put("hasNumeric", item.getHasNumeric() == 1);
                map.put("numericLabels", parseNumericLabels(item.getNumericLabels()));
                return map;
            }).collect(Collectors.toList());

            section.put("items", sectionItems);
            sections.add(section);
        }

        return Map.of("sections", sections);
    }

    private List<String> parseNumericLabels(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }
}
