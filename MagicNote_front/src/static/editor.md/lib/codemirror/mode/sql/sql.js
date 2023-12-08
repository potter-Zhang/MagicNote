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
    keywords: set(sqlKeywords + "accessible action add after algorithm all always analyze asensitive at authors auto_increment autocommit avg avg_row_length before binary binlog both btree cache call cascade cascaded case catalog_name chain change changed character check checkpoint checksum class_origin client_statistics close coalesce code collate collation collations column columns comment commit committed completion concurrent condition connection consistent constraint contains continue contributors convert cross current current_date current_time current_timestamp current_user cursor data database databases day_hour day_microsecond day_minute day_second deallocate dec declare default delay_key_write delayed delimiter des_key_file describe deterministic dev_pop dev_samp deviance diagnostics directory disable discard distinctrow div dual dumpfile each elseif enable enclosed end ends engine engines enum errors escape escaped even event events every execute exists exit explain extended fast fetch field fields first flush for force foreign found_rows full fulltext function general generated get global grant grants group groupby_concat handler hard hash help high_priority hosts hour_microsecond hour_minute hour_second if ignore ignore_server_ids import index index_statistics infile inner innodb inout insensitive insert_method install interval invoker isolation iterate key keys kill language last leading leave left level limit linear lines list load local local¢§$>L’Ö$Õ'j~Âö'r‰!•H" 'Á°B`ùÕr šUp‹%9i!I²¢%[ II	DI-™õk¢1¢—%’—'Zj¢¶&’Ç \N"n¢¦:’‘	Â“+Â“=²‘n¢•â¢y"ª#º £;¢¶ZRÚ%^‹%µ’´y2«%µ;¢¢ Y AzöÑC`¼£•IìĞ‘yú¤l	Pú¤öX–	“hY—nÍC`“ii”nÍSpúÄv!	#; 	‘ B`Y!{9¢¦#bZ¢	‘ĞE`|*¢5ÂÕ$z*¢¶!zM¢'"<¢&¢“(B —" ¢ã&÷!: ZZñ¢h6Å¡¥}	Si!5¢“"•% Å#E9²“""™ä!ä$’ã&YoR 9‰ 

	 @É¶– i<Éq0ª” i)!l" ¦'	‘E`7!5ÒR"E9!5R&R	²EU9!5R&R	²EU9!5R&R	ÂEU)!5²%¢Ev!jY2 	‘F`9!5R&R	² EUR#	'•#YR ‘'EYK!i’¢ YzBk 	V f iFiT ii—¦G`iz9I’0’$[R æ"bNR æ&b	‘ÀE`¹¡@`;YR#)
rr’Ñ"ç"I b ‘r‰"EjW lW ;Y’3’%¥"·!J{` Å *lP Å')}b 9KY’3’¢ · ,¢Ô R¢ÒR’ò 9:)r#<’b{’b\’b=G—C`¹¢@`z)9r#;’b’b|’b]’b>G—A`Ù @`)i!	#e¢•% 		‘P’@Ii!#eò’ &¡ñP`™BpIZ!Z#eò’’'i ZZ	 EZ§õf0Z¹A`–!; YY‘ÕA`9!5b9Âb{" EeIi!I#;9Òr" II‘äW`I?IZ!5BYBJ’°# U P	PPQdP	•D9!5r9" ¡$Eyy!)#’´'Y Ñ&))‘¢E)5ii!I#;9â ²r" II‘äW`I¹@p¤!N YY	YS¥`9j!Z#É’Ò!ZZ	 Z§•H£•zJ	¢1’“'¥"¦&rÂ¡¡pjæQæ¡p— !)#Ê)‘¢8	!•!¤  U P)i!•!¤ ¤' U P	PQDE	:’”!¤ ¤'µ"¶&Ô$| II	tI‘DI–äcp	’”!¤ ¥#¦'Ä%| II	DIM–Ôgp— !5b U PQC	!5’£# U PQ	kji’3’‘";*" J".r+²Ñ&â"ô ’Ñ$99‘ÃT`‰³‘ óÒP`‰³wpJ’1’¡!²Ã ¢’aÂ¦ ‘‘A]–HS`+N9²0’aÒ”%
Ò 'Õ"‰! ’ZKrY°@ °P ±=·N¦8KišR0ê§Cpê×`ê÷V0Œ—`Œ·dÆx{.©J²6Ò" Lâ¢#" ù'nš#£M’¡y’9Ú £MRê") :.’ :©"úJ°F °V k±–¶–·–“–K—ÃJ™“ y«¢Z¶*ªEp«¢ZÃJ©sæH‰`”ZçHÉU0‰jù`‰jªAp‰jÊQ0f!5¢ EUYK!
I’¤%Z Æ 	P ` 	@	T 	I		j‘Àp`y|!JI’¤%J{²r=" )T d I”0”
DIT II	I<—ä@`I/	£±y‰!?l’’Ğ%ù—y° °E [°eC© [±µV£Á[k³µf£Ñ[k¶Õ"p©’V£Á©Â0©Ò@`©âc£Ñ©¢i!*#M)°**¡òUp*™A`™¢=Kò3’#RÀ´ [bl’Ò&[’=© J©$	¹&YÉ$IÙ&)é'™¡9ª [ Jª!9"¤{Ğ£Nğ¦Ò¶8’K« J",ğCğ# ğS ?ğsC© ?	CÉğ£Y	£¡©ğ£Yö£ó£i?Ê5¹?Êp÷ÃÕ/=iıÒ“5¹ıÒs×/‰W0ÎÕ’IÎ•9Õ/›&P™{9•¹—S0™{9i™{9y™{9)”¹—“Y™{9Y£‘ëÙ¢d–Ù²P0™-ly™-ù”I™-ª“Y™-¬$P™-Ü“5¹·!é‘P 

	 
,¢ÀW£¡
5Êğ¡F –!5’% PQ	YZ!)#	)’¡!: ))	r)‘¢A)ZD! +Yi!<#{9¢J )+" <<ÁóS`<ÙFpIy!É%Âl I©"\\ÁÅÇÅ{9!|)²#ò[±ÅE`‰¢A`—![#Ú[[±åU JI	¢2Â"Â’ o=Ò‘I’IÙ"I *¡²i¦JùP0!+#Z 9i!k#’¥  II±¶@`kK9Z!,#\)’¥! 

	 @,KÇÂE`,—!¹Ô% II±ÖPpku!ªK±Ä@Ij!k#e’r9¢II±V¶VçSçSö@	:!k#|#	 II±V·VÖVÖ–Qp	!5²#¢U PQ;i!Y#\9YY‘¥C`YjKi’2²’%¥ "âI 	’‘h’I "m?Â–X 	R B)U`)EMEM{¦9¡[i!Y#,9YY‘¥C`Yj*z!#ò·«”YÚ$Á±E`¬	£±«¡³úQp	y!5²!ÂU PQR‘¶Q 	y!5Â#ÒU PQR‘ÆS j;Â6¢§!ykÂÓ"‰åÀö& llÁæQpl–z—zšr0©§m=|:â5r%w"’L_²´#)|’ğ!ò%i"Ò'\"i©&I )!™ ©% àU àe ^áÕCÚÑ–ã¥.æ¥.§évSÚ‘	S‰i!#¢"Ji"*Bj Á¦`0KÆ°Dp*y	¢0’–&) _";}’ä&I 
¡F`}n–\;9!#}	”‘áB`z
9Â3¢•'ã#$B:’J}2>bO2 Y"<ñ—i<ùE0ÉQP[yI’6’¤#¶$× Z}Â’8’•)Ò”|2é% ’!ii‘–?–¦:i	²6’£"Ã o©' 	9’$kk±¦DkÉ"0Yi!)#9*Ò’#I"))‘’C)~j	’2²° Ç!*]²–’•	2©& )‘’K!;#‰. ;±£Gi!k#‰’ kk±¦GkÉ 0}j:²2RI’¶#y=B}’•¢’²—M¢ X &IZ’Ä$I¢‘
’¢•O¢++	°B+ÉD0+ÙP`+Ùcp;j9¢0’‘$	
’³&y.²—h¢ ’b’¤&=

	 @
™Bp
™V0
©a`jzÂ4â(’)¹!)É!’“zR 9"LLñ–iLŠT`oÙrPLŠDpI!	#
ZRK2- 	‘ E`o,Ò•!*¢³!µ$J<²Ô'O2‰# ’‘HR™#{©'jÙ$zÉ nÙ$z"Š  ’‘$I!é&—¢“ 	ĞU ĞE]—iNÓ•-¦<L§<ºF`»•]	SÊ*i	’!	Z²Â!Õ Ó' bY		‘P 	|Y!	²§$µ#Ã" 	‘ÀD`	!5’‘'  P	P	!Y#y YY	EYS•D`J²2ò$B9’¢#’¡%="Ù	° °B+‰@`+‰péÒpéÒC`º•8¦[‰pI!5’#) ¡!)  PI!5’#) ¡!9  P!j#™!¢    V j¡f£f§f¶”8¶”h³”*,	²0’p’8 Y'")
Â¶° °P ±àRpo³–m–m—m+!#M	¥ ©ÆI"©	°@³X§hYiº`·!;#©	° °S ;°C;NµóGp;‰`;‰U0<:²0’¡&L’Ö$	Â#"Â%’ñ!©•
–’•kÂ–#lZ°!l< ° °P °@	ŠG`‰ =µ°Z³°k)Y!y9’b;" ‘a‘aYy!+9’8"
 ," **¡’y¦’**Z	Ò–$-J¢±'.R 	[" kk	°FkEkù`kùUp—!*#™**¡’Dp*M–!5’E P	PIZ!#J9²r" 	 A¢ÁU`j[)²7¢’&-j¢Á!Â%.mR {" 	° °W {±wáñc0{Š`{ŠQpÙæb0z+9¢6’H"Ò%”&{"]BR |" jj	 FÉ°gPjÙG`jÙWpjÙ0z+9¢6’H"Â#”&<{"<B|R [" jj	 FÉÀcPjéC`jéSpjé0)i!	#Y)b 			@	Y	©!
#O"O *    P 
 pC© 
	CÉ 
Cé 
¡0
	§p£±
		£±
	£Á
	¶ğq£±‰’0ë°i£Á¹%pÉF`©!:#"©: #  S : sC© :	CÉ :Cé :¡S¦S£S7Œ S	£Á
:•1Ì S·ğt£Á™0¬°J£Áé@péV0Š"`Æ!Y#k )% U YuC© Y‘•u Y*‘¥U¥e‘µ#`¶!Y#n 	E U YY		Y9Y:’Å`¶!Y#O 	E U YY		Y9Y’Å`¶!Y# 	E U YY		Y9Yj’Å`¶!Y#? 	E U YY		Y9Y’Å`¶!Y# 	E U YY		Y9Yj’Å`[!K#l	°¢ ¹ã‰ ’	°D °T K°KY±Ôb`K¹R0K‹CP·!;#™	°C °S ;°;·ÓaP;M¶ó0·!
#‰	 @  P 
 
)
j °F 
=Æ!
# ) @  P 
 pC© 
