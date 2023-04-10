package com.wov.spider_web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import tk.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan(basePackages = "com.wov.spider_web.mapper")
public class SpiderWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpiderWebApplication.class, args);
    }

}
