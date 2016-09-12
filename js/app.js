// Helper function for taking focus away from textbox on iOS devices
function hideIOSKeyboard() {
     document.activeElement.blur();
     $("input").blur();
}


// Object representing a Tourist Attraction
function TouristAttraction(dataObj) {
    var self = this;
    self.name = dataObj.name;
    self.address = dataObj.address;
    self.latitude = parseFloat(dataObj.latitude);
    self.longitude = parseFloat(dataObj.longitude);
    self.flickrContent = null;

    // Create the map marker for this TouristAttraction object
    self.mapMarker = new google.maps.Marker({
        position: {lat: self.latitude, lng: self.longitude},
        map: map,
        title: self.name
    });

    // Create the info window for this TouristAttraction object
    self.infoWindow = new google.maps.InfoWindow();

    // Shows the info window, building content first if necessary
    self.showInfoWindow = function() {
        // Build the basic info window content, if hasn't been done
        if (!self.infoWindow.getContent()) {
            // Initialize basic info window content and display it
            self.infoWindow.setContent('Loading content...');
            var content = '<h3 class="info-title">' + self.name + '</h3>';
            content += '<p class="info-subtitle">' + self.address + '</p>';
            self.infoWindow.setContent(content);
        }

        // Build the Flickr content for the info window, if hasn't been done
       if (!self.flickrContent) {
            // Use Flickr API to retrieve photos related to the location,
            // then display the data using a callback function
            flickr.getPhotos(self.latitude, self.longitude, function(results) {
                var content = '<div class="flickr-box">';
                content += '<h3 class="flickr-headline">Flickr Photos</h3>';
                results.forEach(function(info) {
                    content += '<a class="flickr-thumb" href="' +
                        info.photoPage + '" target="_blank">' + '<img src="' +
                        info.imgThumbUrl + '"></a>';
                });
                content +='</div>';
                self.flickrContent = content;
                var allContent = self.infoWindow.getContent() + content;
                self.infoWindow.setContent(allContent);
            });
        } 

        // Show info window
        self.infoWindow.open(map, self.mapMarker);
    };

    // Enables marker bounce animation and shows the info window. If another
    // TouristAttraction object is active, it is deactivated first, since only one
    // object can be active at a time. This prevents UI clutter.
    self.activate = function() {
        // Check the variable that references the currently active
        // TouristAttraction object. If the value is not null and it doesn't point
        // to this object, then run its deactivate method.
        if (TouristAttraction.prototype.active) {
            if (TouristAttraction.prototype.active !== self) {
                TouristAttraction.prototype.active.deactivate();
            }
        }

        // Enable marker bounce animation and show info window
        self.mapMarker.setAnimation(google.maps.Animation.BOUNCE);
        self.showInfoWindow();

        // Set this TouristAttraction object as the active one
        TouristAttraction.prototype.active = self;
    };

    // Disables marker bounce animation and closes the info window
    self.deactivate = function() {
        // Disable marker bounce and close info window
        self.mapMarker.setAnimation(null);
        self.infoWindow.close();

        // Since this object is being deactivated, the class variable which
        // holds the reference to the active object is set to null
        TouristAttraction.prototype.active = null;
    };

    // Centers the map on the requested location, then activates this
    // TouristAttraction object. This fires when a listview item is clicked,
    // via Knockout.
    self.focus = function() {
        map.panTo({lat: self.latitude, lng: self.longitude});
        self.activate();
    };

    // Toggles the active state of this TouristAttraction object. This is the
    // callback for the marker's click event.
    self.mapMarkerClickHandler = function() {
        // If currently active (marker bouncing, info window visible),
        // deactivate. Otherwise, activate.
        if (TouristAttraction.prototype.active === self) {
            self.deactivate();
        } else {
            self.activate();
        }

        // Remove focus from filter textbox when marker is clicked (on iOS)
        hideIOSKeyboard();
    };

    // Deactivates this TouristAttraction object when the info marker's close
    // button is clicked
    self.infoWindowCloseClickHandler = function() {
        self.deactivate();
    };

    // Sets mapMarkerClickHandler as the click callback for the map marker
    self.mapMarker.addListener('click', self.mapMarkerClickHandler);

    // Sets infoWindowCloseClickHandler as the click callback for the info
    // window's close button
    self.infoWindow.addListener('closeclick', self.infoWindowCloseClickHandler);
}

// Static class variable that stores the active TouristAttraction object. The
// active TouristAttraction is the one with a visible info window.
TouristAttraction.prototype.active = null;


