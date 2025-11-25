package com.handi.backend.dto.oauth2;

import com.handi.backend.dto.user.UserDTO;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@RestController
public class CustomOAuth2User implements OAuth2User {
    private UserDTO user;

    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> collection = new ArrayList<>();
        return collection;
    }

    @Override
    public String getName() {
        return user.getName();
    }

    public String getToken(){
        return user.getToken();
    }

    public String getEmail(){
        return user.getEmail();
    }
}
