/**
 * Created by ptrbdr on 16.11.18.
 */


function updateBarChart(height, local, x, y, svg, data, xMax, xMedian) {

    // Scale the range of the data in the domains
    x.domain([0, xMax]);
    y.domain(data.map(function(d) { return d.key; }));

// append the rectangles for the bar chart


    var barsUpd = svg.selectAll("rect")
        .data(data, function (d) {
            return d.value
        });

    var barsEnter = barsUpd
        .enter()
        .append("rect")
        .attr('class', 'enter')
        .attr("height", y.bandwidth())
        .attr('fill', function (d) {
            return 'rgb(103, 0, 13)'
        });

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
            return 'rgb(103, 0, 13)'
        })
        .attr("y", function(d) {
            return y(d.key);
        });

    barsUpd.exit().remove();

// add the x Axis
    svg.select('.xAxis')
        .attr("transform", "translate(0," + height + ")")
        .attr('class', 'xAxis')
        .transition()
        .duration(500)
        .call(d3.axisBottom(x).tickFormat(local.format("$,.2r")).tickValues([xMedian, xMax]));

// add the y Axis
    svg.select('.yAxis')
        .transition() // Wait one second. Then brown, and remove.
        .duration(500)
        .call(d3.axisLeft(y));


}