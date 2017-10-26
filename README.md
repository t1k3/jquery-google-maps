# Google Maps JS
Work in progress

## Installation
```bash
npm install https://github.com/t1k3hu/jquery-google-maps 
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
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="../dist/css/google-maps.css">
    
    <script src="https://maps.googleapis.com/maps/api/js?key=<API_KEY>&v=3.27&libraries=geometry,drawing"></script>
    <script src="../node_modules/jquery/dist/jquery.min.js"></script>
    <script src="../node_modules/dom-to-image/dist/dom-to-image.min.js"></script>
    <script src="../dist/js/google-maps.js"></script>
    
    <script>
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
    </script>
```

## Methods

* addMarker
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
