package com.handi.backend.dto.user;

import com.handi.backend.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class UserDTO {
    private Integer id;
    private String name;
    private String email;
    private Role role;
    private String token;
}
