/**
 * 
 * @author clay
 */
package org.subnode.util;

import java.io.File;

/**
 * Visitor pattern interface
 *
 */
public interface IFileListingCallback {
	public void update(File fileName);
}
