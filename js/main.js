var nested, nested_updated;

var map = L.map('map').setView([49.551159, 25.593465],12);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
}).addTo(map);

var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false
})
    .on('markgeocode', function(e) {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
        ]);
        map.fitBounds(poly.getBounds());
    })
    .addTo(map);



//defined style for layer, may use it if I'll need several layers
function style(feature) {
    return {
        color: 'white',
        fill: scaleColor(+feature.properties.cost),
        fillOpacity: 1,
        fillColor: scaleColor(+feature.properties.cost)
    };
}

// defined color scale
function scaleColor(x) {
    var scale = d3.scaleLinear()
        .domain([0, 5000000])
        .range([0, 1]);
    return d3.interpolateReds(scale(x));
}


// змінює залежно від розміру екрану те чи видно елемент .info
if (document.body.clientWidth < 576) {
    d3.select('div.info').node().style.display = 'visible';
}
else {
    d3.select('div.info').node().style.display = 'none';


}

// d3.csv('data/dataset.csv')
d3.csv('data/data_updated.csv')
    .then(function(data) {

        const innitialData = [
             {'key':'Ремонт покрівель', 'value':0},
            {'key':'Ремонт тротуарів', 'value':0},
            {'key':'Ремонт дороги', 'value':0}, {'key': 'Ремонт прибуд. території', 'value':0},
            {'key': 'Тепломодернізація', 'value':0}


        ];

        // defined local option for time and currency ticks
        var local = d3.formatLocale ({
            "decimal": ".",
            "thousands": ",",
            "grouping": [3],
            "currency": ["", " грн."],
            "dateTime": "%a %b %e %X %Y",
            "date": "%m/%d/%Y",
            "time": "%H:%M:%S",
            "periods": ["AM", "PM"],
            "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        });


        window.data = data;

        // created geojson out of basic data
        var geojson = data.map(function (d) {
            return {
                type: "Feature",
                properties: d,
                geometry: {
                    type: "Point",
                    coordinates: [+d.Longitude, +d.Latitude]
                }
            }
        });


        //created leaflet markers
        var markers = L.geoJSON(geojson,{
                pointToLayer: function (feature, latlng) {

                    try {
                        return L.circleMarker(latlng, style(feature))
                    }
                    catch(err) {
                        debugger;
                    }

                }
            })
            .addTo(map);

        //nested data to build bars
        prepareData(markers, innitialData);


        // if (document.getElementsByClassName('chart')[0].offsetWidth < 350) {
        //     var margin = {top: 10, right: 0, bottom: 5, left: 5}
        // }
        // else {
        //     var margin = {top: 10, right: 0, bottom: 5, left: 5}
        // }

        var margin = {top: 5, right: 2, bottom: 5, left: 2};

        // var width = (document.body.clientWidth * 0.5) - margin.left - margin.right,
        //     height = (document.body.clientWidth * 0.9) - margin.left - margin.right


        var width = document.getElementsByClassName('chart')[0].offsetWidth * 0.9 - margin.left - margin.right,
            height = (document.getElementsByClassName('chart')[0].offsetHeight * 0.5 - margin.top - margin.bottom);
            // d3.select('div.chart')._groups[0][0].clientHeight - margin.top - margin.bottom);

        var svg = d3.select('div.chart').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform","translate(" + margin.left + "," + margin.top + ")");

        var y = d3.scaleBand()
            .range([height, 0])
            .padding(.5);

        ////// exponential scale
        // var x = d3.scalePow().exponent(0.2)
        //     .range([0, width]);

        var x = d3.scaleLinear()
            .range([0, width]);
        
        var ticks = svg.append("g").attr('class', 'ticks');

        var xMax = d3.max(innitialData, function(d){ return d.value; });
        var xMedian = d3.median(innitialData, function(d){ return d.value; });


        // add the y Axis
        // svg.append("g")
        //     .attr('class', 'yAxis')
        //     .attr("transform", "translate(" + width/1.9 + ",-15)")
        //     .call(d3.axisLeft(y))


        updateBarChart(height, local, x, y, svg, innitialData, xMax, xMedian);


        //EVENTS
        //////////////
        markers.on('click', onMapClick);

        // here I defined bar chart update after zoom or mouse move;
        map.on('moveend', function() {
            prepareData(markers, innitialData);

            var xMax = d3.max(innitialData, function(d){ return d.value; });
            var xMedian = d3.median(innitialData, function(d){ return d.value; });
            //var percentile = d3.quantile(nested.map(d => d.value), 0.95);

            // Scale the range of the data in the domains
            x.domain([0, xMax]);
            y.domain(innitialData.map(function(d) { return d.key; }));

            updateBarChart(height,local, x, y, svg, innitialData, xMax, xMedian);
            
        });
        
        ///////////////
        
    });


// NOT USING, wrapping long tick names
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");


        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });

}

