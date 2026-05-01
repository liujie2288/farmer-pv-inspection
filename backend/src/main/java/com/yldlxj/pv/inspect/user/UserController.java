package com.yldlxj.pv.inspect.user;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.UserConvert;
import com.yldlxj.pv.inspect.user.dto.UserCreateDto;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import com.yldlxj.pv.inspect.user.dto.UserUpdateDto;
import com.yldlxj.pv.inspect.auth.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import com.yldlxj.pv.inspect.common.annotation.AdminOnly;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<PageDto<UserDto>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status) {

        IPage<SysUser> userPage = userService.listUsers(page, size, keyword, role, status);

        return ApiResponse.success(PageDto.of(UserConvert.INSTANCE.toDtoList(userPage.getRecords()),
                userPage.getTotal(), userPage.getCurrent(), userPage.getSize()));
    }

    @AdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createUser(@Valid @RequestBody UserCreateDto dto) {
        Long id = userService.createUser(dto);
        log.info("创建用户: operatorId={}, newUserId={}, username={}", SecurityUtils.getCurrentUserId(), id, dto.getUsername());
        return ApiResponse.created(Map.of("id", id));
    }

    @AdminOnly
    @PutMapping("/{id}")
    public ApiResponse<Void> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDto dto) {
        userService.updateUser(id, dto);
        log.info("修改用户: operatorId={}, targetUserId={}", SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.success();
    }

    @AdminOnly
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        log.info("删除用户: operatorId={}, targetUserId={}", SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.success();
    }

    @AdminOnly
    @PutMapping("/{id}/status")
    public ApiResponse<Void> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        userService.toggleStatus(id, body.get("status"));
        log.info("变更用户状态: operatorId={}, targetUserId={}, status={}", SecurityUtils.getCurrentUserId(), id, body.get("status"));
        return ApiResponse.success();
    }
}
