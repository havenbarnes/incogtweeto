import TwitterClient from './twitter-client.js';

const main = async () => {
	const client = new TwitterClient();
	const username = process.env.TWITTER_USER;
	const followers = await client.getFollowers(username);
	console.log('Followers', followers);
	const following = await client.getFollowing(username);
	console.log('Following', following);
};

main();
