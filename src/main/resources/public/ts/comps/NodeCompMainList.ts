import { useSelector } from "react-redux";
import { store } from "../AppRedux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Comp } from "../widget/base/Comp";
import { ButtonBar } from "../widget/ButtonBar";
import { Clearfix } from "../widget/Clearfix";
import { Div } from "../widget/Div";
import { HelpButton } from "../widget/HelpButton";
import { IconButton } from "../widget/IconButton";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/* General Widget that doesn't fit any more reusable or specific category other than a plain Div, but inherits capability of Comp class */
export class NodeCompMainList extends Div {
    constructor() {
        super(null, { key: "nodeCompMaiList" });
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);

        let children: Comp[] = [];
        if (state.node && state.node.children) {
            this.addPaginationButtons(children, state.endReached, "", state, true);

            let orderByProp = S.props.getNodePropVal(J.NodeProp.ORDER_BY, state.node);
            let allowNodeMove: boolean = !orderByProp;
            children.push(S.render.renderChildren(state.node, 1, allowNodeMove, state));

            this.addPaginationButtons(children, state.endReached, "marginTop marginBottom", state, false);
        }

        // children.push(new HelpButton(S.meta64?.config?.help?.gettingStarted));
        this.setChildren(children);
    }

    addPaginationButtons = (children: Comp[], endReached: boolean, moreClasses: string, state: AppState, pageTop: boolean) => {
        let firstButton: Comp;
        let prevButton: Comp;
        let nextButton: Comp;
        let nextNodeButton: Comp;
        let firstChild: J.NodeInfo = S.edit.getFirstChildNode(state);

        if (firstChild && firstChild.logicalOrdinal > 1) {
            firstButton = new IconButton("fa-angle-double-left", null, {
                onClick: () => S.view.firstPage(state),
                title: "First Page"
            });
        }

        if (firstChild && firstChild.logicalOrdinal > 0) {
            prevButton = new IconButton("fa-angle-left", null, {
                onClick: () => S.view.prevPage(state),
                title: "Previous Page"
            });
        }

        if (!endReached) {
            nextButton = new IconButton("fa-angle-right", "More", {
                onClick: (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    S.view.nextPage(state);
                },
                title: "Next Page"
            });

            if (C.TREE_INFINITE_SCROLL && !pageTop) {
                // If nextButton is the one at the bottom of the page we watch it so we can dynamically load in
                // new content when it scrolls info view. What's happening here is that once
                // the nextButton scrolls into view, we load in more nodes!
                nextButton.whenElm((elm: HTMLElement) => {
                    let observer = new IntersectionObserver(entries => {
                        /* We have to STILL check these conditions becasue this observer can be getting called any time
                         and these conditions will always apply about controll if we want to grow page or not. */

                        let state = store.getState();
                        if (!state.editNode && S.meta64.allowGrowPage === 0) {
                            entries.forEach((entry: any) => {
                                if (entry.isIntersecting) {
                                    // observer.disconnect();
                                    S.view.growPage(state);
                                }
                            });
                        }
                    });
                    observer.observe(elm);
                });
            }
        }
        else {
            if (!pageTop && !S.nav.displayingRepositoryRoot(state)) {
                nextNodeButton = new IconButton("fa-chevron-circle-right", null, {
                    onClick: S.nav.navToNext,
                    title: "Go to Next Node"
                });
            }
        }

        if (firstButton || prevButton || nextButton || nextNodeButton) {
            children.push(new ButtonBar([firstButton, prevButton, nextButton, nextNodeButton], "text-center " + moreClasses));
            children.push(new Clearfix());
        }
    }
}
