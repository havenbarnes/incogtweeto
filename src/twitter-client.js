import Twitter from 'twitter-lite';
import cache from 'node-file-cache';
import throttledQueue from 'throttled-queue';
import twitterConfig from './config/twitter-config.js';
import { formatTwitterUser } from './utils/twitter-utils.js';

const CACHE_KEY_PREFIXES = {
	GET_FOLLOWERS_IDS: 'followers/ids',
	GET_FRIENDS_IDS: 'friends/ids',
	GET_USER_SHOW: 'users/show',
};
export default class TwitterClient {
	constructor() {
		this.twit = new Twitter(twitterConfig);
		this.cache = cache.create({ life: 1800 });
		this.listThrottle = throttledQueue(1, 60000);
		this.userThrottle = throttledQueue(1, 1000);
	}

	async getFollowers(username) {
		const cacheKey = `${CACHE_KEY_PREFIXES.GET_FOLLOWERS_IDS}/${username}`;
		if (!!this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			const followers = await this.twit.get('followers/ids', { screen_name: username, count: 5000, stringify_ids: true });
			console.log(`Fetched ${followers.ids.length} followers of ${username}`);
			this.cache.set(cacheKey, followers.ids);
			return followers.ids;
		} catch (error) {
			console.log(error);
		}
	}

	async getFriends(username) {
		const cacheKey = `${CACHE_KEY_PREFIXES.GET_FRIENDS_IDS}/${username}`;
		if (!!this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			const friends = await new Promise((resolve, reject) => {
				this.listThrottle(async () => {
					const result = await this.twit.get('friends/ids', { screen_name: username, count: 5000, stringify_ids: true });
					resolve(result);
				});
			});

			console.log(`Fetched ${friends.ids.length} who follow ${username}`);
			this.cache.set(cacheKey, friends.ids);
			return friends.ids;
		} catch (error) {
			console.log(error);
		}
	}

	async getUser(userId) {
		const cacheKey = `${CACHE_KEY_PREFIXES.GET_USER_SHOW}/${userId}`;
		if (!!this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			let user = await new Promise((resolve, reject) => {
				this.userThrottle(async () => {
					const result = await this.twit.get('users/show', { user_id: `${userId}` });
					resolve(result);
				});
			});
			user = formatTwitterUser(user);
			this.cache.set(cacheKey, user);
			return user;
		} catch (error) {
			console.log(error);
		}
	}
}
