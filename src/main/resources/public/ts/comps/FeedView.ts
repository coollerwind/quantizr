import { useSelector } from "react-redux";
import { dispatch, store } from "../AppRedux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Comp } from "../widget/base/Comp";
import { Button } from "../widget/Button";
import { ButtonBar } from "../widget/ButtonBar";
import { Checkbox } from "../widget/Checkbox";
import { Div } from "../widget/Div";
import { Span } from "../widget/Span";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/* General Widget that doesn't fit any more reusable or specific category other than a plain Div, but inherits capability of Comp class */
export class FeedView extends Div {

    static feedQueried: boolean = false;

    constructor() {
        super(null, {
            id: "feedTab"
        });
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        this.attribs.className = "tab-pane fade my-tab-pane";
        if (state.activeTab === this.getId()) {
            this.attribs.className += " show active";
        }

        /*
         * Number of rows that have actually made it onto the page to far. Note: some nodes get filtered out on the
         * client side for various reasons.
         */
        let rowCount = 0;
        let children: Comp[] = [];

        let refreshFeedButtonBar = new ButtonBar([
            new Button("Friends", () => S.nav.openContentNode("~" + J.NodeType.FRIEND_LIST, state)),
            new Span(null, {
                className: (state.feedDirty ? "feedDirtyButton" : "feedNotDirtyButton")
            }, [
                new Button("Refresh Feed" + (state.feedDirty ? " (New Posts)" : ""), () => {
                    S.nav.navFeed(state);
                })
            ])
        ], null, "float-right marginBottom");

        children.push(this.makeFilterButtonsBar());
        children.push(refreshFeedButtonBar);
        children.push(new Div(null, { className: "clearfix" }));

        if (!state.feedResults || state.feedResults.length === 0) {
            if (state.activeTab === "feedTab") {
                if (!FeedView.feedQueried) {
                    FeedView.feedQueried = true;
                    children.push(new Div("Loading feed..."));
                    setTimeout(() => { S.nav.navFeed(state); }, 250);
                }
                else {
                    children.push(new Div("Nothing to display."));
                }
            }
        }
        else {
            let i = 0;
            let childCount = state.feedResults.length;
            state.feedResults.forEach((node: J.NodeInfo) => {
                // console.log("FEED: node id=" + node.id + " content: " + node.content);
                S.srch.initSearchNode(node);
                children.push(S.srch.renderSearchResultAsListItem(node, i, childCount, rowCount, "feed", true, false, true, state));
                i++;
                rowCount++;
            });
        }

        this.setChildren(children);
    }

    makeFilterButtonsBar = (): Span => {
        return new Span(null, { className: "checkboxBar" }, [
            new Checkbox("To Me", null, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedFilterToMe = checked;
                        }
                    });
                    S.nav.navFeed(store.getState());
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterToMe;
                }
            }),
            new Checkbox("From Me", null, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedFilterFromMe = checked;
                        }
                    });
                    S.nav.navFeed(store.getState());
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterFromMe;
                }
            }),
            new Checkbox("To Public", null, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedFilterToPublic = checked;
                        }
                    });
                    S.nav.navFeed(store.getState());
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterToPublic;
                }
            })

            // new RadioButtonGroup([
            //     this.createRadioButton("feedUserFilter", "Friends Only", "friends"),
            //     this.createRadioButton("feedUserFilter", "Everyone", "all")
            // ], "radioButtonsBar form-group-border feedFilterRadioButtons")

            // todo-0: temporarily removed due to refactoring
            // new RadioButtonGroup([
            //     this.createRadioButton("feedServerFilter", "Local", "local"),
            //     this.createRadioButton("feedServerFilter", "Federated", "federated")
            // ], "radioButtonsBar form-group-border feedFilterRadioButtons")
        ]);
    }

    // createRadioButton = (propName: string, name: string, val: string) => {
    //     return new RadioButton(name, false, propName + "_Group", null, {
    //         setValue: (checked: boolean): void => {
    //             if (checked) {
    //                 dispatch({
    //                     type: "Action_SetFeedFilterType",
    //                     update: (s: AppState): void => {
    //                         s[propName] = val;
    //                     }
    //                 });
    //                 S.nav.navFeed(store.getState());
    //             }
    //         },
    //         getValue: (): boolean => {
    //             return store.getState()[propName] === val;
    //         }
    //     });
    // }
}
