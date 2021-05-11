package org.subnode.actpub.model;

import org.subnode.actpub.APConst;

/**
 * Accept object.
 */
public class APOAccept extends APObj {
    public APOAccept() {
        put(AP.context, APConst.CONTEXT_STREAMS);
        put(AP.type, APType.Accept);
    }

    @Override
    public APOAccept put(String key, Object val) {
        super.put(key,val);
        return this;
    }
}
