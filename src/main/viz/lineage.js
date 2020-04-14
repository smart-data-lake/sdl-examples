console.log("starting d3", d3);

const rootElement = d3.select("#sdl-lineage")

// logical dimensions of svg viewbox
const viewWidth = 800;
const viewHeight = 600;
const margin = 10;
const spaceBetweenEdges = 6;
const width = viewWidth - 2*margin;
const height = viewHeight - 3*margin; // +1 margin for layer text

// append the svg object to the body of the page
var svg = rootElement
  .append("svg")
  // Responsive SVG needs these 2 attributes and no width and height attr.
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", 0+" "+0+" "+viewWidth+" "+viewHeight)
  // Class to make it responsive.
  .classed("svg-content-responsive", true)
var sankeyChart = svg
  .append("g")
  .attr("transform", "translate("+margin+" "+2*margin+")")

// define data
Promise.all([
  d3.csv("../../../target/metadata-data-objects.csv/data-objects.csv"),
  d3.csv("../../../target/metadata-actions.csv/actions.csv"),
  d3.json("layerConf.json")
]).then(function(datas) {
  // prepare nodes
  var dataObjects = datas[0];
  var nodes = dataObjects.map( dataObject => ({name: dataObject.id, layerName: dataObject.layer, dataObject: dataObject}))
  // prepare edges
  var actions = datas[1];
  var edges = actions
    // inputs outputs
    .flatMap( action => action.inputid.split(",").map( input => ({action, input})))
    // explode outputs
    .flatMap( edgePrep => edgePrep.action.outputid.split(",").map( output => ({source: edgePrep.input, target: output, value: 1, action: edgePrep.action})))
  // read layer configuration
  var layers = datas[2];
  createLineage(nodes,edges,layers)
})

/*
// a synthetic example
const edges = [
 {source: "A", target: "B", value: 1, state: "failed" },
 {source: "B", target: "C", value: 1, state: "running" },
 {source: "A", target: "B", value: 1 },
 {source: "B", target: "D", value: 1 },
 {source: "C", target: "D", value: 1 },
 {source: "A", target: "D", value: 1 },
 {source: "A1", target: "A", value: 1, state: "succeeded" },
 {source: "A1", target: "D", value: 1 },
]
const nodes = [
 {name: "A", layerName: "stg"},
 {name: "A1", layerName: "stg"},
 {name: "B", layerName: "int"},
 {name: "C", layerName: "int"},
 {name: "D", layerName: "btl"},
]
const layers = {
 stg: {color: "#8E44AD"},
 int: {color: "#2471A3"},
 btl: {color: "#5DADE2"},
}
createLineage(nodes,edges,layers)
*/

