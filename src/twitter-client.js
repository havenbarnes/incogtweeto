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
		this.cache = cache.create({ life: 172800 });
		this.listThrottle = throttledQueue(1, 61000);
		this.userThrottle = throttledQueue(1, 1200);
	}

	async getFriends(username) {
		const cacheKey = `${CACHE_KEY_PREFIXES.GET_FRIENDS_IDS}/${username}`;
		if (!!this.cache.get(cacheKey)) {
			console.log(`Fetched ${username} friends from cache`);
			return this.cache.get(cacheKey);
		}

		console.log('Queueing request to grab friends of ', username);
		const friends = await new Promise((resolve, reject) => {
			this.listThrottle(async () => {
				try {
					const result = await this.twit.get('friends/ids', { screen_name: username, count: 5000, stringify_ids: true });
					resolve(result);
				} catch (error) {
					console.log(`Error fetching friends for ${username}`, error);
					resolve({ ids: [] });
				}
			});
		});

		console.log(`Fetched ${friends.ids.length} who follow ${username}`);
		this.cache.set(cacheKey, friends.ids);
		return friends.ids;
	}

	async getUser(userId) {
		const cacheKey = `${CACHE_KEY_PREFIXES.GET_USER_SHOW}/${userId}`;
		if (!!this.cache.get(cacheKey)) {
			console.log(`Fetched ${userId} user from cache`);
			return this.cache.get(cacheKey);
		}

		let user = await new Promise((resolve, reject) => {
			this.userThrottle(async () => {
				try {
					const result = await this.twit.get('users/show', { user_id: `${userId}` });
					resolve(result);
				} catch (error) {
					console.log(`Error fetching user ${userId}`, error);
					resolve({ id_str: '12345', screen_name: 'not_found', followers_count: 9999999, friends_count: 9999999 });
				}
			});
		});
		user = formatTwitterUser(user);
		console.log(`Fetched ${userId} user`);
		this.cache.set(cacheKey, user);
		return user;
	}
}
