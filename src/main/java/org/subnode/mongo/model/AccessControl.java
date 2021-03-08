package org.subnode.mongo.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Models access privileges of a single 'share', along with the encrypted symetric key to the data,
 * for the user it represents.
 */
@TypeAlias("ac")
@JsonInclude(Include.NON_NULL)
public class AccessControl {
	private static final Logger log = LoggerFactory.getLogger(AccessControl.class);

	public static final String FIELD_PRVS = "prvs";
	@Field(FIELD_PRVS)
	private String prvs;

	public static final String FIELD_KEY = "key";
	@Field(FIELD_KEY)
	private String key;

	public AccessControl() {
	}

	public AccessControl(String key, String prvs) {
		this.key = key;
		this.prvs = prvs;
	}

	@JsonProperty(FIELD_PRVS)
	public String getPrvs() {
		return this.prvs;
	}

	@JsonProperty(FIELD_PRVS)
	public void setPrvs(String prvs) {
		this.prvs = prvs;
	}

	@JsonProperty(FIELD_KEY)
	public String getKey() {
		return this.key;
	}

	@JsonProperty(FIELD_KEY)
	public void setKey(String key) {
		this.key = key;
	}
}
