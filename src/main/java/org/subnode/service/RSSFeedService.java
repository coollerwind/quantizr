package org.subnode.service;

import java.io.Writer;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.rometools.rome.feed.synd.SyndContent;
import com.rometools.rome.feed.synd.SyndContentImpl;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndEntryImpl;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.feed.synd.SyndFeedImpl;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.SyndFeedOutput;
import com.rometools.rome.io.XmlReader;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.subnode.AppServer;
import org.subnode.exception.NodeAuthFailedException;
import org.subnode.model.NodeMetaInfo;
import org.subnode.model.client.NodeProp;
import org.subnode.mongo.MongoRead;
import org.subnode.mongo.MongoSession;
import org.subnode.mongo.model.SubNode;
import org.subnode.util.SubNodeUtil;

/* Proof of Concept RSS Publishing */
@Component
public class RSSFeedService {
	private static final Logger log = LoggerFactory.getLogger(RSSFeedService.class);

	@Autowired
	private MongoRead read;

	@Autowired
	private SubNodeUtil subNodeUtil;

	private static boolean refreshingCache = false;

	/*
	 * Cache of all feeds. todo-0: make this map hold SyndFeed instances instead.
	 */
	private static final HashMap<String, List<SyndEntry>> feedCache = new HashMap<String, List<SyndEntry>>();

	/*
	 * Runs immediately at startup, and then every 240 minutes, to refresh the
	 * feedCache.
	 */
	@Scheduled(fixedDelay = 240 * 60 * 1000)
	public void run() {
		if (AppServer.isShuttingDown() || !AppServer.isEnableScheduling()) {
			log.debug("ignoring RSSFeedService schedule cycle");
			return;
		}

		log.debug("RSSFeedService.refreshFeedCache");
		refreshFeedCache();
	}

	public String refreshFeedCache() {
		if (refreshingCache) {
			return "Cache refresh was already in progress.";
		}

		try {
			refreshingCache = true;
			SyndFeed feed = null;
			int count = 0, fails = 0;

			for (String url : feedCache.keySet()) {
				try {
					feed = getFeed(url);
					count++;
				} catch (Exception e) {
					fails++;
					// todo-0: handle
				}

				synchronized (feedCache) {
					feedCache.put(url, feed.getEntries());
				}
			}
			return "Refreshed " + String.valueOf(count) + " feeds. (Fail Count: " + String.valueOf(fails) + ")";
		} finally {
			refreshingCache = false;
		}
	}

	/*
	 * Streams back an RSS feed that is an aggregate feed of all the children under
	 * nodeId (immediate children only) that have an RSS_FEED_SRC property
	 * 
	 * todo-0: need to preload this cache after app restart, for the nodeId that we
	 * know we have on the production site, and make this be a commane line list of
	 * nodeIds, and also
	 * 
	 * todo-0: make sure to test that nodeId can be a node name (like ':name' I
	 * think) so that it's more premanent and not dependend on id itself.
	 */
	public void multiRss(MongoSession mongoSession, String nodeId, Writer writer) {
		SubNode node = null;
		try {
			node = read.getNode(mongoSession, nodeId);
		} catch (NodeAuthFailedException e) {
			return;
		}

		SyndFeed feed = new SyndFeedImpl();
		feed.setFeedType("rss_2.0");

		feed.setTitle(node.getContent());
		feed.setDescription("");
		feed.setAuthor("quanta");
		feed.setLink("https://quanta.wiki");

		ArrayList<SyndEntry> entries = new ArrayList<SyndEntry>();
		feed.setEntries(entries);
		List<String> urls = new LinkedList<String>();

		final Iterable<SubNode> iter = read.getSubGraph(mongoSession, node);
		final List<SubNode> children = read.iterateToList(iter);

		if (children != null) {
			for (final SubNode n : children) {
				/* avoid infinite recursion here! */
				if (n.getId().toHexString().equals(nodeId))
					continue;

				String feedSrc = n.getStringProp(NodeProp.RSS_FEED_SRC.s());
				if (!StringUtils.isEmpty(feedSrc) && !feedSrc.contains(nodeId)) {
					urls.add(feedSrc);
				}
			}
		}

		for (String url : urls) {
			try {
				// log.debug("Reading Feed: " + url);

				List<SyndEntry> feedEntries = null;
				synchronized (feedCache) {
					feedEntries = feedCache.get(url);
				}

				if (feedEntries == null) {
					SyndFeed inFeed = getFeed(url);
					feedEntries = inFeed.getEntries();
					synchronized (feedCache) {
						feedCache.put(url, feedEntries);
					}
				}

				entries.addAll(feedEntries);
			} catch (Exception e) {
				// let one feed fail and not blow up the rest.
			}
		}

		revChronSortEntries(entries);

		SyndFeedOutput output = new SyndFeedOutput();
		try {
			output.output(feed, writer);
		} catch (Exception e) {
			throw new RuntimeException("internal server error");
		}
	}

