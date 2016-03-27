/*
 * Maaaagic globals! (that aren't functions)
 */

var map;
var allMarkers = [];


/*
 * data
 */
var initialLocations = [
    // {
    //     name: 'Numero Uno',
    //     contentString: '0th Location',
    //     position: new google.maps.LatLng(42.359, -71.062),
    //     clickCount: 0
    // },
    // {
    //     name: "Zahl Zwei",
    //     contentString: '1st Location',
    //     position: new google.maps.LatLng(42.358, -71.061),
    //     clickCount: 0
    // },
    {
        id: 12,
        name: "Museum of Science",
        contentString: "could be fun!",
        position: new google.maps.LatLng(42.367796, -71.073451),
    },
    {
        id: 2,
        name: "Aquarium",
        contentString: "fish fish fish",
        position: new google.maps.LatLng(42.359248, -71.050662),
    },
    {
        id: 1,
        name: "Museum of Art",
        contentString: "art art art",
        position: new google.maps.LatLng(42.339198, -71.090732)
    },
    {
        id: 37,
        name: "Fenway",
        contentString: "Perfect for baseball fans",
        position: new google.maps.LatLng(42.346914, -71.099412)
    },
    {
        id: 36,
        name: "Make way for Duckings",
        contentString: "ducks ducks ducks",
        position: new google.maps.LatLng(42.355795, -71.0718667)
    }
];

/*
 * knockout app management
 */

// var Location = function(data) {
//     this.name = ko.observable(data.name);
//     this.clickCount = ko.observable(data.clickCount);
// }

var Location = function(data) {
    this.id = data.id;
    this.name = ko.observable(data.name);
    this.clickCount = ko.observable(data.clickCount);
    // this.mk = ko.observable();
}


var ViewModel = function() {
    var self = this;

    self.counter = ko.observable(0);
    self.btntext = ko.observable('This is a cool button');

    self.incrementCounter = function() {
        self.counter(self.counter() + 1);
    };

    //hmmmm..........
    self.currentLocations = ko.observableArray([]);
    initialLocations.forEach(function(location){
        self.currentLocations.push( new Location(location) );      
    });


    // // 'this' represents the currentcat's binding context
    //     // because of the 'with' in the HTML
    // // 'self' represents the view model
    // this.incrementCounter = function() {
    //     self.currentCat().clickCount(self.currentCat().clickCount() + 1);
    // };

    self.clickLocation = function(location) {
        console.log("clickLocation");

        console.log(location);
        console.log(this);
        console.log(self);

        // get the marker we care about
        // there has got to be a better way to do this...
        for (i = 0; i < allMarkers.length; i++) {
            if (location.id == allMarkers[i].id) {
                google.maps.event.trigger(allMarkers[i],'click');
            }
        }

        // bounce it

        // popup its info window
        // infowindow.open(map, marker);
        // this.infoWindow.open(map, self);
    };

    // maaaaybe?
    // self.linkMarkerToListItem = function() {};
};

/*
 * google maps funtionality
 *
 */

function initMap() {

    var mapDiv = document.getElementById('map');
    map = new google.maps.Map(mapDiv, {
        center: {lat: 42.359, lng: -71.062},
        zoom: 13
    });

    // we will only need one of these
    var infoWindow = new google.maps.InfoWindow({});

    // perhaps this should not also access the data hmmm
    for (var i = 0, feature; feature = initialLocations[i]; i++) {
        var mark = addMarkerToMap(feature, infoWindow);
        allMarkers.push(mark);
    }
}

//
function addMarkerToMap(feature, infoWindow) {

    // create the marker
    var marker = new google.maps.Marker({
        id : feature.id,
        position: feature.position,
        // icons: icons[feature.type].icon,
        map: map,
        title: 'my title'
    });

    // add a click handler for it
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(feature.contentString);
        infoWindow.open(map, marker);
    });

    return marker;    
}

// function filterMarkers(marker) {
//     for (var i = 0, feature; feature = interestingLocations[i]; i++) {
//         if () {
//             marker.setVisible(true);
//         }
//         else {
//             marker.setVisible(false);
//         }
//     }
// }

/*
 * Create the application
 */

// ko
ko.applyBindings(new ViewModel());

// Call the initialize function after the page has finished loading
google.maps.event.addDomListener(window, 'load', initMap);






































