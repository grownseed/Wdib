window.addEvent('domready', function()
{
	//add error to notifications
	var error = function(msg)
	{
		new Element('div', {'class': 'error', 'text': msg}).inject($('notifications'));
	};

	if (navigator.geolocation)
	{
		var map,
			//create map container
			map_el = new Element('div', {'id': 'map_container'}).inject(document.body);

		//initialize map
		var initMap = function(position)
		{
			var latlng = position,
				map_options =
				{
					zoom: 15,
					center: latlng,
					mapTypeControl: false,
					navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};

			map = new google.maps.Map(map_el, map_options);
		};

		//add user marker on map
		var plotUser = function(position)
		{
			var marker = new google.maps.Marker(
			{
				position: position,
				map: map,
				title:"USER"
			});
		};

		//add business marker on map
		var plotBusiness = function(business)
		{
			var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + '00F',
				new google.maps.Size(21, 34),
				new google.maps.Point(0,0),
				new google.maps.Point(10, 34));

			var marker = new google.maps.Marker(
				{
					position: new google.maps.LatLng(business.location.coordinate.latitude, business.location.coordinate.longitude),
					map: map,
					title:"BUSINESS",
					icon: pinImage
				});
		};

		//join a channel
		var connectChannel = function(channel_id, location)
		{
			new Request.JSON(
				{
					url: '/channel/connect',
					data:
					{
						channel_id: channel_id,
						location: location
					},
					method: 'get',
					onSuccess: function(data)
					{
						Object.each(data.users, function(user)
						{
							plotUser(new google.maps.LatLng(user.location.coords.latitude, user.location.coords.longitude));
						});

						data.locations.businesses.each(function(business)
						{
							plotBusiness(business);
						});

						$(document.body).addClass('channel_on');
					},
					onFailure: function(err)
					{
						console.log(err);
					}
				}).send();
		};

		//get channel
		var getChannel = function(location, search)
		{
			new Request.JSON(
				{
					url: '/channel/new',
					data:
					{
						term: search
					},
					method: 'get',
					onSuccess: function(channel_id)
					{
						history.pushState(null, search, channel_id);

						connectChannel(channel_id, location);
					}
				}).send();
		};

		//get user's geolocation
		navigator.geolocation.getCurrentPosition(function(location)
			{
				var position = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);

				initMap(position);

				if (channel_id.trim() != '')
					connectChannel(channel_id, location);
				else
					plotUser(position);


				//search field
				var search_default = 'What are you after?',
					search_container = new Element('div', {id: 'search_container'}).inject($(document.body)),
					search_field = new Element('input',
						{
							id: 'search_field',
							type: 'text',
							events:
							{
								'focus': function()
								{
									if (this.get('value').trim() == search_default)
										this.set('value', '');
								},
								'blur': function()
								{
									if (this.get('value').trim() == '')
										this.set('value', search_default);
								},
								'keyup': function(e)
								{
									if (e.key == 'enter' && this.get('value').trim() != '')
										getChannel(location, this.get('value'));
								}
							}
						})
						.inject(search_container)
						.fireEvent('blur');
			},
			error);
	}else{
		error('Need geolocation');
	}
});