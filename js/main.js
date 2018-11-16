var map = L.map('map').setView([49.551159, 25.593465], 8);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
}).addTo(map);

d3.csv('data/dataset.csv')
    .then(function(data) {


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

        var timeScale = d3.scaleLinear()
            .domain([2012, 2018])
            .range([0.1, 1]);

        function style(feature) {
            return {
                // weight: 2,
                // opacity: 1,
                color: 'white',
                fill: scaleColor(+feature.properties.cost),
                fillOpacity: 1,
                fillColor: scaleColor(+feature.properties.cost)
            };
        }

        function scaleColor(x) {
            var scale = d3.scaleLinear()
                .domain([0, 5000000])
                .range([0, 1]);
            return d3.interpolateReds(scale(x));
        }

        var markers = L.geoJSON(geojson,
            {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, style(feature)
                    );
                }
            }
        ).addTo(map);

//

        function onMapClick(e) {

            d3.select('div.info p.repairment_company').text(e.sourceTarget.feature.properties.repairment_company.toString() == '' ? 'Немає даних' : 'Роботу виконали: '
                                                            + e.sourceTarget.feature.properties.repairment_company.toString());
            d3.select('div.info p.year').text(' У ' + e.sourceTarget.feature.properties.year.toString() + ' році');
            d3.select('div.info p.work_type').text(e.sourceTarget.feature.properties.description.toString() == '' ? 'Немає даних' : e.sourceTarget.feature.properties.description.toString());
            d3.select('div.info p.cost').text(
                e.sourceTarget.feature.properties.cost.toString() == '' ?
                    'Немає даних про вартість.' :
                d3.format(',.2r')(e.sourceTarget.feature.properties.cost) + ' грн.')


        }

        var contained = [];

        // d3.select('div.chart svg').remove();


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
            .entries(dataForChart);



        var namesOfWorks = ['Утеплення торців', 'Утеплення будинку', 'Встановлення ІТП',
            'Заміна вікон', 'Заміна вікон та освітлення', 'Утеплення стін',
            'Заміна мереж', 'Утеплення покрівлі', 'Ремонт теплових мереж',
            'Утеплення під’їздів', 'Утеплення блоку', 'Ремонт тротуарів',
            'Ремонт дороги'];
        //
        // var namesOfWorks = ['Ремонт доріг і тротуарів', 'Утеплення', 'Ремонт будинків'];


        var a = nested.map(d => d.key)
        namesOfWorks.forEach(function(d) {

            if (a.includes(d))
            {

            }
            else {
                nested.push( {'key':d, 'value':0} )
            }
        });

        nested.sort((a, b) => parseFloat(a.value) - parseFloat(b.value))


        var margin = {top: 0, right: 60, bottom: 30, left: 170},
            width = document.getElementsByClassName('chart')[0].offsetWidth * 0.8 - margin.left - margin.right,
            height = d3.select('div.chart')._groups[0][0].clientHeight - margin.top - margin.bottom;


        var svg = d3.select('div.chart').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

// set the ranges

        var y = d3.scaleBand()
            .range([height, 0])
            .padding(.5);

        var x = d3.scalePow().exponent(0.2)
            .range([0, width]);

        var xMax = d3.max(nested, function(d){ return d.value; });
        var xMedian = d3.median(nested, function(d){ return d.value; });
        var percentile = d3.quantile(nested.map(d => d.value), 0.95);


        // Scale the range of the data in the domains
        x.domain([0, xMax]);
        y.domain(nested.map(function(d) { return d.key; }));
        //y.domain([0, d3.max(data, function(d) { return d.sales; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
            .data(nested)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.sales); })
            .attr('fill', function (d) {
                return 'rgb(103, 0, 13)'
            })
            .attr("width", function(d) {
                return x(d.value);
            } )
            .attr("y", function(d) {
                return y(d.key);
            })
            .attr("height", y.bandwidth());

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'xAxis')
            .call(d3.axisBottom(x).tickFormat(local.format("$,.2r")).tickValues([xMedian, xMax]));

        // add the y Axis
        svg.append("g")
            .attr('class', 'yAxis')
            // .attr("transform", "translate(" + -5 + ",0)")
            .call(d3.axisLeft(y))
            .selectAll(".tick text")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + -155 + ",0)")
            // .call(wrap, margin.left);


        // createBrush(dataForChart)

        markers.on('click', onMapClick);

        map.on('moveend', function() {
            var contained = [];

            // d3.select('div.chart svg').remove();


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
                .entries(dataForChart);



            var namesOfWorks = ['Утеплення торців', 'Утеплення будинку', 'Встановлення ІТП',
                'Заміна вікон', 'Заміна вікон та освітлення', 'Утеплення стін',
                'Заміна мереж', 'Утеплення покрівлі', 'Ремонт теплових мереж',
                'Утеплення під’їздів', 'Утеплення блоку', 'Ремонт тротуарів',
                'Ремонт дороги'];
            //

            // var namesOfWorks = ['Ремонт доріг і тротуарів', 'Утеплення', 'Ремонт будинків'];

            var a = nested.map(d => d.key);
            namesOfWorks.forEach(function(d) {

                if (a.includes(d))
                {

                }
                else {
                    nested.push( {'key':d, 'value':0} )
                }
            });

            nested.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));


//                    var margin = {top: 0, right: 20, bottom: 30, left: 150},
//                            width = document.getElementsByClassName('chart')[0].offsetWidth - margin.left - margin.right,
//                            height = d3.select('div.chart')._groups[0][0].clientHeight - margin.top - margin.bottom;
//
//
//                    var svg = d3.select('div.chart').append('svg')
//                            .attr("width", width + margin.left + margin.right)
//                            .attr("height", height + margin.top + margin.bottom)
//                            .append("g")
//                            .attr("transform",
//                                    "translate(" + margin.left + "," + margin.top + ")");

// set the ranges

            var y = d3.scaleBand()
                .range([height, 0])
                .padding(.5);

            var x = d3.scalePow().exponent(0.2)
                .range([0, width]);

            var xMax = d3.max(nested, function(d){ return d.value; });
            var xMedian = d3.median(nested, function(d){ return d.value; });
            var percentile = d3.quantile(nested.map(d => d.value), 0.95);

            // Scale the range of the data in the domains
            x.domain([0, xMax]);
            y.domain(nested.map(function(d) { return d.key; }));
            //y.domain([0, d3.max(data, function(d) { return d.sales; })]);

            // append the rectangles for the bar chart
            svg.selectAll(".bar")
                .data(nested)
                .transition() // Wait one second. Then brown, and remove.
                .delay(100)
                //                            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.sales); })
                .attr("width", function(d) {
                    return x(d.value);
                } )
                .attr("y", function(d) {
                    return y(d.key);
                })
                .attr("height", y.bandwidth());


            // add the x Axis
            d3.selectAll('.xAxis')
                .transition() // Wait one second. Then brown, and remove.
                .delay(100)
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickFormat(local.format("$,.2r")).tickValues([xMedian, xMax]));

            // add the y Axis
            d3.selectAll('.yAxis')
                .transition() // Wait one second. Then brown, and remove.
                .duration(100)
                .call(d3.axisLeft(y))
                .selectAll(".tick text")
                .style("text-anchor", "start")
                .attr("transform", "translate(" + -155 + ",0)");
            // .call(wrap, margin.left);

        });
    });


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