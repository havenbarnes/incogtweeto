import TwitterClient from './twitter-client.js';

const client = new TwitterClient();

const getNLeastFollowedFollowers = async (username, N) => {
	const followers = await client.getFollowers(username);
	const userPromises = followers.map(async (id) => {
		const user = await client.getUser(id);
		return user;
	});
	const users = await Promise.all(userPromises);
	console.log(users[0]);
};

const main = async () => {
	const username = process.env.TWITTER_USER;
	const tenFollowers = await getNLeastFollowedFollowers(username, 10);
};

main();
