// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/**
 * Author: Koh Zi Han, based on implementation by Koh Zi Chun
 */

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("scheme", function () {
    var BUILTIN = "builtin", COMMENT = "comment", STRING = "string",
        ATOM = "atom", NUMBER = "number", BRACKET = "bracket";
    var INDENT_WORD_SKIP = 2;

    function makeKeywords(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    var keywords = makeKeywords("λ case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt #f floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? #t tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?");
    var indentKeys = makeKeywords("define let letrec let* lambda");

    function stateStack(indent, type, prev) { // represents a state stack object
        this.indent = indent;
        this.type = type;
        this.prev = prev;
    }

    function pushStack(state, indent, type) {
        state.indentStack = new stateStack(indent, type, state.indentStack);
    }

    function popStack(state) {
        state.indentStack = state.indentStack.prev;
    }

    var binaryMatcher = new RegExp(/^(?:[-+]i|[-+][01]+#*(?:\/[01]+#*)?i|[-+]?[01]+#*(?:\/[01]+#*)?@[-+]?[01]+#*(?:\/[01]+#*)?|[-+]?[01]+#*(?:\/[01]+#*)?[-+](?:[01]+#*(?:\/[01]+#*)?)?i|[-+]?[01]+#*(?:\/[01]+#*)?)(?=[()\s;"]|$)/i);
    var octalMatcher = new RegExp(/^(?:[-+]i|[-+][0-7]+#*(?:\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?)(?=[()\s;"]|$)/i);
    var hexMatcher = new RegExp(/^(?:[-+]i|[-+][\da-f]+#*(?:\/[\da-f]�/�T`��N	p9*!J#	)� 	"JJ	�DJ,��X	*!)#} 	"))	�B)	)M9)!
#	)� 	"

��R`*	�5R9�r�� //�Y�U	)!	#�y 		��!`)	!52)��! U PQCJ r#ْ[i�"��Y< "!-I��Z 9�T �d� L�DLf��däAL�)S ��c��)?Z;	�X"��	ґj���zR�y 	�!�E`��9i�"0�!0~_Z�H#i�� �#k�y� "٣*��z��;�&��.����7�����=�� I�%�E �U� _��G �*i9���s9��H��N�S�错�0���N�:7����&S�L�%�b�
 �%��'L�K 9��A �	��7�
���	�f��	�Sp��^�o���"09*!���#i/" \\	�EM�F`M�ap9j!���#*/ \\	�EM�F`M�ap�%i9!� ��j" 9� ��8w!#���C`9!=9�>z } ��E`-z�7��&��&�x�H��%��j y#i�#���	��Z 	�G�F`�b���/!#����C`M*�7��&��#�H�z"�$�#��. y#i�#���L�� 	�W �g� �H��n��ni��d��/�W0)i!L#��LL��C`L�'0<jy�0�I�J�o"�!I":� ��h" 9!+��X ��z��zi��0��Mj�0��&)Z��$�$k\��$��h�)�%O"ّ>����O�&��6���h����y �@�P ,�x���\��>��0����/4Ő>�vS���)6�)j!��! ��,,	�B,=Ò�~I9!)�H<��& ))��K !��+z )j!�y I� 	�@�A0�P`�ep|i�4#����$�'YoR�!Y� "*�$� )�T �d� M��RPM�`�֔X��;i��@0��F0��j[�8#IyR:�X[0 Jk2��!��&
�&j�!)�"��}��N���x�&�*2 J�$i� �KR� ��N0�%�*2 [ ��I =�8�S �8	�8�8	C� ��1��8)C�8Iy���Y���0����I��Q��8�8�EP�S��<�^	��ʠO���v��_ɗ��DP�4I��/i��`0��0���Y��Jy��.9p��.�M���g0��xi��x����0���z)���DP�<:����P����`0�<�@P�<ɕI�	����Q�y)�7��#i�Z��%y��%�H ||��,ŧ]+IR#�&�%�&�'�%J �'=R 	Pe� E�r�T �d��#	�F	Z;)b#)z��'� �!�%{ � N 	`V� FJbc	K�Ii!#��~ ��C�$0<�y!J�� �'m��%Y_B�%"�  �%R��$*�R �b� ,��0�
��1��B,a���qP,	�ƒ�y,ӓQ =
	=��y=�sP=�� i=�B0i!\#��!���%, \\��A`\�$0w!)#�)��@`�!	#N 		��!0_Y�4r)��!�$rK��#��'9�%Y�8�"9�!�[��\��.����H"�' ���	��i N�z\��<4� |�y�#i*" �� ��HR I�&��z��"�m��^" ɦjR Z�S �c� =�C=F0=fP=�0�=vp=V`��_�Y�eP��_	���Y�E0���M�bP��^�M�0���^�M�U`�_����I|�y�#** �� ��HR i�&��z�=�"�m��^ ٧jR Z�U �e� ]�E]W0]GP]g��u	���Еqp��_�J�e��J��0���_�J�pp��R0��;i���_��0���/��E �Z�sp?�j�#�&^Z�)l�K^��(r�%L�'�r�$�&¡�(�� �Jr�'^�&��\"�  [�B�" �R� .�rC��b	.fP.�0�.v��E`./�N+	��l�N̖0���.�N�r��N�%0�ai��:��!0�,�bP�,ڕ0��,�u��̢N�̲���)���Y �9�$0�~�&0��;�9#ʢ$� �_�].9R�'��;�Kr� ^�'˧Zr�!^�$�)��ir�"�H"���-��hR�"�'��,��<r�'��?�|�!�]� �-���^��n��?�k� ����)��y � �C�9�S� �c��sC� ��0��9C� ��2���,�9�bP��,i��,��9�r��9ʒ0���,)��9�$0ϧ]Yϧ~��|�`PϷ
iϷ
	����|��y��[�9�9�Ѫ�|� 0�~G`�~N��>	����|��|i�>˗y�>�F`�>�#0�j�u�������i�j��I�j��0��j��y�j�G`�j��3�
�j�~ë��I�Z\ū�U�ƫŕ0��Z|)�ǫ�ƫ�MI �Z��3�
�Z�'0�IG`�INӛ0I �	��0��	�bP�	�R�֛�.)�כ�֛�l㈵U��ɳU��˲U�捰U�w!#���@`)i!<#���<<��G`<�%0Ii!J���#
 ))��B)^9Z!i#=)¶" ii	�FiT i=��XZ*�6")Ri��&} 	J�� ^ kk��Bk�%0��!0YY!	#)B��% 		�@��E0I!=9��" ++�S6� w!#���D`9y!<#���"<<��?��i�5��&��'�'��'�$��X Y#!K~��H 	�U �e� _��A`_�T0_�d��nJi��!ڤ' [[��Q [o<jy�0�JI�J�"�!I":� ��h" 9!+��X ��_��_iΔ0��ik!Li�L���#K 	�$ �T� L�DL��LƤ(�N�![#�[[	�E[��T���i!L#\y� LL��D`L�#0I+!\#ɗ& ��\\	�E\��|åX�-z�7��&��&��x�H��%��j y#i�#���	��Z 	�G�A`�f���kj!|#��% ||	�G|KǗ~��|!#����D`j!|#��% ||	�G|KƗy×
!9#j{��":^�� 	��E`[II�1��!
jR 9��%����8���y" ��A0��x:j	�5��"{��&*,��$ \\	�E\,ƕ{ŕi!L#�� + LL��G0L� P9i!+#J:�� ++��T �Wk{Y�52)B�!R�yҔzB�"� �%	�U �e� \��U0\\�-��R0��� y_Y�4r)��!�$rK��#��'9�%�~�"9�!�[��\��.Ғ��H"�' ���	��i N�z=��Z4� _Y�4r)��!�$rK��#��'9�%�}�"9�!�[��\��.Ғ��H"�' ���	��i N�z=��Y4� Zj�'�"���&� r��[[��D[K��:	ʲU`|i�4�Z9�+>0 9NR~��&���	� ��M2 9")�T �d� L��*¤Ǥn���^�jj��-�#IyB:�;[0 k2�im��"ِb�!:"I�$	� ِ~b�$J"I�'ɦzB�#��[��B�%����jb�#��\�}��Q �	��	C� ��1��)C� ��3���t��I)��I	��IS�I9�����B0��L�	�ep��
	��	��1���)��	�s��ٖ�	�G0�7i��m:�mL�m	��m��1�ޖ
)��m�r��m��m�F0�L����l���l���l)����lS�	ϒy�H�B0�(i)����S`�(N������n9���`I0�][=<�6��&	��"�%Z i?����x��
��[�|��6��&:�V �f� l��G`l{	l{�y	��Ppِxz|£${�:�!��8�9 )J��')�S �c� <�C<=��y	<�T`<�tp��S`��j,Ky�0��&�%"}�!��i2 	�$�0���&)�#	�@=��l��l��xS�J��&m-��! r>��'ri�U �e� [�E[��Q [	[�Ltp,
�(#i�� [�I� �"�� y#i�� :!k�#)� 	�(�b� �r��B��s`��y�(�`��(�U0|{
�7��&��&ٗx�J"�% �7��&:���{��M 	�W �g� �Gj�E �b���mi!#��} ��B�&0\�y§${��#Z.��!Y� Y� *"�#�= y"�${*�W �g� |��0�
��1��G|aP|i|	�Ǘ�I|�U ,�Zi�� y�@0��Ii!L#��!���%, LL��A`L�$0��:k�4�� K I=��"�]��:��j��[��l�9� ��j�&�_��#����B 9�"
�!��0 9#!+�$)� j�'�D�T �d��b`O+��BS��``��Pp����h�h�N���:�x�J9S����0���o�4Š���0�����x4� ��(+�6��&yjR���"y�� �'k��R�#��
b�$�zb�#	�'k"k #!z�!)�$j�"i�F�V �f� nnn[��ESn\�-�-�?�K�*)S�ْ�@S����0�ɡK�Sj:�4��&��#����H��I�8�!"�" �7��&:":!k�$)�!OO	�DO�liO�R0ik!Li�;���#K 	�$ �T� L�DL�FL�c`L�!0ڳ!0\Z
�2��&\��'+k�l\�&��! �0���').�� ..�Q .�F`��X6��9y!<#���"<<��
ǳX*!�'��' ��Q �G`�B`9+!|#�!§% ||	�G|KǗ~���L9+!|#�'��% ||	�G|KǗ~��{�h+[j�7��&*z��%�'��j�� ��i��*��j�"��}��n�_��H 	#!z�!)�&~~��?5�
�gS�~�DS��l7�I+!,#��& ��,,	�B,�E,�V0,�$PڲQ0��k�4r)��!�$r{��&��'9�!j�!��<��+��]�x��i��*��+��|��]������y��;"�& ���{��\ N�z9┹BS��k�4r)��!�$r{��&��'9�!j�!��<��+��]ҥx��i��*��+��|��]������y��;"�& ���{��\ N�z9┩BS*	�3R9�R�� J/�9�S)!)#�))��'))!)#�" ))��@:k	�0��#K 	n�H��0	�P �`� ��a���Tp�Y�^!I���R �b� +�B+f��b+i��V n]Z	�_"��	j���zR�y 	�F �V� lѕ:�<�b��
c���{�[nnZ�6��&i��;��!���#�m�"�z��;�&��.����1�����=�� I�'�G �W� ~oz�zi90�w90o�c`��IS�m��0���;7���2� }��%�b�
 �"��'�j 9�'�G �W� �wC��h�h�Ep��J5���>�9/��9�'`9!���#�"	�A��ep9Z!���#�" 	�A��ep�"i9!���j" 	� kk��Z)!���$[[��E`w!#���C`9!=9�lz } ��E`-z�7��&��&��x�[��'��j y#i�#���	��Z 	�G�F`�`����!Y# YY��T`Y}!#����C`�!I# II��S`IkM*�5��&��#��H�z"j�$�"��. Y#i�#���L�� 	�U �e� _�H����i��a��9�S0�! U P	PQe�� )i!L#���LL��C`L�"0<jy�7�8I�J�\"�!I":� ��h" !��X ~~��	��	5���}	S�,i�0��%+z�� 2 J)0 z�#K�"*�# 9�P �`� 
�P��fp|�8j���L�{cp��F`�!
i�

	�@
D
	��c� �!
i�

�@��P }j�3��&)Z��$�$k\��$O�&\�%}"��>b� 	�$k"k #!z�&)�!j�')�C�S >,�K`ː{)p�q)p��J	S���:4Őm�wS�m�cSi![i·#i [[��U [MYZ![#iҲ$i 	#[[��Q [ƖU l}z!,i�%i ,,	�B,Y¢b��,Oz!,i�%i ,,	�B,Y¢b��,!\R ��

�P��U`.,� !5�U PQT �!5�U P	PQT e	�!O JJ��Q j!� ��" {{	�G{�C0{�W`{�gpI!9��" ++�Q6� 
!9#j{��":^ 	��E`[II�1��!
jR 9��%��>�#y 9�'��A0��}:j	�5��"{��&\,��$ \\	�E\,ƕ.ŕOF!
#m 
F!
#M 
i!#��  ��G`�!pKJ�2��&	�"����x��i��'��N 9#i�#���-r�%:�#,,	�B,�C0,�cp,�R`��7�.\Z�4��&	�%���'r�$z�#� "�$ �5��&:":!�"�\��= �T �d� L��F0L�V`L�fp��gp����pS�Zi'�"O +l��!z �!n ))��Dl]	ZZ)��%;BBLb.b92 	k2 yy	�Gy|��Q0y\i�0��#����$�')oR�!Y� "*�$�#)�P �`� 
��T 
L��A`��Q ��`p��E`��F`��_[#�&�� �"��&�!
n��8��iR�#9� �$���i��+R�#�-³Y��k��.R�&�"�j���}2 �D�T �d� KKgpKWPKw0K)��SPN<���y
�y
�
�
�{�=�	|)��_	�_)�_;�_	��_�[��mTP�f�mz�mK	��mK�)�	�p	���K[�4��'�#][0 k2��&�">�!)�!:�$��~��O��x��zB�#��[��B�%��jb�#��z��D�T �d� N��0�
��1���2���3�N9㔓yN9	�䔓YN99���UpN>6�N>�H<	��H��H)��H�Rp��	6���	�|_I��H�@`�4i��~� I뗑Y맑y��Sp��aS��~�~��y����� I��Vp��fS��k)��k��H˓i��B`���y��B`��Qp��gS����i�dI��?-k�3��&	��"�%Z 9?��B�'� J�%�o0 9#i�� 	�S �c� ;��G`;{	;{�+L�+�@`jL��${��" �8�: �${)�T �d� I�DIJ��d���Q`I�R`n:,[y�6��&�""}�!��i2 	�$�0���&)�#nn	�Fn\�>�>5��JS�	*!�&+ �&U P	PQR	�A:��&-"" �#�'ri�S �c� 9�C9��c���p`9�6:��&j-R �#�'bi�P �`� 	�@	��Q 			�Ay!i��xB 	i�Z�	�A��c���T`��R`)!�&r �&	Pe� u�E�Q �a�P�A
�!*i��!\�ri��!Z�R �b� *��0�
��1���2��B*��aS���q���� 	*S頒�2�*��� 	;+S�Ó2�;��P ;M6�;M
�!i��!\�ri��!*�P �`� ��0�
��1��@��aS���q���� 	S鰐A	����1���P M6�M,
�(#i�� K�� �$�� y#i�� :!k�#)� 	�(�b� �r��B��r0��Yi��^�(�R`|k
�0��&	��&��x�$��] 9#i�� :!+�')�$	�P �`� �@J�D �ep�Q`	I!5Ң* % PQQLoy��${��#�"����	� ��<B�# �!RJ��'
�T �d� K��0�
��1��DK��qpK	0KPKƕQ \}�� ÕƕP
i!I#��! �%, II��A`I�$p��yk�1�� K I=��"�-��:��j��[��l�)� ��j�#�]�~"� ;� ��/���y��3���Lr� :�'�A�Q �a��b`+��BS��``��Pp����\��``�Z}�?��3���]	Sˑ?�4Ő꧑0��~�AS��+�0��&*jR���"�!)��{��!z� �8�� �JB�'�;��{�#��1���r�$:�"i�@�P �`� ;