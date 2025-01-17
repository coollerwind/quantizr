import { store } from "../AppRedux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import { DialogBase } from "../DialogBase";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { ValidatedState } from "../ValidatedState";
import { CompIntf } from "../widget/base/CompIntf";
import { Button } from "../widget/Button";
import { ButtonBar } from "../widget/ButtonBar";
import { Form } from "../widget/Form";
import { TextContent } from "../widget/TextContent";
import { TextField } from "../widget/TextField";
import { FriendsDlg } from "./FriendsDlg";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class ShareToPersonDlg extends DialogBase {

    userNameState: ValidatedState<any> = new ValidatedState<any>();

    constructor(private node: J.NodeInfo, private sharedNodeFunc: Function, state: AppState) {
        super("Share Node to Person", "app-modal-content-medium-width", false, state);
    }

    validate = (): boolean => {
        let valid = true;

        if (!this.userNameState.getValue()) {
            this.userNameState.setError("Cannot be empty.");
            valid = false;
        }
        else {
            if (this.userNameState.getValue() === store.getState().userName) {
                this.userNameState.setError("You can't share a node to yourself.");
                valid = false;
            }
            else {
                this.userNameState.setError(null);
            }
        }

        return valid;
    }

    renderDlg(): CompIntf[] {
        return [
            new Form(null, [
                new TextContent("Enter the user name of the person to share this node with:"),
                new TextField("User to share with", false, this.shareNodeToPerson, null, false, this.userNameState),
                new ButtonBar([
                    new Button("Share", this.shareNodeToPerson, null, "btn-primary"),

                    new Button("Close", this.close)
                ])
            ])
        ];
    }

    shareNodeToPerson = (): void => {
        if (!this.validate()) {
            return;
        }

        this.shareImmediate(this.userNameState.getValue());
    }

    shareImmediate = (userName: string) => {
        S.util.ajax<J.AddPrivilegeRequest, J.AddPrivilegeResponse>("addPrivilege", {
            nodeId: this.node.id,
            principal: userName,
            privileges: [J.PrivilegeType.READ, J.PrivilegeType.WRITE]
        }, this.reload);
    }

    reload = async (res: J.AddPrivilegeResponse): Promise<void> => {
        if (S.util.checkSuccess("Share Node with Person", res)) {
            this.close();
            if (res.principalPublicKey) {
                await S.share.addCipherKeyToNode(this.node, res.principalPublicKey, res.principalNodeId);
            }
            this.sharedNodeFunc(res);
        }
    }
}
