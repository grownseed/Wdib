window.addEvent('load', function()
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
			map_el = new Element('div', {'id': 'map_container'}).inject(document.body),
			markers = [],
			ts = 0,
			last_location,
			dataRefresh = null;

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
		var plotUser = function(position, me)
		{
			var pinImage = new google.maps.MarkerImage
				(
					'/images/marker_' + (me ? 'me' : 'user') + '.png',
					new google.maps.Size(40, 40),
					new google.maps.Point(0,0),
					new google.maps.Point(20, 40),
					new google.maps.Size(40, 40)
				);

			var marker = new google.maps.Marker(
				{
					position: position,
					map: map,
					title:"USER",
					icon: pinImage
				});

			markers.push(marker);
		};

		//add business marker on map
		var plotBusiness = function(business)
		{
			var pinImage = new google.maps.MarkerImage
				(
					'/images/marker_business.png',
					new google.maps.Size(40, 40),
					new google.maps.Point(0,0),
					new google.maps.Point(20, 40),
					new google.maps.Size(40, 40)
				);

			var marker = new google.maps.Marker(
				{
					position: new google.maps.LatLng(business.location.coordinate.latitude, business.location.coordinate.longitude),
					map: map,
					title:"BUSINESS",
					icon: pinImage
				});

			markers.push(marker);
		};

		//update request
		var updateRequest = new Request.JSON(
			{
				url: '/channel/update',
				link: 'cancel',
				method: 'get',
				onSuccess: function(data)
				{
					if (data != 'NO_UPDATE')
						updateMarkers(data);
				}
			});

		//update location
		var updateLocation = function(location)
		{
			if (location.coords.latitude != last_location.coords.latitude || location.coords.longitude != last_location.coords.longitude)
			{
				last_location = location;

				new Request.JSON(
					{
						url: '/channel/updateUser',
						method: 'get',
						data:
						{
							channel_id: channel_id,
							location: location
						}
					}).send();
			}
		};

		//clear markers
		var clearMarkers = function()
		{
			markers.each(function(marker)
			{
				marker.setMap(null);
			});
		};

		//update markers
		var updateMarkers = function(data)
		{
			var centroidLatLng = new google.maps.LatLng(data.centroid.latitude, data.centroid.longitude),
				latlngBounds = new google.maps.LatLngBounds(centroidLatLng, centroidLatLng);

			clearMarkers();

			ts = data.ts;

			Object.each(data.users, function(user)
			{
				var userLatLng = new google.maps.LatLng(user.location.coords.latitude, user.location.coords.longitude);

				latlngBounds.extend(userLatLng);

				plotUser(userLatLng, user.me);
			});

			data.locations.businesses.each(function(business)
			{
				var businessLatLng = new google.maps.LatLng(business.location.coordinate.latitude, business.location.coordinate.longitude);

				latlngBounds.extend(businessLatLng);

				plotBusiness(business);
			});

			//pan map
			map.fitBounds(latlngBounds);

			//reset update interval
			if (dataRefresh)
				clearInterval(dataRefresh);

			dataRefresh = updateRequest.send.periodical(5000, updateRequest, 'channel_id=' + channel_id + '&ts=' + ts);
		};

		//join a channel
		var connectChannel = function(location)
		{
			last_location = location;

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
						updateMarkers(data);

						$(document.body).addClass('channel_on');

						navigator.geolocation.watchPosition(updateLocation);
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
					onSuccess: function(channel)
					{
						channel_id = channel;

						history.pushState(null, search, channel_id);

						connectChannel(location);
					}
				}).send();
		};

		//get user's geolocation
		navigator.geolocation.getCurrentPosition(function(location)
			{
				var position = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);

				initMap(position);

				if (channel_id.trim() != '')
					connectChannel(location);
				else
					plotUser(position, true);

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