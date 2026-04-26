package com.yldlxj.pv.inspect.record;

import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.record.dto.InspectRecordDto;
import com.yldlxj.pv.inspect.record.dto.vo.RecordDetailVo;
import com.yldlxj.pv.inspect.record.dto.vo.RecordSimpleVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/records")
public class InspectRecordController {

    private final InspectRecordService recordService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> submitRecord(@RequestBody InspectRecordDto recordDto) {
        Long id = recordService.submitRecord(recordDto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateRecord(@PathVariable Long id, @RequestBody InspectRecordDto recordDto) {
        recordService.updateRecord(id, recordDto);
        return ApiResponse.success();
    }

    @GetMapping("/{id}")
    public ApiResponse<RecordDetailVo> getRecordDetail(@PathVariable Long id) {
        return ApiResponse.success(recordService.getRecordDetail(id));
    }

    @GetMapping
    public ApiResponse<PageDto<RecordSimpleVo>> listRecords(
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(recordService.listRecords(stationId, planId, keyword, status, page, size));
    }

    @PostMapping("/photos/upload")
    public ApiResponse<Map<String, String>> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sectionId") Integer sectionId,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "latitude", required = false) Double latitude) {
        String url = recordService.uploadPhoto(file, sectionId, longitude, latitude);
        return ApiResponse.success(Map.of("url", url));
    }
}
