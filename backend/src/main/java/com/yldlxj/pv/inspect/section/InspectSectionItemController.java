package com.yldlxj.pv.inspect.section;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.section.dto.SectionItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/section-items")
@RequiredArgsConstructor
public class InspectSectionItemController {

    private final InspectSectionItemService itemService;

    @GetMapping
    public ApiResponse<List<InspectSectionItem>> listItems(
            @RequestParam(required = false) Long sectionId) {
        return ApiResponse.success(itemService.listItems(sectionId));
    }

    @GetMapping("/{id}")
    public ApiResponse<InspectSectionItem> getItem(@PathVariable Long id) {
        return ApiResponse.success(itemService.getItemById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createItem(@Valid @RequestBody SectionItemDto dto) {
        Long id = itemService.createItem(dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateItem(@PathVariable Long id, @Valid @RequestBody SectionItemDto dto) {
        itemService.updateItem(id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ApiResponse.success();
    }
}
