package edu.whu.MagicNote.security;

import edu.whu.MagicNote.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping
public class AuthenticationController {
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    private DbUserDetailService userDetailsService;
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User user) {
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getName());
            if (passwordEncoder.matches(user.getPassword(), userDetails.getPassword())) {
                final String token = jwtTokenUtil.generateToken(userDetails);
                return ResponseEntity.ok(token);
            } else {
                return ResponseEntity.badRequest().body("用户认证未通过");
            }
        }catch (UsernameNotFoundException e){
            return ResponseEntity.badRequest().body("用户不存在");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        // 检查用户名是否存在
        if (userDetailsService.isUserExists(user.getName())) {
            return ResponseEntity.badRequest().body("用户名已存在");
        }

        // 验证密码强度
        String passwordErrorMessage = userDetailsService.getPasswordStrengthErrorMessage(user.getPassword());
        if (passwordErrorMessage != null) {
            return ResponseEntity.badRequest().body(passwordErrorMessage);
        }

        // 将新用户保存到数据库中
        userDetailsService.saveUser(user);

        // 返回注册成功的响应
        return ResponseEntity.ok("注册成功");
    }
}