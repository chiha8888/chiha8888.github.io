// Width and height
var chart_width = 1600;
var chart_height = 600;
var cloud_width = 1200;
var cloud_height = 300;
var padding = 60;
var colorscale = d3.scaleLinear().domain([0, 9])
    .range(["#ff0000", "#0000ff"])

var time_parse = d3.timeParse("%Y-%m-%d");
var time_format = d3.timeFormat("%Y/%m/%e");

var svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', '0 0 ' + chart_width + ' ' + chart_height)
    .attr('preserveAspectRatio', 'xMidYMid');

var clip = svg.append('defs').append('svg:clipPath')
    .attr('id', 'clip')
    .append('svg:rect')
    .attr('width', chart_width - padding * 3)
    .attr('height', chart_height - padding * 2)
    .attr('x', padding)
    .attr('y', padding);

var pointing_date = null;
var date_words = new Object();

d3.csv("bitcoin2018_1_to_6.csv").then(function(data) {

    // change the time format
    data.forEach(function(d) {
        d["Date"] = time_parse(d["Date"]);
        d["Close"] = parseFloat(d["Close"])
    });

    // group data with "Currency"
    var sumstat = d3.nest()
        .key(function(d) {
            return 'bitcoin';
        })
        .entries(data);

    // create scales
    var x_scale = d3.scaleTime()
        .domain([d3.min(data, d => d["Date"]), d3.max(data, d => d["Date"])])
        .range([padding, chart_width - padding * 2]);
    var y_scale = d3.scaleLinear()
        .domain([d3.min(data, d => d["Close"]), d3.max(data, d => d["Close"])])
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

        .on('mouseover', function(d) {
            var mouse = d3.mouse(this);
            var currentX = newXScale.invert(mouse[0]);
            var currentY = newYScale.invert(mouse[1]);

            var x = mouse[0] - 10;
            var y = mouse[1] + 10;
            d3.select('#dot')
                .style("opacity", 1)
                .attr('transform', 'translate(' + x + ' ' + y + ')');

            pointing_date = currentX.toString().substr(0, 15);

            //update date div
            d3.select("#date")
            .text(pointing_date.substr(4))

            //update word cloud 
            d3.layout.cloud()
                .size([cloud_width, cloud_height])
                .words(date_words[pointing_date].map(function(d, i) {
                    return { text: d, size: 120 - i * 10 };
                }))
                .padding(5)
                .rotate(function() { return ~~(Math.random()*2)*10-5; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .on("end", draw).start();
        })




    // add zooming
    var zooming = d3.zoom()
        .scaleExtent([1, 40])
        // .extent([0, 0], [chart_width, chart_height])
        .translateExtent([
            [0, 0],
            [chart_width, chart_height]
        ])
        .on('zoom', function() {
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

            d3.select("#dot")
                .style("opacity", 0);
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

d3.csv("day_best10_new01.csv").then(function(data) {

    // change the time format
    data.forEach(function(d) {
        d["date"] = time_parse(d["date"]);

        var words = [d["1st"], d["2nd"], d["3rd"], d["4th"], d["5th"], d["6th"], d["7th"], d["8th"], d["9th"], d["10th"]];
        date_words[d["date"].toString().substr(0, 15)] = words;
    });

});

function draw(words) {
    d3.select("#cloud")
        .attr("width", cloud_width)
        .attr("height", cloud_height)
        .select("g")
        .attr("transform", "translate(" + cloud_width / 2 + "," + cloud_height / 2 + ")")
        .selectAll("text")
        .data(words)
        .join("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return colorscale(i) })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}