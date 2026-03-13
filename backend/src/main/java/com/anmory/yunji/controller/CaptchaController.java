package com.anmory.yunji.controller;
import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import com.anmory.yunji.common.Captcha;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.io.IOException;
import java.util.Date;

@Slf4j
@RequestMapping("/captcha")
@RestController
public class CaptchaController {
    @Autowired
    private Captcha captcha;
    private final static Long VALIDATE_CODE = 60 * 1000L;
    @RequestMapping("/getCaptcha")
    public void getCaptcha(HttpServletResponse response, HttpSession session) throws IOException {
        // 设置响应内容类型,一般写在最上面
        response.setContentType("image/png");
        // 直接把验证码写入浏览器，没有返回值
        LineCaptcha lineCaptcha = CaptchaUtil.createLineCaptcha(captcha.getWidth(), captcha.getHeight(),4,4);
        String code = lineCaptcha.getCode();
        session.setAttribute(captcha.getSession().getKey(), code);
        session.setAttribute(captcha.getSession().getDate(),new Date());// 获取当前时间,用于检测是否超时
        lineCaptcha.write(response.getOutputStream());// 写入到浏览器里面，或者可以写到流里面
    }

    @RequestMapping("/check")
    public boolean check(String mycaptcha, HttpSession session) {
        log.info("[captchaCheck]用户输入的验证码:" + mycaptcha);
        String code = (String)session.getAttribute(captcha.getSession().getKey());
        if(!StringUtils.hasLength(code)) {
            return false;
        }
        Date date = (Date)session.getAttribute(captcha.getSession().getDate());
        if(mycaptcha.equalsIgnoreCase(code) && VALIDATE_CODE >= System.currentTimeMillis() - date.getTime()) {
            return true;
        }
        else{
            System.out.println("[captchaCheck]验证码已过期，请刷新重试");
        }
        return false;
    }
}
