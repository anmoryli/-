package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.FamilyMember;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.mapper.UserMapper;

import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.AliOssUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Random;

import org.springframework.data.redis.core.StringRedisTemplate;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AliOssUtil aliOssUtil;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Autowired(required = false)
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private MailService mailService;

    @Autowired
    private FamilyMemberMapper familyMemberMapper;

    private static final String REDIS_KEY_PWD_CODE = "pwd_code:";
    private static final Duration PWD_CODE_TTL = Duration.ofMinutes(10);
    private static final Random RANDOM = new Random();

    @Override
    public void register(String username, String password, String email, String userType, LocalDate lastMenstrualDate, LocalDateTime pregnancyTime, String defaultRelationship) {
        // 1. 校验用户名是否已存在
        User haveuser = userMapper.selectByUsername(username);
        if (haveuser != null && haveuser.getUsername() != null) {
            throw new BusinessException("用户已存在");
        }
        // 2. 校验邮箱是否已绑定（如果传了邮箱）
        if (email != null && !email.isEmpty()) {
            User emailUser = userMapper.selectByEmail(email);
            if (emailUser != null) {
                throw new BusinessException("该邮箱已被绑定，请更换邮箱");
            }
        }
        // 3. 孕妇本人需填怀孕日、预产期
        if ("pregnant".equals(userType) && (lastMenstrualDate == null || pregnancyTime == null)) {
            throw new BusinessException("请选择怀孕日和预产期");
        }
        // 4. 家庭成员时可选填默认关系（加入家庭时沿用）。配偶/婆婆/妈妈/爸爸为合法选项；选「其他」时自定义内容不能为配偶类
        if ("family_member".equals(userType) && defaultRelationship != null && !defaultRelationship.isBlank()) {
            String rel = defaultRelationship.trim();
            if (rel.equals("老公") || rel.equals("丈夫")) {
                throw new BusinessException("请选择配偶、婆婆、妈妈、爸爸或输入其他关系");
            }
        }
        // md5加密
        password = DigestUtils.md5DigestAsHex(password.getBytes());

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(password);
        user.setEmail(email);
        user.setUserType(userType != null ? userType : "pregnant");
        user.setLastMenstrualDate(lastMenstrualDate);
        user.setPregnancyTime(pregnancyTime);
        user.setDefaultRelationship(defaultRelationship != null && !defaultRelationship.isBlank() ? defaultRelationship.trim() : null);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);
    }

    @Override
    @Cacheable(value = "user", key = "#userId", unless = "#result == null")
    public User getById(Integer userId) {
        if (userId == null) return null;
        return userMapper.selectById(userId);
    }

    @Override
    public Boolean getDataCollectionEnabled(Integer userId) {
        User user = userMapper.selectById(userId);
        return user != null ? Boolean.TRUE.equals(user.getDataCollectionEnabled()) : false;
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void updateDataCollectionEnabled(Integer userId, boolean enabled) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setDataCollectionEnabled(enabled);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
    }

    @Override
    public Boolean getCommunityEnabled(Integer userId) {
        User user = userMapper.selectById(userId);
        return user != null ? Boolean.TRUE.equals(user.getCommunityEnabled()) : false;
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void updateCommunityEnabled(Integer userId, boolean enabled) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setCommunityEnabled(enabled);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
    }

    @Override
    public Boolean getEmailEnabled(Integer userId) {
        User user = userMapper.selectById(userId);
        return user == null || !Boolean.FALSE.equals(user.getEmailEnabled());
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void updateEmailEnabled(Integer userId, boolean enabled) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setEmailEnabled(enabled);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User updateUserType(Integer userId, String userType, String defaultRelationship) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (userType == null || (!"pregnant".equals(userType) && !"family_member".equals(userType))) {
            return userMapper.selectById(userId);
        }

        if ("family_member".equals(userType) && defaultRelationship != null && !defaultRelationship.isBlank()) {
            String rel = defaultRelationship.trim();
            List<FamilyMember> memberships = familyMemberMapper.findByUserId(userId);
            if (!memberships.isEmpty()) {
                FamilyMember myMembership = memberships.get(0);
                Integer familyId = myMembership.getFamilyId();
                List<FamilyMember> allMembers = familyMemberMapper.findByFamilyId(familyId);

                boolean isSpouseRole = "配偶".equals(rel) || "老公".equals(rel) || "丈夫".equals(rel) || "老婆".equals(rel);
                for (FamilyMember m : allMembers) {
                    if (m.getUserId().equals(userId)) continue;
                    if (isSpouseRole && Boolean.TRUE.equals(m.getIsSpouse())) {
                        throw new BusinessException("家里已经有一位配偶啦，换个身份试试吧～");
                    }
                    if (rel.equals(m.getRelationship())) {
                        throw new BusinessException("家里已经有一位" + rel + "啦，换个身份试试吧～");
                    }
                }

                familyMemberMapper.updateRelationship(myMembership.getMemberId(), rel);
                if (isSpouseRole) {
                    familyMemberMapper.updateIsSpouse(myMembership.getMemberId(), true);
                }
            }
            user.setDefaultRelationship(rel);
        }

        user.setUserType(userType);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return userMapper.selectById(userId);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User adminUpdateUser(Integer userId, String username, String email, String userType) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (username != null && !username.isBlank()) {
            User existing = userMapper.selectByUsername(username);
            if (existing != null && !existing.getUserId().equals(userId)) {
                throw new BusinessException("用户名已被使用");
            }
            user.setUsername(username.trim());
        }
        if (email != null) user.setEmail(email.isBlank() ? null : email.trim());
        if (userType != null && ("pregnant".equals(userType) || "family_member".equals(userType))) {
            user.setUserType(userType);
        }
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return userMapper.selectById(userId);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void updatePregnancy(Integer userId, LocalDate lastMenstrualDate, LocalDateTime pregnancyTime) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setLastMenstrualDate(lastMenstrualDate);
        user.setPregnancyTime(pregnancyTime);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User updateShareScope(Integer userId, String shareScope) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (shareScope != null && ("all".equals(shareScope) || "letters".equals(shareScope) || "photos".equals(shareScope))) {
            user.setShareScope(shareScope);
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.update(user);
        }
        return userMapper.selectById(userId);
    }

    @Override
    public User login(String username, String password) {

        User user = userMapper.selectByUsername(username);
        if (user==null){
            throw new BusinessException("用户不存在");
        }
         password = DigestUtils.md5DigestAsHex(password.getBytes());
        if (!password.equals(user.getPasswordHash())) {
            //密码错误
            throw new BusinessException("密码错误");

        }
        return user;
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void bindEmail(Integer userId, String email) {
        if (email == null || email.isBlank()) return;
        User current = userMapper.selectById(userId);
        if (current == null) {
            throw new BusinessException("用户不存在");
        }
        String trimmed = email.trim();
        if (trimmed.equals(current.getEmail())) {
            return;
        }
        User other = userMapper.selectByEmail(trimmed);
        if (other != null && !other.getUserId().equals(userId)) {
            throw new BusinessException("该邮箱已被其他账号绑定");
        }
        current.setEmail(trimmed);
        current.setUpdatedAt(LocalDateTime.now());
        userMapper.update(current);
    }

    @Override
    public void findPassword(String email, String newPassword) {
        //校验邮箱是否绑定
        User user = userMapper.selectByEmail(email);
        if (user==null){
            throw new BusinessException("邮箱未绑定");
        }
        //md5加密
        newPassword = DigestUtils.md5DigestAsHex(newPassword.getBytes());
        //更新密码
        user.setPasswordHash(newPassword);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        if (cacheManager != null && user.getUserId() != null) {
            var cache = cacheManager.getCache("user");
            if (cache != null) cache.evict(user.getUserId());
        }
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        String oldHash = DigestUtils.md5DigestAsHex(oldPassword.getBytes());
        if (!oldHash.equals(user.getPasswordHash())) {
            throw new BusinessException("原密码错误");
        }
        String newHash = DigestUtils.md5DigestAsHex(newPassword.getBytes());
        user.setPasswordHash(newHash);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
    }

    @Override
    public void sendPasswordCodeToUserEmail(Integer userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (Boolean.FALSE.equals(user.getEmailEnabled())) throw new BusinessException("你已关闭邮箱消息接收，无法发送验证码");
        String email = user.getEmail();
        if (email == null || email.isBlank()) throw new BusinessException("请先绑定邮箱");
        sendPasswordCodeToEmail(email.trim());
    }

    @Override
    public void sendPasswordCodeToEmail(String email) {
        if (email == null || email.isBlank()) throw new BusinessException("请输入邮箱");
        String trimmed = email.trim();
        User user = userMapper.selectByEmail(trimmed);
        if (user == null) throw new BusinessException("该邮箱未绑定任何账号");
        if (Boolean.FALSE.equals(user.getEmailEnabled())) throw new BusinessException("你已关闭邮箱消息接收，无法发送验证码");
        if (stringRedisTemplate == null) throw new BusinessException("验证码服务暂不可用，请稍后再试");
        String code = String.format("%06d", 100000 + RANDOM.nextInt(900000));
        String key = REDIS_KEY_PWD_CODE + trimmed;
        stringRedisTemplate.opsForValue().set(key, code, PWD_CODE_TTL);
        String subject = "孕期宝 - 验证码";
        String content = "您的验证码是：" + code + "，10分钟内有效。如非本人操作请忽略。";
        mailService.sendTextMail(trimmed, subject, content);
    }

    @Override
    public void changePasswordByCode(Integer userId, String email, String code, String newPassword) {
        String targetEmail;
        if (userId != null) {
            User user = userMapper.selectById(userId);
            if (user == null) throw new BusinessException("用户不存在");
            targetEmail = user.getEmail();
            if (targetEmail == null || targetEmail.isBlank()) throw new BusinessException("请先绑定邮箱");
            targetEmail = targetEmail.trim();
        } else if (email != null && !email.isBlank()) {
            targetEmail = email.trim();
        } else {
            throw new BusinessException("请提供用户或邮箱");
        }
        if (code == null || code.isBlank()) throw new BusinessException("请输入验证码");
        if (newPassword == null || newPassword.length() < 6) throw new BusinessException("新密码至少6位");
        if (stringRedisTemplate == null) throw new BusinessException("验证码服务暂不可用，请稍后再试");
        String key = REDIS_KEY_PWD_CODE + targetEmail;
        String stored = stringRedisTemplate.opsForValue().get(key);
        if (stored == null || !stored.trim().equals(code.trim())) throw new BusinessException("验证码错误或已过期");
        stringRedisTemplate.delete(key);
        User user = userMapper.selectByEmail(targetEmail);
        if (user == null) throw new BusinessException("用户不存在");
        String newHash = DigestUtils.md5DigestAsHex(newPassword.getBytes());
        user.setPasswordHash(newHash);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        if (cacheManager != null && user.getUserId() != null) {
            var cache = cacheManager.getCache("user");
            if (cache != null) cache.evict(user.getUserId());
        }
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User uploadAvatar(Integer userId, MultipartFile file) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        String avatarUrl = aliOssUtil.uploadAvatar(userId, file);
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return userMapper.selectById(userId);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User updateAvatar(Integer userId, MultipartFile file) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (user.getAvatarUrl() != null) {
            aliOssUtil.deleteFile(user.getAvatarUrl());
        }
        String avatarUrl = aliOssUtil.uploadAvatar(userId, file);
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return userMapper.selectById(userId);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public User updateUsername(Integer userId, String username) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (username == null || username.isBlank()) {
            throw new BusinessException("用户名不能为空");
        }
        String trimmed = username.trim();
        User exist = userMapper.selectByUsername(trimmed);
        if (exist != null && !exist.getUserId().equals(userId)) {
            throw new BusinessException("该用户名已被使用");
        }
        user.setUsername(trimmed);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return userMapper.selectById(userId);
    }

    @Override
    @CacheEvict(value = "user", key = "#userId")
    public void deleteUser(Integer userId) {
        //校验userId是否存在
        User user = userMapper.selectById(userId);
        if (user==null){
            throw new BusinessException("用户不存在");
        }
        //先删除原来旧的头像  确失接口
        if (user.getAvatarUrl()!=null){
            aliOssUtil.deleteFile(user.getAvatarUrl());
        }
        //删除数据库中的用户
        userMapper.deleteById(userId);
    }

    @Override
    public List<User> getAllUsers() {

        if (userMapper.selectList().isEmpty()){
            throw new BusinessException("用户列表为空");
        }
        List<User> users = userMapper.selectList();
        return users;
    }

    @Override
    public Integer getUserCount() {
        Integer userCount = userMapper.selectCount();
        return userCount;
    }

    @Override
    public List<Objects> getUserRecordsByUserId(Integer userId) {
        List<Objects> userRecords = userMapper.selectUserRecordsByUserId(userId);
        return userRecords;
    }

    @Override
    public Integer getNewUserCountByDay(LocalDateTime now) {
        // 关键：将任意时间截断为【当天0点0分0秒0纳秒】
        LocalDateTime dayStart = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        Integer newUserCount = userMapper.selectNewUserCountByDay(dayStart);

        return newUserCount == null ? 0 : newUserCount;
    }

    // 按月统计新用户数
    @Override
    public Integer getNewUserCountByMonth(LocalDateTime now) {

        LocalDateTime monthStart = now.withDayOfMonth(1) // 改为当月1号
                .withHour(0)
                .withMinute(0)
                .withSecond(0)     // 秒置0
                .withNano(0);
        Integer newUserCount = userMapper.selectNewUserCountByMonth(monthStart);
        return newUserCount == null ? 0 : newUserCount;
    }

    // 按年统计新用户数
    @Override
    public Integer getNewUserCountByYear(LocalDateTime now) {

        LocalDateTime yearStart = now.withMonth(1)       // 改为1月
                .withDayOfMonth(1)  // 改为1号
                .withHour(0)        // 小时置0
                .withMinute(0)      // 分钟置0
                .withSecond(0)      // 秒置0
                .withNano(0);       // 纳秒置0
        Integer newUserCount = userMapper.selectNewUserCountByYear(yearStart);
        return newUserCount == null ? 0 : newUserCount;
    }

    @Override
    public Integer getUserCountByTime(LocalDateTime start, LocalDateTime end) {
        Integer userCount = userMapper.selectUserCountByTime(start, end);
        return userCount == null ? 0 : userCount;
    }
}
