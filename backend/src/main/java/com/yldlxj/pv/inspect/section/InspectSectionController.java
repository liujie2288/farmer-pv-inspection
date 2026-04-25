package com.yldlxj.pv.inspect.section;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.section.dto.SectionDto;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class InspectSectionController {

    private final InspectSectionService sectionService;

    @GetMapping
    public ApiResponse<List<SectionViewVo>> listSectionTree() {
        return ApiResponse.success(sectionService.listSectionTree());
    }

    @GetMapping("/{id}")
    public ApiResponse<InspectSection> getSection(@PathVariable Long id) {
        return ApiResponse.success(sectionService.getSectionById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createSection(@Valid @RequestBody SectionDto dto) {
        Long id = sectionService.createSection(dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateSection(@PathVariable Long id, @Valid @RequestBody SectionDto dto) {
        sectionService.updateSection(id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSection(@PathVariable Long id) {
        sectionService.deleteSection(id);
        return ApiResponse.success();
    }
}
