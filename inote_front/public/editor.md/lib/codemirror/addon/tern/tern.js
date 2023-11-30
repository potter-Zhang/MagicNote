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
//   Is passed a single argument—the completion's data as returned by
//   Tern—and may return a string, DOM node, or null to indicate that
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
          tip.appendChild(document.createTextNode(" — " + data.doc));
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
      var dept�@8�7�y~p[X���E~pGX���1?x$\����Y?x,��k�K_�.����7_�,���+�e_�*��h�W5n�8/j����!��I��qk���g �F�h�Z���@��� ��D_��5�ى��[�����'��M\�o���_;q�?a�h�R���ۄe��	��y��'���&x�',�M���l�+��F��Vl�$�y#ag��]
���y �`�`{ Cٍ ɾ�(67��۠��q\���̅�N�Z_�[_侴��{�j;��"�h�-k����b'�bw�E��E4�b7w��^�F�=ܥ��-�s�[侴8��k��m��k~���j#w��nW�.��y�L�s��Vg��V�pgZ'r��pޭ�pa-㹃-�r�Z&p�-�qgZ��n�<�]jy�{����2�h�-ky���r��4���V�y�0�K�mܻ������3�Oq�[�r7�o�.5��=h.J�b@�������z�4?*q��U����IoBen�LZ ]=�s���Y1@���o܂?�	�a�pm>���C��
'��pu$
{�"!v�B�ia�"�6- o�gDqްDX��8X(��^B�|�'�􁃂��|�����P��}����B�|��·xa�,͇H�7D	W�a�p�v	w�a������ްG��
�Ңx�-;
��[G��t�(�������G�M��E	0V�� ��	0J�c���0Zz���x&����x.�����x8�Vo���Hd�7�Yvd���l�3l�8�Nm����8��o��l��Ⱦm�RRb,��Rb���"*H_c��t3JKI�PVJ�����qY�{1�E��-1�Y:��}1�Q�sؿka۹����`+ۺ�{A����5lg0�f[�!������ X�2�	�lv0�`K�a9[+��`dG�!��^�ْu��-X�l�:b�Zv*�ٵ`X����o0�gO�a#�lv��#A����E�T��kA�ɖ�<� ��� ����B�3��A����l�t-�b��Bۿ�Ok�;�bؑ���^�����m]���Ǯ���p�`5�P�&(R��QEj��"����U`i�ʰ��o0�HUXS�_��!�,s|G�ߒ���I�����9�������9~&��f����+���%����\rxM�;�!��r�����#_�KP@�exp���2@t��Z�8�)\6.�
�����s����pa�S�,-�.�G偨B�aC����r������\r$���1	sxJ:<!���x��0�Px[0��KU�����'s��2����!	pxD6:�d�!p����,2���͂C�v{#�`6�u�j#\c�6�Uve#L�7��Ɵ�ɿ?��;~�5~6�n�d>v��y�|�k�L�ո���q��+�f������w����/���?�y�@��<p.�'��<$�3�O��`��<p�̃���`�0��	�<a���F	�<a�����5�O���O�����A�蚁���AY�Wu���j����N�Wu�*q�u2qW�d����ݮ��;W'w��~�h�A:k��n@]4�!�8�
��L�z@�ݧݣK]����K�ci��8=�$]�t�ns:K8%�(��t��)���<=�t�u��^w�K��@/:���\����з�I���mz�y/M���
���RJT���7)$*JqPG�8H_�`
��ٷ@��ba"����T Lcoa*{�Yp L`��0��\3؊�Ѕiԍ�nԕoԝ�iԓKlԃKhԋKj��6����h �Ӹ?��x �߸7w�Q_�E�>\r�~\J�<��8y���f�>���������ŭ���󬛝s��������N_����GЙ�ӏ�wP���k@4�����IW���Bhd�Pz��Vz��z��f��ۿ)	e9Ib�f$��&׳9�����ν�ӑ9|���&�`�0�\�S�0V��	n�ߞ0N��	�=a����K�`��z>�̇Y�'/�)<�w��Ny�ta���x�4a�LV{��'d������C�CZx�JQ� �t�䗎�<ҶC�[�prIkA6�s��6l͝i؊�o؁{װ=��aG�K�N��F%��X(!��Bain,���BҗC�(=8�w����1�I�PTZE$�Xp�n�Μw�v܃�m�
3�B}�k.�B�@7!��7�@=!e4��Bw�4V΅�U�,�z@Wa�t"=������Zx<�	3=���q.t�<����m��s��<��s��:�
{�B3!n.��υ���J�3Z
W�BO�4 ����3[}rM�'�e-C��$r1Si�E'��L5ɿ�����J�#QYko���d�C6	��ᬵ������Z�D	Kȹ�HP�����5H2�M>g)K����n����A�g�Bv�s�����i~Y��2���!/2�$/��dK���7��d*F�sn�=S)�@�d*A�r�ȚLE�~Ε��G�sO�_���ܧ3��̿��t&9��yM�It���~���w���Mng�H��K^�����C��?G<��C��%�^%��U͂?���Մ����p{�|�@%��,�.��
��_�`����(�(&E�J1e'��Q(F�Z1$
���(��`��u'�=�`��{Ŕ]pUL��į�`�����	{`������]�[L�{�� Z��.��{�_��~x#&�$1d\���[1y?��)�!^L��cbr4_DC�x3N�)�pJ��
�3��1
A3���;�q�f|�!��م�S����s�� �v���wp�C.!����[��y����?7�#{������Gӿ�3@�A�38a�O���_x���ӿ�3�1Cbg�L8>#��jF��2fd<�A��� ܞ!	Wfd�h��4,(�τ���i�y�����^����#���c����LO�O��N�Mů����<��;�4�6�b�]~��+wxȟ����=�e��Ѵ{|Ĵ|����i���i�H��'I��gY���Y[�s,�|�֜akȓl��WSb�S��&��_M��7O�ϻO��#��}���LI��OI�=���ݧ��}�^�7O=�M=��r���r��2e�h�9~��8H�~���r�?7�$�h�!>h�	������I�x��[��B�W����w�'����{&��c'm��O
�L�ȟ����=)�_;i';ynr|r4er8�br�y�v>h�~��H>b�.8Y5k��� ��	��q�V?
>5��G�x�Q��8�.�xT��?��~�CG�������;�9�7>nd->tTM~��ר������#�O���_Y�??�*gd9�kd5���
�ʑ�y�������Ǉ��t�0��v�R�ah$�9��;G����0t�V�n��Q�*y���#�^:q:JW�@k)�����6R�h'��&����B�;ͤ�G���uZI�G�����)m9��]�����0����.��#�Yz|�E���P��	>�ʝ�H�	���Ǫν���γ�V�Ṡ:���#p��ܞ:�AL�ϐX�+ܬ��j�Kɵ?AB���`���A��F�R�y�2�K���]��tn�j�L��F���R���A�Z�y�u�W��һN�e]3р�YhX��tc��tW�l�`��L��4�}Nz�}֩2
4�cyб��X�t(D�:�;��:�;�g:����Kr������s����w���/��w��tnG���WnW;B��}��c�];��m/�/�2�e�3P��@ϴ��v<}Ў�����.��XV�ܬ�
^�z	ɵ^CJ�'S�$�z
	��CR����m?q�ھ�>�y�-i��[��7�������m?sK�}�.����R ����Bj���o�k���S�_���k���}��o�{��1w��#�H�'��m�r����>�~��ks�[��67��]nI�nG�{��6/��<බ�ϭo���ls����)w��
�6&I���p�q(���Bfe,@��d[��JO�e>9��:��/$/�x��,GHD��|Ĉ�|�b��%��#J��F��o�(�_Q�4� �;�04��bD~����0]z|�H���4��q�Iv�NB�'K��"������Ӧb���l�ĥZ6N�l�"[6�-�vȖM�e˦ϲe�=ٲi�lٴ_�l��D1\�l��	^�-�e�>ٲi�l�tX�lZ%[6-�-��ɖM�e˦u�e�*ٲi�l�tR�l:)[6=�-���-��ȖM�6�;��l�tA�l�+[6��-��ȖM�ɖMod˦Y���G�l� [6ݕ-��d˦[�*r��.�ge˦��e�ٲ��:�`�e˦�e�3ٲi�z�˶ɖMd˦��a[�0ٲ)Q�l�*[6��-��ȖM/�
cԗ(�R��0\eDa����D���*&�Th4���h�T��1UeDc���i*/3Խh�U��0^�Fc�2���
��]�.�՟X����🲋�����/�TX���8lS%�خ�c�CU�b��������(�Uy����PU1X�jbpZ��㘪������U�S�-GUy��,R�1X�bc�Xe�`�ʏ���&'T]N�?q�Uf�T�	�W��0R��0T��0P��0VE�8�2�pH���*��l�'s�Y�)��Uv1���b`�j�N��b�����*6��<�.�Tj,6��XlQ��ت�b�J��`���5�,k�],LTI<�TU<f��h�rC��ׇO�3��F�O�K?=T�3@D��(꧋��N ��q$�;����«���;�~���AT�=����q��>d�݋ľ{�w%�ע��f��;-�D5_K�h�ľ�[��m���K%ϛ�!�Z1l����K!���&iZ,��l#1��L�4_E��R�l��%���Q���:�TK �̓a6��
GSe�f�&
���2����FJ;���1\ָc�,r�0Y�!2��e�;zI37��vn$��1Pڹ���
{GPi�w����MG@~uB=��_�}Gԉ'��/�]pO�ۃȗN�#�;�L|��oq�	��9'�g��C�;�0w�7��_�KGT�sx.�8���r�q�������(�x*�P)�;�x�*����}<�x$�P"���xi�R��)�>�>��	�QE�5�lF���kx1�*����#���	?n������'Ǽ�����1���z̋�<�ɳ�{��V<�;�?�����r��.���w?nͳ����l��cv���Y���4wex���!�)�`������HS_�+��`�|烽�����/���(S)Q�Oo�-�s�ј�w���;�v�m�{N,��Ocf���Y	4eV"͘�Lo�J�y�R�Y�����ݬs�rV�2+���u��ξ@MggP��A4cf1}7'�ޘL�f��{3o��sn�s�hƜ2�x�
m#rl!m%l)"l&,m.<mpV8��AY#H�Z#T� D|���(�F�xe
6��
q��N��y�����
��i��E�-.O[d�[d�4[d�[\9�0Ŗ0,�+
ma%�Y"^�� I��A���A���A�0�E��n�s��W��
���D�5
�w[\�l�/�l�*��];��]ZV.vj�r�C���n�J.6i��ت��b�f��͚y.�i��X�ݿ�
�i�dlZ3��3�!�[�V��G�Ǧ�o�/2�-��濥���~��l�dw��`�۟����X��R泭��l�bi[�Y��B��:����]�z��n�ƒ�^e�[o�G[o��[o��[+���b�bk{����l{�L��c&۞���γ���X��vgK9{��1���!K����n��>o��~m���n��>o�g6[���+�ek3ٚ�~mY�>�Z�^�Z��Z�rW-aW-fѫ1�U�ͪ���	�Ŋ������ʩ�d�L�r:�Y9��Z1�}^1�]_1�=Z9�]_9�]\9�=Z�ÒV�f�+Ǳ�+f1���I�
%_�."�Ty�t!�T����⫂ȵ��
 qM�H2��!��qn:��I�Ԋ>�~�^�v���fI�O?L��Y�,�����i���tOZ=Ë~��A��8H������Q�i��~�)=7ݐ�O7��Ӎ���.4{��5Õ�p��3vїS��_����G���Ѭ�{��4c7]���v��O?E�N;Cͧ�S�4`����H�g8��3��+Sw��S�ӛSw�'S}��Loj0Ӛ��nK�N����Q���a�?
kK���o,pF<��iq��E�9N��Q8 �撉�ZH&�i>�h��f��v=m���h�]�DK-9-��L4�l21�ޘ<�>�<�ޛ���NYHO^Lm�,��Szj%Y�e��暅��Lt�l��^�����i�k)Y��d����.�o�i�2���NY@�L�O�M�G+'Ϣy�)�(Q�Q�|�0�xK/�դ	�fq���%3��f�(�ͰA$�a�p2�:d����:�1ƈ��-�1A8�`��4�(�f�"�c�;c�f&�$M�R�b��0�*Qf��"�˅��	#3,	�X,"L1W|7��h�����D�)
OS����"L0M�`�H3�tQh����D�	f�2��&�-^�`�xe�I�p#�M&�|o܇���N��Ă'y
=D��"?�1r�ARA��]I:=Hj�g