
var MAPWIDTH = 800,
    MAPHEIGHT = 800;

var margin = {top: 70, right: 40, bottom: 70, left: 40},
width = MAPWIDTH - margin.left - margin.right,
height = MAPHEIGHT - margin.top - margin.bottom;

const getMapParameters = (bounds) => {
    // Adaptado desde http://stackoverflow.com/a/14691788.

    // Obtenemos las coordenadas de ambos puntos: b0 y b1.
    // Estos puntos encuadran este mapa, en una caja.
    var [[b0x, b0y], [b1x, b1y]] = bounds; // (¡ES6!)

    // Luego, utilizamos estos puntos para hallar los parámetros adecuados.
    var scale = 0.95 / Math.max((b1x - b0x) / MAPWIDTH, (b1y - b0y) / MAPHEIGHT);
    var translate = [(MAPWIDTH - scale * (b1x + b0x)) / 2,
              -75 + (MAPHEIGHT - scale * (b1y + b0y)) / 2];
    return [scale, translate];
}

const renderMap = (wrapper, geo, data) => {

    var container = d3.select('.map-container')
    // We will use Mercator projection.
    var projection = d3.geoMercator().scale(1).translate([0, 0]);
    var path = d3.geoPath().projection(projection);

    // Busquemos parámetros apropiados de 'scale' y 'translate'.
    var [s, t] = getMapParameters(path.bounds(json)); // (¡ES6!)

    // Luego, actualicémoslos en la proyección.
    projection.scale(s).translate(t);

    // Hagamos, finalmente, entrar a los datos.
    container.selectAll('path')
    .data(json.features)
    .enter()
    .append('path')
    .on('mouseover', (d, i, e) => createBarChart(d))
    .on('mouseout', (d) => removeBarChart(d))
    .transition()
    .attr('d', path)
}

const visualize = (error, geo, data) => {
    var mapContainer = d3.select('.map-container')
    

}

Promise.all([
    d3.csv('/data/santiago.geojson'),
    d3.text('/data/comunas.txt')
  ])
  .then(([geo, data]) =>  {
      console.log(geo.features)
      console.log(data)
  });