/**
 * Created by ptrbdr on 16.11.18.
 */


function updateBarChart(height, local, x, y, svg, data, xMax, xMedian) {

    // Scale the range of the data in the domains
    x.domain([0, xMax]);
    y.domain(data.map(function(d) { return d.key; }));

// append the rectangles for the bar chart

    console.log(data);


    var barsUpd = svg.selectAll("rect")
        .data(data, function (d) {
            return d.value
        });

    var barsEnter = barsUpd
        .enter()
        .append("rect")
        .attr('class', 'bars')
        .attr('height', 7);
        // .attr("height", y.bandwidth() * 0.7 );

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
        .attr('class', 'textTick');
        // .style("font", "10px sans-serif");

    textUpd.merge(textEnter)
        .attr("fill", "grey")
        .attr("x", d =>  0)
        .attr("y", d => y(d.key) - y.bandwidth() * 0.7)
        .attr("dy", "0.35em")
        .text(d => d.key + ', ' + formatSIPrefixed(local.format(".2s")(d.value)));

    textUpd.exit().remove();


// add the y Axis
//     svg.select('.yAxis')
//         .transition() // Wait one second. Then brown, and remove.
//         .duration(500)
//         .call(d3.axisLeft(y))
//         .selectAll(".tick text")
//         .style("text-anchor", "start")
//         .attr("transform", "translate(" + -207 + ",0)");


}