¡P7‹  Q  d 
K¢Ğ`)y!L#©§$¹LLÁ”iÃ¤m§!j#©jj	 j§ÆS0j	!y#R y‘·F`jIR#eR" ‘#YR
R ¡"* 9Pe EUREU	e°P²PÁCÂC	iZ!9#—"•%J2; 99	C9I’£E`9Z	i!["
 		‘ E`[i	i!	#l) 		‘ E`[i*		¢5’¡!Nz´: gÂ¦ Z¡•!5’%B E!5’%R EY!9#	Y’¢%’9I!5’#) ¡!) EI!5’#) ¡!9 Ef!5’% P9!i:¢ bZ’		‘`‘ #`LI”!l II‘”%pI
J!*:¢ ÂII‘d—¤#`
×±!`+:IÂ0"%_\’<"*"\’÷&’²%’ Á D¹—^Ç°X*]â32R'K"<[2Rl 9àS àc >à“0”
àC?ç“yæ“yç“yã“yå“y	¤!m 

	 @
y§ R`
;¤!M 

	 @
I§G`
*{!#™$¢¶'© ’¥$lk 	Ğ! ĞQ ĞAÉbÑ¡[Õ¡<iÚ'0
j!:#;âåY Y
Â¶::	 C:]¦“H£“i
[!Y#i9¢± 
 )’	% U Y‘5	Y{–Å"0{:—h9
{!M#™#¢¶'O YJÂ¶	Ğ$ ĞT MĞDMùb`Mš@Ö¤iÓ¤+j,¢5’—#;âÖy~’÷%l‰ %  U Z EZS õF`]™s¦•l¥•}—!‰’Z kk±¦BknY!;#–#™¢' ²;±³@Ii!I#;9Òr" II‘äW`I‰Apf!6âV `yL!i#)’¥!³ Ç  V f i–0”
FiY—¦v0i–¶•0Š )I!5’•") U PQYQ	!9#Ú$â9‘£M	!iY" I E	!iY" 9 E	!iY" E	!I9" 9 Eu‘7	!i9"  E•A	!"kJP E5!i9’’E)!iY zJ U PQ	[!iY 
 Pe uE•Q •aPyt‘—P v!+#k +±R	!YY" 	 E	!iY" 	 U PQ—!iYÒU PQ	’1ÂÕ ç&
 gÂ¦ 	A
