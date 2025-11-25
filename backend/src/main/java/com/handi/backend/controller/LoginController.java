package com.handi.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {
    @GetMapping("/login")
    public String loginPage() {
        // TODO 인증 정보 없을때 안내할 페이지
        return "redirect:/login.html";
    }
}