import { ReactNode } from "react";
import { store } from "../AppRedux";
import { Constants as C } from "../Constants";
import { MessageDlg } from "../dlg/MessageDlg";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Comp } from "./base/Comp";
import { Html } from "./Html";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class HelpButton extends Comp {

    constructor(private getHelpText: () => string, _attribs: Object = null, moreClasses: string = "btn-secondary") {
        super(_attribs);
        if (!this.attribs.className) {
            this.attribs.className = "";
        }

        this.attribs.className += " btn " + moreClasses;
        this.attribs.type = "button";
        this.attribs.onClick = () => { this.openHelpDialog(); };
    }

    openHelpDialog = (): void => {
        let state = store.getState();
        // todo-0: this shouldn'g require an exception but also catch ANY non-true
        // getHelpText
        try {
            new MessageDlg(null, "Help", null, new Html(this.getHelpText()), false, 0, state).open();
        }
        catch (e) {
            alert("Unable to load help content.");
        }
    }

    compRender(): ReactNode {
        let icon: any;

        icon = this.e("i", {
            key: "s_" + this.getId(),
            className: "fa fa-question-circle"
        });

        return this.e("button", this.attribs, [icon]);
    }
}
