// Width and height
var chart_width = 1600;
var chart_height = 800;
var padding = 60;

var time_parse = d3.timeParse("%Y-%m-%d");
var time_format = d3.timeFormat("%Y/%m/%e");

var svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', '0 0 '+chart_width+' '+chart_height)
    .attr('preserveAspectRatio', 'xMidYMid');

var clip = svg.append('defs').append('svg:clipPath')
    .attr('id', 'clip')
    .append('svg:rect')
    .attr('width', chart_width - padding * 3)
    .attr('height', chart_height - padding * 2)
    .attr('x', padding)
    .attr('y', padding);

d3.csv("coin_2019NEW.csv").then(function(data) {

    // change the time format
    data.forEach(function(d) {
        d["Date"] = time_parse(d["Date"]);
    });

    // group data with "Currency"
    var sumstat = d3.nest()
        .key(function(d) {
            return d["Currency"];
        })
        .entries(data);

    // create scales
    // create scales
    var x_scale = d3.scaleTime()
        .domain([d3.min(data, d =>d["Date"]),d3.max(data, d =>d["Date"])])
        .range([padding, chart_width - padding * 2]);
    var y_scale = d3.scaleLinear()
        .domain([d3.min(data, d =>parseFloat(d["Close"])),d3.max(data, d=>parseFloat(d["Close"]))])
        .range([chart_height - padding, padding]);
    var newXScale = x_scale;
    var newYScale = y_scale;

    // create axis
    var x_axis = d3.axisBottom(x_scale);
    var gX = svg.append('g')
        .attr('class', 'x-axis')
        .attr(
            'transform',
            'translate(0,' + (chart_height - padding) + ')'
        )
        .call(x_axis);
    var y_axis = d3.axisLeft(y_scale);
    var gY = svg.append('g')
        .attr('class', 'y-axis')
        .attr(
            'transform',
            'translate(' + padding + ', 0)'
        )
        .call(y_axis);

    // add axis label
    svg.append('text')
        // .attr('class', 'x-label')
        .attr('text-anchor', 'end')
        .attr('x', chart_width - padding * 2)
        .attr('y', chart_height - padding - 10);

    svg.append('text')
        // .attr('class', 'y-label')
        .attr('text-anchor', 'end')
        .attr('x', padding + 10)
        .attr('y', padding);


    // color palette
    var group = sumstat.map(function(d) {
        return d.key;
    });
    var color = d3.scaleOrdinal()
        .domain(group)
        .range(d3.schemeTableau10);

    // draw lines
    var lines = svg.selectAll('.line')
        .data(sumstat)
        .enter()
        .append('path')
        .attr('class', 'line')
        .attr('clip-path', 'url(#clip)')
        .attr('fill', 'none')
        .attr('stroke', function(d) {
            return color(d.key);
        })
        .attr('stroke-width', 1.5)
        .style('opacity', 1.0)
        .attr('d', function(d) {
            return d3.line()
                .x(function(d) {
                    return x_scale(d["Date"]);
                })
                .y(function(d) {
                    return y_scale(d["Close"])
                })
                (d.values);
        })
        /*
        .on('mouseover', function(d) {
            var mouse = d3.mouse(this);
            var x = mouse[0] - 10;
            var y = mouse[1] + 10;

            var currentX = newXScale.invert(mouse[0]);
            var currentY = newYScale.invert(mouse[1]);

            d3.select('#dot')
                .style('display', 'block')
                .attr('transform', 'translate(' + x + ' ' + y + ')');

            d3.select('#tooltip')
                .style('left', x)
                .style('top', y)
                .style('display', 'block')
                .text("value：" + currentY);
        })
        
        .on('mouseout', function() {
            d3.select('#tooltip')
                .style('display', 'none');
            d3.select('#dot')
                .attr('display', 'none');
        });*/



    // add zooming
    var zooming = d3.zoom()
        .scaleExtent([1, 40])
        // .extent([0, 0], [chart_width, chart_height])
        .translateExtent([
            [0, 0],
            [chart_width, chart_height]
        ])
        .on('zoom', function() {
            // console.log(d3.event);

            newXScale = d3.event.transform.rescaleX(x_scale);
            newYScale = d3.event.transform.rescaleY(y_scale);
            gX.call(x_axis.scale(newXScale));
            gY.call(y_axis.scale(newYScale));

            lines.attr("d", function(d) {
                return d3.line()
                    .x(function(d) {
                        return newXScale(d["Date"]);
                    })
                    .y(function(d) {
                        return newYScale(d["Close"])
                    })
                    (d.values);
            });
        });
    svg.call(zooming);

    // add legend
    var legend = svg.selectAll('.legend')
        .data(sumstat)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            return "translate(" + (chart_width - padding * 1.5) + "," + (i * 20 + padding) + ")";
        })
        .on('mouseover', function(d) {
            lines.attr('stroke-width', function(e) {
                    if (d.key === e.key) {
                        return 3;
                    }
                    return 1.5;
                })
                .attr('stroke-opacity', function(e) {
                    if (d.key === e.key) {
                        return 1;
                    }
                    return 0.15;
                })
        })
        .on('mouseout', function(d) {
            lines.attr('stroke-width', function(e) {
                    return 1.5;
                })
                .attr('stroke-opacity', function(e) {
                    return 1;
                })
        });
    legend.append('text').text(function(d) { return d.key; })
        .attr('transform', 'translate(15,9)');
    legend.append('rect')
        .attr('fill', function(d, i) { return color(d.key); })
        .attr('width', 10)
        .attr('height', 10);
});