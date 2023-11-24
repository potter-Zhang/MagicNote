package edu.whu.MagicNote.security;

import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
    @Autowired
    private UserServiceImpl userService;
    @PostMapping("/login")
    public ResponseEntity<Map<String,String>> login(@RequestBody User myuser) {
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(myuser.getName());
            if (passwordEncoder.matches(myuser.getPassword(), userDetails.getPassword())) {
                final String token = jwtTokenUtil.generateToken(userDetails);
                Map<String,String> result = new HashMap<>();
                User user = userService.getUserByName(myuser.getName());
                result.put("id",String.valueOf(user.getId()));
                result.put("name",user.getName());
                result.put("email",user.getEmail());
                result.put("token",token);
                return ResponseEntity.ok(result);
            } else {
                Map<String,String> result = new HashMap<>();
                result.put("error","用户认证未通过");
                return ResponseEntity.badRequest().body(result);
            }
        }catch (UsernameNotFoundException e){
            Map<String,String> result = new HashMap<>();
            result.put("error","用户不存在");
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/loginByEmail")
    public ResponseEntity<Map<String,String>> loginByEmail(@RequestBody User myuser) {
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUserEmail(myuser.getEmail());
            if (passwordEncoder.matches(myuser.getPassword(), userDetails.getPassword())) {
                final String token = jwtTokenUtil.generateToken(userDetails);
                Map<String,String> result = new HashMap<>();
                User user = userService.getUserByEmail(myuser.getEmail());
                result.put("id",String.valueOf(user.getId()));
                result.put("name",user.getName());
                result.put("email",user.getEmail());
                result.put("token",token);
                return ResponseEntity.ok(result);
            } else {
                Map<String,String> result = new HashMap<>();
                result.put("error","用户认证未通过");
                return ResponseEntity.badRequest().body(result);
            }
        }catch (UsernameNotFoundException e){
            Map<String,String> result = new HashMap<>();
            result.put("error","用户不存在");
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        // 检查用户名是否存在
        if (userDetailsService.isUserExists(user.getName())) {
            return ResponseEntity.badRequest().body("用户名已存在");
        }
        if (user.getEmail() == null) {
            user.setEmail("@");
        }
        return checkAndSave(user);
    }

    @PostMapping("registerByEmail")
    public ResponseEntity<String> registerByEmail(@RequestBody User user) {
        // 检查用户是否存在
        if (userDetailsService.isUserExists(user.getEmail())) {
            return ResponseEntity.badRequest().body("邮箱已注册");
        }
        // 默认用户名设为邮箱地址
        user.setName(user.getEmail());
        return checkAndSave(user);
    }

    private ResponseEntity<String> checkAndSave(User user) {
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