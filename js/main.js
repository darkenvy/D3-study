var daysAtOnce = 7;

var margin = {top: 20, right: 40, bottom: 30, left: 20},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barWidth = Math.floor(width / daysAtOnce) - 1;

var x = d3.scale.linear().range([barWidth / 2, width - barWidth / 2]),
    y = d3.scale.linear().range([height, 0]);

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("right")
  .tickSize(-width)
  .tickFormat(function(d) {return Math.round(d / 1000) + "k"; });

// An SVG element with a bottom-right origin.
var svg = d3.select(".graph").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// A sliding container to hold the bars by birthyear.
var allDays = svg.append("g")
  .attr("class", "allDays");






var testData;

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
  svg.selectAll(".labels")
    .data(data)
    // .data(d3.range(0, metaData.maxValue, 5))
    .enter().append("text")
    .attr("class", "date")
    .attr("x", function(n, i) { return (i* barWidth) + 40 })
    // .attr("x", function(n) { return x(metaData.maxValue - n); })
    .attr("y", height + 4)
    .attr("dy", ".71em")
    .text(function(date) {
      return new Date(date.time).getMonth()+1 + "/" +
             new Date(date.time).getDate() + "/" +
             new Date(date.time).getFullYear().toString().slice(2);
    });



  // ----------------- PRIMARY DRAWING ------------------- //

  var day = allDays.selectAll('.days')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'days')
    .attr('transform', function(d, i) { return "translate(" + (40+ (i*barWidth) ) + ",0)"; })
    
  day.selectAll('.days')
    .data(function(d) {return d.data})
    .enter()
    .append('rect')
    .attr("x", -barWidth / 2)
    .attr("width", barWidth-2)
    .attr("height", function(j, i) {return (j/metaData.maxValue)*450})
    .attr("y", function(j, i) {return 450-((j/metaData.maxValue)*450)})




  // Allow the arrow keys to change the displayed year.
  window.focus();
  d3.select(window).on("keydown", function() {
    switch (d3.event.keyCode) {
      case 37: daysAtOnce -= 1; break;
      case 39: daysAtOnce += 1; break;
    }
    update();
  });

  function update() {
    // if (!(year in data)) return;
    // title.text(year);

    // allDays.transition()
    //   .duration(750)
    //   .attr("transform", "translate(" + (x(0) - x(1)) + ",0)");
    data = [];

    data = cData.splice(0, daysAtOnce);
    testData = data
    barWidth = Math.floor(width / daysAtOnce) - 1;
    console.log(data);
    
    // d3.selectAll("rect")
    //   .data(function(d) {console.log(d);return d;})
    //   .attr("width", 20)

    // day = allDays.selectAll('.days')
    //   .data(data)
    //   .enter()
    //   .append('g')
    //   .attr('class', 'days')
    //   .attr('transform', function(d, i) {return "translate(" + (40+ (i*barWidth) ) + ",0)"; })

    // var uDay = d3
    //   .selectAll('.days')
    //   .data(data)

    // uDay.exit().remove()
    // uDay.enter()
    //   .append("rect")
    //   .attr("x", -barWidth / 2)
    //   .attr("width", barWidth-2)
    //   .attr("height", function(j, i) {return 20})
    //   .attr("y", function(j, i) {return 20})
    
    var uDay = d3.selectAll('.allDays')
      .selectAll('.days')
      .data(data)

    uDay.exit().remove()

    uDay.enter()
      .append('g')
      .attr('class', 'days')
      .attr('transform', function(d, i) { return "translate(" + (40+ (i*barWidth) ) + ",0)"; })
      .selectAll('rect')
      .data(function(d) {return d.data})
      .enter()
      .append('rect')
      .attr("x", -barWidth / 2)
      .attr("width", barWidth-2)
      .attr("height", function(j, i) {return (j/metaData.maxValue)*450})
      .attr("y", function(j, i) {return 450-((j/metaData.maxValue)*450)})


    // day.selectAll("rect")
    //   .data(function(d){console.log(d);return d;})
    //   .attr("y", y)
    //   .attr("height", function(value) {console.log("height", value); return 20 });

    // day.selectAll("rect")
    //   .data(function(d) {console.log(d);return d.data; })
    //   .enter()
    //   .append('rect')
    //   .attr("x", -barWidth / 2)
    //   .attr("width", barWidth-2)
    //   .attr("height", function(j, i) {return (j/metaData.maxValue)*450})
    //   .attr("y", function(j, i) {return 450-((j/metaData.maxValue)*450)})
      // .transition()
      // .duration(750)
      // .attr("y", y)
      // .attr("height", function(value) { return height - y(value); });
  }
});
