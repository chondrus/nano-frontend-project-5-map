/*
 * knockout app management
 */
var ViewModel = function() {
    var self = this;

    self.counter = ko.observable(0);
    self.btntext = ko.observable('This is a cool button');

    self.incrementCounter = function() {
        self.counter(self.counter() + 1);
    };

    // self.gmap = new initMap();
};

ko.applyBindings(new ViewModel());

/*
 * google maps funtionality
 */
function initMap() {
    var mapDiv = document.getElementById('map');
    var map = new google.maps.Map(mapDiv, {
        center: {lat: 44.540, lng: -78.546},
        zoom: 8
    });
}