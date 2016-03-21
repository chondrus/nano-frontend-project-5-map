/*
 * knockout app management
 */
var interestingLocations = [
    {
        name: '0th Location',
        clickCount: 0,
    },
    {
        name: '1st Location',
        clickCount: 0,
    }
];

var Location = function(data) {
    this.name = ko.observable(data.name);
    this.clickCount = ko.observable(data.clickCount);
}


var ViewModel = function() {
    var self = this;

    self.counter = ko.observable(0);
    self.btntext = ko.observable('This is a cool button');

    self.incrementCounter = function() {
        self.counter(self.counter() + 1);
    };

    
};

ko.applyBindings(new ViewModel());

/*
 * google maps funtionality
 *
 */

var map;

function initMap() {
    var mapDiv = document.getElementById('map');
    map = new google.maps.Map(mapDiv, {
        center: {lat: 42.359, lng: -71.062},
        // zoom: 15
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    // Create a <script> tag and set the USGS URL as the source.
    var script = document.createElement('script');

    script.src = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojsonp';
    document.getElementsByTagName('head')[0].appendChild(script);
}

function eqfeed_callback(results) {
  map.data.addGeoJson(results);
}

// Call the initialize function after the page has finished loading
google.maps.event.addDomListener(window, 'load', initialize);







































