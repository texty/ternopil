var nested, nested_updated;

var map = L.map('map').setView([49.551159, 25.593465],12);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
}).addTo(map);


// time scale for line chart not currently used
// var timeScale = d3.scaleLinear()
//     .domain([2012, 2018])
//     .range([0.1, 1]);


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

d3.csv('data/dataset.csv')
    .then(function(data) {

        const innitialData = [
            {'key':'Утеплення торців', 'value':0}, {'key':'Утеплення будинку', 'value':0},
            {'key':'Встановлення ІТП', 'value':0}, {'key':'Заміна вікон', 'value':0},
            {'key':'Заміна вікон та освітл.', 'value':0}, {'key':'Утеплення стін', 'value':0},
            {'key':'Заміна мереж', 'value':0}, {'key':'Утеплення покрівлі', 'value':0},
            {'key':'Ремонт тепл. мереж', 'value':0}, {'key':'Утеплення під’їздів', 'value':0},
            {'key':'Утеплення блоку', 'value':0}, {'key':'Ремонт тротуарів', 'value':0},
            {'key':'Ремонт дороги', 'value':0}
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
                    return L.circleMarker(latlng, style(feature)
                    );
                }
            })
            .addTo(map);

        //nested data to build bars
        prepareData(markers, innitialData);

        var margin = {top: 0, right: 80, bottom: 30, left: 220},
            width = document.getElementsByClassName('chart')[0].offsetWidth * 0.9 - margin.left - margin.right,
            height = d3.select('div.chart')._groups[0][0].clientHeight - margin.top - margin.bottom;


        var svg = d3.select('div.chart').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform","translate(" + margin.left + "," + margin.top + ")");

        var y = d3.scaleBand()
            .range([height, 0])
            .padding(.5);

        var x = d3.scalePow().exponent(0.2)
            .range([0, width]);

        var xMax = d3.max(innitialData, function(d){ return d.value; });
        var xMedian = d3.median(innitialData, function(d){ return d.value; });
        var percentile = d3.quantile(innitialData.map(d => d.value), 0.95);

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'xAxis')
            .call(d3.axisBottom(x).tickFormat(local.format("$,.2r")).tickValues([xMedian, xMax]));

        // add the y Axis
        svg.append("g")
            .attr('class', 'yAxis')
            .call(d3.axisLeft(y));
            // .selectAll(".tick text")
            // .style("text-anchor", "start")
            // .attr("transform", "translate(" + -155 + ",0)");
            // .call(wrap, margin.left);


        updateBarChart(height, local, x, y, svg, innitialData, xMax, xMedian);
        


        // Хотів додати лінійний графік для часу, але він погано виглядає і безтолковий
        // createBrush(dataForChart)


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


    d3.select('div.info h5').text('Деталі робіт')
    d3.select('div.info p.repairment_company').text(e.sourceTarget.feature.properties.repairment_company.toString() == '' ? 'Немає даних' : 'Роботу виконали: '
    + e.sourceTarget.feature.properties.repairment_company.toString() + ' у ' + e.sourceTarget.feature.properties.year.toString() + ' році');
    // d3.select('div.info p.year').text(' У ' + e.sourceTarget.feature.properties.year.toString() + ' році');
    d3.select('div.info p.work_type').text(e.sourceTarget.feature.properties.description.toString() == '' ? 'Немає даних' : e.sourceTarget.feature.properties.description.toString());
    d3.select('div.info p.cost').text(
        e.sourceTarget.feature.properties.cost.toString() == '' ?
            'Немає даних про вартість.' : 'Вартість: ' +
        d3.format(',.2r')(e.sourceTarget.feature.properties.cost) + ' грн.')
}