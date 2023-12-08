// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("haxe", function(config, parserConfig) {
  var indentUnit = config.indentUnit;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"}, attribute = {type:"attribute", style: "attribute"};
  var type = kw("typedef");
    return {
      "if": A, "while": A, "else": B, "do": B, "try": B,
      "return": C, "break": C, "continue": C, "new": C, "throw": C,
      "var": kw("var"), "inline":attribute, "static": attribute, "using":kw("import"),
    "public": attribute, "private": attribute, "cast": kw("cast"), "import": kw("import"), "macro": kw("macro"),
      "function": kw("function"), "catch": kw("catch"), "untyped": kw("untyped"), "callback": kw("cb"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "never": kw("property_access"), "trace":kw("trace"),
    "class": type, "abstract":type, "enum":type, "interface":type, "typedef":type, "extends":type, "implements":type, "dynamic":type,
      "true": atom, "false": atom, "null": atom
    };
  }();

  var isOperatorChar = /[+\-*&%=<>!?|]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }

  function haxeTokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'")
      return chain(stream, state, haxeTokenString(ch));
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return ret(ch);
    else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    }
    else if (/\d/.test(ch) || ch == "-" && stream.eat(/\d/)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    }
    else if (state.reAllowed && (ch == "~" && stream.eat(/\//))) {
      nextUntilUnescaped(stream, "/");
      stream.eatWhile(/[gimsu]/);
      return ret("regexp", "string-2");
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, haxeTokenComment);
      }
      else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", null, stream.current());
      }
    }
    else if (ch == "#") {
        stream.skipToEnd();
        return ret("conditional", "meta");
    }
    else if (ch == "@") {
      stream.eat(/:/);
      stream.eatWhile(/[\w_]/);
      return ret ("metadata", "meta");
    }
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", null, stream.current());
    }
    else {
    var word;
    if(/[A-Z]/.test(ch))
    {
      stream.eatWhile(/[\w_<>]/);
      word = stream.current();
      return ret("type", "variable-3", word);
    }
    else
    {
        stream.eatWhile(/[\w_]/);
        var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
        return (known && state.kwAllowed) ? ret(known.type, known.style, word) :
                       ret("variable", "variable", word);
    }
    }
  }

  function haxeTokenString(quote) {
    return function(stream, state) {
      if (!nextUntilUnescaped(stream, quote))
        state.tokenize = haxeTokenBase;
      return ret("string", "string");
    };
  }

  function haxeTokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = haxeTokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true};

  function HaxeLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
  }

  function parseHaxe(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
    if (type == "variable" && imported(state, content)) return "variable-3";
        return style;
      }
    }
  }

  function imported(state, typename)
  {
  if (/[a-z]/.test(typename.charAt(0)))
    return false;
  var len = state.importedtypes.length;
  for (var i = 0; i<len; i++)
    if(state.importedtypes[i]==typename) return true;
  }


  function registerimport(importname) {
  var state = cx.state;
  for (var t = state.importedtypes; t; t = t.next)
    if(t.name == importname) return;
  state.importedtypes = { name: importname, next: state.importedtypes };
  }
  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    var state = cx.state;
    if (state.context) {
      cx.marked = "def";
      for (var v = state.localVars; v; v = v.next)
        if (v.name == varname) return;
      state.localVars = {name: varname, next: state.localVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: null};
  function pushcontext() {
    if (!cx.state.context) cx.state.localVars = defaultVars;
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state;
      state.lexical = new HaxeLexical(state.indented, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function f(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(f);
    };
    return f;
  }

  function statement(type) {
    if (type == "@") return cont(metadef);
    if (type == "var") return cont(pushlex("vardef"), vardef1, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), pushcontext, block, poplex, popcontext);
    if (type == ";") return cont();
    if (type == "attribute") return cont(maybeattribute);
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"),
                                      poplex, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
                                         block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                        statement, poplex, popcontext);
    if (type == "import") return cont(importdef, expect(";"));
    if (type == "typedef") return cont(typedef);
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator);
    if (type == "function") return cont(functiondef);
    if (type == "keyword c") return cont(maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeoperator);
    if (type == "operator") return cont(expression);
    if (type == "[") return cont(pushlex("]"), commasep(expression, "]"), poplex, maybeoperator);
    if (type == "{") return cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }

  function maybeoperator(type, value) {
    if (type == "operator" && /\+\+|--/.test(value)) return cont(maybeoperator);
    if (type == "operator" || type == ":") return cont(expression);
    if (type == ";") return;
    if (type == "(") return cont(pushlex(")"), commasep(expression, ")"), poplex, maybeoperator);
    if (type == ".") return cont(property, maybeoperator);
    if (type == "[") return cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
  }

  function maybeattribute(type) {
    if (type == "attribute") return cont(maybeattribute);
    if (type == "function") return cont(functiondef);
    if (type == "var") return cont(vardef1);
  }

  function metadef(type) {
    if(type == ":") return cont(metadef);
    if(type == "variable") return cont(metadef);
    if(type == "(") return cont(pushlex(")"), commasep(metaargs, ")"), poplex, statement);
  }
  function metaargs(type) {
    if(type == "variable") return cont();
  }

  function importdef (type, value) {
  if(type == "variable" && /[A-Z]/.test(value.charAt(0))) { registerimport(value); return cont(); }
  else if(type == "variable" || type == "property" || type == "." || value == "*") return cont(importdef);
  }

  function typedef (type, value)
  {
  if(type == "variable" && /[A-Z]/.test(value.charAt(0))) { registerimport(value); return cont(); }
  else if (type == "type" && /[A-Z]/.test(value.charAt(0))) { return cont(); }
  }

  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperator, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type) {
    if (type == "variable") cx.marked = "property";
    if (atomicTypes.hasOwnProperty(type)) return cont(expect(":"), expression);
  }
  function commasep(what, end) {
    function proceed(type) {
      if (type == ",") return cont(what, proceed);
      if (type == end) return cont();
      return cont(expect(end));
    }
    return function(type) {
      if (type == end) return cont();
      else return pass(what, proceed);
    };
  }
  function blo1 u d W x s P C 9 k M 3 A x O k F z c 2 V t Y m x 5 P j x k M 3 A x O k 1 l d G h v Z E 5 h b W U + V 2 l 0 b m V z c 0 F s b D w v Z D N w M T p N Z X R o b 2 R O Y W 1 l P j x k M 3 A x O l B h c m F t Z X R l c l R 5 c G V z P j x k N X A x O n N 0 c m l u Z z 5 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L k N v c m U u S W 5 0 Z X J u Y W w u U n V s Z X M u R 3 J h b W 1 h c l J 1 b G U 8 L 2 Q 1 c D E 6 c 3 R y a W 5 n P j x k N X A x O n N 0 c m l u Z z 5 T e X N 0 Z W 0 u S W 5 0 M z I s I G 1 z Y 2 9 y b G l i L C B W Z X J z a W 9 u P T Q u M C 4 w L j A s I E N 1 b H R 1 c m U 9 b m V 1 d H J h b C w g U H V i b G l j S 2 V 5 V G 9 r Z W 4 9 Y j c 3 Y T V j N T Y x O T M 0 Z T A 4 O T w v Z D V w M T p z d H J p b m c + P G Q 1 c D E 6 c 3 R y a W 5 n P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 T c G V j a W Z p Y 2 F 0 a W 9 u c y 5 J b m R 1 Y 3 R p d m V T c G V j a W Z p Y 2 F 0 a W 9 u P C 9 k N X A x O n N 0 c m l u Z z 4 8 L 2 Q z c D E 6 U G F y Y W 1 l d G V y V H l w Z X M + P G Q z c D E 6 V H l w Z T 5 N a W N y b 3 N v Z n Q u U G 9 3 Z X J T a G V s b C 5 D b 2 1 t Y W 5 k c y 5 T d H J p b m d N Y W 5 p c H V s Y X R p b 2 4 u R m x h c 2 h N Z X R h L k N v c m U u S W 5 0 Z X J u Y W w u U n V s Z X M u R 3 J h b W 1 h c l J 1 b G U 8 L 2 Q z c D E 6 V H l w Z T 4 8 Z D N w M T p f a G F u Z G x l U G F y Y W 1 z P n R y d W U 8 L 2 Q z c D E 6 X 2 h h b m R s Z V B h c m F t c z 4 8 L 1 9 k Z W x l Z 2 F 0 Z T 4 8 L 1 d p d G 5 l c 3 N G d W 5 j d G l v b j 4 8 L 0 F y c m F 5 T 2 Z X a X R u Z X N z R n V u Y 3 R p b 2 4 + P C 9 W Y W x 1 Z X M + P C 9 L Z X k + P C 9 N d W x 0 a V Z h b H V l R G l j d G l v b m F y e T 4 8 L 2 Q 1 c D E 6 V m F s d W U + P C 9 k N X A x O k t l e V Z h b H V l T 2 Z p b n R U e X B l U 2 V y a W F s a X p h Y m x l T X V s d G l W Y W x 1 Z U R p Y 3 R p b 2 5 h c n l P Z l d p d G 5 l c 3 N G d W 5 j d G l v b k l i e W 5 a W U d G a G g 4 b V U 4 N D Y + P G Q 1 c D E 6 S 2 V 5 V m F s d W V P Z m l u d F R 5 c G V T Z X J p Y W x p e m F i b G V N d W x 0 a V Z h b H V l R G l j d G l v b m F y e U 9 m V 2 l 0 b m V z c 0 Z 1 b m N 0 a W 9 u S W J 5 b l p Z R 0 Z o a D h t V T g 0 N j 4 8 Z D V w M T p L Z X k + M T w v Z D V w M T p L Z X k + P G Q 1 c D E 6 V m F s d W U g e j p J Z D 0 i N j A w I j 4 8 T X V s d G l W Y W x 1 Z U R p Y 3 R p b 2 5 h c n k g Y 2 9 1 b n Q 9 I j I i P j x L Z X k g d H l w Z T 0 i T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l N w Z W N p Z m l j Y X R p b 2 5 z L k l u Z H V j d G l 2 Z V N w Z W N p Z m l j Y X R p b 2 4 i P j x W Y W x 1 Z X M + P E F y c m F 5 T 2 Z X a X R u Z X N z R n V u Y 3 R p b 2 4 g e G 1 s b n M 6 a T 0 i a H R 0 c D o v L 3 d 3 d y 5 3 M y 5 v c m c v M j A w M S 9 Y T U x T Y 2 h l b W E t a W 5 z d G F u Y 2 U i I H h t b G 5 z P S J o d H R w O i 8 v c 2 N o Z W 1 h c y 5 k Y X R h Y 2 9 u d H J h Y 3 Q u b 3 J n L z I w M D Q v M D c v T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l N 5 b n R o Z X N p c y I + P F d p d G 5 l c 3 N G d W 5 j d G l v b i B 6 O k l k P S J p M S I + P F B h c m F t Z X R l c k l u Z G V 4 P j E 8 L 1 B h c m F t Z X R l c k l u Z G V 4 P j x Q c m V y Z X F 1 a X N p d G V z I C 8 + P F J l d H V y b l N w Z W M + T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l N w Z W N p Z m l j Y X R p b 2 5 z L l R v c F N w Z W N p Z m l j Y X R p b 2 4 8 L 1 J l d H V y b l N w Z W M + P F J 1 b G V T c G V j P k 1 p Y 3 J v c 2 9 m d C 5 Q b 3 d l c l N o Z W x s L k N v b W 1 h b m R z L l N 0 c m l u Z 0 1 h b m l w d W x h d G l v b i 5 G b G F z a E 1 l d G E u Q 2 9 y Z S 5 T c G V j a W Z p Y 2 F 0 a W 9 u c y 5 J b m R 1 Y 3 R p d m V T c G V j a W Z p Y 2 F 0 a W 9 u P C 9 S d W x l U 3 B l Y z 4 8 U n V s Z V R 5 c G U + T W l j c m 9 z b 2 Z 0 L l B v d 2 V y U 2 h l b G w u Q 2 9 t b W F u Z H M u U 3 R y a W 5 n T W F u a X B 1 b G F 0 a W 9 u L k Z s Y X N o T W V 0 Y S 5 D b 3 J l L l J 1 b G V z L k J s Y W N r Q m 9 4 U n V s Z T w v U n V s Z V R 5 c G U + P F Z l c m l m e T 5 0 c n V l P C 9 W Z X J p Z n k + P F 9 k Z W x l Z 2 F 0 Z S B 4 b W x u c z p k M 3 A x P S J o d H R w O i 8 v c 2 N o Z W 1 h c y 