/* eslint-disable no-undef, no-magic-numbers, func-style, prefer-arrow-callback */
/* eslint max-statements: ["error", 100] */
const HEIGHT = 900;
const WIDTH = window.innerWidth * 0.95;

const MAPWIDTH = 800;
const MAPHEIGHT = 800;

const margin = { top: 70, right: 40, bottom: 70, left: 40 };
const width = 500 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

const marginSM = { top: 30, right: 30, bottom: 30, left: 30 };
const widthSM = 400 - margin.left - margin.right;
const heightSM = 200 - margin.left - margin.right;

const FP = 'data/santiago.geojson';
const FP2 = 'data/dow_data/dow-data.json';
const FP3 = 'data/dow_data/sectores_trips.json';

getFilePathsArr = () => {
  fps = [];
  dayOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  dayOfWeek.forEach(dow => {
    fileName = `data/dow_data/total_trips_${dow}.json`;
    fps.push(fileName);
  });

  return fps;
};

const FILEPATHS = getFilePathsArr();
const COLORS = d3.schemeYlOrRd[6];

// Definamos algunos parámetros relacionados con la población.
const MINTRIPS = 100;
const MEDTRIPS = 3500;
const MAXTRIPS = 7000;
const PREFIX = 'https://es.wikipedia.org/wiki/';

d3.select('#d3-header').text('Provincia de Santiago');
d3.selectAll('#dow-container p').remove();

function removeBarChart(datum) {
  d3.select('g.barchart').remove();
  updateMultiples(FP3);
}

function createBarChart(datum) {
  d3.selectAll('g.multiple').remove();
  const name = datum.properties.NAME;
  updateHist(name);
}

function getTripsComuna(datum, dataset) {
  const name = datum.properties.NAME;

  return dataset[name];
}

const body = d3.select('#dow-container');

const container = body.append('svg')
  .attr('width', WIDTH)
  .attr('height', HEIGHT);

const smallMultiples = container.append('g')
  .attr('transform', `translate(${WIDTH - widthSM - 100}, 0)`)
  .attr('class', 'smallcontainer');

const barchartContainer = container.append('g')
  .attr('transform', `translate(${width + 500}, 0)`)
  .attr('class', 'barchartContainer');

function getMapParameters(bounds) {
  const [[b0x, b0y], [b1x, b1y]] = bounds;
  const scale = 0.95 / Math.max((b1x - b0x) / MAPWIDTH, (b1y - b0y) / MAPHEIGHT);
  const translate = [(MAPWIDTH - scale * (b1x + b0x)) / 2, -75 + (MAPHEIGHT - scale * (b1y + b0y)) / 2];

  return [scale, translate];
}

const updateDay = newDataset => {
  d3.json(FP, function (json) {
    d3.json(newDataset, json2 => {
      const colorScale = d3.scaleLinear()
        .domain([MINTRIPS, 1380, 2760, 4140, 5520, MAXTRIPS])
        .range(COLORS);

      // En este caso, usaremos la proyección de Gerardus Mercator.
      const projection = d3.geoMercator().scale(1).translate([0, 0]);
      const path = d3.geoPath().projection(projection);

      // Busquemos parámetros apropiados de 'scale' y 'translate'.
      const [s, t] = getMapParameters(path.bounds(json)); // (¡ES6!)

      // Luego, actualicémoslos en la proyección.
      projection.scale(s).translate(t);
      container.selectAll('path').remove().exit()

      // Hagamos, finalmente, entrar a los datos.
      container.selectAll('path')
        .data(json.features)
        .enter()
        .append('path')
        .on('mouseover', (d, i, e) => createBarChart(d))
        .on('mouseout', (d) => removeBarChart(d))
        .transition()
        .attr('d', path)
        .attr('fill', datum => colorScale(getTripsComuna(datum, json2)));
    });
  });
};

