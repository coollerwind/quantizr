package org.subnode.actpub.model;

import org.subnode.actpub.APConst;

/**
 * OrderedCollectionPage object.
 */
public class APOOrderedCollectionPage extends APObj {
    public APOOrderedCollectionPage() {
        put(AP.context, APConst.CONTEXT_STREAMS);
        put(AP.type, APType.OrderedCollectionPage);
    }

    @Override
    public APOOrderedCollectionPage put(String key, Object val) {
        super.put(key,val);
        return this;
    }
}