	public SyndFeed getFeed(String url) {
		try {
			URL inputUrl = new URL(url);
			SyndFeedInput input = new SyndFeedInput();
			SyndFeed inFeed = input.build(new XmlReader(inputUrl));

			revChronSortEntries(inFeed.getEntries());

			if (inFeed.getEntries().size() > 10) {
				inFeed.setEntries(inFeed.getEntries().subList(0, 10));
			}

			// Prefix each Title with the Feed Title so they can be distinguished when
			// rendered in browser.
			for (SyndEntry entry : inFeed.getEntries()) {
				entry.setTitle(inFeed.getTitle() + ": " + entry.getTitle());
			}
			return inFeed;
		} catch (Exception e) {
			return null;
		}
	}

	public void revChronSortEntries(List<SyndEntry> entries) {
		Collections.sort(entries, new Comparator<SyndEntry>() {
			@Override
			public int compare(SyndEntry s1, SyndEntry s2) {
				return s2.getPublishedDate().compareTo(s1.getPublishedDate());
			}
		});
	}

	public void getRssFeed(MongoSession mongoSession, String nodeId, Writer writer) {

		SubNode node = null;
		try {
			node = read.getNode(mongoSession, nodeId);
		} catch (NodeAuthFailedException e) {
			return;
		}

		SyndFeed feed = new SyndFeedImpl();
		feed.setFeedType("rss_2.0");

		String content = node.getContent();
		if (StringUtils.isEmpty(content)) {
			content = "n/a";
		}

		feed.setTitle("Quanta RSS Feed - Poof of Concept");
		feed.setLink("https://quanta.wiki"); // todo-0: put real link here
		feed.setDescription(content);

		List<SyndEntry> entries = new LinkedList<SyndEntry>();
		feed.setEntries(entries);

		final Iterable<SubNode> iter = read.getChildren(mongoSession, node,
				Sort.by(Sort.Direction.ASC, SubNode.FIELD_ORDINAL), null, 0);
		final List<SubNode> children = read.iterateToList(iter);

		if (children != null) {
			for (final SubNode n : children) {
				NodeMetaInfo metaInfo = subNodeUtil.getNodeMetaInfo(n);

				// Currently the link will be an attachment URL, but need to research how ROME
				// handles attachments.
				if (metaInfo.getLink() == null) {
					metaInfo.setLink(metaInfo.getUrl());
				}
				SyndEntry entry = new SyndEntryImpl();

				entry.setTitle(metaInfo.getTitle() != null ? metaInfo.getTitle() : "ID: " + n.getId().toHexString());
				entry.setLink(metaInfo.getLink() != null ? metaInfo.getLink() : "https://quanta.wiki");

				/*
				 * todo-1: need menu item "Set Create Time", and "Set Modify Time", that prompts
				 * with the datetime GUI, so publishers have more control over this in the feed,
				 * or else have an rssTimestamp as an optional property which can be set on any
				 * node to override this.
				 */
				entry.setPublishedDate(n.getCreateTime());
				SyndContent description = new SyndContentImpl();

				/*
				 * todo-1: NOTE: I tried putting some HTML into 'content' as a test and setting
				 * the mime type, but it doesn't render correctly, so I just need to research
				 * how to get HTML in RSS descriptions, but this is low priority for now so I'm
				 * not doing it yet
				 */
				description.setType("text/plain");
				// description.setType("text/html");
				description.setValue(metaInfo.getDescription() != null ? metaInfo.getDescription() : "");

				entry.setDescription(description);
				entries.add(entry);
			}
		}

		SyndFeedOutput output = new SyndFeedOutput();
		try {
			output.output(feed, writer);
		} catch (Exception e) {
			throw new RuntimeException("internal server error");
		}
	}

	// DO NOT DELETE - this is the code to convert to HTML
	// private Stringn convertMarkdownToHtml() {
	// MutableDataSet options = new MutableDataSet();
	// options.set(Parser.EXTENSIONS, Arrays.asList(TablesExtension.create(),
	// TocExtension.create()));
	// options.set(TocExtension.LEVELS, TocOptions.getLevels(1, 2, 3, 4, 5, 6));

	// // This numbering works in the TOC but I haven't figured out how to number
	// the
	// // actual headings in the body of the document itself.
	// // options.set(TocExtension.IS_NUMBERED, true);

	// Parser parser = Parser.builder(options).build();
	// HtmlRenderer renderer = HtmlRenderer.builder(options).build();

	// recurseNode(exportNode, 0);

	// Node document = parser.parse(markdown.toString());
	// String body = renderer.render(document);
	// }
}
