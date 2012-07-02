var channels = {};

app.get('/channel/new', function(req, res)
{
	var channel_id = Math.random().toString(36).substr(2, 7);

	channels[channel_id] =
	{
		users: {},
		term: req.query['term'],
		last_updated: new Date().getTime()
	};

	res.send(JSON.stringify(channel_id));
});

app.get('/channel/updateUser', function(req, res)
{
	if (req.query['location'] || req.query['name'])
	{
		if (req.query['location'])
			channels[req.query['channel_id']].users[req.sessionID].location = req.query['location'];

		if (req.query['name'])
			channels[req.query['channel_id']].users[req.sessionID].location = req.query['name'];

		channels[req.query['channel_id']].last_updated = new Date().getTime();
	}

	res.send(JSON.stringify({}));
});

app.get('/channel/update', function(req, res)
{
	if (req.query['channel_id'])
	{
		if (channels[req.query['channel_id']])
		{
			if (req.query['ts'])
			{
				if (req.query['ts'] == channels[req.query['channel_id']].last_updated)
				{
					res.send(JSON.stringify('NO_UPDATE'));
				}else{
					req.session.channel_id = req.query['channel_id'];
					res.redirect('/channel/results');
				}
			}else{
				res.send('No timestamp', 500);
			}
		}else{
			res.send('This channel does not exist', 500);
		}
	}else{
		res.send('No channel specified', 500);
	}
});

app.get('/channel/connect', function(req, res)
{
	if (req.query['channel_id'])
	{
		if (channels[req.query['channel_id']])
		{
			if (channels[req.query['channel_id']].users[req.sessionID] === undefined)
			{
				channels[req.query['channel_id']].users[req.sessionID] =
				{
					location: req.query['location'],
					name: 'anonymous'
				};

				channels[req.query['channel_id']].last_updated = new Date().getTime();
			}

			req.session.channel_id = req.query['channel_id'];
			res.redirect('/channel/results');
		}else{
			res.send('This channel does not exist');
		}
	}else{
		res.send('No channel specified **', 500);
	}
});

app.get('/channel/results', function(req, res)
{
	var channel_id = req.query['channel_id'] || req.session.channel_id;

	delete req.session.channel_id;

	if (channel_id)
	{
		if (channels[channel_id])
		{
			//get centroid of all users within channel
			var centroid = {latitude: 0, longitude: 0},
				users_nb = 0;

			for (var user in channels[channel_id].users)
			{
				centroid.latitude += parseFloat(channels[channel_id].users[user].location.coords.latitude);
				centroid.longitude += parseFloat(channels[channel_id].users[user].location.coords.longitude);

				users_nb++;
			}

			centroid.latitude /= users_nb;
			centroid.longitude /= users_nb;

			yelp.search({term: req.query['term'], ll: centroid.latitude + ',' + centroid.longitude}, function(err, locations)
			{
				if (!err)
					res.send(JSON.stringify({locations: locations, users: channels[channel_id].users, ts: channels[channel_id].last_updated }));
				else
					res.send(JSON.stringify(err), 500);
			});
		}else{
			res.send('This channel does not exist');
		}
	}else{
		res.send('No channel specified', 500);
	}
});

app.get('/:id', function(req, res)
{
	if (channels[req.params.id] !== undefined)
	{
		res.render('index', { title: 'wdib', channel_id: req.params.id });
	}else{
		res.redirect('/');
	}
});