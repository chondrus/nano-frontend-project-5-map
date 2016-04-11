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
        lat: 42.367,
        lng: -71.0722,
    },
    {
        id: 2,
        name: "New England Aquarium",
        contentString: "fish fish fish",
        lat: 42.359248,
        lng: -71.050662,
    },
    {
        id: 1,
        name: "Museum of Art",
        contentString: "art art art",
        lat: 42.339198,
        lng: -71.090732,
    },
    {
        id: 37,
        name: "Fenway Park",
        contentString: "strike strike strike (you're out!)",
        lat: 42.346914,
        lng: -71.099412,
    },
    {
        id: 36,
        name: "Make way for Duckings",
        contentString: "ducks ducks ducks",
        lat: 42.355795,
        lng: -71.0718667,
    }
];


/*
 * knockout app management
 */


// Location constructor - creates a new location object based on passed-in data
var Location = function(data) {
    this.id = data.id;
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.description = data.contentString;
    // just to prevent re-calling toLowerCase a bunch
    this.search_text = data.name.toLowerCase() + " " + data.contentString.toLowerCase();
};

// knockout's ViewModel
var ViewModel = function() {

    var self = this;

    self.allLocationButtons = ko.observableArray([]);  // not sure this has to be an observable
    self.selectedLocation = ko.observable(null);
    self.activeFilterInput = ko.observable (null);
    self.gerror = ko.observable (null);

    // use the data to create the initial location buttons
    initialLocations.forEach(function(location){
        self.allLocationButtons.push( new Location(location) );
    });

    // computed values from `selectedLocation`
    self.selectedLocationName = ko.computed(function() {
        if (self.selectedLocation()) {
            return self.selectedLocation().name;
        } else {
            return null;
        }
    });
    self.selectedLocationDescription = ko.computed(function() {
        if (self.selectedLocation()) {
            return self.selectedLocation().description;
        } else {
            return null;
        }
    });

    /* 
     * computed filter from `activeFilterInput`
     * does:
     *  - closes the `infoWindow` (if it exists)
     *      - (mostly to prevent hanging around awkwardly about nothing)
     *  - calls for the map markers to be filtered
     *  - filters the location buttons
     *
     * possible improvement:
     *  filtering map markers doesn't have to happen "in-process" -
     *  and might be better not to, if something in google maps fails.
     *  perhaps a web worker? or just a try catch to start
     */ 
    self.filteredLocationButtons = ko.computed(function() {
        var result;

        if (infoWindow) {
            infoWindow.close();
        }

        if (self.activeFilterInput()) {
            result = ko.utils.arrayFilter(
                self.allLocationButtons(),
                function(Loc) {
                    return self.filterOnText(Loc);
                }
            );
            if (map) {
                self.filterMapMarkers(result);
            }
        } else {
            result = self.allLocationButtons();
            if (map) {
                self.showAllMapMakers();
            }
        }
        return result;
    });

    // helper function to above computed function.
    // why a function? we could implement a reeeeeeally complicated filter
    self.filterOnText = function(location) {
        return (
            location.search_text.indexOf(self.activeFilterInput().toLowerCase()) > -1
        );
    };


    /*
     * filterMapMarkers (& showAllMapMakers)
     *
     * possible improvment:
     *  this is so solidly map functionality that it might belong out of the ViewModel
     */
    self.filterMapMarkers = function(activeMarkers) {

        var ids = activeMarkers.map(function(marker) {return marker.id;});

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

    /*
     * clickLocationButton
     * does:
     *  - triggers clicking the marker on the google map
     *
     * possible improvement:
     *  have something happen even if there is no map
     */
    self.clickLocationButton = function(location) {
        if (map) {
            google.maps.event.trigger(location.marker,'click');
        }
    };

    /*
     * createMapMarker
     * does:
     *  - creates a google map marker (which adds it to the map)
     *  - adds a google map listener to the marker that will:
     *      - set `selectedLocation`
     *      - open/close/update the `infoWindow` as needed 
     *      - bounce the icon
     * takes:
     *  - the `feature` to be added
     * returns:
     *  - the created google map marker object
     */
    self.createMapMarker = function (feature) {

        // create the marker
        var marker = new google.maps.Marker({
            id : feature.id,
            position: (new google.maps.LatLng(feature.lat, feature.lng)),
            // icons: icons[feature.type].icon,
            map: map,
            title: feature.name
        });

        // add a click handler for it - this will close any info window,
        // bounce the map marker clicked, and then open the info window
        google.maps.event.addListener(marker, 'click', function() {

            self.selectedLocation(feature);

            if (infoWindow) {
                // close the (previous) info window and wipe the (previous) wikipedia links
                infoWindow.close(map, marker);
                $('#wikipedia-links').empty();

                // re-set the content 
                var $infoWindowTemplate = $('#infowindow-template');
                infoWindow.setContent($infoWindowTemplate.html());

                // re-load wikipedia
                tryToLoadWikipedia(feature.name);
            }

            // bounce!
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 700);
            setTimeout(function() {
                infoWindow.open(map, marker);
            }, 700);
        });

        return marker;
    };

    // thin, loopy wrapper around `createMapMarker` above
    self.createMapMarkers = function() {
        for (var i = 0; i < self.allLocationButtons().length; i++) {
            self.allLocationButtons()[i].marker = self.createMapMarker(self.allLocationButtons()[i]);
        }
    };

    self.updateOnGoogleError = function() {
        self.gerror("google maps is currently unavailable");
    };
};

/*
 * Wikipedia
 */

/*
 * tryToLoadWikipedia
 * does:
 *  - ajax request to wikipedia search for 3 articles
 *  - on success, loads those (or message) into the (global) `infoWindow`
 *  - on error, loads an error message into the (global) `infoWindow`
 * takes:
 *  - `placeName` query string to use for wikipedia search
 * returns:
 *  - nothing
 */
function tryToLoadWikipedia(placeName) {

    var $wikiElem = $('#wikipedia-links');

    var wikiRequestTimeout = setTimeout(function(){
        $('#wikipedia-links').html("<i>error retrieving wikipedia articles</i>");
    }, 8000);

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
        dataType: "jsonp",
        success: function ( data ) {

            var articles = data.query.search;

            // if there are articles found, append them
            if (articles.length > 1) {
                for (var i = 0; i < articles.length; i++) {
                    article = articles[i];
                    title = article.title;

                    $wikiElem.append(
                        '<li>'+
                            '<a href="https://en.wikipedia.org/wiki/' + title + '">' + title + '</a>' +
                        '</li>'
                    );
                }
            } else {
                $wikiElem.append('<i>no wikipedia articles found</i>');
            }

            // reset the infowindow content
            var $infoWindowTemplate = $('#infowindow-template');
            infoWindow.setContent($infoWindowTemplate.html());

            // clear timer
            clearTimeout(wikiRequestTimeout);
        },
        error: function ( e ) {
            $wikiElem.append('<i>error retrieving wikipedia links</i>');
            var $infoWindowTemplate = $('#infowindow-template');
            infoWindow.setContent($infoWindowTemplate.html());
        }
    });

    return;
}


/*
 * google maps funtionality
 */

/*
 * initMap
 * does:
 *   - creates a new google map, assigns it to global `map`
 *   - triggers the view model to create all the markers
 * takes nothing
 * returns nothing
 */
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
    return;
}

/*
 * googleMapErrorHandling
 */
function googleMapErrorHandling() {
    if (vm) {
        vm.updateOnGoogleError();
    }
}


/*
 * Create the application
 */

// Knockout
var vm = new ViewModel();
ko.applyBindings(vm);

// map initialization is called via callback






































