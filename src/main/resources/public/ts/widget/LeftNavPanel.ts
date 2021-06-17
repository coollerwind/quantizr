import { useSelector } from "react-redux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import { MenuPanel } from "../MenuPanel";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Div } from "./Div";
import { Img } from "./Img";
import { Span } from "./Span";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

declare var g_brandingAppName;

export class LeftNavPanel extends Div {

    constructor() {
        super(null, { id: C.ID_LHS, tabIndex: "-1" });
        this.attribs.className = "col-" + C.leftNavPanelCols + " leftNavPanel customScrollbar";
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);

        let s = state.newMessageCount > 1 ? "s" : "";
        let messages = state.newMessageCount > 0
            ? (state.newMessageCount + " message" + s) : "";

        this.setChildren([
            new Div(null, null, [
                new Img(this.getId() + "_logo", {
                    className: "smallLogoButton",
                    src: "/branding/logo-50px-tr.jpg",
                    onClick: () => { window.location.href = window.location.origin; }
                }),
                new Span(g_brandingAppName, {
                    className: "logo-text",
                    onClick: e => { S.meta64.loadAnonPageHome(null); },
                    title: "Go to Portal Home Node"
                }),
                // todo-1: need to add a similar message over to the 'logo-text' that's active for mobile
                // which is in a different class.
                messages ? new Span(messages, {
                    className: "logo-text-small float-right",
                    onClick: e => { S.meta64.showMyNewMessages(); },
                    title: "Show new messages"
                }) : null
            ]),

            new Div(null, {
                className: "menuContainer"
            }, [
                new MenuPanel(state)
            ])
        ]);
    }

    // This was originally on the toolbar at top of page but if we bring this back it will be here (probably)
    // domAddEvent(): void {
    //     let elm: HTMLElement = this.getElement();

    //     elm.addEventListener("dragenter", (event) => {
    //         // console.log('DRAGENTER: ' + S.util.prettyPrint(event));
    //         event.preventDefault();
    //     });

    //     elm.addEventListener("dragover", (event) => {
    //         // console.log('DRAGOVER: ' + S.util.prettyPrint(event));
    //         event.preventDefault();
    //         event.dataTransfer.dropEffect = "copy"; // See the section on the DataTransfer object.
    //     });

    //     elm.addEventListener("drop", (ev) => {
    //         ev.stopPropagation();
    //         ev.preventDefault();

    //         // var imageUrl = evt.dataTransfer.getData('URL');
    //         // var imageUrl = evt.dataTransfer.getData('text/html');

    //         let data = ev.dataTransfer.items;
    //         for (let i = 0; i < data.length; i++) {
    //             let d = data[i];
    //             console.log("DROP[" + i + "] kind=" + d.kind + " type=" + d.type);

    //             if ((d.kind === "string") &&
    //                 (d.type.match("^text/plain"))) {
    //             }

    //             d.getAsString((s) => {
    //                 // This detects drops, successfully but I'm not using it yet.
    //                 console.log("DROP STRING[" + i + "]: " + s);
    //             });

    //             // else if ((data[i].kind == 'string') &&
    //             //     (data[i].type.match('^text/html'))) {
    //             //     // Drag data item is HTML
    //             //     console.log("... Drop: HTML");
    //             // } else if ((data[i].kind == 'string') &&
    //             //     (data[i].type.match('^text/uri-list'))) {
    //             //     // Drag data item is URI
    //             //     console.log("... Drop: URI");
    //             // } else if ((data[i].kind == 'file') &&
    //             //     (data[i].type.match('^image/'))) {
    //             //     // Drag data item is an image file
    //             //     var f = data[i].getAsFile();
    //             //     console.log("... Drop: File ");
    //             // }
    //         }
    //     });
    // }

}
