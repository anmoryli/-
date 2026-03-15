package com.anmory.yunji.service;

import com.anmory.yunji.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

public interface UserService {
    /**
     * 注册（孕妇本人需填怀孕日、预产期；家庭成员可选 defaultRelationship 供加入家庭时沿用）
     */
    void register(String username, String password, String email, String userType, java.time.LocalDate lastMenstrualDate, LocalDateTime pregnancyTime, String defaultRelationship);

    User login(String username, String password);

    User getById(Integer userId);

    void updatePregnancy(Integer userId, java.time.LocalDate lastMenstrualDate, LocalDateTime pregnancyTime);

    User updateShareScope(Integer userId, String shareScope);

    User updateUsername(Integer userId, String username);

    void bindEmail(Integer userId, String email);

    void findPassword(String email, String newPassword);

    void changePassword(Integer userId, String oldPassword, String newPassword);

    /** 向用户绑定邮箱发送 6 位验证码（登录后改密用），未绑定邮箱抛异常 */
    void sendPasswordCodeToUserEmail(Integer userId);

    /** 向指定邮箱发送 6 位验证码（找回密码用），邮箱未绑定用户抛异常 */
    void sendPasswordCodeToEmail(String email);

    /** 凭邮箱验证码修改密码：登录后传 userId，未登录传 email */
    void changePasswordByCode(Integer userId, String email, String code, String newPassword);

    User uploadAvatar(Integer userId, MultipartFile file);

    User updateAvatar(Integer userId, MultipartFile file);

    void deleteUser(Integer userId);

    //admin
    List<User> getAllUsers();

    Integer getUserCount();

    List<Objects> getUserRecordsByUserId(Integer userId);



    Integer getNewUserCountByDay(LocalDateTime now);

    Integer getNewUserCountByMonth(LocalDateTime now);

    Integer getNewUserCountByYear(LocalDateTime now);

    Integer getUserCountByTime(LocalDateTime start, LocalDateTime end);

    User updateUserType(Integer userId, String userType);

    /**
     * 管理员更新用户信息（仅允许修改 username、email、userType）
     */
    User adminUpdateUser(Integer userId, String username, String email, String userType);

    /** 获取用户数据收集偏好 */
    Boolean getDataCollectionEnabled(Integer userId);

    /** 更新用户数据收集偏好 */
    void updateDataCollectionEnabled(Integer userId, boolean enabled);
}
