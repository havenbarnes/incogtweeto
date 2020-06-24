import Twitter from 'twitter-lite';
import twitterConfig from './config/twitter-config.js';

export default class TwitterClient {
	constructor() {
		this.twit = this.initializeTwitter();
	}

	initializeTwitter() {
		return new Twitter(twitterConfig);
	}

	async getFollowers(username) {
		const followers = await this.twit.get('followers/ids', { screen_name: username, count: 5000, stringify_ids: true });
		return followers.ids;
	}

	async getFollowing(username) {
		const followers = await this.twit.get('friends/ids', { screen_name: username, count: 5000, stringify_ids: true });
		return followers.ids;
	}

	async getUser(userId) {
		let user;
		try {
			user = await this.twit.get('users/lookup', { user_id: `${userId}` });
		} catch (error) {
			console.log(error);
		}
		return user;
	}
}
