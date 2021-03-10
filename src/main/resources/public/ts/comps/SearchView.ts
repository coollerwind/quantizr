import { useSelector } from "react-redux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Anchor } from "../widget/Anchor";
import { AppTab } from "../widget/AppTab";
import { Comp } from "../widget/base/Comp";
import { Div } from "../widget/Div";
import { Li } from "../widget/Li";
import { TextContent } from "../widget/TextContent";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/* General Widget that doesn't fit any more reusable or specific category other than a plain Div, but inherits capability of Comp class */
export class SearchView extends AppTab {

    constructor() {
        super({
            id: "searchTab"
        });
    }

    getTabButton(state: AppState): Li {
        return new Li(null, {
            className: "nav-item navItem",
            style: { display: state.searchResults ? "inline" : "none" }
        }, [
            new Anchor("#searchTab", "Search", {
                "data-toggle": "tab",
                className: "nav-link" + (state.activeTab === "searchTab" ? " active" : "")
            })
        ]);
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        let results = state.searchResults;

        this.attribs.className = "tab-pane fade my-tab-pane";
        if (state.activeTab === this.getId()) {
            this.attribs.className += " show active";
        }

        if (!results || results.length === 0) {
            this.setChildren([new Div("No Search Displaying", {
                id: "searchResultsPanel"
            })]);
            return;
        }

        let childCount = results.length;

        /*
         * Number of rows that have actually made it onto the page to far. Note: some nodes get filtered out on the
         * client side for various reasons.
         */
        let rowCount = 0;
        let children: Comp[] = [];

        if (state.searchDescription) {
            children.push(new TextContent(state.searchDescription));
        }

        let i = 0;
        let jumpButton = state.isAdminUser || !state.isUserSearch;
        results.forEach(function (node: J.NodeInfo) {
            S.srch.initSearchNode(node);
            children.push(S.srch.renderSearchResultAsListItem(node, i, childCount, rowCount, "srch", false, false, true, jumpButton, state));
            i++;
            rowCount++;
        });

        this.setChildren(children);
    }
}
