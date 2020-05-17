import { Comp } from "./base/Comp";
import { Constants as C} from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { ReactNode } from "react";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class Form extends Comp {

    constructor(attribs: Object, private initialChildren: Comp[] = null) {
        super(attribs);
    }

    compRender(): ReactNode {
        this.setChildren(this.initialChildren);
        return S.e('div', this.attribs, this.buildChildren());
    }
}
