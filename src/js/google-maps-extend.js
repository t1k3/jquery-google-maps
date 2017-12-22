"use strict";

// Add custom getBounds method
google.maps.Polygon.prototype.getBounds = google.maps.Polyline.prototype.getBounds = function () {
    let bounds = new google.maps.LatLngBounds();
    this.getPath().forEach(function (element, index) {
        bounds.extend(element);
    });

    return bounds;
};

// Add center calculation method
google.maps.Polygon.prototype.getApproximateCenter = google.maps.Polyline.prototype.getApproximateCenter = function () {
    let boundsHeight = 0;
    let boundsWidth = 0;
    let centerPoint;
    let heightIncr = 0;
    let maxSearchLoops;
    let maxSearchSteps = 10;
    let n = 1;
    let northWest;
    let polygonBounds = this.getBounds();
    let testPos;
    let widthIncr = 0;

    // Get polygon Centroid
    centerPoint = polygonBounds.getCenter();

    if (google.maps.geometry.poly.containsLocation(centerPoint, this)) {
        // Nothing to do Centroid is in polygon use it as is
        return centerPoint;
    } else {
        maxSearchLoops = maxSearchSteps / 2;

        // Calculate NorthWest point so we can work out height of polygon NW->SE
        northWest = new google.maps.LatLng(polygonBounds.getNorthEast().lat(), polygonBounds.getSouthWest().lng());

        // Work out how tall and wide the bounds are and what our search increment will be
        boundsHeight = google.maps.geometry.spherical.computeDistanceBetween(northWest, polygonBounds.getSouthWest());
        heightIncr = boundsHeight / maxSearchSteps;
        boundsWidth = google.maps.geometry.spherical.computeDistanceBetween(northWest, polygonBounds.getNorthEast());
        widthIncr = boundsWidth / maxSearchSteps;

        // Expand out from Centroid and find a point within polygon at 0, 90, 180, 270 degrees
        for (; n <= maxSearchLoops; n++) {
            // Test point North of Centroid
            testPos = google.maps.geometry.spherical.computeOffset(centerPoint, (heightIncr * n), 0);
            if (google.maps.geometry.poly.containsLocation(testPos, this)) {
                break;
            }

            // Test point East of Centroid
            testPos = google.maps.geometry.spherical.computeOffset(centerPoint, (widthIncr * n), 90);
            if (google.maps.geometry.poly.containsLocation(testPos, this)) {
                break;
            }

            // Test point South of Centroid
            testPos = google.maps.geometry.spherical.computeOffset(centerPoint, (heightIncr * n), 180);
            if (google.maps.geometry.poly.containsLocation(testPos, this)) {
                break;
            }

            // Test point West of Centroid
            testPos = google.maps.geometry.spherical.computeOffset(centerPoint, (widthIncr * n), 270);
            if (google.maps.geometry.poly.containsLocation(testPos, this)) {
                break;
            }
        }

        return (testPos);
    }
};
