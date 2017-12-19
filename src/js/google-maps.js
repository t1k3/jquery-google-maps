function GoogleMaps(options) {
    this.initOptions(options);
    this.initVariables();

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

    this.initBtns();
};

GoogleMaps.prototype.initOptions = function (options) {
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

    return this.options;
};

GoogleMaps.prototype.initVariables = function () {
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
};

GoogleMaps.prototype.initBtns = function () {
    let self = this;

    if (self.options.printable) {
        let $printBtn = $('<div class="btn-gmaps margin-right-10" role="button" id="map-print"><i class="fa fa-print"></i></div>');
        $(self.options.div).prepend($printBtn);
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($printBtn[0]);

        google.maps.event.addDomListener($printBtn[0], 'click', function () {
            self.print();
        });
    }

    if (self.options.locationable) {
        let $showLocationBtn = $('<div class="btn-gmaps margin-right-10 margin-bottom-10" role="button" id="map-location"><i class="fa fa-location-arrow"></i></div>');
        $(self.options.div).prepend($showLocationBtn);
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($showLocationBtn[0]);

        google.maps.event.addDomListener($showLocationBtn[0], 'click', function () {
            self.showLocation();
        });
    }

    if (self.options.streetviewable) {
        let $streetViewBtn = $('<div class="btn-gmaps margin-bottom-10 margin-right-10" role="button" id="map-street-view"><i class="fa fa-street-view"></i></div>');
        $(self.options.div).prepend($streetViewBtn);
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($streetViewBtn[0]);

        google.maps.event.addDomListener($streetViewBtn[0], 'click', function () {
            self.toggleStreetView();
        });

        self.setPanorama();
    }

    if (self.options.fitzoomable) {
        let $fitZoomBtn = $('<div class="btn-gmaps margin-bottom-10 margin-right-10" role="button" id="map-street-view"><i class="fa fa-window-restore"></i></div>');
        $(self.options.div).prepend($fitZoomBtn);
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($fitZoomBtn[0]);

        google.maps.event.addDomListener($fitZoomBtn[0], 'click', function () {
            self.fitZoom();
        });
    }

    let $reset = $('<div class="btn-gmaps btn-gmaps-xs margin-top-5" id="draw-reset"><i class="fa fa-trash-o"></i></div>');
    $(self.options.div).prepend($reset);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push($reset[0]);
    $reset.hide();


    // map zoom_changed
    google.maps.event.addListener(self.map, 'zoom_changed', function () {
        if (self.options.hideCustomMarkers) {
            if (self.map.zoom <= 11) {
                self.hideCustomMarkers();
            } else if (self.map.zoom >= 12) {
                self.showCustomMarkers();
            }
        }
    });

    // hide delete btn
    google.maps.event.addListener(self.map, 'click', function () {
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
                self.resetCoordinatesSession(id, type);
                object[index].setMap(null);
                delete object[index];
            }
        });

        $(this).removeAttr('data-id');
        $(this).removeAttr('data-object');
        $(this).hide();

        let drawingManager = self.drawingManager;
        if (drawingManager) {
            let count = Object.keys(self.objects.customDraws[type]).length;
            if (drawingManager[type + 'Options'].max > count) {
                let indexOf = drawingManager.drawingControlOptions.drawingModes.indexOf(type);
                if (indexOf === -1) {
                    drawingManager.drawingControlOptions.drawingModes.push(type);
                    drawingManager.setDrawingMode(null);
                    drawingManager.setMap(self.map);
                }
            }
        }
    });
};

// Set street view pos
GoogleMaps.prototype.setPanorama = function (latlng) {
    let self = this;
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
    let self = this;
    self.panorama.setVisible(!self.panorama.getVisible());
};

