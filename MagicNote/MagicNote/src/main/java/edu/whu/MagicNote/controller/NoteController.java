package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.service.impl.LogServiceImpl;
import edu.whu.MagicNote.service.impl.NoteServiceImpl;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@RestController
@RequestMapping("/note")
public class NoteController {
    @Autowired
    NoteServiceImpl noteService;
    @Autowired
    LogServiceImpl logService;
    //添加笔记
    @PostMapping("/add")
    public ResponseEntity<Note> addNote(@ApiParam("请求体")@RequestBody Note myNote){
        Note result=noteService.addNote(myNote);
        Log myLog = new Log();
        myLog.setUserid(myNote.getUserid());
        myLog.setNotename(myNote.getName());
        myLog.setTimestamp(LocalDateTime.now());
        myLog.setOperation("add");
        logService.addLog(myLog);
        return ResponseEntity.ok(result);
    }
    //根据id删除笔记
    @DeleteMapping("/delete1/{id}")
    public ResponseEntity<Void> removeNoteById(@PathVariable int id){
        Note myNote = noteService.getNote(id);
        Log myLog = new Log();
        myLog.setUserid(myNote.getUserid());
        myLog.setNotename(myNote.getName());
        myLog.setTimestamp(LocalDateTime.now());
        myLog.setOperation("delete");
        if(noteService.removeNote(id)) {
            logService.addLog(myLog);
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //根据文件名删除笔记
    @DeleteMapping("/delete2/{name}")
    public ResponseEntity<Void> removeNoteByName(@PathVariable String name){
        Note myNote = noteService.getNote(name);
        Log myLog = new Log();
        myLog.setUserid(myNote.getUserid());
        myLog.setNotename(myNote.getName());
        myLog.setTimestamp(LocalDateTime.now());
        myLog.setOperation("delete");
        if(noteService.removeNote(name)) {
            logService.addLog(myLog);
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }

    //更新笔记
    @PostMapping("/update")
    public ResponseEntity<Void> updateNote(@RequestBody Note myNote){
        Log myLog = new Log();
        myLog.setUserid(myNote.getUserid());
        myLog.setNotename(myNote.getName());
        myLog.setTimestamp(LocalDateTime.now());
        myLog.setOperation("update");
        if(noteService.updateNote(myNote)) {
            logService.addLog(myLog);
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //根据id查询笔记
    @GetMapping("/get1/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable int id){
        Note result = noteService.getNote(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据文件名查询笔记
    @GetMapping("/get2/{name}")
    public ResponseEntity<Note> getNoteByName(@PathVariable String name){
        Note result = noteService.getNote(name);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据用户id查询所有笔记
    @GetMapping("/getByUser/{id}")
    public ResponseEntity<List<Note>> getAllNotesByUserId(@PathVariable int id){
        List<Note> result = noteService.getAllNoteByUserId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据笔记本id查询所有笔记
    @GetMapping("/getByNotebook/{id}")
    public ResponseEntity<List<Note>> getAllNotesByNotebookId(@PathVariable int id){
        List<Note> result = noteService.getAllNoteByNotebookId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
}

