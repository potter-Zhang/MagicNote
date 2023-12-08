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
          (ch == "}" && (cx.type == "block" || cx.type == "top" || cx.type == "interpolation" || cx.type == "restricted_atBlock") ||
           ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
           ch == "{" && (cx.type == "at" || cx.type == "atBlock"))) {
        indent = cx.indent - indentUnit;
        cx = cx.prev;
      }
      return indent;
    },

    electricChars: "}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    fold: "brace"
  };
});

  function keySet(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) {
      keys[array[i]] = true;
    }
    return keys;
  }

  var documentTypes_ = [
    "domain", "regexp", "url", "url-prefix"
  ], documentTypes = keySet(documentTypes_);

  var mediaTypes_ = [
    "all", "aural", "braille", "handheld", "print", "projection", "screen",
    "tty", "tv", "embossed"
  ], mediaTypes = keySet(mediaTypes_);

  var mediaFeatures_ = [
    "width", "min-width", "max-width", "height", "min-height", "max-height",
    "device-width", "min-device-width", "max-device-width", "device-height",
    "min-device-height", "max-device-height", "aspect-ratio",
    "min-aspect-ratio", "max-aspect-ratio", "device-aspect-ratio",
    "min-device-aspect-ratio", "max-device-aspect-ratio", "color", "min-color",
    "max-color", "color-index", "min-color-index", "max-color-index",
    "monochrome", "min-monochrome", "max-monochrome", "resolution",
    "min-resolution", "max-resolution", "scan", "grid"
  ], mediaFeatures = keySet(mediaFeatures_);

  var propertyKeywords_ = [
    "align-content", "align-items", "align-self", "alignment-adjust",
    "alignment-baseline", "anchor-point", "animation", "animation-delay",
    "animation-direction", "animation-duration", "animation-fill-mode",
    "animation-iteration-count", "animation-name", "animation-play-state",
    "animation-timing-function", "appearance", "azimuth", "backface-visibility",
    "background", "background-attachment", "background-clip", "background-color",
    "background-image", "background-origin", "background-position",
    "background-repeat", "background-size", "baseline-shift", "binding",
    "bleed", "bookmark-label", "bookmark-level", "bookmark-state",
    "bookmark-target", "border", "border-bottom", "border-bottom-color",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-bottom-style", "border-bottom-width", "border-collapse",
    "border-color", "border-image", "border-image-outset",
    "border-image-repeat", "border-image-slice", "border-image-source",
    "border-image-width", "border-left", "border-left-color",
    "border-left-style", "border-left-width", "border-radius", "border-right",
    "border-right-color", "border-right-style", "border-right-width",
    "border-spacing", "border-style", "border-top", "border-top-color",
    "border-top-left-radius", "border-top-right-radius", "border-top-style",
    "border-top-width", "border-width", "bottom", "box-decoration-break",
    "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
    "caption-side", "clear", "clip", "color", "color-profile", "column-count",
    "column-fill", "column-gap", "column-rule", "column-rule-color",
    "column-rule-style", "column-rule-width", "column-span", "column-width",
    "columns", "content", "counter-increment", "counter-reset", "crop", "cue",
    "cue-after", "cue-before", "cursor", "direction", "display",
    "dominant-baseline", "drop-initial-after-adjust",
    "drop-initial-after-align", "drop-initial-before-adjust",
    "drop-initial-before-align", "drop-initial-size", "drop-initial-value",
    "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis",
    "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
    "float", "float-offset", "flow-from", "flow-into", "font", "font-feature-settings",
    "font-family", "font-kerning", "font-language-override", "font-size", "font-size-adjust",
    "font-stretch", "font-style", "font-synthesis", "font-variant",
    "font-variant-alternates", "font-variant-caps", "font-va3�I�L$H����wv�I�L$H����wv�I�T$D�*D�jI�L$ H���pwv�I�L$(I���bwv�I�NH��uH��H���T ��wv�H��� wv�H��H�NI���0wv�H��H��([]^_A\A]A^A_�����AWAVWVUSH��(H��H��I��I��L�i�/�M� H��H��A���N���H�)0�H�H�ϐ蛾��L�L�/�M� H��H�_�d���!���H�:eO ��vv�L��H�mE3�I�NH����vv�I�NH����vv�I�VD�:D�zI�N H���pvv�I�N(H���cvv�H�N �6vv�H��H�NI���Fvv�H��H��([]^_A^A_���������������WVSH�� H��H��I��H��H�IH�H�@X�P ��u�   �3�H��L��L��H�R2K�H�� [^_H����������WVUSH��(H�ً�I��I��H�^(0�H�H�ΐ�z���L�+�/�M� H��H�>�d��� ���H�K��L��L��H�H�@pH�@H��([]^_H����������������WVSH��0H��H��I��H��H�IH�H�@X�P ��u�   �3�H�\$ H��L��E3���1K��H��0[^_������H��(�L�L$ E3���1K��H��(��������WVUSH��(H��H��I��I��H��H�IH�H�@X�P ��u�   �3�H�\$ H��L��L���:1K��H��([]^_�WVUSH��(L�L$hH����I��H�l$pH�''0�H�H�ΐ�C���L���/�M� H��H��d���ɻ��H�|$h tH�L$h�y0���Ʌ�tH�L$h��@-�H�l$ H�O��L��L�L$hH�H�@p�P �H��([]^_�������������H��(��-3-�H��H� H�@@��H��(����H��(��M:-���H��(��������������H��(��5:-��H��(����������������H��(���2-��H��(����������������UVH��8H�l$@3�H�E�H�e�H�IH�H�@@�P0H�E�H�M�H�E�H� H�@@�P H��H�H�@@�P H�HH�H�@h�PH�Ⱥ   H� H�@@�P8H��H��H��tH��sK H9t	�msv�H��H�u�H���   �H�E�H�e�^]�UVH��(H�i H�l$ H�m@H�}� tH�M�L�.�9	��.��H��(^]��������������D  H�IH�H�@`H�@ H�����������VH�� H�T$8�|$8 tH�T$8��R��}���3҅��QL\ H�IH�T$8H�H�@`�P(�H�� ^��������D  H�IH�H���   H�@ H��������D  H�IH�H���   H�@(H��������VH�� H��rK ��qv�H��H���:�&�H��H�� ^����������VH�� H�TrK ��qv�H��H���
�&�H��H�� ^����������WVH��(H�K���>  �xqv�H��H���6   uCH��J �Fqv�H��H�OH���Vqv�H�W�}�H�WH��.�H�W H���6  H���0qv�H���? �qv�H��H���6  H��H��H��H��A�   �13-�H���6  H����pv�H���6  H���6  ��pv��H��(^_��������������VH�� H�|����  ��pv�H��`,  H�H�@@�P H��u'H�T
O �npv�H��H�d0�H�H�N�wpv�H��H�� ^�������D  H�A�������D  H�I�Ipv������������������D  H�A�������D  H�I�pv������������������WVUSH��(H�L$ H��H�>H��H�Q0H�H�CH��uH�$�S ��pv�H����ov�H��H��3�E3���,-�H�NH����ov�H��H�CH��uH��T �Mpv�H���lov�H��H��3�E3���,-�H�NH���nov��H��([]^_�������������UWVSH��XH�l$pH��H�}ȹ   3��H��H�e�H�M�H�MH��H�M�����H��9	��7-�H��H�U�9	��7-���bH�}�H��H����.-�H��H�MH�I�H��L��A�   ��+-�H�MH�I�H����+-���}H�MH�I�H��L��A�   ��+-�H�MH�	H�Q0H�:H�W H��uH��T �4ov�H��H�M��g6-����e���H���
   �H�e�[^_]�UWVSH��(H�i H�l$ H�mpH�MH�	H�Q0H�:H�w(H��uH���T ��nv�H��H�M��֐H��([^_]��H��(�H�I��+-���|
�   H��(�3�H��(�����������H��(�H�I���*-���|
�   H��(�3�H��(�����������WVH��(H��H��H��H��H�H�@@�P ��tH�NH��9	�)--��H��(^_�3�H��(^_�WVH��(H��H��H��H��H�H�@@�P(��tH�NH��9	��,-��H��(^_�3�H��(^_�WVSH�� H��H��I��H�N�H��L��A�   � *-�H�N�H���	*-���}H�N�H��L��A�   ��)-��H�� [^_�����WVUSH��(H��H��I��H�x�O ��lv�H��H�MH����lv�H�MH����lv�H���.��`lv�H��H�NH���plv�H��.�H�NH��#/�H��L��H��)-�H��([]^_H����������������AVWVUSH�� H��H��I��I��H�C�O ��kv�L��I�NH���lv�I�NH����kv�3�H�M I�NM�FH����+K���tWH�>�.���kv�H��H�OI����kv�H�q�.�H�OL��H�k>/�H���r9-�H��H����kv��   H�� []^_A^�3�H�� []^_A^��WVSH��03�H�D$(H��I��I��H�\$pE3�L�L�L$(H��L���+K���t&H�OH�	H���WH��H���@kv��   H��0[^_�3�H��0[^_����������WVSH�� H��H�o�M ��jv�H��H�CM ��jv�H��H�ː�]�  H�OH����jv�H�NH����jv�H���M ��jv�H��H�DM �~jv�H��H�ː��  H�OH����jv�H�NH���xjv�H���M �Kjv�H��H��BM �;jv�H��H�ː���  H�OH���Bjv�H�NH���5jv�H���M �jv�H��H�DM ��iv�H��H�ː��  H�OH����iv�H�N H����iv�H��M ��iv�H��H��BM ��iv�H��H�ː�Q�  H�OH����iv�H�N(H����iv�H��M ��iv�H��H��CM �riv�H��H�ː��  H�OH���yiv�H�N0H���liv�H�u�M �?iv�H��H��@M �/iv�H��H�ː���  H�OH���6iv�H�N8H���)iv��H�� [^_���������D  H�A�������D  H�A�������D  H�A�������D  H�A �������D  H�A(�������D  H�A0�������D  H�A8�������WVH��(H��H��H�NH�IH��9	���  H�NH�IH��9	��μ  H�NH�IH��9	�軼  H�N H�IH��9	�証  H�N0H�IH��9	�蕼  H�N8H�IH��9	�肼  H�N(H�IH��H�hv(�9	H��(^_H�������WVH��(H��H��H�NH�IH��9	�聽  H�NH�IH��9	��n�  H�NH�IH��9	��[�  H�N H�IH��9	��H�  H�N0H�IH��9	��5�  H�N8H�IH��9	��"�  H�N(H�IH��H��u(�9	H��(^_H�������H��(���&-�H��H� H�@@��H��(����H��(���--���H��(��������������H��(���--��H��(����������������H��(��-&-��H��(����������������VH�� H��H�N��fv�H���(K�H�NH�H�@h�P8H�NH����fv��H�� ^����WVH��(H��A��H�N��fv�H����'K�H�N��H�H�@p�H�NH���mfv��H��(^_��������������WVH��(H��H��H��H�H�@H�P0H�NH���2fv�H���q'K�H�NH���fv��H��(^_�������������VH�� H��H�NH�H�@P�P0��tH�NH�H�@`�P(�FH�� ^��������������D  H�IH�H�@HH�@8H�����������D  H�IH�H�@HH�@H�����������D  H�IH�H�@HH�@(H�����������VH�� H��H�κ   H�H�@@�P(H��H�,-�H�� ^H������VH�� H���tL�~ uFH�NH�H�@p�PH�NH�H�@H�P�~ t H�NH�H�@P�P0��tH�NH�H�@X�P �FH�� ^���H��(���#-�H��H� H�@@��H��(����H��(��+-���H��(��������������H��(��+-��H��(����������������H��(���#-��H��(����������������WVSH�� H��H��H�^HH��uH���H��H��H�H�@@�P8H��H��H��tH�+�.�H9t�xdv�H�NHH��L���P"-�H;�H��u�H�� [^_���������WVSH�� H��H��H�^HH��H���K#-�H��H��H��tH���.�H9t�dv�H�NHH��L����!-�H;�H��u�H�� [^_�������AWAVATWVUSH�� H��H��I��H�-*��H�ͺ�  �Tcv�H��`,  H�N�Kcv�H�����cv�L��I��3�E3��= -�H�N I��� cv�H�Y����bv�L��I��3�E3�� -�H�N(I����bv�H�V[O ��bv�L��H�ͺ\  ��bv�H���  H�H�@@�P8H��H�H�@H�P(H��H��@���@�L��H�����ybv�L��I��3�E3���-�I�NI���{bv�M��u6H��{O �Ibv�L��H���.��9bv�L��I����&-�I�OI���@bv�H��XO �bv�L��I�L$I���"bv�I��I�N�bv�H�N0I���bv�H�NH����av�H����   H�ͺw  ��av�H��H��8   uCH�8�H ��av�H��H�OH����av�H���}�H�WH�h�.�H�W H��8  H����av�H�M)@ �gav�H��H��8  H��A�   ��#-�H��H�N@H���^av��Fv�FwH�� []^_A\A^A_����������������WVUSH��(H��H�=��H�Ϻ�  �av�H��`,  H�N�av�H�@����`v�H��H��3�E3���-�H�N H����`v�H�����`v�H��H��3�E3���-�H�N(H����`v�H�YO ��`v�H��H�Ϻ\  ��`v�H���  H�H�@@�P8H��H�H�@H�P(H��H�S	@���	@�H��H�����5`v�H��H��3�E3��T-�H�KH���7`v�H��u6H�kyO �`v�H��H���.���_v�H��H���A$-�H�OH����_v�H�]VO ��_v�H��H�MH����_v�H��H�K��_v�H�N0H����_v��H��([]^_����D  H�A�������WVUSH��(H��H��H�H�@P�P8H���N �c_v�H��H��H�H�@@�P(H�OH���f_v�H��H�H�@x�PH��H�w:M �)_v�H��H��H�H�@x�P L��3҉T$ H��L��H����=K�H��H��([]^_��������������H��(�H�y tH�IH�H�@@�P �3�H��tH�@�3�H��(�WVUSH��(H���FpH�~ ��   H��N ��^v�H��H��H�H�@@�P(H�OH����^v�H��H�H�@x�PH��H��9M �X^v�H��H��H�H�@x�P L���D$    H��L��H����<K�H�NH���A^v�H���x$K��H��([]^_�������VH�� H��Np��~)�ɉNp��u H�NH��t9	���  3�H�NH���0$K��H�� ^��D  3����������D  3����������AVWVUSH�� H��H��A��H��1Q ��]v�H��]H�39M �u]v�H��H�K���\  �x]v�H���  H�H�@@�P8H��H�H�@H�P(H�KH���U]v�H�Nd> �(]v�L��I�NH���8]v�H���.�I�NH��H��M��L��H�"l(�H�� []^_A^H�������WVUSH��(H���A��H��8M ��\v�H��H���N ��\v�L���\$ D��H��H�֐��  ��H��([]^_�WVUSH��8H��H��H�+9M �}\v�H��H�nH�O�<K�L��3�H�L$ H�NH�L$(3�H�L$0H��H��E3��kDK�H��H���c��S-�������H��8[]^_�����������WVUSH��(H��H��H�H�@x�P H��H�n�N ��[v�H��H�ΐ�   H��H��H�H�@x�PH��tH�KH����[v�H�KH����[v�H�KH����[v�H��H�H�@P�PH�K H����[v�H�g���w  ��[v�H��H�� 8   uCH�H�E �b[v�H��H�OH���r[v�H���}�H�WH�0�.�H�W H�� 8  H���L[v�H�� 8  H��H�H�@@H�@ H��([]^_H������WVSH��03�H�D$(H�D$ ��K�H��H�T$(L�D$ E3�H� H�@@�P H��H��u
3�H��0[^_�H���M ��Zv�H��H�\$ H�OH����Zv�H�OH����Zv�H��H��0[^_��WVSH�� H��H��H�H�@H�PH��t7H��H��-��\Zv�H��H�KH���lZv�H�=�.�H�KH��H���uK��H�� [^_�����H��(�3��#K�H��H� H�@HH�@H��(H����������������UAWAVAUATWVSH��   H��$�   H���H���� K�H��H�H�@x�P H��H�ΐ�n  L��H�FXH�HH�	�PL�xPH��H�H�@`�P H�E�H�ΐ�/%  L��L���E��E��UĉU�I��M�E M���   A�PH��u'D�m��E��E�H��X.��\.���Yv�H� H�E��MH�W�.��   �tYv�H�E�I��I�U H���   �RL��H�M�3��XYv�D�m�D�E�A��H�M�H�M��E�H��5M ��Xv�L��M��H�M�D�)�]��YL�d$0H�]�H�\$8H�NH�L$@�|$H3�H�L$PH�E�H��H��L�|$ L�U�L�T$(��RK�H�E�H�e�[^_A\A]A^A_]�������������H��(�H�H�@@�P(H��H� H�@@�P H��H��H��tH�B�L H9tH����Xv�H��H�H�@h�P H��H��u3�H��(�H�H�@HH�@8H��(H��������D  �Au�������D  �Qu��������UWVH��0H�l$@H�e�H�MH�M�yu tH��H�HH�	H�@H�e�^_]H��H�M�AuH��H�HH�	�P�H���N   �H�e�^_]�UWVH��0H�i H�l$ H�m@H��H���.��WWv�H���f F�H��H��L����+-�H���&sv��UWVH��0H�i H�l$ H�m@H�U�Bu H��0^_]�����������VH�� H��H�H�@@�P H��H� H�@H�H��H��H���I�9	H�� ^H�������������VH��03�H�D$(H��H�H�@@�P H��H� H�@H�H��L�D$(H��H� H���   �P��tH�D$(�x����H��0^�3�H��0^���UWVH��0H�l$@H�e�H�MH�M�yw t'H�MH�I9	��TK�H��H��H���c��G-���uIH�M�yv tyH�M�yw �����Ʌ�uh3ɋ��H�MH�EH� H�@@�P H�ȋ�H� H�@h�P8�EH�4M ��Uv�H����� �qv�H�Ȑ�_}��H��H��L���0UK�H���qv�3�둹   �H�e�^_]�UWVH��0H�i H�l$ H�m@H�MH�EH� H�@x�H���Oqv���������WVUSH��(H�T$XH��H�*Q �;Uv�H��H�OH���KUv�H�|$X tH�L$X�y0���Ʌ�tH�L$X�}!-��~w t'H�N9	�{SK�H��H��H�F�c�� -����(/\ H��.���Tv�H��H�!�.���Tv��@<  H�KH����Tv�H�OH����Tv��~v t�~w �����3��Ʌ�u3���   �ك�H���.��dTv�H��H��H�H�@@�P H�ȋ�L�D$XH� H�@p�PH��H�MH���PTv�H�){.�H�MH��H��A�   9	��(-�H�GH�@H��([]^_���������VH�� H���b(-�H��H�H�@P�P8H��H�H�@XH�@H�� ^H�����������������UAVWVSH��@H�l$`H�e�H�MH�5z��H�κ\  ��Sv�H���  H�H�@@�P8H��H�H�@H�P(H��H��>6 ��Sv�H��H��.��   ��Sv�L��H�MH�I���-�L��I��3���Sv�H��I��H�H���   �P H��H���adG�H��H��u*H�MH�EH� H�@X�PH��H��uH��N ��Rv�H��H�κw  ��Rv�H��8  H�{�.��   � Sv�H��H�MH�I���-�L��H��3���Rv�H��H��H�H���   �P(H��H�¶.��   ��Rv�H��H��L��3���Rv�H�\$ 3�H�L$(H��H�UE3�E3�H�H�@X�P H��H��H��tH��-�H9t	��Rv�H��H�U�Rv�U�H�U�Rw�U�H�UH�RH���M ��Rv�H��uH�MH�EH� H�@@�P8H�MH���K��H���   �H�e�[^_A^]�UAVWVSH��@H�i0H�l$0H�m`H�UH�RH�Q�M �Rv�H��uH�MH�EH� H�@H�H�E�U܈PvH�E�U؈PwH��@[^_A^]�������WVSH��0H�T$(H��I��H�JH�IH��uH��H�lT ��Qv�H���Qv�H��H�KH��� Qv�H�KH���Qv�H�T-���Pv�H��H�NH����Pv�H��w.�H�FH��H��0[^_���������D  �Av�������D  �Qv��������D  �Aw�������D  �Qw��������WVH��83�H�D$0H��H��H�H�@x�P8H��H� H�@@�P(H��H�N���-�H��H��H�H�@@�P H�D$0�|$0 t7�|$0 u�&   ��-��L$4�   H�D$(��HH��H�T$(H�H�@`�P(�H��8^_�������������H��(�3�H�H�@`�P8�H��(����������VH�� H��H�κ   H�H�@`�P8H��H��-�H�� ^H������WVH��(H��~x uW��t,H�~HH��t#H��-��_Ov�L��H�OH�	H���W3�H�NHH�NH��t9	����  H��3�H�H���   �P(�FxH��(^_����D  �Ax�������D  �Qx��������H��(��yv u��tH�H�@@�P H��H� H�@p�P �H��(�����AWAVWVUSH��83�H�D$(H�T$0H��H��H�_H�+H��D��A��E��tH�I���Nv�L��H��E��tH�I���Nv�H����NK�H��I����-�����(\ H�n H���tH�I��rNv�H��L�D$(H��9	��-����   H�n(H���tH�I��ANv�H��L�D$(H��9	��-���u4H�KH��uH��H��hT �INv�H����Mv�H��H�MH����Mv��H�L$(L�"�-�9	��-�H��H�KH��uH��H��hT ��Mv�H��L��M��tI9tH���Nv�L��H�KH��uH��H�yhT ��Mv�H���XMv�H��H�MI���hMv�H�MI���[Mv�H�l$(H�v H���tH�I��PMv�H��L�D$(�H��A�   �G
-�H�t$(H�KH��uH��H�hT �QMv�H��H����Mv��H��8[]^_A^A_��������WVH��(3�H�D$ H��H��H���MK�H��H�O(L�D$ H��9	�-
-���ubH��H��H�I L�D$ 9	�
-���uE3��H�L$ L���-�9	���-�L��H��H����K�H�D$ H�O(L�D$ �H��A�   �o	-�H�D$ H��(^_������������AWAVWVUSH��(3�H�D$ H��H��I��H�-Շ�H�ͺw  ��Kv�L��I��8  L�D$ H��9	�=-����%  H�ͺ   ��Kv�H���	-�H��H� H���   �P���Z&\ H���6 ��Kv�H��H�?�.��   ��Kv�L��I��L��3���Kv�H��I��H�E H���   �P H��H��.��   ��Kv�L��H�M �ZKv�L��I��3��tKv�H���6 �?Kv�L��I�Ϻ   �VKv�H�G�/�H�H��M����E�H��H��6 �Kv�H��H���L-�H��H���6 �,Kv�H�D$ I��8  H��L�D$ 9	�-�H�D$ H�HH�	H��L���P�H��([]^_A^A_������WVH��(H��H��H�ΐ�k���H��H�א�O  H��H�H�@@�P(H��H� H�@@�P8H�H8H�IH��L���-�9	���-��H��(^_����WVH��(H��H��H�ΐ����H��H�H�@@�P(H��H� H�@@�P8H�H8H��9	��2a����u	3�H��(^_�H��H�H�@@�P(H��H� H�@@�P8H�H8H�IH��L�!�-�9	��-��H��(^_����������WVH��(H��H��H�ΐ�{���H��H�H�@@�P(H��H� H�@@�P8H�H8H��9	��`����H��(^_���������AVWVUSH��0H�T$(H��H�H�@@�P H��H� H�@H�H�Ⱥ   H� H�@p�PH��H�^H�kH��uH��H�dT �FIv�H��H�t== ��Hv�L��I��L��3���
-�M��H��H��rd���-�H��H�kH��uH��H��cT ��Hv�H��H�KH��uH��H��cT ��Hv�H���iHv�L��I��L��3���-�H�K H��uH��H��cT ��Hv�H��H��M��H�-�H��0[]^_A^H������������AWAVWVUSH��(H�T$ L�L$xH��H��I��H��$�   L�wI�NH��uH��H�_cT �<Hv�H����Gv�L��I�OH����Gv�H�T$xfA�W I�OH����Gv�I�OH����Gv�H��H�H�@@�P H�Hx9	���1��I�NH��uH��H��T ��Gv�H���[Gv�H��H�NI���kGv�H�Tn.�H�NI�NH��uH��H��bT ��Gv�H���Gv�H��H�OH���.Gv�H��H��([]^_A^A_�������AWAVWVUSH��(H�T$ L�L$xH��H��I��H��$�   L�wI�NH��uH��H�UbT �Gv�H����Fv�L��I�OH����Fv�H�T$xfA�W I�OH����Fv�I�OH����Fv�H��H�H�@@�P H�Hx9	��0��I�NH��uH��H��aT ��Fv�H���;Fv�H��H�NI���KFv�H�<m.�H�NI�NH��uH��H��aT �oFv�H����Ev�H��H�OH���Fv�H��H��([]^_A^A_�������AWAVWVUSH��83�H�D$0L��$�   H��H��I��H�����w  ��Ev�H��H���7  L�D$0H��9	��-�����   L���7  H�2�.��   ��Ev�L��I��L��3���Ev�I��I��I�H���   �P(L��H��BA �cEv�H��I����-�H��H��BA ��Ev�H�D$0H���7  H��L�D$09	�s-�H��$�   H�t$ H�D$0H�HH�	H��L��L��$�   �P�H��8[]^_A^A_�����������WVH��(H�T$ L�L$XH��I��H�JL�AM��uH��H�T`T ��Dv�L��H��H�`M �Ev�H��H��L�D$XL�L$`H��(^_H��AWAVWVUSH��83�H�D$0L��$�   H��H��I��H����w  �:Dv�H��H�� 8  L�D$0H��9	�x-�����   L���7  H���.��   �7Dv�L��I��L��3��.Dv�I��I��I�H���   �P(L��H�9@ ��Cv�H��I���'-�H��H�@ �Dv�H�D$0H�� 8  H��L�D$09	��-�H��$�   H�t$ H�D$0H�HH�	H��L��L��$�   �P�H��8[]^_A^A_�����������WVH��(H�T$ L�L$XH��I��H�JL�AM��uH��H��^T �mCv�L��H��H��M ��Cv�H��H��L�D$XL�L$`H��(^_H��WVUSH��(H���I��I��H�ΐ�����H��H�H�@@�P H�ȋ�L��L��H� H�@xH�@ H��([]^_H��������WVUSH��(H���I��I��H�ΐ�t���H��H�H�@@�P H�t$pH�t$ H�ȋ�L��L��H� H�@x�P0�H��([]^_���������������WVH��(3�H�D$ H��H��H��3�H�H�@h�H��H�H�@@�P H��H� H�@H�H��L�D$ H��H� H���   �P��u	3�H��(^_�H�Z.O ��Av�H��H�T$ H�N��Av�H��H��(^_���������WVSH�� H��H�g}��w  ��Av�H��H��(8   uCH�6= �bAv�H��H�KH���rAv�H���}�H�SH�`h.�H�S H��(8  H���LAv�H��(8  H��H��K�H�� [^_H�����������WVSH��0H�T$(H��H�JH�yH��uH��H��\T �DAv�H��H�r5= ��@v�H��H��L��3���-�H��H��H�^K�H��0[^_H��������������WVSH�� H��H��H��3�H�H�@h�H��H�H�@@�P H��H� H�@H�H�Ⱥ����H� H�@p�PH��L��H�ejd����,�H��H�|��w  �B@v�H��H��08   uCH��O; �@v�H��H�KH��� @v�H���}�H�SH�g.�H�S H��08  H����?v�L��08  H��H��Qd�H���,�H�� [^_H��AVWVUSH�� H��H��H���    �	  H���   H�l{��w  ��?v�H��H��88   uCH�4= �g?v�L��I�NI���w?v�H���}�I�VH�uf.�I�V H��88  I���Q?v�L��88  H��H�P�c����,�����   H�M �?v�H��H�a/�H�	��f��H��H����,�H�K H����>v�H�K0H����>v�ǃ�   �H���   H����>v�H���   �H����?K�H��H�� []^_A^�H��H���N H9t3�H���~   H�xM �j>v�H��H��H�H�@@�P H��H���v�,�H�K H���a>v�H�K0H���T>v�ǃ�   �H���   H���:>v�H���   � H���O?K�H��H�� []^_A^�H��O ��=v�H��H��H�H�@@�P H��H�����,�H�N H����=v�H�N0H����=v�ǆ�   �H���   H����=v�H���   � H����>K�H��H�� []^_A^����WVH��(H�T$ H��H�H�@@�P H��H�NL�AM��uH��H�KYT ��=v�L��H��H�{[L ��=v�H��H��(^_H�����������AVWVUSH��03�H�D$(H��H��H��x��w  �=v�H��H���7  L�D$(H��9	�E-�����   H���7  H��.��   �=v�L��I��L��3���<v�H��I��H�E H���   �P(H��H��"F ��<v�H��H����-�H��H��"F ��<v�H�D$(H���7  H��L�D$(9	��-�H�D$(H�HH�	H���P�H��0[]^_A^��VH��0H�T$(H��H�JL�AM��uH��H�XT �f<v�L��H��H��M �{<v�H���АH��0^��������VH�� �yx ��\ H�AH�� ^��������VH�� �yx ��\ H�I��;v��H�� ^�D  3����������D  �����������D  3����������H��(�H�H�@x�PH��H��<G�H��(H��WVH��(H��H�F8H��u)H��H�H�@x�PH����G�H��H�N8H���0;v�H��H��(^_���������������D  3����������D  �����������D  �Ay�������D  �Qy��������H��(�H�4O ��:v��H��(���������VH�� �yx ��\ H�� ^������������UWVSH��8H�l$PH�e�H��H�~ H�( u*H�2v��L:v�H��H�KH���\:v�H�O(H���O:v�H�(H�v(H�~( u*H��u��:v�H��H�KH���#:v�H�N(H���:v�L�F(H��H�Pd��b�,�H��L�`�-�9	�X�-�H�E�H�M�L�Q�-�9	�I�-���tNH�M�L�B�-�9	�:�-�H��L�8�-�9	�0�-�H��L�.�-�9	�&�-�H�M�L��-�9	���-���u�H���
   �H�e�[^_]�UWVSH��(H�i H�l$ H�mPH�}� tH�M�L���-�9	���-��H��([^_]�����UWVSH��8H�l$PH�e�H��~t �  �FtH�ΐ�����H�~ H�( u*H��t���8v�H��H�KH����8v�H�O(H����8v�H�(H�v(H�~( u*H��t���8v�H��H�KH����8v�H�N(H����8v�L�F(H��H���c����,�H��L��-�9	��-�H�E�H�M�L�
�-�9	��-���tNH�M�L���-�9	���-�H��L���-�9	���-�H��L���-�9	���-�H�M�L���-�9	���-���u�H���
   �H�e�[^_]�UWVSH��(H�i H�l$ H�mPH�}� tH�M�L���-�9	���-��H��([^_]��������������VH�� H��H�H�@@�P(H��H� H�@@�P8H�H8H��H�G�9	H�� ^H�����������VH�� H��H�H�@@�P(H��H� H�@@�P8H�H8H�IH��L��-�H��-�9	H�� ^H����������������WVH��(H��H��H��H�H�@@�P(H��H� H�@@�P8H�H8H��9	��+N�����w\ H��(^_�������������VH�� H��H��r��   ��6v�H�����,�H��H� H�@`�PH��H�:_����,�H��H�ެc����,���t4H��H�2:_�A�   ���,�H��H�T�c��^�,�������H�� ^�3�H�� ^�WVSH�� H��H��H��Q �6v�H��H�KH���6v�H��H�H�@@�P(H��H� H�@@�P8H��H��3�H�H�@@�P8H��H��H��tH��K H9t�=6v�H�KH����5v�H��H��K L��=?��!6v�H��3���H��H��A@ �z5v�H��H�OH����5v�L��\.�L�GL��H��H���c�H��,�H�� [^_H�����������VH��H�~` t^��FyH�N`�<5v�H�N`H�VH�9K�9	^H�����������������D  H�A0�������D  3����������H��(�H�AhH��uH�H���   �P�H��(����������������D  H�Ih��4v������������������VH�� H��H���W�J�H�FXH�HH�	H�@H�� ^H����������WVH��(H��H���&�J�H�FXH�HH�	�PH��H��H�H���   �P H��H��H��:K�9	H��(^_H�������VH�� H��H�����J�H�ƀ   �> u�&   �X�,��FH�� ^���������������AVWVUSH��@H��H���   H�π9 �G  H��
Q ��3v�H��H�KH����3v�H�N����,�H��H�KH����3v�H��)M �b3v�L��H��H�E H�@`�PI�NH���d3v�H��M �73v�H��H�MI���G3v�3�H�T$ H�T$(H�T$0H�SH��E3�E3���E(�H�KH���3v�H�{ tJH�P�J ��2v�H��H�MH����2v�H�Z.�H�UH��H�NX��2v��   ��OH��@[]^_A^�H��J ��2v�H��H�MH����2v�H��Y.�H�UH��H�NX��2v�3��   H�ψ�AH��@[]^_A^���������������H��(�H�I����,�H��H� H�@@H� H��(H�������������D  H�QPH��u3��H�B�����������WVH��(H��H��H�~P tH�NPH�IH���$�,�����   H�~P t#H�N@9	��,�H��H�VPH� H�@H�P 3�H�NPH��t{H�vm��\  ��