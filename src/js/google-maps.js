function GoogleMaps(options) {
    var self = this;

    // variables
    this.options = options;

    this.options.latlng = typeof(options.latlng) != 'undefined' ? options.latlng : {lat: 47.1556941, lng: 18.3847734};

    this.options.hideCustomMarkers = typeof(options.hideCustomMarkers) != 'undefined' ? options.hideCustomMarkers : false;

    this.options.fullscreenControl = typeof(options.fullscreenControl) != 'undefined' ? options.fullscreenControl : false;
    this.options.streetViewControl = typeof(options.streetViewControl) != 'undefined' ? options.streetViewControl : false;
    this.options.gestureHandling = typeof(options.gestureHandling) != 'undefined' ? options.gestureHandling : 'cooperative';

    this.options.printable = typeof(options.printable) != 'undefined' ? options.printable : false;
    this.options.locationable = typeof(options.locationable) != 'undefined' ? options.locationable : false;
    this.options.streetviewable = typeof(options.streetviewable) != 'undefined' ? options.streetviewable : false;

    this.bounds = new google.maps.LatLngBounds();
    this.objects = {
        customMarkers: [],
        polygons: [],
        markers: {
            places: [],
            location: []
        },
        customDraws: [],
        heatmap: []
    };
    this.markerCluster = {};
    this.drawingManager = null;
    this.panorama = null;

    // initialize
    // document.getElementById('map'), $('#map');
    this.map = new google.maps.Map($(this.options.div)[0], {
        center: this.options.latlng,
        zoom: this.options.zoom || 8,
        mapTypeId: this.options.type || 'hybrid',
        fullscreenControl: this.options.fullscreenControl,
        streetViewControl: this.options.streetViewControl,
        gestureHandling: this.options.gestureHandling,
    });

    // btns
    if (this.options.printable) {
        var $printBtn = $('<div class="btn-gmaps margin-right-10" id="map-print"><i class="fa fa-print"></i></div>');
        $(this.options.div).prepend($printBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($printBtn[0]);

        google.maps.event.addDomListener($printBtn[0], 'click', function (event) {
            self.print();
        });
    }

    if (this.options.locationable) {
        var $showLocationBtn = $('<div class="btn-gmaps margin-right-10 margin-bottom-10" id="map-location"><i class="fa fa-location-arrow"></i></div>');
        $(this.options.div).prepend($showLocationBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($showLocationBtn[0]);

        google.maps.event.addDomListener($showLocationBtn[0], 'click', function (event) {
            self.showLocation();
        });
    }

    if (this.options.streetviewable) {
        var $streetViewBtn = $('<div class="btn-gmaps margin-bottom-10 margin-right-10" id="map-street-view"><i class="fa fa-street-view"></i></div>');
        $(this.options.div).prepend($streetViewBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($streetViewBtn[0]);

        google.maps.event.addDomListener($streetViewBtn[0], 'click', function (event) {
            self.toggleStreetView();
        });

        self.setPanorama();
    }


    // events
    google.maps.event.addListener(this.map, 'zoom_changed', function (event) {
        if (self.options.hideCustomMarkers) {
            if (self.map.zoom <= 11) {
                self.hideCustomMarkers();
            } else if (self.map.zoom >= 12) {
                self.showCustomMarkers();
            }
        }
    });

    $.extend(this.options, options);
};

// Set street view pos
GoogleMaps.prototype.setPanorama = function (latlng) {
    var self = this;
    latlng = latlng || self.options.latlng;

    self.panorama = self.map.getStreetView();
    self.panorama.setPosition(latlng);
    self.panorama.setPov(({
        heading: 265,
        pitch: 0
    }));
};

// Toggle street view
GoogleMaps.prototype.toggleStreetView = function () {
    console.log('toggleStreetView');

    var self = this;
    self.panorama.setVisible(!self.panorama.getVisible());
};

// Show your location
GoogleMaps.prototype.showLocation = function () {
    console.log('ShowLocation');

    var self = this;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                self.resetObject(self.objects.markers.location);

                var latlng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                self.addMarker(latlng, {
                    to: 'markers.location',
                    // infoWindow: Lang.get('text.my_location') + '<small class="center-block">(' + latlng.lat + ',' + latlng.lng + ')</small>',
                    infoWindow: '<b>(' + latlng.lat + ',' + latlng.lng + ')</b>',
                    // icon: 'https://maps.google.com/mapfiles/ms/micons/orange.png',
                });

                self.fitZoom();

                console.log('success', latlng);
            },
            function (response) {
                console.log('error', response);

                /*swal({
                    title: Lang.get('text.not_locationable.title'),
                    text: Lang.get('text.not_locationable.description'),
                    type: 'error',
                    html: true
                });*/
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
};

// Print
GoogleMaps.prototype.print = function () {
    console.log('print');

    var $body = $('body');
    var $mapContainer = $(this.options.div);
    var $mapContainerParent = $mapContainer.parent();
    var $printContainer = $('<div style="position: relative;">');

    $printContainer
        .height($mapContainer.height())
        .append($mapContainer)
        .prependTo($body);

    var $content = $body
        .children()
        .not($printContainer)
        .not('script')
        .detach();

    var $patchedStyle = $('<style media="print">')
        .text(
            'img { max-width: none !important; }' +
            'a[href]:after { content: ""; }' +
            '.btn-gmaps { display: none !important; }' +
            this.options.div + ' { width: 100%; height: 100%; }'
        )
        .appendTo('head');

    window.print();

    $body.prepend($content);
    $mapContainerParent.prepend($mapContainer);
    $printContainer.remove();
    $patchedStyle.remove();
};

// Get random point in polygon
GoogleMaps.prototype.getRandomPoint = function (coordinate) {
    var polygon = new google.maps.Polygon({
        paths: coordinate
    });

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < polygon.getPath().getLength(); i++) {
        bounds.extend(polygon.getPath().getAt(i));
    }

    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();

    do {
        var lat = Math.random() * (ne.lat() - sw.lat()) + sw.lat();
        var lng = Math.random() * (ne.lng() - sw.lng()) + sw.lng();
        var latlng = new google.maps.LatLng(lat, lng);
    }
    while (!google.maps.geometry.poly.containsLocation(latlng, polygon));

    return latlng;
};

// Get polygon size
GoogleMaps.prototype.getSize = function (polygon) {
    return google.maps.geometry.spherical.computeArea(polygon.getPath());
};

// Set polygon size to input
GoogleMaps.prototype.setSizeInput = function (m2) {
    var ha = parseInt(m2 / 10000);
    if ($('[name=size]').length) $('[name=size]').val(ha);
};

// Reset polygon size input
GoogleMaps.prototype.resetSizeInput = function () {
    this.setSizeInput(null);
};

// Set your location, fill inputs: lat, lng
GoogleMaps.prototype.setLocation = function () {
    console.log('setLocation');

    var self = this;

    if (navigator.geolocation) {
        self.resetDrawingManager();

        navigator.geolocation.getCurrentPosition(
            function (position) {
                var latlng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                self.addMarker(latlng, {
                    to: 'customDraws',
                    draggable: true
                });
                self.addDrawingManager({
                    drawingModes: ['marker'],
                    drawingControl: false,
                });

                if ($('[name="lat"]').length) $('[name="lat"]').val(latlng.lat);
                if ($('[name="lng"]').length) $('[name="lng"]').val(latlng.lng);

                console.log('success', latlng);
            },
            function (response) {
                console.log('error', response);

                self.addDrawingManager({
                    drawingModes: ['marker'],
                    drawingControl: true,
                });
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}

// Geocode address to latlng
GoogleMaps.prototype.geocode = function (address, callback) {
    var self = this;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': address}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (typeof(callback) === 'function') {
                callback(results[0].geometry.location);
            }
            return results[0].geometry.location;
        }
    });
};

// Set map canter
GoogleMaps.prototype.setCenter = function (latlng) {
    this.map.setCenter(latlng);
};

// Fit zoom by bounds
GoogleMaps.prototype.fitZoom = function () {
    this.map.fitBounds(this.bounds);
};

// Set zoom manually
GoogleMaps.prototype.setZoom = function (zoom) {
    this.map.setZoom(zoom);
};

// Convert coordinates to paths
GoogleMaps.prototype.coordinates2paths = function (coordinates) {
    var paths = coordinates;
    if (typeof(coordinates[0].lat) === 'undefined') {
        if (!Array.isArray(coordinates[0])) {
            return {
                lat: Number(coordinates[0]),
                lng: Number(coordinates[1])
            };
        }

        paths = [];
        $.each(coordinates, function (index, val) {
            paths.push({
                lat: Number(val[0]),
                lng: Number(val[1])
            });
        });
    }

    return paths;
};

// Push to object (example: this.options.markers)
GoogleMaps.prototype.push2object = function (str, value) {
    var obj = this.walkObject(this.objects, str);
    obj.push(value);
};

GoogleMaps.prototype.walkObject = function (obj, str) {
    /*array = str.split(".");
     for (var i = 0; i < array.length; i++) {
     obj = obj[array[i]];
     }
     return obj;*/
    return str.split(".").reduce(function (o, x) {
        return o[x]
    }, obj);
}

// Add heatmap
GoogleMaps.prototype.addHeatmap = function (coordinates) {
    var self = this;
    var data = [];
    var paths = self.coordinates2paths(coordinates);
    $.each(paths, function (index, val) {
        latlng = new google.maps.LatLng(val.lat, val.lng);

        data.push(latlng);
        self.bounds.extend(latlng);
    });

    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: data,
        map: self.map
    });

    this.push2object('heatmap', heatmap);
}

