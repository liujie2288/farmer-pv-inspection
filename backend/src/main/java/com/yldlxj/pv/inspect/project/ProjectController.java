package com.yldlxj.pv.inspect.project;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.ProjectConvert;
import com.yldlxj.pv.inspect.plan.InspectPlanService;
import com.yldlxj.pv.inspect.plan.dto.PlanProjectViewVo;
import com.yldlxj.pv.inspect.project.dto.ProjectDto;
import com.yldlxj.pv.inspect.project.dto.ProjectViewVo;
import com.yldlxj.pv.inspect.section.dto.SectionViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final InspectPlanService inspectPlanService;

    @GetMapping
    public ApiResponse<PageDto<ProjectViewVo>> listProjects(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String projectName) {

        Page<Project> projectPage = projectService.listProjects(page, size, projectName);

        return ApiResponse.success(PageDto.of(ProjectConvert.INSTANCE.toVoList(projectPage.getRecords()),
                projectPage.getTotal(),
                projectPage.getCurrent(),
                projectPage.getSize()));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<Map<String, Object>> getProjectStats(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProjectStats(id));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectViewVo> getProject(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProjectById(id));
    }

    @GetMapping("/{id}/plan")
    public ApiResponse<PlanProjectViewVo> getProjectPlan(@PathVariable Long id) {
        return ApiResponse.success(inspectPlanService.getActivePlanByProjectId(id));
    }

    @GetMapping("/{id}/sections")
    public ApiResponse<List<SectionViewVo>> getProjectSections(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProjectSections(id));
    }

    @PostMapping("/plans/batch")
    public ApiResponse<Map<Long, PlanProjectViewVo>> batchGetProjectPlans(@RequestBody List<Long> projectIds) {
        return ApiResponse.success(inspectPlanService.getActivePlansByProjectIds(projectIds));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createProject(@Valid @RequestBody ProjectDto dto) {
        Long id = projectService.createProject(dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDto dto) {
        projectService.updateProject(id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ApiResponse.success();
    }


}
