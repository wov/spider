package com.wov.spider_web.controller;

import com.wov.spider_web.pojo.Users;
import com.wov.spider_web.pojo.bo.UserBO;
import com.wov.spider_web.service.UserService;
import com.wov.spider_web.util.CookieUtils;
import com.wov.spider_web.util.JsonUtils;
import com.wov.spider_web.util.MD5Utils;
import com.wov.spider_web.util.SpiderJsonResult;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Objects;


@RestController
@RequestMapping("/spider/passport")
public class PassportController {

    @Autowired
    private UserService userService;

    /**
     * 用户名是否存在
     *
     * @param username 用户名
     * @return 结果
     */
    @GetMapping("/usernameIsExist")
    public SpiderJsonResult usernameIsExist(@RequestParam String username) {
        // 1. 判断用户名不能为空
        if (StringUtils.isBlank(username)) {
            return SpiderJsonResult.errorMsg("用户名不能为空");
        }

        // 2. 查找注册的用户名是否存在
        boolean isExist = userService.queryUsernameIsExist(username);
        if (isExist) {
            return SpiderJsonResult.errorMsg("用户名已经存在");
        }

        // 3. 请求成功，用户名没有重复
        return SpiderJsonResult.ok();
    }

    @PostMapping("/register")
    public SpiderJsonResult register(@RequestBody UserBO userBO,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        String username = userBO.getUsername();
        String password = userBO.getPassword();
        String confirmPwd = userBO.getConfirmPassword();

        // 0. 判断用户名和密码必须不为空
        if (StringUtils.isBlank(username) ||
                StringUtils.isBlank(password) ||
                StringUtils.isBlank(confirmPwd)) {
            return SpiderJsonResult.errorMsg("用户名或密码不能为空");
        }

        // 1. 查询用户名是否存在
        boolean isExist = userService.queryUsernameIsExist(username);
        if (isExist) {
            return SpiderJsonResult.errorMsg("用户名已经存在");
        }

        // 2. 密码长度不能少于6位
        if (password.length() < 6) {
            return SpiderJsonResult.errorMsg("密码长度不能少于6");
        }

        // 3. 判断两次密码是否一致
        if (!password.equals(confirmPwd)) {
            return SpiderJsonResult.errorMsg("两次密码输入不一致");
        }

        // 4. 实现注册
        Users userResult = userService.createUser(userBO);
        setNullProperty(userResult);

        CookieUtils.setCookie(request, response, "user",
                JsonUtils.objectToJson(userResult), true);

        // TODO 生成用户token，存入redis会话
        // TODO 同步购物车数据

        return SpiderJsonResult.ok();
    }

    @PostMapping("/login")
    public SpiderJsonResult login(@RequestBody UserBO userBO,
                                  HttpServletRequest request,
                                  HttpServletResponse response) throws Exception {
        String username = userBO.getUsername();
        String password = userBO.getPassword();

        // 0. 判断用户名和密码必须不为空
        if (StringUtils.isBlank(username) ||
                StringUtils.isBlank(password)) {
            return SpiderJsonResult.errorMsg("用户名或密码不能为空");
        }

        // 1. 实现登录
        Users userResult = userService.queryUserForLogin(username, MD5Utils.getMD5Str(password));
        if (Objects.isNull(userResult)) {
            return SpiderJsonResult.errorMsg("用户名或密码不正确");
        }

        setNullProperty(userResult);

        CookieUtils.setCookie(request, response, "user",
                JsonUtils.objectToJson(userResult), true);


        // TODO 生成用户token，存入redis会话
        // TODO 同步购物车数据

        return SpiderJsonResult.ok(userResult);
    }

    private Users setNullProperty(Users userResult) {
        userResult.setPassword(null);
        userResult.setMobile(null);
        userResult.setEmail(null);
        userResult.setCreatedTime(null);
        userResult.setUpdatedTime(null);
        userResult.setBirthday(null);
        return userResult;
    }

    @PostMapping("/logout")
    public SpiderJsonResult logout(@RequestParam String userId,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        // 清除用户的相关信息的cookie
        CookieUtils.deleteCookie(request, response, "user");

        // TODO 用户退出登录，需要清空购物车
        // TODO 分布式会话中需要清除用户数据

        return SpiderJsonResult.ok();
    }

}
