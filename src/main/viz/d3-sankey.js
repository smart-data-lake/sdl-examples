/*
Copyright 2015, Mike Bostock
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// replacement of imports
var max = d3.max;
var min = d3.min;
var sum = d3.sum;

function ascendingSourceBreadth(a, b) {
  return ascendingBreadth(a.source, b.source) || a.index - b.index;
}

function ascendingTargetBreadth(a, b) {
  return ascendingBreadth(a.target, b.target) || a.index - b.index;
}

function ascendingBreadth(a, b) {
  return a.y0 - b.y0;
}

function value(d) {
  return d.value;
}

function defaultId(d) {
  return d.index;
}

function defaultNodes(graph) {
  return graph.nodes;
}

function defaultLinks(graph) {
  return graph.links;
}

function find(nodeById, id) {
  const node = nodeById.get(id);
  if (!node) throw new Error("missing: " + id);
  return node;
}

function computeLinkBreadths({nodes}) {
  for (const node of nodes) {
    let y0 = node.y0;
    let y1 = y0;
    for (const link of node.sourceLinks) {
      link.y0 = y0 + link.width / 2;
      y0 += link.width;
    }
    for (const link of node.targetLinks) {
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
}

function Sankey() {
  let x0 = 0, y0 = 0, x1 = 1, y1 = 1; // extent
  let dx = 24; // nodeWidth
  let dy = 8, py; // nodePadding
  let id = defaultId;
  let align = justify;
  let sort;
  let linkSort;
  let nodes = defaultNodes;
  let links = defaultLinks;
  let iterations = 6;

  function sankey() {
    const graph = {nodes: nodes.apply(null, arguments), links: links.apply(null, arguments)};
    computeNodeLinks(graph);
    computeNodeValues(graph);
    computeNodeDepths(graph);
    computeNodeHeights(graph);
    computeNodeBreadths(graph);
    computeLinkBreadths(graph);
    return graph;
  }

  sankey.update = function(graph) {
    computeLinkBreadths(graph);
    return graph;
  };

  sankey.nodeId = function(_) {
    return arguments.length ? (id = typeof _ === "function" ? _ : constant(_), sankey) : id;
  };

  sankey.nodeAlign = function(_) {
    return arguments.length ? (align = typeof _ === "function" ? _ : constant(_), sankey) : align;
  };

  sankey.nodeSort = function(_) {
    return arguments.length ? (sort = _, sankey) : sort;
  };

  sankey.nodeWidth = function(_) {
    return arguments.length ? (dx = +_, sankey) : dx;
  };

  sankey.nodePadding = function(_) {
    return arguments.length ? (dy = py = +_, sankey) : dy;
  };

  sankey.nodes = function(_) {
    return arguments.length ? (nodes = typeof _ === "function" ? _ : constant(_), sankey) : nodes;
  };

  sankey.links = function(_) {
    return arguments.length ? (links = typeof _ === "function" ? _ : constant(_), sankey) : links;
  };

  sankey.linkSort = function(_) {
    return arguments.length ? (linkSort = _, sankey) : linkSort;
  };

  sankey.size = function(_) {
    return arguments.length ? (x0 = y0 = 0, x1 = +_[0], y1 = +_[1], sankey) : [x1 - x0, y1 - y0];
  };

  sankey.extent = function(_) {
    return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], sankey) : [[x0, y0], [x1, y1]];
  };

  sankey.iterations = function(_) {
    return arguments.length ? (iterations = +_, sankey) : iterations;
  };

  function computeNodeLinks({nodes, links}) {
    for (const [i, node] of nodes.entries()) {
      node.index = i;
      node.sourceLinks = [];
      node.targetLinks = [];
    }
    const nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d]));
    for (const [i, link] of links.entries()) {
      link.index = i;
      let {source, target} = link;
      if (typeof source !== "object") source = link.source = find(nodeById, source);
      if (typeof target !== "object") target = link.target = find(nodeById, target);
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    }
    if (linkSort != null) {
      for (const {sourceLinks, targetLinks} of nodes) {
        sourceLinks.sort(linkSort);
        targetLinks.sort(linkSort);
      }
    }
  }

  function computeNodeValues({nodes}) {
    for (const node of nodes) {
      node.value = node.fixedValue === undefined
          ? Math.max(Math.max(sum(node.sourceLinks, value), sum(node.targetLinks, value)),1)
          : node.fixedValue;
    }
  }

  /** CHANGE: replaced with function respecting defined data layers and processes unconnected subgraphs separately **/
  /*
  function computeNodeDepths({nodes}) {
    const n = nodes.length;
    let current = new Set(nodes);
    let next = new Set;
    let x = 0;
    while (current.size) {
      for (const node of current) {
        node.depth = x;
        for (const {target} of node.sourceLinks) {
          next.add(target);
        }
      }
      if (++x > n) throw new Error("circular link");
      current = next;
      next = new Set;
    }
  }*/
  var dummyNodes = []; // holds a list of additional nodes
  var dummyLinks = []; // holds a list of pairs of additional link and optional link to replace (we cannot remove from an array...)
  function computeSubgraphNodeDepths(nodes) {
    nodes.forEach( n => n.incoming = new Set(n.targetLinks.map(l => l.source))); // init incoming links, it's used to do a dependency aware traversal of the graph
    var currentDepth = 0;
    var layersDef = {};
    function getNextNodes(nodes, filterFunc) {
      var nextNodes = new Set();
      // filter next nodes
      var filteredNodes = Array.from(nodes).filter(n => !n.incoming.size && filterFunc(n));
      // start only one new layer at the time, order according to prio
      var sortedNodes = _.sortBy(filteredNodes, n => n.layerDef ? n.layerDef.prio : -1);
      var firstLayerName;
      sortedNodes.forEach( n => {
        if (!firstLayerName || n.layerName == firstLayerName) {
          nextNodes.add(n);
          nodes.delete(n);
          if (!firstLayerName && n.layerName) firstLayerName = n.layerName;
        }
      });
      return nextNodes;
    }
    function processNodes(nodesToProcess, allNodes, layerUpdateFunc) {
      var dummyCnt = 1;
      nodesToProcess.forEach( function(n) {
        // remove incoming node from targets
        n.sourceLinks.forEach( lSource => lSource.target.incoming.delete(n));
        // mark as processed
        n.incoming = undefined;
        // assign depth
        n.depth = currentDepth;
        if (layerUpdateFunc && n.layerName) layerUpdateFunc(n.layerName);
        // insert dummy nodes if depth is not consecutive and current depth is main layer
        n.targetLinks.filter(l => n.depth - l.source.depth > 1).forEach( function(l) {
          // TODO: only one dummy inserted for now...
          var dummyDepth = l.source.depth+1
          if (_.some(layersDef, l => l.startDepth <= dummyDepth && (!l.endDepth || dummyDepth <= l.endDepth))) {
            // create new node
            var dummyNode = {name: "dummy-" + dummyCnt++, depth: l.source.depth+1, value: l.value, subgraph: n.subgraph, dummy: true};
            dummyNodes.push(dummyNode);
            // create new link: previous node -> dummy node
            var dummyTargetLink = {source: l.source, target: dummyNode, value: l.value};
            dummyNode.targetLinks = [dummyTargetLink];
            dummyLinks.push(dummyTargetLink);
            // adapt previous node sourceLinks
            l.source.sourceLinks = l.source.sourceLinks.filter( l1 => l1 != l );
            l.source.sourceLinks.push( dummyTargetLink );
            // adapt this link: dummy node -> this node
            l.source = dummyNode;
            dummyNode.sourceLinks = [l];
          };
        });
      });
      if (nodesToProcess.size) currentDepth++;
      return nodesToProcess.size;
    }
    var nodesToProcess = new Set(nodes);
    do {
      var cntProcessed = 0;
      // finish started layer on separate depth if possible
      cntProcessed += processNodes(getNextNodes(nodesToProcess, n => n.layerName && layersDef[n.layerName] && !_.some(nodesToProcess, n1 => n1.layerName == n.layerName)), nodes, l => layersDef[l] = {endDepth: currentDepth});
      // no layer or layer started
      cntProcessed += processNodes(getNextNodes(nodesToProcess, n => !n.layerName || layersDef[n.layerName]), nodes);
      // start of new layer if nothing processed yet or no open layer
      if (!cntProcessed || !_.toPairs(layersDef).filter( l => !l[1].endDepth).length) {
        cntProcessed += processNodes(getNextNodes(nodesToProcess, n => true), nodes, l => layersDef[l] = {startDepth: currentDepth, endDepth: (layersDef[l] && !layersDef[l].endDepth && !_.some(nodesToProcess, n1 => n1.layerName == l) ? currentDepth : layersDef[l] ? layersDef[l].endDepth : null)});
      }
    } while (cntProcessed)
    console.log("depth", _.sortBy(nodes, n => n.depth).map( n => n.name + ": " + n.depth));
    if (nodesToProcess.size) throw "Error: loop detected within the following nodes: " + nodesToProcess.map(n => n.name);
  }
  function labelSubgraphNode(node, nodesToProcess, neighborMap, subgraph) {
    node.subgraph = subgraph;
    nodesToProcess.delete(node);
    var neighbors = neighborMap[node.name];
    if (neighbors) {
      neighbors.forEach( function(n) {
        if (!n.subgraph) labelSubgraphNode(n, nodesToProcess, neighborMap, subgraph);
      });
    }
  }
  function computeNodeDepths({nodes, links}) {
    // label independent subgraphs
    // dependency on layer is used as pseudo link
    var nodesToProcess = new Set(nodes);
    var layerPseudoLinks = _.toPairs(_.groupBy(nodes.filter(n => n.layerName), n => n.layerName)).map( l => [{name: l[0]}, l[1]]).flatMap( l => l[1].map(n => [l[0], n]));
    var bidirLinks = _.concat(links.map( l => ({source: l.source, target: l.target}))
                            , links.map( l => ({source: l.target, target: l.source}))
                            , layerPseudoLinks.map( l => ({source: l[0], target: l[1]}))
                            , layerPseudoLinks.map( l => ({source: l[1], target: l[0]})));
    var neighborMap = _.mapValues(_.groupBy(bidirLinks, e => e.source.name), links => links.map( l => l.target));
    var subgraph = 1;
    while (nodesToProcess.size) {
      var node = nodesToProcess.values().next().value;
      labelSubgraphNode(node, nodesToProcess, neighborMap, subgraph);
      subgraph++;
    }
    // calculate depth per subgraph
    var nodesPerSubgraph = _.groupBy(nodes, n => n.subgraph);
    _.values(nodesPerSubgraph).forEach( function(subgraphNodes) {
      var dummies = computeSubgraphNodeDepths(subgraphNodes);
    });
    // add dummy nodes & links
    Array.prototype.push.apply(nodes, dummyNodes);
    Array.prototype.push.apply(links, dummyLinks);
    // calculate min/max end depth for each node, this is needed for ordering nodes
    // start with end nodes and propagate end depth through graph in reverse direction
    function updateMinMaxEndDepth(node, minEndDepth, maxEndDepth, nextLayerPrio) {
      node.minEndDepth = Math.min(node.minEndDepth ?? minEndDepth, minEndDepth);
      node.maxEndDepth = Math.max(node.maxEndDepth ?? maxEndDepth, maxEndDepth);
      node.nextLayerPrio = node.layerDef ? node.layerDef.prio ?? nextLayerPrio : nextLayerPrio;
      node.targetLinks.forEach(l => updateMinMaxEndDepth(l.source, node.minEndDepth, node.maxEndDepth, node.nextLayerPrio));
    }
    nodes.filter(n => !n.sourceLinks.length).forEach(n => updateMinMaxEndDepth(n, n.depth, n.depth, n.layerDef ? n.layerDef.prio : undefined));
    // precalculate node order per depth
    // it must be done by starting with the first depth, as we want to access node order of previous depth
    function nodeSorter(n1, n2) {
      function getPrevCommonDepth(n1, n2) {
        var prevDepth = n1.depth -1
        while(prevDepth>=0 && !(n1.minDepthPosMap[prevDepth]>=0 && n2.minDepthPosMap[prevDepth]>=0)) prevDepth--;
        return prevDepth;
      }
      var sorter = n1.subgraph - n2.subgraph; // smaller subgraph first
      if (sorter == 0 && n1.nextLayerPrio && n2.nextLayerPrio) sorter = n1.nextLayerPrio - n2.nextLayerPrio; // smaller prio first
      if (sorter == 0) sorter = n2.maxEndDepth - n1.maxEndDepth; // larger end depth first
      if (sorter == 0) sorter = n2.minEndDepth - n1.minEndDepth; // larger end depth first
      if (sorter == 0) {
        var prevCommonDepth = getPrevCommonDepth(n1,n2)
        if (prevCommonDepth>=0) {
          sorter = n1.minDepthPosMap[prevCommonDepth] - n2.minDepthPosMap[prevCommonDepth];  // smaller pos first
        }
      }
      if (sorter == 0) sorter = n2.name < n1.name ? 1 : -1;
      return sorter;
    }
    function mergeMin(v1,v2) {
      return v1 && v2 ? Math.min(v1,v2) : v1 ?? v2
    }
    function collectMinPrevDepthPos(n) {
      // init minDepthPosMap and merge with previous layers
      n.minDepthPosMap = new Map();
      n.targetLinks.map(l => l.source.minDepthPosMap).reduce((agg, next) => _.mergeWith(agg, next, mergeMin), n.minDepthPosMap);
    }
    function assignDepthPos(n, idx) {
      // assign this depthPos
      n.depthPos = idx;
      n.minDepthPosMap[n.depth] = n.depthPos;
    }
    var nodesPerDepth = _.sortBy(_.toPairs(_.groupBy(nodes, n => n.depth)), l => l[0])
    nodesPerDepth.forEach( function (l) {
      l[1].forEach(collectMinPrevDepthPos);
      l[1].sort(nodeSorter).forEach(assignDepthPos);
    })
  }

  function computeNodeHeights({nodes}) {
    const n = nodes.length;
    let current = new Set(nodes);
    let next = new Set;
    let x = 0;
    while (current.size) {
      for (const node of current) {
        node.height = x;
        for (const {source} of node.targetLinks) {
          next.add(source);
        }
      }
      if (++x > n) throw new Error("circular link");
      current = next;
      next = new Set;
    }
  }

  function computeNodeLayers({nodes}) {
    const x = max(nodes, d => d.depth) + 1;
    const kx = (x1 - x0 - dx) / (x - 1);
    const columns = new Array(x);
    for (const node of nodes) {
      const i = Math.max(0, Math.min(x - 1, Math.floor(align.call(null, node, x))));
      node.layer = i;
      node.x0 = x0 + i * kx;
      node.x1 = node.x0 + dx;
      if (columns[i]) columns[i].push(node);
      else columns[i] = [node];
    }
    if (sort) for (const column of columns) {
      column.sort(sort);
    }
    return columns;
  }

  function initializeNodeBreadths(columns) {
    const ky = min(columns, c => (y1 - y0 - (c.length - 1) * py) / sum(c, value));
    for (const nodes of columns) {
      let y = y0;
      for (const node of nodes) {
        node.y0 = y;
        node.y1 = y + node.value * ky;
        y = node.y1 + py;
        for (const link of node.sourceLinks) {
          link.width = link.value * ky;
        }
      }
      y = (y1 - y + py) / (nodes.length + 1);
      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        node.y0 += y * (i + 1);
        node.y1 += y * (i + 1);
      }
      reorderLinks(nodes);
    }
  }

  function computeNodeBreadths(graph) {
    const columns = computeNodeLayers(graph);
    py = Math.min(dy, (y1 - y0) / (max(columns, c => c.length) - 1));
    initializeNodeBreadths(columns);
    for (let i = 0; i < iterations; ++i) {
      const alpha = Math.pow(0.99, i);
      const beta = Math.max(1 - alpha, (i + 1) / iterations);
      relaxRightToLeft(columns, alpha, beta);
      relaxLeftToRight(columns, alpha, beta);
    }
  }

  // Reposition each node based on its incoming (target) links.
  function relaxLeftToRight(columns, alpha, beta) {
    for (let i = 1, n = columns.length; i < n; ++i) {
      const column = columns[i];
      for (const target of column) {
        let y = 0;
        let w = 0;
        for (const {source, value} of target.targetLinks) {
          let v = value * (target.layer - source.layer);
          y += targetTop(source, target) * v;
          w += v;
        }
        if (!(w > 0)) continue;
        let dy = (y / w - target.y0) * alpha;
        target.y0 += dy;
        target.y1 += dy;
        reorderNodeLinks(target);
      }
      if (sort === undefined) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }

  // Reposition each node based on its outgoing (source) links.
  function relaxRightToLeft(columns, alpha, beta) {
    for (let n = columns.length, i = n - 2; i >= 0; --i) {
      const column = columns[i];
      for (const source of column) {
        let y = 0;
        let w = 0;
        for (const {target, value} of source.sourceLinks) {
          let v = value * (target.layer - source.layer);
          y += sourceTop(source, target) * v;
          w += v;
        }
        if (!(w > 0)) continue;
        let dy = (y / w - source.y0) * alpha;
        source.y0 += dy;
        source.y1 += dy;
        reorderNodeLinks(source);
      }
      if (sort === undefined) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }

  function resolveCollisions(nodes, alpha) {
    const i = nodes.length >> 1;
    const subject = nodes[i];
    resolveCollisionsBottomToTop(nodes, subject.y0 - py, i - 1, alpha);
    resolveCollisionsTopToBottom(nodes, subject.y1 + py, i + 1, alpha);
    resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha);
    resolveCollisionsTopToBottom(nodes, y0, 0, alpha);
  }

  // Push any overlapping nodes down.
  function resolveCollisionsTopToBottom(nodes, y, i, alpha) {
    for (; i < nodes.length; ++i) {
      const node = nodes[i];
      const dy = (y - node.y0) * alpha;
      if (dy > 1e-6) node.y0 += dy, node.y1 += dy;
      y = node.y1 + py;
    }
  }

  // Push any overlapping nodes up.
  function resolveCollisionsBottomToTop(nodes, y, i, alpha) {
    for (; i >= 0; --i) {
      const node = nodes[i];
      const dy = (node.y1 - y) * alpha;
      if (dy > 1e-6) node.y0 -= dy, node.y1 -= dy;
      y = node.y0 - py;
    }
  }

  function reorderNodeLinks({sourceLinks, targetLinks}) {
    if (linkSort === undefined) {
      for (const {source: {sourceLinks}} of targetLinks) {
        sourceLinks.sort(ascendingTargetBreadth);
      }
      for (const {target: {targetLinks}} of sourceLinks) {
        targetLinks.sort(ascendingSourceBreadth);
      }
    }
  }

  function reorderLinks(nodes) {
    if (linkSort === undefined) {
      for (const {sourceLinks, targetLinks} of nodes) {
        sourceLinks.sort(ascendingTargetBreadth);
        targetLinks.sort(ascendingSourceBreadth);
      }
    }
  }

  // Returns the target.y0 that would produce an ideal link from source to target.
  function targetTop(source, target) {
    let y = source.y0 - (source.sourceLinks.length - 1) * py / 2;
    for (const {target: node, width} of source.sourceLinks) {
      if (node === target) break;
      y += width + py;
    }
    for (const {source: node, width} of target.targetLinks) {
      if (node === source) break;
      y -= width;
    }
    return y;
  }

  // Returns the source.y0 that would produce an ideal link from source to target.
  function sourceTop(source, target) {
    let y = target.y0 - (target.targetLinks.length - 1) * py / 2;
    for (const {source: node, width} of target.targetLinks) {
      if (node === source) break;
      y += width + py;
    }
    for (const {target: node, width} of source.sourceLinks) {
      if (node === target) break;
      y -= width;
    }
    return y;
  }

  return sankey;
}

function targetDepth(d) {
  return d.target.depth;
}

function left(node) {
  return node.depth;
}

function right(node, n) {
  return n - 1 - node.height;
}

function justify(node, n) {
  return node.sourceLinks.length ? node.depth : n - 1;
}

function center(node) {
  return node.targetLinks.length ? node.depth
      : node.sourceLinks.length ? min(node.sourceLinks, targetDepth) - 1
      : 0;
}

var linkHorizontal = d3.linkHorizontal;

function horizontalSource(d) {
  return [d.source.x1, d.y0];
}

function horizontalTarget(d) {
  return [d.target.x0, d.y1];
}

function sankeyLinkHorizontal() {
  return linkHorizontal()
      .source(horizontalSource)
      .target(horizontalTarget);
}