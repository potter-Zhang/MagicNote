package edu.whu.MagicNote.controller;


import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;


/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    IUserService userService;

    @GetMapping("/get/{id}")
    public ResponseEntity<User> getUserById(@PathVariable int id){
        User user = userService.getUserById(id);
        if(user == null)
            return ResponseEntity.noContent().build();

        return ResponseEntity.ok(user);
    }

    @GetMapping("/get")
    public ResponseEntity<User> getUserByName(String name){
        User user = userService.getUserByName(name);
        if(user == null)
            return ResponseEntity.noContent().build();

        return ResponseEntity.ok(user);
    }

    @PostMapping("/add")
    public ResponseEntity<User> addUser(@RequestBody User user){
        User usr = userService.addUser(user);
        if(usr == null)
            return ResponseEntity.noContent().build();

        return ResponseEntity.ok(usr);
    }

    @PutMapping("/update")
    public ResponseEntity<Void> updateUser(@RequestBody User user){
        if(userService.updateUser(user))
            return ResponseEntity.ok().build();
        else
            //修改失败，不存在对应id的用户
            return ResponseEntity.noContent().build();
    }

    // 只更新用户名称的接口
    @PutMapping("/updateName")
    public ResponseEntity<Void> updateUserName(int id, String name){
        if(userService.updateUserName(id, name))
            return ResponseEntity.ok().build();
        else
            //修改失败，不存在对应id的用户
            return ResponseEntity.noContent().build();
    }

    // 只更新用户简介的接口
    @PutMapping("/updateProfile")
    public ResponseEntity<Void> updateUserProfile(int id, String profile){
        if(userService.updateUserProfile(id, profile))
            return ResponseEntity.ok().build();
        else
            //修改失败，不存在对应id的用户
            return ResponseEntity.noContent().build();
    }

    // 只更新用户头像的接口
    @PutMapping("/updatePhoto")
    public ResponseEntity<JSONObject> updateUserPhoto(int id, MultipartFile photo) {
        try {
            if (userService.updateUserPhoto(id, photo))
                return ResponseEntity.ok().build();
            else
                //修改失败，不存在对应id的用户
                return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable int id){
        if(userService.deleteUser(id))
            return ResponseEntity.ok().build();
        else
            //删除失败，不存在对应id的用户
            return ResponseEntity.noContent().build();
    }
}

