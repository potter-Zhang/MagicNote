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
    "font-variant-alternates", "font-variant-caps", "font-va3íIL$H‹Öÿ˜wvÿIL$H‹×ÿŠwvÿIT$Dˆ*DˆjIL$ H‹ÕÿpwvÿIL$(I‹×ÿbwvÿI‹NH…ÉuH‹ËH·‘T ÿ‘wvÿH‹Èÿ wvÿH‹ğHNI‹Ôÿ0wvÿH‹ÆHƒÄ([]^_A\A]A^A_ÃÌÌÌÌAWAVWVUSHƒì(H‹éH‹òI‹øI‹ÙL‹i”/ÿM‹ H‹ÖHüAÿèN¾ÖÿH‹)0ÿH‹H‹Ïè›¾ÖÿL‹L÷/ÿM‹ H‹ÓH_²dÿè!¾ÖÿH:eO ÿŒvvÿL‹ğH‹mE3ÿINH‹×ÿ•vvÿINH‹ÓÿˆvvÿIVDˆ:DˆzIN H‹ÕÿpvvÿIN(H‹ÖÿcvvÿHN ÿ6vvÿH‹ğHNI‹ÖÿFvvÿH‹ÆHƒÄ([]^_A^A_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVSHƒì H‹ñH‹úI‹ØH‹ÎH‹IH‹H‹@XÿP „Àuº   ë3ÒH‹ÎL‹ÇL‹ËH‹R2KÿHƒÄ [^_HÿàÌÌÌÌÌÌÌÌWVUSHƒì(H‹Ù‹êI‹ğI‹ùH‹^(0ÿH‹H‹Îèz½ÖÿL‹+ö/ÿM‹ H‹×H>±dÿè ½ÖÿH‹K‹ÕL‹ÆL‹ÏH‹H‹@pH‹@HƒÄ([]^_HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVSHƒì0H‹ñH‹úI‹ØH‹ÎH‹IH‹H‹@XÿP „Àuº   ë3ÒH‰\$ H‹ÎL‹ÇE3Éÿ®1KÿHƒÄ0[^_ÃÌÌÌÌÌHƒì(L‰L$ E3Éÿ1KÿHƒÄ(ÃÌÌÌÌÌÌÌWVUSHƒì(H‹ñH‹úI‹èI‹ÙH‹ÎH‹IH‹H‹@XÿP „Àuº   ë3ÒH‰\$ H‹ÎL‹ÇL‹Íÿ:1KÿHƒÄ([]^_ÃWVUSHƒì(L‰L$hH‹ù‹ÚI‹ğH‹l$pH‹''0ÿH‹H‹ÎèC¼ÖÿL‹ôô/ÿM‹ H‹ÕH°dÿèÉ»ÖÿHƒ|$h tH‹L$hƒy0Á¶É…ÉtHL$hÿ“@-ÿH‰l$ H‹O‹ÓL‹ÆL‹L$hH‹H‹@pÿP HƒÄ([]^_ÃÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ-3-ÿH‹ÈH‹ H‹@@ÿHƒÄ(ÃÌÌÌHƒì(ÿM:-ÿ¶ÀHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ5:-ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿÍ2-ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌUVHƒì8Hl$@3ÀH‰EèH‰eàH‹IH‹H‹@@ÿP0H‰EğH‹MğH‹EğH‹ H‹@@ÿP H‹ÈH‹H‹@@ÿP H‹HH‹H‹@hÿPH‹Èº   H‹ H‹@@ÿP8H‹ĞH‹òH…ötH¨sK H9t	ÿmsvÿH‹ğH‰uèH‹Ìè   H‹EèHeø^]ÃUVHƒì(H‹i H‰l$ Hm@Hƒ}ğ tH‹MğL.ÿ9	ÿı.ÿHƒÄ(^]ÃÌÌÌÌÌÌÌÌÌÌÌÌÌD  H‹IH‹H‹@`H‹@ HÿàÌÌÌÌÌÌÌÌÌVHƒì H‰T$8€|$8 tHT$8¶‹R…Ò}¶Ğë3Ò…Ò…QL\ H‹IH‹T$8H‹H‹@`ÿP(HƒÄ ^ÃÌÌÌÌÌÌÌD  H‹IH‹H‹€ˆ   H‹@ HÿàÌÌÌÌÌÌD  H‹IH‹H‹€ˆ   H‹@(HÿàÌÌÌÌÌÌVHƒì H„rK ÿÆqvÿH‹ğH‹Îÿ:Û&ÿH‹ÆHƒÄ ^ÃÌÌÌÌÌÌÌÌÌVHƒì HTrK ÿ–qvÿH‹ğH‹Îÿ
