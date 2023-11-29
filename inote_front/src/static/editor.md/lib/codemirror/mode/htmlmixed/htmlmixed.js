// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../javascript/javascript"), require("../css/css"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../javascript/javascript", "../css/css"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("htmlmixed", function(config, parserConfig) {
  var htmlMode = CodeMirror.getMode(config, {name: "xml",
                                             htmlMode: true,
                                             multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
                                             multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag});
  var cssMode = CodeMirror.getMode(config, "css");

  var scriptTypes = [], scriptTypesConf = parserConfig && parserConfig.scriptTypes;
  scriptTypes.push({matches: /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^$/i,
                    mode: CodeMirror.getMode(config, "javascript")});
  if (scriptTypesConf) for (var i = 0; i < scriptTypesConf.length; ++i) {
    var conf = scriptTypesConf[i];
    scriptTypes.push({matches: conf.matches, mode: conf.mode && CodeMirror.getMode(config, conf.mode)});
  }
  scriptTypes.push({matches: /./,
                    mode: CodeMirror.getMode(config, "text/plain")});

  function html(stream, state) {
    var tagName = state.htmlState.tagName;
    if (tagName) tagName = tagName.toLowerCase();
    var style = htmlMode.token(stream, state.htmlState);
    if (tagName == "script" && /\btag\b/.test(style) && stream.current() == ">") {
      // Script block: mode to change to depends on type attribute
      var scriptType = stream.string.slice(Math.max(0, stream.pos - 100), stream.pos).match(/\btype\s*=\s*("[^"]+"|'[^']+'|\S+)[^<]*$/i);
      scriptType = scriptType ? scriptType[1] : "";
      if (scriptType && /[\"\']/.test(scriptType.charAt(0))) scriptType = scriptType.slice(1, scriptType.length - 1);
      for (var i = 0; i < scriptTypes.length; ++i) {
        var tp = scriptTypes[i];
        if (typeof tp.matches == "string" ? scriptType == tp.matches : tp.matches.test(scriptType)) {
          if (tp.mode) {
            state.token = script;
            state.localMode = tp.mode;
            state.localState = tp.mode.startState && tp.mode.startState(htmlMode.indent(state.htmlState, ""));
          }
          break;
        }
      }
    } else if (tagName == "style" && /\btag\b/.test(style) && stream.current() == ">") {
      state.token = css;
      state.localMode = cssMode;
      state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
    }
    return style;
  }
  function maybeBackup(stream, pat, style) {
    var cur = stream.current();
    var close = cur.search(pat), m;
    if (close > -1) stream.backUp(cur.length - close);
    else if (m = cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur);
    }
    return style;
  }
  function script(stream, state) {
    if (stream.match(/^<\/\s*script\s*>/i, false)) {
      state.token = html;
      state.localState = state.localMode = null;
      return null;
    }
    return maybeBackup(stream, /<\/\s*script\s*>/,
                       state.localMode.token(stream, state.localState));
  }
  function css(stream, state) {
    if (stream.match(/^<\/\s*style\s*>/i, false)) {
      state.token = html;
      state.localState = state.localMode = null;
      return null;
    }
    return maybeBackup(stream, /<\/\s*style\s*>/,
                       cssMode.token(stream, state.localState));
  }

  return {
    startState: function() {
      var state = htmlMode.startState();
      return {token: html, localMode: null, localState: null, htmlState: state};
    },

    copyState: fuØÁ/Â/Å€MÂ/WÂ/MXÂ/—Â/IM˜Â/×Â/MØÂ/Ã/	‚MÃ/WÃ/E‚MXÃ/—Ã/‚M˜Ã/×Ã/Õ‚MØÃ/Ä/ƒMÄ/WÄ/YƒMXÄ/—Ä/•ƒM˜Ä/×Ä/éƒMØÄ/Å/=„MÅ/WÅ/„MXÅ/—Å/å„M˜Å/×Å/-…MØÅ/Æ/i…MÆ/WÆ/…MXÆ/—Æ/É…M˜Æ/×Æ/†MØÆ/Ç/Y†MÇ/WÇ/‰†MXÇ/—Ç/¹†M˜Ç/×Ç/U‡MØÇ/È/‡MÈ/WÈ/ı‡MXÈ/—È/-ˆM˜È/×È/]ˆMØÈ/É/½ˆMÉ/WÉ/íˆMXÉ/—É/A‰M˜É/×É/•‰MØÉ/Ê/é‰MÊ/WÊ/=ŠMXÊ/—Ê/yŠM˜Ê/×Ê/ÁŠMØÊ/Ë/!‹MË/WË/i‹MXË/—Ë/¥‹M˜Ë/×Ë/Õ‹MØË/Ì/ù‹MÌ/WÌ/¡ŒMXÌ/—Ì/M˜Ì/×Ì/IMØÌ/Í/MÍ/WÍ/ıMXÍ/—Í/EM˜Í/×Í/™MØÍ/Î/íMÎ/WÎ/AMXÎ/—Î/¡M˜Î/×Î/õMØÎ/Ï/IMÏ/WÏ/MXÏ/—Ï/ñM˜Ï/×Ï/E‘MØÏ/Ğ/™‘MĞ/WĞ/í‘MXĞ/—Ğ/A’M˜Ğ/×Ğ/•’MØĞ/Ñ/é’MÑ/WÑ/=“MXÑ/—Ñ/y“M˜Ñ/×Ñ/Á“MØÑ/Ò/!”MÒ/WÒ/u”MXÒ/—Ò/É”M˜Ò/×Ò/•MØÒ/Ó/5•MÓ/WÓ/}•MXÓ/—Ó/Ñ•M˜Ó/×Ó/%–MØÓ/Ô/a–MÔ/WÔ/©–MXÔ/—Ô/	—M˜Ô/×Ô/]—M