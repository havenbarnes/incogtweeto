import TwitterClient from './twitter-client.js';

const client = new TwitterClient();

const getNLeastFollowed = async (friends, N, maxFollowers) => {
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
	ranked = ranked.filter((r) => r.intersectionSize > 0);
	return ranked.map((f) => {
		return {
			username: f.username,
			intersection: f.intersectionSize / friendsSet.size,
		};
	});
};

const main = async () => {
	const username = process.env.TWITTER_USER;

	// Get everyone who <username> follows
	const friends = await client.getFriends(username);
	// Get the 10 least-followed people they follow
	const specialFriends = await getNLeastFollowed(friends, 10, 300);
	let candidates = [...specialFriends];
	// then grab nested special followers of these special friends, put them all in a big list together
	for (const f of specialFriends) {
		const fFollowers = await client.getFollowers(f.username);
		const fSpecialFriends = await getNLeastFollowed(fFollowers, 10, 300);
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
	let dedupedPotentials = Array.from(new Set(potentialsRanked));
	dedupedPotentials = dedupedPotentials.filter((p) => p.username !== username);
	console.log(
		`\n\nPotential Real Identities of ${username} (in order of likelihood):\n${dedupedPotentials.map(
			(p) => `\n${p.username} - intersection: ${(p.intersection * 100).toFixed(2)}%`,
		)}`,
	);
};

main();
