/*
 * Thank you to http://ryanrahlf.com/filtering-table-data-with-knockout-js/
 */

/*
 * Maaaagic globals! (that aren't functions)
 */

var map;
var infoWindow;


/*
 * data
 * 
 * ids are for unique indentification - 
 * using ids as a proxy for ids from a database
 */
var initialLocations = [
    {
        id: 12,
        name: "Museum of Science",
        contentString: "science science science",
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
        name: "Fenway Park",
        contentString: "strike strike strike (you're out!)",
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

var Location = function(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.description = data.contentString;
    // just to prevent re-calling toLowerCase a bunch
    this.search_text = data.name.toLowerCase() + " " + data.contentString.toLowerCase();

    this.clickCount = ko.observable(data.clickCount);
}

var ViewModel = function() {
    var self = this;

    self.counter = ko.observable(0);
    self.btntext = ko.observable('This is a cool button');

    self.selectedMapMarker = ko.observable ( null ) ;
    self.selectedMapMarkerName = ko.computed(function() {
        if (self.selectedMapMarker()) {
            return self.selectedMapMarker().title;
        }
        else {
            return null;
        }
    });

    self.incrementCounter = function() {
        self.counter(self.counter() + 1);
    };

    // not sure this has to be an observable
    self.allLocationButtons = ko.observableArray([]);
    // use the data to create the initial location buttons
    initialLocations.forEach(function(location){
        self.allLocationButtons.push( new Location(location) );
    });

    // this is its own function because we could implement
    // a reeeeeeally complicated filter instead of just substring matching
    self.filterOnText = function(location) {
        return (
            location.search_text.indexOf(self.activeFilterInput().toLowerCase()) > -1
        );
    };

    self.activeFilterInput = ko.observable ( null );

    self.filteredLocationButtons = ko.computed(function(){
        var result;
        if (infoWindow) {
            infoWindow.close();
        }
        if (self.activeFilterInput()) {

            console.log("filterTextInput");

            result = ko.utils.arrayFilter(
                self.allLocationButtons(),
                function(Loc) {
                    return self.filterOnText(Loc);
                }
            );
            // possible improvement: this doesn't have to happen "in-line" -
            // and might be better not to, if something in google maps fails
            // perhaps a web worker?
            if (map) {
                self.filterMapMarkers(result);
            }
        } else {
            result = self.allLocationButtons();

            // ditto about the in-line comment
            if (map) {
                self.showAllMapMakers();
            }
        }
        return result;
    });


    // filterMapMarkers
    //
    // does:
    //   - hides markers with ids not in activeMarkers
    //
    self.filterMapMarkers = function(activeMarkers) {
        console.log("filterMapMarkers");
        var ids = activeMarkers.map(function(marker) {return marker.id;});
        console.log(ids);
        console.log(self.allLocationButtons());
        console.log(infoWindow);
        for (var i = 0; i < self.allLocationButtons().length; i++) {
            var tempMarker = self.allLocationButtons()[i].marker;
            if (ids.indexOf(tempMarker.id) < 0) {
                tempMarker.setVisible(false);
            }
            else {
                tempMarker.setVisible(true);
            }
        }
    };

    self.showAllMapMakers = function() {
        for (var i = 0; i < self.allLocationButtons().length; i++) {
            self.allLocationButtons()[i].marker.setVisible(true);
        }
    };

    self.clickLocationButton = function(location) {
        google.maps.event.trigger(location.marker,'click');
    };

    this.setSelectedMapMarker = function (marker) {
        self.selectedMapMarker(marker);
    };


    // creates all the map markers -
    // thin, loopy wrapper around createMapMarker
    this.createMapMarkers = function () {
        for (var i = 0; i < self.allLocationButtons().length; i++) {
            self.allLocationButtons()[i].marker = self.createMapMarker(self.allLocationButtons()[i]);
        }
        console.log(self.allLocationButtons());
    };

    // createMapMarker
    //
    // does:
    //   - creates a google map marker (which adds it to the map)
    //   - adds a google map listener to the marker that will:
    //       - set the content of the info window
    //       - open the info window
    // takes:
    //   - the `feature` to be added (assumes `id` and `position`)
    //
    // returns:
    //   - the created marker object
    //
    this.createMapMarker = function (feature) {

        // create the marker
        var marker = new google.maps.Marker({
            id : feature.id,
            position: feature.position,
            // icons: icons[feature.type].icon,
            map: map,
            title: feature.name
        });

        // add a click handler for it - this will close any info window,
        // bounce the map marker clicked, and then open the info window
        google.maps.event.addListener(marker, 'click', function() {

            console.log(marker);

            if (infoWindow) {
                infoWindow.close(map, marker);
                infoWindow.setContent(feature.contentString);
                loadWikipedia(marker.title);
            }

            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ marker.setAnimation(null); },  700);
            setTimeout(function(){ infoWindow.open(map, marker)}, 700);
        });

        return marker;
    }

};

function loadWikipedia(placeName) {
    var $wikiElem = $('#wikipedia-links');
    $wikiElem.empty();
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        data: {
            action: 'query',
            list: 'search',
            srsearch: placeName + 'Boston',
            srlimit: 3,
            format: 'json',
        },
        type: "GET",
        dataType: "jsonp"
    })
        .done(function( msg ) {
            console.log( "done ");
        })
        .success(function ( data ) {
            console.log(data);

            var articles = data.query.search;
            for (var i = 0; i < articles.length; i++) {
                article = articles[i];
                title = article.title;

                $wikiElem.append(
                    '<li>'+
                        '<a href="https://en.wikipedia.org/wiki/' + title + '">' + title + '</a>' +
                    '</li>'
                );
            }
        });

    return false;
};


/*
 * google maps funtionality
 */

// initMap
//
// does:
//   - creates a new google map, assigns it to global `map`
//   - adds all the markers based on app's `initialLocations` data
//
function initMap() {

    var mapDiv = document.getElementById('map');
    map = new google.maps.Map(mapDiv, {
        center: {lat: 42.359, lng: -71.062},
        zoom: 13
    });

    // we will only need one of these
    infoWindow = new google.maps.InfoWindow({});

    // ask the view model to deal with the map markers
    vm.createMapMarkers();
}

/*
 * Create the application
 */

// Knockout
var vm = new ViewModel();
ko.applyBindings(vm);

// Google maps - call the initialize function after the page has finished loading
google.maps.event.addDomListener(window, 'load', initMap);






































