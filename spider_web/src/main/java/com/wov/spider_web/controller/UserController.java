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
@RequestMapping("/spider/user")
public class UserController {

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

}
