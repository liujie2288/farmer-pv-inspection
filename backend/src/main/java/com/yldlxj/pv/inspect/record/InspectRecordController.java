package com.yldlxj.pv.inspect.record;

import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.common.annotation.AdminOnly;
import com.yldlxj.pv.inspect.record.dto.InspectRecordDto;
import com.yldlxj.pv.inspect.record.dto.vo.RecordDetailVo;
import com.yldlxj.pv.inspect.record.dto.vo.RecordSimpleVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/records")
public class InspectRecordController {

    private final InspectRecordService recordService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> submitRecord(@RequestBody InspectRecordDto recordDto) {
        Long id = recordService.submitRecord(recordDto);
        log.info("提交巡检记录: inspectorId={}, recordId={}, stationId={}", SecurityUtils.getCurrentUserId(), id, recordDto.getStationId());
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateRecord(@PathVariable Long id, @RequestBody InspectRecordDto recordDto) {
        recordService.updateRecord(id, recordDto);
        return ApiResponse.success();
    }

    @AdminOnly
    @PutMapping("/{id}/extend-deadline")
    public ApiResponse<Void> extendDeadline(@PathVariable Long id) {
        recordService.extendDeadline(id);
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

}