// Add marker
GoogleMaps.prototype.addMarker = function (latlng, options) {
    var self = this;

    if (typeof(latlng.lat) === 'undefined') {
        var latlng = self.coordinates2paths(latlng);
    }

    // if it not latlng, then get paths center
    if (latlng.length > 1) {
        var paths = self.coordinates2paths(latlng);
        var polygon = new google.maps.Polygon({
            paths: paths
        });

        latlng = polygon.getApproximateCenter();
    }

    if (typeof(latlng.lat) !== 'undefined' && typeof(latlng.lng) !== 'undefined') {
        var options = options || {};
        options.to = options.to || 'markers.places';

        if (typeof(options.icon) !== 'undefined' && options.icon !== null) {
            var icon = {
                url: options.icon,
                // scaledSize: new google.maps.Size(21, 34),
                // scaledSize: new google.maps.Size(32, 37),
                // origin: new google.maps.Point(0, 0),
                // anchor: new google.maps.Point(-5, 17)
            };
        }

        var marker = new google.maps.Marker({
            position: latlng,
            map: this.map,
            draggable: options.draggable || false,
            icon: typeof(icon) !== 'undefined' ? icon : '' // 'https://maps.google.com/mapfiles/ms/micons/green.png'
        });

        // this.objects.markers.push(marker);
        // this.objects.markers[options.to].push(marker);
        this.push2object(options.to, marker);
        this.bounds.extend(latlng);

        // add infoWindow
        if (typeof(options.infoWindow) !== 'undefined') {
            this.addInfoWindow(marker, {
                content: options.infoWindow
            });
        }
    }

    self.addMarkerEvents(marker);
    return marker;
};