const updateHist = nameComuna => {
  const barchart = barchartContainer.append('g')
    .attr('class', 'barchart')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.json(FP2, data => {
    const dowData = [];
    const dows = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dows.forEach(dow => {
      dowData.push({
        'dow': dow.charAt(0).toUpperCase() + dow.slice(1),
        'trips': data[dow][nameComuna],
      });
    });

    const dowFormated = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    const xBarChart = d3.scaleBand().rangeRound([0, width])
      .domain(dowFormated)
      .padding(0.1);
    const yBarChart = d3.scaleLinear().range([height, 0])
      .domain([0, d3.max(dowData, d => { return +d.trips; })]);

    barchart.selectAll('.bar')
      .data(dowData).enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => { return xBarChart(d.dow); })
      .attr('y', d => { return yBarChart(d.trips); })
      .attr('width', xBarChart.bandwidth() - 10)
      .attr('height', d => { return height - yBarChart(d.trips); })
      .attr('fill', '#fd8d3c');

    barchart.append('g')
      .attr('class', 'barchart axis axis--x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xBarChart));

    barchart.append('g')
      .attr('class', 'barchart axis axis--y')
      .call(d3.axisLeft(yBarChart))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('Frequency');

    d3.select('g.barchart')
      .append('text')
      .attr('class', 'barchart title')
      .attr('y', margin.top - 80)
      .attr('x', (width / 2) - margin.left)
      .text(nameComuna);
  });
};

const updateMultiples = (filepath) => {
  const dowFormated = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

  const marginItemSM = { top: 10, right: 10, bottom: 10, left: 10 };
  const widthItemSM = 350 - marginItemSM.left - marginItemSM.right;
  const heightItemSM = 110 - marginItemSM.left - marginItemSM.right;

  d3.json(filepath, data => {
    const sectoresNames = Object.keys(data);
    const trips = Object.keys(data).map(sector => data[sector]);
    const maxTrips = d3.max(trips.map(sector => Object.values(sector)), array => d3.max(array));

    // Creo un grafico por cada sector
    sectoresNames.forEach((sector, i) => {
      const dowData = [];
      const dows = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      dows.forEach(dow => {
        dowData.push({
          'dow': dow.charAt(0).toUpperCase() + dow.slice(1),
          'trips': data[sector][dow],
        });
      });

      const grafico = smallMultiples.append('g')
        .attr('class', `multiple item ${sector}`)
        .attr('transform', `translate(${marginItemSM.left}, ${i * 130 + marginItemSM.top})`);

      const xScale = d3.scaleBand().rangeRound([0, widthItemSM])
        .domain(dowFormated)
        .padding(0.1);
      const yScale = d3.scaleLinear().range([heightItemSM, 0])
        .domain([0, maxTrips]);

      const area = d3.area()
        .x(d => xScale(d.dow))
        .y1(d => yScale(+d.trips));

      area.y0(yScale(0));

      grafico.append('path')
        .datum(dowData)
        .attr('fill', '#fd8d3c')
        .attr('d', area);

      grafico.append('g')
        .attr('transform', `translate(0,${heightItemSM})`)
        .call(d3.axisBottom(xScale));

      grafico.append('g')
        .call(d3.axisLeft(yScale).ticks(5, 's'))
        .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end');

      grafico.append('text')
        .attr('class', 'multiple title')
        .attr('y', marginItemSM.top - 10)
        .attr('x', (widthItemSM / 2) - 30)
        .text(sector.charAt(0).toUpperCase() + sector.slice(1));
    });
  });
};

updateDay(FILEPATHS[0]);
updateMultiples(FP3);

d3.select('#dow-selector').on('change', () => {
  const basePath = 'data/dow_data/';
  const dow = { '0': 'lunes', '1': 'martes', '2': 'miercoles', '3': 'jueves',
    '4': 'viernes', '5': 'sabado', '6': 'domingo' };
  const dataset = `${basePath}total_trips_${dow[d3.select('#dow-selector').property('value')]}.json`;

  updateDay(dataset);
});

