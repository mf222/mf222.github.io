/* global d3 */

const CENTER_LAT = -70.5993;
const CENTER_LNG = -33.4489;
const ZOOM = 39500;

let width = 650,
  height = 650,
  centered;

const barWidth = 120;
const barHeight = 120;

const barMargin = { top: 20, right: 0, bottom: 10, left: 30 };
const barW = barWidth - barMargin.left - barMargin.right;
const barH = barHeight - barMargin.top - barMargin.bottom;

const color = d3.scale.linear()
  .domain([1, 20])
  .clamp(true)
  .range(['#fff', '#409A99']);

const projection = d3.geo.mercator()
  .scale(ZOOM)
  .center([CENTER_LAT, CENTER_LNG])
  .translate([width / 2, height / 2]);

const path = d3.geo.path()
  .projection(projection);

  // Set the barchart scales
var xScale = d3.scale.ordinal().rangeRoundBands([0, barW], .3);
var yScale = d3.scale.linear().range([barH, 0]);
var barColor = d3.scale.ordinal().range(['#9a406e', '#409A99', 'red', 'yellow', 'green']);

// define the barchart axis
const xAxis = d3.svg.axis()
  .scale(xScale)
  .orient('bottom');

const yAxis = d3.svg.axis()
  .scale(yScale)
  .orient('left')
  .ticks(7);

const svg = d3.select('#map')
  .attr('width', width)
  .attr('height', height);

svg.append('rect')
  .attr('class', 'background')
  .attr('width', width)
  .attr('height', height)
  .on('click', clicked);

const g = svg.append('g');

const effectLayer = g.append('g')
  .classed('effect-layer', true);

const mapLayer = g.append('g')
  .classed('map-layer', true);

const bigText = g.append('text')
  .classed('big-text', true)
  .attr('x', 20)
  .attr('y', 45);

d3.json('./../data/conurbacion.geojson', (error, mapData) => {
  const geo = mapData.features;
  color.domain([0, d3.max(geo, nameLength)]);

  // Draw each province as a path
  mapLayer.selectAll('path')
    .data(geo)
    .enter().append('path')
    .attr('d', path)
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('data-province', nameFn)
    .style('fill', fillFn)
    .on('mouseover', mouseover)
    .on('mouseout', mouseout)
    .on('click', clicked);

  createBarchartOverData('./../comunas_dist.json', geo);
  document.getElementById('allow-filter').addEventListener('input', function (evt) {
    document.getElementById('year-filter').disabled = !document.getElementById('allow-filter').checked;
    clearGrid();
    if (!document.getElementById('allow-filter').checked) {
      createBarchartOverData('./../comunas_dist.json', geo);
    } else {
      createBarchartOverData(`./../comunas_dist_${document.getElementById('year-filter').value}.json`, geo);
    }
  });
  document.getElementById('year-filter').addEventListener('input', function(ev) {
    clearGrid();
    const yearSelected = document.getElementById('year-filter').value;
    createBarchartOverData(`./../comunas_dist_${yearSelected}.json`, geo);
  });
});

function clearGrid() {
  const grid = document.getElementById('grid');
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
}

