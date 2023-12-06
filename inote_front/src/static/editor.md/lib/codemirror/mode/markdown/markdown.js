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
      retè"Úªÿ^èÚªÿ^èÚªÿ^è
Úªÿ^èÚªÿ^èúÙªÿ^èòÙªÿ^" à‰c D  èâÙªÿ^ JèÚÙªÿ^IèÒÙªÿ^HèÊÙªÿ^	GèÂÙªÿ^FèºÙªÿ^Eè²Ùªÿ^DèªÙªÿ^Cè¢Ùªÿ^BèšÙªÿ^Aè’Ùªÿ^@èŠÙªÿ^?è‚Ùªÿ^ >èzÙªÿ^"=èrÙªÿ^%<èjÙªÿ^(;èbÙªÿ^*:èZÙªÿ^,9èRÙªÿ^/8èJÙªÿ^27èBÙªÿ^56è:Ùªÿ^85è2Ùªÿ^;4è*Ùªÿ^>3è"Ùªÿ^A2èÙªÿ^D1èÙªÿ^G0è
Ùªÿ^J/èÙªÿ^M.èúØªÿ^P-èòØªÿ^S,èêØªÿ^V+èâØªÿ^Y*èÚØªÿ^\)èÒØªÿ^_(èÊØªÿ^b'èÂØªÿ^e&èºØªÿ^h%è²Øªÿ^k$èªØªÿ^m#è¢Øªÿ^o"èšØªÿ^q!è’Øªÿ^s èŠØªÿ^uè‚Øªÿ^xèzØªÿ^zèrØªÿ^|èjØªÿ^èbØªÿ^‚èZØªÿ^„èRØªÿ^†èJØªÿ^‰èBØªÿ^Œè:Øªÿ^è2Øªÿ^‘è*Øªÿ^“è"Øªÿ^•èØªÿ^˜èØªÿ^šè
Øªÿ^œèØªÿ^Ÿèú×ªÿ^¢èò×ªÿ^¥èê×ªÿ^¨èâ×ªÿ^«
èÚ×ªÿ^®	èÒ×ªÿ^±èÊ×ªÿ^´èÂ×ªÿ^·èº×ªÿ^ºè²×ªÿ^½èª×ªÿ^Àè¢×ªÿ^Ãèš×ªÿ^Æè’×ªÿ^É (‹c D  è‚×ªÿ^ 
èz×ªÿ^	èr×ªÿ^èj×ªÿ^èb×ªÿ^èZ×ªÿ^
èR×ªÿ^èJ×ªÿ^èB×ªÿ^è:×ªÿ^è2×ªÿ^ ¨‘c D  è"×ªÿ^ è×ªÿ^è×ªÿ^ x’c D  è×ªÿ^ èúÖªÿ^èòÖªÿ^èêÖªÿ^èâÖªÿ^èÚÖªÿ^
èÒÖªÿ^èÊÖªÿ^ Ğ’c D  èºÖªÿ^ è²Öªÿ^èªÖªÿ^è¢Öªÿ^èšÖªÿ^	 p“c D  èŠÖªÿ^ è‚Öªÿ^èzÖªÿ^èrÖªÿ^èjÖªÿ^	èbÖªÿ^èZÖªÿ^èRÖªÿ^èJÖªÿ^èBÖªÿ^è:Öªÿ^è2Öªÿ^è*Öªÿ^è"Öªÿ^èÖªÿ^"èÖªÿ^$è
Öªÿ^&èÖªÿ^)èúÕªÿ^,
èòÕªÿ^/	èêÕªÿ^2èâÕªÿ^5èÚÕªÿ^8èÒÕªÿ^;èÊÕªÿ^>èÂÕªÿ^AèºÕªÿ^Dè²Õªÿ^GèªÕªÿ^J ğ“c D  èšÕªÿ^ è’Õªÿ^èŠÕªÿ^è‚Õªÿ^ p–c D  èrÕªÿ^ èjÕªÿ^èbÕªÿ^èZÕªÿ^èRÕªÿ^
èJÕªÿ^èBÕªÿ^è:Õªÿ^è2Õªÿ^ Ø–c D  è"Õªÿ^ 1èÕªÿ^0èÕªÿ^/è
Õªÿ^.èÕªÿ^
-èúÔªÿ^,èòÔªÿ^+èêÔªÿ^*èâÔªÿ^)èÚÔªÿ^(èÒÔªÿ^'èÊÔªÿ^&èÂÔªÿ^%èºÔªÿ^!$è²Ôªÿ^$#èªÔªÿ^'"è¢Ôªÿ^*!èšÔªÿ^, è’Ôªÿ^/èŠÔªÿ^2è‚Ôªÿ^5èzÔªÿ^8èrÔªÿ^;èjÔªÿ^>èbÔªÿ^AèZÔªÿ^CèRÔªÿ^EèJÔªÿ^GèBÔªÿ^Iè:Ôªÿ^Lè2Ôªÿ^Oè*Ôªÿ^Rè"Ôªÿ^UèÔªÿ^XèÔªÿ^[è
Ôªÿ^^èÔªÿ^aèúÓªÿ^dèòÓªÿ^gèêÓªÿ^j
èâÓªÿ^m	èÚÓªÿ^pèÒÓªÿ^sèÊÓªÿ^vèÂÓªÿ^xèºÓªÿ^{è²Óªÿ^~èªÓªÿ^è¢Óªÿ^„èšÓªÿ^‡ ¨—c D  èŠÓªÿ^ è‚Óªÿ^
èzÓªÿ^	èrÓªÿ^èjÓªÿ^èbÓªÿ^èZÓªÿ^èRÓªÿ^èJÓªÿ^èBÓªÿ^è:Óªÿ^è2Óªÿ^ œc D  è"Óªÿ^ èÓªÿ^èÓªÿ^è
Óªÿ^	èÓªÿ^èúÒªÿ^èòÒªÿ^ øœc D  èâÒªÿ^ èÚÒªÿ^
èÒÒªÿ^	èÊÒªÿ^èÂÒªÿ^	èºÒªÿ^è²Òªÿ^èªÒªÿ^è¢Òªÿ^èšÒªÿ^è’Òªÿ^èŠÒªÿ^ °c D  èzÒªÿ^ èrÒªÿ^èjÒªÿ^
èbÒªÿ^	èZÒªÿ^	èRÒªÿ^èJÒªÿ^èBÒªÿ^è:Òªÿ^è2Òªÿ^è*Òªÿ^è"Òªÿ^èÒªÿ^ Àc D  è
Òªÿ^ èÒªÿ^ ÈŸc D  èòÑªÿ^ ,èêÑªÿ^+èâÑªÿ^*èÚÑªÿ^)èÒÑªÿ^	(èÊÑªÿ^'èÂÑªÿ^&èºÑªÿ^%è²Ñªÿ^$èªÑªÿ^#è¢Ñªÿ^"èšÑªÿ^!è’Ñªÿ^ èŠÑªÿ^è‚Ñªÿ^ èzÑªÿ^#èrÑªÿ^&èjÑªÿ^)èbÑªÿ^,èZÑªÿ^/èRÑªÿ^2èJÑªÿ^5èBÑªÿ^8è:Ñªÿ^;è2Ñªÿ^>è*Ñªÿ^Aè"Ñªÿ^DèÑªÿ^GèÑªÿ^Jè
Ñªÿ^MèÑªÿ^PèúĞªÿ^RèòĞªÿ^UèêĞªÿ^XèâĞªÿ^[
èÚĞªÿ^^	èÒĞªÿ^aèÊĞªÿ^dèÂĞªÿ^gèºĞªÿ^jè²Ğªÿ^mèªĞªÿ^pè¢Ğªÿ^sèšĞªÿ^vè’Ğªÿ^x  c D  è‚Ğªÿ^ èzĞªÿ^èrĞªÿ^èjĞªÿ^ ¤c D  èZĞªÿ^ èRĞªÿ^èJĞªÿ^èBĞªÿ^ p¤c D  è2Ğªÿ^ è*Ğªÿ^è"Ğªÿ^
èĞªÿ^	èĞªÿ^	è
Ğªÿ^èĞªÿ^èúÏªÿ^èòÏªÿ^èêÏªÿ^èâÏªÿ^èÚÏªÿ^èÒÏªÿ^ Ø¤c D  èÂÏªÿ^ èºÏªÿ^ è¥c D  èªÏªÿ^ 	è¢Ïªÿ^èšÏªÿ^è’Ïªÿ^èŠÏªÿ^
è‚Ïªÿ^èzÏªÿ^èrÏªÿ^èjÏªÿ^èbÏªÿ^ 0¦c D  èRÏªÿ^ 	èJÏªÿ^èBÏªÿ^è:Ïªÿ^è2Ïªÿ^
è*Ïªÿ^è"Ïªÿ^èÏªÿ^èÏªÿ^è
Ïªÿ^ §c D  èúÎªÿ^ 
èòÎªÿ^	èêÎªÿ^èâÎªÿ^	èÚÎªÿ^èÒÎªÿ^èÊÎªÿ^èÂÎªÿ^èºÎªÿ^è²Îªÿ^èªÎªÿ^ è§c D  èšÎªÿ^ è’Îªÿ^èŠÎªÿ^è‚Îªÿ^	èzÎªÿ^èrÎªÿ^èjÎªÿ^ ©c D  èZÎªÿ^ èRÎªÿ^èJÎªÿ^èBÎªÿ^è:Îªÿ^è2Îªÿ^

è*Îªÿ^	è"Îªÿ^èÎªÿ^èÎªÿ^è
Îªÿ^èÎªÿ^èúÍªÿ^èòÍªÿ^èêÍªÿ^èâÍªÿ^  Ğ©c D  èÒÍªÿ^ èÊÍªÿ^èÂÍªÿ^èºÍªÿ^è²Íªÿ^èªÍªÿ^
è¢Íªÿ^
èšÍªÿ^	è’Íªÿ^èŠÍªÿ^è‚Íªÿ^èzÍªÿ^èrÍªÿ^èjÍªÿ^èbÍªÿ^èZÍªÿ^èRÍªÿ^" «c D  èBÍªÿ^ è:Íªÿ^ x¬c D  è*Íªÿ^ è"Íªÿ^ ğ¬c D  èÍªÿ^ è
Íªÿ^ h­c D  èúÌªÿ^ èòÌªÿ^èêÌªÿ^èâÌªÿ^èÚÌªÿ^	èÒÌªÿ^ ¸­c D  èÂÌªÿ^ xèºÌªÿ^wè²Ìªÿ^vèªÌªÿ^uè¢Ìªÿ^tèšÌªÿ^sè’Ìªÿ^
rèŠÌªÿ^qè‚Ìªÿ^pèzÌªÿ^oèrÌªÿ^nèjÌªÿ^mèbÌªÿ^lèZÌªÿ^kèRÌªÿ^jèJÌªÿ^ièBÌªÿ^ hè:Ìªÿ^#gè2Ìªÿ^&fè*Ìªÿ^)eè"Ìªÿ^*dèÌªÿ^-cèÌªÿ^0bè
Ìªÿ^3aèÌªÿ^6`èúËªÿ^7_èòËªÿ^:^èêËªÿ^;]èâËªÿ^>\èÚËªÿ^A[èÒËªÿ^DZèÊËªÿ^GYèÂËªÿ^JXèºËªÿ^MWè²Ëªÿ^PVèªËªÿ^SUè¢Ëªÿ^VTèšËªÿ^YSè’Ëªÿ^\RèŠËªÿ^_Qè‚Ëªÿ^bPèzËªÿ^eOèrËªÿ^hNèjËªÿ^kMèbËªÿ^nLèZËªÿ^qKèRËªÿ^tJèJËªÿ^vIèBËªÿ^yHè:Ëªÿ^|Gè2Ëªÿ^Fè*Ëªÿ^‚Eè"Ëªÿ^ƒDèËªÿ^…CèËªÿ^†Bè
Ëªÿ^ˆAèËªÿ^‰@èúÊªÿ^‹?èòÊªÿ^Œ>èêÊªÿ^=èâÊªÿ^<èÚÊªÿ^‘;èÒÊªÿ^’:èÊÊªÿ^•9èÂÊªÿ^–8èºÊªÿ^™7è²Êªÿ^š6èªÊªÿ^5è¢Êªÿ^4èšÊªÿ^¡3è’Êªÿ^¢2èŠÊªÿ^¥1è‚Êªÿ^¦0èzÊªÿ^©/èrÊªÿ^ª.èjÊªÿ^­-èbÊªÿ^®,èZÊªÿ^±+èRÊªÿ^²*èJÊªÿ^µ)èBÊªÿ^¶(è:Êªÿ^¹'è2Êªÿ^º&è*Êªÿ^½%è"Êªÿ^¾$èÊªÿ^Á#èÊªÿ^Â"è
Êªÿ^Ä!èÊªÿ^Å èúÉªÿ^ÇèòÉªÿ^ÈèêÉªÿ^ËèâÉªÿ^ÌèÚÉªÿ^ÏèÒÉªÿ^ĞèÊÉªÿ^ÒèÂÉªÿ^ÓèºÉªÿ^Õè²Éªÿ^ÖèªÉªÿ^Øè¢Éªÿ^ÙèšÉªÿ^Üè’Éªÿ^İèŠÉªÿ^ßè‚Éªÿ^àèzÉªÿ^âèrÉªÿ^ãèjÉªÿ^åèbÉªÿ^æèZÉªÿ^èèRÉªÿ^é
èJÉªÿ^ì	èBÉªÿ^íè:Éªÿ^ïè2Éªÿ^ğè*Éªÿ^óè"Éªÿ^ôèÉªÿ^÷èÉªÿ^øè
Éªÿ^úèÉªÿ^û @®c D  èòÈªÿ^ !èêÈªÿ^ èâÈªÿ^èÚÈªÿ^èÒÈªÿ^	èÊÈªÿ^èÂÈªÿ^èºÈªÿ^è²Èªÿ^èªÈªÿ^è¢Èªÿ^èšÈªÿ^è’Èªÿ^èŠÈªÿ^è‚Èªÿ^èzÈªÿ^èrÈªÿ^!èjÈªÿ^"èbÈªÿ^$èZÈªÿ^&èRÈªÿ^)èJÈªÿ^+èBÈªÿ^,è:Èªÿ^.
è2Èªÿ^/	è*Èªÿ^2è"Èªÿ^3èÈªÿ^5èÈªÿ^6è
Èªÿ^9èÈªÿ^:èúÇªÿ^=èòÇªÿ^?èêÇªÿ^A P¶c D  èÚÇªÿ^  ˆ¸c D  èÊÇªÿ^ èÂÇªÿ^ ¸¸c D  è²Çªÿ^ èªÇªÿ^è¢Çªÿ^èšÇªÿ^è’Çªÿ^	èŠÇªÿ^è‚Çªÿ^èzÇªÿ^ ¹c D  èjÇªÿ^ èbÇªÿ^ ¸¹c D  èRÇªÿ^  ºc D  èBÇªÿ^ è:Çªÿ^è2Çªÿ^è*Çªÿ^è"Çªÿ^èÇªÿ^
èÇªÿ^è
Çªÿ^èÇªÿ^èúÆªÿ^èòÆªÿ^èêÆªÿ^èâÆªÿ^èÚÆªÿ^èÒÆªÿ^ 
èÊÆªÿ^#	èÂÆªÿ^&èºÆªÿ^)è²Æªÿ^*èªÆªÿ^-è¢Æªÿ^/èšÆªÿ^0è’Æªÿ^3èŠÆªÿ^5è‚Æªÿ^7 8ºc D  èrÆªÿ^ èjÆªÿ^èbÆªÿ^èZÆªÿ^èRÆªÿ^èJÆªÿ^
èBÆªÿ^è:Æªÿ^è2Æªÿ^è*Æªÿ^è"Æªÿ^èÆªÿ^èÆªÿ^è
Æªÿ^èÆªÿ^ èúÅªÿ^"èòÅªÿ^%èêÅªÿ^(
èâÅªÿ^+	èÚÅªÿ^.èÒÅªÿ^1èÊÅªÿ^2èÂÅªÿ^5èºÅªÿ^8è²Åªÿ^;èªÅªÿ^>è¢Åªÿ^AèšÅªÿ^C  ¼c D  èŠÅªÿ^ è‚Åªÿ^ ¾c D  èrÅªÿ^  ¿c D  èbÅªÿ^ èZÅªÿ^ Ğ¿c D  èJÅªÿ^ 	èBÅªÿ^è:Åªÿ^è2Åªÿ^è*Åªÿ^è"Åªÿ^èÅªÿ^èÅªÿ^è
Åªÿ^èÅªÿ^	 HÀc D  èòÄªÿ^ èêÄªÿ^ 8Ác D  èÚÄªÿ^ 	èÒÄªÿ^èÊÄªÿ^èÂÄªÿ^èºÄªÿ^è²Äªÿ^èªÄªÿ^è¢Äªÿ^èšÄªÿ^è’Äªÿ^	 °Ác D  è‚Äªÿ^   Âc D  èrÄªÿ^ èjÄªÿ^ PÂc D  èZÄªÿ^ èRÄªÿ^èJÄªÿ^èBÄªÿ^è:Äªÿ^	è2Äªÿ^è*Äªÿ^è"Äªÿ^  Âc D  èÄªÿ^ +è
Äªÿ^*èÄªÿ^)èúÃªÿ^(èòÃªÿ^'èêÃªÿ^&èâÃªÿ^%èÚÃªÿ^$èÒÃªÿ^#èÊÃªÿ^"èÂÃªÿ^!èºÃªÿ^ è²Ãªÿ^ èªÃªÿ^#è¢Ãªÿ^&èšÃªÿ^)è’Ãªÿ^,èŠÃªÿ^/è‚Ãªÿ^2èzÃªÿ^5èrÃªÿ^8èjÃªÿ^;èbÃªÿ^>èZÃªÿ^AèRÃªÿ^DèJÃªÿ^GèBÃªÿ^Jè:Ãªÿ^Mè2Ãªÿ^Oè*Ãªÿ^Rè"Ãªÿ^UèÃªÿ^XèÃªÿ^[è
Ãªÿ^^
èÃªÿ^a	èúÂªÿ^dèòÂªÿ^gèêÂªÿ^ièâÂªÿ^kèÚÂªÿ^nèÒÂªÿ^pèÊÂªÿ^sèÂÂªÿ^vèºÂªÿ^y PÃc D  èªÂªÿ^ è¢Âªÿ^èšÂªÿ^è’Âªÿ^èŠÂªÿ^	è‚Âªÿ^ PÇc D  èrÂªÿ^  ØÇc D  èbÂªÿ^ èZÂªÿ^ Èc D  èJÂªÿ^ èBÂªÿ^è:Âªÿ^è2Âªÿ^è*Âªÿ^	è"Âªÿ^èÂªÿ^èÂªÿ^ XÈc D  èÂªÿ^ +èúÁªÿ^*èòÁªÿ^)èêÁªÿ^(èâÁªÿ^'èÚÁªÿ^&èÒÁªÿ^%èÊÁªÿ^$èÂÁªÿ^#èºÁªÿ^"è²Áªÿ^!èªÁªÿ^ è¢Áªÿ^ èšÁªÿ^#è’Áªÿ^&èŠÁªÿ^)è‚Áªÿ^,èzÁªÿ^/èrÁªÿ^2èjÁªÿ^5èbÁªÿ^8èZÁªÿ^;èRÁªÿ^>èJÁªÿ^AèBÁªÿ^Dè:Áªÿ^Gè2Áªÿ^Jè*Áªÿ^Mè"Áªÿ^OèÁªÿ^RèÁªÿ^Uè
Áªÿ^XèÁªÿ^[èúÀªÿ^^
èòÀªÿ^a	èêÀªÿ^dèâÀªÿ^gèÚÀªÿ^ièÒÀªÿ^kèÊÀªÿ^nèÂÀªÿ^pèºÀªÿ^sè²Àªÿ^vèªÀªÿ^y Éc D  èšÀªÿ^ è’Àªÿ^èŠÀªÿ^è‚Àªÿ^èzÀªÿ^	èrÀªÿ^ Íc D  èbÀªÿ^  ¸Íc D  èRÀªÿ^ èJÀªÿ^èBÀªÿ^è:Àªÿ^	è2Àªÿ^è*Àªÿ^è"Àªÿ^ ğÍc D  èÀªÿ^ è
Àªÿ^èÀªÿ^ °Îc D  èò¿ªÿ^ èê¿ªÿ^èâ¿ªÿ^èÚ¿ªÿ^èÒ¿ªÿ^èÊ¿ªÿ^èÂ¿ªÿ^èº¿ªÿ^è²¿ªÿ^èª¿ªÿ^	è¢¿ªÿ^
èš¿ªÿ^è’¿ªÿ^èŠ¿ªÿ^è‚¿ªÿ^
èz¿ªÿ^	èr¿ªÿ^èj¿ªÿ^èb¿ªÿ^èZ¿ªÿ^èR¿ªÿ^èJ¿ªÿ^èB¿ªÿ^è:¿ªÿ^è2¿ªÿ^  @Ïc D  è"¿ªÿ^ 	è¿ªÿ^è¿ªÿ^è
¿ªÿ^è¿ªÿ^èú¾ªÿ^èò¾ªÿ^
èê¾ªÿ^èâ¾ªÿ^èÚ¾ªÿ^  Ğc D  èÊ¾ªÿ^  PÑc D  èº¾ªÿ^ 
è²¾ªÿ^	èª¾ªÿ^è¢¾ªÿ^èš¾ªÿ^è’¾ªÿ^
èŠ¾ªÿ^è‚¾ªÿ^èz¾ªÿ^èr¾ªÿ^èj¾ªÿ^ €Ñc D  èZ¾ªÿ^ èR¾ªÿ^èJ¾ªÿ^èB¾ªÿ^ PÒc D  è2¾ªÿ^ è*¾ªÿ^è"¾ªÿ^è¾ªÿ^è¾ªÿ^
è
¾ªÿ^è¾ªÿ^èú½ªÿ^èò½ªÿ^ ¸Òc D  èâ½ªÿ^ èÚ½ªÿ^
èÒ½ªÿ^	èÊ½ªÿ^èÂ½ªÿ^èº½ªÿ^è²½ªÿ^èª½ªÿ^è¢½ªÿ^èš½ªÿ^è’½ªÿ^èŠ½ªÿ^ ˆÓc D  èz½ªÿ^ èr½ªÿ^èj½ªÿ^èb½ªÿ^	èZ½ªÿ^èR½ªÿ^èJ½ªÿ^ pÔc D  è:½ªÿ^ è2½ªÿ^è*½ªÿ^
è"½ªÿ^	è½ªÿ^	è½ªÿ^è
½ªÿ^è½ªÿ^èú¼ªÿ^èò¼ªÿ^èê¼ªÿ^èâ¼ªÿ^èÚ¼ªÿ^ (Õc D  èÊ¼ªÿ^ èÂ¼ªÿ^ 0Öc D  è²¼ªÿ^ ,èª¼ªÿ^+è¢¼ªÿ^*èš¼ªÿ^)è’¼ªÿ^	(èŠ¼ªÿ^'è‚¼ªÿ^&èz¼ªÿ^%èr¼ªÿ^$èj¼ªÿ^#èb¼ªÿ^"èZ¼ªÿ^!èR¼ªÿ^ èJ¼ªÿ^èB¼ªÿ^ è:¼ªÿ^#è2¼ªÿ^&è*¼ªÿ^)è"¼ªÿ^,è¼ªÿ^/è¼ªÿ^2è
¼ªÿ^5è¼ªÿ^8èú»ªÿ^;èò»ªÿ^>èê»ªÿ^Aèâ»ªÿ^DèÚ»ªÿ^GèÒ»ªÿ^JèÊ»ªÿ^MèÂ»ªÿ^Pèº»ªÿ^Rè²»ªÿ^Uèª»ªÿ^Xè¢»ªÿ^[
èš»ªÿ^^	è’»ªÿ^aèŠ»ªÿ^dè‚»ªÿ^gèz»ªÿ^jèr»ªÿ^mèj»ªÿ^pèb»ªÿ^sèZ»ªÿ^vèR»ªÿ^x €Öc D  èB»ªÿ^ è:»ªÿ^è2»ªÿ^è*»ªÿ^ pÚc D  è»ªÿ^ è»ªÿ^è
»ªÿ^è»ªÿ^ ØÚc D  èòºªÿ^ èêºªÿ^èâºªÿ^
èÚºªÿ^	èÒºªÿ^	èÊºªÿ^èÂºªÿ^èººªÿ^è²ºªÿ^èªºªÿ^è¢ºªÿ^èšºªÿ^è’ºªÿ^ @Ûc D  è‚ºªÿ^ èzºªÿ^ PÜc D  èjºªÿ^ 	èbºªÿ^èZºªÿ^èRºªÿ^èJºªÿ^
èBºªÿ^è:ºªÿ^è2ºªÿ^è*ºªÿ^è"ºªÿ^ ˜Üc D  èºªÿ^ 	è
ºªÿ^èºªÿ^èú¹ªÿ^èò¹ªÿ^
èê¹ªÿ^èâ¹ªÿ^èÚ¹ªÿ^èÒ¹ªÿ^èÊ¹ªÿ^ xİc D  èº¹ªÿ^ è²¹ªÿ^èª¹ªÿ^è¢¹ªÿ^èš¹ªÿ^è’¹ªÿ^èŠ¹ªÿ^è‚¹ªÿ^èz¹ªÿ^èr¹ªÿ^	èj¹ªÿ^
èb¹ªÿ^èZ¹ªÿ^èR¹ªÿ^èJ¹ªÿ^
èB¹ªÿ^	è:¹ªÿ^è2¹ªÿ^è*¹ªÿ^è"¹ªÿ^è¹ªÿ^è¹ªÿ^!è
¹ªÿ^"è¹ªÿ^%èú¸ªÿ^& xŞc D  èê¸ªÿ^ èâ¸ªÿ^èÚ¸ªÿ^èÒ¸ªÿ^èÊ¸ªÿ^èÂ¸ªÿ^èº¸ªÿ^è²¸ªÿ^èª¸ªÿ^è¢¸ªÿ^	èš¸ªÿ^
è’¸ªÿ^èŠ¸ªÿ^è‚¸ªÿ^èz¸ªÿ^
èr¸ªÿ^	èj¸ªÿ^èb¸ªÿ^èZ¸ªÿ^èR¸ªÿ^èJ¸ªÿ^èB¸ªÿ^è:¸ªÿ^ è2¸ªÿ^#è*¸ªÿ^$ àc D  è¸ªÿ^ 8è¸ªÿ^7è
¸ªÿ^6è¸ªÿ^	5èú·ªÿ^4èò·ªÿ^3èê·ªÿ^2èâ·ªÿ^1èÚ·ªÿ^0èÒ·ªÿ^/èÊ·ªÿ^.èÂ·ªÿ^!-èº·ªÿ^$,è²·ªÿ^'+èª·ªÿ^**è¢·ªÿ^-)èš·ªÿ^0(è’·ªÿ^3'èŠ·ªÿ^6&è‚·ªÿ^9%èz·ªÿ^<$èr·ªÿ^?#èj·ªÿ^B"èb·ªÿ^E!èZ·ªÿ^H èR·ªÿ^KèJ·ªÿ^NèB·ªÿ^Qè:·ªÿ^Tè2·ªÿ^Wè*·ªÿ^Zè"·ªÿ^]è·ªÿ^`è·ªÿ^cè
·ªÿ^fè·ªÿ^ièú¶ªÿ^lèò¶ªÿ^oèê¶ªÿ^rèâ¶ªÿ^uèÚ¶ªÿ^xèÒ¶ªÿ^{èÊ¶ªÿ^~èÂ¶ªÿ^èº¶ªÿ^„è²¶ªÿ^‡èª¶ªÿ^Š
è¢¶ªÿ^	èš¶ªÿ^è’¶ªÿ^“èŠ¶ªÿ^–è‚¶ªÿ^™èz¶ªÿ^œèr¶ªÿ^Ÿèj¶ªÿ^¢èb¶ªÿ^¥èZ¶ªÿ^¨  ác D  èJ¶ªÿ^ èB¶ªÿ^è:¶ªÿ^è2¶ªÿ^	è*¶ªÿ^ çc D  è¶ªÿ^  Øçc D  è
¶ªÿ^  8èc D  èúµªÿ^ <èòµªÿ^;èêµªÿ^:èâµªÿ^	9èÚµªÿ^8èÒµªÿ^7èÊµªÿ^6èÂµªÿ^5èºµªÿ^4è²µªÿ^3èªµªÿ^2è¢µªÿ^!1èšµªÿ^$0è’µªÿ^'/èŠµªÿ^*.è‚µªÿ^--èzµªÿ^0,èrµªÿ^3+èjµªÿ^6*èbµªÿ^9)èZµªÿ^<(èRµªÿ^?'èJµªÿ^B&èBµªÿ^E%è:µªÿ^H$è2µªÿ^K#è*µªÿ^N"è"µªÿ^Q!èµªÿ^T èµªÿ^Wè
µªÿ^Zèµªÿ^]èú´ªÿ^`èò´ªÿ^cèê´ªÿ^fèâ´ªÿ^ièÚ´ªÿ^lèÒ´ªÿ^oèÊ´ªÿ^rèÂ´ªÿ^uèº´ªÿ^wè²´ªÿ^zèª´ªÿ^}è¢´ªÿ^€èš´ªÿ^ƒè’´ªÿ^…èŠ´ªÿ^ˆè‚´ªÿ^‹èz´ªÿ^èr´ªÿ^‘èj´ªÿ^”
èb´ªÿ^—	èZ´ªÿ^šèR´ªÿ^èJ´ªÿ^ èB´ªÿ^£è:´ªÿ^¦è2´ªÿ^©è*´ªÿ^¬è"´ªÿ^¯è´ªÿ^² pèc D  è
´ªÿ^ è´ªÿ^èú³ªÿ^èò³ªÿ^	èê³ªÿ^ 8îc D  èÚ³ªÿ^  øîc D  èÊ³ªÿ^  Xïc D  èº³ªÿ^ xè²³ªÿ^wèª³ªÿ^vè¢³ªÿ^uèš³ªÿ^tè’³ªÿ^sèŠ³ªÿ^
rè‚³ªÿ^qèz³ªÿ^pèr³ªÿ^oèj³ªÿ^nèb³ªÿ^mèZ³ªÿ^lèR³ªÿ^kèJ³ªÿ^jèB³ªÿ^iè:³ªÿ^ hè2³ªÿ^#gè*³ªÿ^&fè"³ªÿ^)eè³ªÿ^*dè³ªÿ^-cè
³ªÿ^0bè³ªÿ^3aèú²ªÿ^6`èò²ªÿ^7_èê²ªÿ^:^èâ²ªÿ^;]èÚ²ªÿ^>\èÒ²ªÿ^A[èÊ²ªÿ^DZèÂ²ªÿ^GYèº²ªÿ^JXè²²ªÿ^MWèª²ªÿ^PVè¢²ªÿ^SUèš²ªÿ^VTè’²ªÿ^YSèŠ²ªÿ^\Rè‚²ªÿ^_Qèz²ªÿ^bPèr²ªÿ^eOèj²ªÿ^hNèb²ªÿ^kMèZ²ªÿ^nLèR²ªÿ^qKèJ²ªÿ^tJèB²ªÿ^vIè:²ªÿ^yHè2²ªÿ^|Gè*²ªÿ^Fè"²ªÿ^‚Eè²ªÿ^ƒDè²ªÿ^…Cè
²ªÿ^†Bè²ªÿ^ˆAèú±ªÿ^‰@èò±ªÿ^‹?èê±ªÿ^Œ>èâ±ªÿ^=èÚ±ªÿ^<èÒ±ªÿ^‘;èÊ±ªÿ^’:èÂ±ªÿ^•9èº±ªÿ^–8è²±ªÿ^™7èª±ªÿ^š6è¢±ªÿ^5èš±ªÿ^4è’±ªÿ^¡3èŠ±ªÿ^¢2è‚±ªÿ^¥1èz±ªÿ^¦0èr±ªÿ^©/èj±ªÿ^ª.èb±ªÿ^­-èZ±ªÿ^®,èR±ªÿ^±+èJ±ªÿ^²*èB±ªÿ^µ)è:±ªÿ^¶(è2±ªÿ^¹'è*±ªÿ^º&è"±ªÿ^½%è±ªÿ^¾$è±ªÿ^Á#è
±ªÿ^Â"è±ªÿ^Ä!èú°ªÿ^Å èò°ªÿ^Çèê°ªÿ^Èèâ°ªÿ^ËèÚ°ªÿ^ÌèÒ°ªÿ^ÏèÊ°ªÿ^ĞèÂ°ªÿ^Òèº°ªÿ^Óè²°ªÿ^Õèª°ªÿ^Öè¢°ªÿ^Øèš°ªÿ^Ùè’°ªÿ^ÜèŠ°ªÿ^İè‚°ªÿ^ßèz°ªÿ^àèr°ªÿ^âèj°ªÿ^ãèb°ªÿ^åèZ°ªÿ^æèR°ªÿ^èèJ°ªÿ^é
èB°ªÿ^ì	è:°ªÿ^íè2°ªÿ^ïè*°ªÿ^ğè"°ªÿ^óè°ªÿ^ôè°ªÿ^÷è
°ªÿ^øè°ªÿ^úèú¯ªÿ^û ïc D  èê¯ªÿ^ !èâ¯ªÿ^ èÚ¯ªÿ^èÒ¯ªÿ^èÊ¯ªÿ^	èÂ¯ªÿ^èº¯ªÿ^è²¯ªÿ^èª¯ªÿ^è¢¯ªÿ^èš¯ªÿ^è’¯ªÿ^èŠ¯ªÿ^è‚¯ªÿ^èz¯ªÿ^èr¯ªÿ^èj¯ªÿ^!èb¯ªÿ^"èZ¯ªÿ^$èR¯ªÿ^&èJ¯ªÿ^)èB¯ªÿ^+è:¯ªÿ^,è2¯ªÿ^.
è*¯ªÿ^/	è"¯ªÿ^2è¯ªÿ^3è¯ªÿ^5è
¯ªÿ^6è¯ªÿ^9èú®ªÿ^:èò®ªÿ^=èê®ªÿ^?èâ®ªÿ^A  ÷c D  èÒ®ªÿ^  àùc D  èÂ®ªÿ^ èº®ªÿ^ úc D  èª®ªÿ^ è¢®ªÿ^èš