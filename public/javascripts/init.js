window.addEvent('domready', function()
{
	if (navigator.geolocation)
	{
		var map,
			map_el = new Element('div', {'id': 'map_container'}).inject(document.body);

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

		var plotUser = function(position)
		{
			var marker = new google.maps.Marker(
			{
				position: position,
				map: map,
				title:"Woop Woop"
			});
		};

		var error = function(msg)
		{
			console.log(msg);
		};

		navigator.geolocation.getCurrentPosition(function(location)
			{
				var position = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);

				initMap(position);
				plotUser(position);
			},
			error);
	}else{
		console.log('need geolocation');
	}
});