function splitTopic(topics) {
  splitted = new Array()
  topics.forEach(function(item) {
    splitted.push([item[0].split('_')[1], item[1]])
  })
  return splitted
}
// Create barchart
function createBarchart(wrapper, data) {
  const provinceName = data[0];
  const topics = splitTopic(Object.entries(data[1]))
  // scale the range of the data
  xScale.domain(topics.map(function(d) { return d[0]; }));
  yScale.domain([0, d3.max(topics, function(d) { return d[1] }) * 1.1]);
  barColor.domain(topics.map(function(d) { return d[0]; }));

  const svgContent = wrapper.append('svg')
    .attr({ width: barWidth + barMargin.left + barMargin.right,
      height: barHeight + barMargin.top + barMargin.bottom })
    .append('g')
    .attr('class', provinceName)
    .attr('transform',
      `translate(${barMargin.left},${barMargin.top})`);

  svgContent.selectAll('bar')
    .data(topics)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', function(d) { return xScale(d[0]); })
    .attr('width', xScale.rangeBand())
    .attr('y', function(d) { return yScale(d[1]); })
    .attr('height', function(d) { return barH - yScale(d[1]); })
    .style('fill', 'blue');

  svgContent.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${barH})`)
    .call(xAxis)
    .selectAll('text')
    .style('text-anchor', 'middle')

  svgContent.append('g')
    .attr('class', 'y axis')
    .call(yAxis.tickFormat(d3.format(".1f")));

  svgContent.append('text')
    .attr('x', (barW / 2))
    .attr('y', 0 - (barMargin.top / 2))
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .text(provinceName);
}

function createBarchartOverData(data_path, geo) {
  const gridData = getGridData(geo);
  const gridWrapper = d3.select("#grid");
  d3.json(data_path, (error2, data) => {
    Object.entries(data).forEach((value) => {
      const wrapper = gridWrapper.append('div')
        .style({
          width: `${barWidth + barMargin.left + barMargin.right}px`,
          height: `${barHeight + barMargin.top + barMargin.bottom}px`,
        });
      createBarchart(wrapper, value);
    });
  });
  const row = gridWrapper.selectAll('.row')
  .data(gridData)
  .enter()
  .append('g')
  .attr('class', 'row');

  const column = row.selectAll('.square')
    .data(function (d) { return d; })
    .enter().append('rect')
    .attr('class', 'square')
    .attr('x', function (d) { return d.x; })
    .attr('y', function (d) { return d.y; })
    .attr('width', function (d) { return d.width; })
    .attr('height', function (d) { return d.height; })
    .attr('data-province', function (d) { return d.name; })
    .style('fill', '#fff')
    .style('stroke', '#222');
}

// Get province name
function nameFn(d) {
  return d && d.properties ? d.properties.NOM_COM : null;
}

// Get province name length
function nameLength(d) {
  const n = nameFn(d);

  return n ? n.length : 0;
}

// Get province color
function fillFn(d) {
  return color(nameLength(d));
}

function clicked(d) {
  var x, y, k;

  // Compute centroid of the selected path
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  // Highlight the clicked province
  mapLayer.selectAll('path')
    .style('fill', function (d) {
      const provinceName = nameFn(d);
      if (centered && d === centered)  {
        // d3.selectAll('.' + provinceName)[0].style.fill = '#D5708B'
        // d3.selectAll('rect')[0].find(a => a.dataset.province == provinceName).style.fill = '#D5708B';
        d3.select('g.' + provinceName.replace(' ', '.')).selectAll('rect').style('fill', '#D5708B');
        return '#D5708B';
      } else {
        // d3.selectAll('.' + provinceName)[0].style.fill = 'white'
        // d3.selectAll('rect')[0].find(a => a.dataset.province == provinceName).style.fill = 'white';
        d3.select('g.' + provinceName.replace(' ', '.')).selectAll('rect').style('fill', 'blue');
        return fillFn(d);
      }
    });
}

function mouseover(d) {
  // Highlight hovered province
  const provinceName = nameFn(d);
  d3.select(this).style('fill', 'orange');
  bigText.text(provinceName);
  barchart = d3.select('g.' + provinceName.replace(' ', '.')).selectAll('rect').style('fill', 'orange')
}

function mouseout(d) {
  // Reset province color
  mapLayer.selectAll('path')
    .style('fill', function (d) {
      const provinceName = nameFn(d);
      if (centered && d === centered)  {
        d3.select('g.' + provinceName.replace(' ', '.')).selectAll('rect').style('fill', '#D5708B');
        return '#D5708B';
      } else {
        d3.select('g.' + provinceName.replace(' ', '.')).selectAll('rect').style('fill', 'blue');
        return fillFn(d);
      }
    });

  // Remove effect text
  effectLayer.selectAll('text').transition()
    .style('opacity', 0)
    .remove();

  // Clear province name
  bigText.text('');
}

function getGridData(features) {
  var data = new Array();
  var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
  var ypos = 1;
  var width = 200;
  var height = 100;
  var provincePos = 0;
  // iterate for rows
  for (var row = 0; row < 5; row++) {
    data.push(new Array());

    // iterate for cells/columns inside rows
    for (var column = 0; column < 7; column++) {
      let provinceName = features[provincePos].properties.NOM_COM;

      data[row].push({
        x: xpos,
        y: ypos,
        width: width,
        height: height,
        name: provinceName
      })
      // increment the x position. I.e. move it over by (width variable)
      xpos += width;
      provincePos += 1;
    }
    // reset the x position after a row is complete
    xpos = 1;
    // increment the y position for the next row. Move it down by (height variable)
    ypos += height;
  }
  return data;
}

// var provincesNames = new Array();
// d3.json('./../data/santiago_full.geojson', function (error, mapData) {
//   provincesNames = mapData.features.map(f => f.properties.NOM_COM);
//   console.log(provincesNames);

//   d3.json("./../example_data.json", function (error2, data) {
//     for (var key in data) {
//       if (provincesNames.includes(key)) {
//         console.log(key);
//         const topics = data[key];
//         var text = '';
//         for (var topic in topics) {
//           console.log(topic + " -> " + topics[topic]);
//           text += topic + " -> " + topics[topic] + " || ";
//         }

//         const gridSquareElement = d3.selectAll('rect.square')[0].find(a => a.dataset.province == key);
//         d3.select("#grid svg")
//           .append("text")
//           .attr('x', gridSquareElement.x.baseVal.value)
//           .attr('width', 50)
//           .attr('y', gridSquareElement.y.baseVal.value + 20)
//           .html(text)
//           .style('position', 'relative');
//         console.log(gridSquareElement.x.baseVal.value);
//       }
//     }
//   });
// });

