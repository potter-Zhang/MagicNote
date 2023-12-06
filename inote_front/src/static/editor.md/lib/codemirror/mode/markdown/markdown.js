// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../meta"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../meta"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

  var htmlFound = CodeMirror.modes.hasOwnProperty("xml");
  var htmlMode = CodeMirror.getMode(cmCfg, htmlFound ? {name: "xml", htmlMode: true} : "text/plain");

  function getMode(name) {
    if (CodeMirror.findModeByName) {
      var found = CodeMirror.findModeByName(name);
      if (found) name = found.mime || found.mimes[0];
    }
    var mode = CodeMirror.getMode(cmCfg, name);
    return mode.name == "null" ? null : mode;
  }

  // Should characters that affect highlighting be highlighted separate?
  // Does not include characters that will be output (such as `1.` and `-` for lists)
  if (modeCfg.highlightFormatting === undefined)
    modeCfg.highlightFormatting = false;

  // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
  // Excess `>` will emit `error` token.
  if (modeCfg.maxBlockquoteDepth === undefined)
    modeCfg.maxBlockquoteDepth = 0;

  // Should underscores in words open/close em/strong?
  if (modeCfg.underscoresBreakWords === undefined)
    modeCfg.underscoresBreakWords = true;

  // Turn on fenced code blocks? ("```" to start/end)
  if (modeCfg.fencedCodeBlocks === undefined) modeCfg.fencedCodeBlocks = false;

  // Turn on task lists? ("- [ ] " and "- [x] ")
  if (modeCfg.taskLists === undefined) modeCfg.taskLists = false;

  // Turn on strikethrough syntax
  if (modeCfg.strikethrough === undefined)
    modeCfg.strikethrough = false;

  var codeDepth = 0;

  var header   = 'header'
  ,   code     = 'comment'
  ,   quote    = 'quote'
  ,   list1    = 'variable-2'
  ,   list2    = 'variable-3'
  ,   list3    = 'keyword'
  ,   hr       = 'hr'
  ,   image    = 'tag'
  ,   formatting = 'formatting'
  ,   linkinline = 'link'
  ,   linkemail = 'link'
  ,   linktext = 'link'
  ,   linkhref = 'string'
  ,   em       = 'em'
  ,   strong   = 'strong'
  ,   strikethrough = 'strikethrough';

  var hrRE = /^([*\-=_])(?:\s*\1){2,}\s*$/
  ,   ulRE = /^[*\-+]\s+/
  ,   olRE = /^[0-9]+\.\s+/
  ,   taskListRE = /^\[(x| )\](?=\s)/ // Must follow ulRE or olRE
  ,   atxHeaderRE = /^#+/
  ,   setextHeaderRE = /^(?:\={1,}|-{1,})$/
  ,   textRE = /^[^#!\[\]*_\\<>` "'(~]+/;

  function switchInline(stream, state, f) {
    state.f = state.inline = f;
    return f(stream, state);
  }

  function switchBlock(stream, state, f) {
    state.f = state.block = f;
    return f(stream, state);
  }


  // Blocks

  function blankLine(state) {
    // Reset linkTitle state
    state.linkTitle = false;
    // Reset EM state
    state.em = false;
    // Reset STRONG state
    state.strong = false;
    // Reset strikethrough state
    state.strikethrough = false;
    // Reset state.quote
    state.quote = 0;
    if (!htmlFound && state.f == htmlBlock) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    // Reset state.trailingSpace
    state.trailingSpace = 0;
    state.trailingSpaceNewLine = false;
    // Mark this line as blank
    state.thisLineHasContent = false;
    return null;
  }

  function blockNormal(stream, state) {

    var sol = stream.sol();

    var prevLineIsList = (state.list !== false);
    if (state.list !== false && state.indentationDiff >= 0) { // Continued list
      if (state.indentationDiff < 4) { // Only adjust indentation if *not* a code block
        state.indentation -= state.indentationDiff;
      }
      state.list = null;
    } else if (state.list !== false && state.indentation > 0) {
      state.list = null;
      state.listDepth = Math.floor(state.indentation / 4);
    } else if (state.list !== false) { // No longer a list
      state.list = false;
      state.listDepth = 0;
    }

    var match = null;
    if (state.indentationDiff >= 4) {
      state.indentation -= 4;
      stream.skipToEnd();
      return code;
    } else if (stream.eatSpace()) {
      return null;
    } else if (match = stream.match(atxHeaderRE)) {
      state.header = match[0].length <= 6 ? match[0].length : 6;
      if (modeCfg.highlightFormatting) state.formatting = "header";
      state.f = state.inline;
      return getType(state);
    } else if (state.prevLineHasContent && (match = stream.match(setextHeaderRE))) {
      state.header = match[0].charAt(0) == '=' ? 1 : 2;
      if (modeCfg.highlightFormatting) state.formatting = "header";
      state.f = state.inline;
      return getType(state);
    } else if (stream.eat('>')) {
      state.indentation++;
      state.quote = sol ? 1 : state.quote + 1;
      if (modeCfg.highlightFormatting) state.formatting = "quote";
      stream.eatSpace();
      return getType(state);
    } else if (stream.peek() === '[') {
      return switchInline(stream, state, footnoteLink);
    } else if (stream.match(hrRE, true)) {
      return hr;
    } else if ((!state.prevLineHasContent || prevLineIsList) && (stream.match(ulRE, false) || stream.match(olRE, false))) {
      var listType = null;
      if (stream.match(ulRE, true)) {
        listType = 'ul';
      } else {
        stream.match(olRE, true);
        listType = 'ol';
      }
      state.indentation += 4;
      state.list = true;
      state.listDepth++;
      if (modeCfg.taskLists && stream.match(taskListRE, false)) {
        state.taskList = true;
      }
      state.f = state.inline;
      if (modeCfg.highlightFormatting) state.formatting = ["list", "list-" + listType];
      return getType(state);
    } else if (modeCfg.fencedCodeBlocks && stream.match(/^```[ \t]*([\w+#]*)/, true)) {
      // try switching mode
      state.localMode = getMode(RegExp.$1);
      if (state.localMode) state.localState = state.localMode.startState();
      state.f = state.block = local;
      if (modeCfg.highlightFormatting) state.formatting = "code-block";
      state.code = true;
      return getType(state);
    }

    return switchInline(stream, state, state.inline);
  }

  function htmlBlock(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if ((htmlFound && state.htmlState.tagStart === null && !state.htmlState.context) ||
        (state.md_inside && stream.current().indexOf(">") > -1)) {
      state.f = inlineNormal;
      state.block = blockNormal;
      state.htmlState = null;
    }
    return style;
  }

  function local(stream, state) {
    if (stream.sol() && stream.match("```", false)) {
      state.localMode = state.localState = null;
      state.f = state.block = leavingLocal;
      return null;
    } else if (state.localMode) {
      return state.localMode.token(stream, state.localState);
    } else {
      stream.skipToEnd();
      return code;
    }
  }

  function leavingLocal(stream, state) {
    stream.match("```");
    state.block = blockNormal;
    state.f = inlineNormal;
    if (modeCfg.highlightFormatting) state.formatting = "code-block";
    state.code = true;
    var returnType = getType(state);
    state.code = false;
    return returnType;
  }

  // Inline
  function getType(state) {
    var styles = [];

    if (state.formatting) {
      styles.push(formatting);

      if (typeof state.formatting === "string") state.formatting = [state.formatting];

      for (var i = 0; i < state.formatting.length; i++) {
        styles.push(formatting + "-" + state.formatting[i]);

        if (state.formatting[i] === "header") {
          styles.push(formatting + "-" + state.formatting[i] + "-" + state.header);
        }

        // Add `formatting-quote` and `formatting-quote-#` for blockquotes
        // Add `error` instead if the maximum blockquote nesting depth is passed
        if (state.formatting[i] === "quote") {
          if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
            styles.push(formatting + "-" + state.formatting[i] + "-" + state.quote);
          } else {
            styles.push("error");
          }
        }
      }
    }

    if (state.taskOpen) {
      styles.push("meta");
      return styles.length ? styles.join(' ') : null;
    }
    if (state.taskClosed) {
      styles.push("property");
      return styles.length ? styles.join(' ') : null;
    }

    if (state.linkHref) {
      styles.push(linkhref);
      return styles.length ? styles.join(' ') : null;
    }

    if (state.strong) { styles.push(strong); }
    if (state.em) { styles.push(em); }
    if (state.strikethrough) { styles.push(strikethrough); }

    if (state.linkText) { styles.push(linktext); }

    if (state.code) { styles.push(code); }

    if (state.header) { styles.push(header); styles.push(header + "-" + state.header); }

    if (state.quote) {
      styles.push(quote);

      // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
      if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
        styles.push(quote + "-" + state.quote);
      } else {
        styles.push(quote + "-" + modeCfg.maxBlockquoteDepth);
      }
    }

    if (state.list !== false) {
      var listMod = (state.listDepth - 1) % 3;
      if (!listMod) {
        styles.push(list1);
      } else if (listMod === 1) {
        styles.push(list2);
      } else {
        styles.push(list3);
      }
    }

    if (state.trailingSpaceNewLine) {
      styles.push("trailing-space-new-line");
    } else if (state.trailingSpace) {
      styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
    }

    return styles.length ? styles.join(' ') : null;
  }

  function handleText(stream, state) {
    if (stream.match(textRE, true)) {
      return getType(state);
    }
    return undefined;
  }

  function inlineNormal(stream, state) {
    var style = state.text(stream, state);
    if (typeof style !== 'undefined')
      return style;

    if (state.list) { // List marker (*, +, -, 1., etc)
      state.list = null;
      return getType(state);
    }

    if (state.taskList) {
      var taskOpen = stream.match(taskListRE, true)[1] !== "x";
      if (taskOpen) state.taskOpen = true;
      else state.taskClosed = true;
      if (modeCfg.highlightFormatting) state.formatting = "task";
      state.taskList = false;
      return getType(state);
    }

    state.taskOpen = false;
    state.taskClosed = false;

    if (state.header && stream.match(/^#+$/, true)) {
      if (modeCfg.highlightFormatting) state.formatting = "header";
      return getType(state);
    }

    // Get sol() value now, before character is consumed
    var sol = stream.sol();

    var ch = stream.next();

    if (ch === '\\') {
      stream.next();
      if (modeCfg.highlightFormatting) {
        var type = getType(state);
        return type ? type + " formatting-escape" : "formatting-escape";
      }
    }

    // Matches link titles present on next line
    if (state.linkTitle) {
      state.linkTitle = false;
      var matchCh = ch;
      if (ch === '(') {
        matchCh = ')';
      }
      matchCh = (matchCh+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
      if (stream.match(new RegExp(regex), true)) {
        return linkhref;
      }
    }

    // If this block is changed, it may need to be updated in GFM mode
    if (ch === '`') {
      var previousFormatting = state.formatting;
      if (modeCfg.highlightFormatting) state.formatting = "code";
      var t = getType(state);
      var before = stream.pos;
      stream.eatWhile('`');
      var difference = 1 + stream.pos - before;
      if (!state.code) {
        codeDepth = difference;
        state.code = true;
        return getType(state);
      } else {
        if (difference === codeDepth) { // Must be exact
          state.code = false;
          return t;
        }
        state.formatting = previousFormatting;
        return getType(state);
      }
    } else if (state.code) {
      ret�"ڪ�^�ڪ�^�ڪ�^�
ڪ�^�ڪ�^��٪�^��٪�^" ��c�D  ��٪�^ J��٪�^I��٪�^H��٪�^	G��٪�^F�٪�^E�٪�^D�٪�^C�٪�^B�٪�^A�٪�^@�٪�^?�٪�^ >�z٪�^"=�r٪�^%<�j٪�^(;�b٪�^*:�Z٪�^,9�R٪�^/8�J٪�^27�B٪�^56�:٪�^85�2٪�^;4�*٪�^>3�"٪�^A2�٪�^D1�٪�^G0�
٪�^J/�٪�^M.��ت�^P-��ت�^S,��ت�^V+��ت�^Y*��ت�^\)��ت�^_(��ت�^b'��ت�^e&�ت�^h%�ت�^k$�ت�^m#�ت�^o"�ت�^q!�ت�^s �ت�^u�ت�^x�zت�^z�rت�^|�jت�^�bت�^��Zت�^��Rت�^��Jت�^��Bت�^��:ت�^��2ت�^��*ت�^��"ت�^��ت�^��ت�^��
ت�^��ت�^���ת�^���ת�^���ת�^���ת�^�
��ת�^�	��ת�^���ת�^���ת�^��ת�^��ת�^��ת�^��ת�^��ת�^��ת�^� (�c�D  �ת�^ 
�zת�^	�rת�^�jת�^�bת�^�Zת�^
�Rת�^�Jת�^�Bת�^�:ת�^�2ת�^ ��c�D  �"ת�^ �ת�^�ת�^ x�c�D  �ת�^ ��֪�^��֪�^��֪�^��֪�^��֪�^
��֪�^��֪�^ Вc�D  �֪�^ �֪�^�֪�^�֪�^�֪�^	 p�c�D  �֪�^ �֪�^�z֪�^�r֪�^�j֪�^	�b֪�^�Z֪�^�R֪�^�J֪�^�B֪�^�:֪�^�2֪�^�*֪�^�"֪�^�֪�^"�֪�^$�
֪�^&�֪�^)��ժ�^,
��ժ�^/	��ժ�^2��ժ�^5��ժ�^8��ժ�^;��ժ�^>��ժ�^A�ժ�^D�ժ�^G�ժ�^J �c�D  �ժ�^ �ժ�^�ժ�^�ժ�^ p�c�D  �rժ�^ �jժ�^�bժ�^�Zժ�^�Rժ�^
�Jժ�^�Bժ�^�:ժ�^�2ժ�^ ؖc�D  �"ժ�^ 1�ժ�^0�ժ�^/�
ժ�^.�ժ�^
-��Ԫ�^,��Ԫ�^+��Ԫ�^*��Ԫ�^)��Ԫ�^(��Ԫ�^'��Ԫ�^&��Ԫ�^%�Ԫ�^!$�Ԫ�^$#�Ԫ�^'"�Ԫ�^*!�Ԫ�^, �Ԫ�^/�Ԫ�^2�Ԫ�^5�zԪ�^8�rԪ�^;�jԪ�^>�bԪ�^A�ZԪ�^C�RԪ�^E�JԪ�^G�BԪ�^I�:Ԫ�^L�2Ԫ�^O�*Ԫ�^R�"Ԫ�^U�Ԫ�^X�Ԫ�^[�
Ԫ�^^�Ԫ�^a��Ӫ�^d��Ӫ�^g��Ӫ�^j
��Ӫ�^m	��Ӫ�^p��Ӫ�^s��Ӫ�^v��Ӫ�^x�Ӫ�^{�Ӫ�^~�Ӫ�^��Ӫ�^��Ӫ�^� ��c�D  �Ӫ�^ �Ӫ�^
�zӪ�^	�rӪ�^�jӪ�^�bӪ�^�ZӪ�^�RӪ�^�JӪ�^�BӪ�^�:Ӫ�^�2Ӫ�^ �c�D  �"Ӫ�^ �Ӫ�^�Ӫ�^�
Ӫ�^	�Ӫ�^��Ҫ�^��Ҫ�^ ��c�D  ��Ҫ�^ ��Ҫ�^
��Ҫ�^	��Ҫ�^��Ҫ�^	�Ҫ�^�Ҫ�^�Ҫ�^�Ҫ�^�Ҫ�^�Ҫ�^�Ҫ�^ ��c�D  �zҪ�^ �rҪ�^�jҪ�^
�bҪ�^	�ZҪ�^	�RҪ�^�JҪ�^�BҪ�^�:Ҫ�^�2Ҫ�^�*Ҫ�^�"Ҫ�^�Ҫ�^ ��c�D  �
Ҫ�^ �Ҫ�^ ȟc�D  ��Ѫ�^ ,��Ѫ�^+��Ѫ�^*��Ѫ�^)��Ѫ�^	(��Ѫ�^'��Ѫ�^&�Ѫ�^%�Ѫ�^$�Ѫ�^#�Ѫ�^"�Ѫ�^!�Ѫ�^ �Ѫ�^�Ѫ�^ �zѪ�^#�rѪ�^&�jѪ�^)�bѪ�^,�ZѪ�^/�RѪ�^2�JѪ�^5�BѪ�^8�:Ѫ�^;�2Ѫ�^>�*Ѫ�^A�"Ѫ�^D�Ѫ�^G�Ѫ�^J�
Ѫ�^M�Ѫ�^P��Ъ�^R��Ъ�^U��Ъ�^X��Ъ�^[
��Ъ�^^	��Ъ�^a��Ъ�^d��Ъ�^g�Ъ�^j�Ъ�^m�Ъ�^p�Ъ�^s�Ъ�^v�Ъ�^x �c�D  �Ъ�^ �zЪ�^�rЪ�^�jЪ�^ �c�D  �ZЪ�^ �RЪ�^�JЪ�^�BЪ�^ p�c�D  �2Ъ�^ �*Ъ�^�"Ъ�^
�Ъ�^	�Ъ�^	�
Ъ�^�Ъ�^��Ϫ�^��Ϫ�^��Ϫ�^��Ϫ�^��Ϫ�^��Ϫ�^ ؤc�D  ��Ϫ�^ �Ϫ�^ �c�D  �Ϫ�^ 	�Ϫ�^�Ϫ�^�Ϫ�^�Ϫ�^
�Ϫ�^�zϪ�^�rϪ�^�jϪ�^�bϪ�^ 0�c�D  �RϪ�^ 	�JϪ�^�BϪ�^�:Ϫ�^�2Ϫ�^
�*Ϫ�^�"Ϫ�^�Ϫ�^�Ϫ�^�
Ϫ�^ �c�D  ��Ϊ�^ 
��Ϊ�^	��Ϊ�^��Ϊ�^	��Ϊ�^��Ϊ�^��Ϊ�^��Ϊ�^�Ϊ�^�Ϊ�^�Ϊ�^ �c�D  �Ϊ�^ �Ϊ�^�Ϊ�^�Ϊ�^	�zΪ�^�rΪ�^�jΪ�^ �c�D  �ZΪ�^ �RΪ�^�JΪ�^�BΪ�^�:Ϊ�^�2Ϊ�^

�*Ϊ�^	�"Ϊ�^�Ϊ�^�Ϊ�^�
Ϊ�^�Ϊ�^��ͪ�^��ͪ�^��ͪ�^��ͪ�^  Щc�D  ��ͪ�^ ��ͪ�^��ͪ�^�ͪ�^�ͪ�^�ͪ�^
�ͪ�^
�ͪ�^	�ͪ�^�ͪ�^�ͪ�^�zͪ�^�rͪ�^�jͪ�^�bͪ�^�Zͪ�^�Rͪ�^" �c�D  �Bͪ�^ �:ͪ�^ x�c�D  �*ͪ�^ �"ͪ�^ �c�D  �ͪ�^ �
ͪ�^ h�c�D  ��̪�^ ��̪�^��̪�^��̪�^��̪�^	��̪�^ ��c�D  ��̪�^ x�̪�^w�̪�^v�̪�^u�̪�^t�̪�^s�̪�^
r�̪�^q�̪�^p�z̪�^o�r̪�^n�j̪�^m�b̪�^l�Z̪�^k�R̪�^j�J̪�^i�B̪�^ h�:̪�^#g�2̪�^&f�*̪�^)e�"̪�^*d�̪�^-c�̪�^0b�
̪�^3a�̪�^6`��˪�^7_��˪�^:^��˪�^;]��˪�^>\��˪�^A[��˪�^DZ��˪�^GY��˪�^JX�˪�^MW�˪�^PV�˪�^SU�˪�^VT�˪�^YS�˪�^\R�˪�^_Q�˪�^bP�z˪�^eO�r˪�^hN�j˪�^kM�b˪�^nL�Z˪�^qK�R˪�^tJ�J˪�^vI�B˪�^yH�:˪�^|G�2˪�^F�*˪�^�E�"˪�^�D�˪�^�C�˪�^�B�
˪�^�A�˪�^�@��ʪ�^�?��ʪ�^�>��ʪ�^�=��ʪ�^�<��ʪ�^�;��ʪ�^�:��ʪ�^�9��ʪ�^�8�ʪ�^�7�ʪ�^�6�ʪ�^�5�ʪ�^�4�ʪ�^�3�ʪ�^�2�ʪ�^�1�ʪ�^�0�zʪ�^�/�rʪ�^�.�jʪ�^�-�bʪ�^�,�Zʪ�^�+�Rʪ�^�*�Jʪ�^�)�Bʪ�^�(�:ʪ�^�'�2ʪ�^�&�*ʪ�^�%�"ʪ�^�$�ʪ�^�#�ʪ�^�"�
ʪ�^�!�ʪ�^� ��ɪ�^���ɪ�^���ɪ�^���ɪ�^���ɪ�^���ɪ�^���ɪ�^���ɪ�^��ɪ�^��ɪ�^��ɪ�^��ɪ�^��ɪ�^��ɪ�^��ɪ�^��ɪ�^��zɪ�^��rɪ�^��jɪ�^��bɪ�^��Zɪ�^��Rɪ�^�
�Jɪ�^�	�Bɪ�^��:ɪ�^��2ɪ�^��*ɪ�^��"ɪ�^��ɪ�^��ɪ�^��
ɪ�^��ɪ�^� @�c�D  ��Ȫ�^ !��Ȫ�^ ��Ȫ�^��Ȫ�^��Ȫ�^	��Ȫ�^��Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�Ȫ�^�zȪ�^�rȪ�^!�jȪ�^"�bȪ�^$�ZȪ�^&�RȪ�^)�JȪ�^+�BȪ�^,�:Ȫ�^.
�2Ȫ�^/	�*Ȫ�^2�"Ȫ�^3�Ȫ�^5�Ȫ�^6�
Ȫ�^9�Ȫ�^:��Ǫ�^=��Ǫ�^?��Ǫ�^A P�c�D  ��Ǫ�^  ��c�D  ��Ǫ�^ ��Ǫ�^ ��c�D  �Ǫ�^ �Ǫ�^�Ǫ�^�Ǫ�^�Ǫ�^	�Ǫ�^�Ǫ�^�zǪ�^ �c�D  �jǪ�^ �bǪ�^ ��c�D  �RǪ�^  �c�D  �BǪ�^ �:Ǫ�^�2Ǫ�^�*Ǫ�^�"Ǫ�^�Ǫ�^
�Ǫ�^�
Ǫ�^�Ǫ�^��ƪ�^��ƪ�^��ƪ�^��ƪ�^��ƪ�^��ƪ�^ 
��ƪ�^#	��ƪ�^&�ƪ�^)�ƪ�^*�ƪ�^-�ƪ�^/�ƪ�^0�ƪ�^3�ƪ�^5�ƪ�^7 8�c�D  �rƪ�^ �jƪ�^�bƪ�^�Zƪ�^�Rƪ�^�Jƪ�^
�Bƪ�^�:ƪ�^�2ƪ�^�*ƪ�^�"ƪ�^�ƪ�^�ƪ�^�
ƪ�^�ƪ�^ ��Ū�^"��Ū�^%��Ū�^(
��Ū�^+	��Ū�^.��Ū�^1��Ū�^2��Ū�^5�Ū�^8�Ū�^;�Ū�^>�Ū�^A�Ū�^C  �c�D  �Ū�^ �Ū�^ ��c�D  �rŪ�^  �c�D  �bŪ�^ �ZŪ�^ пc�D  �JŪ�^ 	�BŪ�^�:Ū�^�2Ū�^�*Ū�^�"Ū�^�Ū�^�Ū�^�
Ū�^�Ū�^	 H�c�D  ��Ī�^ ��Ī�^ 8�c�D  ��Ī�^ 	��Ī�^��Ī�^��Ī�^�Ī�^�Ī�^�Ī�^�Ī�^�Ī�^�Ī�^	 ��c�D  �Ī�^   �c�D  �rĪ�^ �jĪ�^ P�c�D  �ZĪ�^ �RĪ�^�JĪ�^�BĪ�^�:Ī�^	�2Ī�^�*Ī�^�"Ī�^ ��c�D  �Ī�^ +�
Ī�^*�Ī�^)��ê�^(��ê�^'��ê�^&��ê�^%��ê�^$��ê�^#��ê�^"��ê�^!�ê�^ �ê�^ �ê�^#�ê�^&�ê�^)�ê�^,�ê�^/�ê�^2�zê�^5�rê�^8�jê�^;�bê�^>�Zê�^A�Rê�^D�Jê�^G�Bê�^J�:ê�^M�2ê�^O�*ê�^R�"ê�^U�ê�^X�ê�^[�
ê�^^
�ê�^a	��ª�^d��ª�^g��ª�^i��ª�^k��ª�^n��ª�^p��ª�^s��ª�^v�ª�^y P�c�D  �ª�^ �ª�^�ª�^�ª�^�ª�^	�ª�^ P�c�D  �rª�^  ��c�D  �bª�^ �Zª�^ �c�D  �Jª�^ �Bª�^�:ª�^�2ª�^�*ª�^	�"ª�^�ª�^�ª�^ X�c�D  �ª�^ +�����^*�����^)�����^(�����^'�����^&�����^%�����^$�����^#����^"����^!����^ ����^ ����^#����^&����^)����^,�z���^/�r���^2�j���^5�b���^8�Z���^;�R���^>�J���^A�B���^D�:���^G�2���^J�*���^M�"���^O����^R����^U�
���^X����^[�����^^
�����^a	�����^d�����^g�����^i�����^k�����^n�����^p����^s����^v����^y �c�D  ����^ ����^����^����^�z���^	�r���^ �c�D  �b���^  ��c�D  �R���^ �J���^�B���^�:���^	�2���^�*���^�"���^ ��c�D  ����^ �
���^����^ ��c�D  ���^ �꿪�^�⿪�^�ڿ��^�ҿ��^�ʿ��^�¿��^躿��^貿��^調��^	袿��^
蚿��^蒿��^芿��^肿��^
�z���^	�r���^�j���^�b���^�Z���^�R���^�J���^�B���^�:���^�2���^  @�c�D  �"���^ 	����^����^�
���^����^�����^���^
�꾪�^�⾪�^�ھ��^ ��c�D  �ʾ��^  P�c�D  躾��^ 
貾��^	誾��^袾��^蚾��^蒾��^
芾��^肾��^�z���^�r���^�j���^ ��c�D  �Z���^ �R���^�J���^�B���^ P�c�D  �2���^ �*���^�"���^����^����^
�
���^����^�����^���^ ��c�D  �⽪�^ �ڽ��^
�ҽ��^	�ʽ��^�½��^躽��^貽��^誽��^袽��^蚽��^蒽��^芽��^ ��c�D  �z���^ �r���^�j���^�b���^	�Z���^�R���^�J���^ p�c�D  �:���^ �2���^�*���^
�"���^	����^	����^�
���^����^�����^���^�꼪�^�⼪�^�ڼ��^ (�c�D  �ʼ��^ �¼��^ 0�c�D  貼��^ ,誼��^+袼��^*蚼��^)蒼��^	(芼��^'肼��^&�z���^%�r���^$�j���^#�b���^"�Z���^!�R���^ �J���^�B���^ �:���^#�2���^&�*���^)�"���^,����^/����^2�
���^5����^8�����^;���^>�껪�^A�⻪�^D�ڻ��^G�һ��^J�ʻ��^M�»��^P躻��^R費��^U誻��^X袻��^[
蚻��^^	蒻��^a芻��^d肻��^g�z���^j�r���^m�j���^p�b���^s�Z���^v�R���^x ��c�D  �B���^ �:���^�2���^�*���^ p�c�D  ����^ ����^�
���^����^ ��c�D  ���^ �꺪�^�⺪�^
�ں��^	�Һ��^	�ʺ��^�º��^躺��^貺��^誺��^袺��^蚺��^蒺��^ @�c�D  肺��^ �z���^ P�c�D  �j���^ 	�b���^�Z���^�R���^�J���^
�B���^�:���^�2���^�*���^�"���^ ��c�D  ����^ 	�
���^����^�����^���^
�깪�^�⹪�^�ڹ��^�ҹ��^�ʹ��^ x�c�D  躹��^ 貹��^誹��^袹��^蚹��^蒹��^芹��^肹��^�z���^�r���^	�j���^
�b���^�Z���^�R���^�J���^
�B���^	�:���^�2���^�*���^�"���^����^����^!�
���^"����^%�����^& x�c�D  �긪�^ �⸪�^�ڸ��^�Ҹ��^�ʸ��^�¸��^躸��^貸��^誸��^袸��^	蚸��^
蒸��^芸��^肸��^�z���^
�r���^	�j���^�b���^�Z���^�R���^�J���^�B���^�:���^ �2���^#�*���^$ �c�D  ����^ 8����^7�
���^6����^	5�����^4���^3�귪�^2�ⷪ�^1�ڷ��^0�ҷ��^/�ʷ��^.�·��^!-躷��^$,買��^'+誷��^**袷��^-)蚷��^0(蒷��^3'芷��^6&肷��^9%�z���^<$�r���^?#�j���^B"�b���^E!�Z���^H �R���^K�J���^N�B���^Q�:���^T�2���^W�*���^Z�"���^]����^`����^c�
���^f����^i�����^l���^o�궪�^r�ⶪ�^u�ڶ��^x�Ҷ��^{�ʶ��^~�¶��^�躶��^�貶��^�誶��^�
袶��^�	蚶��^�蒶��^�芶��^�肶��^��z���^��r���^��j���^��b���^��Z���^� ��c�D  �J���^ �B���^�:���^�2���^	�*���^ �c�D  ����^  ��c�D  �
���^  8�c�D  �����^ <���^;�굪�^:�⵪�^	9�ڵ��^8�ҵ��^7�ʵ��^6�µ��^5躵��^4貵��^3誵��^2袵��^!1蚵��^$0蒵��^'/芵��^*.肵��^--�z���^0,�r���^3+�j���^6*�b���^9)�Z���^<(�R���^?'�J���^B&�B���^E%�:���^H$�2���^K#�*���^N"�"���^Q!����^T ����^W�
���^Z����^]�����^`���^c�괪�^f�⴪�^i�ڴ��^l�Ҵ��^o�ʴ��^r�´��^u躴��^w貴��^z誴��^}袴��^�蚴��^�蒴��^�芴��^�肴��^��z���^��r���^��j���^�
�b���^�	�Z���^��R���^��J���^��B���^��:���^��2���^��*���^��"���^�����^� p�c�D  �
���^ ����^�����^���^	�곪�^ 8�c�D  �ڳ��^  ��c�D  �ʳ��^  X�c�D  躳��^ x貳��^w誳��^v袳��^u蚳��^t蒳��^s芳��^
r肳��^q�z���^p�r���^o�j���^n�b���^m�Z���^l�R���^k�J���^j�B���^i�:���^ h�2���^#g�*���^&f�"���^)e����^*d����^-c�
���^0b����^3a�����^6`���^7_�겪�^:^�Ⲫ�^;]�ڲ��^>\�Ҳ��^A[�ʲ��^DZ�²��^GY躲��^JX貲��^MW課��^PV袲��^SU蚲��^VT蒲��^YS芲��^\R育��^_Q�z���^bP�r���^eO�j���^hN�b���^kM�Z���^nL�R���^qK�J���^tJ�B���^vI�:���^yH�2���^|G�*���^F�"���^�E����^�D����^�C�
���^�B����^�A�����^�@���^�?�걪�^�>�ⱪ�^�=�ڱ��^�<�ұ��^�;�ʱ��^�:�±��^�9躱��^�8貱��^�7誱��^�6袱��^�5蚱��^�4蒱��^�3花��^�2肱��^�1�z���^�0�r���^�/�j���^�.�b���^�-�Z���^�,�R���^�+�J���^�*�B���^�)�:���^�(�2���^�'�*���^�&�"���^�%����^�$����^�#�
���^�"����^�!�����^� ���^��갪�^��Ⱚ�^��ڰ��^��Ұ��^��ʰ��^��°��^�躰��^�貰��^�誰��^�袰��^�蚰��^�蒰��^�芰��^�肰��^��z���^��r���^��j���^��b���^��Z���^��R���^��J���^�
�B���^�	�:���^��2���^��*���^��"���^�����^�����^��
���^�����^������^� ��c�D  �ꯪ�^ !�⯪�^ �گ��^�ү��^�ʯ��^	�¯��^躯��^貯��^誯��^袯��^蚯��^蒯��^芯��^肯��^�z���^�r���^�j���^!�b���^"�Z���^$�R���^&�J���^)�B���^+�:���^,�2���^.
�*���^/	�"���^2����^3����^5�
���^6����^9�����^:���^=�ꮪ�^?�⮪�^A ��c�D  �Ү��^  ��c�D  �®��^ 躮��^ �c�D  誮��^ 袮��^