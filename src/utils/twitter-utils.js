export const formatTwitterUser = (user) => {
	return {
		id: user.id_str,
		username: user.screen_name,
		followers: user.followers_count,
		following: user.friends_count,
	};
};
