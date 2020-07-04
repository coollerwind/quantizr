import * as J from "../JavaIntf";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants as C} from "../Constants";
import { Main } from "./Main";
import { AppState } from "../AppState";
import { useSelector, useDispatch } from "react-redux";
import { NodeCompBinary } from "../comps/NodeCompBinary";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class FullScreenViewer extends Main {

    constructor() {
        super();
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        let nodeId = state.fullScreenViewId;
        let node: J.NodeInfo = state.idToNodeMap[nodeId];
        let isAnAccountNode = node.ownerId && node.id == node.ownerId;

        let children = [];

        if (S.props.hasBinary(node) && !isAnAccountNode) {
            let binary = new NodeCompBinary(node, false, true);
            children.push(binary);
        }

        this.setChildren(children);
    }
}
