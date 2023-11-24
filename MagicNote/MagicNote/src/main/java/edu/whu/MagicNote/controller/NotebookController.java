package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Notebook;
import edu.whu.MagicNote.service.impl.NotebookServiceImpl;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    //添加笔记本
    @PostMapping("/add")
    public ResponseEntity<Notebook> addNotebook(@ApiParam("请求体")@RequestBody Notebook myNotebook){
        Notebook result=ns.addNotebook(myNotebook);
        return ResponseEntity.ok(result);
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
    public ResponseEntity<Void> updateNotebook(@RequestBody Notebook myNotebook){
        if(ns.updateNotebook(myNotebook)) {
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //根据id查询笔记本
    @GetMapping("/get1/{id}")
    public ResponseEntity<Notebook> getNotebookById(@PathVariable int id){
        Notebook result = ns.getNotebook(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据名称查询笔记本
    @GetMapping("/get2/{name}")
    public ResponseEntity<Notebook> getNotebookByName(@PathVariable String name){
        Notebook result = ns.getNotebook(name);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据用户id查询所有笔记本
    @GetMapping("/getByUser/{id}")
    public ResponseEntity<List<Notebook>> getAllNotebooksByUserId(@PathVariable int id){
        List<Notebook> result = ns.getAllNotebooksByUserId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
}

