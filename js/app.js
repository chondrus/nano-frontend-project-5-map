/*
 * data
 */
var interestingLocations = [
    {
        contentString: '0th Location',
        position: new google.maps.LatLng(42.359, -71.062),
    },
    {
        contentString: '1st Location',
        position: new google.maps.LatLng(42.358, -71.061),
    }
];

/*
 * knockout app management
 */

// var Location = function(data) {
//     this.name = ko.observable(data.name);
//     this.clickCount = ko.observable(data.clickCount);
// }


var ViewModel = function() {
    var self = this;

    self.counter = ko.observable(0);
    self.btntext = ko.observable('This is a cool button');

    self.incrementCounter = function() {
        self.counter(self.counter() + 1);
    };

    
};

/*
 * google maps funtionality
 *
 */

var map;

function initMap() {

    var mapDiv = document.getElementById('map');
    map = new google.maps.Map(mapDiv, {
        center: {lat: 42.359, lng: -71.062},
        zoom: 15
    });

    for (var i = 0, feature; feature = interestingLocations[i]; i++) {
        addMarker(feature);
    }
}

function addMarker(feature) {
    var infoWindow = new google.maps.InfoWindow({
        content: feature.contentString
    });

    var marker = new google.maps.Marker({
        position: feature.position,
        // icons: icons[feature.type].icon,
        map: map,
        title: 'my title'
    });

    marker.addListener('click', function() {
        infoWindow.open(map, marker);
    })
}

/*
 * Create the application
 */

// ko
ko.applyBindings(new ViewModel());

// Call the initialize function after the page has finished loading
google.maps.event.addDomListener(window, 'load', initMap);







































