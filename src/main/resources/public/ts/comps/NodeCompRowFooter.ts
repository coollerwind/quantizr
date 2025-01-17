import { useSelector } from "react-redux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Anchor } from "../widget/Anchor";
import { Div } from "../widget/Div";
import { Icon } from "../widget/Icon";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class NodeCompRowFooter extends Div {

    constructor(private node: J.NodeInfo, private isFeed: boolean = false) {
        super(null, {
            className: "row-footer"
        });
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        let children = [];
        let publicReadOnly = S.props.isPublicReadOnly(this.node);
        let acCount = S.props.getAcCount(this.node);

        /* Show the reply button unless we detect it's only shared to public and is readonly */
        if (this.isFeed && !(publicReadOnly && acCount === 1)) {
            children.push(new Icon({
                title: "Reply to this Node",
                className: "fa fa-reply fa-lg rowFooterIcon",
                onClick: () => {
                    if (state.isAnonUser) {
                        S.util.showMessage("Login to create content and reply to nodes.", "Login!");
                    }
                    else {
                        S.edit.addNode(this.node.id, null, state);
                    }
                }
            }, "Reply", "marginRight"));
        }

        if (this.node.owner.indexOf("@") !== -1) {
            let inReplTo = S.props.getNodePropVal(J.NodeProp.ACT_PUB_OBJ_INREPLYTO, this.node);
            if (inReplTo) {
                children.push(new Anchor(inReplTo, "Parent", {
                    className: "footerLink",
                    target: "_blank"
                }));
            }

            let objUrl = S.props.getNodePropVal(J.NodeProp.ACT_PUB_OBJ_URL, this.node);
            if (objUrl) {
                children.push(new Anchor(objUrl, "Link", {
                    className: "footerLink",
                    target: "_blank"
                }));
            }
        }
        this.setChildren(children);
    }
}
