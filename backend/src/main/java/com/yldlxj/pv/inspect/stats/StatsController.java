package com.yldlxj.pv.inspect.stats;

import com.yldlxj.pv.inspect.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/global")
    public ApiResponse<Map<String, Object>> getGlobalStats() {
        return ApiResponse.success(statsService.getGlobalStats());
    }

    @GetMapping("/project/{id}")
    public ApiResponse<Map<String, Object>> getProjectStats(@PathVariable Long id) {
        return ApiResponse.success(statsService.getProjectStats(id));
    }
}