Û&ÿH‹ÆHƒÄ ^ÃÌÌÌÌÌÌÌÌÌWVHƒì(H‹K­ÿº>  ÿxqvÿH‹ğHƒ¾è6   uCH÷J ÿFqvÿH‹øHOH‹×ÿVqvÿHWõ}ÿH‰WH‹ì—.ÿH‰W Hè6  H‹×ÿ0qvÿH±Ï? ÿqvÿH‹øH‹è6  H‹ÑH‹ÊH‹ÑH‹ÏA¸   ÿ13-ÿHÈ6  H‹×ÿñpvÿHĞ6  H‹–È6  ÿİpvÿHƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹|¬ÿºÍ  ÿ©pvÿH‹ˆ`,  H‹H‹@@ÿP H…Àu'HT
O ÿnpvÿH‹ğH‹d0ÿH‹HNÿwpvÿH‹ÆHƒÄ ^ÃÌÌÌÌÌÌD  H‹AÃÌÌÌÌÌÌD  HIÿIpvÿÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌD  H‹AÃÌÌÌÌÌÌD  HIÿpvÿÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVUSHƒì(H‰L$ H‹ñH‹>H‹ÏH‹Q0H‹H‹CH…ÀuH$õS ÿpvÿH‹Èÿ¬ovÿH‹èH‹Í3ÒE3ÀÿË,-ÿHNH‹Õÿ®ovÿH‹ÏH‹CH…ÀuHŠT ÿMpvÿH‹ÈÿlovÿH‹øH‹Ï3ÒE3Àÿ‹,-ÿHNH‹×ÿnovÿHƒÄ([]^_ÃÌÌÌÌÌÌÌÌÌÌÌÌUWVSHƒìXHl$pH‹ñH}È¹   3Àó«H‹ÎH‰e°H‰MàH‰MH‹òH‹MèÿÿÿH‹Î9	ÿ”7-ÿH‹ÈHUÈ9	ÿÍ7-ÿëbH‹}ĞH‹ÎH‹×ÿ¢.-ÿH‹ØH‹MH‹I‹H‹×L‹ÃA¹   ÿó+-ÿH‹MH‹I‹H‹ÓÿØ+-ÿ…À}H‹MH‹I‹H‹ÓL‹ÇA¹   ÿÀ+-ÿH‹MH‹	H‹Q0H‹:H‹W H…ÒuH‰T ÿ4ovÿH‹ĞHMÈÿg6-ÿ„À…eÿÿÿH‹Ìè
   Heè[^_]ÃUWVSHƒì(H‹i H‰l$ HmpH‹MH‹	H‹Q0H‹:H‹w(H…öuH­ˆT ÿÔnvÿH‹ğHMÈÿÖHƒÄ([^_]ÃÌHƒì(H‹I‹ÿ+-ÿ…À|
¸   HƒÄ(Ã3ÀHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌHƒì(H‹I‹ÿß*-ÿ…À|
¸   HƒÄ(Ã3ÀHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹úH‹ÎH‹×H‹H‹@@ÿP „ÀtH‹NH‹×9	ÿ)--ÿHƒÄ(^_Ã3ÀHƒÄ(^_ÃWVHƒì(H‹ñH‹úH‹ÎH‹×H‹H‹@@ÿP(„ÀtH‹NH‹×9	ÿé,-ÿHƒÄ(^_Ã3ÀHƒÄ(^_ÃWVSHƒì H‹ñH‹ÚI‹øH‹N‹H‹ÓL‹ÇA¹   ÿ *-ÿH‹N‹H‹×ÿ	*-ÿ…À}H‹N‹H‹×L‹ÃA¹   ÿõ)-ÿHƒÄ [^_ÃÌÌÌÌWVUSHƒì(H‹ñH‹ÚI‹øHxøO ÿŠlvÿH‹èHMH‹ÖÿšlvÿHMH‹×ÿlvÿH‹îÑ.ÿÿ`lvÿH‹ğHNH‹ÕÿplvÿH‹“.ÿH‰NH‹†#/ÿH‹ÓL‹ÆH‹ù)-ÿHƒÄ([]^_HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌAVWVUSHƒì H‹ùH‹òI‹ØI‹éHCøO ÿõkvÿL‹ğINH‹×ÿlvÿINH‹Óÿøkvÿ3ÉH‰M I‹NM‹FH‹Öÿ+Kÿ„ÀtWH‹>Ñ.ÿÿ°kvÿH‹øHOI‹ÖÿÀkvÿH‹q’.ÿH‰OL‹ÇH‹k>/ÿH‹Öÿr9-ÿH‹ÍH‹Ğÿ®kvÿ¸   HƒÄ []^_A^Ã3ÀHƒÄ []^_A^ÃÌWVSHƒì03ÀH‰D$(H‹ñI‹øI‹ÁH‹\$pE3ÉL‰LL$(H‹ÎL‹Àÿ+Kÿ„Àt&HOH‹	H‹ÖÿWH‹ËH‹Ğÿ@kvÿ¸   HƒÄ0[^_Ã3ÀHƒÄ0[^_ÃÌÌÌÌÌÌÌÌÌWVSHƒì H‹ñHo¥M ÿÑjvÿH‹øHCM ÿÁjvÿH‹ØH‹Ëè]Ó  HOH‹ÓÿÈjvÿHNH‹×ÿ»jvÿH„¢M ÿjvÿH‹øHDM ÿ~jvÿH‹ØH‹ËèÓ  HOH‹Óÿ…jvÿHNH‹×ÿxjvÿH¨M ÿKjvÿH‹øHùBM ÿ;jvÿH‹ØH‹Ëè×Ò  HOH‹ÓÿBjvÿHNH‹×ÿ5jvÿH–¥M ÿjvÿH‹øHDM ÿøivÿH‹ØH‹Ëè”Ò  HOH‹ÓÿÿivÿHN H‹×ÿòivÿH™M ÿÅivÿH‹øHÓBM ÿµivÿH‹ØH‹ËèQÒ  HOH‹Óÿ¼ivÿHN(H‹×ÿ¯ivÿH¡M ÿ‚ivÿH‹øHàCM ÿrivÿH‹ØH‹ËèÒ  HOH‹ÓÿyivÿHN0H‹×ÿlivÿHu M ÿ?ivÿH‹øHı@M ÿ/ivÿH‹ØH‹ËèËÑ  HOH‹Óÿ6ivÿHN8H‹×ÿ)ivÿHƒÄ [^_ÃÌÌÌÌÌÌÌÌD  H‹AÃÌÌÌÌÌÌD  H‹AÃÌÌÌÌÌÌD  H‹AÃÌÌÌÌÌÌD  H‹A ÃÌÌÌÌÌÌD  H‹A(ÃÌÌÌÌÌÌD  H‹A0ÃÌÌÌÌÌÌD  H‹A8ÃÌÌÌÌÌÌWVHƒì(H‹ñH‹úH‹NH‹IH‹×9	èá¼  H‹NH‹IH‹×9	èÎ¼  H‹NH‹IH‹×9	è»¼  H‹N H‹IH‹×9	è¨¼  H‹N0H‹IH‹×9	è•¼  H‹N8H‹IH‹×9	è‚¼  H‹N(H‹IH‹×H‹hv(ÿ9	HƒÄ(^_HÿàÌÌÌÌÌWVHƒì(H‹ñH‹úH‹NH‹IH‹×9	è½  H‹NH‹IH‹×9	èn½  H‹NH‹IH‹×9	è[½  H‹N H‹IH‹×9	èH½  H‹N0H‹IH‹×9	è5½  H‹N8H‹IH‹×9	è"½  H‹N(H‹IH‹×H‹Ğu(ÿ9	HƒÄ(^_HÿàÌÌÌÌÌHƒì(ÿ&-ÿH‹ÈH‹ H‹@@ÿHƒÄ(ÃÌÌÌHƒì(ÿ­--ÿ¶ÀHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ•--ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ-&-ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹ñHNÿÖfvÿH‹Îÿ(KÿH‹NH‹H‹@hÿP8HNH‹Ğÿ²fvÿHƒÄ ^ÃÌÌÌWVHƒì(H‹ñA‹øHNÿ’fvÿH‹ÎÿÑ'KÿH‹N‹×H‹H‹@pÿHNH‹ĞÿmfvÿHƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹úH‹ÏH‹H‹@HÿP0HNH‹Ğÿ2fvÿH‹Îÿq'KÿHNH‹×ÿfvÿHƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹ñH‹NH‹H‹@PÿP0ƒøtH‹NH‹H‹@`ÿP(ÆFHƒÄ ^ÃÌÌÌÌÌÌÌÌÌÌÌÌÌD  H‹IH‹H‹@HH‹@8HÿàÌÌÌÌÌÌÌÌÌD  H‹IH‹H‹@HH‹@HÿàÌÌÌÌÌÌÌÌÌD  H‹IH‹H‹@HH‹@(HÿàÌÌÌÌÌÌÌÌÌVHƒì H‹ñH‹Îº   H‹H‹@@ÿP(H‹ÎH‹,-ÿHƒÄ ^HÿàÌÌÌÌVHƒì H‹ñ„ÒtL€~ uFH‹NH‹H‹@pÿPH‹NH‹H‹@HÿP€~ t H‹NH‹H‹@PÿP0…ÀtH‹NH‹H‹@XÿP ÆFHƒÄ ^ÃÌÌHƒì(ÿı#-ÿH‹ÈH‹ H‹@@ÿHƒÄ(ÃÌÌÌHƒì(ÿ+-ÿ¶ÀHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ+-ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(ÿ#-ÿHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVSHƒì H‹ñH‹úH‹^HH…ÛuH‹×ëH‹ËH‹×H‹H‹@@ÿP8H‹ĞH‹ÂH…ÀtH‹+Ñ.ÿH9tÿxdvÿHNHH‹ĞL‹ÃÿP"-ÿH;ÃH‹Øu±HƒÄ [^_ÃÌÌÌÌÌÌÌÌWVSHƒì H‹ñH‹úH‹^HH‹ËH‹×ÿK#-ÿH‹ĞH‹ÂH…ÀtH‹ÉĞ.ÿH9tÿdvÿHNHH‹ĞL‹Ãÿî!-ÿH;ÃH‹Øu¿HƒÄ [^_ÃÌÌÌÌÌÌAWAVATWVUSHƒì H‹ñH‹úI‹ØH‹-*ŸÿH‹ÍºÍ  ÿTcvÿH‹`,  HNÿKcvÿH„ßÿÿcvÿL‹ğI‹Î3ÒE3Àÿ= -ÿHN I‹Öÿ cvÿHYßÿÿóbvÿL‹ğI‹Î3ÒE3Àÿ -ÿHN(I‹ÖÿõbvÿHV[O ÿÈbvÿL‹ğH‹Íº\  ÿÏbvÿH‹ˆ¨  H‹H‹@@ÿP8H‹ÈH‹H‹@HÿP(H‹ĞH—@ÿÿÙ@ÿL‹øH×üÿÿybvÿL‹àI‹Ì3ÒE3Àÿ˜-ÿINI‹Ôÿ{bvÿM…ÿu6H¯{O ÿIbvÿL‹øH‹÷Î.ÿÿ9bvÿL‹àI‹Ìÿ…&-ÿIOI‹Ôÿ@bvÿH¡XO ÿbvÿL‹àIL$I‹×ÿ"bvÿI‹ÔINÿbvÿHN0I‹ÖÿbvÿHNH‹×ÿûavÿH…Û…‡   H‹Íºw  ÿÜavÿH‹ØHƒ»8   uCH8ùH ÿªavÿH‹øHOH‹×ÿºavÿH»å}ÿH‰WH‹hˆ.ÿH‰W H‹8  H‹×ÿ”avÿHM)@ ÿgavÿH‹øH‹“8  H‹ÏA¸   ÿ#-ÿH‹ßHN@H‹Óÿ^avÿÆFvÆFwHƒÄ []^_A\A^A_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVUSHƒì(H‹ñH‹=æœÿH‹ÏºÍ  ÿavÿH‹`,  HNÿavÿH@İÿÿÚ`vÿH‹ØH‹Ë3ÒE3Àÿù-ÿHN H‹ÓÿÜ`vÿHİÿÿ¯`vÿH‹ØH‹Ë3ÒE3ÀÿÎ-ÿHN(H‹Óÿ±`vÿHYO ÿ„`vÿH‹ØH‹Ïº\  ÿ‹`vÿH‹ˆ¨  H‹H‹@@ÿP8H‹ÈH‹H‹@HÿP(H‹ĞHS	@ÿÿ•	@ÿH‹øH“úÿÿ5`vÿH‹èH‹Í3ÒE3ÀÿT-ÿHKH‹Õÿ7`vÿH…ÿu6HkyO ÿ`vÿH‹øH‹³Ì.ÿÿõ_vÿH‹èH‹ÍÿA$-ÿHOH‹Õÿü_vÿH]VO ÿÏ_vÿH‹èHMH‹×ÿß_vÿH‹ÕHKÿÒ_vÿHN0H‹ÓÿÅ_vÿHƒÄ([]^_ÃÌÌÌD  H‹AÃÌÌÌÌÌÌWVUSHƒì(H‹ñH‹ÎH‹H‹@PÿP8HéşN ÿc_vÿH‹øH‹ÎH‹H‹@@ÿP(HOH‹Ğÿf_vÿH‹ÎH‹H‹@xÿPH‹ØHw:M ÿ)_vÿH‹èH‹ÎH‹H‹@xÿP L‹È3Ò‰T$ H‹×L‹ÃH‹Íÿ‘=KÿH‹ÅHƒÄ([]^_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(Hƒy tH‹IH‹H‹@@ÿP ë3ÀH…ÀtH‹@ë3ÀHƒÄ(ÃWVUSHƒì(H‹ñÿFpHƒ~ …‡   HşN ÿ’^vÿH‹øH‹ÎH‹H‹@@ÿP(HOH‹Ğÿ•^vÿH‹ÎH‹H‹@xÿPH‹ØH¦9M ÿX^vÿH‹èH‹ÎH‹H‹@xÿP L‹ÈÇD$    H‹×L‹ÃH‹Íÿ¾<KÿHNH‹ÕÿA^vÿH‹Îÿx$KÿHƒÄ([]^_ÃÌÌÌÌÌÌVHƒì H‹ñ‹Np…É~)ÿÉ‰Np…Éu H‹NH…Ét9	è‡Û  3ÉH‰NH‹Îÿ0$KÿHƒÄ ^ÃÌD  3ÀÃÌÌÌÌÌÌÌÌD  3ÀÃÌÌÌÌÌÌÌÌAVWVUSHƒì H‹ñH‹úA‹ØHş1Q ÿˆ]vÿH‹è‰]H39M ÿu]vÿH‹ØH‹K™ÿº\  ÿx]vÿH‹ˆ¨  H‹H‹@@ÿP8H‹ÈH‹H‹@HÿP(HKH‹ĞÿU]vÿHNd> ÿ(]vÿL‹ğINH‹Õÿ8]vÿH‹ùƒ.ÿI‰NH‹ËH‹ÖM‹ÆL‹ÏH‹"l(ÿHƒÄ []^_A^HÿàÌÌÌÌÌWVUSHƒì(H‹ñ‹úA‹ØHÑ8M ÿË\vÿH‹èHáûN ÿ»\vÿL‹À‰\$ D¶ÏH‹ÍH‹ÖèœÜ  ¶ÀHƒÄ([]^_ÃWVUSHƒì8H‹ùH‹òH+9M ÿ}\vÿH‹ØH‹nH‹Oÿ<KÿL‹À3ÉH‰L$ H‹NH‰L$(3ÉH‰L$0H‹ËH‹ÕE3ÉÿkDKÿH‹ĞHéÇcÿÿS-ÿ„À”À¶ÀHƒÄ8[]^_ÃÌÌÌÌÌÌÌÌÌÌWVUSHƒì(H‹ñH‹ÎH‹H‹@xÿP H‹øHnúN ÿğ[vÿH‹ØH‹Îèœ   H‹èH‹ÎH‹H‹@xÿPH…ÀtHKH‹Ğÿâ[vÿHKH‹×ÿÕ[vÿHKH‹ÕÿÈ[vÿH‹ÎH‹H‹@PÿPHK H‹Ğÿ®[vÿH‹g—ÿºw  ÿ”[vÿH‹ğHƒ¾ 8   uCHHßE ÿb[vÿH‹øHOH‹×ÿr[vÿHÓŞ}ÿH‰WH‹0‚.ÿH‰W H 8  H‹×ÿL[vÿH‹– 8  H‹ËH‹H‹@@H‹@ HƒÄ([]^_HÿàÌÌÌÌWVSHƒì03ÀH‰D$(H‰D$ ÿ÷KÿH‹ÈHT$(LD$ E3ÉH‹ H‹@@ÿP H‹ğH…öu
3ÀHƒÄ0[^_ÃH¼±M ÿ¶ZvÿH‹øH‹\$ HOH‹ÖÿÁZvÿHOH‹Óÿ´ZvÿH‹ÇHƒÄ0[^_ÃÌWVSHƒì H‹ñH‹ÎH‹H‹@HÿPH…Àt7H‹şH‹Ê-ÿÿ\ZvÿH‹ØHKH‹×ÿlZvÿH‹=.ÿH‰KH‹ÓH‹ÎÿuKÿHƒÄ [^_ÃÌÌÌÌHƒì(3Òÿ#KÿH‹ÈH‹ H‹@HH‹@HƒÄ(HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌUAWAVAUATWVSHì¨   H¬$à   H‹ñ‹úH‹Îÿ¯ KÿH‹ÎH‹H‹@xÿP H‹ØH‹Îèn  L‹ğH‹FXHHH‹	ÿPL‹xPH‹ÎH‹H‹@`ÿP H‰EÀH‹Îè/%  L‹àL‹î¶EÀˆE¼‹UÄ‰U¸I‹ÍM‹E M‹€ˆ   AÿPH…Àu'D¶m¼‹E¸‰E´H‹«X.ÿ‹\.ÿÿŸYvÿH‹ H‰E˜ëMH‹W½.ÿº   ÿtYvÿH‰E I‹ÍI‹U H‹’ˆ   ÿRL‹ÀH‹M 3ÒÿXYvÿD¶m¼D‹E¸A‹ÀH‹M H‰M˜‰E´Hú5M ÿÜXvÿL‹ÃM‹ÎHM¨Dˆ)‹]´‰YL‰d$0H‹]˜H‰\$8H‹NH‰L$@‰|$H3ÉH‰L$PH‰EH‹ÈH‹ÖL‰|$ L‹U¨L‰T$(ÿ©RKÿH‹EHeÈ[^_A\A]A^A_]ÃÌÌÌÌÌÌÌÌÌÌÌÌHƒì(H‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP H‹ĞH‹ÊH…ÉtHB…L H9tH‹Èÿ´XvÿH‹ÈH‹H‹@hÿP H‹ÈH…Éu3ÀHƒÄ(ÃH‹H‹@HH‹@8HƒÄ(HÿàÌÌÌÌÌÌD  ¶AuÃÌÌÌÌÌÌD  ˆQuÃÌÌÌÌÌÌÌUWVHƒì0Hl$@H‰eàH‰MH‹M€yu tH‹ÂHHH‹	H‹@Heğ^_]HÿàH‹MÆAuH‹ÂHHH‹	ÿPH‹ÌèN   Heğ^_]ÃUWVHƒì0H‹i H‰l$ Hm@H‹òH‹•Ä.ÿÿWWvÿH‹øÿf FÿH‹ĞH‹ÏL‹Æÿ§+-ÿH‹Ïè&svÿÌUWVHƒì0H‹i H‰l$ Hm@H‹UÆBu HƒÄ0^_]ÃÌÌÌÌÌÌÌÌÌÌVHƒì H‹òH‹H‹@@ÿP H‹ÈH‹ H‹@HÿH‹ÈH‹ÖH‹õáIÿ9	HƒÄ ^HÿàÌÌÌÌÌÌÌÌÌÌÌVHƒì03ÀH‰D$(H‹òH‹H‹@@ÿP H‹ÈH‹ H‹@HÿH‹ÈLD$(H‹ÖH‹ H‹€€   ÿP„ÀtH‹D$(ƒx•À¶ÀHƒÄ0^Ã3ÀHƒÄ0^ÃÌÌUWVHƒì0Hl$@H‰eàH‰MH‹M€yw t'H‹MH‹I9	ÿÂTKÿH‹ğH‹ÖHÁcÿÿG-ÿ„ÀuIH‹M€yv tyH‹M€yw ”Á¶É¶É…Éuh3É‹ñƒÎH‹MH‹EH‹ H‹@@ÿP H‹È‹ÖH‹ H‹@hÿP8ëEH4M ÿÍUvÿH‹ø¹äÇ è£qvÿH‹Èè_}ÚÿH‹ĞH‹ÏL‹Æÿ0UKÿH‹Ïèqvÿ3Éë‘¹   ë“Heğ^_]ÃUWVHƒì0H‹i H‰l$ Hm@H‹MH‹EH‹ H‹@xÿH‹ÈèOqvÿÌÌÌÌÌÌÌÌWVUSHƒì(H‰T$XH‹ñH*Q ÿ;UvÿH‹øHOH‹ÖÿKUvÿHƒ|$X tH‹L$Xƒy0Á¶É…ÉtHL$Xÿ}!-ÿ€~w t'H‹N9	ÿ{SKÿH‹ØH‹ÓHFÀcÿÿ -ÿ„À…(/\ H‹Â.ÿÿËTvÿH‹ØH‹!½.ÿÿ»TvÿÇ@<  HKH‹ĞÿÇTvÿHOH‹ÓÿºTvÿ€~v t€~w ”Á¶Éë3É¶É…Éu3Éë¹   ‹ÙƒËH‹²Á.ÿÿdTvÿH‹èH‹ÎH‹H‹@@ÿP H‹È‹ÓL‹D$XH‹ H‹@pÿPH‹ğHMH‹×ÿPTvÿH‹){.ÿH‰MH‹ÎH‹ÕA¸   9	ÿ(-ÿH‹GH‹@HƒÄ([]^_ÃÌÌÌÌÌÌÌÌVHƒì H‹ñÿb(-ÿH‹ÎH‹H‹@PÿP8H‹ÎH‹H‹@XH‹@HƒÄ ^HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌUAVWVSHƒì@Hl$`H‰eĞH‰MH‹5zÿH‹Îº\  ÿ¤SvÿH‹ˆ¨  H‹H‹@@ÿP8H‹ÈH‹H‹@HÿP(H‹øH¼>6 ÿSvÿH‹ØH‹·.ÿº   ÿ™SvÿL‹ğH‹MH‹I‹ÿ†-ÿL‹ÀI‹Î3Òÿ€SvÿH‹ËI‹ÖH‹H‹€È   ÿP H‹ĞH‹ÏÿadGÿH‹øH…ÿu*H‹MH‹EH‹ H‹@XÿPH‹øH…ÿuH¸N ÿÚRvÿH‹øH‹Îºw  ÿáRvÿH‹°8  H‹{¶.ÿº   ÿ SvÿH‹ØH‹MH‹I‹ÿí-ÿL‹ÀH‹Ë3ÒÿçRvÿH‹ÎH‹ÓH‹H‹€ˆ   ÿP(H‹ğH‹Â¶.ÿº   ÿ·RvÿH‹ØH‹ËL‹Ç3Òÿ®RvÿH‰\$ 3ÉH‰L$(H‹ÎH‹UE3ÀE3ÉH‹H‹@XÿP H‹ĞH‹òH…ötH‹‰-ÿH9t	ÿRvÿH‹ğH‹U¶Rv‰UÜH‹U¶Rw‰UØH‹UH‹RH¶™M ÿ€RvÿH…ÀuH‹MH‹EH‹ H‹@@ÿP8H‹MH‹ÖÿKÿH‹Ìè   Heà[^_A^]ÃUAVWVSHƒì@H‹i0H‰l$0Hm`H‹UH‹RHQ™M ÿRvÿH…ÀuH‹MH‹EH‹ H‹@HÿH‹E‹UÜˆPvH‹E‹UØˆPwHƒÄ@[^_A^]ÃÌÌÌÌÌÌWVSHƒì0H‰T$(H‹ñI‹øH‹JH‹IH…ÉuH‹ÊHlT ÿQvÿH‹ÈÿQvÿH‹ØHKH‹×ÿ QvÿHKH‹ÖÿQvÿH‹T-ÿÿæPvÿH‹ğHNH‹ÓÿöPvÿH‹×w.ÿH‰FH‹ÆHƒÄ0[^_ÃÌÌÌÌÌÌÌÌD  ¶AvÃÌÌÌÌÌÌD  ˆQvÃÌÌÌÌÌÌÌD  ¶AwÃÌÌÌÌÌÌD  ˆQwÃÌÌÌÌÌÌÌWVHƒì83ÀH‰D$0H‹ñH‹ÎH‹H‹@xÿP8H‹ÈH‹ H‹@@ÿP(H‹øH‹N‹ÿ-ÿH‹ĞH‹ÏH‹H‹@@ÿP H‰D$0€|$0 t7€|$0 u¹&   ÿ‰-ÿ‹L$4º   HD$(ˆ‰HH‹ÎH‹T$(H‹H‹@`ÿP(HƒÄ8^_ÃÌÌÌÌÌÌÌÌÌÌÌÌHƒì(3ÒH‹H‹@`ÿP8HƒÄ(ÃÌÌÌÌÌÌÌÌÌVHƒì H‹ñH‹Îº   H‹H‹@`ÿP8H‹ÎH‹„-ÿHƒÄ ^HÿàÌÌÌÌWVHƒì(H‹ñ€~x uW„Òt,H‹~HH…ÿt#H‹­-ÿÿ_OvÿL‹ÀHOH‹	H‹ÖÿW3ÉH‰NHH‹NH…Ét9	èàÌ  H‹Î3ÒH‹H‹€ˆ   ÿP(ÆFxHƒÄ(^_ÃÌÌÌD  ¶AxÃÌÌÌÌÌÌD  ˆQxÃÌÌÌÌÌÌÌHƒì(€yv u„ÒtH‹H‹@@ÿP H‹ÈH‹ H‹@pÿP HƒÄ(ÃÌÌÌÌAWAVWVUSHƒì83ÀH‰D$(H‰T$0H‹ñH‹úH‹_H‹+H‹ÍD‹ñAƒæE…ötH‹IÿÿºNvÿL‹øH‹ÍE…ötH‹Iÿÿ¥NvÿH‹ÈÿÄNKÿH‹ĞI‹Ïÿğ-ÿ„À…ä(\ H‹n H‹öÁtH‹IÿÿrNvÿH‹ĞLD$(H‹Í9	ÿÇ-ÿ„À…   H‹n(H‹öÁtH‹IÿÿANvÿH‹ĞLD$(H‹Í9	ÿ–-ÿ„Àu4H‹KH…ÉuH‹ÏHéhT ÿINvÿH‹ÈÿØMvÿH‹èHMH‹ÖÿèMvÿëH‹L$(L"İ-ÿ9	ÿİ-ÿH‹èH‹KH…ÉuH‹ÏHhT ÿşMvÿH‹ÈL‹õM…ötI9tH‹ÕÿNvÿL‹ğH‹KH…ÉuH‹ÏHyhT ÿÉMvÿH‹ÈÿXMvÿH‹èHMI‹ÖÿhMvÿHMI‹Öÿ[MvÿH‰l$(H‹v H‹öÁtH‹IÿÿPMvÿH‹ĞL‹D$(‹H‹ÎA¹   ÿG
-ÿH‹t$(H‹KH…ÉuH‹ÏHhT ÿQMvÿH‹ÈH‹Öÿ½MvÿHƒÄ8[]^_A^A_ÃÌÌÌÌÌÌÌWVHƒì(3ÀH‰D$ H‹ùH‹òH‹ÎÿMKÿH‹ğH‹O(LD$ H‹Ö9	ÿ-
-ÿ„ÀubH‹ÏH‹ÖH‹I LD$ 9	ÿ
-ÿ„ÀuE3ÀëH‹L$ LÕÛ-ÿ9	ÿÍÛ-ÿL‹ÀH‹ÏH‹ÖÿÖKÿH‰D$ H‹O(L‹D$ ‹H‹ÖA¹   ÿo	-ÿH‹D$ HƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌAWAVWVUSHƒì(3ÀH‰D$ H‹ùH‹òI‹ØH‹-Õ‡ÿH‹Íºw  ÿÿKvÿL‹ğI‹8  LD$ H‹Ö9	ÿ=-ÿ„À…%  H‹Íº   ÿßKvÿH‹Îÿ	-ÿH‹ÈH‹ H‹€À   ÿP„À…Z&\ H‡İ6 ÿ¹KvÿH‹èH‹?¯.ÿº   ÿÄKvÿL‹øI‹ÏL‹Æ3Òÿ»KvÿH‹ÍI‹×H‹E H‹€È   ÿP H‹èH‹¯.ÿº   ÿŠKvÿL‹øHM ÿZKvÿL‹ÀI‹Ï3ÒÿtKvÿHõÚ6 ÿ?KvÿL‹ÀI‹Ïº   ÿVKvÿH‹G¬/ÿH‹H‹ÍM‹Çÿ¿EÿH‹èHù6 ÿKvÿH‹ÈH‹ÕÿL-ÿH‹ĞHúø6 ÿ,KvÿH‰D$ I‹8  H‹ÖL‹D$ 9	ÿ-ÿH‹D$ HHH‹	H‹×L‹ÃÿPHƒÄ([]^_A^A_ÃÌÌÌÌÌWVHƒì(H‹ñH‹úH‹ÎèköÿÿH‹ÎH‹×èO  H‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹IH‹×L£Ù-ÿ9	ÿ›Ù-ÿHƒÄ(^_ÃÌÌÌWVHƒì(H‹ñH‹úH‹ÎèöÿÿH‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹×9	è2aÜÿ„Àu	3ÀHƒÄ(^_ÃH‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹IH‹×L!Ù-ÿ9	ÿÙ-ÿHƒÄ(^_ÃÌÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹úH‹Îè{õÿÿH‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹×9	è¢`Üÿ¶ÀHƒÄ(^_ÃÌÌÌÌÌÌÌÌAVWVUSHƒì0H‰T$(H‹òH‹H‹@@ÿP H‹ÈH‹ H‹@HÿH‹Èº   H‹ H‹@pÿPH‹øH‹^H‹kH…íuH‹ÎHdT ÿFIvÿH‹èHt== ÿÎHvÿL‹ğI‹ÎL‹Å3Òÿ­
-ÿM‹ÆH‹×HĞrdÿÿú-ÿH‹øH‹kH…íuH‹ÎHàcT ÿöHvÿH‹èH‹KH…ÉuH‹ÎHØcT ÿÚHvÿH‹ÈÿiHvÿL‹ğI‹ÎL‹Å3Òÿø-ÿH‹K H…ÉuH‹ÎH³cT ÿ§HvÿH‹ÈH‹×M‹ÆH‹-ÿHƒÄ0[]^_A^HÿàÌÌÌÌÌÌÌÌÌÌAWAVWVUSHƒì(H‰T$ L‰L$xH‹ñH‹úI‹ØH‹¬$€   L‹wI‹NH…ÉuH‹ÏH_cT ÿ<HvÿH‹ÈÿËGvÿL‹øIOH‹ÓÿÛGvÿH¿T$xfA‰W IOH‹ÕÿÃGvÿIOH‹Öÿ¶GvÿH‹ÎH‹H‹@@ÿP H‹Hx9	èÕ1÷ÿI‹NH…ÉuH‹ÏH´T ÿÌGvÿH‹Èÿ[GvÿH‹ğHNI‹×ÿkGvÿH‹Tn.ÿH‰NI‹NH…ÉuH‹ÏH½bT ÿGvÿH‹ÈÿGvÿH‹øHOH‹Öÿ.GvÿH‹ÇHƒÄ([]^_A^A_ÃÌÌÌÌÌÌAWAVWVUSHƒì(H‰T$ L‰L$xH‹ñH‹úI‹ØH‹¬$€   L‹wI‹NH…ÉuH‹ÏHUbT ÿGvÿH‹Èÿ«FvÿL‹øIOH‹Óÿ»FvÿH¿T$xfA‰W IOH‹Õÿ£FvÿIOH‹Öÿ–FvÿH‹ÎH‹H‹@@ÿP H‹Hx9	èµ0÷ÿI‹NH…ÉuH‹ÏHğaT ÿ¬FvÿH‹Èÿ;FvÿH‹ğHNI‹×ÿKFvÿH‹<m.ÿH‰NI‹NH…ÉuH‹ÏHËaT ÿoFvÿH‹ÈÿşEvÿH‹øHOH‹ÖÿFvÿH‹ÇHƒÄ([]^_A^A_ÃÌÌÌÌÌÌAWAVWVUSHƒì83ÀH‰D$0L‰Œ$ˆ   H‹ùH‹òI‹ØH‹ÿºw  ÿºEvÿH‹èH‹ø7  LD$0H‹Ö9	ÿø-ÿ„À……   L‹µè7  H‹2©.ÿº   ÿ·EvÿL‹øI‹ÏL‹Æ3Òÿ®EvÿI‹ÎI‹×I‹H‹€ˆ   ÿP(L‹ğH¹BA ÿcEvÿH‹ÈI‹Öÿ§-ÿH‹ĞHBA ÿ‡EvÿH‰D$0H‹ø7  H‹ÖL‹D$09	ÿs-ÿH‹´$   H‰t$ H‹D$0HHH‹	H‹×L‹ÃL¿Œ$ˆ   ÿPHƒÄ8[]^_A^A_ÃÌÌÌÌÌÌÌÌÌÌWVHƒì(H‰T$ L‰L$XH‹ñI‹øH‹JL‹AM…ÀuH‹ÊHT`T ÿíDvÿL‹ÀH‹ÎH`M ÿEvÿH‹ÎH‹×L¿D$XL‹L$`HƒÄ(^_HÿàAWAVWVUSHƒì83ÀH‰D$0L‰Œ$ˆ   H‹ùH‹òI‹ØH‹€ÿºw  ÿ:DvÿH‹èH‹ 8  LD$0H‹Ö9	ÿx-ÿ„À……   L‹µğ7  H‹²§.ÿº   ÿ7DvÿL‹øI‹ÏL‹Æ3Òÿ.DvÿI‹ÎI‹×I‹H‹€ˆ   ÿP(L‹ğH9@ ÿãCvÿH‹ÈI‹Öÿ'-ÿH‹ĞH@ ÿDvÿH‰D$0H‹ 8  H‹ÖL‹D$09	ÿó-ÿH‹´$   H‰t$ H‹D$0HHH‹	H‹×L‹ÃL¿Œ$ˆ   ÿPHƒÄ8[]^_A^A_ÃÌÌÌÌÌÌÌÌÌÌWVHƒì(H‰T$ L‰L$XH‹ñI‹øH‹JL‹AM…ÀuH‹ÊHè^T ÿmCvÿL‹ÀH‹ÎHàM ÿ‚CvÿH‹ÎH‹×L¿D$XL‹L$`HƒÄ(^_HÿàWVUSHƒì(H‹ñ‹êI‹øI‹ÙH‹ÎèÄîÿÿH‹ÎH‹H‹@@ÿP H‹È‹ÕL‹ÇL‹ËH‹ H‹@xH‹@ HƒÄ([]^_HÿàÌÌÌÌÌÌWVUSHƒì(H‹ñ‹ÚI‹øI‹éH‹ÎètîÿÿH‹ÎH‹H‹@@ÿP H‹t$pH‰t$ H‹È‹ÓL‹ÇL‹ÍH‹ H‹@xÿP0HƒÄ([]^_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVHƒì(3ÀH‰D$ H‹ñH‹úH‹Î3ÒH‹H‹@hÿH‹ÎH‹H‹@@ÿP H‹ÈH‹ H‹@HÿH‹ÈLD$ H‹×H‹ H‹€€   ÿP„Àu	3ÀHƒÄ(^_ÃHZ.O ÿ¼AvÿH‹ğH‹T$ HNÿÊAvÿH‹ÆHƒÄ(^_ÃÌÌÌÌÌÌÌÌWVSHƒì H‹ñH‹g}ÿºw  ÿ”AvÿH‹øHƒ¿(8   uCH6= ÿbAvÿH‹ØHKH‹ÓÿrAvÿHÓÄ}ÿH‰SH‹`h.ÿH‰S H(8  H‹ÓÿLAvÿH‹—(8  H‹ÎH‹ËKÿHƒÄ [^_HÿàÌÌÌÌÌÌÌÌÌWVSHƒì0H‰T$(H‹ñH‹JH‹yH…ÿuH‹ÊHÓ\T ÿDAvÿH‹øHr5= ÿÌ@vÿH‹ØH‹ËL‹Ç3Òÿ«-ÿH‹ÎH‹ÓH‹^KÿHƒÄ0[^_HÿàÌÌÌÌÌÌÌÌÌÌÌÌWVSHƒì H‹ñH‹úH‹Î3ÒH‹H‹@hÿH‹ÎH‹H‹@@ÿP H‹ÈH‹ H‹@HÿH‹ÈºşÿÿÿH‹ H‹@pÿPH‹ĞL‹ÇHejdÿÿı,ÿH‹ğH‹|ÿºw  ÿB@vÿH‹øHƒ¿08   uCH®O; ÿ@vÿH‹ØHKH‹Óÿ @vÿHÃ}ÿH‰SH‹g.ÿH‰S H08  H‹Óÿú?vÿL‹‡08  H‹ÖHáQdÿH‹¢ı,ÿHƒÄ [^_HÿàAVWVUSHƒì H‹ùH‹òHƒ¾˜    „	  H‹˜   H‹l{ÿºw  ÿ™?vÿH‹èHƒ½88   uCH4= ÿg?vÿL‹ğINI‹Öÿw?vÿHØÂ}ÿI‰VH‹uf.ÿI‰V H88  I‹ÖÿQ?vÿL‹…88  H‹ÓHP­cÿÿâü,ÿ„À„   HM ÿ?vÿH‹ØH‹a/ÿH‹	èšfÚÿH‹èH‹Ëÿı,ÿHK H‹Õÿù>vÿHK0H‹Öÿì>vÿÇƒŒ   €H‹˜   H‹×ÿÒ>vÿH‹    ÆH‹Ëÿç?KÿH‹ÃHƒÄ []^_A^ÃH‹ŞH—›N H9t3ÛH…Û…~   HxM ÿj>vÿH‹ØH‹ÎH‹H‹@@ÿP H‹èH‹Ëÿvü,ÿHK H‹Õÿa>vÿHK0H‹ÖÿT>vÿÇƒŒ   €H‹˜   H‹×ÿ:>vÿH‹    Æ H‹ËÿO?KÿH‹ÃHƒÄ []^_A^ÃHªO ÿì=vÿH‹ğH‹ËH‹H‹@@ÿP H‹èH‹Îÿøû,ÿHN H‹Õÿã=vÿHN0H‹ÓÿÖ=vÿÇ†Œ   €H˜   H‹×ÿ¼=vÿH    Æ H‹ÎÿÑ>KÿH‹ÆHƒÄ []^_A^ÃÌÌÌWVHƒì(H‰T$ H‹òH‹H‹@@ÿP H‹øH‹NL‹AM…ÀuH‹ÎHKYT ÿ¨=vÿL‹ÀH‹ÏH{[L ÿ½=vÿH‹ÏHƒÄ(^_HÿàÌÌÌÌÌÌÌÌÌAVWVUSHƒì03ÀH‰D$(H‹ùH‹òH‹Úxÿºw  ÿ=vÿH‹ØH‹‹à7  LD$(H‹Ö9	ÿE-ÿ„À…†   H‹«Ø7  H‹ .ÿº   ÿ=vÿL‹ğI‹ÎL‹Æ3Òÿû<vÿH‹ÍI‹ÖH‹E H‹€ˆ   ÿP(H‹èH"F ÿ¯<vÿH‹ÈH‹Õÿó-ÿH‹ĞH"F ÿÓ<vÿH‰D$(H‹‹à7  H‹ÖL‹D$(9	ÿ¿-ÿH‹D$(HHH‹	H‹×ÿPHƒÄ0[]^_A^ÃÌVHƒì0H‰T$(H‹ñH‹JL‹AM…ÀuH‹ÊHXT ÿf<vÿL‹ÀH‹ÎHÙM ÿ{<vÿH‹ÎÿĞHƒÄ0^ÃÌÌÌÌÌÌÌVHƒì €yx …Í\ H‹AHƒÄ ^ÃÌÌÌÌÌÌÌVHƒì €yx …å\ HIÿ¿;vÿHƒÄ ^ÃD  3ÀÃÌÌÌÌÌÌÌÌD  ÃÌÌÌÌÌÌÌÌÌÌD  3ÀÃÌÌÌÌÌÌÌÌHƒì(H‹H‹@xÿPH‹ÈH‹ÿ<GÿHƒÄ(HÿàWVHƒì(H‹ñH‹F8H…Àu)H‹ÎH‹H‹@xÿPH‹ÈÿÀGÿH‹øHN8H‹×ÿ0;vÿH‹ÇHƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌD  3ÀÃÌÌÌÌÌÌÌÌD  ÃÌÌÌÌÌÌÌÌÌÌD  ¶AyÃÌÌÌÌÌÌD  ˆQyÃÌÌÌÌÌÌÌHƒì(H4O ÿ¦:vÿHƒÄ(ÃÌÌÌÌÌÌÌÌVHƒì €yx …ı\ HƒÄ ^ÃÌÌÌÌÌÌÌÌÌÌÌUWVSHƒì8Hl$PH‰eĞH‹ñH‹~ Hƒ( u*H2vÿÿL:vÿH‹ØHKH‹×ÿ\:vÿHO(H‹ÓÿO:vÿH‹(H‹v(Hƒ~( u*Hùuÿÿ:vÿH‹ØHKH‹Öÿ#:vÿHN(H‹Óÿ:vÿL‹F(H‹×HPdÿÿb÷,ÿH‹ÈL`É-ÿ9	ÿXÉ-ÿH‰EàH‹MàLQÉ-ÿ9	ÿIÉ-ÿ„ÀtNH‹MàLBÉ-ÿ9	ÿ:É-ÿH‹ÈL8É-ÿ9	ÿ0É-ÿH‹ÈL.É-ÿ9	ÿ&É-ÿH‹MàLÉ-ÿ9	ÿûÈ-ÿ„Àu²H‹Ìè
   Heè[^_]ÃUWVSHƒì(H‹i H‰l$ HmPHƒ}à tH‹MàLŞÈ-ÿ9	ÿÖÈ-ÿHƒÄ([^_]ÃÌÌÌÌUWVSHƒì8Hl$PH‰eĞH‹ñ€~t …  ÆFtH‹ÎèõäÿÿH‹~ Hƒ( u*H»tÿÿÕ8vÿH‹ØHKH‹×ÿå8vÿHO(H‹ÓÿØ8vÿH‹(H‹v(Hƒ~( u*H‚tÿÿœ8vÿH‹ØHKH‹Öÿ¬8vÿHN(H‹ÓÿŸ8vÿL‹F(H‹×HÙÿcÿÿëõ,ÿH‹ÈLÈ-ÿ9	ÿÈ-ÿH‰EàH‹MàL
È-ÿ9	ÿÈ-ÿ„ÀtNH‹MàLûÇ-ÿ9	ÿóÇ-ÿH‹ÈLñÇ-ÿ9	ÿéÇ-ÿH‹ÈLçÇ-ÿ9	ÿßÇ-ÿH‹MàL¼Ç-ÿ9	ÿ´Ç-ÿ„Àu²H‹Ìè
   Heè[^_]ÃUWVSHƒì(H‹i H‰l$ HmPHƒ}à tH‹MàL—Ç-ÿ9	ÿÇ-ÿHƒÄ([^_]ÃÌÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹òH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹ÖH‹Gÿ9	HƒÄ ^HÿàÌÌÌÌÌÌÌÌÌVHƒì H‹òH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹IH‹ÖLÇ-ÿH‹Ç-ÿ9	HƒÄ ^HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹úH‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹H8H‹×9	è+NÜÿ„À„w\ HƒÄ(^_ÃÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹ñH‹‰rÿº   ÿÆ6vÿH‹Îÿíó,ÿH‹ÈH‹ H‹@`ÿPH‹ĞH:_ÿÿøø,ÿH‹ĞHŞ¬cÿÿˆô,ÿ„Àt4H‹ÖH2:_ÿA¸   ÿ¦õ,ÿH‹ĞHT­cÿÿ^ô,ÿ„À”À¶ÀHƒÄ ^Ã3ÀHƒÄ ^ÃWVSHƒì H‹ñH‹úH”Q ÿ6vÿH‹ØHKH‹×ÿ6vÿH‹ÎH‹H‹@@ÿP(H‹ÈH‹ H‹@@ÿP8H‹ğH‹Î3ÒH‹H‹@@ÿP8H‹ĞH‹ÂH…ÀtH°K H9tÿ=6vÿHKH‹ĞÿÈ5vÿH‹ÎHöK Lß=?ÿÿ!6vÿH‹Î3ÒÿĞH‹ğH A@ ÿz5vÿH‹øHOH‹ÓÿŠ5vÿL‹›\.ÿL‰GL‹ÇH‹ÖHª—cÿH‹ó,ÿHƒÄ [^_HÿàÌÌÌÌÌÌÌÌÌVH‹ñHƒ~` t^ÃÆFyHN`ÿ<5vÿH‹N`H‹VH‹9Kÿ9	^HÿàÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌD  H‹A0ÃÌÌÌÌÌÌD  3ÀÃÌÌÌÌÌÌÌÌHƒì(H‹AhH…ÀuH‹H‹€ˆ   ÿPHƒÄ(ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌD  HIhÿ¹4vÿÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌÌVHƒì H‹ñH‹ÎÿWûJÿH‹FXHHH‹	H‹@HƒÄ ^HÿàÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹Îÿ&ûJÿH‹FXHHH‹	ÿPH‹øH‹ÎH‹H‹€€   ÿP H‹ĞH‹ÏH‹ˆ:Kÿ9	HƒÄ(^_HÿàÌÌÌÌÌVHƒì H‹ñH‹Îÿ×úJÿHÆ€   €> u¹&   ÿXó,ÿ¶FHƒÄ ^ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌAVWVUSHƒì@H‹ñH¾€   H‹Ï€9 …G  H
Q ÿ›3vÿH‹ØHKH‹Öÿ«3vÿH‹N‹ÿÏò,ÿH‹èHKH‹Õÿ3vÿHˆ)M ÿb3vÿL‹ğH‹ÍH‹E H‹@`ÿPINH‹Ğÿd3vÿHM ÿ73vÿH‹èHMI‹ÖÿG3vÿ3ÒH‰T$ H‰T$(H‰T$0H‹SH‹ÍE3ÀE3ÉÿƒE(ÿHKH‹Ğÿ3vÿHƒ{ tJHPêJ ÿâ2vÿH‹èHMH‹Óÿò2vÿH‹Z.ÿH‰UH‹ÕHNXÿÚ2vÿ¹   ˆˆOHƒÄ@[]^_A^ÃHêJ ÿ˜2vÿH‹èHMH‹Óÿ¨2vÿH‹ÉY.ÿH‰UH‹ÕHNXÿ2vÿ3Àº   H‹ÏˆˆAHƒÄ@[]^_A^ÃÌÌÌÌÌÌÌÌÌÌÌÌÌÌHƒì(H‹I‹ÿ‡ñ,ÿH‹ÈH‹ H‹@@H‹ HƒÄ(HÿàÌÌÌÌÌÌÌÌÌÌÌD  H‹QPH…Òu3ÀÃH‹BÃÌÌÌÌÌÌÌÌÌÌWVHƒì(H‹ñH‹úHƒ~P tH‹NPH‹IH‹×ÿ$ø,ÿ„À„ª   Hƒ~P t#H‹N@9	ÿô,ÿH‹ÈH‹VPH‹ H‹@HÿP 3ÉH‰NPH…ÿt{H‹vmÿº\  ÿ£