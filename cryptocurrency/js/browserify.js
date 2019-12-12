var cloud_width = 1500,
    cloud_height = 900;

var time_parse = d3.timeParse("%Y-%m-%d"); //convert string to date

var colorscale_positive;
var colorscale_negative;
var fontsizescale_positive;
var fontsizescale_negative;

var date_words = new Object();
var date_weights = new Object();
var all_words_weights = new Array();
var all_words = new Array();
var all_weights = new Array();


// read words
d3.csv('day_best10_new01.csv').then(function(data) {
    // change the time format
    data.forEach(function(d) {
        d["date"] = time_parse(d["date"]);

        var words = [d["1st"], d["2nd"], d["3rd"], d["4th"], d["5th"], d["6th"], d["7th"], d["8th"], d["9th"], d["10th"]];
        date_words[d["date"].toString().substr(0, 15)] = words;
    });
});

//read weight
d3.csv('Diff2019_bitcoin.csv').then(function(data) {

    data.forEach(function(d) {
        d["Date"] = time_parse(d["Date"]);
        d["Day_Diff"] = parseInt(d["Day_Diff"]);
        date_weights[d["Date"].toString().substr(0, 15)] = d["Day_Diff"];
    });

    //set all_words_weights
    max_weight = min_weight = 0;
    Object.keys(date_words).map(function(date, i) {
        weight = date_weights[date]
        if (weight > max_weight) {
            max_weight = weight
        }
        if (weight < min_weight) {
            min_weight = weight
        }
        words = date_words[date]
        for (i in words) {
            all_words_weights.push([words[i], weight])
        }
    })
    all_words_weights = all_words_weights.sort(function(a, b) {
        return Math.abs(a[1]) > Math.abs(b[1]) ? 1 : -1
    });
    for (i in all_words_weights) {
        all_words.push(all_words_weights[i][0])
        all_weights.push(all_words_weights[i][1])
    };

    colorscale_positive = d3.scaleLinear().domain([0, max_weight]).range(["#ffffff","#ff0000"])
    colorscale_negative = d3.scaleLinear().domain([min_weight,0]).range(["#0000ff","#ffffff"])
    fontsizescale_positive = d3.scaleLinear().domain([0, max_weight]).range([0, 120])
    fontsizescale_negative = d3.scaleLinear().domain([min_weight,0]).range([120,0])


    //word cloud 
    d3.layout.cloud()
        .size([cloud_width, cloud_height])
        .words(all_words.map(function(d, i) {
            return { text: d, 
                size: all_weights[i] > 0 ? fontsizescale_positive(all_weights[i]) : fontsizescale_negative(all_weights[i]),
                color: all_weights[i] > 0 ? colorscale_positive(all_weights[i]) : colorscale_negative(all_weights[i])
                 };
        }))
        //.padding(5)
        //.rotate(function() { return ~~(Math.random() * 2) * 10 - 5; })
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .on("end", draw).start();

});



function draw(words) {
    d3.select("#cloud")
        .attr("width", cloud_width)
        .attr("height", cloud_height)
        .style('margin', '20px auto 20px')
        .select("g")
        .attr("transform", "translate(" + cloud_width / 2 + "," + cloud_height / 2 + ")")
        .selectAll("text")
        .data(words)
        .join("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return  d.color})
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}