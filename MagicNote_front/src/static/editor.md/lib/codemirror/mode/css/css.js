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

CodeMirror.defineMode("css", function(config, parserConfig) {
  if (!parserConfig.propertyKeywords) parserConfig = CodeMirror.resolveMode("text/css");

  var indentUnit = config.indentUnit,
      tokenHooks = parserConfig.tokenHooks,
      documentTypes = parserConfig.documentTypes || {},
      mediaTypes = parserConfig.mediaTypes || {},
      mediaFeatures = parserConfig.mediaFeatures || {},
      propertyKeywords = parserConfig.propertyKeywords || {},
      nonStandardPropertyKeywords = parserConfig.nonStandardPropertyKeywords || {},
      fontProperties = parserConfig.fontProperties || {},
      counterDescriptors = parserConfig.counterDescriptors || {},
      colorKeywords = parserConfig.colorKeywords || {},
      valueKeywords = parserConfig.valueKeywords || {},
      allowNested = parserConfig.allowNested;

  var type, override;
  function ret(style, tp) { type = tp; return style; }

  // Tokenizers

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (tokenHooks[ch]) {
      var result = tokenHooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == "@") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("def", stream.current());
    } else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) {
      return ret(null, "compare");
    } else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "#") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("atom", "hash");
    } else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    } else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    } else if (ch === "-") {
      if (/[\d.]/.test(stream.peek())) {
        stream.eatWhile(/[\w.%]/);
        return ret("number", "unit");
      } else if (stream.match(/^-[\w\\\-]+/)) {
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false))
          return ret("variable-2", "variable-definition");
        return ret("variable-2", "variable");
      } else if (stream.match(/^\w+-/)) {
        return ret("meta", "meta");
      }
    } else if (/[,+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    } else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
      return ret("qualifier", "qualifier");
    } else if (/[:;{}\[\]\(\)]/.test(ch)) {
      return ret(null, ch);
    } else if ((ch == "u" && stream.match(/rl(-prefix)?\(/)) ||
               (ch == "d" && stream.match("omain(")) ||
               (ch == "r" && stream.match("egexp("))) {
      stream.backUp(1);
      state.tokenize = tokenParenthesized;
      return ret("property", "word");
    } else if (/[\w\\\-]/.test(ch)) {
      stream.eatWhile(/[\w\\\-]/);
      return ret("property", "word");
    } else {
      return ret(null, null);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          if (quote == ")") stream.backUp(1);
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      if (ch == quote || !escaped && quote != ")") state.tokenize = null;
      return ret("string", "string");
    };
  }

  function tokenParenthesized(stream, state) {
    stream.next(); // Must be '('
    if (!stream.match(/\s*[\"\')]/, false))
      state.tokenize = tokenString(")");
    else
      state.tokenize = null;
    return ret(null, "(");
  }

  // Context management

  function Context(type, indent, prev) {
    this.type = type;
    this.indent = indent;
    this.prev = prev;
  }

  function pushContext(state, stream, type) {
    state.context = new Context(type, stream.indentation() + indentUnit, state.context);
    return type;
  }

  function popContext(state) {
    state.context = state.context.prev;
    return state.context.type;
  }

  function pass(type, stream, state) {
    return states[state.context.type](type, stream, state);
  }
  function popAndPass(type, stream, state, n) {
    for (var i = n || 1; i > 0; i--)
      state.context = state.context.prev;
    return pass(type, stream, state);
  }

  // Parser

  function wordAsValue(stream) {
    var word = stream.current().toLowerCase();
    if (valueKeywords.hasOwnProperty(word))
      override = "atom";
    else if (colorKeywords.hasOwnProperty(word))
      override = "keyword";
    else
      override = "variable";
  }

  var states = {};

  states.top = function(type, stream, state) {
    if (type == "{") {
      return pushContext(state, stream, "block");
    } else if (type == "}" && state.context.prev) {
      return popContext(state);
    } else if (/@(media|supports|(-moz-)?document)/.test(type)) {
      return pushContext(state, stream, "atBlock");
    } else if (/@(font-face|counter-style)/.test(type)) {
      state.stateArg = type;
      return "restricted_atBlock_before";
    } else if (/^@(-(moz|ms|o|webkit)-)?keyframes$/.test(type)) {
      return "keyframes";
    } else if (type && type.charAt(0) == "@") {
      return pushContext(state, stream, "at");
    } else if (type == "hash") {
      override = "builtin";
    } else if (type == "word") {
      override = "tag";
    } else if (type == "variable-definition") {
      return "maybeprop";
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    } else if (type == ":") {
      return "pseudo";
    } else if (allowNested && type == "(") {
      return pushContext(state, stream, "parens");
    }
    return state.context.type;
  };

  states.block = function(type, stream, state) {
    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (propertyKeywords.hasOwnProperty(word)) {
        override = "property";
        return "maybeprop";
      } else if (nonStandardPropertyKeywords.hasOwnProperty(word)) {
        override = "string-2";
        return "maybeprop";
      } else if (allowNested) {
        override = stream.match(/^\s*:(?:\s|$)/, false) ? "property" : "tag";
        return "block";
      } else {
        override += " error";
        return "maybeprop";
      }
    } else if (type == "meta") {
      return "block";
    } else if (!allowNested && (type == "hash" || type == "qualifier")) {
      override = "error";
      return "block";
    } else {
      return states.top(type, stream, state);
    }
  };

  states.maybeprop = function(type, stream, state) {
    if (type == ":") return pushContext(state, stream, "prop");
    return pass(type, stream, state);
  };

  states.prop = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" && allowNested) return pushContext(state, stream, "propBlock");
    if (type == "}" || type == "{") return popAndPass(type, stream, state);
    if (type == "(") return pushContext(state, stream, "parens");

    if (type == "hash" && !/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(stream.current())) {
      override += " error";
    } else if (type == "word") {
      wordAsValue(stream);
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    }
    return "prop";
  };

  states.propBlock = function(type, _stream, state) {
    if (type == "}") return popContext(state);
    if (type == "word") { override = "property"; return "maybeprop"; }
    return state.context.type;
  };

  states.parens = function(type, stream, state) {
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == ")") return popContext(state);
    if (type == "(") return pushContext(state, stream, "parens");
    if (type == "word") wordAsValue(stream);
    return "parens";
  };

  states.pseudo = function(type, stream, state) {
    if (type == "word") {
      override = "variable-3";
      return state.context.type;
    }
    return pass(type, stream, state);
  };

  states.atBlock = function(type, stream, state) {
    if (type == "(") return pushContext(state, stream, "atBlock_parens");
    if (type == "}") return popAndPass(type, stream, state);
    if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top");

    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (word == "only" || word == "not" || word == "and" || word == "or")
        override = "keyword";
      else if (documentTypes.hasOwnProperty(word))
        override = "tag";
      else if (mediaTypes.hasOwnProperty(word))
        override = "attribute";
      else if (mediaFeatures.hasOwnProperty(word))
        override = "property";
      else if (propertyKeywords.hasOwnProperty(word))
        override = "property";
      else if (nonStandardPropertyKeywords.hasOwnProperty(word))
        override = "string-2";
      else if (valueKeywords.hasOwnProperty(word))
        override = "atom";
      else
        override = "error";
    }
    return state.context.type;
  };

  states.atBlock_parens = function(type, stream, state) {
    if (type == ")") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state, 2);
    return states.atBlock(type, stream, state);
  };

  states.restricted_atBlock_before = function(type, stream, state) {
    if (type == "{")
      return pushContext(state, stream, "restricted_atBlock");
    if (type == "word" && state.stateArg == "@counter-style") {
      override = "variable";
      return "restricted_atBlock_before";
    }
    return pass(type, stream, state);
  };

  states.restricted_atBlock = function(type, stream, state) {
    if (type == "}") {
      state.stateArg = null;
      return popContext(state);
    }
    if (type == "word") {
      if ((state.stateArg == "@font-face" && !fontProperties.hasOwnProperty(stream.current().toLowerCase())) ||
          (state.stateArg == "@counter-style" && !counterDescriptors.hasOwnProperty(stream.current().toLowerCase())))
        override = "error";
      else
        override = "property";
      return "maybeprop";
    }
    return "restricted_atBlock";
  };

  states.keyframes = function(type, stream, state) {
    if (type == "word") { override = "variable"; return "keyframes"; }
    if (type == "{") return pushContext(state, stream, "top");
    return pass(type, stream, state);
  };

  states.at = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == "word") override = "tag";
    else if (type == "hash") override = "builtin";
    return "at";
  };

  states.interpolation = function(type, stream, state) {
    if (type == "}") return popContext(state);
    if (type == "{" || type == ";") return popAndPass(type, stream, state);
    if (type != "variable") override = "error";
    return "interpolation";
  };

  return {
    startState: function(base) {
      return {tokenize: null,
              state: "top",
              stateArg: null,
              context: new Context("top", base || 0, null)};
    },

    token: function(stream, state) {
      if (!state.tokenize && stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style && typeof style == "object") {
        type = style[1];
        style = style[0];
      }
      override = style;
      state.state = states[state.state](type, stream, state);
      return override;
    },

    indent: function(state, textAfter) {
      var cx = state.context, ch = textAfter && textAfter.charAt(0);
      var indent = cx.indent;
      if (cx.type == "prop" && (ch == "}" || ch == ")")) cx = cx.prev;
      if (cx.prev &&
          (ch  �r��rТ���r��r�����r��r�T� �r�r�T� �r��r����r��r8����r��r$T���r��rT���r��r\����r��r�����r��r�S���r �r�.� �r-�rX
@0�r��r�.���r��r�.���r&�r�x?0�r]�rX
@`�r�r����r��r̣���r�r/��r/�r�u@0�rR�rB`�r�r����rd�r ��p�r��rR���rK�r<��K�r��r�?��r�r����r��rl����r�r�? �r��r�����r��r�f���rF�rĤ�P�r��rܤ���r��r :A��r��r�? �r�r�?�r�r�? �r(�r�?0�r9�rD?@�r�r��� �r-�r�g?0�r��r����r��r 4?��r��r�����r��r�@?��r��r�����r�rL���rV�r @`�rj�r�?p�ry�r�?��r��r`d?��r��r@�A��r;�r�@@�r��rl�A��r��r��A��r��r��A��r��rЊA��r��r�c?��r�r��A�r^�r �A`�r��r�+?��r��r �A �r��rD�A��rY�rh�A`�r��r��A��r��r,�?��rm�r��Ap�r��r��A��r�rԋA�r@�rԋA@�r\�r�A`�rp�r�4?p�ry�rD?��r��r�?��r��r�?��r��r`d?��r��r��A��r;�r�@@�r��rl�A��r� s��A� s� s �A� ss��As�s<d?�s�s�c?�s�s�A�sEs`�APs�s��A�s�s �A�ss�+?sws �A�sQs�c?`s?s��A@s�s��A�s,	s��A0	sK	s,�?P	s�	s��A�	s7
s��A@
sp
sԋAp
s�
sԋA�
s�
s�A�
s�
s�4?�
s�
sD?�
s]s`�A`s�s|�A�s�s�?�s�s�g?�s�s� ? sDs��APs�s�)A�s�s��?�s�sd4@�s�sd4@�s6s�A@s�s̞A�s1s��A@s�s�A�s~sD�A�s>sdA@sbs8�Aps�s��A�sls �Aps�s@�A�s
s��Asss��A�s�s��A�sNsРAPs�s��?�s%s�A0s�s0�?�s�s�A�s_s�W?`s�s�A�s�s(�A�s�sTi?�ss�@s|sH�A�s�sh�A�s�s��A�s5s�1?@s�s`!A�s9s|!A@sQsdh?`s�sH�?�s�s4�?�s�s�? s5sL�A@s�sX�A�s�sA�s sh?  s� s�!A� s� sD?� sx!s� @�!s�!s�g?�!s�!s�g?�!s"s�?"s_"s�A`"s�"sh?�"s�"s8A�"s-#sA0#s6#s�?@#sI#sD?P#s_#sd4@`#s�#s-A�#s$s�t�$s7$sh?@$sb$s8Ap$s�$s`-A�$s	&s�H�	&s9&s8@?@&sr&s�-Ar&s�&s`X?�&s�&s�,A�&s�&sd4@�&s-'s-A0's:'s�	?@'sg'sh?p'sz's�	?�'s�'s`-A�'s)s�H�)sC)s8@?P)s�)s�-A�)s�)s`X?�)s�)s�,A�)s�)s�?�)s�)s�@?�)sn+su�n+s�+s�1?�+s�+sd4@�+s,sL<A ,sG,sh?P,s�-s�u��-s.s�1?.s7.sh?@.sg.sh?p.sz.s�	?�.s�.s�<A�.s�.s�@?�.s /s<�@ /sA0s|J�P0s�0sH=A�0s�0slJ?�0s�1s�A�1s�2s�J��2sT4s�=A`4s~7sv��7s�8sHK��8s�9s�B?�9s�9s�B?�9s�9s�B?�9s:sC? :s�:sdC?�:s�:s4C?�:sD;sPC?P;s�;s C?�;s�;s?A�;s�<stv��<sj>s�v�j>s�>s�1?�>s ?sȺA ?s_?sܺA`?s�?sL��?s�?s�A @s(@s,�A0@s�@sP�A�@s�@sh�A As�As��A�As>Cs0w�>Cs�Cs�1?�CsEs�L�EsrEs�?�Es#Fs�AA0Fs�Fs41A�Fs�Fs41A�Fs�GsBA�Gs�Hs@BA�Hs�Is@BA�IsJsh? Js�Js,M��Js�Js�	?�Js�Js�	?�Js�Js�	?�Js�Js�	?�Js�Js�?�Js�Js�	? Ks
Ks�	?Ks!Ks��?0Ks�KsDM��Ks�Ks�? LsWLs�C?`Ls�Ls�C?�Ls Ms��@ Ms�Ms�BA Ns�Ns�BA�NsrOsCA�OsePs0CApPs�Ps�l?�Ps�PsD?�PsQs�D? Qs�RsXCA�Rs�Rs�?�RsvSsxE?�SsATs�E?PTs�TsF?�Ts=Us��@UsJVsdM�PVs�VsP���Vs.Wsx��0WsWWsh?`WsoWsd4@pWs�Ws�A�WsXs���Xs(Xs��?0XsRXs8A`XswXs���Xs-YslP�0Ys�Zs�w��Zs�Zs�M��ZsD[s�P�P[s�[sT���[s�[s�M� \s\s�?\sH\sX��P\s�\sN��\s�\sL-A ]s@]s��@]s�]s0N��]s�]s�?�]s^s�m�^s}^s���^s�_s`N��_sI`sP��P`s�`sx���`sas��as�bs�N��bs�bs�M��bsYcsP��`cs�csx���cs�csh?�cs�csd4@�csEds,-APds�ds����ds�dsx=?�ds�dsL-A�dses��es5esP�@esLes$�?PesVes�?`es�es�J?�esfs��fs-gs�N�0gs�gsP���gshsx��hs}hs���hs�is�N��isYjsP��`js�jsx���jsks�� ks�lsO��ls�ls����lsymsP���ms�msx���ms�ms�?�ms�ms�@?�msos�;AosKosx	?Pos_osd4@`os�osL<A�os�osh?�osqsl<AqsFqs 4?Pqswqsh?�qs�qsh?�qs�qs�	?�qsrs�<Arsrs�@? rs`rs<�@`rs�rs\�A�rsss�DAssssd4@ ss}ss-A�ss�ss�t��ss�ssh? ts"ts8A0tsuts`-A�ts�ts`-A�ts<ws<O�<wslws8@?pws�wsDEA�ws�ws`X?�ws�ws`X? xsxs�,A xs/xsd4@0xs�xs-A�xs�xs�	?�xs�xsh?�xs�xs�	?�xs%ys`-A0ysuys`-A�ys�{s�O��{s�{s8@? |sH|sDEAH|sk|s`X?k|s�|s`X?�|s�|s�,A�|s�}s�#��}s~s8A~s~s�? ~sK~s�a�P~sY~s�?`~sk~s�@?p~s�s�w��s�s 4? �s>�s0
B@�s\�s4�?`�s��sh?��s�s\x��s2�s�1?@�sg�sh?p�s��sh?��s��s�	?��s��s�<A �s�s�@?�sP�s8J?P�sÄs�x�Єs�sH=A �s[�slJ?`�s�s�A�s��sy���sD�s�=AP�s��s<y���s�s�y� �sގs�B?��s�s�B?�s6�s�B?@�se�sC?p�sяsdC?��s@�s4C?@�s��sPC?��s�s C?�s �s?A �sX�s�y�`�s�s z��sR�sx	?`�s��sȺA��s�sܺA�sb�s�z�p�s��s�A��sؕs,�A��s8�s�;C@�s��s�;C��s;�s��A@�s�s�z��sd�s�1?p�s��sD{���s`�s�?`�s�s�AA�sa�s41Ap�s��s41AМsp�sBAp�s��s|&C��sğs|&CПs��sh? �s��s�{���sʠs�	?Рsڠs�	?�s�s�	?�s��s�	? �s
�s�?�s�s�	? �s*�s�	?0�sA�s��?P�s�s�{� �s*�s�?0�s��s�C?��s�s�C?�s0�s��@0�s"�s�BA0�s�s�BA�s��sCA��s��s0CA��s��s�l? �s	�sD?�sO�s�D?P�s��sXCA �s�s�?�s��sxE?��sq�s�E?��s��sF? �sK�sX�P�s��s�{���s�sP�� �sn�sx��p�s��sh?��s��sd4@��s��slfA �sH�s���P�ss�s|Q?��s��s�fA��s׮s���sA�s�M�P�s}�s|���sɰs�C�аs �s�M� �s\�sT��`�s��sD|� �s�s�?�sN�s�	�P�sӲsd|��s�s��B �sf�s 
�p�s��s�|� �s�s�?�sJ�sd��P�s��sX���s�s�|� �s��sP����s��sx�� �sK�sX�P�s�s�|��s9�s�C�@�sɹsP��йs�sx�� �sG�sh?P�s_�sd4@`�sǺs}�кs�s��� �sB�s�X?P�s��s��B��s��s����s�st,A�s��s$�? �s�s�?�sG�s�J?P�s��s����s"�s4}�0�s��sP����s�sx���s}�s����s
�s\}��s��sP����s��sx����s]�s��`�s�s�}� �sY�s���`�s��sP����s>�sx��@�sI�s�?P�s[�s�@?`�s��s�;A��s��sx	?��s��sd4@��s�sL<A �sG�sh?P�su�sl<Au�s��s 4?��s��sh?��s�sh? �s*�s�	?0�sv�s�<A��s��s�@?��s��s<�@��s�s\�A �sv�s�DA��s��sd4@��s��s-A��s;�slfA@�sg�sh?p�s��s�fA��s��s`-A �sE�s`-AP�s��s�}���s�sx	? �sh�sDEAh�s��s`X?��s��s`X?��s��s�,A��s��sd4@��s=�s-A@�sJ�s�	?P�sw�sh?��s��s�	?��s��s`-A��s%�s`-A0�s��sl~���s��s�?��s(�sDEA(�sK�s`X?K�sn�s`X?p�s��s�,A��s��s���s�s�fA�s�s�? �s]�sB`�s��s�>���s��s�?��s��s�g?��s�s��A �ss�s�o���s��s�w?��s��s`A��s��s�?��s�s�tA�s�s0uA�s��sXuA��s��s\A��s��stA �s�s�N@ �s5�s�N@@�sU�s�N@`�s��s�uA �s��s�uA��s��s<A��s��s��?��s��sLA �s8�sH�?@�sx�sH�?��s��s`A��s��spA��s��sxA��s��s�A��s
�s�A�s;�sA@�s��s(�?��s��s�@��s��s�c? �s1�s�#A@�sd�s�uAp�s��s�A��s��s�N@��s��spu?��s��slA��s)�s�A0�s\�s�A`�su�stA��s��stA��s��s�A��s��stA��s��s�uA �sq�s�uA��s��s�A��s��s�A��s�svA�s9�s�@@�s��s vA��s��s8vA��s��shA �s%�sxA0�sI�sPvAP�s��sdvA��sC�s|vAP�si�sPvAp�s��stA��s��stA��s��s�g?��s1�s(A@�sW�sDA`�s��sTA��s��slA��s-�s�A0�s6�s�?@�s��s4�� �s;�sh��@�s��s�� �s�s�����s��s�����s�s �� �s��s�����s!�s��0�s��s�����s3�s��@�s��s0����s��s8@? �s��sܽ���s��s�x?��s5�s�x?@�sN�s<��P�s{�sh����s��s�?��s��sx����s��s��C��sF�s���P�s��s�����s��s�?��s��s ����s��s����s��s$����s��sA �s�s�� �s1�s��?@�se�sh'�p�s��s�.C��s��s8�� �s<�s�>�@�s��s`����s��s�1?��sB�s�1?P�s��s�����s�tX���t�t8@?�tct���pt-t��0t/tD��/tlt8@?pt�t����tct���ptt��tFt�?Pt�t�p��t�	tL���	t�
t����
t!tC�0t�t C��t�tx?�t�t�� t
t�	?t�t`���t9t���@tVt���`t9tTD�@t=t��=trt�?�tft�D�ptt�D�t�t<E��t�t`E��tRt�E�`tIt`��It~t�?�t9t F�@t t��� t5t�?@t�t����t�t8���tt�F� ttG� tut8���t�t8���tt\G� t(t�?0t9tD?@t�t���t�t@6?�t�td���ttH�t"t8��0tft(H�pt�t��?�t�t����tk t�H�p t� tl�� t� t�H� !t5!t�H�@!to!t�H�p!t�!tI��!t�!t����!t�!t�?�!ty"t���"t�"t�?�"t�"t؎A�"t�"tx���"t#t��C#t^#t�e�`#tf#t�?p#tv#t�?�#t�#tD?�#t�#td@�#t�#t�?�#t�#tx���#t$t��C$t�$t���$tj%t(��p%t�%tL���%t &t\�� &t?&t���@&tF&t�?P&t#'tt��0't�'t����'t,(t���0(t�(t����(t�,t����,t�,tA�,t�,t(�@ -t6-tH�@-t�-t@���-t�-t8H��-t4.t�H�@.tn.t�Ap.t�.t�A�.t�.t�A /t�/t�A�/t�/t�A�/t0t�A 0t�0t�A�0t�0t�?�0t�0th?�0t�0th? 1t'1t$@01t;1t�@?@1tk1t�8?p1t{1t�@?�1t�1t�@?�1t�1th?�1tP2t(�P2t�2tD��2t3th? 3tG3th?P3t�3t`��3t4t�� 4t|4t�@�4t�4t�@�4t@5tt@@5t�5tX@�5t<6t��@6t�6t @�6t�6t�� 7to7t�@p7t�7t�� 8tP8t�@P8tw8th?�8t�8th?�8t�8th?�8t9th?9t79th?@9tU:t��`:t�:tp@�:t�:tX@�:t8;tD@@;tc;t�4?p;tT<t$@`<t
=t�B=tE=t�@P=t�>t ��>t?t�x??tG?t@@P?t�?t @ @t@t@ @ty@t���@t�@t�� AtXAt��`At�At���AtBt�� BtOBtl@PBtBtl@�Bt�Bt��Bt�Ct4@�Ct]Et(�]Et�Et @�EtZFt��`Ft�Ft���FtHt�� HtjHt�pHt�Ht$��HtNIt<�PIt�JtT��Jt�Jt��Jt?Kt��@KtxKt���Kt�Kt���KtLt�
@ LtvLth
@�Lt�LtD
@�Lt�Lt�8? Mt+Mt�8?0Mt;Mt�@?@MtgMth?pMt�MtD
@�Mt NtL9? NtNt�8? Nt,NtLn?0Nt_Nt��?`Nt�Nt��?�Nt�Nt,S?�Nt�Nt@�NtOt��?Ot5Ot�+?@Ot�Ot @�Ot�Ot�@�OtPtX
@Pt(Pt�@0Pt�Pt�@�Pt�Pt�?�Pt�Ptx=? QtQt�4?QtQtLn? Qt3Qt�@@Qt`Qt�@`Qt�Qt�@�Qt�Qtn?�Qt�Qtn?�Qt�Qt,S?�Qt�Qt,S?�Qt�Qt�g?�QthSt,@hSt�StH�?�StYTt�@`Tt�Tt�@�Tt-Utd@0Ut�UtL@�Ut�Uth?�UtVt�� VthVt,?pVt�Vt�*��Vt"Wt�M�0WtbWt,_�pWt�Wt�*��WtXt�*� Xt�Xt+��Xt�XtT��Xt�Xt�Y��Xt5Yt$+�@YtUYttA`YtZt<+�Zt�Zt4���Zt�[tL���[t�[tDN��[t.\t���0\t�\t����\t"]tЄ�0]tU]t��`]tf_t ��f_t�_t @�_t`t���`tT`t�?``t�`tȅ� ateat��pat�at���atbt�O� btGbt ��Pbt�btl-��btEct8��Pct�ct8���ct�ct\G��ct�dt�O��dtcet�O�pet�et�T��et�et�T��et#ftX��0ft�ft4P��ft�ft$T��ftgtT�gt�gtTP��gt2htp��@htbht�S�pht�ht�.��ht�htX
@�ht;it�.�@it�it�.��it�it�x?�itjtX
@jtejt�P�pjt�jt����jtkt/� kt@kt�6?@ktckt<��pkt�kt����kt)ltH/�0ltBltR�Plt�ltN��lt�lt`X? mtRmtĆ�`mt�mt����mtnt�?nt^nt܆�`nt�nt�/��nt�nt���nt.ot�N�0otfot :Apotxot�?�ot�ot�?�ot�ot�?�ot�ot�?�ot�otD?�otapt0�ppt}pt�g?�pt�qt���qtrtx	? rt�rt�0��rt�rt�A�rt"st��"stOst�?Pst�st����st�stx	?�stett���ett�tt�?�ttut���ut:utx	?@ut�ut����ut�ut�? vtnvt��nvt�vt�?�vtLwt(��Lwt�wt�1?�wt�wt|���wt,xt�?0xt�xt����xt�xt�x?�xtOyt|��Oyt|yt�?�yt�yt����ytzt�?zttzt���tzt�zt�?�zt�zt�:A�zt/{t��C/{tZ{t�?`{t�{t���{t�{t����{t|t��|t|t�? |tU|t���`|t�|t����|t�|t�?�|t�|t؎A�|t}t��}t!}t��?0}tD}t�AP}td}t�Ap}t�}t�A�}t�}t���}tO~t$��P~t�~t�/��~t�~t�A�~t�~t`���~t�~t�A�~t/tp��0t;t�@?@tKt�@?Pt?�t���?�t�t�?��t�t����t��t�? �t�t4�? �t4�t�A@�tW�t��`�tt�t�A��t��t�A��t��t�A��tԂt�A��t��t�:A �t�t�@?�t�t�	? �t?�tx��@�t\�t4�?`�t|�tDx���t��tx����t��t�:A��t܃t�:A��t��t b� �ts�tl����t4�t��4�tk�tH�?p�tv�t�?��t�t�f?�t7�t g?@�t��t�?��t	�tԮ?�t�t�? �t-�t�g?0�tT�t� ?`�t��t�A��t��t�PA��t؈t��?��t�tLB�t7�th?@�tJ�t�?P�t։t KB��t�t�?��t��tD? �t��t@���t�t� �t/�tħ�0�tU�tا�`�t؋t����tK�t`�P�t:�t|�@�t~�t<����t��tx�B��t��t$V?��t�t�G��t�t�? �t-�t�g?0�t`�t�)A`�t��t���t��t�w?��t�t`A�t^�t�G�`�tf�t�?p�t}�t�g?��t��t�)A��t�t�o��t0�t�w?0�tR�t`A`�t��t�>���t��t�?��t͐t�g?Аt�t��A �tq�t�G���t��t�w?��tt`AБt��tTf���tʒt�	?Вtْt�?��t�t06A�t7�th?@�tg�th?p�t��t$@��t��t�@?��tۓt�8?��t�t�@?�t��t�@? �t'�th?0�t��t(���tW�tD�`�t��th?��t��th?��t)�t`�0�t��t����t�t�@�tN�t�@P�t��tt@��t�tX@�t��t����t�t @�to�t��p�tߙt�@��te�t��p�t��t�@��t�th?�t�th? �tG�th?P�tw�th?��t��th?��tƜt��Мt�tp@�tV�tX@`�t��tD@��tӝt�4?��tŞt��Оt{�t����t��t�@��tD�t �D�t}�t�x?��t��t@@��tm�t @p�t��t@��t�t���tm�t��p�tɣt$��Уt�t���t��t����t��tl@��t�tl@�t?�tD��@�t�t4@ �tΧtX��Χt�t @�tʨt��Шt4�t��@�t��t����tڪt��tJ�t$�P�t��t<���t��tT� �tJ�t�P�t��t����t�tԀ��tF�t��P�t��t�
@��t�th
@�t5�t��@�tk�t�8?p�t��t�8?��t��t�@?��tׯth?�t%�t��0�tp�tL9?p�t��t�8?��t��tLn?��tϰt��?аt��t��? �t�t,S?�tV�t@`�t~�t��?��t��t�+?��t�t @ �tE�t�@P�t}�tX
@��t��t�@��t5�t�@@�tI�t�?P�tn�tx=?p�t��t�4?��t��tLn?��t��t�@��tгt�@гt�t�:? �t�tn? �t7�tn?@�tO�t,S?P�t_�t,S?`�tm�t�g?p�t�t,@�t�tH�? �tٶt�@�t	�t�@�t��td@��t�tL@�t7�th?@�t��t8@��t��t�?��tj�t���p�t��t0����tb�t��p�t��tX�� �tH�t���P�t��t ����ta�t���p�t��t�����t'�t���0�t��t؁���t1�t0��1�t��t8@?��t<�tܽ�<�tk�t�x?k�t��t�x?��t��t<����t�th���t�t�? �tK�tx��P�tp�t��Cp�t��t�����t�t��� �t&�t�?0�t�t �� �t)�t��0�ti�t$��p�t��tA��t��t�����t��t��?��t�t,? �to�t�*�p�t��t����t�t,_� �th�t�*�p�t��t�*���t=�t+�@�tX�tT�`�tx�t�Y���t��t$+���t�ttA�t��t<+���t<�t4��@�tI�t(��P�t��tt����t��t�����t��t�����t��t�����t�t�1��t�t ���tS�t @`�t��t�����t�t�?�t��t�����t�t�� �tg�t؂�p�t��t0����t��t�2� �t��tl-���t��t8�� �tU�t8��`�t��t\G���tE�t��P�t�t�� �t3�t�T�@�tW�t�T�`�t��t4����tz�tL����t��t$T���t��tT���tg�tl��p�t��t�����t�t�S� �t`�t�.�`�t��tX
@��t��t�.���tV�t�.�V�t��t�x?��t��tX
@��t�t��� �t��t�����t��t/���t��t�6?��t�t<�� �t��t�����t��tH/���t��tR� �tj�t܃�j�t��t`X?��t�tĆ��tw�t���w�t��t�?��t�tTN��tA�t�/�P�t��t����t��t(����t�t :A �t(�t�?0�t8�t�?@�tH�t�?P�tX�t�?`�ti�tD?p�t�t0� �t-�t�g?0�t��t@����t��tx	?��t>�t�0�@�tn�t�Ap�t��t����t��t�? �tk�t���k�t��tx	?��t�t����tB�t�?P�t��t�����t��tx	?��t�t����t��t�?��t�t���tI�t�?P�t��t(����t7�t�1?@�t��t|����t��t�?��t`�t���`�t��t�x?��t��t|����t,�t�?0�t��t�����t��t�?��t$�t���$�tQ�t�?`�t|�t�:A��t��t��C��t
�t�?�tP�t��P�t}�t�����t��t�����t��t�@?��t�t��� �tn�t��p�tv�t�?��t��t؎A��t��t�����t��t��?��t�t�A�t$�t�A0�tD�t�AP�t��t����t �t$�� �tQ�t�/�`�tt�t�A��t��t`����t��t�A��t��tp�� �t�t�@?�t�t�@? �t�t����tO�t�?P�t��t����t��t�?��t��t4�?��t�t�A�t'�t��0�tD�t�AP�td�t�Ap�t��t�A��t��t�A��t��t�:A��t��t�@?��t��t�	?��t�t`��t,�t4�?0�tL�tDx�P�tp�t`�p�t��t�:A��t��t�:A��t��t b���tC�tl��P�t�t���t;�tH�?@�tF�t�?P�t��t�f?��t�t g?�tu�t�?��t��tԮ?��t��t�?��t��t�g? �t$�t� ?0�t_�t�A`�t��t<����t��t��?��t��tLk?��t%�tLk?0�te�tLk?p�t��t8k?��t��t(k?��t.�tk?0�tn�t�j?p�t��t4KB��t uPKB  uj u�KBp u� uP��� uNu�KBPu�uh���u�u�KB�u.u���0uuuTLB�u�u@g?�uu�i? uu�;?�u�ulLB�u?u�W?@u�u�LB�u�udi?�u�uTi? uuDi? u�u$i?�u�ui?�uu�LBuKux	?Pu�u�LB�u(	uЅ�0	uA	udh?P	u�	uHh?�	u�	uD:?�	u�	u�?�	u�	u8h? 
u0
uP~A0
u^
u��`
u�
uh?�
uu|�?uuD? u�u�g?�u�u�g?�u�u�g?�uu�;? uCu�PAPuwuh?�u�u�@?�uu�PA u&u�?0u9uD?@u�u�G��u�u�?�u�u�g?�u�u�A�uut�� u@u�w?@ubu`Apuvu�?�u�u@6?�u�u@6?�u�u@6?�u�u@6? uu@6? u3u@6?@uSu@6?`u~uxm?�u�u�OA�uuPA u5u4�A@u\u�?`upu�4?pu�up�A�u�u��A�u�u@�A�u�ućA u(u��A0u�up�A�u�u��A�u�u��A�uu�AuXu@�A`u uT�A u3u�@@uNu|�APufu$V?pu�u�A�uu�
@ uDu̈APu�u�A�u�u0�A u
u�?uu�? uIu`d?PuIu@�APu�u�@�ubul�Apu*u��A0u�u��A�uD uЊAP uo u�c?p u� u��A� u !u�A !u%!u�+?0!u�!u �A�!uq"uD�A�"u�"uh�A #ul#u��Ap#u�#u,�?�#u$u��A$uw$u��A�$u�$uԋA�$u�$uԋA�$u�$u�A %u%u�4?%u%uD? %u�%u�Q��%u�%u�@?�%uV&uR�`&uV'u0R�`'us'u\R��'u-(utR�0(uC(u\R�P(u)u�R�)u�*u�R��*uz+uS��+u,u4S� ,u�-udS��-u�.u�S��.u/u�A /uM/u�S�P/u�/u��?�/u�/u�?�/u'1u�S�01u�1u����1u�2u܅��2uO3u ��P3u�7u$���7u�7u|Z��7u�7u�?�7u�7ux�� 8uN8u���P8uN9uT�P9uK:u8T�P:u�:ulT��:u$;u�T�0;u6;u�?@;uk;ux��p;u�;u����;uh<u�T�p<u�<u��?�<u�<u�?�<uM>u�T�P>u�@u�\��@u�@u8]� AuAu|Z� Au9AuhA@AuQAu��?`AufAu�?pAu�Aux���Au�Au����Au CuHW� CuDu|W�DunDu�W�pDuEu�W�EuSEu��?`EufEu�?pEu�Fu4��Fu�Gu`��Gu�Hu���HuQIu�`Iu�Mu$���Mu�Mu|Z��MuCNu��APNu�NuD�A�NugOup�ApOu�Ou$�A�Ou�Pu����Pu�Pu�?�Pu$Qu�?0QuiQu�ApQuRu���Ru_Ru�?_Ru�Ru�?�Ru9Su��A@SuOSud4@PSu_Sud4@`SuhSu�?pSuxSu�?�Su�Su�?�Su�Su�?�Su�UuT�A�Uu�UutA�UuSVu|�A`VuWup�A Wu([uX��([uf[u�?p[u[ul`?�[u�[u�?�[u�[u@�A�[u�^u�A�^u]au��A`au�au̃A�auGbup�APbu�bu�m?�buIdu4�APduLeuX��Peuieu��Apeu�eu����eufu��� fuGfu$�@Pfuefu�N@pfu�fu�N@�fu�fu@�@�fu�fud4@�fu�fud4@�fuWgu��A`guogud4@pgugud4@�gu�gu��A�gu�guLn? hu hu<H? hu�iu����iu�iu�1?�iu�iu(�A ju[lu,��[lu�lux	?�lu�lu(�A�lu�lu�A�lu�lu �A mumu�A mu^muДA`mu�mud�A�munu��Anu<nu؆A@nu<ou��A@ouFou�?Pounouxm?pou)put�A0pugput,Appu�pu4�?�pu�pu�?�pu�ru,p��ru�ru�?�ruXsul�A`su�sul�A�su�sutA tutu�A tu1tu��A@tuTtu�A`tuktu�@?ptu�tuܬ@�tu�uu�A�uu�uu �A�uuvu|�Avu4vuԏA@vu{vu�A�vu�vuD?�vu-wu��A0wu6wu�?@wuhwu06Apwu�wu�m?�wu�wu($B�wu�wu0@ xuNxu�G�PxuVxu�?`xumxu�g?pxu�xu�A�xu�xud��xu yu�w? yu"yu`A0yu�yu�Q��yu�yu�@?�yufzuR�pzuf{u0R�p{u�{u\R��{u=|utR�@|uS|u\R�`|u}u�R� }u�~u�R��~u�uS��u"�u4S�0�u��udS���u��u�S���u-�u�A0�u]�u�S�`�u��u��?��u��u�?��u7�u�S�@�u��u�����u��u܅���u_�u ��`�u��u$����uǋu|Z�Ћu֋u�?��u�ux���u^�u���`�u^�uT�`�u[�u8T�`�u��ulT���u4�u�T�@�uF�u�?P�u{�ux����uΏu���Џux�u�T���uÐu��?Аu֐u�?��u]�u�T�`�u��u�\���u�u8]��u'�u|Z�0�uI�uhAP�ua�u��?p�u��u�k?��uוuh?��u�u�@?�u��u�? �u�u�?�u�u�? �uG�uh?P�uw�uh?��u��u`?��u��uh?��u�uh?�u�u$@ �u+�u�@?0�u[�u�8?`�uk�u�@?p�u{�u�@?��u��uh?��uc�uЈ�p�u6�u���@�ug�uh?p�u��uh?��u�u`%A�un�u�%Ap�u̚u�@Кu.�u�@0�u��ut@��u�uX@�u��u����u�u @ �u~�u�%A��u�u�@�u��u0����u �u�@ �u'�uh?0�uW�uh?`�u��uh?��u��uh?��u�uh?�u@�uL��@�ur�up@��uơuX@Сu�uD@ �uC�u�4?P�u\�u|��`�uI�uP��P�u��u�@��u9�up��9�uu�u�x?��u��u@@��um�u @p�u��u@��u�u�&A�u��u����u��u 'A �u=�uD'A@�u��uL]A��u�ul@�u�ul@ �u��up����ud�u4@p�u=�u ��=�u}�u @��ud�u��p�u��u��� �u�uP����uʰu�(Aаu:�u�(A@�u��u�(A��u'�u���0�uz�u�(A��u߳u)A�u�u0)A �uv�uD)A��u��u�
@��u�uh
@ �u+�u�@?0�uW�uh?`�u��u�	A��u̵uLn?еu��u��? �u�u,S?�uV�u@`�u~�u��?��u��u�+?��u�u @ �uE�u�@P�uh�u�@p�u�u�@�u�u�? �u>�ux=?@�uP�u�4?P�u\�uLn?`�us�u�@��u��ut)A��u�u�^A�u�un?�u'�un?0�u?�u,S?@�uO�u,S?P�u]�u�g?`�uغu,@غu�uH�?�uɻu�@лu��u�@ �u��ud@��u��uL@ �u'�uh?0�u��u�^A��u��u�?��u2�u�f?@�ug�u g?p�u��u�G���uƾu�?оuݾu�g?�u�u�)A�u]�uԏ�`�u��u�w?��u��u`A��u׿uh?�u�uh?�u7�u$@@�uK�u�@?P�u{�u�8?��u��u�@?��u��u�@?��u��uh?��u��u�����uO�u���P�uw�uh?��u��uh?��u�u`%A �u~�u�%A��u��u�@��u>�u�@@�u��ut@��u��uX@ �u��u0����u.�u @0�u��u�%A��u��u�@ �u��u ����u �u�@ �uG�uh?P�uw�uh?��u��uh?��u��uh?��u�uh?�ur�u HB��u��up@��u�uX@�uX�uD@`�u��u�4?��u��uPHB��u��u$����u��u�@��u��u�����u��u�x?��u'�u@@0�u��u @��