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

CodeMirror.defineMode("sql", function(config, parserConfig) {
  "use strict";

  var client         = parserConfig.client || {},
      atoms          = parserConfig.atoms || {"false": true, "true": true, "null": true},
      builtin        = parserConfig.builtin || {},
      keywords       = parserConfig.keywords || {},
      operatorChars  = parserConfig.operatorChars || /^[*+\-%<>!=&|~^]/,
      support        = parserConfig.support || {},
      hooks          = parserConfig.hooks || {},
      dateSQL        = parserConfig.dateSQL || {"date" : true, "time" : true, "timestamp" : true};

  function tokenBase(stream, state) {
    var ch = stream.next();

    // call hooks from the mime type
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }

    if (support.hexNumber == true &&
      ((ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/))
      || (ch == "x" || ch == "X") && stream.match(/^'[0-9a-fA-F]+'/))) {
      // hex
      // ref: http://dev.mysql.com/doc/refman/5.5/en/hexadecimal-literals.html
      return "number";
    } else if (support.binaryNumber == true &&
      (((ch == "b" || ch == "B") && stream.match(/^'[01]+'/))
      || (ch == "0" && stream.match(/^b[01]+/)))) {
      // bitstring
      // ref: http://dev.mysql.com/doc/refman/5.5/en/bit-field-literals.html
      return "number";
    } else if (ch.charCodeAt(0) > 47 && ch.charCodeAt(0) < 58) {
      // numbers
      // ref: http://dev.mysql.com/doc/refman/5.5/en/number-literals.html
          stream.match(/^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/);
      support.decimallessFloat == true && stream.eat('.');
      return "number";
    } else if (ch == "?" && (stream.eatSpace() || stream.eol() || stream.eat(";"))) {
      // placeholders
      return "variable-3";
    } else if (ch == "'" || (ch == '"' && support.doubleQuote)) {
      // strings
      // ref: http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    } else if ((((support.nCharCast == true && (ch == "n" || ch == "N"))
        || (support.charsetCast == true && ch == "_" && stream.match(/[a-z][a-z0-9]*/i)))
        && (stream.peek() == "'" || stream.peek() == '"'))) {
      // charset casting: _utf8'str', N'str', n'str'
      // ref: http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
      return "keyword";
    } else if (/^[\(\),\;\[\]]/.test(ch)) {
      // no highlightning
      return null;
    } else if (support.commentSlashSlash && ch == "/" && stream.eat("/")) {
      // 1-line comment
      stream.skipToEnd();
      return "comment";
    } else if ((support.commentHash && ch == "#")
        || (ch == "-" && stream.eat("-") && (!support.commentSpaceRequired || stream.eat(" ")))) {
      // 1-line comments
      // ref: https://kb.askmonty.org/en/comment-syntax/
      stream.skipToEnd();
      return "comment";
    } else if (ch == "/" && stream.eat("*")) {
      // multi-line comments
      // ref: https://kb.askmonty.org/en/comment-syntax/
      state.tokenize = tokenComment;
      return state.tokenize(stream, state);
    } else if (ch == ".") {
      // .1 for 0.1
      if (support.zerolessFloat == true && stream.match(/^(?:\d+(?:e[+-]?\d+)?)/i)) {
        return "number";
      }
      // .table_name (ODBC)
      // // ref: http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
      if (support.ODBCdotTable == true && stream.match(/^[a-zA-Z_]+/)) {
        return "variable-2";
      }
    } else if (operatorChars.test(ch)) {
      // operators
      stream.eatWhile(operatorChars);
      return null;
    } else if (ch == '{' &&
        (stream.match(/^( )*(d|D|t|T|ts|TS)( )*'[^']*'( )*}/) || stream.match(/^( )*(d|D|t|T|ts|TS)( )*"[^"]*"( )*}/))) {
      // dates (weird ODBC syntax)
      // ref: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
      return "number";
    } else {
      stream.eatWhile(/^[_\w\d]/);
      var word = stream.current().toLowerCase();
      // dates (standard SQL syntax)
      // ref: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
      if (dateSQL.hasOwnProperty(word) && (stream.match(/^( )+'[^']*'/) || stream.match(/^( )+"[^"]*"/)))
        return "number";
      if (atoms.hasOwnProperty(word)) return "atom";
      if (builtin.hasOwnProperty(word)) return "builtin";
      if (keywords.hasOwnProperty(word)) return "keyword";
      if (client.hasOwnProperty(word)) return "string-2";
      return null;
    }
  }

  // 'string', with char specified in quote escaped by '\'
  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }
  function tokenComment(stream, state) {
    while (true) {
      if (stream.skipTo("*")) {
        stream.next();
        if (stream.eat("/")) {
          state.tokenize = tokenBase;
          break;
        }
      } else {
        stream.skipToEnd();
        break;
      }
    }
    return "comment";
  }

  function pushContext(stream, state, type) {
    state.context = {
      prev: state.context,
      indent: stream.indentation(),
      col: stream.column(),
      type: type
    };
  }

  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase, context: null};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null)
          state.context.align = false;
      }
      if (stream.eatSpace()) return null;

      var style = state.tokenize(stream, state);
      if (style == "comment") return style;

      if (state.context && state.context.align == null)
        state.context.align = true;

      var tok = stream.current();
      if (tok == "(")
        pushContext(stream, state, ")");
      else if (tok == "[")
        pushContext(stream, state, "]");
      else if (state.context && state.context.type == tok)
        popContext(state);
      return style;
    },

    indent: function(state, textAfter) {
      var cx = state.context;
      if (!cx) return CodeMirror.Pass;
      var closing = textAfter.charAt(0) == cx.type;
      if (cx.align) return cx.col + (closing ? 0 : 1);
      else return cx.indent + (closing ? 0 : config.indentUnit);
    },

    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: support.commentSlashSlash ? "//" : support.commentHash ? "#" : null
  };
});

