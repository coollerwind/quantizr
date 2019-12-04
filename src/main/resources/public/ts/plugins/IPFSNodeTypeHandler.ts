console.log("IPFSNodeTypeHandler.ts");

import * as I from "../Interfaces";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants as cnst } from "../Constants";
import { TypeHandlerIntf } from "../intf/TypeHandlerIntf";
import { CoreTypesPlugin } from "./CoreTypesPlugin";
import { Comp } from "../widget/base/Comp";
import { Div } from "../widget/Div";
import { Heading } from "../widget/Heading";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class IPFSNodeTypeHandler implements TypeHandlerIntf {
    constructor(private plugin: CoreTypesPlugin) {
    }

    render = (node: I.NodeInfo, rowStyling: boolean): Comp => {
        let ret: Comp[] = [];

        let name = node.content;
        if (name) {
            let linkName = S.props.getNodePropertyVal("ipfs:linkName", node);
            if (linkName) {
                ret.push(new Heading(4, linkName, { style: { margin: "15px;" } }));
            }
            ret.push(S.render.renderMarkdown(rowStyling, node, {}));
        }
        else {
            let folderName = "";
            let displayName = S.props.getNodePropertyVal("ipfs:link", node);
            if (displayName) {
                folderName = S.util.getNameFromPath(displayName);
            }

            ret.push(new Heading(4, folderName, { style: { margin: "15px;" } }));
        }

        return new Div(null, null, ret);
    }

    orderProps(node: I.NodeInfo, _props: I.PropertyInfo[]): I.PropertyInfo[] {
        return _props;
    }

    getIconClass(node: I.NodeInfo): string {
        //https://www.w3schools.com/icons/fontawesome_icons_webapp.asp
        return "fa fa-sitemap fa-lg";
    }

    allowAction(action: string): boolean {
        return true;
    }
}