// Marker events
GoogleMaps.prototype.addMarkerEvents = function (marker) {
    var self = this;
    google.maps.event.addListener(marker, 'dragend', function (event) {
        self.setDrawingManagerInput(marker.getPosition(), marker.getPosition().lat(), marker.getPosition().lng());
    });
}

// Add polygon
GoogleMaps.prototype.addPolygon = function (coordinates, options) {
    var self = this;
    var options = options || {};
    options.to = options.to || 'polygons';
    options.bounds = typeof(options.bounds) !== 'undefined' ? options.bounds : true;

    var paths = this.coordinates2paths(coordinates);
    var polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: options.strokeColor || '#1ab394',
        strokeOpacity: options.strokeOpacity || 0.8,
        strokeWeight: options.strokeWeight || 2,
        fillColor: options.fillColor || '#1ab394',
        fillOpacity: options.fillOpacity || 0.35,
        draggable: options.draggable || false,
        editable: options.editable || false
    });

    polygon.setMap(this.map);

    // this.objects.polygons.push(polygon);
    this.push2object(options.to, polygon);

    if (options.bounds) {
        $.each(paths, function (index, val) {
            self.bounds.extend(val);
        });
    }

    if (typeof(options.label) !== 'undefined') {
        var customMarker = new CustomMarker(
            polygon.getApproximateCenter(), // polygon.getBounds().getCenter(),
            this.map,
            {
                content: options.label
            }
        );
        this.objects.customMarkers.push(customMarker);
    }

    if (typeof(options.infoWindow) !== 'undefined') {
        this.addInfoWindow(polygon, {
            content: options.infoWindow
        });
    }

    self.addPolygonEvents(polygon);
    return polygon;
};

