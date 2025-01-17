package org.subnode.actpub.model;

import java.util.LinkedList;
import java.util.List;

public class APList extends LinkedList<Object> {
    private static final long serialVersionUID = 1L;

    public APList() {
    }

    public APList val(Object val) {
        super.add(val);
        return this;
    }

    public APList vals(List<?> val) {
        super.addAll(val);
        return this;
    }
}
