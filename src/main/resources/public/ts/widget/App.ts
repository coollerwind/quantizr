import { useSelector } from "react-redux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import { DialogBase } from "../DialogBase";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { CompIntf } from "./base/CompIntf";
import { Button } from "./Button";
import { Clearfix } from "./Clearfix";
import { Div } from "./Div";
import { FullScreenCalendar } from "./FullScreenCalendar";
import { FullScreenControlBar } from "./FullScreenControlBar";
import { FullScreenGraphViewer } from "./FullScreenGraphViewer";
import { FullScreenImgViewer } from "./FullScreenImgViewer";
import { IconButton } from "./IconButton";
import { Img } from "./Img";
import { LeftNavPanel } from "./LeftNavPanel";
import { Main } from "./Main";
import { RightNavPanel } from "./RightNavPanel";
import { TabPanel } from "./TabPanel";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

declare var g_brandingAppName;

export class App extends Main {

    constructor() {
        super(null, { role: "main" });
    }

    preRender(): void {
        const state: AppState = useSelector((state: AppState) => state);

        if (!state.guiReady) {
            this.setChildren(null);
            return;
        }

        // todo-1: put this in a function called 'getTopDialog'
        if (state.dialogStack.length > 0) {
            let dialog = state.dialogStack[state.dialogStack.length - 1];
            if (dialog) {
                this.setChildren([dialog]);
                return;
            }
        }

        let fullScreenViewer = this.getFullScreenViewer(state);
        let mobileTopBar = this.getTopMobileBar(state);
        this.attribs.className = "container-fluid mainContainer";

        if (fullScreenViewer) {
            this.setChildren([
                !state.fullScreenCalendarId ? new FullScreenControlBar() : null,
                new Clearfix(),
                fullScreenViewer
            ]);
        }
        else {
            if (state.mobileMode) {
                this.setChildren([
                    new Div(null, {
                        className: "row mainAppRow customScrollBar"
                    }, [
                        new TabPanel(mobileTopBar)
                    ])
                ]);
            }
            else {
                this.setChildren([
                    new Div(null, {
                        className: "row mainAppRow"
                    }, [
                        new LeftNavPanel(),
                        new TabPanel(),
                        new RightNavPanel()
                    ]),

                    // I don't like this clutter. Leaving as an example for now.
                    // new IconButton("fa-angle-double-up", null, {
                    //     onClick: e => {
                    //         S.view.scrollAllTop(state);
                    //     },
                    //     title: "Scroll to Top"
                    // }, "btn-secondary scrollTopButtonUpperRight", "off"),

                    new IconButton("fa-angle-double-up", null, {
                        onClick: e => {
                            S.view.scrollAllTop(state);
                        },
                        title: "Scroll to Top"
                    }, "btn-secondary scrollTopButtonLowerRight", "off")
                ]);
            }
        }
    }

    /* This is where we send an event that lets code hook into the render cycle to process whatever needs
        to be done AFTER the main render is complete, like doing scrolling for example */
    domUpdateEvent(): void {
        // todo-1: based on current scrolling architecture do we still need these pub/sub events?
        PubSub.pub(C.PUBSUB_mainWindowScroll);
        PubSub.pub(C.PUBSUB_postMainWindowScroll);
        super.domUpdateEvent();
    };

    getFullScreenViewer = (state: AppState): CompIntf => {
        let comp: CompIntf = null;
        if (state.fullScreenViewId) {
            comp = new FullScreenImgViewer();
        }
        else if (state.fullScreenGraphId) {
            comp = new FullScreenGraphViewer(state);
        }
        else if (state.fullScreenCalendarId) {
            comp = new FullScreenCalendar();
        }

        return comp;
    }

    getTopMobileBar = (state: AppState): CompIntf => {
        let comp: CompIntf = null;
        if (state.mobileMode) {
            let menuButton = null;
            menuButton = new IconButton("fa-bars", "Menu", {
                onClick: e => {
                    S.nav.showMainMenu(state);
                },
                id: "mainMenu"
                // only applies to mobile. just don't show title for now.
                // title: "Show Main Menu"
            }, "btn-secondary marginRight", "off");

            let fullScreenViewer = S.meta64.fullscreenViewerActive(state);
            let prefsButton = !fullScreenViewer ? new IconButton("fa-certificate", "Meta", {
                onClick: e => { S.edit.toggleShowMetaData(state); },
                title: state.userPreferences.showMetaData ? "Hide Avatars and Metadata" : "Show Avatars and Metadata"
            }, "btn-secondary", state.userPreferences.showMetaData ? "on" : "off") : null;

            let loginButton = state.isAnonUser ? new IconButton("fa-sign-in", "", {
                onClick: e => { S.nav.login(state); }
            }, "btn-primary marginRight", "off") : null;

            let logo = new Img(this.getId() + "_logo", {
                className: "marginRight smallLogoButton",
                src: "/branding/logo-50px-tr.jpg",
                onClick: () => { window.location.href = window.location.origin; },
                title: "Main application Landing Page"
            });

            let messagesSuffix = state.newMessageCount > 0
                ? " (" + state.newMessageCount + ")" : "";

            // let appName = new Span(g_brandingAppName + messagesSuffix, {
            //     className: "logo-text",
            //     onClick: e => { S.meta64.loadAnonPageHome(null); },
            //     title: "Go to Portal Home Node"
            // });

            let title = state.title ? new Button("@" + state.title, e => { S.nav.navHome(state); }, null, "btn-secondary float-right") : null;
            comp = new Div(null, { className: "mobileHeaderBar" }, [logo, menuButton, prefsButton, loginButton, title]);
        }
        return comp;
    }
}
