package com.yldlxj.pv.inspect.export;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.annotation.AdminOnly;
import com.yldlxj.pv.inspect.export.dto.ExportTaskFileDto;
import com.yldlxj.pv.inspect.export.dto.ExportTaskVo;
import com.yldlxj.pv.inspect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/inspect/export")
public class ExportTaskController {

    private final StorageService storageService;
    private final ExportTaskService exportTaskService;

    @AdminOnly
    @PostMapping("/tasks")
    public ApiResponse<List<ExportTaskVo>> createTasks(@RequestParam Long planId, @RequestParam(defaultValue = "pdf") String type, @RequestBody List<Long> projectIds) {
        for (Long projectId : projectIds) {
            ExportTask exists = exportTaskService.findExistingTask(planId, projectId, type);
            if (exists != null && exists.getStatus() == 3) {
                return ApiResponse.error(456, "该项目24小时内已导出过，请直接下载");
            } else if (exists != null && exists.getStatus() <= 2) {
                return ApiResponse.error(456, "该项目正在排队打包中，请勿重复操作");
            }
        }
        return ApiResponse.success(exportTaskService.createTasks(planId, projectIds, type));
    }

    @AdminOnly
    @GetMapping("/tasks")
    public ApiResponse<List<ExportTaskVo>> listTasks(@RequestParam Long planId) {
        return ApiResponse.success(exportTaskService.listTasks(planId));
    }

    @AdminOnly
    @GetMapping("/tasks/{id}")
    public ApiResponse<ExportTaskVo> getTask(@PathVariable Long id) {
        return ApiResponse.success(exportTaskService.getTask(id));
    }

    @AdminOnly
    @GetMapping("/tasks/{id}/download")
    public ApiResponse<String> getDownloadUrl(@PathVariable Long id, @RequestParam Integer batchNo) {
        ExportTaskVo task = exportTaskService.getTask(id);
        if (task == null || task.getFiles() == null) {
            return ApiResponse.error(404, "任务不存在或未完成");
        }
        ExportTaskFileDto file = task.getFiles().stream().filter(f -> batchNo.equals(f.getBatchNo())).findFirst().orElse(null);
        if (file == null || file.getOssKey() == null) {
            return ApiResponse.error(404, "文件不存在");
        }
        String url = storageService.getDownloadPresignedUrl(file.getOssKey(), file.getFileName(), 60 * 24);
        return ApiResponse.success(url);
    }
}
