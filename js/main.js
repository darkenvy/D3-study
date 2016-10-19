// --------------- Init Variables --------------------- //
var margin = {top: 20, right: 40, bottom: 30, left: 20},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barWidth = Math.floor(width / daysAtOnce) - 1,
    daysAtOnce = 7;

var x = d3.scale.linear().range([barWidth / 2, width - barWidth / 2]),
    y = d3.scale.linear().range([height, 0]);

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("right")
  .tickSize(-width)
  .tickFormat(function(d) {return Math.round(d / 1000) + "k"; });

var svg = d3.select(".graph").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var allDays = svg.append("g").attr("class", "allDays");

// Init date pickers
// Really the only time I use JQ
document.addEventListener("DOMContentLoaded", function() {
  $("#datepicker1").datepicker();
  $("#datepicker2").datepicker();
});

// -------------------- GET JSON ----------------------- //

// var externalUrl = "https://gist.githubusercontent.com/evanjacobs/c150c0375030dc4de65e9b95784dc894/raw/35c5f455b147703db3989df0cb90f5781c3b312f/usage_data.json"
// d3.json(externalUrl, function(error, dataset) {
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
  var data = cData.slice(0, daysAtOnce);

  // Update the scale domains.
  x.domain([1920, 2000]);
  y.domain([0, d3.max(data, function(d) {return d.data[0] > d.data[1] ? d.data[0] : d.data[1]; })]);
  
  // ----------------------------------------------------- //



  // ----------------- Event Functions ------------------- //

  // Run on page load
  // This trims duplicate code
  (function() {
    clearGraph();
    data = cData.slice(0, daysAtOnce);
    barWidth = Math.floor(width / daysAtOnce) - 1;
    update();
  })();

  // Allow the arrow keys to change the displayed year.
  window.focus();
  d3.select(window).on("keydown", function() {
    switch (d3.event.keyCode) {
      case 37: daysAtOnce -= 1; break;
      case 39: daysAtOnce += 1; break;
    }
    clearGraph();
    data = cData.slice(0, daysAtOnce);
    barWidth = Math.floor(width / daysAtOnce) - 1;
    update();
  });

  document.getElementById('lastWeek').addEventListener('click', function() {
    clearGraph();
    daysAtOnce = 7;
    data = cData.slice(0, daysAtOnce);
    barWidth = Math.floor(width / daysAtOnce) - 1;
    update();
  });
  document.getElementById('lastMonth').addEventListener('click', function() {
    clearGraph();
    daysAtOnce = 30;
    data = cData.slice(0, daysAtOnce);
    barWidth = Math.floor(width / daysAtOnce) - 1;
    update();
  });
  document.getElementById('range').addEventListener('click', function() {
    var date1 = new Date(document.getElementById('datepicker1').value).valueOf(),
        date2 = new Date(document.getElementById('datepicker2').value).valueOf();
    
    daysAtOnce = parseInt((date1 - date2) / 1000 / 60 / 60 / 24); // Converts unix time to days
    
    // Find the first and last indicies
    // So we can slice the data accordingly between only those two dates
    var firstIdx = 0,
        lastIdx = 0;
    cData.forEach(function(item, idx) {
      var theDay = parseInt(new Date(item.time).valueOf() / 1000 / 86400);
      if (theDay == parseInt(date1 / 1000 / 86400) ) { firstIdx = idx}
      if (theDay == parseInt(date2 / 1000 / 86400) ) { lastIdx = idx}
    });

    console.log("indicies", firstIdx, lastIdx, "daysAtOnce", daysAtOnce);

    clearGraph();
    data = cData.slice(firstIdx, lastIdx);
    barWidth = Math.floor(width / daysAtOnce) - 1;
    update();
  });


  // --------------- Update Function -------------------- //
  
  function clearGraph() {
    data = [];
    svg.selectAll('.axis')
      .data(d3.range(0,0,0))
      .exit()
      .remove()
    svg.selectAll(".date")
      .data(d3.range(0,0,0))
      .exit()
      .remove()
    d3.selectAll('.allDays')
      .selectAll('.days')
      .data(d3.range(0,0,0))
      .exit()
      .remove()
  }

  function update() {
    // Redraw
    d3.selectAll('.allDays')
      .selectAll('.days')
      .data(data)
      .enter()
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

    // Decorate (labels)
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
        // Pretty print dates
        if (daysAtOnce > 40) {
          return new Date(date.time).getMonth()+1
        } else if (daysAtOnce > 20) {
          return new Date(date.time).getMonth()+1 + "/" +
                 new Date(date.time).getDate();
        } else {
          return new Date(date.time).getMonth()+1 + "/" +
                 new Date(date.time).getDate() + "/" +
                 new Date(date.time).getFullYear().toString().slice(2);
        }
      });
  }
});


// ----------------- Event Listeners ------------------- //

var tooltip = document.querySelectorAll('.tooltip');
document.getElementsByClassName('graph')[0].addEventListener('mousemove', function(e) {
// document.addEventListener('mousemove', function(e) {
  var data1 = e.target.parentNode.childNodes[0].__data__,
      data2 = e.target.parentNode.childNodes[1].__data__
  if (!data1 || !data2) {tooltip[0].hidden = true} // Hide tooltip if details are undefined
  else {tooltip[0].hidden = false} // Show if details exist
  tooltip[0].style.left = e.pageX - 100 + 'px';
  tooltip[0].style.top = e.pageY - 80 + 'px';
  tooltip[0].innerHTML = `
     <b>Users: </b>` + data1 + '<br>' +
    `<b>Searches: </b>` + data2;
});

