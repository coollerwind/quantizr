import * as J from "../JavaIntf";
import { AppState } from "../AppState";

export interface ViewIntf {
    docElm: any;

    refreshTree(nodeId: string, renderParentIfLeaf: boolean, highlightId: string, isInitialRender: boolean, forceIPFSRefresh: boolean, allowScroll: boolean, state: AppState): void;
    firstPage(state: AppState): void;
    prevPage(state: AppState): void;
    nextPage(state: AppState): void;
    lastPage(state: AppState): void;
    scrollRelativeToNode(dir: string, state: AppState): void;
    scrollToSelectedNode(state: AppState): void;
    scrollToTop(afterFunc?: Function): Promise<void>;
    getPathDisplay(node: J.NodeInfo, delim: string): string;
    runServerCommand(command: string, state: AppState): any;
    graphDisplayTest(state: AppState): any;
    displayNotifications(command: string, state: AppState): any;
}
