package edu.whu.MagicNote.security;

import edu.whu.MagicNote.constant.MessageConstant;
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
import java.util.Objects;

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

    // 根据User生成保存结果的Map类
    private void fillMapResult(Map<String, String> result, User user, String token) {
        result.put("id",String.valueOf(user.getId()));
        result.put("name",user.getName());
        result.put("email",user.getEmail());
        result.put("profile", user.getProfile());
        result.put("photo", user.getPhoto());
        result.put("token",token);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String,String>> login(@RequestBody User myuser) {
        Map<String,String> result = new HashMap<>();
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(myuser.getName());
            if (passwordEncoder.matches(myuser.getPassword(), userDetails.getPassword())) {
                User user = userService.getUserByName(myuser.getName());
                Map<String, Object> claims = new HashMap<>();
                claims.put("userId", user.getId());
                final String token = jwtTokenUtil.generateToken(claims);
                fillMapResult(result, user, token);
                return ResponseEntity.ok(result);
            } else {
                result.put("error", MessageConstant.PASSWORD_WRONG);
                return ResponseEntity.badRequest().body(result);
            }
        }catch (UsernameNotFoundException e){
            result.put("error", MessageConstant.USER_NOT_EXIST);
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/loginByEmail")
    public ResponseEntity<Map<String,String>> loginByEmail(@RequestBody User myuser) {
        Map<String,String> result = new HashMap<>();
        try {
            final UserDetails userDetails = userDetailsService.loadUserByUserEmail(myuser.getEmail());
            if (passwordEncoder.matches(myuser.getPassword(), userDetails.getPassword())) {
                User user = userService.getUserByEmail(myuser.getEmail());
                Map<String, Object> claims = new HashMap<>();
                claims.put("userId", user.getId());
                final String token = jwtTokenUtil.generateToken(claims);
                fillMapResult(result, user, token);
                return ResponseEntity.ok(result);
            } else {
                result.put("error", MessageConstant.PASSWORD_WRONG);
                return ResponseEntity.badRequest().body(result);
            }
        }catch (UsernameNotFoundException e){
            result.put("error", MessageConstant.USER_NOT_EXIST);
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String,String>> register(@RequestBody User myuser) {
        Map<String,String> result = new HashMap<>();
        // 检查用户名是否存在
        if (userDetailsService.isUserExists(myuser.getName())) {
            result.put("error", MessageConstant.USERNAME_EXIST);
            return ResponseEntity.badRequest().body(result);
        }
        if (myuser.getEmail() == null) {
            myuser.setEmail("@");   // 邮箱占位符
        }
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(myuser.getName())
                .password(myuser.getPassword())
                .roles("USER")
                .build();
        String message = checkAndSave(myuser);
        if(!Objects.equals(message, MessageConstant.REGISTER_SUCCESS)){
            result.put("error",message);
            return ResponseEntity.badRequest().body(result);
        }
        User user = userService.getUserByName(myuser.getName());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        final String token = jwtTokenUtil.generateToken(claims);
        fillMapResult(result, user, token);
        return ResponseEntity.ok(result);

    }

    @PostMapping("registerByEmail")
    public ResponseEntity<Map<String,String>> registerByEmail(@RequestBody User myuser) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(myuser.getEmail())
                .password(myuser.getPassword())
                .roles("USER")
                .build();
        Map<String,String> result = new HashMap<>();
        // 检查用户是否存在
        if (userDetailsService.isUserExists(myuser.getEmail())) {
            result.put("error", MessageConstant.EMAIL_EXIST);
            return ResponseEntity.badRequest().body(result);
        }
        // 默认用户名设为邮箱地址
        myuser.setName(myuser.getEmail());
        String message = checkAndSave(myuser);
        if(!Objects.equals(message, MessageConstant.EMAIL_EXIST)){
            result.put("error",message);
            return ResponseEntity.badRequest().body(result);
        }
        User user = userService.getUserByEmail(myuser.getEmail());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        final String token = jwtTokenUtil.generateToken(claims);
        fillMapResult(result, user, token);
        return ResponseEntity.ok(result);
    }

    // 检查密码强度并保存到数据库
    private String checkAndSave(User user) {
        // 验证密码强度
        String passwordErrorMessage = userDetailsService.getPasswordStrengthErrorMessage(user.getPassword());
        if (passwordErrorMessage != null) {
            return passwordErrorMessage;
        }

        // 将新用户保存到数据库中
        userDetailsService.saveUser(user);

        // 返回注册成功的响应
        return "注册成功";
    }
}