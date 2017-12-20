function CustomMarker(latlng, map, options) {
    this.latlng = latlng;
    this.options = options;
    this.setMap(map);
};

CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.draw = function () {

    let self = this;
    let div = this.div;

    if (!div) {
        div = this.div = document.createElement('div');

        $(div)
            .css({
                position: 'absolute',
                top: 0,
                left: 0
            })
            .html(self.options.content);

        if (typeof(self.options.id) !== 'undefined') {
            $(div).attr('id', self.options.id);
        }
        if (typeof(self.options.class) !== 'undefined') {
            $(div).addClass(self.options.class);
        }

        google.maps.event.addDomListener(div, "click", function () {
            google.maps.event.trigger(self, "click");
        });

        let panes = this.getPanes();
        panes.overlayImage.appendChild(div);
    }

    let point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    if (point) {
        div.style.left = point.x + 'px';
        div.style.top = point.y + 'px';
    }
};

CustomMarker.prototype.remove = function () {
    if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
    }
};

CustomMarker.prototype.getPosition = function () {
    return this.latlng;
};

module.exports = CustomMarker;