// function transforms data from bounding box of the screen into nested format suitable for the chart builder
function prepareData(markers, innitialData) {
    var contained = [];
    
    markers.eachLayer(function(l) {
        if( map.getBounds().contains(l.getLatLng()) )
            contained.push(l);
    });

    var dataForChart = contained.map(function (d) {
        return d.feature.properties
    });

    var nested = d3.nest()
        .key(function(d) { return d.work_type; })
        .rollup(function(leaves) { return d3.sum(leaves, function(d) {return parseFloat(d.cost)}) })
        .map(dataForChart);
    

    for (var i in innitialData) {
        innitialData[i].value = nested['$' + innitialData[i].key] == undefined ? 0 : nested['$' + innitialData[i].key];
    }

    innitialData.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
    
}


// function to add detailed info about each work on click;
function onMapClick(e) {

    var popup = L.popup();


    var company = e.sourceTarget.feature.properties.repairment_company.toString() == '' ? 'Немає даних' : 'Роботу виконали: '
    + e.sourceTarget.feature.properties.repairment_company.toString() + ' у ' + e.sourceTarget.feature.properties.year.toString() + ' році'

    var work_type = e.sourceTarget.feature.properties.description.toString() == '' ? 'Немає даних' : e.sourceTarget.feature.properties.description.toString()

    var cost = e.sourceTarget.feature.properties.cost.toString() == '' ?
        'Немає даних про вартість.' : 'Вартість: ' +
    formatSIPrefixed(d3.format('.2s')(e.sourceTarget.feature.properties.cost));


    if (document.body.clientWidth < 576) {

        d3.select('div.info h5').text('Опис ремонту')
        d3.select('div.info p.repairment_company').text(e.sourceTarget.feature.properties.repairment_company.toString() == '' ? 'Немає даних' : 'Роботу виконали: '
        + e.sourceTarget.feature.properties.repairment_company.toString() + ' у ' + e.sourceTarget.feature.properties.year.toString() + ' році');
        // d3.select('div.info p.year').text(' У ' + e.sourceTarget.feature.properties.year.toString() + ' році');
        d3.select('div.info p.work_type').text(e.sourceTarget.feature.properties.description.toString() == '' ? 'Немає даних' : e.sourceTarget.feature.properties.description.toString());
        d3.select('div.info p.cost').text(
            e.sourceTarget.feature.properties.cost.toString() == '' ?
                'Немає даних про вартість.' : 'Вартість: ' +
            formatSIPrefixed(d3.format('.2s')(e.sourceTarget.feature.properties.cost)))
    }
    else {
        popup
            .setLatLng(e.latlng)
            .setContent(
                "<b>" + "Опис ремонту " + "</b>" + "<br>" + company + "<br>" + work_type + "<br>" + cost + "<br>"
            )
            .openOn(map);
    }


}

function formatSIPrefixed(string) {
    if (string.includes('G')) {
        string = string.replace('G', ' млрд.')
    }
    if (string.includes('M')) {
        string = string.replace('M', ' млн.')
    }
    if (string.includes('k')) {
        string = string.replace('k', ' тис.')
    }

    return string
}
