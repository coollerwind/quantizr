console.log("CreateNodeDlg.ts");

import { DialogBase } from "../DialogBase";
import * as I from "../Interfaces";
import { ButtonBar } from "../widget/ButtonBar";
import { Button } from "../widget/Button";
import { Form } from "../widget/Form";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { NodeTypeListBox } from "../widget/NodeTypeListBox";
import { CollapsiblePanel } from "../widget/CollapsiblePanel";

let S : Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class CreateNodeDlg extends DialogBase {
    inlineButton: Button;
    nodeTypeList : NodeTypeListBox;

    constructor() {
        super("Create New Node");

        this.nodeTypeList = new NodeTypeListBox("nt:unstructured", true);
        let collapsiblePanel = new CollapsiblePanel("Select Type", null, [ this.nodeTypeList ]);

        this.setChildren([
            new Form(null, [
                collapsiblePanel,
                new ButtonBar([
                    new Button("First", this.createFirstChild),
                    new Button("Last", this.createLastChild),
                    this.inlineButton = new Button("Inline", this.createInline),
                    new Button("Cancel", () => {
                        this.close();
                    })
                ])
            ])
        ]);
    }

    createFirstChild = (): void => {
        S.edit.createSubNode(null, this.nodeTypeList.selType, true);
        this.close();
    }

    createLastChild = (): void => {
        S.edit.createSubNode(null, this.nodeTypeList.selType, false);
        this.close();
    }

    createInline = (): void => {
        S.edit.insertNode(null, this.nodeTypeList.selType);
        this.close();
    }

    init = (): void => {
        let node: I.NodeInfo = S.meta64.getHighlightedNode();
        if (node) {
            let canInsertInline: boolean = S.meta64.homeNodeId != node.id;
            this.inlineButton.setVisible(canInsertInline);
        }
    }
}
