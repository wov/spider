package com.wov.spider_web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/spider")
public class PageController {

    @RequestMapping("/{page}")
    public String toPage(@PathVariable String page) {
        return page;
    }
}
