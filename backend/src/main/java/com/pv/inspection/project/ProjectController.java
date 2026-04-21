package com.pv.inspection.project;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.pv.inspection.common.ApiResponse;
import com.pv.inspection.project.dto.ProjectDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ApiResponse<IPage<Project>> listProjects(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String projectName) {
        return ApiResponse.success(projectService.listProjects(page, size, projectName));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createProject(@Valid @RequestBody ProjectDTO dto) {
        Long id = projectService.createProject(dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDTO dto) {
        projectService.updateProject(id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ApiResponse.success();
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<Map<String, Object>> getProjectStats(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProjectStats(id));
    }
}
