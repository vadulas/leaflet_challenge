// Create the tile layers
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Grey scale layer
var grey_scale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

var watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a bse map
let basemaps = {Default: defaultMap, GrayScale: grey_scale, WaterColor: watercolor, OpenTopoMap:topoMap}

// Make a map object
var myMap = L.map("map", {center: [36.7783, -119.4179], zoom: 5, layers: [ grey_scale, defaultMap, watercolor, topoMap]});

// add the default map to the map
defaultMap.addTo(myMap);


//Get the data for the tectonic plates and draw on the map

// variable to hold the tectonic plate
let tectonicplates  = new L.layerGroup();
// call the api to get the info for the tectonic plates

d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").
then(createTectonicPlates);

// variable to hold the earthquakes layer
let earthquakes  = new L.layerGroup();
// Get the data for earth quakes and populate the layergroup
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").
then(createEarthquakeMarkers);

let overlays = { 
    "Tectonic Plates": tectonicplates,
    "Earth Quakes": earthquakes

}
// Add the layer control
L.control.layers(basemaps, overlays).addTo(myMap);

// add the legend to the map
let legend  = L.control({
    position: "bottomright"

});

// add the properties for the legend
legend.onAdd = function(){
    // make a div for the legend
    let div = L.DomUtil.create('div', 'info legend');

    // set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    // set the colors for the intervals
    let colors = ["green", "#cafc03", "#fcad03", "#fc8403", "#fc4903", "red"];

    // loop through the intervals and colors and generate a label with a colored square for each interval
    for (var i = 0; i < intervals.length; i++){
        // Use innner html to set the quare for each interval and label

        div.innerHTML += "<i style=background:"
                + colors[i] 
                + "></i>"
                + intervals[i]
                + (intervals[i+1] ? "km &ndash;" + intervals[i+1] + "km" + "<br>" : "+");
    }

    return div;
};

legend.addTo(myMap);


function createTectonicPlates(response){
    // Load the data using geoJSON and add to the tectonic plate layers
    L.geoJson(response, {
        color: "red",
        weight: 2
    }).addTo(tectonicplates);

    //Add the tectonic plates to the map
    tectonicplates.addTo(myMap);
    // Create the info for earthquake overlays
    let earthquakes  = new L.layerGroup();
}

function createEarthquakeMarkers(response){

    // plot circle where the radius is dependent on the magnitude and the color on depth

    //add the geoJson
    L.geoJson(response, {
        // make each feature a marker that is on the map, each marker is a circle
        pointToLayer: function(feature, latlng){
            return L.circleMarker(latlng);
        },
        //set the style for each marker
        style: dataStyle, //Calls the datastyle function and passes in the earthquaake data
        //add popups
        onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                            Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                            Location: <b>${feature.properties.place}</b>`)
        }

    }).addTo(earthquakes);

    //Add the earthquake layer
    earthquakes.addTo(myMap);
}


function dataColor(depth){
    if (depth > 90) return "red";
    else if (depth > 70) return "#fc4903";
    else if (depth > 50) return "#fc8403";
    else if (depth > 30) return "#fcad03";
    else if (depth > 10) return "#cafc03";
    else return "green";
}

function radiusSize(magnitude){
    if (magnitude == 0) return 1; //to make sure a 0 mag earthquake shows up
    else return magnitude * 5;
}

function dataStyle(feature){

    return {
        opacity: 0.5,
        fillOpacity: 0.5,
        fillColor: dataColor(feature.geometry.coordinates[2]),
        color: "000000",  //outline color
        radius: radiusSize(feature.properties.mag),
        weight: 0.5,
        stroke: true
    }

}