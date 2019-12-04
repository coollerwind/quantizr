console.log("AceEditPropTextarea.ts");

import * as I from "../Interfaces";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { Div } from "./Div";

// <option value="ace/mode/abap">abap</option>
// <option value="ace/mode/actionscript">actionscript</option>
// <option value="ace/mode/ada">ada</option>
// <option value="ace/mode/asciidoc">asciidoc</option>
// <option value="ace/mode/assembly_x86">assembly_x86</option>
// <option value="ace/mode/autohotkey">autohotkey</option>
// <option value="ace/mode/batchfile">batchfile</option>
// <option value="ace/mode/c9search">c9search</option>
// <option value="ace/mode/c_cpp">c_cpp</option>
// <option value="ace/mode/clojure">clojure</option>
// <option value="ace/mode/cobol">cobol</option>
// <option value="ace/mode/coffee">coffee</option>
// <option value="ace/mode/coldfusion">coldfusion</option>
// <option value="ace/mode/csharp">csharp</option>
// <option value="ace/mode/css">css</option>
// <option value="ace/mode/curly">curly</option>
// <option value="ace/mode/d">d</option>
// <option value="ace/mode/dart">dart</option>
// <option value="ace/mode/diff">diff</option>
// <option value="ace/mode/django">django</option>
// <option value="ace/mode/dot">dot</option>
// <option value="ace/mode/ejs">ejs</option>
// <option value="ace/mode/erlang">erlang</option>
// <option value="ace/mode/forth">forth</option>
// <option value="ace/mode/ftl">ftl</option>
// <option value="ace/mode/glsl">glsl</option>
// <option value="ace/mode/golang">golang</option>
// <option value="ace/mode/groovy">groovy</option>
// <option value="ace/mode/haml">haml</option>
// <option value="ace/mode/handlebars">handlebars</option>
// <option value="ace/mode/haskell">haskell</option>
// <option value="ace/mode/haxe">haxe</option>
// <option value="ace/mode/html">html</option>
// <option value="ace/mode/html_ruby">html_ruby</option>
// <option value="ace/mode/ini">ini</option>
// <option value="ace/mode/jade">jade</option>
// <option value="ace/mode/java">java</option>
// <option value="ace/mode/javascript">javascript</option>
// <option value="ace/mode/json">json</option>
// <option value="ace/mode/jsoniq">jsoniq</option>
// <option value="ace/mode/jsp">jsp</option>
// <option value="ace/mode/jsx">jsx</option>
// <option value="ace/mode/julia">julia</option>
// <option value="ace/mode/latex">latex</option>
// <option value="ace/mode/less">less</option>
// <option value="ace/mode/liquid">liquid</option>
// <option value="ace/mode/lisp">lisp</option>
// <option value="ace/mode/livescript">livescript</option>
// <option value="ace/mode/logiql">logiql</option>
// <option value="ace/mode/lsl">lsl</option>
// <option value="ace/mode/lua">lua</option>
// <option value="ace/mode/luapage">luapage</option>
// <option value="ace/mode/lucene">lucene</option>
// <option value="ace/mode/makefile">makefile</option>
// <option value="ace/mode/markdown">markdown</option>
// <option value="ace/mode/matlab">matlab</option>
// <option value="ace/mode/mushcode">mushcode</option>
// <option value="ace/mode/mushcode_high_rules">mushcode_high_rules</option>
// <option value="ace/mode/mysql">mysql</option>
// <option value="ace/mode/objectivec">objectivec</option>
// <option value="ace/mode/ocaml">ocaml</option>
// <option value="ace/mode/pascal">pascal</option>
// <option value="ace/mode/perl">perl</option>
// <option value="ace/mode/pgsql">pgsql</option>
// <option selected value="ace/mode/php">php</option>
// <option value="ace/mode/powershell">powershell</option>
// <option value="ace/mode/prolog">prolog</option>
// <option value="ace/mode/properties">properties</option>
// <option value="ace/mode/python">python</option>
// <option value="ace/mode/r">r</option>
// <option value="ace/mode/rdoc">rdoc</option>
// <option value="ace/mode/rhtml">rhtml</option>
// <option value="ace/mode/ruby">ruby</option>
// <option value="ace/mode/rust">rust</option>
// <option value="ace/mode/sass">sass</option>
// <option value="ace/mode/scad">scad</option>
// <option value="ace/mode/scala">scala</option>
// <option value="ace/mode/scheme">scheme</option>
// <option value="ace/mode/scss">scss</option>
// <option value="ace/mode/sh">sh</option>
// <option value="ace/mode/snippets">snippets</option>
// <option value="ace/mode/sql">sql</option>
// <option value="ace/mode/stylus">stylus</option>
// <option value="ace/mode/svg">svg</option>
// <option value="ace/mode/tcl">tcl</option>
// <option value="ace/mode/tex">tex</option>
// <option value="ace/mode/text">text</option>
// <option value="ace/mode/textile">textile</option>
// <option value="ace/mode/toml">toml</option>
// <option value="ace/mode/twig">twig</option>
// <option value="ace/mode/typescript">typescript</option>
// <option value="ace/mode/vbscript">vbscript</option>
// <option value="ace/mode/velocity">velocity</option>
// <option value="ace/mode/verilog">verilog</option>
// <option value="ace/mode/xml">xml</option>
// <option value="ace/mode/xquery">xquery</option>
// <option value="ace/mode/yaml">yaml</option>

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

