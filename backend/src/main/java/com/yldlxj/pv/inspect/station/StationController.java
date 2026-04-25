package com.yldlxj.pv.inspect.station;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.station.dto.StationDto;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping
    public ApiResponse<PageDto<StationViewVo>> listStations(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer inspectStatus) {
        return ApiResponse.success(stationService.listStations(projectId, page, size, keyword, inspectStatus));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createStation(@PathVariable Long projectId, @Valid @RequestBody StationDto dto) {
        Long id = stationService.createStation(projectId, dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PostMapping("/import")
    public ApiResponse<Map<String, Object>> importStations(@PathVariable Long projectId, @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(stationService.importStations(projectId, file));
    }

    @GetMapping("/{id}")
    public ApiResponse<StationViewVo> getStationDetail(@PathVariable Long projectId, @PathVariable Long id) {
        return ApiResponse.success(stationService.getStationDetail(projectId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateStation(@PathVariable Long projectId, @PathVariable Long id, @Valid @RequestBody StationDto dto) {
        stationService.updateStation(projectId, id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteStation(@PathVariable Long projectId, @PathVariable Long id) {
        stationService.deleteStation(projectId, id);
        return ApiResponse.success();
    }

    @DeleteMapping("/batch")
    public ApiResponse<Map<String, Integer>> batchDeleteStations(@PathVariable Long projectId, @RequestBody Map<String, List<Long>> body) {
        int count = stationService.batchDeleteStations(projectId, body.get("ids"));
        return ApiResponse.success(Map.of("deletedCount", count));
    }


}
