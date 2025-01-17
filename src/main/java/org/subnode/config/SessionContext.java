package org.subnode.config;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.TimeZone;
import javax.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.subnode.model.UserPreferences;
import org.subnode.model.client.PrincipalName;
import org.subnode.mongo.MongoSession;
import org.subnode.mongo.MongoUtil;
import org.subnode.response.SessionTimeoutPushInfo;
import org.subnode.service.UserFeedService;
import org.subnode.util.DateUtil;
import org.subnode.util.StopwatchEntry;
import org.subnode.util.ThreadLocals;
import org.subnode.util.Util;

/**
 * The ScopedProxyMode.TARGET_CLASS annotation allows this session bean to be available on
 * singletons or other beans that are not themselves session scoped.
 */
@Component
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class SessionContext {
	// DO NOT DELETE (keep for future ref)
	// implements InitializingBean, DisposableBean {
	private static final Logger log = LoggerFactory.getLogger(SessionContext.class);

	private boolean live = true;

	@Autowired
	private UserFeedService userFeedService;

	/* Identification of user's account root node. */
	private String rootId;

	/*
	 * When the user does a "Timeline" search we store the path of the node the timeline was done on so
	 * that with a simple substring search, we can detect any time a new node is added that would've
	 * appeared in the timeline and then do a server push to browsers of any new nodes, thereby creating
	 * a realtime view of the timeline, making it become like a "chat room"
	 */
	private String timelinePath;

	private String userName = PrincipalName.ANON.s();
	private String pastUserName = userName;

	private String ip;

	private MongoSession ms = new MongoSession();

	private String timezone;
	private String timeZoneAbbrev;

	// variable not currently being used (due to refactoring)
	private long lastLoginTime;
	private long lastActiveTime;

	private UserPreferences userPreferences;

	/* Initial id param parsed from first URL request */
	private String urlId;

	public int counter;

	/* Emitter for sending push notifications to the client */
	private SseEmitter pushEmitter = new SseEmitter();

	// this one WILL work with multiple sessions per user
	public static final HashSet<SessionContext> allSessions = new HashSet<>();

	// Full list of active and inactive (dead) sessions.
	public static final HashSet<SessionContext> historicalSessions = new HashSet<>();

	/* keeps track of total calls to each URI */
	public HashMap<String, Integer> actionCounters = new HashMap<>();

	public final List<StopwatchEntry> stopwatchData = new LinkedList<>();

	private String captcha;
	private int captchaFails = 0;

	/*
	 * If this time is non-null it represents the newest time on the first node of the first page of
	 * results the last time query query for the first page (page=0) was done. We use this so that in
	 * case the database is updated with new results, none of those results can alter the pagination and
	 * the pagination will be consistent until the user clicks refresh feed again. The case we are
	 * avoiding is for example when user clicks 'more' to go to page 2, if the database had updated then
	 * even on page 2 they may be seeing some records they had already seen on page 1
	 */
	private Date feedMaxTime;

	private String userToken;

	public SessionContext() {
		log.trace(String.format("Creating Session object hashCode[%d]", hashCode()));
		synchronized (allSessions) {
			allSessions.add(this);
		}
		synchronized (historicalSessions) {
			historicalSessions.add(this);
		}
	}

	public List<StopwatchEntry> getStopwatchData() {
		return stopwatchData;
	}

	public void addAction(String actionName) {
		Integer count = actionCounters.get(actionName);
		if (count == null) {
			actionCounters.put(actionName, 1);
		} else {
			actionCounters.put(actionName, count.intValue() + 1);
		}
	}

	public String dumpActions(String prefix, int countThreshold) {
		StringBuilder sb = new StringBuilder();
		for (String actionName : actionCounters.keySet()) {
			Integer count = (Integer) actionCounters.get(actionName);
			if (count.intValue() >= countThreshold) {
				sb.append(prefix);
				sb.append(actionName);
				sb.append(" ");
				sb.append(String.valueOf(count));
				sb.append("\n");
			}
		}
		return sb.toString();
	}

	/* This is called only upon successful login of a non-anon user */
	public void setAuthenticated(String userName) {
		if (userName.equals(PrincipalName.ANON.s())) {
			throw new RuntimeException("invalid call to setAuthenticated for anon.");
		}

		if (userToken == null) {
			userToken = Util.genStrongToken();
		}
		log.debug("sessionContext authenticated hashCode=" + String.valueOf(hashCode()) + " user: " + userName + " to userToken "
				+ userToken);
		setUserName(userName);
	}

	public boolean isAuthenticated() {
		return userToken != null;
	}

	/*
	 * We rely on the secrecy and unguessability of the token here, but eventually this will become JWT
	 * and perhaps use Spring Security
	 */
	public static boolean validToken(String token, String userName) {
		if (token == null)
			return false;

		synchronized (allSessions) {
			for (SessionContext sc : allSessions) {
				if (token.equals(sc.getUserToken())) {
					if (userName != null) {
						// need to add IP check here too, but IP can be spoofed?
						return userName.equals(sc.getUserName());
					} else {
						return true;
					}
				}
			}
		}
		return false;
	}

	public static boolean serverPushTest(UserFeedService svc) {
		// for (SessionContext sc : allSessions) {
		// log.debug("ServerPush Test: sessionUserName=" + sc.getUserName());
		// svc.sendServerPushInfo(sc, new SessionTimeoutPushInfo());
		// }
		return false;
	}

	public String getUserToken() {
		return userToken;
	}

	public static List<SessionContext> getAllSessions() {
		synchronized (allSessions) {
			return new LinkedList<SessionContext>(allSessions);
		}
	}

	public static List<SessionContext> getHistoricalSessions() {
		synchronized (historicalSessions) {
			return new LinkedList<SessionContext>(historicalSessions);
		}
	}

	public static List<SessionContext> getSessionsByUserName(String userName) {
		if (userName == null)
			return null;

		List<SessionContext> list = null;
		synchronized (allSessions) {
			for (SessionContext sc : allSessions) {
				if (userName.equals(sc.getUserName())) {
					if (list == null) {
						list = new LinkedList<SessionContext>();
					}
					list.add(sc);
				}
			}
		}
		return list;
	}

	@PreDestroy
	public void preDestroy() {
		log.trace(String.format("Destroying Session object hashCode[%d] of user %s", hashCode(), userName));
		userFeedService.sendServerPushInfo(this, new SessionTimeoutPushInfo());

		synchronized (allSessions) {
			// This "lastActiveTime", should really be called "last message checked time", becaues that's the
			// purpose
			// it serves, so I think setting this here is undesirable, but we should only reset when the
			// user is really checking their messages (like in UserFeedService), where this logic was moved to.
			// userManagerService.updateLastActiveTime(this);
			allSessions.remove(this);
			setLive(false);
		}
	}

	public boolean isAdmin() {
		return PrincipalName.ADMIN.s().equalsIgnoreCase(userName);
	}

	public boolean isAnonUser() {
		return PrincipalName.ANON.s().equalsIgnoreCase(userName);
	}

	public boolean isTestAccount() {
		return MongoUtil.isTestAccountName(userName);
	}

	public String formatTimeForUserTimezone(Date date) {
		if (date == null)
			return null;

		/* If we have a short timezone abbreviation display timezone with it */
		if (getTimeZoneAbbrev() != null) {

			SimpleDateFormat dateFormat = new SimpleDateFormat(DateUtil.DATE_FORMAT_NO_TIMEZONE, DateUtil.DATE_FORMAT_LOCALE);
			if (getTimezone() != null) {
				dateFormat.setTimeZone(TimeZone.getTimeZone(getTimezone()));
			}

			return dateFormat.format(date) + " " + getTimeZoneAbbrev();
		}
		/* else display timezone in standard GMT format */
		else {

			SimpleDateFormat dateFormat = new SimpleDateFormat(DateUtil.DATE_FORMAT_WITH_TIMEZONE, DateUtil.DATE_FORMAT_LOCALE);
			if (getTimezone() != null) {
				dateFormat.setTimeZone(TimeZone.getTimeZone(getTimezone()));
			}

			return dateFormat.format(date);
		}
	}

	/*
	 * This can create nasty bugs. I should be always getting user name from the actual session object
	 * itself in all the logic... in most every case except maybe login process.
	 */
	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		if (userName != null) {
			pastUserName = userName;
		}
		this.userName = userName;
	}

	public String getPastUserName() {
		return pastUserName;
	}

	public void setPastUserName(String pastUserName) {
		this.pastUserName = pastUserName;
	}


	public String getUrlId() {
		return urlId;
	}

	public void setUrlId(String urlId) {
		this.urlId = urlId;
	}

	public String getTimezone() {
		return timezone;
	}

	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}

	public String getTimeZoneAbbrev() {
		return timeZoneAbbrev;
	}

	public void setTimeZoneAbbrev(String timeZoneAbbrev) {
		this.timeZoneAbbrev = timeZoneAbbrev;
	}

	public String getRootId() {
		return rootId;
	}

	public void setRootId(String rootId) {
		this.rootId = rootId;
	}

	public UserPreferences getUserPreferences() {
		return userPreferences;
	}

	public void setUserPreferences(UserPreferences userPreferences) {
		this.userPreferences = userPreferences;
	}

	public long getLastLoginTime() {
		return lastLoginTime;
	}

	public void setLastLoginTime(long lastLoginTime) {
		this.lastLoginTime = lastLoginTime;
	}

	public long getLastActiveTime() {
		return lastActiveTime;
	}

	public void setLastActiveTime(long lastActiveTime) {
		this.lastActiveTime = lastActiveTime;
	}

	public SseEmitter getPushEmitter() {
		return pushEmitter;
	}

	public void setPushEmitter(SseEmitter pushEmitter) {
		this.pushEmitter = pushEmitter;
	}

	public Date getFeedMaxTime() {
		return feedMaxTime;
	}

	public void setFeedMaxTime(Date feedMaxTime) {
		this.feedMaxTime = feedMaxTime;
	}

	public String getCaptcha() {
		return captcha;
	}

	public void setCaptcha(String captcha) {
		this.captcha = captcha;
	}

	public int getCaptchaFails() {
		return captchaFails;
	}

	public void setCaptchaFails(int captchaFails) {
		this.captchaFails = captchaFails;
	}

	public String getTimelinePath() {
		return timelinePath;
	}

	public void setTimelinePath(String timelinePath) {
		this.timelinePath = timelinePath;
	}

	public MongoSession getMongoSession() {
		return ms;
	}

	public void setMongoSession(MongoSession ms) {
		this.ms = ms;
	}

	public String getIp() {
		return ip;
	}

	public void setIp(String ip) {
		this.ip = ip;
	}

	public boolean isLive() {
		return live;
	}

	public void setLive(boolean live) {
		this.live = live;
	}

	// DO NOT DELETE: Keep for future reference
	// // from DisposableBean interface
	// @Override
	// public void destroy() throws Exception {
	// //log.debug("SessionContext destroy hashCode=" + String.valueOf(hashCode()) + ": userName=" +
	// this.userName);
	// }

	// // From InitializingBean interface
	// @Override
	// public void afterPropertiesSet() throws Exception {}

	public void stopwatch(String action) {
		// for now only admin user has stopwatch capability
		if (userName == null || !userName.equals(PrincipalName.ADMIN.s()))
			return;

		StopwatchEntry se = null;

		String threadName = Thread.currentThread().getName();
		threadName = threadName.replace("https-jsse-nio-443-exec-", "T");

		if (ThreadLocals.getStopwatchTime() == -1) {
			se = new StopwatchEntry(action, -1, threadName);
			log.debug("Stopwatch: " + action);
		} else {
			Integer duration = (int) (System.currentTimeMillis() - ThreadLocals.getStopwatchTime());
			se = new StopwatchEntry(action, duration, threadName);
			log.debug("Stopwatch: " + action + " elapsed: " + String.valueOf(duration) + "ms");
		}

		synchronized (stopwatchData) {
			stopwatchData.add(se);
		}
		ThreadLocals.setStopwatchTime(System.currentTimeMillis());
	}
}
