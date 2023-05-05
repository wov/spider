package com.wov.spider_web.service.impl;

import com.wov.spider_web.enums.Sex;
import com.wov.spider_web.mapper.UsersMapper;
import com.wov.spider_web.pojo.Users;
import com.wov.spider_web.pojo.bo.UserBO;
import com.wov.spider_web.service.UserService;
import com.wov.spider_web.util.DateUtil;
import com.wov.spider_web.util.MD5Utils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tk.mybatis.mapper.entity.Example;

import java.util.Date;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    public UsersMapper usersMapper;

    private static final String USER_FACE = "";

    @Transactional(propagation = Propagation.SUPPORTS)
    @Override
    public boolean queryUsernameIsExist(String username) {

        Example userExample = new Example(Users.class);
        Example.Criteria userCriteria = userExample.createCriteria();

        userCriteria.andEqualTo("username", username);

        Users result = usersMapper.selectOneByExample(userExample);

        return result != null;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    @Override
    public Users createUser(UserBO userBO) {
        Users user = new Users();
        user.setUsername(userBO.getUsername());
        try {
            user.setPassword(MD5Utils.getMD5Str(userBO.getPassword()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        // 默认用户昵称同用户名
        user.setNickname(userBO.getUsername());
        // 默认头像
        user.setFace(USER_FACE);
        // 默认生日
        user.setBirthday(DateUtil.stringToDate("1900-01-01"));
        // 默认性别为 保密
        user.setSex(Sex.secret.type);

        user.setCreatedTime(new Date());
        user.setUpdatedTime(new Date());

        usersMapper.insert(user);
        log.info(String.format("%s成功注册", user.getUsername()));

        return user;
    }

    @Transactional(propagation = Propagation.SUPPORTS)
    @Override
    public Users queryUserForLogin(String username, String password) {

        Example userExample = new Example(Users.class);
        Example.Criteria userCriteria = userExample.createCriteria();

        userCriteria.andEqualTo("username", username);
        userCriteria.andEqualTo("password", password);

        Users result = usersMapper.selectOneByExample(userExample);

        return result;
    }
}
