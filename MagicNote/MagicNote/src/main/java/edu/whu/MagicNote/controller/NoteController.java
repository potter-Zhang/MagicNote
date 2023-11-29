package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.impl.LogServiceImpl;
import edu.whu.MagicNote.service.impl.NoteServiceImpl;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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
@RequestMapping("/note")
public class NoteController {
    @Autowired
    NoteServiceImpl noteService;
    @Autowired
    LogServiceImpl logService;

    private Log generateLog(Note note, String operation) {
        Log log = new Log();
        log.setUserid(note.getUserid());
        log.setNotename(note.getName());
        log.setTimestamp(LocalDateTime.now());
        log.setOperation(operation);
        log.setNoteid(note.getId());
        return log;
    }

    //添加笔记
    @PostMapping("/add")
    public ResponseEntity<Map<String,String>> addNote(@ApiParam("请求体")@RequestBody Note myNote){
        Map<String,String> map= new HashMap<>();
        myNote.setCreatetime(LocalDateTime.now());
        try {
            Note result = noteService.addNote(myNote);
            Log myLog = generateLog(result, "add");
            logService.addLog(myLog);
            map.put("id",String.valueOf(result.getId()));
            map.put("name",result.getName());
            map.put("userid",String.valueOf(result.getUserid()));
            map.put("notebookid",String.valueOf(result.getNotebookid()));
            map.put("createtime",String.valueOf(result.getCreatetime()));
            return ResponseEntity.ok(map);
        } catch (TodoException e) {
            map.put("code",String.valueOf(e.getCode()));
            map.put("message",e.getMessage());
            return ResponseEntity.badRequest().body(map);
        }
    }
    //根据id删除笔记
    @DeleteMapping("/delete1/{id}")
    public ResponseEntity<Void> removeNoteById(@PathVariable int id){
        Note myNote = noteService.getNote(id);
        Log myLog = generateLog(myNote, "delete");
        if(noteService.removeNote(id)) {
            logService.addLog(myLog);
            return ResponseEntity.ok().build();
        }
        else return ResponseEntity.notFound().build();
    }
    //根据文件名删除笔记  存在重名文件，需要用到id
//    @DeleteMapping("/delete2/{name}")
//    public ResponseEntity<Void> removeNoteByName(@PathVariable String name){
//        Note myNote = noteService.getNote(name);
//        Log myLog = new Log();
//        myLog.setUserid(myNote.getUserid());
//        myLog.setNotename(myNote.getName());
//        myLog.setTimestamp(LocalDateTime.now());
//        myLog.setOperation("delete");
//        if(noteService.removeNote(name)) {
//            logService.addLog(myLog);
//            return ResponseEntity.ok().build();
//        }
//        else return ResponseEntity.notFound().build();
//    }

    //更新笔记
    @PutMapping("/update")
    public ResponseEntity<String> updateNote(@RequestBody Note myNote){
        try {
            Log myLog = generateLog(myNote, "update");
            if (noteService.updateNote(myNote)) {
                logService.addLog(myLog);
                return ResponseEntity.ok().build();
            } else return ResponseEntity.notFound().build();
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    //根据id查询笔记
    @GetMapping("/get1/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable int id){
        Note result = noteService.getNote(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据文件名查询笔记
    @GetMapping("/get2/{userid}/{notebook}/{name}")
    public ResponseEntity<Note> getNoteByName(@PathVariable int userid,@PathVariable int notebook,@PathVariable String name){
        Note result = noteService.getNote(userid,notebook,name);
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

