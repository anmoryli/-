package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    // 注册
    @PostMapping("/register")
    public Result<User> register(@RequestParam("username") String username,
                                 @RequestParam("password") String password,
                                 @RequestParam(value = "email", required = false) String email,
                                 @RequestParam("pregnancyTime")LocalDateTime pregnancyTime) {

        userService.register(username,password,email,pregnancyTime);

        return Result.success();
    }

    // 登录
    @PostMapping("/login")
    public Result<User> login(@RequestParam("username") String username,
                              @RequestParam("password") String password) {

      User user = userService.login(username,password);

        return Result.success(user);
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
        // 通过邮箱定位用户，然后更新用户密码
        userService.findPassword(email,newPassword);

        return Result.success();
    }

    // 上传头像
    @PostMapping("/uploadAvatar")
    public Result<User> uploadAvatar(@RequestParam("userId") Integer userId,
                                     @RequestParam("file")MultipartFile file) {
        // 调用OSS的上传服务，把用户头像上传到OSS服务器，objectKey就是/yunji/user_id/avatar/filename
       userService.uploadAvatar(userId,file);
        return Result.success();
    }

    // 更新头像
    @PutMapping("/updateAvatar")
    public Result<User> updateAvatar(@RequestParam("userId") Integer userId,
                                     @RequestParam("file")MultipartFile file) {
        // 先把用户原有的头像删掉，然后在上传，调用OSS删除文件的接口也有
        userService.updateAvatar(userId,file);
        return Result.success();
    }

    // 注销用户
    @DeleteMapping("/deleteUser")
    public Result<Boolean> deleteUser(@RequestParam("userId") Integer userId) {

        userService.deleteUser(userId);
        return Result.success();
    }


}
