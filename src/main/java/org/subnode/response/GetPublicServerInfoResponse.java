package org.subnode.response;

import org.subnode.response.base.ResponseBase;

public class GetPublicServerInfoResponse extends ResponseBase {
	private String serverInfo;

	public String getServerInfo() {
		return serverInfo;
	}

	public void setServerInfo(String serverInfo) {
		this.serverInfo = serverInfo;
	}
}