(function() {
  "use strict";

  // `identifier`
  function hookIdentifier(stream) {
    // MySQL/MariaDB identifiers
    // ref: http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
    var ch;
    while ((ch = stream.next()) != null) {
      if (ch == "`" && !stream.eat("`")) return "variable-2";
    }
    stream.backUp(stream.current().length - 1);
    return stream.eatWhile(/\w/) ? "variable-2" : null;
  }

  // variable token
  function hookVar(stream) {
    // variables
    // @@prefix.varName @varName
    // varName can be quoted with ` or ' or "
    // ref: http://dev.mysql.com/doc/refman/5.5/en/user-variables.html
    if (stream.eat("@")) {
      stream.match(/^session\./);
      stream.match(/^local\./);
      stream.match(/^global\./);
    }

    if (stream.eat("'")) {
      stream.match(/^.*'/);
      return "variable-2";
    } else if (stream.eat('"')) {
      stream.match(/^.*"/);
      return "variable-2";
    } else if (stream.eat("`")) {
      stream.match(/^.*`/);
      return "variable-2";
    } else if (stream.match(/^[0-9a-zA-Z$\.\_]+/)) {
      return "variable-2";
    }
    return null;
  };

  // short client keyword token
  function hookClient(stream) {
    // \N means NULL
    // ref: http://dev.mysql.com/doc/refman/5.5/en/null-values.html
    if (stream.eat("N")) {
        return "atom";
    }
    // \g, etc
    // ref: http://dev.mysql.com/doc/refman/5.5/en/mysql-commands.html
    return stream.match(/^[a-zA-Z.#!?]/) ? "variable-2" : null;
  }

  // these keywords are used by all SQL dialects (however, a mode can still overwrite it)
  var sqlKeywords = "alter and as asc between by count create delete desc distinct drop from having in insert into is join like not on or order select set table union update values where ";

  // turn a space-separated list into an array
  function set(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  // A generic SQL Mode. It's not a standard, it just try to support what is generally supported
  CodeMirror.defineMIME("text/x-sql", {
    name: "sql",
    keywords: set(sqlKeywords + "begin"),
    builtin: set("bool boolean bit blob enum long longblob longtext medium mediumblob mediumint mediumtext time timestamp tinyblob tinyint tinytext text bigint int int1 int2 int3 int4 int8 integer float float4 float8 double char varbinary varchar varcharacter precision real date datetime year unsigned signed decimal numeric"),
    atoms: set("false true null unknown"),
    operatorChars: /^[*+\-%<>!=]/,
    dateSQL: set("date time timestamp"),
    support: set("ODBCdotTable doubleQuote binaryNumber hexNumber")
  });

  CodeMirror.defineMIME("text/x-mssql", {
    name: "sql",
    client: set("charset clear connect edit ego exit go help nopager notee nowarning pager print prompt quit rehash source status system tee"),
    keywords: set(sqlKeywords + "begin trigger proc view index for add constraint key primary foreign collate clustered nonclustered"),
    builtin: set("bigint numeric bit smallint decimal smallmoney int tinyint money float real char varchar text nchar nvarchar ntext binary varbinary image cursor timestamp hierarchyid uniqueidentifier sql_variant xml table "),
    atoms: set("false true null unknown"),
    operatorChars: /^[*+\-%<>!=]/,
    dateSQL: set("date datetimeoffset datetime2 smalldatetime datetime time"),
    hooks: {
      "@":   hookVar
    }
  });

  CodeMirror.defineMIME("text/x-mysql", {
    name: "sql",
    client: set("charset clear connect edit ego exit go help nopager notee nowarning pager print prompt quit rehash source status system tee"),
    keywords: set(sqlKeywords + "accessible action add after algorithm all analyze asensitive at authors auto_increment autocommit avg avg_row_length before binary binlog both btree cache call cascade cascaded case catalog_name chain change changed character check checkpoint checksum class_origin client_statistics close coalesce code collate collation collations column columns comment commit committed completion concurrent condition connection consistent constraint contains continue contributors convert cross current current_date current_time current_timestamp current_user cursor data database databases day_hour day_microsecond day_minute day_second deallocate dec declare default delay_key_write delayed delimiter des_key_file describe deterministic dev_pop dev_samp deviance diagnostics directory disable discard distinctrow div dual dumpfile each elseif enable enclosed end ends engine engines enum errors escape escaped even event events every execute exists exit explain extended fast fetch field fields first flush for force foreign found_rows full fulltext function general get global grant grants group groupby_concat handler hash help high_priority hosts hour_microsecond hour_minute hour_second if ignore ignore_server_ids import index index_statistics infile inner innodb inout insensitive insert_method install interval invoker isolation iterate key keys kill language last leading leave left level limit linear lines list load local localtime localtimestamp lock logs low_priority master master_heartbeat_period master_ssl_verify_server_cert masters match max max_rows maxvalue message_text middleint migrate min min_rows minute_microsecond minute_second mod mode modifies modify mutex mysql_errno natural next no no_write_to_binlog offline offset one online open optimize option optionally out outer outfile pack_keys parser partition partitions password phase plugin plugins prepare preserve prev primary privileges procedure processlist profile profiles purge query quick range read read_write reads real rebuild recover references regexp relaylog release remove rename reorganize repair repeatable replace require resignal restrict resume return returns revoke right rlike rollback rollup row row_format rtree savepoint schedule schema schema_name schemas second_microsecond security sensitive separator serializable server session share show signal slave slow smallint snapshot soname spatial specific sql sql_big_result sql_buffer_result sql_cache sql_calc_found_rows sql_no_cache sql_small_result sqlexception sqlstate sqlwarning ssl start starting starts status std stddev stddev_pop stddev_samp storage straight_join subclass_origin sum suspend table_name table_statistics tables tablespace temporary terminated to trailing transaction trigger triggers truncate uncommitted undo uninstall unique unlock upgrade usage use use_frm user user_resources user_statistics using utc_date utc_time utc_timestamp value variables varying view views warnings when while with work write xa xor year_month zerofill begin do then else loop repeat"),
    builtin: set("bool boolean bit blob decimal double float long longblob longtext medium mediumblob mediumint mediumtext time timestamp tinyblob tinyint tinytext text bigint int int1 int2 int3 int4 int8 integer float float4 float8 double char varbinary varchar varcharacter precision date datetime year unsigned signed numeric"),
    atoms: set("false true null unknown"),
    operatorChars: /^[*+\-%<>!=&|^]/,
    dateSQL: set("date time timestamp"),
    support: set("ODBCdotTable decimallessFloat zerolessFloat binaryNumber hexNumber doubleQuote nCharCast charsetCast commentHash commentSpaceRequired"),
    hooks: {
      "@":   hookVar,
      "`":   hookIdentifier,
      "\\":  hookClient
    }
  });

  CodeMirror.defineMIME("text/x-mariadb", {
    name: "sql",
    client: set("charset clear connect edit ego exit go help nopager notee nowarning pager print prompt quit rehash source status system tee"),
    keywords: set(sqlKeywords + "accessible action add after algorithm all always analyze asensitive at authors auto_increment autocommit avg avg_row_length before binary binlog both btree cache call cascade cascaded case catalog_name chain change changed character check checkpoint checksum class_origin client_statistics close coalesce code collate collation collations column columns comment commit committed completion concurrent condition connection consistent constraint contains continue contributors convert cross current current_date current_time current_timestamp current_user cursor data database databases day_hour day_microsecond day_minute day_second deallocate dec declare default delay_key_write delayed delimiter des_key_file describe deterministic dev_pop dev_samp deviance diagnostics directory disable discard distinctrow div dual dumpfile each elseif enable enclosed end ends engine engines enum errors escape escaped even event events every execute exists exit explain extended fast fetch field fields first flush for force foreign found_rows full fulltext function general generated get global grant grants group groupby_concat handler hard hash help high_priority hosts hour_microsecond hour_minute hour_second if ignore ignore_server_ids import index index_statistics infile inner innodb inout insensitive insert_method install interval invoker isolation iterate key keys kill language last leading leave left level limit linear lines list load local local��$>L��$�'j~��'r�!�H" '��B`��r �Up�%9i!I��%[ II	�DI-��k�1��%��'Zj��&�� \N"n��:��	+=��n���y"�#� �;��ZR�%^�%���y2�%�;�� Y�Az��C`���I�Бy��l	P����X�	��hY��n�C`��ii��n�Sp��v!	#; 	��B`Y!{9��#bZ�	��E`|*�5��$z*��!zM�'"<�&��(B �" ��&�!: ZZ�h6š�}	Si!5��"�% �#E9��""��!�$��&YoR 9� 

	�@ɶ� i<�q0��� i)!l" �'	��E`7!5�R"E9!5R&R	�EU9!5R&R	�EU9!5R&R	�EU)!5��%�Ev!jY2 	��F`9!5R&R	� EUR#	'�#YR �'EYK!i�� YzBk 	�V �f� i�FiT ii��G`iz9I�0��$[R �"bNR �&b	��E`��@`;YR#)
rr��"�"I b �r�"EjW lW ;Y�3��%�"�!J{` � *lP �')}b 9KY�3�� � ,�� R��R�� 9:)r#<�b{�b\�b=G�C`��@`z)9r#;�b�b|�b]�b>G�A`٠@`)i!	#e��% 		�P��@�Ii!#e���&��P`�BpIZ!Z#e���'i ZZ	�EZ��f0Z�A`�!; YY��A`9!5b9�b{" EeIi!I#;9�r" II��W`I?IZ!5BYBJ��# U P	PPQd�P	�D9!5r9" �$Eyy!)#��'Y �&))��E)5ii!I#;9� �r" II��W`I�@p�!N YY	�YS���`9j!Z#���!ZZ	�Z��H��zJ	�1��'�"�&r���pj�Q�p� !)#�)��8	!�!�  U P)i!�!� �' U P	PQDE	:��!� �'�"�&�$| II	�t�I�DI��cp	��!� �#�'�%| II	�DIM��gp� !5b U PQC	!5��# U PQ	kji�3��";*" J".r+��&�"� ��$99��T`��� ��P`��wpJ�1��!�� ��a¦ ��A]�HS`+N9�0�aҔ%
Ҡ'�"�! �ZKrY�@ �P� ��=��N�8Ki�R0�Cp��`��V0��`��d��x{.�J�6Ґ" L��#" �'n�#�M��y�9� �MR�") :.� :�"�J�F �V� k��������K��J�� y��Z�*�Ep��Z�J�s��H�`��Z�H�U0�j�`�j�Ap�j�Q0f!5� EUYK!
I��%Z � 	�P �`� 	�@	T 	I		j��p`y|!JI��%J{�r=" )�T �d� I��0�
�DIT II	I<��@`I/	��y�!?l���%���y� �E� [�eC� [��V��[k��f��[k��"p��V����0��@`��c����i!*#M)�**��Up*�A`��=K�3�#R�� [bl��&[�=� J�$	�&Y�$I�&)�'��9�� [ J�!9"�{УN�Ҷ8�K� J",�C�# �S� ?�sC� ?	C��Y	����Y���i?ʐ5�?�p����/=i�ғ5���s��/�W0�ՒIΕ9��/�&P�{9���S0�{9i�{9y�{9)�����Y�{9Y���٢d��ٲP0�-ly�-��I�-��Y�-�$P�-ܓ5��!�P 

	�
,��W��
5��F �!5�% PQ	YZ!)#	)��!: ))	�r�)��A)ZD! +Yi!<#{9�J )+" <<��S`<�FpIy!�%�l I�"\\����{9!|)�#�[��E`��A`�![#�[[��U JI	�2�" o=ґI�I�"I *��i�J�P0!+#Z 9i!k#��  II��@`kK9Z!,#\)��! 

	�@,K��E`,�!��% II��Ppku!�K��@Ij!k#e�r9�II�V�V�S�S�@	:!k#|#	 II�V�V�V֖Qp	!5�#�U PQ;i!Y#\9�YY��C`YjKi�2���%� "�I 	��h�I "m?X 	�R �B)U`)EMEM{�9�[i!Y#,9�YY��C`Yj*z!#����Y�$��E`��	������Qp	y!5�!�U PQR��Q 	y!5�#�U PQR��S j;�6��!yk��"����& ll��Qpl�z�z�r0��m=|:�5r%w"�L_��#)|��!�%i"�'\"i�&I )!� �% �U �e� ^��C�і�.�.��vSڑ	S�i!#�"Ji"*Bj ��`0KưDp*y	�0��&) _";}��&I 
��F`}n�\;9!#}	����B`z
9�3��'�#$B:�J}2>bO2 Y"<�i<�E0�QP[yI�6��#�$� Z}8��)Ҕ|2�% �!ii��?��:i	�6��"� o�' 	9�$kk��Dk�"0Yi!)#9*���#I"))��C)~j	�2�� �!*]����	2�& )��K!;#��. ;��Gi!k#�� kk��Gk� 0}j:�2RI��#y=B}������M��X &IZ��$I��
���O�++	�B+�D0+�P`+�cp;j9�0��$	
��&y.��h� �b��&=

	�@
�Bp
�V0
�a`jz�4�(�)�!)�!��zR 9"LL�iL�T`o�rPL�DpI!	#
ZRK2- 	��E`o,ҕ!*��!�$J<��'O2�# ��HR�#{�'j�$z� n�$z"�  ��$I!�&��� 	�U �E]�iNӕ-�<L�<�F`��]	S�*i	��!	Z��!� �' bY		��P 	|Y!	��$�#�" 	��D`	!5��'  P	P	!Y#y YY	�EYS���D`J�2�$B9��#��%="�	� �B+�@`+�p��p��C`��8�[�pI!5��#) �!)  PI!5��#) �!9  P!j#�!� � �V� j�f�f�f��8��h��*,	�0�p�8 Y'")
¶� �P� ��Rpo���m�m�m+!#M	�� ��I"�	�@��X�hYi�`�!;#�	� �S� ;�C;N��Gp;�`;�U0<:�0��&L��$	�#"�%��!��
�����k��#lZ��!l< � �P� �@	�G`��=��Z��k)Y!y9�b;" �a�aYy!+9�8"
 ," **��y��**Z	Җ$-J��'.R 	[" kk	�FkEk�`k�Up�!*#�**��Dp*M�!5�E P	PIZ!#J9�r" 	�A��U`j[)�7��&-j��!�%.mR {" 	� �W� {�w��c0{�`{�Qp��b0z+9�6�H"�%�&{"]BR |" jj	�FɰgPj�G`j�Wpj�0z+9�6�H"�#�&<{"<B|R [" jj	�F��cPj�C`j�Spj�0)i!	#Y)b 			�@	Y	�!
#O"O *�  �P� 
�pC� 
	C� 
C� 
�0
	��p��
		��
	��
	��q����0밐i���%p�F`�!:#"�:�# �S� :�sC� :	C� :C� :�S�S�S7��S	��
:�1̠S��t����0���J���@p�V0�"`�!Y#k )�% �U� Y�uC� Y��u Y*��U���e���#`�!Y#n 	�E �U� Y�Y		Y9Y:��`�!Y#O 	�E �U� Y�Y		Y9Y��`�!Y# 	�E �U� Y�Y		Y9Yj��`�!Y#? 	�E �U� Y�Y		Y9Y��`�!Y# 	�E �U� Y�Y		Y9Yj��`[!K#l	�� ��� �	�D �T� K�KY��b`K�R0K�CP�!;#�	�C �S� ;�;��aP;M��0�!
#�	�@ �P� 
�
)
j��F 
=�!
# )�@ �P� 
�pC� 
�P7���Q���d 
K��`)y!L#��$�LL��iäm�!j#�jj	�j��S0j	!y#R y��F`jIR#eR" �#YR
R �"* 9Pe� EUREU	e��P�P�C�C	iZ!9#�"�%J2; 99	�C9I��E`9Z	i!["
 		��E`[i	i!	#l) 		��E`[i*		�5��!Nz��: g¦ Z��!5��%B E!5��%R EY!9#	Y��%�9I!5��#) �!) EI!5��#) �!9 Ef!5�% P9!i:� bZ�		�`��#`LI�!l II��%pI
J!*:� �II�d��#`
ױ!`+:I�0"%_\�<"*"\��&��%� ��D��^ǰX*]�32R'K"<[2Rl 9�S �c� >��0�
�C?��y�y�y�y�y	��!m 

	�@
y��R`
;�!M 

	�@
I��G`
*{!#�$��'� ��$lk 	�! �Q� �A�b�ѡ[ա<i�'0
j!:#;��Y Y
¶::	�C:]��H��i
[!Y#i9�� 
 )�	�% �U� Y�5	Y{��"0{:�h9
{!M#�#��'O YJ¶	�$ �T� M�DM�b`M�@�֤iӤ+j,�5��#;��y~���%l��% �U� Z�EZS���F`]�s���l��}�!��Z kk��BknY!;#�#��' �;��@Ii!I#;9�r" II��W`I�Apf!6�V `yL!i#)��!� �  �V �f� i��0�
�FiY��v0i���0� )I!5��") U PQYQ	!9#�$�9��M	!iY" I E	!iY" 9 E	!iY" E	!I9" 9 Eu�7	!i9"  E�A	!"kJP E5!i9��E)!iY zJ U PQ	[!iY 
 Pe� u�E�Q �a�Pyt���P v!+#k +�R	!YY" 	 E	!iY" 	 U PQ�!iY�U PQ	�1�� �&
 g¦ 	�A
