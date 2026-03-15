package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {
    /*
    * 前端把所有的用户信息保存本地，选择性保存，密码可以不用存，存了userId就可以直接定位到用户了
    * 也没必要用security或者jwt加密，密码加密直接哈希加密就行了，想用其他加密也行，反正中间逻辑自己处理
    * 用localStorage，防止session过期要重新登录
    * 这样以后直接前端传userId就可以直接找到用户了，永久登录`
    * 为了方便关于用户的接口全部返回整个User类，不用管数据传输的冗余
    * */

    @Autowired
    private UserService userService;
    @Autowired
    private FamilyService familyService;

    // 注册：孕妇本人需填怀孕日、预产期；家庭成员可选；家庭成员可传 defaultRelationship 供加入家庭时沿用
    @PostMapping("/register")
    public Result<User> register(@RequestParam("username") String username,
                                 @RequestParam("password") String password,
                                 @RequestParam(value = "email", required = false) String email,
                                 @RequestParam(value = "userType", defaultValue = "pregnant") String userType,
                                 @RequestParam(value = "lastMenstrualDate", required = false) LocalDate lastMenstrualDate,
                                 @RequestParam(value = "pregnancyTime", required = false) LocalDateTime pregnancyTime,
                                 @RequestParam(value = "defaultRelationship", required = false) String defaultRelationship) {
        userService.register(username, password, email, userType, lastMenstrualDate, pregnancyTime, defaultRelationship);
        return Result.success();
    }

    // 登录
    @PostMapping("/login")
    public Result<User> login(@RequestParam("username") String username,
                              @RequestParam("password") String password) {
        User user = userService.login(username, password);
        enrichWithIsSpouse(user);
        return Result.success(user);
    }

    /** 根据家庭成员表填充 isSpouse，供前端判断是否开放 AI 对话等 */
    private void enrichWithIsSpouse(User user) {
        if (user == null || user.getUserId() == null) return;
        user.setIsSpouse(familyService.isSpouse(user.getUserId()));
    }

    // 绑定邮箱
    @PutMapping("/bindEmail")
    public Result<User> bindEmail(@RequestParam("userId") Integer userId,
                                  @RequestParam("email") String email) {
        userService.bindEmail(userId,email);
        return Result.success();
    }

    // 找回密码
    @PutMapping("/findPassword")
    public Result<User> findPassword(@RequestParam("email") String email,
                                     @RequestParam("newPassword") String newPassword) {
        userService.findPassword(email, newPassword);
        return Result.success();
    }

    // 修改密码（需提供原密码）
    @PutMapping("/changePassword")
    public Result<Void> changePassword(@RequestParam("userId") Integer userId,
                                       @RequestParam("oldPassword") String oldPassword,
                                       @RequestParam("newPassword") String newPassword) {
        userService.changePassword(userId, oldPassword, newPassword);
        return Result.success();
    }

    /** 发送修改密码验证码：登录后传 userId 发到绑定邮箱；未登录传 email 用于找回密码 */
    @PostMapping("/sendPasswordCode")
    public Result<Void> sendPasswordCode(@RequestParam(value = "userId", required = false) Integer userId,
                                         @RequestParam(value = "email", required = false) String email) {
        if (userId != null) {
            userService.sendPasswordCodeToUserEmail(userId);
        } else if (email != null && !email.isBlank()) {
            userService.sendPasswordCodeToEmail(email.trim());
        } else {
            return Result.error(400, "BAD_REQUEST", "请提供 userId 或 email");
        }
        return Result.success();
    }

    /** 凭验证码修改密码：登录后传 userId；未登录传 email */
    @PutMapping("/changePasswordByCode")
    public Result<Void> changePasswordByCode(@RequestParam(value = "userId", required = false) Integer userId,
                                             @RequestParam(value = "email", required = false) String email,
                                             @RequestParam("code") String code,
                                             @RequestParam("newPassword") String newPassword) {
        userService.changePasswordByCode(userId, email, code, newPassword);
        return Result.success();
    }

    // 上传头像
    @PostMapping("/uploadAvatar")
    public Result<User> uploadAvatar(@RequestParam("userId") Integer userId,
                                    @RequestParam("file") MultipartFile file) {
        User user = userService.uploadAvatar(userId, file);
        enrichWithIsSpouse(user);
        return Result.success(user);
    }

    // 更新头像
    @PutMapping("/updateAvatar")
    public Result<User> updateAvatar(@RequestParam("userId") Integer userId,
                                    @RequestParam("file") MultipartFile file) {
        User user = userService.updateAvatar(userId, file);
        enrichWithIsSpouse(user);
        return Result.success(user);
    }

    // 注销用户
    @DeleteMapping("/deleteUser")
    public Result<Boolean> deleteUser(@RequestParam("userId") Integer userId) {

        userService.deleteUser(userId);
        return Result.success();
    }

    // 修改用户名
    @PutMapping("/updateUsername")
    public Result<User> updateUsername(@RequestParam("userId") Integer userId,
                                       @RequestParam("username") String username) {
        User user = userService.updateUsername(userId, username);
        enrichWithIsSpouse(user);
        return Result.success(user);
    }

    // 更新家人共享分享范围
    @PutMapping("/updateShareScope")
    public Result<User> updateShareScope(@RequestParam("userId") Integer userId,
                                         @RequestParam("shareScope") String shareScope) {
        User user = userService.updateShareScope(userId, shareScope);
        return Result.success(user);
    }

    // 更新怀孕日与预产期
    @PutMapping("/updatePregnancy")
    public Result<Void> updatePregnancy(@RequestParam("userId") Integer userId,
                                        @RequestParam("lastMenstrualDate") LocalDate lastMenstrualDate,
                                        @RequestParam("pregnancyTime") LocalDateTime pregnancyTime) {
        userService.updatePregnancy(userId, lastMenstrualDate, pregnancyTime);
        return Result.success();
    }

    // 隐私设置：数据收集开关（持久化到后端）
    @GetMapping("/privacy/dataCollection")
    public Result<Boolean> getDataCollectionEnabled(@RequestParam("userId") Integer userId) {
        User user = userService.getById(userId);
        if (user == null) return Result.error(404, "NOT_FOUND", "用户不存在");
        return Result.success(Boolean.TRUE.equals(user.getDataCollectionEnabled()));
    }

    @PutMapping("/privacy/dataCollection")
    public Result<Void> updateDataCollectionEnabled(@RequestParam("userId") Integer userId,
                                                     @RequestParam("enabled") Boolean enabled) {
        userService.updateDataCollectionEnabled(userId, enabled != null && enabled);
        return Result.success();
    }

    // 更新用户角色（孕妇/家庭成员）
    @PutMapping("/updateUserType")
    public Result<User> updateUserType(@RequestParam("userId") Integer userId,
                                       @RequestParam("userType") String userType) {
        User user = userService.updateUserType(userId, userType);
        enrichWithIsSpouse(user);
        return Result.success(user);
    }

    /** 获取当前用户信息（含 isSpouse），用于前端刷新权限 */
    @GetMapping("/getById")
    public Result<User> getById(@RequestParam("userId") Integer userId) {
        User user = userService.getById(userId);
        if (user == null) return Result.error(404, "NOT_FOUND", "用户不存在");
        enrichWithIsSpouse(user);
        return Result.success(user);
    }
}
