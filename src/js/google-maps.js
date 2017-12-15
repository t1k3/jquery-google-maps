function GoogleMaps(options) {
    var self = this;

    // variables
    this.options = options;

    this.options.latlng = typeof options.latlng !== 'undefined' ? options.latlng : {lat: 47.1556941, lng: 18.3847734};

    this.options.hideCustomMarkers = typeof options.hideCustomMarkers !== 'undefined' ? options.hideCustomMarkers : false;

    this.options.fullscreenControl = typeof options.fullscreenControl !== 'undefined' ? options.fullscreenControl : false;
    this.options.streetViewControl = typeof options.streetViewControl !== 'undefined' ? options.streetViewControl : false;
    this.options.gestureHandling = typeof options.gestureHandling !== 'undefined' ? options.gestureHandling : 'cooperative';

    this.options.printable = typeof options.printable !== 'undefined' ? options.printable : false;
    this.options.locationable = typeof options.locationable !== 'undefined' ? options.locationable : false;
    this.options.streetviewable = typeof options.streetviewable !== 'undefined' ? options.streetviewable : false;
    this.options.fitzoomable = typeof options.fitzoomable !== 'undefined' ? options.fitzoomable : false;

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
        var $printBtn = $('<div class="btn-gmaps margin-right-10" role="button" id="map-print"><i class="fa fa-print"></i></div>');
        $(this.options.div).prepend($printBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($printBtn[0]);

        google.maps.event.addDomListener($printBtn[0], 'click', function (event) {
            self.print();
        });
    }

    if (this.options.locationable) {
        var $showLocationBtn = $('<div class="btn-gmaps margin-right-10 margin-bottom-10" role="button" id="map-location"><i class="fa fa-location-arrow"></i></div>');
        $(this.options.div).prepend($showLocationBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($showLocationBtn[0]);

        google.maps.event.addDomListener($showLocationBtn[0], 'click', function (event) {
            self.showLocation();
        });
    }

    if (this.options.streetviewable) {
        var $streetViewBtn = $('<div class="btn-gmaps margin-bottom-10 margin-right-10" role="button" id="map-street-view"><i class="fa fa-street-view"></i></div>');
        $(this.options.div).prepend($streetViewBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($streetViewBtn[0]);

        google.maps.event.addDomListener($streetViewBtn[0], 'click', function (event) {
            self.toggleStreetView();
        });

        self.setPanorama();
    }

    if (this.options.fitzoomable) {
        var $fitZoomBtn = $('<div class="btn-gmaps margin-bottom-10 margin-right-10" role="button" id="map-street-view"><i class="fa fa-window-restore"></i></div>');
        $(this.options.div).prepend($fitZoomBtn);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($fitZoomBtn[0]);

        google.maps.event.addDomListener($fitZoomBtn[0], 'click', function (event) {
            self.fitZoom();
        });
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
                    icon: 'https://maps.google.com/mapfiles/ms/micons/blue.png',
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

    var $patchedStyle = $('<style media="print" id="gmaps-print-style">')
        .text(
            'img { max-width: none !important; }' +
            'img.gm-fullscreen-control { display: none !important; }' +
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
GoogleMaps.prototype.setLocation = function (options) {
    console.log('setLocation');

    let self = this;
    options.to = options.to || 'customDraws.markers';
    options.icon = typeof options.icon !== 'undefined' ? options.icon : 'https://maps.google.com/mapfiles/ms/micons/blue.png';
    options.draggable = options.draggable || false;

    if (navigator.geolocation) {
        self.resetDrawingManager();

        navigator.geolocation.getCurrentPosition(
            function (position) {
                let latlng = {lat: position.coords.latitude, lng: position.coords.longitude};
                let marker = self.addMarker(latlng, {
                    to: options.to,
                    draggable: options.draggable,
                    icon: options.icon,

                    id: self.guid(),
                    type: 'marker',
                });

                self.addDrawingManager({
                    drawingModes: ['marker'],
                    drawingControl: false,
                });

                if (typeof options.callback !== 'function') {
                    options.callback = function (marker) {
                        self.setDrawingManagerInput(marker);

                        /*google.maps.event.addListener(marker, 'click', function () {
                            $reset = $('#draw-reset');

                            $reset.attr('data-id', marker.id);
                            $reset.attr('data-object', marker.type);
                            $reset.show();
                        });*/
                    }
                }
                options.callback(marker);

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
            if (typeof callback === 'function') {
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
    if (typeof coordinates[0].lat === 'undefined') {
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
    if (obj) obj.push(value);
};

GoogleMaps.prototype.walkObject = function (obj, str) {
    /*array = str.split(".");
     for (var i = 0; i < array.length; i++) {
     obj = obj[array[i]];
     }
     return obj;*/

    return str.split(".").reduce(function (o, x) {
        if (typeof o[x] === 'undefined') o[x] = [];
        return o[x];
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
    let self = this;
    let marker = null;
    let markerIcon = '';

    if (typeof latlng.lat === 'undefined') {
        latlng = self.coordinates2paths(latlng);
    }
    if (latlng.length > 1) {
        let paths = self.coordinates2paths(latlng);
        let polygon = new google.maps.Polygon({
            paths: paths
        });

        latlng = polygon.getApproximateCenter();
    }

    if (typeof latlng.lat !== 'undefined' && typeof latlng.lng !== 'undefined') {
        options = options || {};
        options.to = options.to || 'markers.places';

        if (typeof options.icon !== 'undefined' && options.icon !== null) {
            markerIcon = {
                url: options.icon,
                // scaledSize: new google.maps.Size(21, 34),
                // scaledSize: new google.maps.Size(32, 37),
                // origin: new google.maps.Point(0, 0),
                // anchor: new google.maps.Point(-5, 17)
            };
        }

        marker = new google.maps.Marker({
            position: latlng,
            map: this.map,
            draggable: options.draggable || false,
            icon: markerIcon, // 'https://maps.google.com/mapfiles/ms/micons/green.png',
        });
        marker.id = options.id || self.guid();
        marker.type = options.type || 'marker';

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

    self.addMarkerEvents(marker, options.callback);
    return marker;
};

// Marker events
GoogleMaps.prototype.addMarkerEvents = function (marker, callback) {
    let self = this;

    if (typeof callback !== 'function') {
        callback = function (marker) {
            self.setDrawingManagerInput(marker);
        }
    }

    google.maps.event.addListener(marker, 'dragend', function () {
        callback(marker);
    });
}

// Add polygon
GoogleMaps.prototype.addPolygon = function (coordinates, options) {
    var self = this;
    var options = options || {};
    options.to = options.to || 'polygons';
    options.bounds = typeof options.bounds !== 'undefined' ? options.bounds : true;

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

    if (typeof options.label !== 'undefined') {
        var customMarker = new CustomMarker(
            polygon.getApproximateCenter(), // polygon.getBounds().getCenter(),
            this.map,
            {
                content: options.label
            }
        );
        this.objects.customMarkers.push(customMarker);
    }

    if (typeof options.infoWindow !== 'undefined') {
        this.addInfoWindow(polygon, {
            content: options.infoWindow
        });
    }

    self.addPolygonEvents(polygon, options.callback);
    return polygon;
};

// Polygon events
GoogleMaps.prototype.addPolygonEvents = function (polygon, callback) {
    let self = this;
    let fillOpacity = polygon.fillOpacity;

    if (typeof callback !== 'function') {
        callback = function (polygon) {
            self.setDrawingManagerInput(polygon);
            console.log(polygon.getPath().getArray());
        }
    }

    google.maps.event.addListener(polygon, 'mouseover', function () {
        this.setOptions({fillOpacity: .2});
    });
    google.maps.event.addListener(polygon, 'mouseout', function () {
        this.setOptions({fillOpacity: fillOpacity});
    });

    google.maps.event.addListener(polygon, 'dragend', function () {
        callback(polygon);
    });
    polygon.getPaths().forEach(function (path, index) {
        google.maps.event.addListener(path, 'insert_at', function () {
            callback(polygon);
        });

        google.maps.event.addListener(path, 'remove_at', function () {
            callback(polygon);
        });

        google.maps.event.addListener(path, 'set_at', function () {
            callback(polygon);
        });
    });
};

GoogleMaps.prototype.addPolyline = function (coordinates, options) {
    var self = this;
    var options = options || {};
    options.to = options.to || 'polygons';
    options.bounds = typeof options.bounds !== 'undefined' ? options.bounds : true;

    var paths = this.coordinates2paths(coordinates);
    var polyline = new google.maps.Polyline({
        paths: paths,
        strokeColor: options.strokeColor || '#1ab394',
        strokeOpacity: options.strokeOpacity || 0.8,
        strokeWeight: options.strokeWeight || 2,
        draggable: options.draggable || false,
        editable: options.editable || false
    });

    polyline.setMap(this.map);

    // this.objects.polylines.push(polyline);
    this.push2object(options.to, polyline);

    if (options.bounds) {
        $.each(paths, function (index, val) {
            self.bounds.extend(val);
        });
    }

    if (typeof options.label !== 'undefined') {
        var customMarker = new CustomMarker(
            polyline.getApproximateCenter(), // polygon.getBounds().getCenter(),
            this.map,
            {
                content: options.label
            }
        );
        this.objects.customMarkers.push(customMarker);
    }

    if (typeof options.infoWindow !== 'undefined') {
        this.addInfoWindow(polyline, {
            content: options.infoWindow
        });
    }

    self.addPolylineEvents(polyline, options.callback);
    return polyline;
};

GoogleMaps.prototype.addPolylineEvents = function (polyline, callback) {
    let self = this;
    if (typeof callback !== 'function') {
        callback = function (polyline) {
            self.setDrawingManagerInput(polyline);
        }
    }

    google.maps.event.addListener(polyline, 'dragend', function () {
        callback(polyline);
    });
    polyline.getPath().forEach(function (path, index) {
        google.maps.event.addListener(path, 'insert_at', function () {
            callback(polyline);
        });

        google.maps.event.addListener(path, 'remove_at', function () {
            callback(polyline);
        });

        google.maps.event.addListener(path, 'set_at', function () {
            callback(polyline);
        });
    });
};

// Add infoWindow
GoogleMaps.prototype.addInfoWindow = function (object, options) {
    var options = options || {};
    if (typeof options.content !== 'undefined') {
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

// Generate UUID
GoogleMaps.prototype.guid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

// Add drawing manager
GoogleMaps.prototype.addDrawingManager = function (options) {
    var self = this;
    var options = options || {};
    options.drawingModes = options.drawingModes || ['marker', 'polygon'];

    options.markerOptions = options.markerOptions || {};
    options.polygonOptions = options.polygonOptions || {};
    options.polylineOptions = options.polylineOptions || {};

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

    self.drawingManager = new google.maps.drawing.DrawingManager({
        // drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingMode: options.drawingModes[0],
        drawingModeOptions: options.drawingModeOptions,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: options.drawingModes
        },
        markerOptions: {
            draggable: true,
            icon: options.icon || 'https://maps.google.com/mapfiles/ms/micons/red.png',

            max: options.markerOptions.max || 1,
            callback: options.markerOptions.callback || null
        },
        polygonOptions: {
            strokeColor: options.strokeColor || '#F75C54',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: options.fillColor || '#F75C54',
            fillOpacity: 0.35,
            editable: true,
            draggable: options.draggable || false,
            zIndex: 1,

            max: options.polygonOptions.max || 1,
            callback: options.polygonOptions.callback || null
        },
        polylineOptions: Object.assign(
            {
                strokeColor: options.strokeColor || '#F75C54',
                strokeOpacity: 0.9,
                strokeWeight: 2,
                editable: true,
                draggable: options.draggable || false,

                max: options.polylineOptions.max || 1,
                callback: options.polylineOptions.callback || null
            },
            polylineArrowOptions
        ),

    });
    self.drawingManager.setMap(this.map);

    $('#draw-reset').remove();
    $reset = $('<div class="btn-gmaps btn-gmaps-xs margin-top-5" id="draw-reset"><i class="fa fa-trash-o"></i></div>');
    $(this.options.div).prepend($reset);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push($reset[0]);

    $reset.hide();

    if (typeof options.drawingControl !== 'undefined' && !options.drawingControl) {
        self.drawingManager.setDrawingMode(null);
        self.drawingManager.setMap(null);

        // $reset.show();
    }

    self.addDrawingManagerEvents(self.drawingManager, $reset);

};

// Drawing manager events
GoogleMaps.prototype.addDrawingManagerEvents = function (drawingManager, $reset) {
    var self = this;

    // hide delete btn
    google.maps.event.addListener(this.map, 'click', function () {
        if ($reset.is(':visible')) $reset.hide();
    });
    google.maps.event.addDomListener($('[role=button]')[0], 'click', function () {
        if ($reset.is(':visible')) $reset.hide();
    });

    // delete btn click
    google.maps.event.addDomListener($reset[0], 'click', function () {
        let id = $(this).attr('data-id');
        let type = $(this).attr('data-object'); // marker, polygon, polyline
        let object = self.objects.customDraws[type];
        $.each(object, function (index, value) {
            if (value && value.id == id) {
                self.resetDrawingManagerInput(id);
                object[index].setMap(null);
                delete object[index];
            }
        });

        $(this).removeAttr('data-id');
        $(this).removeAttr('data-object');
        $(this).hide();

        let count = Object.keys(self.objects.customDraws[type]).length;
        if (drawingManager[type + 'Options'].max > count) {
            let indexOf = drawingManager.drawingControlOptions.drawingModes.indexOf(type);
            if (indexOf === -1) {
                drawingManager.drawingControlOptions.drawingModes.push(type);
                drawingManager.setDrawingMode(type);
                drawingManager.setMap(self.map);
            }
        }
    });

    // overlaycomplete
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        let overlay = event.overlay;
        overlay.type = event.type;

        switch (overlay.type) {
            case 'marker':
                overlay.id = drawingManager.markerOptions.id || self.guid();
                overlay.callback = drawingManager.markerOptions.callback;

                if (typeof overlay.callback !== 'function') {
                    overlay.callback = function (overlay) {
                        self.setDrawingManagerInput(overlay);
                    }
                }

                self.addMarkerEvents(overlay, overlay.callback);
                break;
            case 'polygon':
                overlay.id = drawingManager.polygonOptions.id || self.guid();
                overlay.callback = drawingManager.polygonOptions.callback;

                if (typeof overlay.callback !== 'function') {
                    overlay.callback = function (overlay) {
                        self.setDrawingManagerInput(overlay);

                        let m2 = self.getSize(overlay)
                        self.setSizeInput(m2);
                    }
                }

                self.addPolygonEvents(overlay, overlay.callback);
                break;
            case 'polyline':
                overlay.id = drawingManager.polylineOptions.id || self.guid();
                overlay.callback = drawingManager.polylineOptions.callback;

                if (typeof overlay.callback !== 'function') {
                    overlay.callback = function (overlay) {
                        self.setDrawingManagerInput(overlay);
                    }
                }

                self.addPolylineEvents(overlay, overlay.callback);
                break;
        }
        self.push2object('customDraws.' + overlay.type, overlay);

        google.maps.event.addListener(overlay, 'click', function () {
            $reset = $('#draw-reset');

            $reset.attr('data-id', overlay.id);
            $reset.attr('data-object', overlay.type);
            $reset.show();

        });
        overlay.callback(overlay);

        let count = Object.keys(self.objects.customDraws[event.type]).length;
        if (drawingManager[overlay.type + 'Options'].max <= count) {
            let indexOf = drawingManager.drawingControlOptions.drawingModes.indexOf(overlay.type);
            drawingManager.drawingControlOptions.drawingModes.splice(indexOf, 1);
            drawingManager.setDrawingMode(null);
            drawingManager.setMap(self.map);
        }
    });
};

// Set drawing manager inputs
GoogleMaps.prototype.setDrawingManagerInput = function (overlay) {
    let self = this;
    let coordinates = null;
    switch (overlay.type) {
        case 'marker':
            coordinates = '(' + overlay.getPosition().lat() + ', ' + overlay.getPosition().lng() + ')';
            break;
        case 'polygon':
        case 'polyline':
            coordinates = overlay.getPath().getArray();
            break;
    }
    let $input = $(self.options.div + ' input[data-id="' + overlay.id + '"]');
    if (!$input.length) {
        $input = $('<input type="hidden">');
        $input.attr({
            'name': 'coordinates[' + overlay.type + '][]',
            'class': 'input-gmaps hidden',
            'data-id': overlay.id
        });
        $(self.options.div).prepend($input);
    }
    $input.attr('value', coordinates);
    let session = self.stringToObject('coordinates.' + overlay.type + '.' + overlay.id, coordinates);
    $.session.set(window.location.href, JSON.stringify(session));
    // if ($.session.get(window.location.href)) console.log(JSON.parse($.session.get(window.location.href)));
};

GoogleMaps.prototype.stringToObject = function (key, value) {
    var result = object = {};
    var arr = key.split('.');
    for (var i = 0; i < arr.length - 1; i++) {
        object = object[arr[i]] = {};
    }
    object[arr[arr.length - 1]] = value;
    return result;
}

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
GoogleMaps.prototype.resetDrawingManagerInput = function (overlayId) {
    if (typeof overlayId === 'undefined') $(this.options.div + ' .input-gmaps').remove();
    else $(this.options.div + ' .input-gmaps[data-id=' + overlayId + ']').remove();
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
