// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Slim Highlighting for CodeMirror copyright (c) HicknHack Software Gmbh

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../htmlmixed/htmlmixed"), require("../ruby/ruby"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../htmlmixed/htmlmixed", "../ruby/ruby"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

  CodeMirror.defineMode("slim", function(config) {
    var htmlMode = CodeMirror.getMode(config, {name: "htmlmixed"});
    var rubyMode = CodeMirror.getMode(config, "ruby");
    var modes = { html: htmlMode, ruby: rubyMode };
    var embedded = {
      ruby: "ruby",
      javascript: "javascript",
      css: "text/css",
      sass: "text/x-sass",
      scss: "text/x-scss",
      less: "text/x-less",
      styl: "text/x-styl", // no highlighting so far
      coffee: "coffeescript",
      asciidoc: "text/x-asciidoc",
      markdown: "text/x-markdown",
      textile: "text/x-textile", // no highlighting so far
      creole: "text/x-creole", // no highlighting so far
      wiki: "text/x-wiki", // no highlighting so far
      mediawiki: "text/x-mediawiki", // no highlighting so far
      rdoc: "text/x-rdoc", // no highlighting so far
      builder: "text/x-builder", // no highlighting so far
      nokogiri: "text/x-nokogiri", // no highlighting so far
      erb: "application/x-erb"
    };
    var embeddedRegexp = function(map){
      var arr = [];
      for(var key in map) arr.push(key);
      return new RegExp("^("+arr.join('|')+"):");
    }(embedded);

    var styleMap = {
      "commentLine": "comment",
      "slimSwitch": "operator special",
      "slimTag": "tag",
      "slimId": "attribute def",
      "slimClass": "attribute qualifier",
      "slimAttribute": "attribute",
      "slimSubmode": "keyword special",
      "closeAttributeTag": null,
      "slimDoctype": null,
      "lineContinuation": null
    };
    var closing = {
      "{": "}",
      "[": "]",
      "(": ")"
    };

    var nameStartChar = "_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD";
    var nameChar = nameStartChar + "\\-0-9\xB7\u0300-\u036F\u203F-\u2040";
    var nameRegexp = new RegExp("^[:"+nameStartChar+"](?::["+nameChar+"]|["+nameChar+"]*)");
    var attributeNameRegexp = new RegExp("^[:"+nameStartChar+"][:\\."+nameChar+"]*(?=\\s*=)");
    var wrappedAttributeNameRegexp = new RegExp("^[:"+nameStartChar+"][:\\."+nameChar+"]*");
    var classNameRegexp = /^\.-?[_a-zA-Z]+[\w\-]*/;
    var classIdRegexp = /^#[_a-zA-Z]+[\w\-]*/;

    function backup(pos, tokenize, style) {
      var restore = function(stream, state) {
        state.tokenize = tokenize;
        if (stream.pos < pos) {
          stream.pos = pos;
          return style;
        }
        return state.tokenize(stream, state);
      };
      return function(stream, state) {
        state.tokenize = restore;
        return tokenize(stream, state);
      };
    }

    function maybeBackup(stream, state, pat, offset, style) {
      var cur = stream.current();
      var idx = cur.search(pat);
      if (idx > -1) {
        state.tokenize = backup(stream.pos, state.tokenize, style);
        stream.backUp(cur.length - idx - offset);
      }
      return style;
    }

    function continueLine(state, column) {
      state.stack = {
        parent: state.stack,
        style: "continuation",
        indented: column,
        tokenize: state.line
      };
      state.line = state.tokenize;
    }
    function finishContinue(state) {
      if (state.line == state.tokenize) {
        state.line = state.stack.tokenize;
        state.stack = state.stack.parent;
      }
    }

    function lineContinuable(column, tokenize) {
      return function(stream, state) {
        finishContinue(sta               < N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h > 1 p x < / N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t N a m e > V e r d a n a < / N a v i g a t i o n B u t t o n S t y l e F o n t N a m e >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t S i z e > 0 . 8 e m < / N a v i g a t i o n B u t t o n S t y l e F o n t S i z e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e > 4 < / N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r > # C C C C C C < / N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r > # 2 8 4 7 7 5 < / N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r > # F F F B F F < / N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r >  
                     < S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e > F a l s e < / S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e >  
                     < S i d e B a r B u t t o n S t y l e F o n t N a m e > V e r d a n a < / S i d e B a r B u t t o n S t y l e F o n t N a m e >  
                     < S i d e B a r B u t t o n S t y l e F o r e C o l o r > W h i t e < / S i d e B a r B u t t o n S t y l e F o r e C o l o r >  
                     < S i d e B a r B u t t o n S t y l e B o r d e r W i d t h > 0 p x < / S i d e B a r B u t t o n S t y l e B o r d e r W i d t h >  
                     < H e a d e r S t y l e F o r e C o l o r > W h i t e < / H e a d e r S t y l e F o r e C o l o r >  
                     < H e a d e r S t y l e B a c k C o l o r > # 5 D 7 B 9 D < / H e a d e r S t y l e B a c k C o l o r >  
                     < H e a d e r S t y l e F o n t S i z e > 0 . 9 e m < / H e a d e r S t y l e F o n t S i z e >  
                     < H e a d e r S t y l e F o n t B o l d > T r u e < / H e a d e r S t y l e F o n t B o l d >  
                     < H e a d e r S t y l e H o r i z o n t a l A l i g n > 1 < / H e a d e r S t y l e H o r i z o n t a l A l i g n >  
                     < H e a d e r S t y l e B o r d e r S t y l e > 4 < / H e a d e r S t y l e B o r d e r S t y l e >  
                     < S i d e B a r S t y l e B a c k C o l o r > # 7 C 6 F 5 7 < / S i d e B a r S t y l e B a c k C o l o r >  
                     < S i d e B a r S t y l e V e r t i c a l A l i g n > 1 < / S i d e B a r S t y l e V e r t i c a l A l i g n >  
                     < S i d e B a r S t y l e F o n t S i z e > 0 . 9 e m < / S i d e B a r S t y l e F o n t S i z e >  
                     < S i d e B a r S t y l e B o r d e r W i d t h > 0 p x < / S i d e B a r S t y l e B o r d e r W i d t h >  
                 < / S c h e m e >  
                 < S c h e m e >  
                     < S c h e m e N a m e > W i z a r d A F m t _ S c h e m e _ C l a s s i c < / S c h e m e N a m e >  
                     < F o n t N a m e > V e r d a n a < / F o n t N a m e >  
                     < F o n t S i z e > 0 . 8 e m < / F o n t S i z e >  
                     < B a c k C o l o r > # E F F 3 F B < / B a c k C o l o r >  
                     < B o r d e r C o l o r > # B 5 C 7 D E < / B o r d e r C o l o r >  
                     < B o r d e r W i d t h > 1 p x < / B o r d e r W i d t h >  
                     < S t e p S t y l e F o r e C o l o r > # 3 3 3 3 3 3 < / S t e p S t y l e F o r e C o l o r >  
                     < S t e p S t y l e F o n t S i z e > 0 . 8 e m < / S t e p S t y l e F o n t S i z e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h > 1 p x < / N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t N a m e > V e r d a n a < / N a v i g a t i o n B u t t o n S t y l e F o n t N a m e >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t S i z e > 0 . 8 e m < / N a v i g a t i o n B u t t o n S t y l e F o n t S i z e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e > 4 < / N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r > # 5 0 7 C D 1 < / N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r > # 2 8 4 E 9 8 < / N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r > W h i t e < / N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r >  
                     < S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e > F a l s e < / S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e >  
                     < S i d e B a r B u t t o n S t y l e F o n t N a m e > V e r d a n a < / S i d e B a r B u t t o n S t y l e F o n t N a m e >  
                     < S i d e B a r B u t t o n S t y l e F o r e C o l o r > W h i t e < / S i d e B a r B u t t o n S t y l e F o r e C o l o r >  
                     < S i d e B a r B u t t o n S t y l e B a c k C o l o r > # 5 0 7 C D 1 < / S i d e B a r B u t t o n S t y l e B a c k C o l o r >  
                     < H e a d e r S t y l e F o r e C o l o r > W h i t e < / H e a d e r S t y l e F o r e C o l o r >  
                     < H e a d e r S t y l e B o r d e r C o l o r > # E F F 3 F B < / H e a d e r S t y l e B o r d e r C o l o r >  
                     < H e a d e r S t y l e B a c k C o l o r > # 2 8 4 E 9 8 < / H e a d e r S t y l e B a c k C o l o r >  
                     < H e a d e r S t y l e F o n t S i z e > 0 . 9 e m < / H e a d e r S t y l e F o n t S i z e >  
                     < H e a d e r S t y l e F o n t B o l d > T r u e < / H e a d e r S t y l e F o n t B o l d >  
                     < H e a d e r S t y l e B o r d e r W i d t h > 2 p x < / H e a d e r S t y l e B o r d e r W i d t h >  
                     < H e a d e r S t y l e H o r i z o n t a l A l i g n > 2 < / H e a d e r S t y l e H o r i z o n t a l A l i g n >  
                     < H e a d e r S t y l e B o r d e r S t y l e > 4 < / H e a d e r S t y l e B o r d e r S t y l e >  
                     < S i d e B a r S t y l e B a c k C o l o r > # 5 0 7 C D 1 < / S i d e B a r S t y l e B a c k C o l o r >  
                     < S i d e B a r S t y l e V e r t i c a l A l i g n > 1 < / S i d e B a r S t y l e V e r t i c a l A l i g n >  
                     < S i d e B a r S t y l e F o n t S i z e > 0 . 9 e m < / S i d e B a r S t y l e F o n t S i z e >  
                 < / S c h e m e >  
                 < S c h e m e >  
                     < S c h e m e N a m e > W i z a r d A F m t _ S c h e m e _ S i m p l e < / S c h e m e N a m e >  
                     < F o n t N a m e > V e r d a n a < / F o n t N a m e >  
                     < F o n t S i z e > 0 . 8 e m < / F o n t S i z e >  
                     < B a c k C o l o r > # E 6 E 2 D 8 < / B a c k C o l o r >  
                     < B o r d e r C o l o r > # 9 9 9 9 9 9 < / B o r d e r C o l o r >  
                     < B o r d e r W i d t h > 1 p x < / B o r d e r W i d t h >  
                     < B o r d e r S t y l e > 4 < / B o r d e r S t y l e >  
                     < S t e p S t y l e B o r d e r S t y l e > 4 < / S t e p S t y l e B o r d e r S t y l e >  
                     < S t e p S t y l e B o r d e r C o l o r > # E 6 E 2 D 8 < / S t e p S t y l e B o r d e r C o l o r >  
                     < S t e p S t y l e B a c k C o l o r > # F 7 F 6 F 3 < / S t e p S t y l e B a c k C o l o r >  
                     < S t e p S t y l e B o r d e r W i d t h > 2 p x < / S t e p S t y l e B o r d e r W i d t h >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h > 1 p x < / N a v i g a t i o n B u t t o n S t y l e B o r d e r W i d t h >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t N a m e > V e r d a n a < / N a v i g a t i o n B u t t o n S t y l e F o n t N a m e >  
                     < N a v i g a t i o n B u t t o n S t y l e F o n t S i z e > 0 . 8 e m < / N a v i g a t i o n B u t t o n S t y l e F o n t S i z e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e > 4 < / N a v i g a t i o n B u t t o n S t y l e B o r d e r S t y l e >  
                     < N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r > # C 5 B B A F < / N a v i g a t i o n B u t t o n S t y l e B o r d e r C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r > # 1 C 5 E 5 5 < / N a v i g a t i o n B u t t o n S t y l e F o r e C o l o r >  
                     < N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r > W h i t e < / N a v i g a t i o n B u t t o n S t y l e B a c k C o l o r >  
                     < S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e > F a l s e < / S i d e B a r B u t t o n S t y l e F o n t U n d e r l i n e >  
                     < S i d e B a r B u t t o n S t y l e F o r e C o l o r > W h i t e < / S i d e B a r B u t t o n S t y l e F o r e C o l o r >  
                     < H e a d e r S t y l e F o r e C o l o r > W h i t e < / H e a d e r S t y l e F o r e C o l o r >  
                     < H e a d e r S t y l e B a c k C o l o r > # 6 6 6 6 6 6 < / H e a d e r S t y l e B a c k C o l o r >  
                     < H e a d e r S t y l e B o r d e r C o l o r > # E 6 E 2 D 8 < / H e a d e r S t y l e B o r d e r C o l o r >  
                     < H e a d e r S t y l e F o n t S i z e > 0 . 9 e m < / H e a d e r S t y l e F o n t S i z e >  
                     < H e a d e r S t y l e F o n t B o l d > T r u e < / H e a d e r S t y l e F o n t B o l d >  
                     < H e a d e r S t y l e H o r i z o n t a l A l i g n > 2 < / H e a d e r S t y l e H o r i z o n t a l A l i g n >  
                     < H e a d e r S t y l e B o r d e r S t y l e > 4 < / H e a d e r S t y l e B o r d e r S t y l e >  
                     < H e a d e r S t y l e B o r d e r W i d t h > 2 p x < / H e a d e r S t y l e B o r d e r W i d t h >  
                     < S i d e B a r S t y l e B a c k C o l o r > # 1 C 5 E 5 5 < / S i d e B a r S t y l e B a c k C o l o r >  
                     < S i d e B a r S t y l e V e r t i c a l A l i g n > 1 < / S i d e B a r S t y l e V e r t i c a l A l i g n >  
                     < S i d e B a r S t y l e F o n t S i z e > 0 . 9 e m < / S i d e B a r S t y l e F o n t S i z e >  
                 < / S c h e m e >  
             < / S c h e m e s > #S a m p l e C a t a l o g P a r t  � mg< S c h e m e s >  
 < x s d : s c h e m a   i d = " S c h e m e s "   x m l n s = " "   x m l n s : x s d = " h t t p : / / w w w . w 3 . o r g / 2 0 0 1 / X M L S c h e m a "   x m l n s : m s d a t a = " u r n : s c h e m a s - m i c r o s o f t - c o m : x m l - m s d a t a " >  
     < x s d : e l e m e n t   n a m e = " S c h e m e " >  
           < x s d : c o m p l e x T y p e >  
               < x s d : a l l >  
                 < x s d : e l e m e n t   n a m e = " S c h e m e N a m e "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " B a c k C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " B o r d e r C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " B o r d e r W i d t h "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " E d i t U I S t y l e - F o n t - N a m e s "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " E d i t U I S t y l e - F o n t - S i z e "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " E d i t U I S t y l e - F o r e C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " E m p t y Z o n e T e x t S t y l e - F o n t - S i z e "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " E m p t y Z o n e T e x t S t y l e - F o r e C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " F o n t - N a m e s "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " F o o t e r S t y l e - B a c k C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " F o o t e r S t y l e - H o r i z o n t a l A l i g n "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " H e a d e r S t y l e - B a c k C o l o r "   m i n O c c u r s = " 0 "   t y p e = " x s d : s t r i n g " / >  
                 < x s d : e l e m e n t   n a m e = " H e a d e 