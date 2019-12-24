var cloud_width = 1300,
    cloud_height = 800;

var time_parse = d3.timeParse("%Y-%m-%d"); //convert string to date

var colorscale_positive;
var colorscale_negative;
var fontsizescale_positive;
var fontsizescale_negative;

var all_words_weights = new Array();
var all_words = new Array();
var all_weights = new Array();


//read weight
d3.csv('word_value.csv').then(function(data) {

    data.forEach(function(d) {
        d["value"] = parseInt(d["value"]);
        all_words_weights.push([d["word"], d["value"]])
    });

    //sort all_words_weights
    all_words_weights = all_words_weights.sort(function(a, b) {
        return Math.abs(a[1]) > Math.abs(b[1]) ? 1 : -1
    });
    
    max_weight = min_weight = 0;
    for (i in all_words_weights) {
        if(all_words_weights[i][1]>max_weight){
            max_weight=all_words_weights[i][1]
        };
        if(all_words_weights[i][1]<min_weight){
            min_weight=all_words_weights[i][1]
        };
        all_words.push(all_words_weights[i][0])
        all_weights.push(all_words_weights[i][1])
    };

    colorscale_positive = d3.scaleLinear().domain([0, max_weight]).range(["#ffffff", "#ff0000"])
    colorscale_negative = d3.scaleLinear().domain([min_weight, 0]).range(["#0000ff", "#ffffff"])
    fontsizescale_positive = d3.scaleLinear().domain([0, max_weight]).range([10, 150])
    fontsizescale_negative = d3.scaleLinear().domain([min_weight, 0]).range([150, 10])


    //word cloud 
    d3.layout.cloud()
        .size([cloud_width, cloud_height])
        .words(all_words.map(function(d, i) {
            return {
                text: d,
                size: all_weights[i] > 0 ? fontsizescale_positive(all_weights[i]) : fontsizescale_negative(all_weights[i]),
                color: all_weights[i] > 0 ? colorscale_positive(all_weights[i]) : colorscale_negative(all_weights[i])
            };
        }))
        //.padding(5)
        .rotate(function() { return ~~(Math.random() * 2) * 20 - 5; })
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
        .style("fill", function(d, i) { return d.color })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}