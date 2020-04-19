import * as J from "./JavaIntf";
import { LoginDlg } from "./dlg/LoginDlg";
import { SignupDlg } from "./dlg/SignupDlg";
import { ConfirmDlg } from "./dlg/ConfirmDlg";
import { UserIntf } from "./intf/UserIntf";
import { Singletons } from "./Singletons";
import { PubSub } from "./PubSub";
import { Constants as C } from "./Constants";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

export class User implements UserIntf {

    private logoutResponse = (res: J.LogoutResponse): void => {
        /* reloads browser with the query parameters stripped off the path */
        window.location.href = window.location.origin;
    }

    closeAccountResponse = (res: J.CloseAccountResponse): void => {
        /* Remove warning dialog to ask user about leaving the page */
        window.onbeforeunload = null;

        /* reloads browser with the query parameters stripped off the path */
        window.location.href = window.location.origin;
    }

    closeAccount = (): void => {
        new ConfirmDlg("Are you sure you want to close your account?", "Close Account",
            () => {
                new ConfirmDlg("Your data will be deleted and can never be recovered.<p> Are you sure?", "Last Chance... One more Click",
                    () => {
                        this.deleteAllUserLocalDbEntries();
                        S.util.ajax<J.CloseAccountRequest, J.CloseAccountResponse>("closeAccount", {}, this.closeAccountResponse);
                    }
                ).open();
            }
        ).open();
    }

    /*
     * for testing purposes, I want to allow certain users additional privileges. A bit of a hack because it will go
     * into production, but on my own production these are my "testUserAccounts", so no real user will be able to
     * use these names
     */
    isTestUserAccount = (): boolean => {
        return S.meta64.userName.toLowerCase() === "adam" || //
            S.meta64.userName.toLowerCase() === "bob" || //
            S.meta64.userName.toLowerCase() === "cory" || //
            S.meta64.userName.toLowerCase() === "dan";
    }

    /* todo-0: move this into meta64 module */
    setStateVarsUsingLoginResponse = (res: J.LoginResponse): void => {

        var title = "";
        if (!S.meta64.isAnonUser) {
            title += "User: " + res.userName;
        }
        S.util.setInnerHTMLById("headerAppName", title);

        if (res.rootNode) {
            S.meta64.homeNodeId = res.rootNode;
            S.meta64.homeNodePath = res.rootNodePath;
        }
        S.meta64.userName = res.userName;
        S.meta64.isAdminUser = res.userName === "admin";

        //bash scripting is an experimental feature, and i'll only enable for admin for now, until i'm
        //sure i'm keeping this feature.
        S.meta64.allowBashScripting = false; // res.userName === "admin";

        S.meta64.isAnonUser = res.userName === J.PrincipalName.ANON;

        S.meta64.anonUserLandingPageNode = res.anonUserLandingPageNode;
        S.meta64.allowFileSystemSearch = res.allowFileSystemSearch;

        S.meta64.userPreferences = res.userPreferences;

        //todo-1: admin user had bug where it wasn't loading this at login, so i did this hack for now to make admin logins
        //always set to what settings i prefer.
        if (S.meta64.isAdminUser) {
            S.meta64.showMetaData = false;
        }
        else {
            S.meta64.showMetaData = res.userPreferences.showMetaData;
        }
    }

    openSignupPg = (): void => {
        new SignupDlg().open();
    }

    /*
     * This method is ugly. It is the button that can be login *or* logout.
     */
    openLoginPg = (): void => {
        let dlg = new LoginDlg(null);
        dlg.populateFromLocalDb();
        dlg.open();
    }