declare var ace;

/* FYI: Before switching to React we needed the 'escapeHtml' in here, but it appears after moving to ReactJS it was no longer necessary */
export class AceEditPropTextarea extends Div {

    aceEditor: any;
    initialValue: string;

    constructor(value: string, public heightString, public plainText: boolean = false, public wordWrap: boolean = true) {
        //super(S.util.escapeHtml(propEntry.property.value), {});
        super(value, {});

        S.util.mergeProps(this.attribs, {
            className: "form-control subnode-ace-editor",
            style: { height: heightString }
        });

        this.initialValue = value; //S.util.escapeHtml(propEntry.property.value);

        //console.log("InitialValue(for Ace editor)="+this.initialValue);

        this.whenElm((elm: HTMLElement) => {
            this.aceEditor = ace.edit(this.getId());

            // add command to lazy-load keybinding_menu extension
            this.aceEditor.commands.addCommand({
                name: "insetTimestamp",
                //On Ubuntu CTRL-ALT-T was already stomped on, so I guess we need to make this configurable by users to set their
                //own custom keybindings. For now I hope CTRL-ALT-H works for everyone. I had EditNodeDlg.ts using an insertTime button before
                //deciding todo this via key binding on the element so that is still there commented out, if i change my mind and go back to that.
                bindKey: { win: "Ctrl-Alt-h", mac: "Command-Alt-h" },
                exec: (editor: any) => {
                    this.insertTextAtCursor("[" + S.util.formatDate(new Date()) + "]");
                }
            });

            //this.aceEditor.setTheme("ace/theme/monokai");

            if (!plainText) {
                this.aceEditor.session.setMode("ace/mode/markdown");
            }
            else {
                this.aceEditor.session.setMode("ace/mode/text");
            }

            this.aceEditor.session.setUseWrapMode(wordWrap);

            //this was found online (for making editor resizable) but didn't work
            //$(elm).resizable();
            //$(elm).on("resize", function() { this.aceEditor.resize() }); 
        });
    }

    showKeyboardShortcuts = () => {
        ace.config.loadModule("ace/ext/keybinding_menu", (module) => {
            module.init(this.aceEditor);
            this.aceEditor.showKeyboardShortcuts();
        });
    }

    insertTextAtCursor = (text: string) => {
        this.aceEditor.session.insert(this.aceEditor.getCursorPosition(), text);
    }

    getAceEditor = (): any => {
        return this.aceEditor;
    }

    //should we make this just return a promise, and wait for the control ?
    getValue = (): string => {
        if (!this.aceEditor) {
            //console.log("Ace.getValue(1)="+this.initialValue);
            return this.initialValue;
        }
        let val = this.aceEditor.getValue();
        //console.log("Ace.getValue(2)="+val);
        return val;
    }

    setValue = (val: string): void => {
        this.whenElm((elm) => {
            //console.log("Ace.setValue="+val);
            this.aceEditor.setValue(val /* S.util.escapeHtml(val) */, 0);
        });
    }
}

