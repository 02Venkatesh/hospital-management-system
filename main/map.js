/*let map, service, directionsService, directionsRenderer;

function initMap() {
  // Initialize the map centered on a default location (Chennai)
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 13.0827, lng: 80.2707 } // Default to Chennai
  });

  // Initialize the Directions Services and Renderer
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // Add event listener for the 'Find' button
  document.getElementById("find-button").addEventListener("click", function () {
    const location = document.getElementById("location-input").value;
    if (location) {
      geocodeAndSearch(location);
    } else {
      alert("Please enter a location");
    }
  });
}

function geocodeAndSearch(location) {
  const geocoder = new google.maps.Geocoder();
  // Geocode the location entered by the user
  geocoder.geocode({ address: location }, function (results, status) {
    if (status === "OK") {
      const userLocation = results[0].geometry.location;
      map.setCenter(userLocation);
      searchNearbyHospitals(userLocation);
    } else {
      alert("Geocode failed: " + status);
    }
  });
}

function searchNearbyHospitals(location) {
  const request = {
    location: location,
    radius: 5000, // Search within a 5km radius
    type: ["hospital"]
  };

  // Initialize the Places Service
  service = new google.maps.places.PlacesService(map);

  // Search for nearby hospitals
  service.nearbySearch(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach(place => {
        const marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location,
          title: place.name
        });

        // Add event listener to marker to show directions when clicked
        marker.addListener("click", function () {
          showDirections(location, place.geometry.location);
        });
      });
    }
  });
}

function showDirections(origin, destination) {
  // Request directions from the user's location to the hospital
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING
  }, function (response, status) {
    if (status === "OK") {
      directionsRenderer.setDirections(response);
    } else {
      alert("Directions request failed: " + status);
    }
  });
}

// Initialize the map when the page is ready
window.initMap = initMap;*/
let map, service, directionsService, directionsRenderer, userMarker;

function initMap() {
  // Initialize the map centered on a default location (Chennai)
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 13.0827, lng: 80.2707 } // Default to Chennai
  });

  // Initialize the Directions Services and Renderer
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // Add event listener for the 'Find' button
  document.getElementById("find-button").addEventListener("click", function () {
    const location = document.getElementById("location-input").value;
    if (location) {
      geocodeAndSearch(location);
    } else {
      alert("Please enter a location");
    }
  });

  // Try to get the user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(userLocation);

      // Add a marker for the user's location
      if (userMarker) {
        userMarker.setPosition(userLocation);
      } else {
        userMarker = new google.maps.Marker({
          map: map,
          position: userLocation,
          title: "Your Location",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // Blue marker for user
          }
        });
      }

      // Search for nearby hospitals
      searchNearbyHospitals(userLocation);
    }, function () {
      alert("Error: The Geolocation service failed.");
    });
  } else {
    alert("Error: Your browser doesn't support geolocation.");
  }
}

function geocodeAndSearch(location) {
  const geocoder = new google.maps.Geocoder();
  // Geocode the location entered by the user
  geocoder.geocode({ address: location }, function (results, status) {
    if (status === "OK") {
      const userLocation = results[0].geometry.location;
      map.setCenter(userLocation);
      searchNearbyHospitals(userLocation);
    } else {
      alert("Geocode failed: " + status);
    }
  });
}

function searchNearbyHospitals(location) {
  const request = {
    location: location,
    radius: 5000, // Search within a 5km radius
    type: ["hospital"]
  };

  // Initialize the Places Service
  service = new google.maps.places.PlacesService(map);

  // Search for nearby hospitals
  service.nearbySearch(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach(place => {
        // Request detailed information for each place
        service.getDetails({ placeId: place.place_id }, function (placeDetails, detailsStatus) {
          if (detailsStatus === google.maps.places.PlacesServiceStatus.OK) {
            // Check if the place is categorized as a hospital in the details
            const isHospital = placeDetails.types.includes("hospital");
            
            if (isHospital) {
              const marker = new google.maps.Marker({
                map: map,
                position: placeDetails.geometry.location,
                title: placeDetails.name
              });

              // Add event listener to marker to show directions when clicked
              marker.addListener("click", function () {
                showDirections(location, placeDetails.geometry.location);
              });
            }
          }
        });
      });
    } else {
      alert("No hospitals found in the vicinity.");
    }
  });
}

function showDirections(origin, destination) {
  // Request directions from the user's location to the hospital
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING
  }, function (response, status) {
    if (status === "OK") {
      directionsRenderer.setDirections(response);
    } else {
      alert("Directions request failed: " + status);
    }
  });
}

// Initialize the map when the page is ready
window.initMap = initMap;
