package org.subnode.model;

/**
 * Models UserPreferences
 */
public class UserPreferences {
	private boolean editMode;
	private boolean showMetaData;
	private boolean importAllowed;
	private boolean exportAllowed;
	private long maxUploadFileSize;

	public boolean isEditMode() {
		return editMode;
	}

	public void setEditMode(boolean editMode) {
		this.editMode = editMode;
	}

	public boolean isImportAllowed() {
		return importAllowed;
	}

	public void setImportAllowed(boolean importAllowed) {
		this.importAllowed = importAllowed;
	}

	public boolean isExportAllowed() {
		return exportAllowed;
	}

	public void setExportAllowed(boolean exportAllowed) {
		this.exportAllowed = exportAllowed;
	}

	public boolean isShowMetaData() {
		return showMetaData;
	}

	public void setShowMetaData(boolean showMetaData) {
		this.showMetaData = showMetaData;
	}

	public long getMaxUploadFileSize() {
		return maxUploadFileSize;
	}

	public void setMaxUploadFileSize(long maxUploadFileSize) {
		this.maxUploadFileSize = maxUploadFileSize;
	}
}
