// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/*jshint unused:true, eqnull:true, curly:true, bitwise:true */
/*jshint undef:true, latedef:true, trailing:true */
/*global CodeMirror:true */

// erlang mode.
// tokenizer -> token types -> CodeMirror styles
// tokenizer maintains a parse stack
// indenter uses the parse stack

// TODO indenter:
//   bit syntax
//   old guard/bif/conversion clashes (e.g. "float/1")
//   type/spec/opaque

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMIME("text/x-erlang", "erlang");

CodeMirror.defineMode("erlang", function(cmCfg) {
  "use strict";

/////////////////////////////////////////////////////////////////////////////
// constants

  var typeWords = [
    "-type", "-spec", "-export_type", "-opaque"];

  var keywordWords = [
    "after","begin","catch","case","cond","end","fun","if",
    "let","of","query","receive","try","when"];

  var separatorRE    = /[\->,;]/;
  var separatorWords = [
    "->",";",","];

  var operatorAtomWords = [
    "and","andalso","band","bnot","bor","bsl","bsr","bxor",
    "div","not","or","orelse","rem","xor"];

  var operatorSymbolRE    = /[\+\-\*\/<>=\|:!]/;
  var operatorSymbolWords = [
    "=","+","-","*","/",">",">=","<","=<","=:=","==","=/=","/=","||","<-","!"];

  var openParenRE    = /[<\(\[\{]/;
  var openParenWords = [
    "<<","(","[","{"];

  var closeParenRE    = /[>\)\]\}]/;
  var closeParenWords = [
    "}","]",")",">>"];

  var guardWords = [
    "is_atom","is_binary","is_bitstring","is_boolean","is_float",
    "is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_record","is_reference","is_tuple",
    "atom","binary","bitstring","boolean","function","integer","list",
    "number","pid","port","record","reference","tuple"];

  var bifWords = [
    "abs","adler32","adler32_combine","alive","apply","atom_to_binary",
    "atom_to_list","binary_to_atom","binary_to_existing_atom",
    "binary_to_list","binary_to_term","bit_size","bitstring_to_list",
    "byte_size","check_process_code","contact_binary","crc32",
    "crc32_combine","date","decode_packet","delete_module",
    "disconnect_node","element","erase","exit","float","float_to_list",
    "garbage_collect","get","get_keys","group_leader","halt","hd",
    "integer_to_list","internal_bif","iolist_size","iolist_to_binary",
    "is_alive","is_atom","is_binary","is_bitstring","is_boolean",
    "is_float","is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_process_alive","is_record","is_reference","is_tuple",
    "length","link","list_to_atom","list_to_binary","list_to_bitstring",
    "list_to_existing_atom","list_to_float","list_to_integer",
    "list_to_pid","list_to_tuple","load_module","make_ref","module_loaded",
    "monitor_node","node","node_link","node_unlink","nodes","notalive",
    "now","open_port","pid_to_list","port_close","port_command",
    "port_connect","port_control","pre_loaded","process_flag",
    "process_info","processes","purge_module","put","register",
    "registered","round","self","setelement","size","spawn","spawn_link",
    "spawn_monitor","spawn_opt","split_binary","statistics",
    "term_to_binary","time","throw","tl","trunc","tuple_size",
    "tuple_to_list","unlink","unregister","whereis"];

// upper case: [A-Z] [Ø-Þ] [À-Ö]
// lower case: [a-z] [ß-ö] [ø-ÿ]
  var anumRE       = /[\w@Ø-ÞÀ-Öß-öø-ÿ]/;
  var escapesRE    =
    /[0-7]{1,3}|[bdefnrstv\\"']|\^[a-zA-Z]|x[0-9a-zA-Z]{2}|x{[0-9a-zA-Z]+}/;

/////////////////////////////////////////////////////////////////////////////
// tokenizer

  function tokenizer(stream,state) {
    // in multi-line string
    if (state.in_string) {
      state.in_string = (!doubleQuote(stream));
      return rval(state,stream,"string");
    }

    // in multi-line atom
    if (state.in_atom) {
      state.in_atom = (!singleQuote(stream));
      return rval(state,stream,"atom");
    }

    // whitespace
    if (stream.eatSpace()) {
      return rval(state,stream,"whitespace");
    }

    // attributes and type specs
    if (!peekToken(state) &&
        stream.match(/-\s*[a-zß-öø-ÿ][\wØ-ÞÀ-Öß-öø-ÿ]*/)) {
      if (is_member(stream.current(),typeWords)) {
        return rval(state,stream,"type");
      }else{
        return rval(state,stream,"attribute");
      }
    }

    var ch = stream.next();

    // comment
    if (ch == '%') {
      stream.skipToEnd();
      return rval(state,stream,"comment");
    }

    // colon
    if (ch == ":") {
      return rval(state,stream,"colon");
    }

    // macro
    if (ch == '?') {
      stream.eatSpace();
      stream.eatWhile(anumRE);
      return rval(state,stream,"macro");
    }

    // record
    if (ch == "#") {
      stream.eatSpace();
      stream.eatWhile(anumRE);
      return rval(state,stream,"record");
    }

    // dollar escape
    if (ch == "$") {
      if (stream.next() == "\\" && !stream.match(escapesRE)) {
        return rval(state,stream,"error");
      }
      return rval(state,stream,"number");
    }

    // dot
    if (ch == ".") {
      return rval(state,stream,"dot");
    }

    // quoted atom
    if (ch == '\'') {
      if (!(state.in_atom = (!singleQuote(stream)))) {
        if (stream.match(/\s*\/\s*[0-9]/,false)) {
          stream.match(/\s*\/\s*[0-9]/,true);
          return rval(state,stream,"fun");      // 'f'/0 style fun
        }
        if (stream.match(/\s*\(/,false) || stream.match(/\s*:/,false)) {
          return rval(state,stream,"function");
        }
      }
      return rval(state,stream,"atom");
    }

    // string
    if (ch == '"') {
      state.in_string = (!doubleQuote(stream));
      return rval(state,stream,"string");
    }

    // variable
    if (/[A-Z_Ø-ÞÀ-Ö]/.test(ch)) {
      stream.eatWhile(anumRE);
      return rval(state,stream,"variable");
    }

    // atom/keyword/BIF/function
    if (/[a-z_ß-öø-ÿ]/.test(ch)) {
      stream.eatWhile(anumRE);

      if (stream.match(/\s*\/\s*[0-9]/,false)) {
        stream.match(/\s*\/\s*[0-9]/,true);
        return rval(state,stream,"fun");      // f/0 style fun
      }

      var w = stream.current();

      if (is_member(w,keywordWords)) {
        return rval(state,stream,"keyword");
      }else if (is_member(w,operatorAtomWords)) {
        return rval(state,stream,"operator");
      }else if (stream.match(/\s*\(/,false)) {
        // 'put' and 'erlang:put' are bifs, 'foo:put' is not
        if (is_member(w,bifWords) &&
            ((peekToken(state).token != ":") ||
             (peekToken(state,2).token == "erlang"))) {
          return rval(state,stream,"builtin");
        }else if (is_member(w,guardWords)) {
          return rval(state,stream,"guard");
        }else{
          return rval(state,stream,"function");
        }
      }else if (is_member(w,operatorAtomWords)) {
        return rval(state,stream,"operator");
      }else if (lookahead(stream) == ":") {
        if (w == "erlang") {
          return rval(state,stream,"builtin");
        } else {
          return rval(state,stream,"function");
        }
      }else if (is_member(w,["true","false"])) {
        return rval(state,stream,"boolean");
      }else if (is_member(w,["true","false"])) {
        return rval(state,stream,"boolean");
      }else{
        return rval(state,stream,"atom");
      }
    }

    // number
    var digitRE      = /[0-9]/;
    var radixRE      = /[0-9a-zA-Z]/;         // 36#zZ style int
    if (digitRE.test(ch)) {
      stream.eatWhile(digitRE);
      if (stream.eat('#')) {                // 36#aZ  style integer
        if (!stream.eatWhile(radixRE)) {
          stream.backUp(1);                 //"36#" - syntax error
        }
      } else if (stream.eat('.')) {       // float
        if (!stream.eatWhile(digitRE)) {
          stream.backUp(1);        // "3." - probably end o4 u R m x h c 2 h N Z X R h L k N v c m U u U n V s Z X M u Q m x h Y 2 t C b 3 h S d W x l P C 9 S d W x l V H l w Z T 4 8 V m V y a W Z 5 P n R y d W U 8 L 1 Z l c m l m e T 4 8 X 2 R l b G V n Y X R l I H h t b G 5 z O m Q z c D E 9 I m h 0 d H A 6 L y 9 z Y 2 h l b W F z L m R h d G F j b 2 5 0 c m F j d C 5 v c m c v M j A w N C 8 w N y 9 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L l V 0 a W x z I j 4 8 Z D N w M T p B c 3 N l b W J s e T 5 G b G F z a E 1 l d G E u Q 2 9 y Z S w g V m V y c 2 l v b j 0 w L j Y u M C 4 w L C B D d W x 0 d X J l P W 5 l d X R y Y W w s I F B 1 Y m x p Y 0 t l e V R v a 2 V u P W 5 1 b G w 8 L 2 Q z c D E 6 Q X N z Z W 1 i b H k + P G Q z c D E 6 T W V 0 a G 9 k T m F t Z T 5 X a X R u Z X N z Q W x s P C 9 k M 3 A x O k 1 l d G h v Z E 5 h b W U + P G Q z c D E 6 U G F y Y W 1 l d G V y V H l w Z X M + P G Q 1 c D E 6 c 3 R y a W 5 n P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 J b n R l c m 5 h b C 5 S d W x l c y 5 H c m F t b W F y U n V s Z T w v Z D V w M T p z d H J p b m c + P G Q 1 c D E 6 c 3 R y a W 5 n P l N 5 c 3 R l b S 5 J b n Q z M i w g b X N j b 3 J s a W I s I F Z l c n N p b 2 4 9 N C 4 w L j A u M C w g Q 3 V s d H V y Z T 1 u Z X V 0 c m F s L C B Q d W J s a W N L Z X l U b 2 t l b j 1 i N z d h N W M 1 N j E 5 M z R l M D g 5 P C 9 k N X A x O n N 0 c m l u Z z 4 8 Z D V w M T p z d H J p b m c + T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l N w Z W N p Z m l j Y X R p b 2 5 z L k l u Z H V j d G l 2 Z V N w Z W N p Z m l j Y X R p b 2 4 8 L 2 Q 1 c D E 6 c 3 R y a W 5 n P j w v Z D N w M T p Q Y X J h b W V 0 Z X J U e X B l c z 4 8 Z D N w M T p U e X B l P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 J b n R l c m 5 h b C 5 S d W x l c y 5 H c m F t b W F y U n V s Z T w v Z D N w M T p U e X B l P j x k M 3 A x O l 9 o Y W 5 k b G V Q Y X J h b X M + d H J 1 Z T w v Z D N w M T p f a G F u Z G x l U G F y Y W 1 z P j w v X 2 R l b G V n Y X R l P j w v V 2 l 0 b m V z c 0 Z 1 b m N 0 a W 9 u P j w v Q X J y Y X l P Z l d p d G 5 l c 3 N G d W 5 j d G l v b j 4 8 L 1 Z h b H V l c z 4 8 L 0 t l e T 4 8 S 2 V 5 I H R 5 c G U 9 I k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 T c G V j a W Z p Y 2 F 0 a W 9 u c y 5 E a X N q d W 5 j d G l 2 Z U V 4 Y W 1 w b G V z U 3 B l Y 2 l m a W N h d G l v b i I + P F Z h b H V l c z 4 8 Q X J y Y X l P Z l d p d G 5 l c 3 N G d W 5 j d G l v b i B 4 b W x u c z p p P S J o d H R w O i 8 v d 3 d 3 L n c z L m 9 y Z y 8 y M D A x L 1 h N T F N j a G V t Y S 1 p b n N 0 Y W 5 j Z S I g e G 1 s b n M 9 I m h 0 d H A 6 L y 9 z Y 2 h l b W F z L m R h d G F j b 2 5 0 c m F j d C 5 v c m c v M j A w N C 8 w N y 9 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L k N v c m U u U 3 l u d G h l c 2 l z I j 4 8 V 2 l 0 b m V z c 0 Z 1 b m N 0 a W 9 u I H o 6 S W Q 9 I m k x I j 4 8 U G F y Y W 1 l d G V y S W 5 k Z X g + M D w v U G F y Y W 1 l d G V y S W 5 k Z X g + P F B y Z X J l c X V p c 2 l 0 Z X M g L z 4 8 U m V 0 d X J u U 3 B l Y z 5 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L k N v c m U u U 3 B l Y 2 l m a W N h d G l v b n M u R G l z a n V u Y 3 R p d m V F e G F t c G x l c 1 N w Z W N p Z m l j Y X R p b 2 4 8 L 1 J l d H V y b l N w Z W M + P F J 1 b G V T c G V j P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 T c G V j a W Z p Y 2 F 0 a W 9 u c y 5 E a X N q d W 5 j d G l 2 Z U V 4 Y W 1 w b G V z U 3 B l Y 2 l m a W N h d G l v b j w v U n V s Z V N w Z W M + P F J 1 b G V U e X B l P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 S d W x l c y 5 C b G F j a 0 J v e F J 1 b G U 8 L 1 J 1 b G V U e X B l P j x W Z X J p Z n k + Z m F s c 2 U 8 L 1 Z l c m l m e T 4 8 X 2 R l b G V n Y X R l I H h t b G 5 z O m Q z c D E 9 I m h 0 d H A 6 L y 9 z Y 2 h l b W F z L m R h d G F j b 2 5 0 c m F j d C 5 v c m c v M j A w N C 8 w N y 9 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L l V 0 a W x z I j 4 8 Z D N w M T p B c 3 N l b W J s e T 5 G b G F z a E V 4 d H J h Y 3 R U Z X h 0 L l N l b W F u d G l j c y w g V m V y c 2 l v b j 0 x L j A u M C 4 w L C B D d W x 0 d X J l P W 5 l d X R y Y W w s I F B 1 Y m x p Y 0 t l e V R v a 2 V u P W 5 1 b G w 8 L 2 Q z c D E 6 Q X N z Z W 1 i b H k + P G Q z c D E 6 T W V 0 a G 9 k T m F t Z T 5 X a X R u Z X N z U 0 l u U 3 V i c 3 R y a W 5 n P C 9 k M 3 A x O k 1 l d G h v Z E 5 h b W U + P G Q z c D E 6 U G F y Y W 1 l d G V y V H l w Z X M + P G Q 1 c D E 6 c 3 R y a W 5 n P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 J b n R l c m 5 h b C 5 S d W x l c y 5 H c m F t b W F y U n V s Z T w v Z D V w M T p z d H J p b m c + P G Q 1 c D E 6 c 3 R y a W 5 n P l N 5 c 3 R l b S 5 J b n Q z M i w g b X N j b 3 J s a W I s I F Z l c n N p b 2 4 9 N C 4 w L j A u M C w g Q 3 V s d H V y Z T 1 u Z X V 0 c m F s L C B Q d W J s a W N L Z X l U b 2 t l b j 1 i N z d h N W M 1 N j E 5 M z R l M D g 5 P C 9 k N X A x O n N 0 c m l u Z z 4 8 Z D V w M T p z d H J p b m c + T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l N w Z W N p Z m l j Y X R p b 2 5 z L k R p c 2 p 1 b m N 0 a X Z l R X h h b X B s Z X N T c G V j a W Z p Y 2 F 0 a W 9 u P C 9 k N X A x O n N 0 c m l u Z z 4 8 L 2 Q z c D E 6 U G F y Y W 1 l d G V y V H l w Z X M + P G Q z c D E 6 V H l w Z T 5 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h F e H R y Y W N 0 V G V 4 d C 5 T Z W 1 h b n R p Y 3 M u V 2 l 0 b m V z c 2 V z P C 9 k M 3 A x O l R 5 c G U + P G Q z c D E 6 X 2 h h b m R s Z V B h c m F t c z 5 0 c n V l P C 9 k M 3 A x O l 9 o Y W 5 k b G V Q Y X J h b X M + P C 9 f Z G V s Z W d h d G U + P C 9 X a X R u Z X N z R n V u Y 3 R p b 2 4 + P C 9 B c n J h e U 9 m V 2 l 0 b m V z c 0 Z 1 b m N 0 a W 9 u P j w v V m F s d W V z P j w v S 2 V 5 P j w v T X V s d G l W Y W x 1 Z U R p Y 3 R p b 2 5 h c n k + P C 9 k N X A x O l Z h b H V l P j w v Z D V w M T p L Z X l W Y W x 1 Z U 9 m a W 5 0 V H l w Z V N l c m l h b G l 6 Y W J s Z U 1 1 b H R p V m F s d W V E a W N 0 a W 9 u Y X J 5 T 2 Z X a X R u Z X N z R n V u Y 3 R p b 2 5 J Y n l u W l l H R m h o O G 1 V O D Q 2 P j w v Z D N w M T p f d 2 l 0 b m V z c 0 Z 1 b m N 0 a W 9 u c z 4 8 Z D R w M T p M Y X p 5 P m Z h b H N l P C 9 k N H A x O k x h e n k + P G Q 0 c D E 6 T m F t Z S B 6 O k l k P S I y N T k i P l N p b m d s Z U x p b m V T d W J z d H J p b m c 8 L 2 Q 0 c D E 6 T m F t Z T 4 8 Z D R w M T p T Z W 1 h b n R p Y 3 M g e G 1 s b n M 6 Z D V w M T 0 i a H R 0 c D o v L 3 N j a G V t Y X M u Z G F 0 Y W N v b n R y Y W N 0 L m 9 y Z y 8 y M D A 0 L z A 3 L 0 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u V X R p b H M i I H o 6 S W Q 9 I j I 2 M C I + P G Q 1 c D E 6 Q X N z Z W 1 i b H k g e j p S Z W Y 9 I j M i I G k 6 b m l s P S J 0 c n V l I i A v P j x k N X A x O k 1 l d G h v Z E 5 h b W U g e j p J Z D 0 i M j Y x I j 5 T a W 5 n b G V M a W 5 l U 3 V i c 3 R y a W 5 n P C 9 k N X A x O k 1 l d G h v Z E 5 h b W U + P G Q 1 c D E 6 U G F y Y W 1 l d G V y V H l w Z X M g e G 1 s b n M 6 Z D Z w M T 0 i a H R 0 c D o v L 3 N j a G V t Y X M u b W l j c m 9 z b 2 Z 0 L m N v b S 8 y M D A z L z E w L 1 N l c m l h b G l 6 Y X R p b 2 4 v Q X J y Y X l z I i B 6 O k l k P S I y N j I i I H o 6 U 2 l 6 Z T 0 i M S I + P G Q 2 c D E 6 c 3 R y a W 5 n I H o 6 S W Q 9 I j I 2 M y I + T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o R X h 0 c m F j d F R l e H Q u U 2 V t Y W 5 0 a W N z L l N 0 c m l u Z 1 J l Z 2 l v b j w v Z D Z w M T p z d H J p b m c + P C 9 k N X A x O l B h c m F t Z X R l c l R 5 c G V z P j x k N X A x O l R 5 c G U g e j p J Z D 0 i M j Y 0 I j 5 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h F e H R y Y W N 0 V G V 4 d C 5 T Z W 1 h b n R p Y 3 M u U 2 V t Y W 5 0 a W N z P C 9 k N X A x O l R 5 c G U + P G Q 1 c D E 6 X 2 h h b m R s Z V B h c m F t c z 5 0 c n V l P C 9 k N X A x O l 9 o Y W 5 k b G V Q Y X J h b X M + P C 9 k N H A x O l N l b W F u d G l j c z 4 8 L 2 Q z c D E 6 R 3 J h b W 1 h c l J 1 b G U + P G Q z c D E 6 R 3 J h b W 1 h c l J 1 b G U g e j p J Z D 0 i M j Y 1 I i B 4 b W x u c z p k N H A x P S J o d H R w O i 8 v c 2 N o Z W 1 h c y 5 k Y X R h Y 2 9 u d H J h Y 3 Q u b 3 J n L z I w M D Q v M D c v T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l J 1 b G V z I i B p O n R 5 c G U 9 I m Q 0 c D E 6 Q m x h Y 2 t C b 3 h S d W x l I j 4 8 Z D N w M T p G Z W F 0 d X J l Q 2 F s Y 3 V s Y X R v c i B 4 b W x u c z p k N X A x P S J o d H R w O i 8 v c 2 N o Z W 1 h c y 5 t a W N y b 3 N v Z n Q u Y 2 9 t L z I w M D M v M T A v U 2 V y a W F s a X p h d G l v b i 9 B c n J h e X M i I H o 6 S W Q 9 I j I 2 N i I g e j p T a X p l P S I x I j 4 8 Z D V w M T p L Z X l W Y W x 1 Z U 9 m R m V h d H V y Z U l u Z m 9 G Z W F 0 d X J l Q 2 F s Y 3 V s Y X R v c l N J a E N O c 3 E 1 P j x k N X A x O k t l e S B 4 b W x u c z p k N 3 A x P S J o d H R w O i 8 v c 2 N o Z W 1 h c y 5 k Y X R h Y 2 9 u d H J h Y 3 Q u b 3 J n L z I w M D Q v M D c v T W l j c m 9 z b 2 Z 0