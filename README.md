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
<script src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_API_KEY') }}&v=3.27&libraries=geometry,drawing"></script>
```

```js
    import "dom-to-image"; // printable
    import 'font-awesome/css/font-awesome.min.css'; // btns: printable, locationable
    
    import "jquery-google-maps/dist/css/google-maps.css";
    import "jquery-google-maps";
    
    var gmaps = new GoogleMaps({
        div: "#gmaps",
        latlng: {lat: 47.157562, lng: 18.3847344},
        zoom: 8,
        type: "roadmap",
        locationable: true,
        printable: false,
    });
    
    gmaps.addMarker({lat: 47.50706, lng: 19.046351}, {
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
    gmaps.addMarker({lat: 47.50706, lng: 19.046351}, {
        infoWindow: "<b>Palace of Parliament Hungary</b>",
    });
```

## TODO
- [ ] Documentation
- [ ] Documentation: Options
- [ ] Documentation: Methods
- [ ] Printable
- [ ] CSS build
- [ ] Refactor

## Credits
* [T1k3](https://github.com/t1k3hu)