// Polygon events
GoogleMaps.prototype.addPolygonEvents = function (polygon) {
    var self = this;
    var fillOpacity = polygon.fillOpacity;

    google.maps.event.addListener(polygon, 'mouseover', function (event) {
        this.setOptions({fillOpacity: .2});
    });
    google.maps.event.addListener(polygon, 'mouseout', function (event) {
        this.setOptions({fillOpacity: fillOpacity});
    });

    polygon.getPaths().forEach(function (path, index) {
        google.maps.event.addListener(path, 'insert_at', function () {
            self.setDrawingManagerInput(polygon.getPath().getArray());

            var m2 = self.getSize(polygon);
            self.setSizeInput(m2);
        });

        google.maps.event.addListener(path, 'remove_at', function () {
            self.setDrawingManagerInput(polygon.getPath().getArray());

            var m2 = self.getSize(polygon);
            self.setSizeInput(m2);
        });

        google.maps.event.addListener(path, 'set_at', function () {
            self.setDrawingManagerInput(polygon.getPath().getArray());

            var m2 = self.getSize(polygon);
            self.setSizeInput(m2);
        });
    });

    /*google.maps.event.addListener(polygon.getPath(), 'set_at', function(event) {
     self.setDrawingManagerInput(polygon.getPath().getArray());
     });*/
}

// Add infoWindow
GoogleMaps.prototype.addInfoWindow = function (object, options) {
    var options = options || {};
    if (typeof(options.content) !== 'undefined') {
        object.info = new google.maps.InfoWindow({
            content: options.content
        });

        google.maps.event.addListener(object, 'click', function (event) {
            object.info.setPosition(event.latLng);
            object.info.open(this.map, object);
        });
    }
};

// Marker clusterer
GoogleMaps.prototype.addMarkerCluster = function (icon) {
    var self = this;
    $.each(this.objects.markers, function (index, val) {
        // this.markerCluster = new MarkerClusterer(self.map, self.objects.markers, {
        self.markerCluster[index] = new MarkerClusterer(self.map, val, {
            imagePath: icon || 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            maxZoom: 13
        });
    });

};

// Add drawing manager
GoogleMaps.prototype.addDrawingManager = function (options) {
    var self = this;
    var options = options || {};
    options.drawingModes = options.drawingModes || ['marker', 'polygon'];

    var polylineArrowOptions = {};
    if ((index = options.drawingModes.indexOf('polyline-arrow')) >= 0) {
        options.drawingModes.splice(index, 1);

        if ((index = options.drawingModes.indexOf('polyline')) < 0) options.drawingModes.push('polyline');
        polylineArrowOptions = {
            icons: [{
                icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                offset: '100%',
            }]
        };
    }

    drawingManager = self.drawingManager = new google.maps.drawing.DrawingManager({
        // drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingMode: options.drawingModes[0],
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: options.drawingModes
        },
        markerOptions: {
            draggable: true,
            icon: options.icon || 'https://maps.google.com/mapfiles/ms/micons/red.png'
        },
        polygonOptions: {
            strokeColor: options.strokeColor || '#F75C54',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: options.fillColor || '#F75C54',
            fillOpacity: 0.35,
            // clickable: false,
            editable: true,
            draggable: options.draggable || false,
            zIndex: 1
        },
        polylineOptions: Object.assign(
            {
                strokeColor: options.strokeColor || '#F75C54',
                strokeOpacity: 0.9,
                strokeWeight: 2,
            },
            polylineArrowOptions
        ),

    });
    drawingManager.setMap(this.map);

    $('#draw-reset').remove();
    if ($('[name="coordinates"]').length) $('[name="coordinates"]').remove();
    if ($('[name="lat"]').length) $('[name="lat"]').remove();
    if ($('[name="lng"]').length) $('[name="lng"]').remove();

    $(self.options.div).prepend('<input type="hidden" name="coordinates" class="absolute top-5 right-5 z-index-1">');
    $(self.options.div).prepend('<input type="hidden" name="lat" class="absolute top-5 right-5 z-index-1">');
    $(self.options.div).prepend('<input type="hidden" name="lng" class="absolute top-5 right-5 z-index-1">');

    $reset = $('<div class="btn-gmaps margin-top-10" id="draw-reset"><i class="fa fa-trash-o"></i></div>');
    $(this.options.div).prepend($reset);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push($reset[0]);

    $reset.hide();

    if (typeof(options.drawingControl) !== 'undefined' && !options.drawingControl) {
        drawingManager.setDrawingMode(null);
        drawingManager.setMap(null);

        $reset.show();
    }

    self.addDrawingManagerEvents(drawingManager, $reset);

};

