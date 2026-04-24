package com.yldlxj.pv.inspect.user;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.PageDto;
import com.yldlxj.pv.inspect.convert.UserConvert;
import com.yldlxj.pv.inspect.user.dto.UserCreateDto;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import com.yldlxj.pv.inspect.user.dto.UserUpdateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Long>> createUser(@Valid @RequestBody UserCreateDto dto) {
        Long id = userService.createUser(dto);
        return ApiResponse.created(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDto dto) {
        userService.updateUser(id, dto);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success();
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        userService.toggleStatus(id, body.get("status"));
        return ApiResponse.success();
    }
}