��T���#`��%`*	�0��!^ )��`¦ 

	�@
\��!0
N�	z!ڣ!�MM	�DM�F�֤HӴ�!:#/ ::	�C:J��E0:Z
�1#����#[�#  ��}�J�Ky�!{:� ��%��%�z�  �P� �pC� 	C� �p�p�p�p7̰p	��J��W0O<��cPO<7��ē0���Cp��dP��w����(	����L�{� `9!;:� ��% I�$ �T� J�DJGpJg0JWPJJ��`0N��SPNO�!J# 	�$ �T� J�DJ��@0J>��$`	!YY" y EY9!#)RY����F`|i9!. � R/R U PQK	9!+ �#U PQG�S 	i!=-R 99��R`9,�!=* 		��@`	)!	#<* 		��@`KY�1R&�� N"]BZ��""]B>��Q�Iiٕ��]�Spi!+R 
") �&EY)!*9��#��9�s�69)!z9��#�( 
�p֥F`!i9��Ei! +��II�� pI;�!�� [[��%0
]	�72R'Z2Rk 9�W �g� {��0�
�G|�����������	��!*"y U PQYII!5��#Y�U PQRjz)�5��#�&ɷ'�#�'��%\\�|Õoƕo�]i{!}#ٴ'O 
J¶	�' �W� }�G}�e`}�CP}�Q�֧\:�2��#n���%.�&�&z y�%�!����*��� l+��&l� i�" �R� +�B+>i+>y+>��x�>^y��`��>�CP�{�LKIˤIkjI�3��#mM��#�!��i����� l+� ::	�C:]��)��i[!;9�� 
 )�	�% �U� Y�5	Y{��"0{:�hi{!}#ٴ'O 
J¶	�' �W� }�G}�e`}�C�֧ӧ\L,i�5��#;��!i�� �!��:��\���l� �% �U� Z�EZS���F`]�q���M��v!)#M )��D`i!#,���D � 099!/ 	�Jz0 k�v�(M�!5�U PQW �CE	i!5�%� U PQW �CEYI!y*�� I �'U PQ*QZyi!#;9�"} �"��W`�Gpd!; EEY!	#I�		�p��#`K{Y�5R& 	9Ri" 	
��$�$� ��Y" �U �e� Y�U�U�S�S��<�!)#�))��R`R#e�9Ri" � Y 	Pe� EURe��T	JU Kc� *9�3R&�� ��'*}B.��&�99�S��<�y�up��;k�3��$*\��#�%��'�%�$���oR�!�8�Z"� �$��8� k�#�
��;��l��/��"I�!��* :\�':�C�S =z֓{�^��y��� I�U��L�f0��(��j��y��MYp��Mi0���y�ài�Ӗ�L����]IP������i0|M:r#�"�!Y">R"<[��'�#%��'�#��%��'� 9pG���v�T �K�\`ɵW ɵG�c���=)�� 9j)�7��#��%*jR+� ��'yy	�Gy��Qp-Sp-	)9!	#	Y" [ 	��@`f!5�E5d!{ Ffd!J E5iI!5��!	{�m" U PQ
R:ii!I#;9�&�r" II��W`I�Fpf!5�EuYJ!9#:9��#�99��D`9K�0�P	y|!y#Zy��&�%�% )�W �g� y��0�
�GyT yZ��q���E0y	��	!YY" E� !9#�9��<!YY��!) E4!	 E	!YY" 9 E	!YY" E	!YY" I E	!YY" 	 U PQ	�!, i U PQ	�!+9�		��R`)!YY zJ U PQ	Z+�6��!�� 	o��`¦ kk	�Fk��T����+**	�0��!N )��`¦ 

	�@
L�� 0
>�z7!j)�E	9!#-". ��F`{J	9![#-" [��F`>J9!m � R/R U PQYZ!y#Zy��"�! yy	�GyZiy��A0Ii!	#[KR<2- 		��Q 	,i!{#��" {{��R {�A0)	�6R&�� }
��: k�V��E`i!#|���A �%0zz)�5��#	i�{"<��'��%\\�åƥ��<y{!}#ʳ'���$lk 	�' �W� }�G}�d`}�BP}�P�ַLkjI�7��#nM��#�#��j���� l+� ||	�G|]Ɨ*��i[!;9�� 
 )�	�% �U� Y�5	Y{��"0{:�hy{!}#ʳ'���$lk 	�' �W� }�G}�d`}�B�ַӷL,,Y�#;��!i�� �#��;�]���m� �! �Q� �AS���F`��i�dP�!0v!)#N )��D`99! 	�z0 k�f��!"y U PQIyi!#;9�"> �"��W`�Apw!N)�[��G`!Y9��Ei![#�� [[��G [�'0)!9�:" EE�!Z U PQy	R#� �#� *R E�AY9!�"YJ ��B`=,99!9#>"}	�9��C`oni!	#:y�		��U 	:\y�1��%��"�&��\��n��/ң(��y¢.��'I�$ �%�Q �a� ѡ:�\P��\	0�A`��i�apYy!
#."?	��i 

����-��i�8"Z,��'{�$���+� [�$ ��Y��+�;�!=�%J�"��}��?��L����R�#
�$z"� J�%��K�� i")!K�&���~ 
�R �b� /�B/�q`/�eS��O5��;I5���4Ő�A) ���ܗ	p�}ɒ1���_6���5���<4� ;Y�5��'z��$�#_�"K�",�!�Lr � Y��V0Y�G`��C`Y�pp��eP�&M^*�2R&yI��#�&� Y��&:]�y"��,��R�$]� �") "i�R �B,U`,Epnj�Fp��U`��EpٵT`��w0ٕl�,�/	p�7;i�1R&�Y^R��R ��~��¢xR �" �Q�Rp+�F`��Qp���MKiK!
�� Yz��' 	�P �`� 
�@
T 
i��w0
	Y!	#}I 		�@��E`9i!Y#
��J Y