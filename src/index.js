import TwitterClient from './twitter-client.js';

const client = new TwitterClient();

const getNLeastFollowedFriends = async (friends, N, maxFollowers) => {
	const userPromises = friends.map(async (id) => {
		const user = await client.getUser(id);
		return user;
	});
	let users = await Promise.all(userPromises);
	users = users.sort((a, b) => a.followers - b.followers);
	users = users.slice(0, N);
	users = users.filter((u) => u.followers <= maxFollowers);
	return users;
};

const getIntersectionSize = (set1, set2) => {
	return new Set([...set1].filter((x) => set2.has(x))).size;
};

const getPotentialRankingByIntersection = (friendsSet, potentialWinners) => {
	const friendsWithRankings = potentialWinners.map((potential) => {
		return {
			intersectionSize: getIntersectionSize(friendsSet, potential.friends),
			...potential,
		};
	});
	let ranked = friendsWithRankings.sort((a, b) => b.intersectionSize - a.intersectionSize);
	return ranked.map((f) => f.username);
};

const main = async () => {
	const username = process.env.TWITTER_USER;

	// Get everyone who <username> follows
	const friends = await client.getFriends(username);
	// Get the 10 least-followed people they follow
	const specialFriends = await getNLeastFollowedFriends(friends, 10, 300);
	let candidates = [...specialFriends];
	// then grab nested special friends of these special friends, put them all in a big list together
	for (const f of specialFriends) {
		const fFriends = await client.getFriends(f.username);
		const fSpecialFriends = await getNLeastFollowedFriends(fFriends, 10, 300);
		candidates = [...fSpecialFriends, ...candidates];
	}

	// See which people the special friends follow
	const potentialWinners = await Promise.all(
		candidates.map(async (user) => {
			const userFriends = await client.getFriends(user.username);
			return {
				username: user.username,
				friends: new Set(userFriends),
			};
		}),
	);

	const potentialsRanked = getPotentialRankingByIntersection(new Set(friends), potentialWinners);
	console.log(potentialsRanked);
};

main();