// Main list view
function ListViewModel() {
    var self = this;
    self.attractions = ko.observableArray([]);
    self.filter = ko.observable('');
    self.loadingMsg = ko.observable('Loading Tourist Attractions...');
    self.isVisible = ko.observable(true);

    // Update the list contents whenever the filter is modified. Also toggles
    // map marker visibility depending on the filter results.
    self.filterResults = ko.computed(function() {
        var matches = [];
        // Create a regular expression for performing a case-insensitive
        // search using the current value of the filter observable
        var re = new RegExp(self.filter(), 'i');

        // Iterate over all attractions objects, searching for a matching name
        self.attractions().forEach(function(attraction) {
            // If it's a match, save it to the list of matches and show its
            // corresponding map marker
            if (attraction.name.search(re) !== -1) {
                matches.push(attraction);
                attraction.mapMarker.setVisible(true);
            // Otherwise, ensure the corresponding map marker is hidden
            } else {
                // Hide marker
                attraction.mapMarker.setVisible(false);

                // If this attraction is active (info window is open), then
                // deactivate it
                if (TouristAttraction.prototype.active === attraction) {
                    attraction.deactivate();
                }
            }
        });

        return matches;
    });

    // Show/hide the list when the toggle button is clicked
    self.toggleVisibility = function() {
        self.isVisible(!self.isVisible());
    };

    // This fires when a list item is clicked
    self.clickHandler = function(attraction) {
        // Hide the list if the viewing area is small
        if (window.innerWidth < 1024) {
            self.isVisible(false);
        }

        // Show the attraction's map marker and info window
        attraction.focus();
    };

    // Initialize the array of TouristAttraction objects

    self.data = {"attractions" : [{"name":"Besant Nagar Beach (Edward Elliot's Beach)","address":"6th Avenue, Besant Nagar (6th Avenue)","latitude":"12.9992","longitude":"80.2720"},
    {"name":"Marina Beach","address":"Santhome High Rd (Kamaraj Salai)","latitude":"13.0500","longitude":"80.2824"},
    {"name":"Thiruvanmiyur RTO Beach","address":"Thiruvanmiyur East, ECR","latitude":"12.744721","longitude":"80.241996"},
    {"name":"Anna Nagar Tower Park","address":"6th & 3rd Main Rd (Anna Nagar)","latitude":"13.0868","longitude":"80.2144"},
    {"name":"Amethyst Cafe","address":"Whites Road","latitude":"13.0574","longitude":"80.2593"},
    {"name":"Manhattan Fish Market","address":"No 94, Radhakrishnan Salai (Mylapore)","latitude":"13.044682","longitude":"80.268261"},
    {"name":"Light House","address":"Marina Beach (Triplicane)","latitude":"13.0397","longitude":"80.2794"},
    {"name":"That Madras Place","address":"2nd Main Rd, (Kasturibai Nagar)","latitude":"13.006045","longitude":"80.250482"},
    {"name":"The Flying Elephant","address":"39 Vellachery Rd (Sardar Patel Rd)","latitude":"13.010472","longitude":"80.223670"},
    {"name":"Double Roti","address":"Cenotaph Road (1st Street)","latitude":"13.034032","longitude":"80.247054"},
    {"name":"Absolute Barbeques","address":" No. 45, 3rd Floor, Tower Victorie, T. Nagar","latitude":"13.045289","longitude":"80.241224"},
    {"name":"Mathsya","address":"1 Halls Road","latitude":"13.075145","longitude":"80.258251"},
    {"name":"Sathyam Cinemas","address":"8, Thiru Vi Ka Road, Royapettah","latitude":"13.055389","longitude":"80.257973"},
    {"name":"MGM Dizzee World","address":"No. 1/74, East Coast Road, Muttukadu","latitude":"12.8268","longitude":"80.2406"},
    {"name":"Phoenix Mall","address":"Plot No. 142, Velachery Road","latitude":"12.9912","longitude":"80.2165"}]};

    var getAttractions = (function(data) {
        var attractions = [];
        var attraction;
        var bounds = new google.maps.LatLngBounds();

        data.attractions.forEach(function(dataObj) {
            // Create TouristAttraction object and append it to the attractions array
            attraction = new TouristAttraction(dataObj);
            attractions.push(attraction);

            // Extend the bounds to include this tourist attraction's location
            bounds.extend(attraction.mapMarker.position);
        });

        // Update the attractions observable array
        self.attractions(attractions);

        // Instruct the map to resize itself to display all markers in the
        // bounds object
        map.fitBounds(bounds);

        // Set the loading message to null, effectively hiding it
        self.loadingMsg(null);
    });

    getAttractions(self.data);
}


// Callback that initializes the Google Map object and activates Knockout
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {lat: 13.0827, lng: 80.2707},
        disableDefaultUI: true
    });

    // Ensure focus is taken away from textbox when map is touched (on iOS)
    map.addListener('click', function() {
         hideIOSKeyboard();
    });

    // Activate Knockout once the map is initialized
    ko.applyBindings(new ListViewModel());
}


// This fires if there's an issue loading the Google Maps API script
function initMapLoadError() {
    alert('Failed to initialize the Google Maps API');
    console.log('Failed to initialize Google Maps API');
}


// Google Map object
var map;
