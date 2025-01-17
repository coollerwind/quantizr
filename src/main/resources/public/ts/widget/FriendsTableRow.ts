import { appState } from "../AppRedux";
import { Constants as C } from "../Constants";
import { UserProfileDlg } from "../dlg/UserProfileDlg";
import { FriendInfo } from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Div } from "./Div";
import { Img } from "./Img";
import { ListBoxRow } from "./ListBoxRow";
import { Span } from "./Span";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class FriendsTableRow extends ListBoxRow {

    constructor(public friend: FriendInfo, onClickFunc: Function, public isSelected: boolean) {
        super(null, onClickFunc);
    }

    preRender(): void {
        let src: string = null;
        if (this.friend.avatarVer) {
            src = S.render.getAvatarImgUrl(this.friend.userNodeId, this.friend.avatarVer);
        }
        let img: Img = null;
        let state = appState(null);

        if (src) {
            img = new Img(null, {
                className: "friendListImage",
                src: src,
                onClick: (evt: any) => {
                    new UserProfileDlg(this.friend.userNodeId, appState(null)).open();
                }
            });
        }

        let friendDisplay = this.friend.displayName
            ? this.friend.displayName + " (@" + this.friend.userName + ")"
            : ("@" + this.friend.userName);

        this.setChildren([
            new Div(null, {
                className: (this.isSelected ? " selectedListItem" : " unselectedListItem")
            }, [
                img,
                new Span(friendDisplay, { className: "friendListText" })
            ])
        ]);
    }
}
