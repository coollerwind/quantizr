package org.subnode.response;

import java.util.List;

import org.subnode.response.base.ResponseBase;

public class SelectAllNodesResponse extends ResponseBase {
    private List<String> nodeIds;

	public List<String> getNodeIds() {
		return nodeIds;
	}

	public void setNodeIds(List<String> nodeIds) {
		this.nodeIds = nodeIds;
	}
}
