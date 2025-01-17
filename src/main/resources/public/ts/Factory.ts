/*
This is a 'Factory', but the main thing it does is manage the singletons, somewhat analoglous to a SpringContext
but actually existing for mostly different reasons having to do with our need to support circular
references.

WARNING: Singletons (just like in Spring) are not allowed to do any logic that requires other modules
inside their constructors becasue there is no guarantee that all (or any) of the other Singletons have
been constructed yet.

NOTE: This Factory is allowed to import anything it wants and the way we allow Circular Dependencies to exist without
being a problem is by having the rule that no other modules are allowed to import this Factory module,
but only the interface of it.
*/
import { Attachment } from "./Attachment";
import { Constants as C } from "./Constants";
import { Edit } from "./Edit";
import { Encryption } from "./Encryption";
import { SpeechRecog } from "./SpeechRecog";
import { LocalDB } from "./LocalDB";
import { Meta64 } from "./Meta64";
import { Nav } from "./Nav";
import { PluginMgr } from "./PluginMgr";
import { Props } from "./Props";
import { PubSub } from "./PubSub";
import { Render } from "./Render";
import { Search } from "./Search";
import { ServerPush } from "./ServerPush";
import { Share } from "./Share";
import { Singletons } from "./Singletons";
import { User } from "./User";
import { Util } from "./Util";
import { View } from "./View";
export class Factory {
    S: Singletons;

    /*
     * Just like in a SpringContext, we init all singletons up front and this allows circular references
     * to exist with no problems.
     */
    constructor() {
        this.S = {
            meta64: new Meta64(),
            plugin: new PluginMgr(),
            util: new Util(),
            push: new ServerPush(),
            edit: new Edit(),
            attachment: new Attachment(),
            encryption: new Encryption(),
            nav: new Nav(),
            props: new Props(),
            render: new Render(),
            srch: new Search(),
            share: new Share(),
            user: new User(),
            view: new View(),
            localDB: new LocalDB(),
            speech: new SpeechRecog()
        };

        PubSub.pub(C.PUBSUB_SingletonsReady, this.S);

        // This is basically our main entrypoint into the app. This must ONLY be called after the SingletonsReady has been
        // called (line above) initializing all of them and wiring them all up.
        this.S.meta64.initApp();
    }
}