    refreshLogin = async (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                console.log("refreshLogin.");

                let callUsr: string;
                let callPwd: string;

                let loginState: string = await S.localDB.getVal(C.LOCALDB_LOGIN_STATE);

                /* if we have known state as logged out, then do nothing here */
                if (loginState === "0") {
                    console.log("loginState known as logged out. Sending to anon home page. [no, new logic overriding this now]");
                    S.meta64.loadAnonPageHome();
                    return;
                }

                let usr = await S.localDB.getVal(C.LOCALDB_LOGIN_USR);
                let pwd = await S.localDB.getVal(C.LOCALDB_LOGIN_PWD);

                let usingCredentials: boolean = usr && pwd;

                /*
                 * empyt credentials causes server to try to log in with any active session credentials.
                 */
                callUsr = usr || "";
                callPwd = pwd || "";

                console.log("refreshLogin with name: " + callUsr);

                if (!callUsr) {
                    S.meta64.loadAnonPageHome();
                } else {
                    //alert('calling login: currently at: '+location.href);
                    S.util.ajax<J.LoginRequest, J.LoginResponse>("login", {
                        "userName": callUsr,
                        "password": callPwd,
                        "tzOffset": new Date().getTimezoneOffset(),
                        "dst": S.util.daylightSavingsTime
                    }, (res: J.LoginResponse) => {
                        if (usingCredentials) {
                            this.loginResponse(res, callUsr, callPwd, usingCredentials);
                        } else {
                            this.refreshLoginResponse(res);
                        }
                    });
                }
            }
            finally {
                resolve();
            }
        });
    }

    logout = async (updateLocalDb: any): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (S.meta64.isAnonUser) {
                    return;
                }

                /* Remove warning dialog to ask user about leaving the page */
                window.onbeforeunload = null;

                if (updateLocalDb) {
                    await S.localDB.setVal(C.LOCALDB_LOGIN_STATE, "0");
                }

                S.util.ajax<J.LogoutRequest, J.LogoutResponse>("logout", {}, this.logoutResponse);
            }
            //todo-1: everywhere in the app that I have a resolve() that isn't in a finally block needs to be checked for correctness.
            finally {
                resolve();
            }
        });
    }

    login = (loginDlg: any, usr: string, pwd: string) => {
        S.util.ajax<J.LoginRequest, J.LoginResponse>("login", {
            "userName": usr,
            "password": pwd,
            "tzOffset": new Date().getTimezoneOffset(),
            "dst": S.util.daylightSavingsTime
        }, (res: J.LoginResponse) => {
            this.loginResponse(res, usr, pwd, null, loginDlg);
        });
    }

    deleteAllUserLocalDbEntries = async (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await S.localDB.setVal(C.LOCALDB_LOGIN_USR, null);
                await S.localDB.setVal(C.LOCALDB_LOGIN_PWD, null);
                await S.localDB.setVal(C.LOCALDB_LOGIN_STATE, null);
            }
            finally {
                resolve();
            }
        });
    }

    loginResponse = async (res?: J.LoginResponse, usr?: string, pwd?: string, usingCredentials?: boolean, loginDlg?: LoginDlg): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (S.util.checkSuccess("Login", res)) {
                    console.log("loginResponse: usr=" + usr);
                    console.log("homeNodeOverride: " + res.homeNodeOverride);

                    if (usr !== J.PrincipalName.ANON) {
                        await S.localDB.setVal(C.LOCALDB_LOGIN_USR, usr);
                        await S.localDB.setVal(C.LOCALDB_LOGIN_PWD, pwd);
                        await S.localDB.setVal(C.LOCALDB_LOGIN_STATE, "1");
                    }

                    if (loginDlg) {
                        loginDlg.close();
                    }

                    this.setStateVarsUsingLoginResponse(res);

                    /* set ID to be the page we want to show user right after login */
                    let id: string = null;
                    let childId: string = null;

                    if (res.homeNodeOverride) {
                        console.log("loading homeNodeOverride=" + res.homeNodeOverride);
                        id = res.homeNodeOverride;
                        S.meta64.homeNodeOverride = id;
                    } //
                    else {
                        let lastNode = await S.localDB.getVal(C.LOCALDB_LAST_PARENT_NODEID);

                        if (lastNode) {
                            console.log("loading lastNode=" + lastNode);
                            id = lastNode;
                            childId = await S.localDB.getVal(C.LOCALDB_LAST_CHILD_NODEID);
                        } else {
                            console.log("loading homeNodeId=" + S.meta64.homeNodeId);
                            id = S.meta64.homeNodeId;
                        }
                    }

                    S.view.refreshTree(id, true, childId, true);

                    setTimeout(() => {
                        S.encryption.initKeys();
                    }, 500);
                } else {
                    if (usingCredentials) {
                        console.log("LocalDb login failed.");

                        /*
                         * blow away failed credentials and reload page, should result in brand new page load as anon
                         * this.
                         */
                        await S.localDB.setVal(C.LOCALDB_LOGIN_USR, null);
                        await S.localDB.setVal(C.LOCALDB_LOGIN_PWD, null);
                        await S.localDB.setVal(C.LOCALDB_LOGIN_STATE, "0");

                        location.reload();
                    }
                }
            }
            finally {
                resolve();
            }
        });
    }

    private refreshLoginResponse = (res: J.LoginResponse): void => {
        console.log("refreshLoginResponse");

        if (res.success) {
            this.setStateVarsUsingLoginResponse(res);
        }

        S.meta64.loadAnonPageHome();
    }

    transferNode = (recursive: boolean, nodeId: string, fromUser: string, toUser: string): void => {
        S.util.ajax<J.TransferNodeRequest, J.TransferNodeResponse>("transferNode", {
            recursive,
            nodeId,
            fromUser,
            toUser,
        }, (res: J.TransferNodeResponse) => {
            S.view.refreshTree();
            S.util.showMessage(res.message);
        });
    }
}