‘¡Tñ#`™–%`*	¢0’¡!^ )¢’`Â¦ 

	 @
\§à!0
N–	z!Ú£!ùMM	ĞDMéFÖ¤HÓ´¦!:#/ ::	 C:J¦ÓE0:Z
Â1Â‘#ÉÒ’ó#[‰#  Á‘}¦J¶KyÉ!{:¢ ’¥%™§%‰z°  °P °pC© 	CÉ ±p·p³pµp7Ì°p	£ÁJö´W0O<öÄcPO<7ÌğÄ“0ìğÄCp¹×dP¹çw£Á¹—(	£Á¹—L—{é `9!;:¢ ’¡% I $  T J DJGpJg0JWPJJæÔ`0NçäSPNO¶!J# 	 $  T J DJ§ä@0J>¥ô$`	!YY" y EY9!#)RYâÂ‘±F`|i9!. õ R/R U PQK	9!+ ±#U PQG•S 	i!=-R 99‘³R`9,–!=* 		‘À@`	)!	#<* 		‘À@`KYÂ1R&’“ N"]BZ¢À""]B>¢ÁQ¦IiÙ•å£–]™Spi!+R 
") Æ&EY)!*9’¢#ÂÕ9‘sÁ69)!z9’¢#’( 
¡pÖ¥F`!i9’’Ei! +²±II‘´ pI;—!‰” [[±õ%0
]	²72R'Z2Rk 9°W °g {°—0”
°G|·—¶—·—³—µ—	–!*"y U PQYII!5’‘#Y’U PQRjz)Â5’Å#”&É·'Â#Ä'’´%\\á–|Ã•oÆ•oç–]i{!}#Ù´'O 
JÂ¶	Ğ' ĞW }ĞG}Še`}ªCP}ºQÖ§\:²2²³#n¢’÷%.™&¹&z yÉ%‰!¢¥À *°’§ l+°&l i°" °R +°B+>i+>y+>µ’x“>^yéó`–>™CPé“{³LKIË¤IkjI¢3²±#mM’å#‰!¢•iÀ°’£ l+ ::	 C:]¦“)¥³i[!;9¢± 
 )¢	% U Y‘5	Y{–Å"0{:—hi{!}#Ù´'O 
JÂ¶	Ğ' ĞW }ĞG}Še`}ªCÖ§Ó§\L,i¢5’—#;ÒÖ!i’÷ ‰!¢•:À\°’•lÂ–  %  U Z EZS õF`]©q¦•M¥Åv!)#M )‘¢D`i!#,ÀÁ±D ‰ 099!/ 	’Jz0 k±v–(M–!5ÂU PQW ¥CE	i!5Â%’ U PQW ¥CEYI!y*’À I Ñ'U PQ*QZyi!#;9â£"} ·"ÁàW`ÙGpd!; EEY!	#IÀ		‘p’Ğ#`K{Y’5R& 	9Ri" 	
âÃ$‰$Â ’Y" U e Y‘U—UÆSÆSç’ç’<—!)#¹))‘òR`R#e’9Ri" ¡ Y 	Pe EURe T	JU Kc *9’3R&’‘ ¢Á'*}B.²ô&‰99‘S¶“<–y¹up©’;kÒ3¢¢$*\²â#ã%¢ğ'©%É$é™—oRŠ!£8â§Z"º Ê$§’8ú k›#´
¢³;¢³l’·/’Ü"Iì!ûá* :\Ò':ĞCĞS =zÖ“{—^¹‘y›¦¤ IU—LËf0•(çj‰–y—MYp—Mi0ÿ“¥yÿÃ iÿÓ–•L‰–‰•]IP‰¼”—ÈÁi0|M:r#–"§!Y">R"<[¢Ñ'â#%Âá'õ#’Ğ%’ğ'’ 9pG™£‘v¹T —K‘\`ÉµW ÉµGÙc°‘=)™ó– 9j)’7¢‘#’%*jR+’ ’°'yy	Gy–§Qp-Sp-	)9!	#	Y" [ 	‘@`f!5’E5d!{ Ffd!J E5iI!5’ !	{’m" U PQ
R:ii!I#;9Ò&¢r" II‘äW`I™Fpf!5ÂEuYJ!9#:9’¡#¢99‘³D`9Kç0çP	y|!y#Zy’¤&´%Ç% )W g y—0”
GyT yZ•Çq–ÇE0y	£¡	!YY" E— !9#‹9‘£<!YY²±!) E4!	 E	!YY" 9 E	!YY" E	!YY" I E	!YY" 	 U PQ	–!, i U PQ	—!+9’		‘ R`)!YY zJ U PQ	Z+²6’·!‰ä 	o¢’`Â¦ kk	°Fk±ÆT°–£+**	¢0’¡!N )²’`Â¦ 

	 @
L§à 0
>–z7!j)¢E	9!#-". ‘¡F`{J	9![#-" [±¥F`>J9!m õ R/R U PQYZ!y#Zy¢Â"Õ! yy	GyZiy•×A0Ii!	#[KR<2- 		‘ Q 	,i!{#‰´" {{±§R {‰A0)	²6R&’ }
 ¢: k±VÖåE`i!#|ĞÁÁA ™%0zz)Â5’Å#	i¢{"<’À'’´%\\ñ¢Ã¥Æ¥÷¢<y{!}#Ê³'‰¢ $lk 	Ğ' ĞW }ĞG}úd`}«BP}»PÖ·LkjIÂ7²±#nM’å#©#¢•jğ–À’£ l+ ||	ÀG|]Æ—*ÃÇi[!;9¢± 
 )²	% U Y‘5	Y{–Å"0{:—hy{!}#Ê³'‰¢ $lk 	Ğ' ĞW }ĞG}úd`}«BÖ·Ó·L,,Yò#;âÖ!i’÷ ©#¢•;ğ–]À’•mÂ– Ğ! ĞQ ĞASĞñF`‰‘iédP!0v!)#N )‘¢D`99! 	’z0 k±f––!"y U PQIyi!#;9ò¦"> ·"ÁàW`¹Apw!N)Ò[±ÅG`!Y9’’Ei![#¹‘ [[±¥G [é'0)!9’:" EE”!Z U PQy	R#• ”#¥ *R E•AY9!Â"Â’YJ ‘ÁB`=,99!9#>"}	°9‘ãC`oni!	#:y’		‘U 	:\yÒ1¢·%Éó"¹&¢•\à–n’•/Ò£(’§yÂ¢.’Ë'Ië$ ’%ĞQ Ğa Ñ¡:ã\P½¡\	0ÏA`½¡iÏapYy!
#."?	 ±i 

¡¦-¹“i¢8"Z,ĞÓ'{‰$ù‘’+Š [š$ ’¦Y¢¤+’;ê!=‹%J«"¹±}²µ?ÒÃL¢Ç¢ÆR¼#
Ì$z"ü J%¹ÒK²Ô i")!KÜ&Ç¢Ã~ 
ğR ğb /ğB/šq`/ªeS‰ğ¢O5åĞ;I5åğÒ4ÅÍA) Ïà–Ü—	pÉ}É’1¥Ïà_6•Ïğ5åğ‰<4Å ;Y’5¢•'zÒá$‰#_©"K¹",É!—Lr Ù YñâV0YéG`šÀC`Y«pp»µePŒ&M^*Â2R&yI¢¡#¥&µ Y’Ç&:]’y"ª“,¢“RÙ$]ù Š") "iÀR ÀB,U`,Epnjæ¦Fp©‘U`©‘EpÙµT`š¡w0Ù•l×,Ö/	pÎ7;i’1R&’Y^R¢“R ©”~²“Â¢xR §" ‘Qæ•Rp+¹F`ºÇQpŠ”¶MKiK!
’¢ YzÂÇ' 	 P  ` 
 @
T 
i§ w0
	Y!	#}I 		‘@’ÀE`9i!Y#
òÁJ Y