// Drawing manager events
GoogleMaps.prototype.addDrawingManagerEvents = function (drawingManager, $reset) {
    var self = this;
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        var overlay = event.overlay;

        self.objects.customDraws.push(overlay);

        drawingManager.setDrawingMode(null);
        drawingManager.setMap(null);

        $reset.show();

        // *complete
        if (typeof(overlay.getPaths) === 'function') { // polygon
            self.setDrawingManagerInput(overlay.getPath().getArray());
            self.addPolygonEvents(overlay);

            var m2 = self.getSize(overlay);
            self.setSizeInput(m2);
        } else if (typeof(overlay.getPath) === 'function') { // polyline
            self.setDrawingManagerInput(overlay.getPath().getArray());
            // self.addPolylineEvents(overlay);
        } else if (typeof(overlay.getPosition) === 'function') { // marker
            self.setDrawingManagerInput(overlay.getPosition(), overlay.getPosition().lat(), overlay.getPosition().lng());
            self.addMarkerEvents(overlay);
        }
    });

    google.maps.event.addDomListener($reset[0], 'click', function (event) {
        $.each(self.objects.customDraws, function (index, val) {
            val.setMap(null);
        });

        $reset.hide();
        self.resetSizeInput();
        self.resetDrawingManagerInput();
        drawingManager.setDrawingMode(drawingManager.drawingControlOptions.drawingModes[0]);
        drawingManager.setMap(self.map);
    });
};

// Set drawing manager inputs
GoogleMaps.prototype.setDrawingManagerInput = function (coordinates, lat, lng) {
    var lat = lat || null;
    var lng = lng || null;

    if ($('[name="coordinates"]').length) $(this.options.div).find('[name="coordinates"]').val(coordinates);
    if ($('[name="lat"]').length) $('[name="lat"]').val(lat);
    if ($('[name="lng"]').length) $('[name="lng"]').val(lng);

    // TODO Remove this, name convention
    if ($('[name="long"]').length) $('[name="long"]').val(lng);

    $.session.set('coordinates', coordinates);
};

// Reset map
GoogleMaps.prototype.reset = function (objects) {
    var self = this;

    // TODO Refactor
    var objects = objects || null;
    if (objects) {
        $.each(objects, function (index, value) {
            var obj = self.walkObject(self.objects, value);
            if (obj) {
                self.resetObject(obj);
                self.objects[value] = [];
            }
        });
    } else {
        if (self.markerCluster.places) self.markerCluster.places.clearMarkers();
        if (self.markerCluster.events) self.markerCluster.events.clearMarkers();
        if (self.markerCluster.location) self.markerCluster.location.clearMarkers();

        this.resetObject(self.objects.customMarkers);
        this.resetObject(self.objects.customDraws);
        this.resetObject(self.objects.polygons);
        this.resetObject(self.objects.markers.places);
        this.resetObject(self.objects.markers.location);
        this.resetObject(self.objects.heatmap);

        self.objects = {
            customMarkers: [],
            customDraws: [],
            polygons: [],
            markers: {
                places: [],
                location: [],
            },
            heatmap: []
        };
    }
};

// Reset object | reset
GoogleMaps.prototype.resetObject = function (object) {
    $.each(object, function (index, val) {
        val.setMap(null);
    });
};

// Reset drawing manager | reset
GoogleMaps.prototype.resetDrawingManager = function () {
    $(this.options.div).find('#draw-reset').remove();
    if (this.drawingManager !== null) {
        this.drawingManager.setMap(null);
        this.drawingManager = null;
    }
    this.resetDrawingManagerInput();
};

// Reset drawing manager inputs | reset
GoogleMaps.prototype.resetDrawingManagerInput = function () {
    this.setDrawingManagerInput(null, null, null);
};

// Show custom markers (polygon title)
GoogleMaps.prototype.showCustomMarkers = function () {
    var self = this;
    $.each(this.objects.customMarkers, function (index, val) {
        val.setMap(self.map);
    });
};

// Hide custom markers (polygon title)
GoogleMaps.prototype.hideCustomMarkers = function () {
    $.each(this.objects.customMarkers, function (index, val) {
        val.setMap(null);
    });
};

module.exports = GoogleMaps;