function createLineage(nodes, edges, layers) {
  // add layer config to nodes
  nodes.forEach( function(n) {
    if (n.layerName && layers[n.layerName]) n.layerDef = layers[n.layerName];
  });
  // add missing nodes
  const nodeByName = new Map(nodes.map( n => [n.name, n]));
  edges.forEach( edge => {
    if (!nodeByName.has(edge.source)) nodeByName.set(edge.source, {name: edge.source});
    if (!nodeByName.has(edge.target)) nodeByName.set(edge.target, {name: edge.target});
  });
  // sort nodes
  var sortedNodes = _.sortBy(Array.from(nodeByName.values()), n => n.layerDef ? n.layerDef.prio : null)
  const data = {nodes: sortedNodes, links: edges};
  console.log("data", data);

  // init sankey generator
  function nodeSorter(n1, n2) {
    var sorter = n1.subgraph - n2.subgraph; // smaller subgraph first
    if (sorter == 0) sorter = n1.nextLayerPrio - n2.nextLayerPrio; // smaller prio first
    if (sorter == 0) sorter = n2.maxEndDepth - n1.maxEndDepth; // larger end depth first
    if (sorter == 0) sorter = n2.minEndDepth - n1.minEndDepth; // larger end depth first
    // TODO: position of node on previous layer could be interesting to refine order on this layer...
    return sorter;
  }
  var sankey = Sankey()
    .nodeId(d => d.name)
    .nodeAlign(d => d.depth)
    .nodeSort(nodeSorter)
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height])
    .iterations(10);

  // generate layout
  var layout = sankey(data);
  console.log("layout", layout);

  // nodes
  var nodePlane = sankeyChart
    .append("g")
    .attr("font-family", "arial")
    .attr("font-size", 10);
  var node = nodePlane
    .selectAll(".node")
    .data(layout.nodes)
    .join("g")
      .attr("class", "node")
      .classed("dummyNode", d => d.dummy)
      .attr("transform", d => "translate(" + d.x0 + "," + (d.dummy ? d.y0 + spaceBetweenEdges/2 : d.y0) + ")");
  node.append("rect")
      .attr("height", d => d.dummy ? Math.max(1, d.y1 - d.y0 - spaceBetweenEdges) : d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("opacity", d => d.dummy ? 0.5 : null)
      .attr("fill", d => d.dummy ? "#aaa" :
                         d.layerName ? layers[d.layerName].color : "#666")
      //.style("stroke", d => d.layerName ? "#000" : null);
  node.filter(d => !d.dummy).append("title")
      .text(d => `${d.name}\n${d3.format(",.0f")(d.value)}`);
  // node name
  node.filter(d => !d.dummy).append("text")
      .attr("class", "nodeName")
      .attr("x", d => d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6)
      .attr("y", d => (d.y1 - d.y0) / 2)
      .attr("dy", 5)
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name);

  // edges
  var edgePlane = sankeyChart
    .append("g")
  var edge = edgePlane
    .selectAll(".edge")
    .data(layout.links)
    .join("path")
      .attr("class", "edge")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.5)
      .attr("d", sankeyLinkHorizontal())
      .style("stroke", d => d.state=="failed" ? "red" :
                            d.state=="succeeded" ? "green" :
                            d.state=="skipped" ? "#888" : "#aaa")
      .style("stroke-width", d => Math.max(1, d.width - spaceBetweenEdges))
  edge.append("title")
      .text(d => `${d.source.name} → ${d.target.name}\n${d3.format(",.0f")(d.value)}`);
  var edgeRunning = edgePlane
    .selectAll(".edgeRunning")
    .data(layout.links.filter( l => l.state && l.state == "running"))
    .join("path")
      .attr("class", "edgeRunning")
      .attr("fill", "none")
      .attr("d", sankeyLinkHorizontal())
      .style("stroke", "#666")
      .style("stroke-width", d => Math.max(1, d.width / 5))
      .style("stroke-dasharray", "10, 10");
  edgeRunning.append("title")
      .text(d => `${d.source.name} → ${d.target.name}\n${d3.format(",.0f")(d.value)}`);

  // layer box
  var nodesByLayer = _.groupBy(data.nodes.filter( n => n.layerName), n => n.layerName)
  var layerBoxDef = _.toPairs(nodesByLayer).map(([name,nodes]) => ({name, x0: d3.min(nodes.map(n => n.x0))-margin, x1: d3.max(nodes.map(n => n.x1))+margin}));
  var layerBoxPlane = sankeyChart
    .append("g")
  var layerBox = layerBoxPlane
    .selectAll(".layerBox")
    .data(layerBoxDef)
    .join("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + d.x0 + "," + -2*margin + ")")
      .attr("font-family", "arial")
      .attr("font-size", 10);
  layerBox.append("rect")
      .attr("height", viewHeight)
      .attr("width", d => d.x1 - d.x0)
      .attr("opacity", 0.3)
      .attr("fill", d => layers[d.name].color)
  // layer name
  layerBox.append("text")
      .attr("class", ".layerName")
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", d => margin)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text(d => d.name);

  // drag nodes
  var posX, deltaY, nodeHeight;
  node.call(d3.drag()
    .on("start", function(d) {
      posX = d.x0;
      deltaY = d.y0 - d3.event.y;
      nodeHeight = d.y1 - d.y0;
      d3.select(this).raise().classed("dragging", true);
      showNodeLineage(d); // show node lineage on drag
    })
    .on("drag", function (d) {
      d.y0 = Math.max(0, Math.min(height - (d.y1 - d.y0), d3.event.y + deltaY));
      d.y1 = d.y0 + nodeHeight;
      d3.select(this)
        .attr("transform", d => "translate(" + d.x0 + "," + (d.dummy ? d.y0 + spaceBetweenEdges/2 : d.y0) + ")");
      sankey.update(layout);
      edge.attr("d", sankeyLinkHorizontal());
      edgeRunning.attr("d", sankeyLinkHorizontal());
    })
    .on("end", function () {
      d3.select(this).classed("dragging", false);
      resetNodeLineage();
    })
  );

  // Node Lineage
  // see also https://bl.ocks.org/tomshanley/abcd8a1e2876c41079a2d36332e77865
  function showNodeLineage(node) {
    iterateLinkedLinksRight(node); //Recurse source direction
      iterateLinkedLinksLeft(node); //Recurse target direction
  }
  function resetNodeLineage(node) {
      edge.style("stroke", d => d.color ? d.color : "#aaa")
  }
  //Select links that have a given source name
  function iterateLinkedLinksRight(pStartNode) {
      edge.filter((pLinkedLink,i) => pLinkedLink.source.name == pStartNode.name)
      .style("stroke","LightCoral")
      .each(iterateLinkedNodesRight);
  }
  //Select nodes that have a given source name
  function iterateLinkedNodesRight(pStartLink) {
      node.filter((pLinkedNode,i) => pLinkedNode.name == pStartLink.target.name)
      .each(iterateLinkedLinksRight);
  }
  //Select links that have a given source name
  function iterateLinkedLinksLeft(pStartNode) {
      edge.filter((pLinkedLink,i) => pLinkedLink.target.name == pStartNode.name)
      .style("stroke","LightCoral")
      .each(iterateLinkedNodesLeft);
  }
  //Select nodes that have a given source name
  function iterateLinkedNodesLeft(pStartLink) {
      node.filter((pLinkedNode,i) => pLinkedNode.name == pStartLink.source.name)
      .each(iterateLinkedLinksLeft);
  }

  // animate running edges
  let duration = 5
  let maxOffset = 10;
  let percentageOffset = 1;
  var animateDash = setInterval(updateDash, duration);
  function updateDash() {
    edgeRunning.style("stroke-dashoffset", percentageOffset * maxOffset)
    percentageOffset = percentageOffset == 0 ? 1 : percentageOffset - 0.01
  }

  // display  order
  edgePlane.raise();
  nodePlane.raise();

  console.log("lineage created")
}