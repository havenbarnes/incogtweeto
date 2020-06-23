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
		const followers = await this.twit.get('followers/list', { screen_name: username });
		return followers.users.map((user) => user.screen_name);
	}

	async getFollowing(username) {
		const followers = await this.twit.get('friends/list', { screen_name: username });
		return followers.users.map((user) => user.screen_name);
	}
}
