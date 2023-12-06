package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Notebook;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.impl.LogServiceImpl;
import edu.whu.MagicNote.service.impl.NotebookServiceImpl;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author Jerome
 * @since 2023-11-20
 */
@RestController
@RequestMapping("/notebook")
public class NotebookController {
    @Autowired
    NotebookServiceImpl ns;

    @Autowired
    LogServiceImpl logService;

    //添加笔记本
    @PostMapping("/add")
    public ResponseEntity<Map<String,String>> addNotebook(@ApiParam("请求体")@RequestBody Notebook myNotebook) {
        Map<String,String> map = new HashMap<>();
        try{
            Notebook notebook=ns.addNotebook(myNotebook);
            map.put("id",String.valueOf(notebook.getId()));
            map.put("name",notebook.getName());
            map.put("userid",String.valueOf(notebook.getUserid()));
        } catch (TodoException e) {
            map.put("code",String.valueOf(e.getCode()));
            map.put("message",e.getMessage());
            return ResponseEntity.badRequest().body(map);
        }
        return ResponseEntity.ok(map);
    }
    //根据id删除笔记本
    @DeleteMapping("/delete1/{id}")
    public ResponseEntity<Void> removeNotebookById(@PathVariable int id){
        if(ns.removeNotebook(id)) {
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //根据文件名删除笔记本
    @DeleteMapping("/delete2")
    public ResponseEntity<Void> removeNotebookByName(int userid, String name){
        if(ns.removeNotebook(userid, name)) {
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //更新笔记本
    @PutMapping("/update")
    public ResponseEntity<String> updateNotebook(@RequestBody Notebook myNotebook) {
        try {
            if (ns.updateNotebook(myNotebook)) {
                return ResponseEntity.ok().build();
            }
            else return ResponseEntity.notFound().build();
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    //根据id查询笔记本
    @GetMapping("/get1/{id}")
    public ResponseEntity<Notebook> getNotebookById(@PathVariable int id){
        Notebook result = ns.getNotebook(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据名称查询笔记本
    @GetMapping("/get2/{userid}/{name}")
    public ResponseEntity<Notebook> getNotebookByName(@PathVariable int userid,@PathVariable String name){
        Notebook result = ns.getNotebookByUserIdAndName(userid,name);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据用户id查询所有笔记本
    @GetMapping("/getByUser/{id}")
    public ResponseEntity<List<Notebook>> getAllNotebooksByUserId(@PathVariable int id){
        List<Notebook> result = ns.getAllNotebooksByUserId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
}