// Show your location
GoogleMaps.prototype.showLocation = function () {
    let self = this;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                self.resetObject(self.objects.markers.location);

                let latlng = {
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
    let $body = $('body');
    let $mapContainer = $(this.options.div);
    let $mapContainerParent = $mapContainer.parent();
    let $printContainer = $('<div style="position: relative;">');

    $printContainer
        .height($mapContainer.height())
        .append($mapContainer)
        .prependTo($body);

    let $content = $body
        .children()
        .not($printContainer)
        .not('script')
        .detach();

    let $patchedStyle = $('<style media="print" id="gmaps-print-style">')
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
    let latlng = {};
    let polygon = new google.maps.Polygon({
        paths: coordinate
    });

    let bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < polygon.getPath().getLength(); i++) {
        bounds.extend(polygon.getPath().getAt(i));
    }

    let sw = bounds.getSouthWest();
    let ne = bounds.getNorthEast();

    do {
        let lat = Math.random() * (ne.lat() - sw.lat()) + sw.lat();
        let lng = Math.random() * (ne.lng() - sw.lng()) + sw.lng();
        latlng = new google.maps.LatLng(lat, lng);
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
    let ha = parseInt(m2 / 10000);
    if ($('[name=size]').length) $('[name=size]').val(ha);
};

// Reset polygon size input
GoogleMaps.prototype.resetSizeInput = function () {
    this.setSizeInput(null);
};

// Set your location, fill inputs: lat, lng
GoogleMaps.prototype.setLocation = function (options) {
    let self = this;

    if (navigator.geolocation) {
        self.resetDrawingManager();

        navigator.geolocation.getCurrentPosition(
            function (position) {
                let latlng = {lat: position.coords.latitude, lng: position.coords.longitude};

                if (typeof options.markerOptions !== 'undefined') {
                    options.markerOptions.to = options.markerOptions.to || 'customDraws.markers';
                    options.markerOptions.icon = typeof options.markerOptions.icon !== 'undefined' ? options.icon : 'https://maps.google.com/mapfiles/ms/micons/blue.png';
                    options.markerOptions.draggable = options.markerOptions.draggable || false;

                    let marker = self.addMarker(latlng, {
                        to: options.markerOptions.to,
                        draggable: options.markerOptions.draggable,
                        icon: options.markerOptions.icon,

                        id: self.guid(),
                        type: 'marker',
                    });

                    self.addDrawingManager({
                        drawingModes: ['marker'],
                        drawingControl: false,
                    });

                    if (typeof options.markerOptions.callback !== 'function') {
                        options.markerOptions.callback = function (marker) {
                            self.setDrawingManagerInput(marker);

                            /*google.maps.event.addListener(marker, 'click', function () {
                             $reset = $('#draw-reset');

                             $reset.attr('data-id', marker.id);
                             $reset.attr('data-object', marker.type);
                             $reset.show();
                             });*/
                        }
                    }
                    options.markerOptions.callback(marker);
                }

                if (typeof options.callback !== 'undefined') options.callback(latlng);

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
};

// Geocode address to latlng
GoogleMaps.prototype.geocode = function (address, callback) {
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': address}, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
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
    let paths = coordinates;
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

GoogleMaps.prototype.push2object = function (object, path, value) {
    let obj = this.walkObject(object, path);
    if (obj) obj.push(value);
};

GoogleMaps.prototype.str2object = function (obj, path, value) {
    let parts = path.split("."), part;
    while (part = parts.shift()) {
        if (typeof obj[part] !== "object") obj[part] = {};
        obj = obj[part]; // update "pointer"
    }
    obj["_x"] = value;
};

GoogleMaps.prototype.walkObject = function (obj, path) {
    return path.split(".").reduce(function (o, x) {
        if (typeof o[x] === 'undefined') o[x] = [];
        return o[x];
    }, obj);
};

// Add heatmap
GoogleMaps.prototype.addHeatmap = function (coordinates) {
    let self = this;
    let data = [];
    let paths = self.coordinates2paths(coordinates);

    $.each(paths, function (index, val) {
        let latlng = new google.maps.LatLng(val.lat, val.lng);

        data.push(latlng);
        self.bounds.extend(latlng);
    });

    let heatmap = new google.maps.visualization.HeatmapLayer({
        data: data,
        map: self.map
    });

    this.push2object(self.objects, 'heatmap', heatmap);
};

// Add marker
GoogleMaps.prototype.addMarker = function (latlng, options) {
    let self = this;
    let marker = null;

    options.icon = options.icon || '';

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

        if (typeof options.icon === 'string' && options.icon !== '') {
            let markerIcon = options.icon;
            options.icon = {
                url: markerIcon,
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
            icon: options.icon, // 'https://maps.google.com/mapfiles/ms/micons/green.png',
            visible: typeof options.visible !== 'undefined' ? options.visible : true,
            label: options.label,
        });
        marker.id = options.id || self.guid();
        marker.type = options.type || 'marker';
        marker.deletable = options.deletable || false;

        // this.objects.markers.push(marker);
        // this.objects.markers[options.to].push(marker);

        this.push2object(self.objects, options.to, marker);
        // this.str2object(self.objects, options.to + '.' + marker.id, marker);

        this.bounds.extend(latlng);

        // add infoWindow
        if (typeof options.infoWindow !== 'undefined') {
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

    if (marker.deletable) self.addOverlayDeleteEvent(marker, callback(marker));

    google.maps.event.addListener(marker, 'dragend', function () {
        callback(marker);
    });
};

// Add polygon
GoogleMaps.prototype.addPolygon = function (coordinates, options) {
    let self = this;
    options = options || {};
    options.to = options.to || 'polygons';
    options.bounds = typeof options.bounds !== 'undefined' ? options.bounds : true;

    let paths = this.coordinates2paths(coordinates);
    let polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: options.strokeColor || '#1ab394',
        strokeOpacity: options.strokeOpacity || 0.8,
        strokeWeight: options.strokeWeight || 2,
        fillColor: options.fillColor || '#1ab394',
        fillOpacity: options.fillOpacity || 0.35,
        draggable: options.draggable || false,
        editable: options.editable || false
    });
    polygon.id = options.id || self.guid();
    polygon.type = options.type || 'polygon';
    polygon.deletable = options.deletable || false;

    polygon.setMap(this.map);

    // this.objects.polygons.push(polygon);
    this.push2object(self.objects, options.to, polygon);

    if (options.bounds) {
        $.each(paths, function (index, val) {
            self.bounds.extend(val);
        });
    }

    if (typeof options.label !== 'undefined') {
        let customMarker = new CustomMarker(
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
        }
    }

    if (polygon.deletable) self.addOverlayDeleteEvent(polygon, callback(polygon));

    google.maps.event.addListener(polygon, 'mouseover', function () {
        this.setOptions({fillOpacity: .2});
    });
    google.maps.event.addListener(polygon, 'mouseout', function () {
        this.setOptions({fillOpacity: fillOpacity});
    });

    google.maps.event.addListener(polygon, 'dragend', function () {
        callback(polygon);
    });

    google.maps.event.addListener(polygon.getPath(), 'insert_at', function () {
        callback(polygon);
    });
    google.maps.event.addListener(polygon.getPath(), 'remove_at', function () {
        callback(polygon);
    });
    google.maps.event.addListener(polygon.getPath(), 'set_at', function () {
        callback(polygon);
    });
};

GoogleMaps.prototype.addPolyline = function (coordinates, options) {
    let self = this;
    options = options || {};
    options.to = options.to || 'polylines';
    options.bounds = typeof options.bounds !== 'undefined' ? options.bounds : true;

    if (options.icons == 'arrow') {
        options.icons = [{
            icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
            offset: '100%',
        }];
    }

    let paths = this.coordinates2paths(coordinates);
    let polyline = new google.maps.Polyline({
        path: paths,
        strokeColor: options.strokeColor || '#1ab394',
        strokeOpacity: options.strokeOpacity || 0.8,
        strokeWeight: options.strokeWeight || 2,
        draggable: options.draggable || false,
        editable: options.editable || false,
        icons: options.icons ? options.icons : '',
    });
    polyline.id = options.id || self.guid();
    polyline.type = options.type || 'polyline';
    polyline.deletable = options.deletable || false;

    polyline.setMap(this.map);

    // this.objects.polylines.push(polyline);
    this.push2object(self.objects, options.to, polyline);

    if (options.bounds) {
        $.each(paths, function (index, val) {
            self.bounds.extend(val);
        });
    }

    if (typeof options.label !== 'undefined') {
        let customMarker = new CustomMarker(
            polyline.getApproximateCenter(),
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

    if (polyline.deletable) self.addOverlayDeleteEvent(polyline, callback(polyline));

    /*let strokeOpacity = polyline.strokeOpacity;
     google.maps.event.addListener(polyline, 'mouseover', function () {
     this.setOptions({strokeOpacity: .2});
     });
     google.maps.event.addListener(polyline, 'mouseout', function () {
     this.setOptions({strokeOpacity: strokeOpacity});
     });*/

    google.maps.event.addListener(polyline, 'dragend', function () {
        callback(polyline);
    });

    google.maps.event.addListener(polyline.getPath(), 'insert_at', function () {
        callback(polyline);
    });
    google.maps.event.addListener(polyline.getPath(), 'remove_at', function () {
        callback(polyline);
    });
    google.maps.event.addListener(polyline.getPath(), 'set_at', function () {
        callback(polyline);
    });
};

// Add infoWindow
GoogleMaps.prototype.addInfoWindow = function (object, options) {
    options = options || {};
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
    let self = this;
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
    let self = this;
    options = options || {};
    options.drawingModes = options.drawingModes || ['marker', 'polygon'];

    options.markerOptions = options.markerOptions || {};
    options.markerOptions.icon = options.markerOptions.icon || '';

    options.polygonOptions = options.polygonOptions || {};
    options.polylineOptions = options.polylineOptions || {};

    if (typeof options.markerOptions.icon === 'string' && options.markerOptions.icon !== '') {
        let markerIcon = options.markerOptions.icon;
        options.markerOptions.icon = {
            url: markerIcon,
            // scaledSize: new google.maps.Size(21, 34),
            // scaledSize: new google.maps.Size(32, 37),
            // origin: new google.maps.Point(0, 0),
            // anchor: new google.maps.Point(-5, 17)
        };
    }

    if (options.polylineOptions.icons == 'arrow') {
        options.polylineOptions.icons = [{
            icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
            offset: '100%',
        }];
    }

    $.each(options.drawingModes, function (index, value) {
        let exists = typeof self.objects.customDraws[value] !== 'undefined';
        if (exists) {
            let count = Object.keys(self.objects.customDraws[value]).length;
            let max = options[value + 'Options'].max;
            if (max !== null && max <= count) {
                let indexOf = options.drawingModes.indexOf(value);
                options.drawingModes.splice(indexOf, 1);
            }
        }
    });

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
            icon: options.markerOptions.icon || 'https://maps.google.com/mapfiles/ms/micons/red.png',

            max: options.markerOptions.max || null,
            callback: options.markerOptions.callback || null
        },
        polygonOptions: {
            strokeColor: options.polygonOptions.strokeColor || '#F75C54',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: options.polygonOptions.fillColor || '#F75C54',
            fillOpacity: 0.35,
            editable: true,
            draggable: options.polygonOptions.draggable || false,
            zIndex: 1,

            max: options.polygonOptions.max || null,
            callback: options.polygonOptions.callback || null
        },
        polylineOptions: {
            strokeColor: options.polylineOptions.strokeColor || '#F75C54',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            editable: true,
            draggable: options.polylineOptions.draggable || false,
            icons: options.polylineOptions.icons || null,

            max: options.polylineOptions.max || null,
            callback: options.polylineOptions.callback || null
        },

    });
    self.drawingManager.setMap(this.map);

    if (typeof options.drawingControl !== 'undefined' && !options.drawingControl) {
        self.drawingManager.setDrawingMode(null);
        self.drawingManager.setMap(null);

        // $reset.show();
    }

    self.addDrawingManagerEvents(self.drawingManager);
};

// Drawing manager events
GoogleMaps.prototype.addDrawingManagerEvents = function (drawingManager) {
    let self = this;

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
        self.push2object(self.objects, 'customDraws.' + overlay.type, overlay);

        self.addOverlayDeleteEvent(overlay);
        overlay.callback(overlay);

        let count = Object.keys(self.objects.customDraws[overlay.type]).length;
        let max = drawingManager[overlay.type + 'Options'].max;
        if (max !== null && max <= count) {
            let indexOf = drawingManager.drawingControlOptions.drawingModes.indexOf(overlay.type);
            drawingManager.drawingControlOptions.drawingModes.splice(indexOf, 1);
            drawingManager.setDrawingMode(null);
            drawingManager.setMap(self.map);
        }
    });
};

GoogleMaps.prototype.addOverlayDeleteEvent = function (overlay) {
    let self = this;
    google.maps.event.addListener(overlay, 'click', function () {
        $reset = $(self.options.div).find('#draw-reset');

        $reset.attr('data-id', overlay.id);
        $reset.attr('data-object', overlay.type);
        $reset.show();

    });
    if (typeof overlay.callback === 'function') overlay.callback(overlay);
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
            'data-id': overlay.id,
            'data-type': overlay.type,
        });
        $(self.options.div).prepend($input);
    }
    $input.attr('value', coordinates);

    // $.session.clear();
    self.setCoordinatesSession(overlay, coordinates);

};

