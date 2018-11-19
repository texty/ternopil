/**
 * Created by ptrbdr on 16.11.18.
 */


function updateBarChart(height, local, x, y, svg, data, xMax, xMedian) {

    // Scale the range of the data in the domains
    x.domain([0, xMax]);
    y.domain(data.map(function(d) { return d.key; }));

    function scaleColor(x) {
        var scale = d3.scaleLog()
            .domain([1, 500000000])
            .range([0, 1]);
        return d3.interpolateReds(scale(x));
    }

// append the rectangles for the bar chart


    var barsUpd = svg.selectAll("rect")
        .data(data, function (d) {
            return d.value
        });

    var barsEnter = barsUpd
        .enter()
        .append("rect")
        .attr('class', 'bars')
        .attr("height", y.bandwidth());

    barsUpd.merge(barsEnter)
        .attr("x", function(d) { return 0; })
        .attr("width", function(d) {
            return 0;
        })
        .transition()
        .duration(500)
        .attr("width", function(d) {
            return x(d.value);
        })
        .attr('fill', function (d) {
            return 'black';
        })
        .attr("y", function(d) {
            return y(d.key);
        });

    barsUpd.exit().remove();


    var textUpd = svg.selectAll(".textTick")
        .data(data);

    var textEnter = textUpd
        .enter()
        .append("text")
        .attr('class', 'textTick')
        .style("font", "10px sans-serif");

    textUpd.merge(textEnter)
        .attr("fill", "grey")
        .attr("x", d => x(d.value) + 25)
        .attr("y", d => y(d.key) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => local.format("$,.2r")(d.value));

    textUpd.exit().remove();


// add the x Axis
//     svg.select('.xAxis')
//         .attr("transform", "translate(0," + height + ")")
//         .attr('class', 'xAxis')
//         .transition()
//         .duration(500)
//         .call(d3.axisBottom(x).tickFormat(local.format("$,.2r")).tickValues([xMedian, xMax]));

// add the y Axis
    svg.select('.yAxis')
        .transition() // Wait one second. Then brown, and remove.
        .duration(500)
        .call(d3.axisLeft(y))
        .selectAll(".tick text")
        .style("text-anchor", "start")
        .attr("transform", "translate(" + -210 + ",0)");


}