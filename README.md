# Google Maps JS
Work in progress

## Installation
```bash
npm install --save-dev https://github.com/t1k3hu/jquery-google-maps 
# npm install --save-dev jquery-google-maps
```

## Options
| Key               | Value                              |
| ----------------- | ---------------------------------- |
| div               | "#divID"                           |
| center            | {lat: 47.1556941, lng: 18.3847734} |
| zoom              | 8                                  |
| type              | "hybrid"                           |
| printable         | false                              |
| locationable      | true                               |

## How to init
```html
<script src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_API_KEY') }}&libraries=geometry,drawing"></script>
```

```js
    import 'font-awesome/css/font-awesome.min.css'; // btns: printable, locationable, streetviewable
    import "js-marker-clusterer";
    import "jquery.session";
    
    import "jquery-google-maps/dist/css/google-maps.min.css";
    import "jquery-google-maps";
    
    var gmaps = new GoogleMaps({
        div: "#gmaps",
        latlng: {lat: 47.157562, lng: 18.3847344},
        zoom: 8,
        type: "roadmap",
        
        locationable: true,
        streetviewable: true,
        printable: false,
        
        gestureHandling: "cooperative", // "none", "greedy", "cooperative"
        fullscreenControl: true,
        streetViewControl: true,
    });
    
    gmaps.addMarker({lat: 47.50706, lng: 19.047991}, {
        infoWindow: "<b>Palace of Parliament Hungary</b>",
    });
    
    gmaps.fitZoom();
```

## Methods
* setZoom(level)
* setCenter(latlng)
* fitZoom()
* addMarker(latlng, options)
```js
    gmaps.addMarker({lat: 47.50706, lng: 19.047991}, {
        infoWindow: "<b>Palace of Parliament Hungary</b>",
    });
```

## TODO
- [ ] Documentation
- [ ] Documentation: Options
- [ ] Documentation: Methods
- [ ] Refactor

## Credits
* [T1k3](https://github.com/t1k3hu)