GoogleMaps.prototype.getCoordinatesSession = function () {
    let session = $.session.get(window.location.href);
    if (typeof session !== 'undefined') {
        session = JSON.parse($.session.get(window.location.href));
    }

    return session;
};

GoogleMaps.prototype.setCoordinatesSession = function (overlay, coordinates) {
    let session = this.getCoordinatesSession();
    if (typeof session === 'undefined') session = {};

    this.str2object(session, this.options.div + '.coordinates.' + overlay.type + '.' + overlay.id, coordinates);
    // this.push2object(session, this.options.div + '.coordinates.' + overlay.type, coordinates);

    $.session.set(window.location.href, JSON.stringify(session));

    // console.log(this.getCoordinatesSession());
    return session;
};

GoogleMaps.prototype.resetCoordinatesSession = function (id, type) {
    let session = this.getCoordinatesSession();

    if (typeof type !== 'undefined' && typeof id !== 'undefined') {
        let exists = this.objectIsExists(session, [this.options.div, 'coordinates', type, id]);
        if (exists) delete session[this.options.div]['coordinates'][type][id];

    } else {
        let exists = this.objectIsExists(session, [this.options.div, 'coordinates']);
        if (exists) delete session[this.options.div]['coordinates'];
    }
    $.session.set(window.location.href, JSON.stringify(session));
};

GoogleMaps.prototype.objectIsExists = function (obj, args) {
    // let args = Array.prototype.slice.call(arguments, 1);
    for (let i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return false;
        }
        obj = obj[args[i]];
    }

    return true;
};

// Reset map
GoogleMaps.prototype.reset = function (objects) {
    let self = this;

    // TODO Refactor
    self.resetCoordinatesSession();
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
    let self = this;
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
