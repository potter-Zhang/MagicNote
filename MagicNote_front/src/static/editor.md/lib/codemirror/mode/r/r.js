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

CodeMirror.defineMode("r", function(config) {
  function wordObj(str) {
    var words = str.split(" "), res = {};
    for (var i = 0; i < words.length; ++i) res[words[i]] = true;
    return res;
  }
  var atoms = wordObj("NULL NA Inf NaN NA_integer_ NA_real_ NA_complex_ NA_character_");
  var builtins = wordObj("list quote bquote eval return call parse deparse");
  var keywords = wordObj("if else repeat while function for in next break");
  var blockkeywords = wordObj("if else repeat while function for");
  var opChars = /[+\-*\/^<>=!&|~$:]/;
  var curPunc;

  function tokenBase(stream, state) {
    curPunc = null;
    var ch = stream.next();
    if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    } else if (ch == "0" && stream.eat("x")) {
      stream.eatWhile(/[\da-f]/i);
      return "number";
    } else if (ch == "." && stream.eat(/\d/)) {
      stream.match(/\d*(?:e[+\-]?\d+)?/);
      return "number";
    } else if (/\d/.test(ch)) {
      stream.match(/\d*(?:\.\d+)?(?:e[+\-]\d+)?L?/);
      return "number";
    } else if (ch == "'" || ch == '"') {
      state.tokenize = tokenString(ch);
      return "string";
    } else if (ch == "." && stream.match(/.[.\d]+/)) {
      return "keyword";
    } else if (/[\w\.]/.test(ch) && ch != "_") {
      stream.eatWhile(/[\w\.]/);
      var word = stream.current();
      if (atoms.propertyIsEnumerable(word)) return "atom";
      if (keywords.propertyIsEnumerable(word)) {
        // Block keywords start new blocks, except 'else if', which only starts
        // one new block for the 'if', no block for the 'else'.
        if (blockkeywords.propertyIsEnumerable(word) &&
            !stream.match(/\s*if(\s+|$)/, false))
          curPunc = "block";
        return "keyword";
      }
      if (builtins.propertyIsEnumerable(word)) return "builtin";
      return "variable";
    } else if (ch == "%") {
      if (stream.skipTo("%")) stream.next();
      return "variable-2";
    } else if (ch == "<" && stream.eat("-")) {
      return "arrow";
    } else if (ch == "=" && state.ctx.argList) {
      return "arg-is";
    } else if (opChars.test(ch)) {
      if (ch == "$") return "dollar";
      stream.eatWhile(opChars);
      return "operator";
    } else if (/[\(\){}\[\];]/.test(ch)) {
      curPunc = ch;
      if (ch == ";") return "semi";
      return null;
    } else {
      return null;
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      if (stream.eat("\\")) {
        var ch = stream.next();
        if (ch == "x") stream.match(/^[a-f0-9]{2}/i);
        else if ((ch == "u" || ch == "U") && stream.eat("{") && stream.skipTo("}")) stream.next();
        else if (ch == "u") stream.match(/^[a-f0-9]{4}/i);
        else if (ch == "U") stream.match(/^[a-f0-9]{8}/i);
        else if (/[0-7]/.test(ch)) stream.match(/^[0-7]{1,2}/);
        return "string-2";
      } else {
        var next;
        while ((next = stream.next()) != null) {
          if (next == quote) { state.tokenize = tokenBase; break; }
          if (next == "\\") { stream.backUp(1); break; }
        }
        return "string";
      }
    };
  }

  function push(state, type, stream) {
    state.ctx = {type: type,
                 indent: state.indent,
                 align: null,
                 column: stream.column(),
                 prev: state.ctx};
  }
  function pop(state) {
    state.indent = state.ctx.indent;
    state.ctx = state.ctx.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase,
              ctx: {type: "top",
                    indent: -config.indentUnit,
                    al��B`[�A`*y	�5��!��b¦ 	2 YY��(��
Y![#�#{��!j�$[[�U��G`|y�6�%��y�',�"�'�"b�'�}ң8��j���"jj���_����U`��Z,ҕ'�'�'�'	}�� 	� ; �R �b� +��0�
�B+:��P +[	+,Z,�'�'�'�'	}�� 	� ; �U �e� [��0�
�E[:��P [[	[,Z,�'�'�'�'	}�� 	�  �U �e� [��0�
�E[:��P [[	[,Z,�'�'�'�'�'
����U �e� [��0�
�E[:��P [[	[,Zk�'�'�'	|R}�� 	� ; 	�U �e� [��0�
�E[:��P [\?z�2��!i
��'*<��"J���"Z�"J�!9"�! ���+��,����>��/�
 )�R �b� -В0�
�B-,֒hӒ+�j��i-�AS��,�3��!i
��'ik��&�&��"�"�#�)��*�H�=�"?� n�&
"���J����M����H��
�;���?��9 ��O�$���x�m+�C�S �c� =Г0�
Г1�=Z��c0=�� y�,/Y��}�oI0��ȗI=���9p=�yi�Z��I�Z�D`�Z�����Oi�Z�����k)����k���k9p�;�v����kI0�K[Y�,	�6��#L 9>" 99" �V �f� j��0�
�Fjl��Ppj�E`j�pPِ�	#}: }�!k\��$�$	�%}�"��z�"R�'� �����:�$+�"I�#��:"Y�'�Y�� �'<"��&��	 !�%)�!�� !�&)�!j�'�	�P �		�	��WS��gS��	}4��O)i�����9��Y��,)p��]ISΑ�ԗ�	�5�	�6����ASʖ��0���)<�	#���&R� o�%"�\�"�'�'����Z��kr�#�#��%M"Nr~� ��
 : !�')�"�� !�&)�!j�'i�	�P �		�	��}5�	�gS��	�GS���y��yY��OΗ3���5�O�aS��O�AS��ȕ0�~�j�xY�'��#)=Ҥ" *R *�%*�&<�"�$��j��l�!R9" *�#<�!�!�A�Q �a� �@p�T`�d0��N	p��N)`��N0����;j	pސ��;j0��f0��h�)�� �X��';�!z� *�&+�!k� \� �&�=�'*�!�#���Ib")�!i�!k":� ��H��*�("��.��*0���z�#�]��m� �"�°I��
��z !�$�|��] I�@N�>��I��*90�	90��-)S��{�/	S����|	S���J6����tS��G6����WS�
I!9#>�� ��!9�h}�^lZ]�'�'�'�'Y}