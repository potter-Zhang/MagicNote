// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Glue code between CodeMirror and Tern.
//
// Create a CodeMirror.TernServer to wrap an actual Tern server,
// register open documents (CodeMirror.Doc instances) with it, and
// call its methods to activate the assisting functions that Tern
// provides.
//
// Options supported (all optional):
// * defs: An array of JSON definition data structures.
// * plugins: An object mapping plugin names to configuration
//   options.
// * getFile: A function(name, c) that can be used to access files in
//   the project that haven't been loaded yet. Simply do c(null) to
//   indicate that a file is not available.
// * fileFilter: A function(value, docName, doc) that will be applied
//   to documents before passing them on to Tern.
// * switchToDoc: A function(name, doc) that should, when providing a
//   multi-file view, switch the view or focus to the named file.
// * showError: A function(editor, message) that can be used to
//   override the way errors are displayed.
// * completionTip: Customize the content in tooltips for completions.
//   Is passed a single argumentâ€”the completion's data as returned by
//   Ternâ€”and may return a string, DOM node, or null to indicate that
//   no tip should be shown. By default the docstring is shown.
// * typeTip: Like completionTip, but for the tooltips shown for type
//   queries.
// * responseFilter: A function(doc, query, request, error, data) that
//   will be applied to the Tern responses before treating them
//
//
// It is possible to run the Tern server in a web worker by specifying
// these additional options:
// * useWorker: Set to true to enable web worker mode. You'll probably
//   want to feature detect the actual value you use here, for example
//   !!window.Worker.
// * workerScript: The main script of the worker. Point this to
//   wherever you are hosting worker.js from this directory.
// * workerDeps: An array of paths pointing (relative to workerScript)
//   to the Acorn and Tern libraries and any Tern plugins you want to
//   load. Or, if you minified those into a single script and included
//   them in the workerScript, simply leave this undefined.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  // declare global: tern

  CodeMirror.TernServer = function(options) {
    var self = this;
    this.options = options || {};
    var plugins = this.options.plugins || (this.options.plugins = {});
    if (!plugins.doc_comment) plugins.doc_comment = true;
    if (this.options.useWorker) {
      this.server = new WorkerServer(this);
    } else {
      this.server = new tern.Server({
        getFile: function(name, c) { return getFile(self, name, c); },
        async: true,
        defs: this.options.defs || [],
        plugins: plugins
      });
    }
    this.docs = Object.create(null);
    this.trackChange = function(doc, change) { trackChange(self, doc, change); };

    this.cachedArgHints = null;
    this.activeArgHints = null;
    this.jumpStack = [];

    this.getHint = function(cm, c) { return hint(self, cm, c); };
    this.getHint.async = true;
  };

  CodeMirror.TernServer.prototype = {
    addDoc: function(name, doc) {
      var data = {doc: doc, name: name, changed: null};
      this.server.addFile(name, docValue(this, data));
      CodeMirror.on(doc, "change", this.trackChange);
      return this.docs[name] = data;
    },

    delDoc: function(id) {
      var found = resolveDoc(this, id);
      if (!found) return;
      CodeMirror.off(found.doc, "change", this.trackChange);
      delete this.docs[found.name];
      this.server.delFile(found.name);
    },

    hideDoc: function(id) {
      closeArgHints(this);
      var found = resolveDoc(this, id);
      if (found && found.changed) sendDoc(this, found);
    },

    complete: function(cm) {
      cm.showHint({hint: this.getHint});
    },

    showType: function(cm, pos, c) { showContextInfo(this, cm, pos, "type", c); },

    showDocs: function(cm, pos, c) { showContextInfo(this, cm, pos, "documentation", c); },

    updateArgHints: function(cm) { updateArgHints(this, cm); },

    jumpToDef: function(cm) { jumpToDef(this, cm); },

    jumpBack: function(cm) { jumpBack(this, cm); },

    rename: function(cm) { rename(this, cm); },

    selectName: function(cm) { selectName(this, cm); },

    request: function (cm, query, c, pos) {
      var self = this;
      var doc = findDoc(this, cm.getDoc());
      var request = buildRequest(this, doc, query, pos);

      this.server.request(request, function (error, data) {
        if (!error && self.options.responseFilter)
          data = self.options.responseFilter(doc, query, request, error, data);
        c(error, data);
      });
    },

    destroy: function () {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }
  };

  var Pos = CodeMirror.Pos;
  var cls = "CodeMirror-Tern-";
  var bigDoc = 250;

  function getFile(ts, name, c) {
    var buf = ts.docs[name];
    if (buf)
      c(docValue(ts, buf));
    else if (ts.options.getFile)
      ts.options.getFile(name, c);
    else
      c(null);
  }

  function findDoc(ts, doc, name) {
    for (var n in ts.docs) {
      var cur = ts.docs[n];
      if (cur.doc == doc) return cur;
    }
    if (!name) for (var i = 0;; ++i) {
      n = "[doc" + (i || "") + "]";
      if (!ts.docs[n]) { name = n; break; }
    }
    return ts.addDoc(name, doc);
  }

  function resolveDoc(ts, id) {
    if (typeof id == "string") return ts.docs[id];
    if (id instanceof CodeMirror) id = id.getDoc();
    if (id instanceof CodeMirror.Doc) return findDoc(ts, id);
  }

  function trackChange(ts, doc, change) {
    var data = findDoc(ts, doc);

    var argHints = ts.cachedArgHints;
    if (argHints && argHints.doc == doc && cmpPos(argHints.start, change.to) <= 0)
      ts.cachedArgHints = null;

    var changed = data.changed;
    if (changed == null)
      data.changed = changed = {from: change.from.line, to: change.from.line};
    var end = change.from.line + (change.text.length - 1);
    if (change.from.line < changed.to) changed.to = changed.to - (change.to.line - end);
    if (end >= changed.to) changed.to = end + 1;
    if (changed.from > change.from.line) changed.from = change.from.line;

    if (doc.lineCount() > bigDoc && change.to - changed.from > 100) setTimeout(function() {
      if (data.changed && data.changed.to - data.changed.from > 100) sendDoc(ts, data);
    }, 200);
  }

  function sendDoc(ts, doc) {
    ts.server.request({files: [{type: "full", name: doc.name, text: docValue(ts, doc)}]}, function(error) {
      if (error) window.console.error(error);
      else doc.changed = null;
    });
  }

  // Completion

  function hint(ts, cm, c) {
    ts.request(cm, {type: "completions", types: true, docs: true, urls: true}, function(error, data) {
      if (error) return showError(ts, cm, error);
      var completions = [], after = "";
      var from = data.start, to = data.end;
      if (cm.getRange(Pos(from.line, from.ch - 2), from) == "[\"" &&
          cm.getRange(to, Pos(to.line, to.ch + 2)) != "\"]")
        after = "\"]";

      for (var i = 0; i < data.completions.length; ++i) {
        var completion = data.completions[i], className = typeToIcon(completion.type);
        if (data.guess) className += " " + cls + "guess";
        completions.push({text: completion.name + after,
                          displayText: completion.name,
                          className: className,
                          data: completion});
      }

      var obj = {from: from, to: to, list: completions};
      var tooltip = null;
      CodeMirror.on(obj, "close", function() { remove(tooltip); });
      CodeMirror.on(obj, "update", function() { remove(tooltip); });
      CodeMirror.on(obj, "select", function(cur, node) {
        remove(tooltip);
        var content = ts.options.completionTip ? ts.options.completionTip(cur.data) : cur.data.doc;
        if (content) {
          tooltip = makeTooltip(node.parentNode.getBoundingClientRect().right + window.pageXOffset,
                                node.getBoundingClientRect().top + window.pageYOffset, content);
          tooltip.className += " " + cls + "hint-doc";
        }
      });
      c(obj);
    });
  }

  function typeToIcon(type) {
    var suffix;
    if (type == "?") suffix = "unknown";
    else if (type == "number" || type == "string" || type == "bool") suffix = type;
    else if (/^fn\(/.test(type)) suffix = "fn";
    else if (/^\[/.test(type)) suffix = "array";
    else suffix = "object";
    return cls + "completion " + cls + "completion-" + suffix;
  }

  // Type queries

  function showContextInfo(ts, cm, pos, queryName, c) {
    ts.request(cm, queryName, function(error, data) {
      if (error) return showError(ts, cm, error);
      if (ts.options.typeTip) {
        var tip = ts.options.typeTip(data);
      } else {
        var tip = elt("span", null, elt("strong", null, data.type || "not found"));
        if (data.doc)
          tip.appendChild(document.createTextNode(" â€” " + data.doc));
        if (data.url) {
          tip.appendChild(document.createTextNode(" "));
          var child = tip.appendChild(elt("a", null, "[docs]"));
          child.href = data.url;
          child.target = "_blank";
        }
      }
      tempTooltip(cm, tip);
      if (c) c();
    }, pos);
  }

  // Maintaining argument hints

  function updateArgHints(ts, cm) {
    closeArgHints(ts);

    if (cm.somethingSelected()) return;
    var state = cm.getTokenAt(cm.getCursor()).state;
    var inner = CodeMirror.innerMode(cm.getMode(), state);
    if (inner.mode.name != "javascript") return;
    var lex = inner.state.lexical;
    if (lex.info != "call") return;

    var ch, argPos = lex.pos || 0, tabSize = cm.getOption("tabSize");
    for (var line = cm.getCursor().line, e = Math.max(0, line - 9), found = false; line >= e; --line) {
      var str = cm.getLine(line), extra = 0;
      for (var pos = 0;;) {
        var tab = str.indexOf("\t", pos);
        if (tab == -1) break;
        extra += tabSize - (tab + extra) % tabSize - 1;
        pos = tab + 1;
      }
      ch = lex.column - extra;
      if (str.charAt(ch) == "(") {found = true; break;}
    }
    if (!found) return;

    var start = Pos(line, ch);
    var cache = ts.cachedArgHints;
    if (cache && cache.doc == cm.getDoc() && cmpPos(start, cache.start) == 0)
      return showArgHints(ts, cm, argPos);

    ts.request(cm, {type: "type", preferFunction: true, end: start}, function(error, data) {
      if (error || !data.type || !(/^fn\(/).test(data.type)) return;
      ts.cachedArgHints = {
        start: pos,
        type: parseFnType(data.type),
        name: data.exprName || data.name || "fn",
        guess: data.guess,
        doc: cm.getDoc()
      };
      showArgHints(ts, cm, argPos);
    });
  }

  function showArgHints(ts, cm, pos) {
    closeArgHints(ts);

    var cache = ts.cachedArgHints, tp = cache.type;
    var tip = elt("span", cache.guess ? cls + "fhint-guess" : null,
                  elt("span", cls + "fname", cache.name), "(");
    for (var i = 0; i < tp.args.length; ++i) {
      if (i) tip.appendChild(document.createTextNode(", "));
      var arg = tp.args[i];
      tip.appendChild(elt("span", cls + "farg" + (i == pos ? " " + cls + "farg-current" : ""), arg.name || "?"));
      if (arg.type != "?") {
        tip.appendChild(document.createTextNode(":\u00a0"));
        tip.appendChild(elt("span", cls + "type", arg.type));
      }
    }
    tip.appendChild(document.createTextNode(tp.rettype ? ") ->\u00a0" : ")"));
    if (tp.rettype) tip.appendChild(elt("span", cls + "type", tp.rettype));
    var place = cm.cursorCoords(null, "page");
    ts.activeArgHints = makeTooltip(place.right + 1, place.bottom, tip);
  }

  function parseFnType(text) {
    var args = [], pos = 3;

    function skipMatching(upto) {
      var deptğ@8ä7…y~p[Xî·„E~pGXëÉÂ1?x$\öƒ‡ÂY?x,ÜòƒkÂK_¸.¼÷…Â7_¸,œõ…+Âe_¸*Üò…h¸W5nÖ8/jœ…äç!¥ÆIˆ©qkœ‚„g ©F¿hÒZşÛÄ@şåÄ şÖD_şì„5üÙ‰‹ù[üøË–ğ'¬æM\ÅoŸ¸’_;qï?a¿hâRşåşÛ„eüû	ËùyòÛ'øğ‡&xó»',âM¸Ìöl„+ìøF¸ÄVl„$¶y#agÀ…]
€áìy Œ`ï`{ CÙ É¾À(67ªˆÛ ª¸q\á¶¾Ì…µNâZ_â¼[_ä¾´ú›{Şj;çİ"’hÁ-k±ƒÛØb'Öbw°E·«E4ßb7w¦Å^îF‹=Ü¥û¸-ösÏ[ä¾´8À½kÃÍm¹k~»Ñj#w°ùnWó.¾ùyîL«sÜÁVg¹°VÿpgZ'r­ÎpŞ­pa-ã¹ƒ-r»Z&pñ-qgZàn´<Î]jy’{Ğòçİ2hË-ky˜ÛØrÔü4÷¥åVîyó0îKómÜ»æáÜÜ›¸3ÍOqÏ[†r7šoæ.5ßÂ=h.J«b@’ÖÅÀ¯Ü×z‚4?*q¯ëUáöÿÉIoBenëŸLZ ]=¿s«ÿä¥Y1@¥ÿÂoÜ‚?—	şa¾pm>Ì¢çC˜êÛ…½Ş.DzÃÁÏ¶	ÁŞ°UXé›„!Tğò†ÍÂLoğŞ,€õÂ…"¼^…Ça­pb!WBp~!¬"B€·V{±÷VúÂß‚—/\>.‚óÂãEpN¸ºÎ
'¯pu$
{Á"!vœBÁiaå"ğ6- oÁgDqŞ°DX°„8X(¼›^Bâ|Ø'Ìôƒ‚Ÿ¼|à°Òâ„Pˆ‚}àˆéBÜ|ğ¶Î‡xa¯,Í‡Há„7D	W½a§pŞv	w¼a·ğÚ¢…ÇŞ°Gøè§¯EpRøèË…Ğ…pBxìÇ…«>pL8áşBğB$-i{<‘6ÅÃ`im<•vÇCéåQp’æÅÃ@éÛQ ½?
ÎÒ¢xè-;
ı¤[G¡¯tù(ô‘Î…¿¤‡GÁMúã¤E	0Vš— ã¥å	0Jºc¤—ñ0Zz®Òûx&Š‡ÒÙx.‹‡‘Òåx8ÉVo€ìÁHdû7ÀYvdüÍŞl€3lç8ÇNm€óìÊ8ÅÖo€Ólë¸È¾m€RRb,”—Rb¡œô"*H_c¡Œt3JKI±PVJ…‰üÂqY¥{1Eº¤-1Y:™¤}1QÚsØ¿kaÛ¹¶°õë`+Ûº³{A°Š­†5lg0¬f[ƒ!€í†¥ìß XÂÁ2ö	Çlv0¬`K‚a9[+Ùê`dG‚!„Í^›Ù’u°‰-X¡lõ:bÃZv*‚Ùµ`XÇîÃöo0¬gOƒa#ûlvø°#AàËş‚EìTø±kAàÉ–Á<¶ ¼Øê ˜ÏÖÁB¶3°­AàÍöÁlöt-Ìb÷ÖBÛ¿æ²Oká;µbØ‘õËş^ØÎõ°Ÿm]ÙşõÇ®­‡ìp­`5ØP¤&(R¶©QEjÁÑ"¿ÂçÂU`i‘Ê°°Èo0§HUXSä_òÅ!…,s|G¼ß’¹ïI€ã²Ññ9èøÙåø‘„9~&ñ™àfçäŒÃ+òÀá%¹áğ‚\rxM;¼!ïªr§şÌ÷İ#_òKP@„exp„·…2@t¬Z°8¬)\6.Û
—†¨Âás¡¢°°pa˜S¸,-œ.ÊGå¨B¹aC¡Ìğ¾ÀrÆñ¹áø•\r$ğÀñ1	sxJ:<!»‘x‡œ0§Px[0øÌKUã®ü™âÜ's’É2‡ÄÛá!	pxD6:Üdî!p‹­»,2î°Ğ¸Í‚Càv{#Ü`6Âuöj#\c6ÂUve#Lâ7›ÆŸçÉ¿?¿;~ï5~6¿nüd>vœÿyü|ŞkÂLşÕ¸©üñqÓù+ãfğ·ÇÍá÷wçóà/ŸË?yÂ@áğ<p.Ì'áä<$ü3†OæÁ`áî<pŞÌƒ¡Âó`¸0ß†	³<a„°ØF	ë<a¤°Ê®Ñ5ÎOéÒÁOèœÁéÛA‡èšèıAY¹WuöÃíj‘°¥êNØWuì¨*q±u2qWêdáÕÉÌİ®“‘;W'w¼Î~úhÀA:kàún@]4ğ!½8è
ãœLz@£İ§İ£K]¥ÿ¡KcièÀ8=ğ$]êt†ns:K8%Ò(§ÓtƒÓ)ºÆé<=ítuú›^wºKçº@/:í£×\¦ŸîĞ·ÎIô­Ómzßy/M°‡Æ8L¼E/:ß¤G¯ÓÎ7h”óEzßé}æt„^x”ŞxŒ~x‚.t:Nç8%Ğ·ãé³İèı]éÅ]èÑiTNt[tMtaöôs÷vôY÷?éÅnõéõnméõîéÛnÍéœîMéçné³nèınĞİÚĞÓİ[Óİ[ÑmİëÑÓİjÓõİZÒ5İëÒ£İZĞ…İ;’x1„¤dï@öˆÉ£ìíÉVqù'{;(®'§³·!sÄ`‘½-ñ×‘˜ì­È¶–,ÍŞš¼gAd]öÜÙ¦¸İMÆq›šÌç5Ë­m2ÛŞÄ‹;ÔÔ[ŞÄ“Ûİtw¥ÙjîQ³•Ü¹f®Ü¢&c¸yMFqß»sßšxp›šÎâ5ÉÍk:›[ŞtÑl9ÛÌŸÛÓlw¼™w¹ñ0îaã¡Ü­ÆÃ¹—çqÛ›àŞ7Ã­m:•»Õd:÷²É4îa“Üû&¾Üû¦~œo³%\P³ÅÜŠfK¹ÍÍœ¹İsÇâ5ÂmÀ}h¶†{Õl!w¹©÷°©7w«é"îeÓ@Î½yçÛ|-çÙ<˜[Ñ|"w¨Édîl“IÜ±&S¸ËMªI‰qğ»¿H>qPSJƒêRRT–¢ã ’äµ¤qPCºU¤˜8øU
ŒƒÚRJT•âà7)$*JqPGò8H_ã`
»ÓÙ·@˜Äba"‹„ÉìT Lcoa*{ãYp L`¡0“\3ØŠµĞ…iÔ‹nÔ•oÔ‹iÔ“KlÔƒKhÔ‹KjäÄ6ş‹ûÚh çÓ¸?çÑx çß¸7w³Q_îE£>\r£~\J£<Üæº8yª‡«fã>ÔÉÉùÖÍÍÕÍÅ­¨›ƒó¬›s¯»›î°ŞéN_÷£ûGĞ™¶ÓıwP¿‘Ôk@4°‹†ØIWˆ¢ÁBhdÿPz¢ÿVzµÿz¾ÿf×İÛ¿)	e9Ib¶f$šå&×³9ğ‡àß¯Î½şÓ‘9|¢ğÉ&¼`’0Û\…S0V¸æ	nÂß0N¸ç	„=a¼ğÔ¦K¼`°z>ÌÌ‡YÂ'/˜)<õwášÌNyÁta¿Œ¶xÂ4a«LV{Ááˆ'd—æ‚œÒÒCCZxòJQ‡ Ÿtàä—‚<Ò¶C[ÚprIkA6és´ä6lÍiØŠ‹oØ{×°=÷¼aGîKÃNÜÜF%¥„X(!ÅÄBain,‚BÒ—Cà(=8¥w‡ ¸´1ŠI±PTZE$ïXpn‚Îœw£vÜƒ†m¹Ûp—¶àv5üMœ»*‹Ë¶Áï¢÷6hBÖ°Õ$6[„}ó ¿°côVÍƒ¿„-ó Ÿ°nôfÍƒ>ÂâyĞ[˜?jGæÀÂ¹9PKˆ
3çB}Ák.ÔBç@7!Îê7æ@=!e4üæBwá„4VÎ…ÂUè,„z@Wa¯t"= “ì…•ĞZx<Ú	3= ­ğq.tü< ½àåm„×s¡‘<š‘s¡±:š
{çB3!n.´ÎÏ…æÂ‰¹ĞJ¸3Z
WçBOá±4 „åÄ3[}rMğ'ÿe-Cüé$r1SiâE'’„L5É¿¼™Ÿõ²Jğ#QYkoÁ—„d­C6	‹Éá¬µˆ»°ˆ¬ÈZ—D	KÈ¹¬HP¾Ûäïü5H2ïM>g)KÖÓÉän¦ªäïAæg©BvğsÉçÌÕÈi~Y‘¥2ÙÈÏ!/2—$/¹ñdK¦âä7–ød*FsnÄ=S)ò™›@öd*AîrãÈšLEÉ~Î•¼ÉGÜsOà_ı…Ü§3ÈæÌ¿’¯t&9š¹yMİItæßÈ~¹ùw²‚ŸMng¾Höå»K^æÿ›„å»Cîä?G<òıC¼óŸ%ó^%ßòUÍ‚?¸˜úÕ„›³¡‚p{Ô|ç@%áÃ,¨.¼Ÿ¿	+gCeaçlø]™U„ØÙPŸÛŞ œpn4æ4ø“óoPûR¿w©Aî]ƒªÂ™ÙPƒ›_¿·¡~MnyıÚ\dıºÜıúu¸SõÜgCCîXƒ_„W³ ¼pe4àv7XB—ô[GÏüµ‘®èDWÿµ&ÿL£şÚ@¿ıHü@gÿµ˜zô[Jƒú-£aıÖÒ%­¦ÿö[EŸös—–œ€5RìX%ùœ•Ò»Ó°ZÚtfJ«OÀiÁ	X+­<>’ß)ğ–¼NÁBiæ)X$m<ó¥{'`ôñ$IOO€‡täxJŸ€yÒ©à%];K¥3§Á_ºq–I—NÃréÁiX!=?³¤õ'`´óÌ–¶€¹Òşà+…†ÅÒÁÓà'í:K¤øÓ°†~ê·’^è·‚ìçO÷õ[N÷{)Fï‡bÈ~x&zì‡ç¢ÿ~x*¦ìƒ'bò>x,&íƒGbÂ>x(Fïƒd1d<ı÷Á}Ñcì=¢á èDŸh8$†DC¬1b`4œ}vÃ=1e/Ü“÷Â1i/ÜöÂ-1z/‚£Õc`kõX¸Qı ,®^„ûP··¢^I.¨^)ns½Ò\D½2ÜzE9÷zÅ8ÏzÅ9ßzy¹ˆºÜ¹º¸+ur·ëâÕ-Ì½ª›ÛS7?[×;^÷¦²nˆş{áºè±®‰){àøb?øŠá;a©˜¸–‰I;Á_¼¹–‹É;a…øb'ø‰Ñ;a±³–ˆ	;á1y¬c¢ D¼›Ää(Ø,¾ˆ‚P1%
¶ˆ_£`½˜ÄÄ(Ø(&EÁJ1e'ˆşQ(FÁZ1$
‚Äğ(££`•øu'¬=¢`è{Å”]pULÚûÄ¯»`§˜°®ˆ	{`—˜´¢ÄÄ]°[LŞ{Ä» Z¼¹.‹Ñ{à_ñæ~x#&í‡$1d\ı÷À[1y?¤ˆ)û!^LŠ†cbr4_DC‚x3Nˆ)ÑpJôØ'Å¯ÑğZLÜ¯Ä„ıpQôØ‹)»á‚˜¼Î‹I»!NŒ†#bB4c¢á¨˜[E]°]ÙçÄ„İ&úï‚m¢Ï.ˆÃwA¸¸vˆ1» RŒŞgÅèİ(†ì†3¢ÿn8Æfo€ÃìŞzˆgÿ®‡£ìézH`ŸÖÃq¶`œ`Kğ-¹’»¬;Ê³ ´4J	¾³ ¤à>J¯fÂß|ÄÔK|ìÔ‹ü©Iüñ©Å…Û3áÿjêŞ}ÚuşÃÔ›¼ç´Ëü¹©WùÛS¯ğW¦şÃ?šZL87Š
±3¡ˆ1
A3¡à;šq«f|İ!‡äÙ…îSØìù„sîà Üv‡üÂwp¹C.!Âò±î[Øãy…ãîğ?7ı#{úşÊôÿøGÓ¿ñ¾3@šA„38aóŒOü«é_x÷ŸùÓ¿ò3¨1CbgğÂL8>#“ğjFÁİ2fd<İAÎÍÈ Ü!	WfdÍhÊù4,(¸Ï„§ü«iÏy÷éÏøÓ^ğÓÿå#¦¿ãc§¿å÷LOáOÉûNÍMÅ¯˜ş†ß<ıï;í4í6¿bÚ]~ó´Â+wxÈŸ›ö˜¿=íeÚşÑ´{|Ä´|ì´ûüiÉüñiõHœğ'I–‘gY—’›Y[s,€|ÈÖœakÈ“l§øWSbøSöñ&ïå_Må7OÙÏ»O‰ã#¦ä}§á÷LIàOIä=§áİ§å}§^à7O=ÏM=Í˜r€÷œrœ¿2eÿhò9~ÅÔ8H©~”rŒ?7å$ÿhÊ!>hÊ	şö”Íü£IÛxÏÉ[ø“BùW“¶òî“wó·'‡ñ¾“×ñ{&­çc'màO
á¯LÚÈŸ›´‰¿=)˜_;i';ynr|r4er8¿br¿yòv>hò~ÏäH>bò.8Y5k‡ğÇ ¤Æ	ˆ®q¾V?
>5€Gxğ¯Qÿ8ª.ÿxTşê¨?ø£~áCGÖæ÷ú•ß;²9ò7>nd->tTM~å¨¼×¨²ü«Õù#çOŒ¬Â_Y™??²*gd9Şkd5şñÈ
üÊ‘åy¿‘ùà‘¥Ç‡¡¡tõ0ô”v…Râah$İ9¤;G ©ôñ0t—V…n’ßQè*y…Òù#Ğ^:q:JW@k)ô´•ö6Räh'Å&ÒëÃĞBò;Í¤™G ¹äuZIÁG ¥´òü)m9õ¥]‡¡®´ö0ô’ö….ÒÇ#ĞYz|¼E¿°PôÚ	>âÊ°HŞ	ÙÈØÇªÎ½ÇùÖÎ³åVÔá¹ :Œ‹¨#p›ëˆÜ:ÿALíÏXû+Ü¬ı’jƒKÉµ?ABíªô`§’ôA‡ôF‡Rôy‡2ôK‡Òô]‡²tnÇjôL§ôF§êôR§šôA§Zôy§u’W—õÒ»N¤e]3Ñ€öYhXûÌtcû¬tWûlô`ûôLûì4¾}Nz©}Ö©2èô;õîôıÒñWú¼c%z£ã/ôLÇŠô`Ç
4¬cyĞ±õîX€t(DÃ:¤;¦»:¡;£g:¥ñŠÓKrÑíóĞçísÓíóÒwíóÑ/í¨w‡ütnGº¬ÃWnW;BãÛ}ã¶cô];‰Îm/Ò/í2Òeí3Pïö@Ï´ãè¥v<}ĞÒíú¼İ.¬İXVíÜ¬õ
^Ôz	Éµ^CJ­'Së$Öz
	µCR­ÿ¸»m?qŸÚ¾ä>µyÃ-iûš[Ğö7»í¿Üê¶¸ãm?sKÛ}ä.µİáÕR °ö¯ıBj„èÚoàk­·àSû_ğ¨ıük¿ç¶}Èíoóœ{Úæ1wªÍ#îH›'ÜßmŞrëÛŞâ>µ~Æİks‡[Ğæ67»Í]nI›nGÛ{Üê6/¸Û<à¶¶¹Ï­o“Ìíls»Öú)w­ÍîiëëÜ½Ö7¹[O”ü ñ	0Yºq&HO`
¿6&I»Áp˜q(ñÍèBfe,@şƒd[ÆäJO’e>9œ¥:¹Ê/$/²x‘¨,GHD¢|Äˆâ|ìˆbü%øã#JòçF”æo(Å_Q†4¢ ï;¢04¢¿bD~óˆ©ÒÆã0]z|¦H³Ã4éØq¸Ivç¿NBóŸ'Kòİ"ñù¯‘ÕùÓ¦b…’lÙÄ¥Z6NµlÚ"[6í“-›vÈ–M‡eË¦Ï²eÓ=Ù²i™lÙ´_¶lš¿D1\¶lš¿	^²-²eÓ>Ù²i‡lÙtX¶lZ%[6-–-›ÖÉ–MÇeË¦u²eÓ*Ù²i±lÙtR¶l:)[6=‘-›ş“-›ŞÈ–M³6Ã;ölÙtA¶lº+[6”-›È–MÿÉ–ModË¦Y›àûG¶lº [6İ•-›¢dË¦[õ*rë•ã.×geË¦·²eÓÙ²éó:ˆ`÷eË¦ë²eÓ3Ù²iÍzØË¶É–MdË¦¥ëa[¸0Ù²)Q¶lº*[6½’-›¾È–M/ëb1ÿ'ĞÊ¦e •Mó@+›ÖV6=<Ë   ÿÿÛUXËû5àY“¯İİ½½íÂîîîÎ½íTº»»CºAA)Å@0PTÅÀöûÿ¾9³y¹Öu/f¶ÁÕ­·cUëmYÉz–¿Şš¥®·baë-™Ûzf¶ŞœÕ­3cUëLYÉ:–¿n/Ë\³Ÿ­ÙÇò×`%k¶³?«w2»5;˜Ùš]ÌmÍ*æ¸Ú˜¥®3baëV2“Õ'™ßÚ£ìÏšãÌní1f¶ös[{•¯9ÌjÖbUk°º5kYìjCæ¶nK]mÀÌÖé³ºµ»™ßšÿXìšYØš=,uÍfV¾z+«Y½…U­ŞÆêVŸaUkO³’µ§XşZ=–ºV—…­]ÍüV¯aa«×³ÌÕYÑê,õ&V²º	J;öÇÇÎğ£óß0êò¬ºôÁíÎ}ñ¬ó_xĞ¹^wœ;0w ğîÀÕ!NÃãó¨'0]_£*‘<ú%rGWáâèj\ı6£+à2ú9BF?ƒÏèˆ]—Qw2ê6|F•áî¨‡x1êz„·£î"zÔ=$ºÜQ%¸8ª×Gåµ‡ğŠÃ‡yñáy<ğÀ!sxO80ŸGXÆ+¬àµ–óWVòïò´‹xÎ%¼øÀb^x`)/;p'>ÀOä‰û÷sÇÃû¸áá½¼öĞ^qè?^|è_sh7O8´‹ÚÉíà†‡&pÏıÛyíÁUÜğàîxp5·<¸‰çÜÂ‹næ…·ò²ƒk¹çÁu<ğàpp=8¸‘§œÄsöoã§ğâı“yáşYÜğÀîx`6·<0—{˜ÊËöOãûgğÚıÓù«ı3ù÷ıëå5o¬–Ÿ¼0^şñÀiæ‰U²ÊËe¦ÖJOol/¼1QÚyb…,ñÂ$éæ‰•2ßKd˜–ÉT/,•±^X,ı¼°HºyaLôÆYå‰ùò'æÉ:O,”v^X Í¼0WÖxb²ôóÄTë‰)2ÌÓdª'¦ËLOÌ”E˜!ó=1[–{b–,ñÄiàÄŒî%iõ;“ ºŸÜ«ß‰8Ó}äJı.$† Ïë_%[ß%Û\'_Z—ïm®‘êÖ÷È›67ˆQ›ûÄ¼m[rÛÈızmH¶’Âz­Éy4%êµ'o±ƒ|ª×<ÁvRY¯9Ù”ïnÈv7âi»óœİMxán;î®Ç=w×ç»ğˆİ‚[üG¹ç¿­¹á¿m¹ã¿m¸å¿-ø«İ­ø÷İ-yíîæ¼bw3^¶»™Ùlb¼vçßwIn¸[qËİ¿Yñ®?¬lá»À_ízËrwüdÉ»Ş°ä?XÈ®ïÌe×7f²ë+û¼³½Øù…İİù™åîüÄ’w~d!;k™ËÎÌdç{öyG{±ã»»ãËİ5Rİ‹Â•õ.
cÔ—(ŒR£0\eDa´ªŒÂDåÉ*&“Th4¦¨”hÌT£1UeDcººi*/3Ô½hŒU¿£0^ÙFcœ2Æå+€]ª.»ÕŸXü«ÌâğŸ²‹Ãå‡½Ê/ûTXö«Ø8lS%±Ø®Êc±CUÅb§ª‰Å•‡¥ª(ËUy–©’¬PU1X©jbpZùÅã˜ªŠƒ²‹ÇU‡SÊ-GUy¨°,R©1X¨bc°XeÆ`‰ÊÁãª&'T]Nª?qĞUfñ°Tö	ĞW±ñ0Rùñ0T™ñ0P©ñ0VEñ8¨2ãpHåÇá°*ŠÃlõ's”Yæ)·ÌUv1˜¯üb`®jâ±N¹Åb½ò‹Å‹*6¦ª<ª.›Tj,6«ÌXlQù±ØªŠb±JÕÅ`µúƒ5Ê,k•],LTI<ÌTU<f©ºhárC¤ö×‡Oÿ3°ïFıOáK?=T÷3@Dÿ“(ê§‹‡ıN §ßq$÷;†³ıÂ«ßØö;ƒ~‡ğ©ïATõ=€²¾ûq½ï>dõİ‹Ä¾{Úw%ñ×¢ÉıfëÉ;-‘D5_KîhñÄ¾ù[ï©m¾™ÖK%Ï›¯!ùZ1l¾‰¸ÔK!÷š¯&iZ,ùÔl#1¯—L®4_E¢µRÙlù¡%‘´æQ¤°Ù:òTK ¾Íƒa6¸î€šş’°ÿ`Û·¤´GÁüÓwBØßiQôAÕĞ8³Ç³¿ÿï%†E£`h"‡FàõHØŒØV¸>À~ÿXãõ€0˜iEâÑ‚„c&=?y.wŸı+‘ĞkîôZw=WÀ¾×|éµî½7áwïÍğï³i½7àaïE¨ì±= °Çb˜÷\Šk=âr³ŠÜÁ!„êAşˆ€«ƒü`7ÈºÃm n´CîßHèŠoÿ˜ãV<øÇœqñŸ0ık'Îşµ9}¶áyŸİ(üë_¼ùk<»‡e×Ù¸Ğ}"¢ºÎÀ½n3ñµÛT8v›†¤n“p£ëd¼ïz¤´J#y­2‰këbÚú"ùÒ*‹„¶¾@*[¥“{­tğ¬Ë¼ï2¿º4VŸÃÑDı
GSefÊ&Õ‹p4PÂÑH½ÇTb'=IB“)ÄPzà&“ÉgáN\›ô%qL—¼oĞŸ²SÄºa?r‘é‘ßvšx6ü®n_ ÑÊ/â—r¹ˆŸêÓüVQ§ü/à‡zsßTÚ|UÑ0PÙF¡½ºîÊ%=”O$:ªè E “zÎêsº*“HtQ¿"ĞMÙDâõ9=UH$z«äHôRÑ‘øKåF¢º‰¾êz$ú«G‘è§îFâoõ6Ô‹H4W.h©B"ĞBùD •Š@k•¶*7mÔÅ´S×#°œ˜jKÉNü›-!åê,ql¶Œ|S$¦YcR¬Âˆq³ÄI‹$šÍ&¤/1mÚE–¸¢›¬rEWYîŠî²Æ¤ÆÊrŒ‘Eè S]ÑIæ»¢£ÌtEgYä
™éÑ2Ö£¤ŸFJ;ŒÜ1\Ö¸c¨,rÇ0Yî!2Óƒe¬;zI37ô–vn$ıÜ1PÚ¹ãùÇË7ånè/‹ÜĞN†¹¢•4sE?™é†6ÒÍ­¥+ÚJ?W4”ö.h/c]ÑGº¹¡‰¼ä‚¦ò¡zÈ:WŒ“5è)ÿ¸¢¯ŒuC3Yå‚²ÎÍeZÊ?.h,#\ğ—ôsCiî‚úên8jÅ9G|Yø$®8¢Fø;â½8ëˆ"ÎwEš=4ùÒJŞw†”Wœ!ä9gpyÖLº;ã•øê€7ÂÜ¯…¾#Ş
{GPiîŒwÂİŸÅMG@~uB=ùÕ_Ä}GÔ‰'¨/õ]pOäÛƒÈ—Nø#î;¡L|µÇoqÅ	¿Ä9'ügğC¸;á»0wÂ7ñÕ_ÅKGTˆsx.®8à™ÈrÀqÓ…»ˆ³(şx*âP)î;à¥xé€*ñÄÕâ½}<æx$ìP"Øã¾xiRñŞ)ø>ì>¼	“QEø5òlFâîÈkx1ò*¼·#ı¹ÿ	?nÂ—ëŸğáïÛó'Ç¼ù“ãüı1şò˜ÿzÌ‹ß<îÉ³{ğ¸ãV<ì˜;÷?îÌõ»rûã.Üü¸w?nÍ³Ùò›Çlø•cvüş±Y‚û²4wexîÉó!Ø)û`—¬ôÁò·öHS_ü+¿ø`·|çƒ½ÒÖû¤«/†ª˜(S)Q¸OoÌ-¡sïÑ˜¹w©ïÜ;Ôvîmú{N,õOcfÅÑĞY	4eV"Í˜•LoÌJ¢y³Rè½Y©ôñ¬óôİ¬s´rVı2+şu‘ÚÎ¾@MggP×ÙA4cf1}7'„Ş˜Lóf†Ò{3oÑÇsnÒsŠhÆœ2úxî3ç:õs‰fÌÎ¥7f_¦y³óè½ÙùôñìúnöZ9»~™I}ggÓ˜ÙY4tvM™Hãg^£¶s"éï™ÑÔvV5C]g…ÑÇ3¯Òß³Ãé»™giåÌúe¦Ò"3 i‰H]&Í+ÿPó	Céµ	T3ÊÀš1AjA€öê"Ó¸	\sÊ Ó¬20ˆNpaÖ°o,a&ò--Òl+
m#rl!m%l)"l&,m.<mpV8ÚÀAY#HÔZ#TÚ D|·†Ÿ(³F€xeQa‘cQl/Qh;"Â·…§=Š…¥=n‰ïv¸)^Ù¡H”ÙÁ^¼²ÂQh;qëÿVH³Ã5a[qÎ
6ÂÏ
q¢ØNÂÛy¢ØÖÂÔ
¢ÜiÂÑE -.O[dŠ[d‹4[d‰[\9¶0Å–0,‘+
ma%¾Y"^”Ù I¼²A¢¨°A²¨µAª0´EŠønƒsÂÒW…§
…¥ÜDš5
Äw[\¯l‘/Êlá*¬±];›‹]ZV.vjçr±C‹ËÅníJ.6iú¹Øª¹çb‹fŸ‹Íšy.¶iş¹X«İ¿ŒÚûËX¯½¼ŒuÚ“ËØ¨}½ŒCš}hşy8¬¹çá¨v6û´÷¹8 éça¿ö55ó<ü«İÌÅíI.şÓîçb¯ö2…2*ÅòK0nÈkÁ(’w‚q[…àº¼Œ›òa0nÉê`\•IÁ¸&/ã´A/­<ı4³lôÕşd¡¿f—>ZMzkUYøK«ËÂqîs¤±ö)´7¨§¥g ¡v;´«¨¯]Ê€±4öG”¼ˆ™ˆHy!ò“?<eR ¼åå xÉğ‘×à,à$úÃEZÀU:À]ÀMzÀCFÀWŞ	@¨tÄYˆ0éˆpù< ~òa ä› ÊO–Æ’?"­a*ıa+ïøÃ^>÷‡|èùÆæ2ØfÒÛ2Ê–2ÉÖò²?¬äØÈkş0’?ı`(?ù!Z^„‰´öG¦|„y'Yòy.ÈËAH—‚pQ^B¶|„¦¨í8é]Fáv—¸Ôe$®v]Â©ËPDv‚ .ƒàÕe»|$Îí¿¨öŸIpûOÄ»}Ijÿ•\hÿƒÜiÿ\kÿ\nÿ“<lß Ÿ;¼%ÏÛ½'?ÛÕOíŞ‘7í>ãöµÄºı0úpB[üèôŒ8·ÓÔAÁºƒ„q‡ö°ê\×;4FVÇîHìÜé{áRçŞ¸Ú¹#œ:wEPçÎğêÜ‘Ûàu§ÖxĞ©®vj‰ôNaÛñyŞşùÔş7yÓàgûjr¹İkr§İ+r­İò°]sxuj«NÖ±";§Õêãa‡çÄ»]%‰j÷‚·«"Ií^’íK‡P”ËˆPTÈœP<•i¡x"BQ&?„à‘´ÅCiŠò[JeuNğsGNñ§GÌ¹ş13şñ¨!÷<jÄä·Xp›c–Üó˜78ªÇKœæÕGÎğGŒùµ£úüÛS^yÔ„—="}}±EÜ6Ã6ñÌ[Å3l¯Í°Sü0ÃñÑ»„‘9v+sü'¼Ìñ¯p2Çd}"Ñ{E¤9°èm¯YÈWÌeG53Ù‘É¢·¼dŸ·7¦fãÒQ7<ÙÃqkX
†i´dlZ3¶ı3¶!­[ŸV­GËÇ¦³o›/2§-˜é–æ¿¥Š½Ø~Ÿ¹l«dw·¿`ÉÛŸ³ÜíÏXÈöRæ³­Œ…lËbi[²Yş–B²õ:»¸µˆ]ßzƒån½Æ’·^eÑ[o±G[o²»[o³·[+˜Ëöböbk{³¹„Ùl{ÊL¶ßc&Û°ÏÛÎ³òÍçXñævgK9{±í1»»í!KÙöˆån»Ã>o½Ë~m½ÄŞn¹Ì>oÉg6[˜ÏÖ+Ìek3ÙšË~mYÁ>¯ZÎ^¬ZÆî®ZÊrW-aW-fÑ«1ŸU™Íªì×Ê	ìÅŠ‰ìíŠùìíÊ©ÌdåLæ²r:³Y9™ıZ1‰}^1†]_1=Z9—]_9‡]\9=Z¡Ã’VÌfÑ+Ç±»+f1Ÿ•‹I®
%_š."çTyÙt!‰TÁ¤¬éâ«‚Èµ¦óˆ±
 qMçH2šÎ!¯¤qn:—ÔIØÔŠ>™~Œ^™v„›fIïO?Lã¦¥YÓ,èÍé‡èÙiæôÊtOZ=Ã‹~›áAŸÎ8Hı§ îÓöQûiúÔ~º)=7İúO7 îÓèÙé.4{†½5Ã•Ìp§¥3vÑ—Sÿ¥_§î¦ï§şGõ§™Ñ¬é{¨ù4c7]¾ŸvšêO?E¿N;CÍ§ÛSó4`†ŸáHÃg8Óó3¶Ñ+SwĞûS·Ó›SwÒ'S}¨ÅLoj0Óš¾œnK¿N·¡ï§ÛQı¾Ôa¦?˜éG=fĞğ™ÇéÍi'é“i'èıiºôå´áZy6k™Ùø[óËÆ(­.#´ªlÑò³ñ–ÑÚŸlŒÔj²1T+ÊÆ@-6:šY†i%Ù¤¥fc€æ–±š[Æhv9Ğ•Õ¾8-íıpBùâ¸ÌñÅIùĞ§¤‘ôä_•	¾8&Ó|a øáŒ÷Ã2š:eÍŸ²œfNYI‹¦¬¦åSVÑ’)khÕ”­4vêFj7u3õ›º‰ºMİBÃ¦®¥5SÖÓ?SÖÑº)¨ÙÔV4sÜØHBé°&Ôn\s6®%M×‚ÆkFıÆ5¥nãRYáæ(V»)†nfß7Å1ÇÍ±ÌrsÜÏ<7§°œÍÉ,ms"‹ØœÄ6‡²œMá¬lS${µ)‚Ul:ËŠ7…±ÂMÓI¸lNn4™ARdKò°I;şõ¿Ü|Ïj8±=×ßs\X[à¤ğ¶À	álƒâ¡9‹7æ8$›ãˆødcÂØGÅOsèŠ`‹(K	oK
kKˆŸĞo,pF<´ÀiqÍûEº9N‰ĞQ8 î˜£©æ’‰æZH&ši>™h­åf¢v=mµ»™h¥]ÌDK-9-´èL4Ñl21›Ş˜<—><‡Ş›¼ˆšNYHO^Lm§,¡®Szj%Yè¡e¡³æš…ÚïLtÒl³Ğ^û’‰šiºk)Yè¦Åd¡«š….šoÚiï2±”úNY@¿LOßMG+'Ï¢y“)×(Q¡Q¬|£0xK/’Õ¤	ÀfqÕ›Ä%3¬‘fØ(ÒÍ°A$šap2Ã:d†µÂË:â1Æˆ§Æ-ò1A8š`¢ğ4Á(‘fŒ"ÇcÅ;cŒf&˜$M°Ršb²ˆ0Á*QfŠ¥"ÍË…•–	#3,	¦X,"L1W|7ÁáhŠùÂÒ‹D )
OSÌ†¦˜"L0Mä˜`ªH3ÁtQh‚¢Ø³D…	fŠ2Ìµ&˜-^™`µxeŠIä¥p#æM&’Â•|oÜ‡¸²äNƒŞÄ‚'yF‘Ü–X6C<…Ij¬Cl„=	m<–„	G’Óx4ÑvÄ½ñ8’$œÈÍÆÅ$µÍòªíHRÉmÈÏF‘ v’T4F2¹)±l4”$pò³ápr›÷FCH7&ïö$5ô(‰hĞÜ¥‡‰mƒnä
=Dôô"?é1r®ARAï]I:=Hjëg