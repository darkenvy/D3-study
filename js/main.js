var daysAtOnce = 18;

var margin = {top: 20, right: 40, bottom: 30, left: 20},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barWidth = Math.floor(width / 19) - 1;

var x = d3.scale.linear().range([barWidth / 2, width - barWidth / 2]),
    y = d3.scale.linear().range([height, 0]);

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("right")
  .tickSize(-width)
  .tickFormat(function(d) {console.log(d); return Math.round(d / 1000) + "k"; });

// An SVG element with a bottom-right origin.
var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// A sliding container to hold the bars by birthyear.
var allDays = svg.append("g")
  .attr("class", "allDays");








// -------------------- GET JSON ----------------------- //

d3.json("data.json", function(error, dataset) {
  if (error) return console.log(error);

  // ------------------ DATA CLEAN --------------------- //
  
  // Find metaData from this dataset
  // This includes maximum of the chart & min/max dates
  var metaData = (function() {
    var users = d3.max(dataset, function(d) {return d.users}),
        searches = d3.max(dataset, function(d) {return d.searches}),
        max = users > searches ? users : searches,
        early = 2147483647000; // maximum epoch in ms
        late = -1, // impossible minimum epoch
    
    // Set early and late equal to the maximum & minimum dates
    dataset.forEach(function(d) {
      var dateInQuestion = new Date(d.date).valueOf();
      if (dateInQuestion < early) {early = dateInQuestion}
      if (dateInQuestion > late) {late = dateInQuestion}
    });
    return {maxValue: max, earliest: early, latest: late}
  })();

  // clean the data structure
  var cData = [];
  dataset.forEach(function(item) {
    var j = {};
    j.data = [item.users, item.searches];
    j.time = new Date(item.date).valueOf();
    cData.push(j)
  });
  
  // sort data from newest -> oldest
  cData.sort(function(a, b) {if (a.time < b.time) {return -1;} else {return 1;}})
  cData.reverse();


  // Show only the last week on boot
  var data = cData.splice(0, daysAtOnce);

  // Update the scale domains.
  x.domain([1920, 2000]);
  y.domain([0, d3.max(data, function(d) {return d.data[0] > d.data[1] ? d.data[0] : d.data[1]; })]);
  
  // ----------------------------------------------------- //



  // -------------------- DECORATE ----------------------- //

  // Add an axis to show the population values.
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(yAxis)
    .selectAll("g")
    .filter(function(value) { return !value; })
    .classed("zero", true);

    // Add labels to show age (separate; not animated).
  // svg.selectAll(".age")
  //   .data(d3.range(0, metaData.maxValue, 5))
  //   .enter().append("text")
  //   .attr("class", "age")
  //   .attr("x", function(n) { return x(metaData.maxValue - n); })
  //   .attr("y", height + 4)
  //   .attr("dy", ".71em")
  //   .text(function(age) { return age; });



  // ----------------- PRIMARY DRAWING ------------------- //

  var day = allDays.selectAll('.days')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'days')
    .attr('transform', function(d, i) { return "translate(" + (40+(i*48)) + ",0)"; })
    
  day.selectAll('.days')
    .data(function(d) {return d.data})
    .enter()
    .append('rect')
    .attr("x", -barWidth / 2)
    .attr("width", barWidth)
    .attr("height", function(j, i) {return (j/metaData.maxValue)*450})
    .attr("y", function(j, i) {return 450-((j/metaData.maxValue)*450)})
    .text('test')
});
