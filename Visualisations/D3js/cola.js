(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cola = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./src/adaptor"));
__export(require("./src/d3adaptor"));
__export(require("./src/descent"));
__export(require("./src/geom"));
__export(require("./src/gridrouter"));
__export(require("./src/handledisconnected"));
__export(require("./src/layout"));
__export(require("./src/layout3d"));
__export(require("./src/linklengths"));
__export(require("./src/powergraph"));
__export(require("./src/pqueue"));
__export(require("./src/rbtree"));
__export(require("./src/rectangle"));
__export(require("./src/shortestpaths"));
__export(require("./src/vpsc"));
__export(require("./src/batch"));

},{"./src/adaptor":2,"./src/batch":3,"./src/d3adaptor":4,"./src/descent":7,"./src/geom":8,"./src/gridrouter":9,"./src/handledisconnected":10,"./src/layout":11,"./src/layout3d":12,"./src/linklengths":13,"./src/powergraph":14,"./src/pqueue":15,"./src/rbtree":16,"./src/rectangle":17,"./src/shortestpaths":18,"./src/vpsc":19}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var LayoutAdaptor = (function (_super) {
    __extends(LayoutAdaptor, _super);
    function LayoutAdaptor(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
            _this.trigger = o.trigger;
        }
        if (o.kick) {
            _this.kick = o.kick;
        }
        if (o.drag) {
            _this.drag = o.drag;
        }
        if (o.on) {
            _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
    }
    LayoutAdaptor.prototype.trigger = function (e) { };
    ;
    LayoutAdaptor.prototype.kick = function () { };
    ;
    LayoutAdaptor.prototype.drag = function () { };
    ;
    LayoutAdaptor.prototype.on = function (eventType, listener) { return this; };
    ;
    return LayoutAdaptor;
}(layout_1.Layout));
exports.LayoutAdaptor = LayoutAdaptor;
function adaptor(options) {
    return new LayoutAdaptor(options);
}
exports.adaptor = adaptor;

},{"./layout":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var gridrouter_1 = require("./gridrouter");
function gridify(pgLayout, nudgeGap, margin, groupMargin) {
    pgLayout.cola.start(0, 0, 0, 10, false);
    var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
    return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });
}
exports.gridify = gridify;
function route(nodes, groups, margin, groupMargin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    groups.forEach(function (d) {
        d.routerNode = {
            bounds: d.bounds.inflate(-groupMargin),
            children: (typeof d.groups !== 'undefined' ? d.groups.map(function (c) { return nodes.length + c.id; }) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(function (c) { return c.index; }) : [])
        };
    });
    var gridRouterNodes = nodes.concat(groups).map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin - groupMargin);
}
function powerGraphGridLayout(graph, size, grouppadding) {
    var powerGraph;
    graph.nodes.forEach(function (v, i) { return v.index = i; });
    new layout_1.Layout()
        .avoidOverlaps(false)
        .nodes(graph.nodes)
        .links(graph.links)
        .powerGraphGroups(function (d) {
        powerGraph = d;
        powerGraph.groups.forEach(function (v) { return v.padding = grouppadding; });
    });
    var n = graph.nodes.length;
    var edges = [];
    var vs = graph.nodes.slice(0);
    vs.forEach(function (v, i) { return v.index = i; });
    powerGraph.groups.forEach(function (g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== 'undefined')
            g.leaves.forEach(function (v) { return edges.push({ source: sourceInd, target: v.index }); });
        if (typeof g.groups !== 'undefined')
            g.groups.forEach(function (gg) { return edges.push({ source: sourceInd, target: gg.id + n }); });
    });
    powerGraph.powerEdges.forEach(function (e) {
        edges.push({ source: e.source.index, target: e.target.index });
    });
    new layout_1.Layout()
        .size(size)
        .nodes(vs)
        .links(edges)
        .avoidOverlaps(false)
        .linkDistance(30)
        .symmetricDiffLinkLengths(5)
        .convergenceThreshold(1e-4)
        .start(100, 0, 0, 0, false);
    return {
        cola: new layout_1.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .groupCompactness(1e-4)
            .linkDistance(30)
            .symmetricDiffLinkLengths(5)
            .powerGraphGroups(function (d) {
            powerGraph = d;
            powerGraph.groups.forEach(function (v) {
                v.padding = grouppadding;
            });
        }).start(50, 0, 100, 0, false),
        powerGraph: powerGraph
    };
}
exports.powerGraphGridLayout = powerGraphGridLayout;

},{"./gridrouter":9,"./layout":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3v3 = require("./d3v3adaptor");
var d3v4 = require("./d3v4adaptor");
;
function d3adaptor(d3Context) {
    if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
    }
    return new d3v4.D3StyleLayoutAdaptor(d3Context);
}
exports.d3adaptor = d3adaptor;
function isD3V3(d3Context) {
    var v3exp = /^3\./;
    return d3Context.version && d3Context.version.match(v3exp) !== null;
}

},{"./d3v3adaptor":5,"./d3v4adaptor":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3.behavior.drag()
                    .origin(layout_1.Layout.dragOrigin)
                    .on("dragstart.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3.event);
                    d3layout.resume();
                })
                    .on("dragend.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            this
                .call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        d3.timer(function () { return _super.prototype.tick.call(_this); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
function d3adaptor() {
    return new D3StyleLayoutAdaptor();
}
exports.d3adaptor = d3adaptor;

},{"./layout":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3Context.drag()
                    .subject(layout_1.Layout.dragOrigin)
                    .on("start.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3Context.event);
                    d3layout.resume();
                })
                    .on("end.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            arguments[0].call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        var t = this.d3Context.timer(function () { return _super.prototype.tick.call(_this) && t.stop(); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;

},{"./layout":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Locks = (function () {
    function Locks() {
        this.locks = {};
    }
    Locks.prototype.add = function (id, x) {
        this.locks[id] = x;
    };
    Locks.prototype.clear = function () {
        this.locks = {};
    };
    Locks.prototype.isEmpty = function () {
        for (var l in this.locks)
            return false;
        return true;
    };
    Locks.prototype.apply = function (f) {
        for (var l in this.locks) {
            f(Number(l), this.locks[l]);
        }
    };
    return Locks;
}());
exports.Locks = Locks;
var Descent = (function () {
    function Descent(x, D, G) {
        if (G === void 0) { G = null; }
        this.D = D;
        this.G = G;
        this.threshold = 0.0001;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1000;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
            j = n;
            while (--j > i) {
                var d = D[i][j];
                if (d > 0 && d < this.minD) {
                    this.minD = d;
                }
            }
        }
        if (this.minD === Number.MAX_VALUE)
            this.minD = 1;
        i = this.k;
        while (i--) {
            this.g[i] = new Array(n);
            this.H[i] = new Array(n);
            j = n;
            while (j--) {
                this.H[i][j] = new Array(n);
            }
            this.Hd[i] = new Array(n);
            this.a[i] = new Array(n);
            this.b[i] = new Array(n);
            this.c[i] = new Array(n);
            this.d[i] = new Array(n);
            this.e[i] = new Array(n);
            this.ia[i] = new Array(n);
            this.ib[i] = new Array(n);
            this.xtmp[i] = new Array(n);
        }
    }
    Descent.createSquareMatrix = function (n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
            M[i] = new Array(n);
            for (var j = 0; j < n; ++j) {
                M[i][j] = f(i, j);
            }
        }
        return M;
    };
    Descent.prototype.offsetDir = function () {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
            var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
            l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function (x) { return x *= _this.minD / l; });
    };
    Descent.prototype.computeDerivatives = function (x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
            return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u = 0; u < n; ++u) {
            for (i = 0; i < this.k; ++i)
                Huu[i] = this.g[i][u] = 0;
            for (var v = 0; v < n; ++v) {
                if (u === v)
                    continue;
                var maxDisplaces = n;
                while (maxDisplaces--) {
                    var sd2 = 0;
                    for (i = 0; i < this.k; ++i) {
                        var dx = d[i] = x[i][u] - x[i][v];
                        sd2 += d2[i] = dx * dx;
                    }
                    if (sd2 > 1e-9)
                        break;
                    var rd = this.offsetDir();
                    for (i = 0; i < this.k; ++i)
                        x[i][v] += rd[i];
                }
                var l = Math.sqrt(sd2);
                var D = this.D[u][v];
                var weight = this.G != null ? this.G[u][v] : 1;
                if (weight > 1 && l > D || !isFinite(D)) {
                    for (i = 0; i < this.k; ++i)
                        this.H[i][u][v] = 0;
                    continue;
                }
                if (weight > 1) {
                    weight = 1;
                }
                var D2 = D * D;
                var gs = 2 * weight * (l - D) / (D2 * l);
                var l3 = l * l * l;
                var hs = 2 * -weight / (D2 * l3);
                if (!isFinite(gs))
                    console.log(gs);
                for (i = 0; i < this.k; ++i) {
                    this.g[i][u] += d[i] * gs;
                    Huu[i] -= this.H[i][u][v] = hs * (l3 + D * (d2[i] - sd2) + l * sd2);
                }
            }
            for (i = 0; i < this.k; ++i)
                maxH = Math.max(maxH, this.H[i][u][u] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
            for (i = 0; i < this.k; ++i) {
                var xiu = this.x[i][u];
                var m = xiu / g;
                var f = m % 1;
                var q = m - f;
                var a = Math.abs(f);
                var dx = (a <= 0.5) ? xiu - q * g :
                    (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                if (-r < dx && dx <= r) {
                    if (this.scaleSnapByMaxH) {
                        this.g[i][u] += maxH * k * dx;
                        this.H[i][u][u] += maxH * k;
                    }
                    else {
                        this.g[i][u] += k * dx;
                        this.H[i][u][u] += k;
                    }
                }
            }
        }
        if (!this.locks.isEmpty()) {
            this.locks.apply(function (u, p) {
                for (i = 0; i < _this.k; ++i) {
                    _this.H[i][u][u] += maxH;
                    _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                }
            });
        }
    };
    Descent.dotProd = function (a, b) {
        var x = 0, i = a.length;
        while (i--)
            x += a[i] * b[i];
        return x;
    };
    Descent.rightMultiply = function (m, v, r) {
        var i = m.length;
        while (i--)
            r[i] = Descent.dotProd(m[i], v);
    };
    Descent.prototype.computeStepSize = function (d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
            numerator += Descent.dotProd(this.g[i], d[i]);
            Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
            denominator += Descent.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
            return 0;
        return 1 * numerator / denominator;
    };
    Descent.prototype.reduceStress = function () {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
            this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
    };
    Descent.copy = function (a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
            for (var j = 0; j < n; ++j) {
                b[i][j] = a[i][j];
            }
        }
    };
    Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
        Descent.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
            this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
            this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
            this.takeDescentStep(r[i], d[i], stepSize);
    };
    Descent.mApply = function (m, n, f) {
        var i = m;
        while (i-- > 0) {
            var j = n;
            while (j-- > 0)
                f(i, j);
        }
    };
    Descent.prototype.matrixApply = function (f) {
        Descent.mApply(this.k, this.n, f);
    };
    Descent.prototype.computeNextPosition = function (x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
            this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
            var beta = this.computeStepSize(this.e);
            beta = Math.max(0.2, Math.min(beta, 1));
            this.stepAndProject(x0, r, this.e, beta);
        }
    };
    Descent.prototype.run = function (iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
            var s = this.rungeKutta();
            converged = Math.abs(stress / s - 1) < this.threshold;
            stress = s;
        }
        return stress;
    };
    Descent.prototype.rungeKutta = function () {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function (i, j) {
            var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
            disp += d * d;
            _this.x[i][j] = x;
        });
        return disp;
    };
    Descent.mid = function (a, b, m) {
        Descent.mApply(a.length, a[0].length, function (i, j) {
            return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
        });
    };
    Descent.prototype.takeDescentStep = function (x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
            x[i] = x[i] - stepSize * d[i];
        }
    };
    Descent.prototype.computeStress = function () {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
            for (var v = u + 1, n = this.n; v < n; ++v) {
                var l = 0;
                for (var i = 0; i < this.k; ++i) {
                    var dx = this.x[i][u] - this.x[i][v];
                    l += dx * dx;
                }
                l = Math.sqrt(l);
                var d = this.D[u][v];
                if (!isFinite(d))
                    continue;
                var rl = d - l;
                var d2 = d * d;
                stress += rl * rl / d2;
            }
        }
        return stress;
    };
    Descent.zeroDistance = 1e-10;
    return Descent;
}());
exports.Descent = Descent;
var PseudoRandom = (function () {
    function PseudoRandom(seed) {
        if (seed === void 0) { seed = 1; }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
    }
    PseudoRandom.prototype.getNext = function () {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
    };
    PseudoRandom.prototype.getNextBetween = function (min, max) {
        return min + this.getNext() * (max - min);
    };
    return PseudoRandom;
}());
exports.PseudoRandom = PseudoRandom;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var Point = (function () {
    function Point() {
    }
    return Point;
}());
exports.Point = Point;
var LineSegment = (function () {
    function LineSegment(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    return LineSegment;
}());
exports.LineSegment = LineSegment;
var PolyPoint = (function (_super) {
    __extends(PolyPoint, _super);
    function PolyPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PolyPoint;
}(Point));
exports.PolyPoint = PolyPoint;
function isLeft(P0, P1, P2) {
    return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
}
exports.isLeft = isLeft;
function above(p, vi, vj) {
    return isLeft(p, vi, vj) > 0;
}
function below(p, vi, vj) {
    return isLeft(p, vi, vj) < 0;
}
function ConvexHull(S) {
    var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
    var n = S.length, i;
    var minmin = 0;
    var xmin = P[0].x;
    for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
            break;
    }
    var minmax = i - 1;
    var H = [];
    H.push(P[minmin]);
    if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
            H.push(P[minmax]);
    }
    else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
            if (P[i].x !== xmax)
                break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
            if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                continue;
            while (H.length > 1) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
        if (maxmax != maxmin)
            H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
            if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                continue;
            while (H.length > bot) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
    }
    return H;
}
exports.ConvexHull = ConvexHull;
function clockwiseRadialSweep(p, P, f) {
    P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
}
exports.clockwiseRadialSweep = clockwiseRadialSweep;
function nextPolyPoint(p, ps) {
    if (p.polyIndex === ps.length - 1)
        return ps[0];
    return ps[p.polyIndex + 1];
}
function prevPolyPoint(p, ps) {
    if (p.polyIndex === 0)
        return ps[ps.length - 1];
    return ps[p.polyIndex - 1];
}
function tangent_PointPolyC(P, V) {
    var Vclosed = V.slice(0);
    Vclosed.push(V[0]);
    return { rtan: Rtangent_PointPolyC(P, Vclosed), ltan: Ltangent_PointPolyC(P, Vclosed) };
}
function Rtangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var upA, dnC;
    if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (above(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
            return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
            if (dnC)
                b = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (!dnC)
                a = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function Ltangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var dnA, dnC;
    if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (below(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
            return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
            if (!dnC)
                b = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (dnC)
                a = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
    var ix1, ix2;
    ix1 = t1(W[0], V);
    ix2 = t2(V[ix1], W);
    var done = false;
    while (!done) {
        done = true;
        while (true) {
            if (ix1 === V.length - 1)
                ix1 = 0;
            if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                break;
            ++ix1;
        }
        while (true) {
            if (ix2 === 0)
                ix2 = W.length - 1;
            if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                break;
            --ix2;
            done = false;
        }
    }
    return { t1: ix1, t2: ix2 };
}
exports.tangent_PolyPolyC = tangent_PolyPolyC;
function LRtangent_PolyPolyC(V, W) {
    var rl = RLtangent_PolyPolyC(W, V);
    return { t1: rl.t2, t2: rl.t1 };
}
exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
function RLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
}
exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
function LLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
}
exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
function RRtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
}
exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
var BiTangent = (function () {
    function BiTangent(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }
    return BiTangent;
}());
exports.BiTangent = BiTangent;
var BiTangents = (function () {
    function BiTangents() {
    }
    return BiTangents;
}());
exports.BiTangents = BiTangents;
var TVGPoint = (function (_super) {
    __extends(TVGPoint, _super);
    function TVGPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TVGPoint;
}(Point));
exports.TVGPoint = TVGPoint;
var VisibilityVertex = (function () {
    function VisibilityVertex(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
    }
    return VisibilityVertex;
}());
exports.VisibilityVertex = VisibilityVertex;
var VisibilityEdge = (function () {
    function VisibilityEdge(source, target) {
        this.source = source;
        this.target = target;
    }
    VisibilityEdge.prototype.length = function () {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    return VisibilityEdge;
}());
exports.VisibilityEdge = VisibilityEdge;
var TangentVisibilityGraph = (function () {
    function TangentVisibilityGraph(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
            var n = P.length;
            for (var i = 0; i < n; i++) {
                var p = P[i];
                for (var j = 0; j < p.length; ++j) {
                    var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                    this.V.push(vv);
                    if (j > 0)
                        this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                }
                if (p.length > 1)
                    this.E.push(new VisibilityEdge(p[0].vv, p[p.length - 1].vv));
            }
            for (var i = 0; i < n - 1; i++) {
                var Pi = P[i];
                for (var j = i + 1; j < n; j++) {
                    var Pj = P[j], t = tangents(Pi, Pj);
                    for (var q in t) {
                        var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                        this.addEdgeIfVisible(source, target, i, j);
                    }
                }
            }
        }
        else {
            this.V = g0.V.slice(0);
            this.E = g0.E.slice(0);
        }
    }
    TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
            this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
    };
    TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
            if (i === i1)
                continue;
            var poly = this.P[i], t = tangent_PointPolyC(p, poly);
            this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
            this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
    };
    TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
            if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                return true;
            }
        }
        return false;
    };
    return TangentVisibilityGraph;
}());
exports.TangentVisibilityGraph = TangentVisibilityGraph;
function intersects(l, P) {
    var ints = [];
    for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
            ints.push(int);
    }
    return ints;
}
function tangents(V, W) {
    var m = V.length - 1, n = W.length - 1;
    var bt = new BiTangents();
    for (var i = 0; i < m; ++i) {
        for (var j = 0; j < n; ++j) {
            var v1 = V[i == 0 ? m - 1 : i - 1];
            var v2 = V[i];
            var v3 = V[i + 1];
            var w1 = W[j == 0 ? n - 1 : j - 1];
            var w2 = W[j];
            var w3 = W[j + 1];
            var v1v2w2 = isLeft(v1, v2, w2);
            var v2w1w2 = isLeft(v2, w1, w2);
            var v2w2w3 = isLeft(v2, w2, w3);
            var w1w2v2 = isLeft(w1, w2, v2);
            var w2v1v2 = isLeft(w2, v1, v2);
            var w2v2v3 = isLeft(w2, v2, v3);
            if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                bt.ll = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                bt.rr = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                bt.rl = new BiTangent(i, j);
            }
            else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                bt.lr = new BiTangent(i, j);
            }
        }
    }
    return bt;
}
exports.tangents = tangents;
function isPointInsidePoly(p, poly) {
    for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
            return false;
    return true;
}
function isAnyPInQ(p, q) {
    return !p.every(function (v) { return !isPointInsidePoly(v, q); });
}
function polysOverlap(p, q) {
    if (isAnyPInQ(p, q))
        return true;
    if (isAnyPInQ(q, p))
        return true;
    for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
            return true;
    }
    return false;
}
exports.polysOverlap = polysOverlap;

},{"./rectangle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var vpsc_1 = require("./vpsc");
var shortestpaths_1 = require("./shortestpaths");
var NodeWrapper = (function () {
    function NodeWrapper(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === 'undefined' || children.length === 0;
    }
    return NodeWrapper;
}());
exports.NodeWrapper = NodeWrapper;
var Vert = (function () {
    function Vert(id, x, y, node, line) {
        if (node === void 0) { node = null; }
        if (line === void 0) { line = null; }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
    }
    return Vert;
}());
exports.Vert = Vert;
var LongestCommonSubsequence = (function () {
    function LongestCommonSubsequence(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence.findMatch(s, tr);
        if (mf.length >= mr.length) {
            this.length = mf.length;
            this.si = mf.si;
            this.ti = mf.ti;
            this.reversed = false;
        }
        else {
            this.length = mr.length;
            this.si = mr.si;
            this.ti = t.length - mr.ti - mr.length;
            this.reversed = true;
        }
    }
    LongestCommonSubsequence.findMatch = function (s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
            l[i] = new Array(n);
            for (var j = 0; j < n; j++)
                if (s[i] === t[j]) {
                    var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                    if (v > match.length) {
                        match.length = v;
                        match.si = i - v + 1;
                        match.ti = j - v + 1;
                    }
                    ;
                }
                else
                    l[i][j] = 0;
        }
        return match;
    };
    LongestCommonSubsequence.prototype.getSequence = function () {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
    };
    return LongestCommonSubsequence;
}());
exports.LongestCommonSubsequence = LongestCommonSubsequence;
var GridRouter = (function () {
    function GridRouter(originalnodes, accessor, groupPadding) {
        if (groupPadding === void 0) { groupPadding = 12; }
        var _this = this;
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
        this.leaves = this.nodes.filter(function (v) { return v.leaf; });
        this.groups = this.nodes.filter(function (g) { return !g.leaf; });
        this.cols = this.getGridLines('x');
        this.rows = this.getGridLines('y');
        this.groups.forEach(function (v) {
            return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
        });
        this.root = { children: [] };
        this.nodes.forEach(function (v) {
            if (typeof v.parent === 'undefined') {
                v.parent = _this.root;
                _this.root.children.push(v.id);
            }
            v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
        frontToBackGroups.forEach(function (v) {
            var r = rectangle_1.Rectangle.empty();
            v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
            v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
        var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function (r) { return ({ x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }); })
            .concat(rowMids.map(function (m) { return ({ x1: rowx, x2: rowX, y1: m, y2: m }); }));
        var vlines = this.cols.map(function (c) { return ({ x1: c.pos, x2: c.pos, y1: coly, y2: colY }); })
            .concat(colMids.map(function (m) { return ({ x1: m, x2: m, y1: coly, y2: colY }); }));
        var lines = hlines.concat(vlines);
        lines.forEach(function (l) { return l.verts = []; });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function (h) {
            return vlines.forEach(function (v) {
                var p = new Vert(_this.verts.length, v.x1, h.y1);
                h.verts.push(p);
                v.verts.push(p);
                _this.verts.push(p);
                var i = _this.backToFront.length;
                while (i-- > 0) {
                    var node = _this.backToFront[i], r = node.rect;
                    var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                    if (dx < r.width() / 2 && dy < r.height() / 2) {
                        p.node = node;
                        break;
                    }
                }
            });
        });
        lines.forEach(function (l, li) {
            _this.nodes.forEach(function (v, i) {
                v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                    var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                    _this.verts.push(p);
                    l.verts.push(p);
                    v.ports.push(p);
                });
            });
            var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
            var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
            l.verts.sort(delta);
            for (var i = 1; i < l.verts.length; i++) {
                var u = l.verts[i - 1], v = l.verts[i];
                if (u.node && u.node === v.node && u.node.leaf)
                    continue;
                _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
            }
        });
    }
    GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
    GridRouter.prototype.getGridLines = function (axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
            var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
            var col = {
                nodes: overlapping,
                pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
            };
            columns.push(col);
            col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
        }
        columns.sort(function (a, b) { return a.pos - b.pos; });
        return columns;
    };
    GridRouter.prototype.getDepth = function (v) {
        var depth = 0;
        while (v.parent !== this.root) {
            depth++;
            v = v.parent;
        }
        return depth;
    };
    GridRouter.prototype.midPoints = function (a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
            mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
    };
    GridRouter.prototype.findLineage = function (v) {
        var lineage = [v];
        do {
            v = v.parent;
            lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
    };
    GridRouter.prototype.findAncestorPathBetween = function (a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
            i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
    };
    GridRouter.prototype.siblingObstacles = function (a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
        var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
        path.lineages
            .filter(function (v) { return v.parent !== path.commonAncestor; })
            .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
        return obstacles.map(function (v) { return _this.nodes[v]; });
    };
    GridRouter.getSegmentSets = function (routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
            var route = routes[ei];
            for (var si = 0; si < route.length; si++) {
                var s = route[si];
                s.edgeid = ei;
                s.i = si;
                var sdx = s[1][x] - s[0][x];
                if (Math.abs(sdx) < 0.1) {
                    vsegments.push(s);
                }
            }
        }
        vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
            var s = vsegments[i];
            if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                segmentset = { pos: s[0][x], segments: [] };
                vsegmentsets.push(segmentset);
            }
            segmentset.segments.push(s);
        }
        return vsegmentsets;
    };
    GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
            return;
        var vs = segments.map(function (s) { return new vpsc_1.Variable(s[0][x]); });
        var cs = [];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j)
                    continue;
                var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                if (x == 'x') {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = j, rind = i;
                        }
                        else {
                            lind = i, rind = j;
                        }
                    }
                }
                else {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = i, rind = j;
                        }
                        else {
                            lind = j, rind = i;
                        }
                    }
                }
                if (lind >= 0) {
                    cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
                }
            }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function (v, i) {
            var s = segments[i];
            var pos = v.position();
            s[0][x] = s[1][x] = pos;
            var route = routes[s.edgeid];
            if (s.i > 0)
                route[s.i - 1][1][x] = pos;
            if (s.i < route.length - 1)
                route[s.i + 1][0][x] = pos;
        });
    };
    GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
            var ss = vsegmentsets[i];
            var events = [];
            for (var j = 0; j < ss.segments.length; j++) {
                var s = ss.segments[j];
                events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
            }
            events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
            var open = [];
            var openCount = 0;
            events.forEach(function (e) {
                if (e.type === 0) {
                    open.push(e.s);
                    openCount++;
                }
                else {
                    openCount--;
                }
                if (openCount == 0) {
                    GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                    open = [];
                }
            });
        }
    };
    GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
        var order = GridRouter.orderEdges(routePaths);
        var routes = routePaths.map(function (e) { return GridRouter.makeSegments(e); });
        GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
        GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
        GridRouter.unreverseEdges(routes, routePaths);
        return routes;
    };
    GridRouter.unreverseEdges = function (routes, routePaths) {
        routes.forEach(function (segments, i) {
            var path = routePaths[i];
            if (path.reversed) {
                segments.reverse();
                segments.forEach(function (segment) {
                    segment.reverse();
                });
            }
        });
    };
    GridRouter.angleBetween2Lines = function (line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
            diff = angle2 - angle1;
        }
        return diff;
    };
    GridRouter.isLeft = function (a, b, c) {
        return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
    };
    GridRouter.getOrder = function (pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            if (typeof outgoing[p.l] === 'undefined')
                outgoing[p.l] = {};
            outgoing[p.l][p.r] = true;
        }
        return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
    };
    GridRouter.orderEdges = function (edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
            for (var j = i + 1; j < edges.length; j++) {
                var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
                var u, vi, vj;
                if (lcs.length === 0)
                    continue;
                if (lcs.reversed) {
                    f.reverse();
                    f.reversed = true;
                    lcs = new LongestCommonSubsequence(e, f);
                }
                if ((lcs.si <= 0 || lcs.ti <= 0) &&
                    (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                    edgeOrder.push({ l: i, r: j });
                    continue;
                }
                if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                    u = e[lcs.si + 1];
                    vj = e[lcs.si - 1];
                    vi = f[lcs.ti - 1];
                }
                else {
                    u = e[lcs.si + lcs.length - 2];
                    vi = e[lcs.si + lcs.length];
                    vj = f[lcs.ti + lcs.length];
                }
                if (GridRouter.isLeft(u, vi, vj)) {
                    edgeOrder.push({ l: j, r: i });
                }
                else {
                    edgeOrder.push({ l: i, r: j });
                }
            }
        }
        return GridRouter.getOrder(edgeOrder);
    };
    GridRouter.makeSegments = function (path) {
        function copyPoint(p) {
            return { x: p.x, y: p.y };
        }
        var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
            if (!c || !isStraight(a, b, c)) {
                segments.push([a, b]);
                a = b;
            }
        }
        return segments;
    };
    GridRouter.prototype.route = function (s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
        this.passableEdges = this.edges.filter(function (e) {
            var u = _this.verts[e.source], v = _this.verts[e.target];
            return !(u.node && u.node.id in obstacleLookup
                || v.node && v.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
            var u = source.ports[0].id;
            var v = source.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        for (var i = 1; i < target.ports.length; i++) {
            var u = target.ports[0].id;
            var v = target.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function (u, v, w) {
            var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
            var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
            if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                return 0;
            return dx > 1 && dy > 1 ? 1000 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function (v, i) {
            return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                || i > 0 && v.node === target && pathPoints[i - 1].node === target);
        });
    };
    GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
        var result = {
            routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
            arrowpath: ''
        };
        if (route.length > 1) {
            for (var i = 0; i < route.length; i++) {
                var li = route[i];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                if (i < route.length - 1) {
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * cornerradius;
                    }
                    else {
                        y -= dy / Math.abs(dy) * cornerradius;
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    var l = route[i + 1];
                    var x0 = l[0].x, y0 = l[0].y;
                    var x1 = l[1].x;
                    var y1 = l[1].y;
                    dx = x1 - x0;
                    dy = y1 - y0;
                    var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                    var x2, y2;
                    if (Math.abs(dx) > 0) {
                        x2 = x0 + dx / Math.abs(dx) * cornerradius;
                        y2 = y0;
                    }
                    else {
                        x2 = x0;
                        y2 = y0 + dy / Math.abs(dy) * cornerradius;
                    }
                    var cx = Math.abs(x2 - x);
                    var cy = Math.abs(y2 - y);
                    result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                }
                else {
                    var arrowtip = [x, y];
                    var arrowcorner1, arrowcorner2;
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * arrowheight;
                        arrowcorner1 = [x, y + arrowwidth];
                        arrowcorner2 = [x, y - arrowwidth];
                    }
                    else {
                        y -= dy / Math.abs(dy) * arrowheight;
                        arrowcorner1 = [x + arrowwidth, y];
                        arrowcorner2 = [x - arrowwidth, y];
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    if (arrowheight > 0) {
                        result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                            + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                    }
                }
            }
        }
        else {
            var li = route[0];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            var arrowtip = [x, y];
            var arrowcorner1, arrowcorner2;
            if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
            }
            else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
            }
            result.routepath += 'L ' + x + ' ' + y + ' ';
            if (arrowheight > 0) {
                result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                    + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
            }
        }
        return result;
    };
    return GridRouter;
}());
exports.GridRouter = GridRouter;

},{"./rectangle":17,"./shortestpaths":18,"./vpsc":19}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var packingOptions = {
    PADDING: 10,
    GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
    FLOAT_EPSILON: 0.0001,
    MAX_INERATIONS: 100
};
function applyPacking(graphs, w, h, node_size, desired_ratio, centerGraph) {
    if (desired_ratio === void 0) { desired_ratio = 1; }
    if (centerGraph === void 0) { centerGraph = true; }
    var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
    if (graphs.length == 0)
        return;
    calculate_bb(graphs);
    apply(graphs, desired_ratio);
    if (centerGraph) {
        put_nodes_to_right_positions(graphs);
    }
    function calculate_bb(graphs) {
        graphs.forEach(function (g) {
            calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
            var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
            graph.array.forEach(function (v) {
                var w = typeof v.width !== 'undefined' ? v.width : node_size;
                var h = typeof v.height !== 'undefined' ? v.height : node_size;
                w /= 2;
                h /= 2;
                max_x = Math.max(v.x + w, max_x);
                min_x = Math.min(v.x - w, min_x);
                max_y = Math.max(v.y + h, max_y);
                min_y = Math.min(v.y - h, min_y);
            });
            graph.width = max_x - min_x;
            graph.height = max_y - min_y;
        }
    }
    function put_nodes_to_right_positions(graphs) {
        graphs.forEach(function (g) {
            var center = { x: 0, y: 0 };
            g.array.forEach(function (node) {
                center.x += node.x;
                center.y += node.y;
            });
            center.x /= g.array.length;
            center.y /= g.array.length;
            var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
            var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
            g.array.forEach(function (node) {
                node.x += offset.x;
                node.y += offset.y;
            });
        });
    }
    function apply(data, desired_ratio) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function (a, b) { return b.height - a.height; });
        min_width = data.reduce(function (a, b) {
            return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
            if (flag != 1) {
                var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x1 = step(data, x1);
            }
            if (flag != 0) {
                var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x2 = step(data, x2);
            }
            dx = Math.abs(x1 - x2);
            df = Math.abs(f_x1 - f_x2);
            if (f_x1 < curr_best_f) {
                curr_best_f = f_x1;
                curr_best = x1;
            }
            if (f_x2 < curr_best_f) {
                curr_best_f = f_x2;
                curr_best = x2;
            }
            if (f_x1 > f_x2) {
                left = x1;
                x1 = x2;
                f_x1 = f_x2;
                flag = 1;
            }
            else {
                right = x2;
                x2 = x1;
                f_x2 = f_x1;
                flag = 0;
            }
            if (iterationCounter++ > 100) {
                break;
            }
        }
        step(data, curr_best);
    }
    function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
    }
    function put_rect(rect, max_width) {
        var parent = undefined;
        for (var i = 0; i < line.length; i++) {
            if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                parent = line[i];
                break;
            }
        }
        line.push(rect);
        if (parent !== undefined) {
            rect.x = parent.x + parent.width + packingOptions.PADDING;
            rect.y = parent.bottom;
            rect.space_left = rect.height;
            rect.bottom = rect.y;
            parent.space_left -= rect.height + packingOptions.PADDING;
            parent.bottom += rect.height + packingOptions.PADDING;
        }
        else {
            rect.y = global_bottom;
            global_bottom += rect.height + packingOptions.PADDING;
            rect.x = init_x;
            rect.bottom = rect.y;
            rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
            real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
            real_width = rect.x + rect.width - init_x;
    }
    ;
    function get_entire_width(data) {
        var width = 0;
        data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
        return width;
    }
    function get_real_ratio() {
        return (real_width / real_height);
    }
}
exports.applyPacking = applyPacking;
function separateGraphs(nodes, links) {
    var marks = {};
    var ways = {};
    var graphs = [];
    var clusters = 0;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
            ways[n1.index].push(n2);
        else
            ways[n1.index] = [n2];
        if (ways[n2.index])
            ways[n2.index].push(n1);
        else
            ways[n2.index] = [n1];
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
            continue;
        explore_node(node, true);
    }
    function explore_node(n, is_new) {
        if (marks[n.index] !== undefined)
            return;
        if (is_new) {
            clusters++;
            graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
            return;
        for (var j = 0; j < adjacent.length; j++) {
            explore_node(adjacent[j], false);
        }
    }
    return graphs;
}
exports.separateGraphs = separateGraphs;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var powergraph = require("./powergraph");
var linklengths_1 = require("./linklengths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var shortestpaths_1 = require("./shortestpaths");
var geom_1 = require("./geom");
var handledisconnected_1 = require("./handledisconnected");
var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["tick"] = 1] = "tick";
    EventType[EventType["end"] = 2] = "end";
})(EventType = exports.EventType || (exports.EventType = {}));
;
function isGroup(g) {
    return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
}
var Layout = (function () {
    function Layout() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
            getSourceIndex: Layout.getSourceIndex,
            getTargetIndex: Layout.getTargetIndex,
            setLength: Layout.setLinkLength,
            getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
        };
    }
    Layout.prototype.on = function (e, listener) {
        if (!this.event)
            this.event = {};
        if (typeof e === 'string') {
            this.event[EventType[e]] = listener;
        }
        else {
            this.event[e] = listener;
        }
        return this;
    };
    Layout.prototype.trigger = function (e) {
        if (this.event && typeof this.event[e.type] !== 'undefined') {
            this.event[e.type](e);
        }
    };
    Layout.prototype.kick = function () {
        while (!this.tick())
            ;
    };
    Layout.prototype.tick = function () {
        if (this._alpha < this._threshold) {
            this._running = false;
            this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
            return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
            o = this._nodes[i];
            if (o.fixed) {
                if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                    o.px = o.x;
                    o.py = o.y;
                }
                var p = [o.px, o.py];
                this._descent.locks.add(i, p);
            }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
            this._alpha = 0;
        }
        else if (typeof this._lastStress !== 'undefined') {
            this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
    };
    Layout.prototype.updateNodePositions = function () {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
            o = this._nodes[i];
            o.x = x[i];
            o.y = y[i];
        }
    };
    Layout.prototype.nodes = function (v) {
        if (!v) {
            if (this._nodes.length === 0 && this._links.length > 0) {
                var n = 0;
                this._links.forEach(function (l) {
                    n = Math.max(n, l.source, l.target);
                });
                this._nodes = new Array(++n);
                for (var i = 0; i < n; ++i) {
                    this._nodes[i] = {};
                }
            }
            return this._nodes;
        }
        this._nodes = v;
        return this;
    };
    Layout.prototype.groups = function (x) {
        var _this = this;
        if (!x)
            return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function (g) {
            if (typeof g.padding === "undefined")
                g.padding = 1;
            if (typeof g.leaves !== "undefined") {
                g.leaves.forEach(function (v, i) {
                    if (typeof v === 'number')
                        (g.leaves[i] = _this._nodes[v]).parent = g;
                });
            }
            if (typeof g.groups !== "undefined") {
                g.groups.forEach(function (gi, i) {
                    if (typeof gi === 'number')
                        (g.groups[i] = _this._groups[gi]).parent = g;
                });
            }
        });
        this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
        this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
        return this;
    };
    Layout.prototype.powerGraphGroups = function (f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
    };
    Layout.prototype.avoidOverlaps = function (v) {
        if (!arguments.length)
            return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
    };
    Layout.prototype.handleDisconnected = function (v) {
        if (!arguments.length)
            return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
    };
    Layout.prototype.flowLayout = function (axis, minSeparation) {
        if (!arguments.length)
            axis = 'y';
        this._directedLinkConstraints = {
            axis: axis,
            getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
        };
        return this;
    };
    Layout.prototype.links = function (x) {
        if (!arguments.length)
            return this._links;
        this._links = x;
        return this;
    };
    Layout.prototype.constraints = function (c) {
        if (!arguments.length)
            return this._constraints;
        this._constraints = c;
        return this;
    };
    Layout.prototype.distanceMatrix = function (d) {
        if (!arguments.length)
            return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
    };
    Layout.prototype.size = function (x) {
        if (!x)
            return this._canvasSize;
        this._canvasSize = x;
        return this;
    };
    Layout.prototype.defaultNodeSize = function (x) {
        if (!x)
            return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
    };
    Layout.prototype.groupCompactness = function (x) {
        if (!x)
            return this._groupCompactness;
        this._groupCompactness = x;
        return this;
    };
    Layout.prototype.linkDistance = function (x) {
        if (!x) {
            return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
    };
    Layout.prototype.linkType = function (f) {
        this._linkType = f;
        return this;
    };
    Layout.prototype.convergenceThreshold = function (x) {
        if (!x)
            return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
    };
    Layout.prototype.alpha = function (x) {
        if (!arguments.length)
            return this._alpha;
        else {
            x = +x;
            if (this._alpha) {
                if (x > 0)
                    this._alpha = x;
                else
                    this._alpha = 0;
            }
            else if (x > 0) {
                if (!this._running) {
                    this._running = true;
                    this.trigger({ type: EventType.start, alpha: this._alpha = x });
                    this.kick();
                }
            }
            return this;
        }
    };
    Layout.prototype.getLinkLength = function (link) {
        return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
    };
    Layout.setLinkLength = function (link, length) {
        link.length = length;
    };
    Layout.prototype.getLinkType = function (link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
    };
    Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning, centerGraph) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
        if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
        if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
        if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
        if (keepRunning === void 0) { keepRunning = true; }
        if (centerGraph === void 0) { centerGraph = true; }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function (v, i) {
            v.index = i;
            if (typeof v.x === 'undefined') {
                v.x = w / 2, v.y = h / 2;
            }
            x[i] = v.x, y[i] = v.y;
        });
        if (this._linkLengthCalculator)
            this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
            distances = this._distanceMatrix;
        }
        else {
            distances = (new shortestpaths_1.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
            G = descent_1.Descent.createSquareMatrix(N, function () { return 2; });
            this._links.forEach(function (l) {
                if (typeof l.source == "number")
                    l.source = _this._nodes[l.source];
                if (typeof l.target == "number")
                    l.target = _this._nodes[l.target];
            });
            this._links.forEach(function (e) {
                var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                G[u][v] = G[v][u] = e.weight || 1;
            });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function (i, j) {
            return distances[i][j];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
            var i = n;
            var addAttraction = function (i, j, strength, idealDistance) {
                G[i][j] = G[j][i] = strength;
                D[i][j] = D[j][i] = idealDistance;
            };
            this._groups.forEach(function (g) {
                addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                x[i] = 0, y[i++] = 0;
                x[i] = 0, y[i++] = 0;
            });
        }
        else
            this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
            this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
            curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
            var o = this._nodes[i];
            if (o.fixed) {
                o.px = o.x;
                o.py = o.y;
                var p = [o.x, o.y];
                this._descent.locks.add(i, p);
            }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h, centerGraph);
        this.avoidOverlaps(ao);
        if (ao) {
            this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
            this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
            this._descent.snapStrength = 1000;
            this._descent.snapGridSize = this._nodes[0].width;
            this._descent.numGridSnapNodes = n;
            this._descent.scaleSnapByMaxH = n != N;
            var G0 = descent_1.Descent.createSquareMatrix(N, function (i, j) {
                if (i >= n || j >= n)
                    return G[i][j];
                return 0;
            });
            this._descent.G = G0;
            this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h, centerGraph);
        return keepRunning ? this.resume() : this;
    };
    Layout.prototype.initialLayout = function (iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
            var n = this._nodes.length;
            var edges = this._links.map(function (e) { return ({ source: e.source.index, target: e.target.index }); });
            var vs = this._nodes.map(function (v) { return ({ index: v.index }); });
            this._groups.forEach(function (g, i) {
                vs.push({ index: g.index = n + i });
            });
            this._groups.forEach(function (g, i) {
                if (typeof g.leaves !== 'undefined')
                    g.leaves.forEach(function (v) { return edges.push({ source: g.index, target: v.index }); });
                if (typeof g.groups !== 'undefined')
                    g.groups.forEach(function (gg) { return edges.push({ source: g.index, target: gg.index }); });
            });
            new Layout()
                .size(this.size())
                .nodes(vs)
                .links(edges)
                .avoidOverlaps(false)
                .linkDistance(this.linkDistance())
                .symmetricDiffLinkLengths(5)
                .convergenceThreshold(1e-4)
                .start(iterations, 0, 0, 0, false);
            this._nodes.forEach(function (v) {
                x[v.index] = vs[v.index].x;
                y[v.index] = vs[v.index].y;
            });
        }
        else {
            this._descent.run(iterations);
        }
    };
    Layout.prototype.separateOverlappingComponents = function (width, height, centerGraph) {
        var _this = this;
        if (centerGraph === void 0) { centerGraph = true; }
        if (!this._distanceMatrix && this._handleDisconnected) {
            var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
            this._nodes.forEach(function (v, i) { v.x = x_1[i], v.y = y_1[i]; });
            var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
            handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize, 1, centerGraph);
            this._nodes.forEach(function (v, i) {
                _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                if (v.bounds) {
                    v.bounds.setXCentre(v.x);
                    v.bounds.setYCentre(v.y);
                }
            });
        }
    };
    Layout.prototype.resume = function () {
        return this.alpha(0.1);
    };
    Layout.prototype.stop = function () {
        return this.alpha(0);
    };
    Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
        if (nodeMargin === void 0) { nodeMargin = 0; }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function (v) {
            return v.bounds.inflate(-nodeMargin).vertices();
        }));
    };
    Layout.prototype.routeEdge = function (edge, ah, draw) {
        if (ah === void 0) { ah = 5; }
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== 'undefined') {
            draw(vg2);
        }
        var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
            var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, ah);
            lineData = [route.sourceIntersection, route.arrowStart];
        }
        else {
            var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
            for (var i = n; i >= 0; --i)
                lineData.push(vg2.V[shortestPath[i]].p);
            lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, ah));
        }
        return lineData;
    };
    Layout.getSourceIndex = function (e) {
        return typeof e.source === 'number' ? e.source : e.source.index;
    };
    Layout.getTargetIndex = function (e) {
        return typeof e.target === 'number' ? e.target : e.target.index;
    };
    Layout.linkId = function (e) {
        return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
    };
    Layout.dragStart = function (d) {
        if (isGroup(d)) {
            Layout.storeOffset(d, Layout.dragOrigin(d));
        }
        else {
            Layout.stopNode(d);
            d.fixed |= 2;
        }
    };
    Layout.stopNode = function (v) {
        v.px = v.x;
        v.py = v.y;
    };
    Layout.storeOffset = function (d, origin) {
        if (typeof d.leaves !== 'undefined') {
            d.leaves.forEach(function (v) {
                v.fixed |= 2;
                Layout.stopNode(v);
                v._dragGroupOffsetX = v.x - origin.x;
                v._dragGroupOffsetY = v.y - origin.y;
            });
        }
        if (typeof d.groups !== 'undefined') {
            d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
        }
    };
    Layout.dragOrigin = function (d) {
        if (isGroup(d)) {
            return {
                x: d.bounds.cx(),
                y: d.bounds.cy()
            };
        }
        else {
            return d;
        }
    };
    Layout.drag = function (d, position) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    d.bounds.setXCentre(position.x);
                    d.bounds.setYCentre(position.y);
                    v.px = v._dragGroupOffsetX + position.x;
                    v.py = v._dragGroupOffsetY + position.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.drag(g, position); });
            }
        }
        else {
            d.px = position.x;
            d.py = position.y;
        }
    };
    Layout.dragEnd = function (d) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    Layout.dragEnd(v);
                    delete v._dragGroupOffsetX;
                    delete v._dragGroupOffsetY;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(Layout.dragEnd);
            }
        }
        else {
            d.fixed &= ~6;
        }
    };
    Layout.mouseOver = function (d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
    };
    Layout.mouseOut = function (d) {
        d.fixed &= ~4;
    };
    return Layout;
}());
exports.Layout = Layout;

},{"./descent":7,"./geom":8,"./handledisconnected":10,"./linklengths":13,"./powergraph":14,"./rectangle":17,"./shortestpaths":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortestpaths_1 = require("./shortestpaths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var linklengths_1 = require("./linklengths");
var Link3D = (function () {
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
    }
    Link3D.prototype.actualLength = function (x) {
        var _this = this;
        return Math.sqrt(x.reduce(function (c, v) {
            var dx = v[_this.target] - v[_this.source];
            return c + dx * dx;
        }, 0));
    };
    return Link3D;
}());
exports.Link3D = Link3D;
var Node3D = (function () {
    function Node3D(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Node3D;
}());
exports.Node3D = Node3D;
var Layout3D = (function () {
    function Layout3D(nodes, links, idealLinkLength) {
        if (idealLinkLength === void 0) { idealLinkLength = 1; }
        var _this = this;
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D.k);
        for (var i = 0; i < Layout3D.k; ++i) {
            this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function (v, i) {
            for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                var dim = _a[_i];
                if (typeof v[dim] == 'undefined')
                    v[dim] = Math.random();
            }
            _this.result[0][i] = v.x;
            _this.result[1][i] = v.y;
            _this.result[2][i] = v.z;
        });
    }
    ;
    Layout3D.prototype.linkLength = function (l) {
        return l.actualLength(this.result);
    };
    Layout3D.prototype.start = function (iterations) {
        var _this = this;
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
            linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
        var distanceMatrix = (new shortestpaths_1.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
        var G = descent_1.Descent.createSquareMatrix(n, function () { return 2; });
        this.links.forEach(function (_a) {
            var source = _a.source, target = _a.target;
            return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
            this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        this.descent.run(iterations);
        return this;
    };
    Layout3D.prototype.tick = function () {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        return this.descent.rungeKutta();
    };
    Layout3D.dims = ['x', 'y', 'z'];
    Layout3D.k = Layout3D.dims.length;
    return Layout3D;
}());
exports.Layout3D = Layout3D;
var LinkAccessor = (function () {
    function LinkAccessor() {
    }
    LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
    LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
    LinkAccessor.prototype.getLength = function (e) { return e.length; };
    LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
    return LinkAccessor;
}());

},{"./descent":7,"./linklengths":13,"./rectangle":17,"./shortestpaths":18}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unionCount(a, b) {
    var u = {};
    for (var i in a)
        u[i] = {};
    for (var i in b)
        u[i] = {};
    return Object.keys(u).length;
}
function intersectionCount(a, b) {
    var n = 0;
    for (var i in a)
        if (typeof b[i] !== 'undefined')
            ++n;
    return n;
}
function getNeighbours(links, la) {
    var neighbours = {};
    var addNeighbours = function (u, v) {
        if (typeof neighbours[u] === 'undefined')
            neighbours[u] = {};
        neighbours[u][v] = {};
    };
    links.forEach(function (e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
    });
    return neighbours;
}
function computeLinkLengths(links, w, f, la) {
    var neighbours = getNeighbours(links, la);
    links.forEach(function (l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
    });
}
function symmetricDiffLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
}
exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
function jaccardLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
    }, la);
}
exports.jaccardLinkLengths = jaccardLinkLengths;
function generateDirectedEdgeConstraints(n, links, axis, la) {
    var components = stronglyConnectedComponents(n, links, la);
    var nodes = {};
    components.forEach(function (c, i) {
        return c.forEach(function (v) { return nodes[v] = i; });
    });
    var constraints = [];
    links.forEach(function (l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
            constraints.push({
                axis: axis,
                left: ui,
                right: vi,
                gap: la.getMinSeparation(l)
            });
        }
    });
    return constraints;
}
exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
function stronglyConnectedComponents(numVertices, edges, la) {
    var nodes = [];
    var index = 0;
    var stack = [];
    var components = [];
    function strongConnect(v) {
        v.index = v.lowlink = index++;
        stack.push(v);
        v.onStack = true;
        for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
            var w = _a[_i];
            if (typeof w.index === 'undefined') {
                strongConnect(w);
                v.lowlink = Math.min(v.lowlink, w.lowlink);
            }
            else if (w.onStack) {
                v.lowlink = Math.min(v.lowlink, w.index);
            }
        }
        if (v.lowlink === v.index) {
            var component = [];
            while (stack.length) {
                w = stack.pop();
                w.onStack = false;
                component.push(w);
                if (w === v)
                    break;
            }
            components.push(component.map(function (v) { return v.id; }));
        }
    }
    for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
    }
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
    }
    for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === 'undefined')
            strongConnect(v);
    }
    return components;
}
exports.stronglyConnectedComponents = stronglyConnectedComponents;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PowerEdge = (function () {
    function PowerEdge(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }
    return PowerEdge;
}());
exports.PowerEdge = PowerEdge;
var Configuration = (function () {
    function Configuration(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
            this.initModulesFromGroup(rootGroup);
        }
        else {
            this.roots.push(new ModuleSet());
            for (var i = 0; i < n; ++i)
                this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function (e) {
            var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
            s.outgoing.add(type, t);
            t.incoming.add(type, s);
        });
    }
    Configuration.prototype.initModulesFromGroup = function (group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
            var node = group.leaves[i];
            var module = new Module(node.id);
            this.modules[node.id] = module;
            moduleSet.add(module);
        }
        if (group.groups) {
            for (var j = 0; j < group.groups.length; ++j) {
                var child = group.groups[j];
                var definition = {};
                for (var prop in child)
                    if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                        definition[prop] = child[prop];
                moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
            }
        }
        return moduleSet;
    };
    Configuration.prototype.merge = function (a, b, k) {
        if (k === void 0) { k = 0; }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function (s, i, o) {
            s.forAll(function (ms, linktype) {
                ms.forAll(function (n) {
                    var nls = n[i];
                    nls.add(linktype, m);
                    nls.remove(linktype, a);
                    nls.remove(linktype, b);
                    a[o].remove(linktype, n);
                    b[o].remove(linktype, n);
                });
            });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
    };
    Configuration.prototype.rootMerges = function (k) {
        if (k === void 0) { k = 0; }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
            for (var j = i + 1; j < n; ++j) {
                var a = rs[i], b = rs[j];
                merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                ctr++;
            }
        }
        return merges;
    };
    Configuration.prototype.greedyMerge = function () {
        for (var i = 0; i < this.roots.length; ++i) {
            if (this.roots[i].modules().length < 2)
                continue;
            var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
            var m = ms[0];
            if (m.nEdges >= this.R)
                continue;
            this.merge(m.a, m.b, i);
            return true;
        }
    };
    Configuration.prototype.nEdges = function (a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
    };
    Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function (e) {
            var a = _this.modules[e.source];
            var b = _this.modules[e.target];
            retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
    };
    Configuration.prototype.allEdges = function () {
        var es = [];
        Configuration.getEdges(this.roots[0], es);
        return es;
    };
    Configuration.getEdges = function (modules, es) {
        modules.forAll(function (m) {
            m.getEdges(es);
            Configuration.getEdges(m.children, es);
        });
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function toGroups(modules, group, groups) {
    modules.forAll(function (m) {
        if (m.isLeaf()) {
            if (!group.leaves)
                group.leaves = [];
            group.leaves.push(m.id);
        }
        else {
            var g = group;
            m.gid = groups.length;
            if (!m.isIsland() || m.isPredefined()) {
                g = { id: m.gid };
                if (m.isPredefined())
                    for (var prop in m.definition)
                        g[prop] = m.definition[prop];
                if (!group.groups)
                    group.groups = [];
                group.groups.push(m.gid);
                groups.push(g);
            }
            toGroups(m.children, g, groups);
        }
    });
}
var Module = (function () {
    function Module(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) { outgoing = new LinkSets(); }
        if (incoming === void 0) { incoming = new LinkSets(); }
        if (children === void 0) { children = new ModuleSet(); }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
    }
    Module.prototype.getEdges = function (es) {
        var _this = this;
        this.outgoing.forAll(function (ms, edgetype) {
            ms.forAll(function (target) {
                es.push(new PowerEdge(_this.id, target.id, edgetype));
            });
        });
    };
    Module.prototype.isLeaf = function () {
        return this.children.count() === 0;
    };
    Module.prototype.isIsland = function () {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
    };
    Module.prototype.isPredefined = function () {
        return typeof this.definition !== "undefined";
    };
    return Module;
}());
exports.Module = Module;
function intersection(m, n) {
    var i = {};
    for (var v in m)
        if (v in n)
            i[v] = m[v];
    return i;
}
var ModuleSet = (function () {
    function ModuleSet() {
        this.table = {};
    }
    ModuleSet.prototype.count = function () {
        return Object.keys(this.table).length;
    };
    ModuleSet.prototype.intersection = function (other) {
        var result = new ModuleSet();
        result.table = intersection(this.table, other.table);
        return result;
    };
    ModuleSet.prototype.intersectionCount = function (other) {
        return this.intersection(other).count();
    };
    ModuleSet.prototype.contains = function (id) {
        return id in this.table;
    };
    ModuleSet.prototype.add = function (m) {
        this.table[m.id] = m;
    };
    ModuleSet.prototype.remove = function (m) {
        delete this.table[m.id];
    };
    ModuleSet.prototype.forAll = function (f) {
        for (var mid in this.table) {
            f(this.table[mid]);
        }
    };
    ModuleSet.prototype.modules = function () {
        var vs = [];
        this.forAll(function (m) {
            if (!m.isPredefined())
                vs.push(m);
        });
        return vs;
    };
    return ModuleSet;
}());
exports.ModuleSet = ModuleSet;
var LinkSets = (function () {
    function LinkSets() {
        this.sets = {};
        this.n = 0;
    }
    LinkSets.prototype.count = function () {
        return this.n;
    };
    LinkSets.prototype.contains = function (id) {
        var result = false;
        this.forAllModules(function (m) {
            if (!result && m.id == id) {
                result = true;
            }
        });
        return result;
    };
    LinkSets.prototype.add = function (linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
    };
    LinkSets.prototype.remove = function (linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
            delete this.sets[linktype];
        }
        --this.n;
    };
    LinkSets.prototype.forAll = function (f) {
        for (var linktype in this.sets) {
            f(this.sets[linktype], Number(linktype));
        }
    };
    LinkSets.prototype.forAllModules = function (f) {
        this.forAll(function (ms, lt) { return ms.forAll(f); });
    };
    LinkSets.prototype.intersection = function (other) {
        var result = new LinkSets();
        this.forAll(function (ms, lt) {
            if (lt in other.sets) {
                var i = ms.intersection(other.sets[lt]), n = i.count();
                if (n > 0) {
                    result.sets[lt] = i;
                    result.n += n;
                }
            }
        });
        return result;
    };
    return LinkSets;
}());
exports.LinkSets = LinkSets;
function intersectionCount(m, n) {
    return Object.keys(intersection(m, n)).length;
}
function getGroups(nodes, links, la, rootGroup) {
    var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
    while (c.greedyMerge())
        ;
    var powerEdges = [];
    var g = c.getGroupHierarchy(powerEdges);
    powerEdges.forEach(function (e) {
        var f = function (end) {
            var g = e[end];
            if (typeof g == "number")
                e[end] = nodes[g];
        };
        f("source");
        f("target");
    });
    return { groups: g, powerEdges: powerEdges };
}
exports.getGroups = getGroups;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PairingHeap = (function () {
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
}());
exports.PairingHeap = PairingHeap;
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;

},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TreeBase = (function () {
    function TreeBase() {
        this.findIter = function (data) {
            var res = this._root;
            var iter = this.iterator();
            while (res !== null) {
                var c = this._comparator(data, res.data);
                if (c === 0) {
                    iter._cursor = res;
                    return iter;
                }
                else {
                    iter._ancestors.push(res);
                    res = res.get_child(c > 0);
                }
            }
            return null;
        };
    }
    TreeBase.prototype.clear = function () {
        this._root = null;
        this.size = 0;
    };
    ;
    TreeBase.prototype.find = function (data) {
        var res = this._root;
        while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
                return res.data;
            }
            else {
                res = res.get_child(c > 0);
            }
        }
        return null;
    };
    ;
    TreeBase.prototype.lowerBound = function (data) {
        return this._bound(data, this._comparator);
    };
    ;
    TreeBase.prototype.upperBound = function (data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
            return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
    };
    ;
    TreeBase.prototype.min = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.left !== null) {
            res = res.left;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.max = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.right !== null) {
            res = res.right;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.iterator = function () {
        return new Iterator(this);
    };
    ;
    TreeBase.prototype.each = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype.reach = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype._bound = function (data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
            var c = this._comparator(data, cur.data);
            if (c === 0) {
                iter._cursor = cur;
                return iter;
            }
            iter._ancestors.push(cur);
            cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
            cur = iter._ancestors[i];
            if (cmp(data, cur.data) > 0) {
                iter._cursor = cur;
                iter._ancestors.length = i;
                return iter;
            }
        }
        iter._ancestors.length = 0;
        return iter;
    };
    ;
    return TreeBase;
}());
exports.TreeBase = TreeBase;
var Iterator = (function () {
    function Iterator(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
    }
    Iterator.prototype.data = function () {
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.next = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._minNode(root);
            }
        }
        else {
            if (this._cursor.right === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.right === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._minNode(this._cursor.right);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.prev = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._maxNode(root);
            }
        }
        else {
            if (this._cursor.left === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.left === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._maxNode(this._cursor.left);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype._minNode = function (start) {
        while (start.left !== null) {
            this._ancestors.push(start);
            start = start.left;
        }
        this._cursor = start;
    };
    ;
    Iterator.prototype._maxNode = function (start) {
        while (start.right !== null) {
            this._ancestors.push(start);
            start = start.right;
        }
        this._cursor = start;
    };
    ;
    return Iterator;
}());
exports.Iterator = Iterator;
var Node = (function () {
    function Node(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
    }
    Node.prototype.get_child = function (dir) {
        return dir ? this.right : this.left;
    };
    ;
    Node.prototype.set_child = function (dir, val) {
        if (dir) {
            this.right = val;
        }
        else {
            this.left = val;
        }
    };
    ;
    return Node;
}());
var RBTree = (function (_super) {
    __extends(RBTree, _super);
    function RBTree(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
    }
    RBTree.prototype.insert = function (data) {
        var ret = false;
        if (this._root === null) {
            this._root = new Node(data);
            ret = true;
            this.size++;
        }
        else {
            var head = new Node(undefined);
            var dir = false;
            var last = false;
            var gp = null;
            var ggp = head;
            var p = null;
            var node = this._root;
            ggp.right = this._root;
            while (true) {
                if (node === null) {
                    node = new Node(data);
                    p.set_child(dir, node);
                    ret = true;
                    this.size++;
                }
                else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                    node.red = true;
                    node.left.red = false;
                    node.right.red = false;
                }
                if (RBTree.is_red(node) && RBTree.is_red(p)) {
                    var dir2 = ggp.right === gp;
                    if (node === p.get_child(last)) {
                        ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                    }
                    else {
                        ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                    }
                }
                var cmp = this._comparator(node.data, data);
                if (cmp === 0) {
                    break;
                }
                last = dir;
                dir = cmp < 0;
                if (gp !== null) {
                    ggp = gp;
                }
                gp = p;
                p = node;
                node = node.get_child(dir);
            }
            this._root = head.right;
        }
        this._root.red = false;
        return ret;
    };
    ;
    RBTree.prototype.remove = function (data) {
        if (this._root === null) {
            return false;
        }
        var head = new Node(undefined);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
            var last = dir;
            gp = p;
            p = node;
            node = node.get_child(dir);
            var cmp = this._comparator(data, node.data);
            dir = cmp > 0;
            if (cmp === 0) {
                found = node;
            }
            if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                if (RBTree.is_red(node.get_child(!dir))) {
                    var sr = RBTree.single_rotate(node, dir);
                    p.set_child(last, sr);
                    p = sr;
                }
                else if (!RBTree.is_red(node.get_child(!dir))) {
                    var sibling = p.get_child(!last);
                    if (sibling !== null) {
                        if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                            p.red = false;
                            sibling.red = true;
                            node.red = true;
                        }
                        else {
                            var dir2 = gp.right === p;
                            if (RBTree.is_red(sibling.get_child(last))) {
                                gp.set_child(dir2, RBTree.double_rotate(p, last));
                            }
                            else if (RBTree.is_red(sibling.get_child(!last))) {
                                gp.set_child(dir2, RBTree.single_rotate(p, last));
                            }
                            var gpc = gp.get_child(dir2);
                            gpc.red = true;
                            node.red = true;
                            gpc.left.red = false;
                            gpc.right.red = false;
                        }
                    }
                }
            }
        }
        if (found !== null) {
            found.data = node.data;
            p.set_child(p.right === node, node.get_child(node.left === null));
            this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
            this._root.red = false;
        }
        return found !== null;
    };
    ;
    RBTree.is_red = function (node) {
        return node !== null && node.red;
    };
    RBTree.single_rotate = function (root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
    };
    RBTree.double_rotate = function (root, dir) {
        root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
        return RBTree.single_rotate(root, dir);
    };
    return RBTree;
}(TreeBase));
exports.RBTree = RBTree;

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vpsc_1 = require("./vpsc");
var rbtree_1 = require("./rbtree");
function computeGroupBounds(g) {
    g.bounds = typeof g.leaves !== "undefined" ?
        g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
        Rectangle.empty();
    if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
    g.bounds = g.bounds.inflate(g.padding);
    return g.bounds;
}
exports.computeGroupBounds = computeGroupBounds;
var Rectangle = (function () {
    function Rectangle(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
    }
    Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
    Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
    Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
    Rectangle.prototype.overlapX = function (r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
            return this.X - r.x;
        if (vx <= ux && this.x < r.X)
            return r.X - this.x;
        return 0;
    };
    Rectangle.prototype.overlapY = function (r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
            return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
            return r.Y - this.y;
        return 0;
    };
    Rectangle.prototype.setXCentre = function (cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
    };
    Rectangle.prototype.setYCentre = function (cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
    };
    Rectangle.prototype.width = function () {
        return this.X - this.x;
    };
    Rectangle.prototype.height = function () {
        return this.Y - this.y;
    };
    Rectangle.prototype.union = function (r) {
        return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
    };
    Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
        var sides = [[this.x, this.y, this.X, this.y],
            [this.X, this.y, this.X, this.Y],
            [this.X, this.Y, this.x, this.Y],
            [this.x, this.Y, this.x, this.y]];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
            var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
            if (r !== null)
                intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
    };
    Rectangle.prototype.rayIntersection = function (x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
    };
    Rectangle.prototype.vertices = function () {
        return [
            { x: this.x, y: this.y },
            { x: this.X, y: this.y },
            { x: this.X, y: this.Y },
            { x: this.x, y: this.Y }
        ];
    };
    Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
            return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
            return {
                x: x1 + a * dx12,
                y: y1 + a * dy12
            };
        }
        return null;
    };
    Rectangle.prototype.inflate = function (pad) {
        return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
function makeEdgeBetween(source, target, ah) {
    var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
    return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
    };
}
exports.makeEdgeBetween = makeEdgeBetween;
function makeEdgeTo(s, target, ah) {
    var ti = target.rayIntersection(s.x, s.y);
    if (!ti)
        ti = { x: target.cx(), y: target.cy() };
    var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
    return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
}
exports.makeEdgeTo = makeEdgeTo;
var Node = (function () {
    function Node(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
    }
    return Node;
}());
var Event = (function () {
    function Event(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
    }
    return Event;
}());
function compareEvents(a, b) {
    if (a.pos > b.pos) {
        return 1;
    }
    if (a.pos < b.pos) {
        return -1;
    }
    if (a.isOpen) {
        return -1;
    }
    if (b.isOpen) {
        return 1;
    }
    return 0;
}
function makeRBTree() {
    return new rbtree_1.RBTree(function (a, b) { return a.pos - b.pos; });
}
var xRect = {
    getCentre: function (r) { return r.cx(); },
    getOpen: function (r) { return r.y; },
    getClose: function (r) { return r.Y; },
    getSize: function (r) { return r.width(); },
    makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
    findNeighbours: findXNeighbours
};
var yRect = {
    getCentre: function (r) { return r.cy(); },
    getOpen: function (r) { return r.x; },
    getClose: function (r) { return r.X; },
    getSize: function (r) { return r.height(); },
    makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
    findNeighbours: findYNeighbours
};
function generateGroupConstraints(root, f, minSep, isContained) {
    if (isContained === void 0) { isContained = false; }
    var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
        : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
    if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
    }
    if (ln)
        root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
    if (gn)
        root.groups.forEach(function (g) {
            var b = g.bounds;
            add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
        });
    var cs = generateConstraints(rs, vs, f, minSep);
    if (gn) {
        vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
        cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
        root.groups.forEach(function (g) {
            var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
            g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
            g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
        });
    }
    return childConstraints.concat(cs);
}
function generateConstraints(rs, vars, rect, minSep) {
    var i, n = rs.length;
    var N = 2 * n;
    console.assert(vars.length >= n);
    var events = new Array(N);
    for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
    }
    events.sort(compareEvents);
    var cs = new Array();
    var scanline = makeRBTree();
    for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
            scanline.insert(v);
            rect.findNeighbours(v, scanline);
        }
        else {
            scanline.remove(v);
            var makeConstraint = function (l, r) {
                var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                cs.push(new vpsc_1.Constraint(l.v, r.v, sep));
            };
            var visitNeighbours = function (forward, reverse, mkcon) {
                var u, it = v[forward].iterator();
                while ((u = it[forward]()) !== null) {
                    mkcon(u, v);
                    u[reverse].remove(v);
                }
            };
            visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
            visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
        }
    }
    console.assert(scanline.size === 0);
    return cs;
}
function findXNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
            var uovervX = u.r.overlapX(v.r);
            if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                v[forward].insert(u);
                u[reverse].insert(v);
            }
            if (uovervX <= 0) {
                break;
            }
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function findYNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
            v[forward].insert(u);
            u[reverse].insert(v);
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function generateXConstraints(rs, vars) {
    return generateConstraints(rs, vars, xRect, 1e-6);
}
exports.generateXConstraints = generateXConstraints;
function generateYConstraints(rs, vars) {
    return generateConstraints(rs, vars, yRect, 1e-6);
}
exports.generateYConstraints = generateYConstraints;
function generateXGroupConstraints(root) {
    return generateGroupConstraints(root, xRect, 1e-6);
}
exports.generateXGroupConstraints = generateXGroupConstraints;
function generateYGroupConstraints(root) {
    return generateGroupConstraints(root, yRect, 1e-6);
}
exports.generateYGroupConstraints = generateYGroupConstraints;
function removeOverlaps(rs) {
    var vs = rs.map(function (r) { return new vpsc_1.Variable(r.cx()); });
    var cs = generateXConstraints(rs, vs);
    var solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
    vs = rs.map(function (r) { return new vpsc_1.Variable(r.cy()); });
    cs = generateYConstraints(rs, vs);
    solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
}
exports.removeOverlaps = removeOverlaps;
var IndexedVariable = (function (_super) {
    __extends(IndexedVariable, _super);
    function IndexedVariable(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
    }
    return IndexedVariable;
}(vpsc_1.Variable));
exports.IndexedVariable = IndexedVariable;
var Projection = (function () {
    function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        if (rootGroup === void 0) { rootGroup = null; }
        if (constraints === void 0) { constraints = null; }
        if (avoidOverlaps === void 0) { avoidOverlaps = false; }
        var _this = this;
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function (v, i) {
            return v.variable = new IndexedVariable(i, 1);
        });
        if (constraints)
            this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
            nodes.forEach(function (v) {
                if (!v.width || !v.height) {
                    v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
                    return;
                }
                var w2 = v.width / 2, h2 = v.height / 2;
                v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
            });
            computeGroupBounds(rootGroup);
            var i = nodes.length;
            groups.forEach(function (g) {
                _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            });
        }
    }
    Projection.prototype.createSeparation = function (c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
    };
    Projection.prototype.makeFeasible = function (c) {
        var _this = this;
        if (!this.avoidOverlaps)
            return;
        var axis = 'x', dim = 'width';
        if (c.axis === 'x')
            axis = 'y', dim = 'height';
        var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
        var p = null;
        vs.forEach(function (v) {
            if (p) {
                var nextPos = p[axis] + p[dim];
                if (nextPos > v[axis]) {
                    v[axis] = nextPos;
                }
            }
            p = v;
        });
    };
    Projection.prototype.createAlignment = function (c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function (o) {
            var v = _this.nodes[o.node].variable;
            cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
    };
    Projection.prototype.createConstraints = function (constraints) {
        var _this = this;
        var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
        this.xConstraints = constraints
            .filter(function (c) { return c.axis === "x" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        this.yConstraints = constraints
            .filter(function (c) { return c.axis === "y" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        constraints
            .filter(function (c) { return c.type === 'alignment'; })
            .forEach(function (c) { return _this.createAlignment(c); });
    };
    Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
        this.nodes.forEach(function (v, i) {
            if (v.fixed) {
                v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                desired[i] = getDesired(v);
            }
            else {
                v.variable.weight = 1;
            }
            var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
            var ix = x0[i], iy = y0[i];
            v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
    };
    Projection.prototype.xProject = function (x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
            return;
        this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
            var xmin = x[g.minVar.index] = g.minVar.position();
            var xmax = x[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.x = xmin - p2;
            g.bounds.X = xmax + p2;
        });
    };
    Projection.prototype.yProject = function (x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
            return;
        this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
            var ymin = y[g.minVar.index] = g.minVar.position();
            var ymax = y[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.y = ymin - p2;
            ;
            g.bounds.Y = ymax + p2;
        });
    };
    Projection.prototype.projectFunctions = function () {
        var _this = this;
        return [
            function (x0, y0, x) { return _this.xProject(x0, y0, x); },
            function (x0, y0, y) { return _this.yProject(x0, y0, y); }
        ];
    };
    Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
            computeGroupBounds(this.rootGroup);
            cs = cs.concat(generateConstraints(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
            this.groups.forEach(updateGroupBounds);
            computeGroupBounds(this.rootGroup);
        }
    };
    Projection.prototype.solve = function (vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
    };
    return Projection;
}());
exports.Projection = Projection;

},{"./rbtree":16,"./vpsc":19}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pqueue_1 = require("./pqueue");
var Neighbour = (function () {
    function Neighbour(id, distance) {
        this.id = id;
        this.distance = distance;
    }
    return Neighbour;
}());
var Node = (function () {
    function Node(id) {
        this.id = id;
        this.neighbours = [];
    }
    return Node;
}());
var QueueEntry = (function () {
    function QueueEntry(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
    }
    return QueueEntry;
}());
var Calculator = (function () {
    function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
            this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
            var e = this.es[i];
            var u = getSourceIndex(e), v = getTargetIndex(e);
            var d = getLength(e);
            this.neighbours[u].neighbours.push(new Neighbour(v, d));
            this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
    }
    Calculator.prototype.DistanceMatrix = function () {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            D[i] = this.dijkstraNeighbours(i);
        }
        return D;
    };
    Calculator.prototype.DistancesFromNode = function (start) {
        return this.dijkstraNeighbours(start);
    };
    Calculator.prototype.PathFromNodeToNode = function (start, end) {
        return this.dijkstraNeighbours(start, end);
    };
    Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
            qu = q.pop();
            u = qu.node;
            if (u.id === end) {
                break;
            }
            var i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                if (qu.prev && v.id === qu.prev.node.id)
                    continue;
                var viduid = v.id + ',' + u.id;
                if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                    continue;
                var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                visitedFrom[viduid] = t;
                q.push(new QueueEntry(v, qu, t));
            }
        }
        var path = [];
        while (qu.prev) {
            qu = qu.prev;
            path.push(qu.node.id);
        }
        return path;
    };
    Calculator.prototype.dijkstraNeighbours = function (start, dest) {
        if (dest === void 0) { dest = -1; }
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
            var node = this.neighbours[i];
            node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
            node.q = q.push(node);
        }
        while (!q.empty()) {
            var u = q.pop();
            d[u.id] = u.d;
            if (u.id === dest) {
                var path = [];
                var v = u;
                while (typeof v.prev !== 'undefined') {
                    path.push(v.prev.id);
                    v = v.prev;
                }
                return path;
            }
            i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i];
                var v = this.neighbours[neighbour.id];
                var t = u.d + neighbour.distance;
                if (u.d !== Number.MAX_VALUE && v.d > t) {
                    v.d = t;
                    v.prev = u;
                    q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                }
            }
        }
        return d;
    };
    return Calculator;
}());
exports.Calculator = Calculator;

},{"./pqueue":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PositionStats = (function () {
    function PositionStats(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
    }
    PositionStats.prototype.addVariable = function (v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
    };
    PositionStats.prototype.getPosn = function () {
        return (this.AD - this.AB) / this.A2;
    };
    return PositionStats;
}());
exports.PositionStats = PositionStats;
var Constraint = (function () {
    function Constraint(left, right, gap, equality) {
        if (equality === void 0) { equality = false; }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
    }
    Constraint.prototype.slack = function () {
        return this.unsatisfiable ? Number.MAX_VALUE
            : this.right.scale * this.right.position() - this.gap
                - this.left.scale * this.left.position();
    };
    return Constraint;
}());
exports.Constraint = Constraint;
var Variable = (function () {
    function Variable(desiredPosition, weight, scale) {
        if (weight === void 0) { weight = 1; }
        if (scale === void 0) { scale = 1; }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
    }
    Variable.prototype.dfdv = function () {
        return 2.0 * this.weight * (this.position() - this.desiredPosition);
    };
    Variable.prototype.position = function () {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
    };
    Variable.prototype.visitNeighbours = function (prev, f) {
        var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
        this.cOut.forEach(function (c) { return ff(c, c.right); });
        this.cIn.forEach(function (c) { return ff(c, c.left); });
    };
    return Variable;
}());
exports.Variable = Variable;
var Block = (function () {
    function Block(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
    }
    Block.prototype.addVariable = function (v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.updateWeightedPosition = function () {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
            this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.compute_lm = function (v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function (c, next) {
            var _dfdv = _this.compute_lm(next, v, postAction);
            if (next === c.right) {
                dfdv += _dfdv * c.left.scale;
                c.lm = _dfdv;
            }
            else {
                dfdv += _dfdv * c.right.scale;
                c.lm = -_dfdv;
            }
            postAction(c);
        });
        return dfdv / v.scale;
    };
    Block.prototype.populateSplitBlock = function (v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function (c, next) {
            next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
            _this.addVariable(next);
            _this.populateSplitBlock(next, v);
        });
    };
    Block.prototype.traverse = function (visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) { v = this.vars[0]; }
        if (prev === void 0) { prev = null; }
        v.visitNeighbours(prev, function (c, next) {
            acc.push(visit(c));
            _this.traverse(visit, acc, next, v);
        });
    };
    Block.prototype.findMinLM = function () {
        var m = null;
        this.compute_lm(this.vars[0], null, function (c) {
            if (!c.equality && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findMinLMBetween = function (lv, rv) {
        this.compute_lm(lv, null, function () { });
        var m = null;
        this.findPath(lv, null, rv, function (c, next) {
            if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findPath = function (v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function (c, next) {
            if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                endFound = true;
                visit(c, next);
            }
        });
        return endFound;
    };
    Block.prototype.isActiveDirectedPathBetween = function (u, v) {
        if (u === v)
            return true;
        var i = u.cOut.length;
        while (i--) {
            var c = u.cOut[i];
            if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                return true;
        }
        return false;
    };
    Block.split = function (c) {
        c.active = false;
        return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
    };
    Block.createSplitBlock = function (startVar) {
        var b = new Block(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
    };
    Block.prototype.splitBetween = function (vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
            var bs = Block.split(c);
            return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
    };
    Block.prototype.mergeAcross = function (b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
            var v = b.vars[i];
            v.offset += dist;
            this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
    };
    Block.prototype.cost = function () {
        var sum = 0, i = this.vars.length;
        while (i--) {
            var v = this.vars[i], d = v.position() - v.desiredPosition;
            sum += d * d * v.weight;
        }
        return sum;
    };
    return Block;
}());
exports.Block = Block;
var Blocks = (function () {
    function Blocks(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
            var b = new Block(vs[n]);
            this.list[n] = b;
            b.blockInd = n;
        }
    }
    Blocks.prototype.cost = function () {
        var sum = 0, i = this.list.length;
        while (i--)
            sum += this.list[i].cost();
        return sum;
    };
    Blocks.prototype.insert = function (b) {
        b.blockInd = this.list.length;
        this.list.push(b);
    };
    Blocks.prototype.remove = function (b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
            this.list[b.blockInd] = swapBlock;
            swapBlock.blockInd = b.blockInd;
        }
    };
    Blocks.prototype.merge = function (c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
            r.mergeAcross(l, c, dist);
            this.remove(l);
        }
        else {
            l.mergeAcross(r, c, -dist);
            this.remove(r);
        }
    };
    Blocks.prototype.forEach = function (f) {
        this.list.forEach(f);
    };
    Blocks.prototype.updateBlockPositions = function () {
        this.list.forEach(function (b) { return b.updateWeightedPosition(); });
    };
    Blocks.prototype.split = function (inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function (b) {
            var v = b.findMinLM();
            if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                b = v.left.block;
                Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                _this.remove(b);
                inactive.push(v);
            }
        });
    };
    return Blocks;
}());
exports.Blocks = Blocks;
var Solver = (function () {
    function Solver(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function (v) {
            v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function (c) {
            c.left.cOut.push(c);
            c.right.cIn.push(c);
        });
        this.inactive = cs.map(function (c) { c.active = false; return c; });
        this.bs = null;
    }
    Solver.prototype.cost = function () {
        return this.bs.cost();
    };
    Solver.prototype.setStartingPositions = function (ps) {
        this.inactive = this.cs.map(function (c) { c.active = false; return c; });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
    };
    Solver.prototype.setDesiredPositions = function (ps) {
        this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
    };
    Solver.prototype.mostViolated = function () {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
            var c = l[i];
            if (c.unsatisfiable)
                continue;
            var slack = c.slack();
            if (c.equality || slack < minSlack) {
                minSlack = slack;
                v = c;
                deletePoint = i;
                if (c.equality)
                    break;
            }
        }
        if (deletePoint !== n &&
            (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
            l[deletePoint] = l[n - 1];
            l.length = n - 1;
        }
        return v;
    };
    Solver.prototype.satisfy = function () {
        if (this.bs == null) {
            this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
            var lb = v.left.block, rb = v.right.block;
            if (lb !== rb) {
                this.bs.merge(v);
            }
            else {
                if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                    v.unsatisfiable = true;
                    continue;
                }
                var split = lb.splitBetween(v.left, v.right);
                if (split !== null) {
                    this.bs.insert(split.lb);
                    this.bs.insert(split.rb);
                    this.bs.remove(lb);
                    this.inactive.push(split.constraint);
                }
                else {
                    v.unsatisfiable = true;
                    continue;
                }
                if (v.slack() >= 0) {
                    this.inactive.push(v);
                }
                else {
                    this.bs.merge(v);
                }
            }
        }
    };
    Solver.prototype.solve = function () {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 0.0001) {
            this.satisfy();
            lastcost = cost;
            cost = this.bs.cost();
        }
        return cost;
    };
    Solver.LAGRANGIAN_TOLERANCE = -1e-4;
    Solver.ZERO_UPPERBOUND = -1e-10;
    return Solver;
}());
exports.Solver = Solver;
function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
    var vs = spans.map(function (s) { return new Variable(s.desiredCenter); });
    var cs = [];
    var n = spans.length;
    for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
    }
    var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
    var vLower = null, vUpper = null;
    if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1000);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
    }
    if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1000);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
    }
    var solver = new Solver(vs, cs);
    solver.solve();
    return {
        newCenters: vs.slice(0, spans.length).map(function (v) { return v.position(); }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
    };
}
exports.removeOverlapInOneDimension = removeOverlapInOneDimension;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvYWRhcHRvci5qcyIsImRpc3Qvc3JjL2JhdGNoLmpzIiwiZGlzdC9zcmMvZDNhZGFwdG9yLmpzIiwiZGlzdC9zcmMvZDN2M2FkYXB0b3IuanMiLCJkaXN0L3NyYy9kM3Y0YWRhcHRvci5qcyIsImRpc3Qvc3JjL2Rlc2NlbnQuanMiLCJkaXN0L3NyYy9nZW9tLmpzIiwiZGlzdC9zcmMvZ3JpZHJvdXRlci5qcyIsImRpc3Qvc3JjL2hhbmRsZWRpc2Nvbm5lY3RlZC5qcyIsImRpc3Qvc3JjL2xheW91dC5qcyIsImRpc3Qvc3JjL2xheW91dDNkLmpzIiwiZGlzdC9zcmMvbGlua2xlbmd0aHMuanMiLCJkaXN0L3NyYy9wb3dlcmdyYXBoLmpzIiwiZGlzdC9zcmMvcHF1ZXVlLmpzIiwiZGlzdC9zcmMvcmJ0cmVlLmpzIiwiZGlzdC9zcmMvcmVjdGFuZ2xlLmpzIiwiZGlzdC9zcmMvc2hvcnRlc3RwYXRocy5qcyIsImRpc3Qvc3JjL3Zwc2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1aUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIF9fZXhwb3J0KG0pIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmICghZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvYWRhcHRvclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZDNhZGFwdG9yXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9kZXNjZW50XCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9nZW9tXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9ncmlkcm91dGVyXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9oYW5kbGVkaXNjb25uZWN0ZWRcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xheW91dFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvbGF5b3V0M2RcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xpbmtsZW5ndGhzXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9wb3dlcmdyYXBoXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9wcXVldWVcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL3JidHJlZVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcmVjdGFuZ2xlXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9zaG9ydGVzdHBhdGhzXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy92cHNjXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9iYXRjaFwiKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lhVzVrWlhndWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk5WFpXSkRiMnhoTDJsdVpHVjRMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN08wRkJRVUVzYlVOQlFUWkNPMEZCUXpkQ0xIRkRRVUVyUWp0QlFVTXZRaXh0UTBGQk5rSTdRVUZETjBJc1owTkJRVEJDTzBGQlF6RkNMSE5EUVVGblF6dEJRVU5vUXl3NFEwRkJkME03UVVGRGVFTXNhME5CUVRSQ08wRkJRelZDTEc5RFFVRTRRanRCUVVNNVFpeDFRMEZCYVVNN1FVRkRha01zYzBOQlFXZERPMEZCUTJoRExHdERRVUUwUWp0QlFVTTFRaXhyUTBGQk5FSTdRVUZETlVJc2NVTkJRU3RDTzBGQlF5OUNMSGxEUVVGdFF6dEJRVU51UXl4blEwRkJNRUk3UVVGRE1VSXNhVU5CUVRKQ0luMD0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIExheW91dEFkYXB0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhMYXlvdXRBZGFwdG9yLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIExheW91dEFkYXB0b3Iob3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICB2YXIgc2VsZiA9IF90aGlzO1xuICAgICAgICB2YXIgbyA9IG9wdGlvbnM7XG4gICAgICAgIGlmIChvLnRyaWdnZXIpIHtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIgPSBvLnRyaWdnZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8ua2ljaykge1xuICAgICAgICAgICAgX3RoaXMua2ljayA9IG8ua2ljaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoby5kcmFnKSB7XG4gICAgICAgICAgICBfdGhpcy5kcmFnID0gby5kcmFnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvLm9uKSB7XG4gICAgICAgICAgICBfdGhpcy5vbiA9IG8ub247XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuZHJhZ3N0YXJ0ID0gX3RoaXMuZHJhZ1N0YXJ0ID0gbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydDtcbiAgICAgICAgX3RoaXMuZHJhZ2VuZCA9IF90aGlzLmRyYWdFbmQgPSBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGUpIHsgfTtcbiAgICA7XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICA7XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUuZHJhZyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICA7XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikgeyByZXR1cm4gdGhpczsgfTtcbiAgICA7XG4gICAgcmV0dXJuIExheW91dEFkYXB0b3I7XG59KGxheW91dF8xLkxheW91dCkpO1xuZXhwb3J0cy5MYXlvdXRBZGFwdG9yID0gTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGFkYXB0b3Iob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgTGF5b3V0QWRhcHRvcihvcHRpb25zKTtcbn1cbmV4cG9ydHMuYWRhcHRvciA9IGFkYXB0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lZV1JoY0hSdmNpNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDJGa1lYQjBiM0l1ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenM3T3pzN08wRkJRVUVzYlVOQlFXbEVPMEZCUlRkRE8wbEJRVzFETEdsRFFVRk5PMGxCWVhKRExIVkNRVUZoTEU5QlFVODdVVUZCY0VJc1dVRkRTU3hwUWtGQlR5eFRRWGxDVmp0UlFYSkNSeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eExRVUZKTEVOQlFVTTdVVUZEYUVJc1NVRkJTU3hEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETzFGQlJXaENMRVZCUVVVc1EwRkJReXhEUVVGRkxFTkJRVU1zUTBGQlF5eFBRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1MwRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRPMUZCUXpkQ0xFTkJRVU03VVVGRlJDeEZRVUZGTEVOQlFVTXNRMEZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTeXhEUVVGRExFTkJRVUVzUTBGQlF6dFpRVU5XTEV0QlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF6dFJRVU4yUWl4RFFVRkRPMUZCUlVRc1JVRkJSU3hEUVVGRExFTkJRVVVzUTBGQlF5eERRVUZETEVsQlFVc3NRMEZCUXl4RFFVRkJMRU5CUVVNN1dVRkRWaXhMUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkRka0lzUTBGQlF6dFJRVVZFTEVWQlFVVXNRMEZCUXl4RFFVRkZMRU5CUVVNc1EwRkJReXhGUVVGSExFTkJRVU1zUTBGQlFTeERRVUZETzFsQlExSXNTMEZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEyNUNMRU5CUVVNN1VVRkZSQ3hMUVVGSkxFTkJRVU1zVTBGQlV5eEhRVUZITEV0QlFVa3NRMEZCUXl4VFFVRlRMRWRCUVVjc1pVRkJUU3hEUVVGRExGTkJRVk1zUTBGQlF6dFJRVU51UkN4TFFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFdEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NaVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJRenM3U1VGRGFrUXNRMEZCUXp0SlFYQkRSQ3dyUWtGQlR5eEhRVUZRTEZWQlFWRXNRMEZCVVN4SlFVRkhMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJRM0pDTERSQ1FVRkpMRWRCUVVvc1kwRkJVU3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5XTERSQ1FVRkpMRWRCUVVvc1kwRkJVU3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5XTERCQ1FVRkZMRWRCUVVZc1ZVRkJSeXhUUVVFMlFpeEZRVUZGTEZGQlFXOUNMRWxCUVZjc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCYTBOd1JpeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRRMFFzUTBGQmJVTXNaVUZCVFN4SFFYZERlRU03UVVGNFExa3NjME5CUVdFN1FVRTJRekZDTEdsQ1FVRjVRaXhQUVVGUE8wbEJRelZDTEUxQlFVMHNRMEZCUXl4SlFVRkpMR0ZCUVdFc1EwRkJSU3hQUVVGUExFTkJRVVVzUTBGQlF6dEJRVU40UXl4RFFVRkRPMEZCUmtRc01FSkJSVU1pZlE9PSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIGdyaWRyb3V0ZXJfMSA9IHJlcXVpcmUoXCIuL2dyaWRyb3V0ZXJcIik7XG5mdW5jdGlvbiBncmlkaWZ5KHBnTGF5b3V0LCBudWRnZUdhcCwgbWFyZ2luLCBncm91cE1hcmdpbikge1xuICAgIHBnTGF5b3V0LmNvbGEuc3RhcnQoMCwgMCwgMCwgMTAsIGZhbHNlKTtcbiAgICB2YXIgZ3JpZHJvdXRlciA9IHJvdXRlKHBnTGF5b3V0LmNvbGEubm9kZXMoKSwgcGdMYXlvdXQuY29sYS5ncm91cHMoKSwgbWFyZ2luLCBncm91cE1hcmdpbik7XG4gICAgcmV0dXJuIGdyaWRyb3V0ZXIucm91dGVFZGdlcyhwZ0xheW91dC5wb3dlckdyYXBoLnBvd2VyRWRnZXMsIG51ZGdlR2FwLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2Uucm91dGVyTm9kZS5pZDsgfSwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0LnJvdXRlck5vZGUuaWQ7IH0pO1xufVxuZXhwb3J0cy5ncmlkaWZ5ID0gZ3JpZGlmeTtcbmZ1bmN0aW9uIHJvdXRlKG5vZGVzLCBncm91cHMsIG1hcmdpbiwgZ3JvdXBNYXJnaW4pIHtcbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQucm91dGVyTm9kZSA9IHtcbiAgICAgICAgICAgIG5hbWU6IGQubmFtZSxcbiAgICAgICAgICAgIGJvdW5kczogZC5ib3VuZHMuaW5mbGF0ZSgtbWFyZ2luKVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQucm91dGVyTm9kZSA9IHtcbiAgICAgICAgICAgIGJvdW5kczogZC5ib3VuZHMuaW5mbGF0ZSgtZ3JvdXBNYXJnaW4pLFxuICAgICAgICAgICAgY2hpbGRyZW46ICh0eXBlb2YgZC5ncm91cHMgIT09ICd1bmRlZmluZWQnID8gZC5ncm91cHMubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBub2Rlcy5sZW5ndGggKyBjLmlkOyB9KSA6IFtdKVxuICAgICAgICAgICAgICAgIC5jb25jYXQodHlwZW9mIGQubGVhdmVzICE9PSAndW5kZWZpbmVkJyA/IGQubGVhdmVzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5pbmRleDsgfSkgOiBbXSlcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgZ3JpZFJvdXRlck5vZGVzID0gbm9kZXMuY29uY2F0KGdyb3VwcykubWFwKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIGQucm91dGVyTm9kZS5pZCA9IGk7XG4gICAgICAgIHJldHVybiBkLnJvdXRlck5vZGU7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBncmlkcm91dGVyXzEuR3JpZFJvdXRlcihncmlkUm91dGVyTm9kZXMsIHtcbiAgICAgICAgZ2V0Q2hpbGRyZW46IGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmNoaWxkcmVuOyB9LFxuICAgICAgICBnZXRCb3VuZHM6IGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmJvdW5kczsgfVxuICAgIH0sIG1hcmdpbiAtIGdyb3VwTWFyZ2luKTtcbn1cbmZ1bmN0aW9uIHBvd2VyR3JhcGhHcmlkTGF5b3V0KGdyYXBoLCBzaXplLCBncm91cHBhZGRpbmcpIHtcbiAgICB2YXIgcG93ZXJHcmFwaDtcbiAgICBncmFwaC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiB2LmluZGV4ID0gaTsgfSk7XG4gICAgbmV3IGxheW91dF8xLkxheW91dCgpXG4gICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcbiAgICAgICAgLnBvd2VyR3JhcGhHcm91cHMoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcG93ZXJHcmFwaCA9IGQ7XG4gICAgICAgIHBvd2VyR3JhcGguZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucGFkZGluZyA9IGdyb3VwcGFkZGluZzsgfSk7XG4gICAgfSk7XG4gICAgdmFyIG4gPSBncmFwaC5ub2Rlcy5sZW5ndGg7XG4gICAgdmFyIGVkZ2VzID0gW107XG4gICAgdmFyIHZzID0gZ3JhcGgubm9kZXMuc2xpY2UoMCk7XG4gICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5pbmRleCA9IGk7IH0pO1xuICAgIHBvd2VyR3JhcGguZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgdmFyIHNvdXJjZUluZCA9IGcuaW5kZXggPSBnLmlkICsgbjtcbiAgICAgICAgdnMucHVzaChnKTtcbiAgICAgICAgaWYgKHR5cGVvZiBnLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICBnLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBzb3VyY2VJbmQsIHRhcmdldDogdi5pbmRleCB9KTsgfSk7XG4gICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ2cpIHsgcmV0dXJuIGVkZ2VzLnB1c2goeyBzb3VyY2U6IHNvdXJjZUluZCwgdGFyZ2V0OiBnZy5pZCArIG4gfSk7IH0pO1xuICAgIH0pO1xuICAgIHBvd2VyR3JhcGgucG93ZXJFZGdlcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGVkZ2VzLnB1c2goeyBzb3VyY2U6IGUuc291cmNlLmluZGV4LCB0YXJnZXQ6IGUudGFyZ2V0LmluZGV4IH0pO1xuICAgIH0pO1xuICAgIG5ldyBsYXlvdXRfMS5MYXlvdXQoKVxuICAgICAgICAuc2l6ZShzaXplKVxuICAgICAgICAubm9kZXModnMpXG4gICAgICAgIC5saW5rcyhlZGdlcylcbiAgICAgICAgLmF2b2lkT3ZlcmxhcHMoZmFsc2UpXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApXG4gICAgICAgIC5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMoNSlcbiAgICAgICAgLmNvbnZlcmdlbmNlVGhyZXNob2xkKDFlLTQpXG4gICAgICAgIC5zdGFydCgxMDAsIDAsIDAsIDAsIGZhbHNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2xhOiBuZXcgbGF5b3V0XzEuTGF5b3V0KClcbiAgICAgICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS0zKVxuICAgICAgICAgICAgLnNpemUoc2l6ZSlcbiAgICAgICAgICAgIC5hdm9pZE92ZXJsYXBzKHRydWUpXG4gICAgICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXG4gICAgICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgICAgICAuZ3JvdXBDb21wYWN0bmVzcygxZS00KVxuICAgICAgICAgICAgLmxpbmtEaXN0YW5jZSgzMClcbiAgICAgICAgICAgIC5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMoNSlcbiAgICAgICAgICAgIC5wb3dlckdyYXBoR3JvdXBzKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBwb3dlckdyYXBoID0gZDtcbiAgICAgICAgICAgIHBvd2VyR3JhcGguZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2LnBhZGRpbmcgPSBncm91cHBhZGRpbmc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuc3RhcnQoNTAsIDAsIDEwMCwgMCwgZmFsc2UpLFxuICAgICAgICBwb3dlckdyYXBoOiBwb3dlckdyYXBoXG4gICAgfTtcbn1cbmV4cG9ydHMucG93ZXJHcmFwaEdyaWRMYXlvdXQgPSBwb3dlckdyYXBoR3JpZExheW91dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVltRjBZMmd1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXVMaTh1TGk5WFpXSkRiMnhoTDNOeVl5OWlZWFJqYUM1MGN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU96dEJRVUZCTEcxRFFVRXlRenRCUVVNelF5d3lRMEZCZFVNN1FVRlJka01zYVVKQlFYZENMRkZCUVZFc1JVRkJSU3hSUVVGblFpeEZRVUZGTEUxQlFXTXNSVUZCUlN4WFFVRnRRanRKUVVOdVJpeFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGVFTXNTVUZCU1N4VlFVRlZMRWRCUVVjc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRVZCUVVVc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlN4TlFVRk5MRVZCUVVVc1YwRkJWeXhEUVVGRExFTkJRVU03U1VGRE0wWXNUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhWUVVGVkxFTkJRVTBzVVVGQlVTeERRVUZETEZWQlFWVXNRMEZCUXl4VlFVRlZMRVZCUVVVc1VVRkJVU3hGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeEZRVUYwUWl4RFFVRnpRaXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeEZRVUYwUWl4RFFVRnpRaXhEUVVGRExFTkJRVU03UVVGRGVFa3NRMEZCUXp0QlFVcEVMREJDUVVsRE8wRkJSVVFzWlVGQlpTeExRVUZMTEVWQlFVVXNUVUZCVFN4RlFVRkZMRTFCUVdNc1JVRkJSU3hYUVVGdFFqdEpRVU0zUkN4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFJRVU5ZTEVOQlFVTXNRMEZCUXl4VlFVRlZMRWRCUVZFN1dVRkRhRUlzU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpPMWxCUTFvc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xTkJRM0JETEVOQlFVTTdTVUZEVGl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOSUxFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMUZCUTFvc1EwRkJReXhEUVVGRExGVkJRVlVzUjBGQlVUdFpRVU5vUWl4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4WFFVRlhMRU5CUVVNN1dVRkRkRU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFXNUNMRU5CUVcxQ0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMmxDUVVOdVJpeE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGUUxFTkJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1UwRkRhRVlzUTBGQlF6dEpRVU5PTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTBnc1NVRkJTU3hsUVVGbExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0UlFVTm9SQ3hEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRjRUlzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNN1NVRkRlRUlzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3gxUWtGQlZTeERRVUZETEdWQlFXVXNSVUZCUlR0UlFVTnVReXhYUVVGWExFVkJRVVVzVlVGQlF5eERRVUZOTEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1VVRkJVU3hGUVVGV0xFTkJRVlU3VVVGRGJrTXNVMEZCVXl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJPMHRCUXpOQ0xFVkJRVVVzVFVGQlRTeEhRVUZITEZkQlFWY3NRMEZCUXl4RFFVRkRPMEZCUXpkQ0xFTkJRVU03UVVGRlJDdzRRa0ZEU1N4TFFVRTJReXhGUVVNM1F5eEpRVUZqTEVWQlEyUXNXVUZCYjBJN1NVRkhjRUlzU1VGQlNTeFZRVUZWTEVOQlFVTTdTVUZEWml4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUXl4RFFVRkRMRWxCUVVzc1QwRkJUU3hEUVVGRkxFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCYkVJc1EwRkJhMElzUTBGQlF5eERRVUZETzBsQlEycEVMRWxCUVVrc1pVRkJUU3hGUVVGRk8xTkJRMUFzWVVGQllTeERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTndRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTnNRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTnNRaXhuUWtGQlowSXNRMEZCUXl4VlFVRlZMRU5CUVVNN1VVRkRla0lzVlVGQlZTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm1MRlZCUVZVc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFOUJRVThzUjBGQlJ5eFpRVUZaTEVWQlFYaENMRU5CUVhkQ0xFTkJRVU1zUTBGQlF6dEpRVU0xUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVsUUxFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRE8wbEJRek5DTEVsQlFVa3NTMEZCU3l4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVObUxFbEJRVWtzUlVGQlJTeEhRVUZITEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6bENMRVZCUVVVc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVUwc1EwRkJSU3hEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVWQlFXeENMRU5CUVd0Q0xFTkJRVU1zUTBGQlF6dEpRVU42UXl4VlFVRlZMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEZGtJc1NVRkJTU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU51UXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExZ3NSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXp0WlFVTm9ReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4TlFVRk5MRVZCUVVVc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJiRVFzUTBGQmEwUXNRMEZCUXl4RFFVRkRPMUZCUXpsRkxFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU03V1VGRGFFTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeEZRVUZGTEVsQlFVa3NUMEZCUVN4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzVFVGQlRTeEZRVUZGTEZOQlFWTXNSVUZCUlN4TlFVRk5MRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRndSQ3hEUVVGdlJDeERRVUZETEVOQlFVTTdTVUZEY2tZc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03VVVGRE0wSXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRMjVGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUjBnc1NVRkJTU3hsUVVGTkxFVkJRVVU3VTBGRFVDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMU5CUTFZc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF6dFRRVU5VTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNN1UwRkRXaXhoUVVGaExFTkJRVU1zUzBGQlN5eERRVUZETzFOQlEzQkNMRmxCUVZrc1EwRkJReXhGUVVGRkxFTkJRVU03VTBGRGFFSXNkMEpCUVhkQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6TkNMRzlDUVVGdlFpeERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTXhRaXhMUVVGTExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBsQlMyaERMRTFCUVUwc1EwRkJRenRSUVVOSUxFbEJRVWtzUlVGRFFTeEpRVUZKTEdWQlFVMHNSVUZCUlR0aFFVTllMRzlDUVVGdlFpeERRVUZETEVsQlFVa3NRMEZCUXp0aFFVTXhRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzJGQlExWXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJRenRoUVVOdVFpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJRenRoUVVOc1FpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJRenRoUVVWc1FpeG5Ra0ZCWjBJc1EwRkJReXhKUVVGSkxFTkJRVU03WVVGRGRFSXNXVUZCV1N4RFFVRkRMRVZCUVVVc1EwRkJRenRoUVVOb1FpeDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRE0wSXNaMEpCUVdkQ0xFTkJRVU1zVlVGQlZTeERRVUZETzFsQlEzcENMRlZCUVZVc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFppeFZRVUZWTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU03WjBKQlEycERMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzV1VGQldTeERRVUZCTzFsQlF6VkNMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMUFzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNN1VVRkRiRU1zVlVGQlZTeEZRVUZGTEZWQlFWVTdTMEZEZWtJc1EwRkJRenRCUVVOT0xFTkJRVU03UVVGeVJVUXNiMFJCY1VWREluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkM3YzID0gcmVxdWlyZShcIi4vZDN2M2FkYXB0b3JcIik7XG52YXIgZDN2NCA9IHJlcXVpcmUoXCIuL2QzdjRhZGFwdG9yXCIpO1xuO1xuZnVuY3Rpb24gZDNhZGFwdG9yKGQzQ29udGV4dCkge1xuICAgIGlmICghZDNDb250ZXh0IHx8IGlzRDNWMyhkM0NvbnRleHQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgZDN2My5EM1N0eWxlTGF5b3V0QWRhcHRvcigpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IGQzdjQuRDNTdHlsZUxheW91dEFkYXB0b3IoZDNDb250ZXh0KTtcbn1cbmV4cG9ydHMuZDNhZGFwdG9yID0gZDNhZGFwdG9yO1xuZnVuY3Rpb24gaXNEM1YzKGQzQ29udGV4dCkge1xuICAgIHZhciB2M2V4cCA9IC9eM1xcLi87XG4gICAgcmV0dXJuIGQzQ29udGV4dC52ZXJzaW9uICYmIGQzQ29udGV4dC52ZXJzaW9uLm1hdGNoKHYzZXhwKSAhPT0gbnVsbDtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETmhaR0Z3ZEc5eUxtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTWlPbHNpTGk0dkxpNHZWMlZpUTI5c1lTOXpjbU12WkROaFpHRndkRzl5TG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJRVUVzYjBOQlFYRkRPMEZCUTNKRExHOURRVUZ4UXp0QlFVZFZMRU5CUVVNN1FVRTBRbWhFTEcxQ1FVRXdRaXhUUVVGM1F6dEpRVU01UkN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zU1VGQlNTeE5RVUZOTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhETEUxQlFVMHNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNSVUZCUlN4RFFVRkRPMGxCUXpORExFTkJRVU03U1VGRFJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1FVRkRjRVFzUTBGQlF6dEJRVXhFTERoQ1FVdERPMEZCUlVRc1owSkJRV2RDTEZOQlFYVkRPMGxCUTI1RUxFbEJRVTBzUzBGQlN5eEhRVUZITEUxQlFVMHNRMEZCUXp0SlFVTnlRaXhOUVVGTkxFTkJRVThzVTBGQlZTeERRVUZETEU5QlFVOHNTVUZCVlN4VFFVRlZMRU5CUVVNc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNN1FVRkRkRVlzUTBGQlF5SjkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIEQzU3R5bGVMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRDNTdHlsZUxheW91dEFkYXB0b3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRDNTdHlsZUxheW91dEFkYXB0b3IoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDMuZGlzcGF0Y2gobGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5zdGFydF0sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUudGlja10sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuZW5kXSk7XG4gICAgICAgIHZhciBkM2xheW91dCA9IF90aGlzO1xuICAgICAgICB2YXIgZHJhZztcbiAgICAgICAgX3RoaXMuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZHJhZykge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5vcmlnaW4obGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImRyYWdzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDMuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZDNldmVudCA9IHsgdHlwZTogbGF5b3V0XzEuRXZlbnRUeXBlW2UudHlwZV0sIGFscGhhOiBlLmFscGhhLCBzdHJlc3M6IGUuc3RyZXNzIH07XG4gICAgICAgIHRoaXMuZXZlbnRbZDNldmVudC50eXBlXShkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkMy50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcyk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGQzYWRhcHRvcigpIHtcbiAgICByZXR1cm4gbmV3IEQzU3R5bGVMYXlvdXRBZGFwdG9yKCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJNMkZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWXpZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3UVVGTlFTeHRRMEZCYTBRN1FVRkhPVU03U1VGQk1FTXNkME5CUVUwN1NVRm5RalZETzFGQlFVRXNXVUZEU1N4cFFrRkJUeXhUUVhWQ1ZqdFJRWFpEUkN4WFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGRExGRkJRVkVzUTBGQlF5eHJRa0ZCVXl4RFFVRkRMR3RDUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNhMEpCUVZNc1EwRkJReXhyUWtGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMR3RDUVVGVExFTkJRVU1zYTBKQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJhMEpxUnl4SlFVRkpMRkZCUVZFc1IwRkJSeXhMUVVGSkxFTkJRVU03VVVGRGNFSXNTVUZCU1N4SlFVRkpMRU5CUVVNN1VVRkRWQ3hMUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITzFsQlExSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTlNMRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4RlFVRkZPM0ZDUVVONFFpeE5RVUZOTEVOQlFVTXNaVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJRenR4UWtGRGVrSXNSVUZCUlN4RFFVRkRMSEZDUVVGeFFpeEZRVUZGTEdWQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNN2NVSkJRek5ETEVWQlFVVXNRMEZCUXl4blFrRkJaMElzUlVGQlJTeFZRVUZCTEVOQlFVTTdiMEpCUTI1Q0xHVkJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRlBMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dHZRa0ZET1VJc1VVRkJVU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTjBRaXhEUVVGRExFTkJRVU03Y1VKQlEwUXNSVUZCUlN4RFFVRkRMRzFDUVVGdFFpeEZRVUZGTEdWQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRaUVVOcVJDeERRVUZETzFsQlJVUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETzJkQ1FVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU03V1VGSGJrTXNTVUZCU1R0cFFrRkZReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEY0VJc1EwRkJReXhEUVVGQk96dEpRVU5NTEVOQlFVTTdTVUZ5UTBRc2MwTkJRVThzUjBGQlVDeFZRVUZSTEVOQlFWRTdVVUZEV2l4SlFVRkpMRTlCUVU4c1IwRkJSeXhGUVVGRkxFbEJRVWtzUlVGQlJTeHJRa0ZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRPMUZCUXpWRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzBsQlEzUkRMRU5CUVVNN1NVRkhSQ3h0UTBGQlNTeEhRVUZLTzFGQlFVRXNhVUpCUlVNN1VVRkVSeXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEdOQlFVMHNUMEZCUVN4cFFrRkJUU3hKUVVGSkxGbEJRVVVzUlVGQldpeERRVUZaTEVOQlFVTXNRMEZCUXp0SlFVTnFReXhEUVVGRE8wbEJaME5FTEdsRFFVRkZMRWRCUVVZc1ZVRkJSeXhUUVVFMlFpeEZRVUZGTEZGQlFXOUNPMUZCUTJ4RUxFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNVMEZCVXl4TFFVRkxMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFFTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zVTBGQlV5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUTNaRExFTkJRVU03VVVGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTktMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEd0Q1FVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVVUZEYkVRc1EwRkJRenRSUVVORUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVVOTUxESkNRVUZETzBGQlFVUXNRMEZCUXl4QlFXNUVSQ3hEUVVFd1F5eGxRVUZOTEVkQmJVUXZRenRCUVc1RVdTeHZSRUZCYjBJN1FVRnBSV3BETzBsQlEwa3NUVUZCVFN4RFFVRkRMRWxCUVVrc2IwSkJRVzlDTEVWQlFVVXNRMEZCUXp0QlFVTjBReXhEUVVGRE8wRkJSa1FzT0VKQlJVTWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBEM1N0eWxlTGF5b3V0QWRhcHRvciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEQzU3R5bGVMYXlvdXRBZGFwdG9yLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEQzU3R5bGVMYXlvdXRBZGFwdG9yKGQzQ29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5kM0NvbnRleHQgPSBkM0NvbnRleHQ7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDNDb250ZXh0LmRpc3BhdGNoKGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuc3RhcnRdLCBsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLnRpY2tdLCBsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLmVuZF0pO1xuICAgICAgICB2YXIgZDNsYXlvdXQgPSBfdGhpcztcbiAgICAgICAgdmFyIGRyYWc7XG4gICAgICAgIF90aGlzLmRyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIWRyYWcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZHJhZyA9IGQzQ29udGV4dC5kcmFnKClcbiAgICAgICAgICAgICAgICAgICAgLnN1YmplY3QobGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcInN0YXJ0LmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ1N0YXJ0KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnLmQzYWRhcHRvclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICBsYXlvdXRfMS5MYXlvdXQuZHJhZyhkLCBkM0NvbnRleHQuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJlbmQuZDNhZGFwdG9yXCIsIGxheW91dF8xLkxheW91dC5kcmFnRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gZHJhZztcbiAgICAgICAgICAgIGFyZ3VtZW50c1swXS5jYWxsKGRyYWcpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGQzZXZlbnQgPSB7IHR5cGU6IGxheW91dF8xLkV2ZW50VHlwZVtlLnR5cGVdLCBhbHBoYTogZS5hbHBoYSwgc3RyZXNzOiBlLnN0cmVzcyB9O1xuICAgICAgICB0aGlzLmV2ZW50LmNhbGwoZDNldmVudC50eXBlLCBkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdCA9IHRoaXMuZDNDb250ZXh0LnRpbWVyKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUudGljay5jYWxsKF90aGlzKSAmJiB0LnN0b3AoKTsgfSk7XG4gICAgfTtcbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50VHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQub24oZXZlbnRUeXBlLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGxheW91dF8xLkV2ZW50VHlwZVtldmVudFR5cGVdLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICByZXR1cm4gRDNTdHlsZUxheW91dEFkYXB0b3I7XG59KGxheW91dF8xLkxheW91dCkpO1xuZXhwb3J0cy5EM1N0eWxlTGF5b3V0QWRhcHRvciA9IEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWkROMk5HRmtZWEIwYjNJdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk4dUxpOVhaV0pEYjJ4aEwzTnlZeTlrTTNZMFlXUmhjSFJ2Y2k1MGN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU96czdPenM3T3pzN096czdRVUZIUVN4dFEwRkJhVVE3UVVGVmFrUTdTVUZCTUVNc2QwTkJRVTA3U1VGcFFqVkRMRGhDUVVGdlFpeFRRVUZ2UWp0UlFVRjRReXhaUVVOSkxHbENRVUZQTEZOQmVVSldPMUZCTVVKdFFpeGxRVUZUTEVkQlFWUXNVMEZCVXl4RFFVRlhPMUZCUlhCRExFdEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NVMEZCVXl4RFFVRkRMRkZCUVZFc1EwRkJReXhyUWtGQlV5eERRVUZETEd0Q1FVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzYTBKQlFWTXNRMEZCUXl4clFrRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEd0Q1FVRlRMRU5CUVVNc2EwSkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUjJwSUxFbEJRVWtzVVVGQlVTeEhRVUZITEV0QlFVa3NRMEZCUXp0UlFVTndRaXhKUVVGSkxFbEJRVWtzUTBGQlF6dFJRVU5VTEV0QlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjN1dVRkRVaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMUlzU1VGQlNTeEpRVUZKTEVkQlFVY3NVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSVHR4UWtGRGRFSXNUMEZCVHl4RFFVRkRMR1ZCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU03Y1VKQlF6RkNMRVZCUVVVc1EwRkJReXhwUWtGQmFVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8zRkNRVU4yUXl4RlFVRkZMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNWVUZCUVN4RFFVRkRPMjlDUVVOdVFpeGxRVUZOTEVOQlFVTXNTVUZCU1N4RFFVRk5MRU5CUVVNc1JVRkJSU3hUUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdiMEpCUTNKRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRkRUlzUTBGQlF5eERRVUZETzNGQ1FVTkVMRVZCUVVVc1EwRkJReXhsUVVGbExFVkJRVVVzWlVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMWxCUXpkRExFTkJRVU03V1VGRlJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhOUVVGTkxFTkJRVU03WjBKQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRaUVV0dVF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlF6VkNMRU5CUVVNc1EwRkJRVHM3U1VGRFRDeERRVUZETzBsQmVrTkVMSE5EUVVGUExFZEJRVkFzVlVGQlVTeERRVUZSTzFGQlExb3NTVUZCU1N4UFFVRlBMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzYTBKQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0UlFVYzFSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGUExFOUJRVThzUTBGQlF5eERRVUZETzBsQlEyaEVMRU5CUVVNN1NVRkhSQ3h0UTBGQlNTeEhRVUZLTzFGQlFVRXNhVUpCUlVNN1VVRkVSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRXRCUVVzc1EwRkJReXhqUVVGTkxFOUJRVUVzYVVKQlFVMHNTVUZCU1N4WlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUY0UWl4RFFVRjNRaXhEUVVGRExFTkJRVU03U1VGRGFrVXNRMEZCUXp0SlFXdERSQ3hwUTBGQlJTeEhRVUZHTEZWQlFVY3NVMEZCTmtJc1JVRkJSU3hSUVVGdlFqdFJRVU5zUkN4RlFVRkZMRU5CUVVNc1EwRkJReXhQUVVGUExGTkJRVk1zUzBGQlN5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJoRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRk5CUVZNc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRPMUZCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRFNpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhyUWtGQlV5eERRVUZETEZOQlFWTXNRMEZCUXl4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTTdVVUZEUkN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZEVEN3eVFrRkJRenRCUVVGRUxFTkJRVU1zUVVGMFJFUXNRMEZCTUVNc1pVRkJUU3hIUVhORUwwTTdRVUYwUkZrc2IwUkJRVzlDSW4wPSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvY2tzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NrcygpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH1cbiAgICBMb2Nrcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGlkLCB4KSB7XG4gICAgICAgIHRoaXMubG9ja3NbaWRdID0geDtcbiAgICB9O1xuICAgIExvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH07XG4gICAgTG9ja3MucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5sb2NrcylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBMb2Nrcy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMubG9ja3MpIHtcbiAgICAgICAgICAgIGYoTnVtYmVyKGwpLCB0aGlzLmxvY2tzW2xdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExvY2tzO1xufSgpKTtcbmV4cG9ydHMuTG9ja3MgPSBMb2NrcztcbnZhciBEZXNjZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXNjZW50KHgsIEQsIEcpIHtcbiAgICAgICAgaWYgKEcgPT09IHZvaWQgMCkgeyBHID0gbnVsbDsgfVxuICAgICAgICB0aGlzLkQgPSBEO1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRocmVzaG9sZCA9IDAuMDAwMTtcbiAgICAgICAgdGhpcy5udW1HcmlkU25hcE5vZGVzID0gMDtcbiAgICAgICAgdGhpcy5zbmFwR3JpZFNpemUgPSAxMDA7XG4gICAgICAgIHRoaXMuc25hcFN0cmVuZ3RoID0gMTAwMDtcbiAgICAgICAgdGhpcy5zY2FsZVNuYXBCeU1heEggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgUHNldWRvUmFuZG9tKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuayA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHRoaXMubiA9IHhbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLkggPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5nID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuSGQgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5hID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuYiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmMgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5kID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuZSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmlhID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuaWIgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy54dG1wID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgTG9ja3MoKTtcbiAgICAgICAgdGhpcy5taW5EID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGkgPSBuLCBqO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlICgtLWogPiBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBEW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkIDwgdGhpcy5taW5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRCA9IGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1pbkQgPT09IE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgICAgICB0aGlzLm1pbkQgPSAxO1xuICAgICAgICBpID0gdGhpcy5rO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmdbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLkhbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLkhbaV1bal0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLkhkW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5hW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5iW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5jW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5kW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5lW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5pYVtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIHRoaXMuaWJbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLnh0bXBbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXggPSBmdW5jdGlvbiAobiwgZikge1xuICAgICAgICB2YXIgTSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIE1baV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgICAgIE1baV1bal0gPSBmKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUub2Zmc2V0RGlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdVtpXSA9IHRoaXMucmFuZG9tLmdldE5leHRCZXR3ZWVuKDAuMDEsIDEpIC0gMC41O1xuICAgICAgICAgICAgbCArPSB4ICogeDtcbiAgICAgICAgfVxuICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICByZXR1cm4gdS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggKj0gX3RoaXMubWluRCAvIGw7IH0pO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZURlcml2YXRpdmVzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG4gPSB0aGlzLm47XG4gICAgICAgIGlmIChuIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBkID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBkMiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgSHV1ID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBtYXhIID0gMDtcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCBuOyArK3UpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICBIdXVbaV0gPSB0aGlzLmdbaV1bdV0gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBuOyArK3YpIHtcbiAgICAgICAgICAgICAgICBpZiAodSA9PT0gdilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIG1heERpc3BsYWNlcyA9IG47XG4gICAgICAgICAgICAgICAgd2hpbGUgKG1heERpc3BsYWNlcy0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZDIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IGRbaV0gPSB4W2ldW3VdIC0geFtpXVt2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNkMiArPSBkMltpXSA9IGR4ICogZHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNkMiA+IDFlLTkpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJkID0gdGhpcy5vZmZzZXREaXIoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuazsgKytpKVxuICAgICAgICAgICAgICAgICAgICAgICAgeFtpXVt2XSArPSByZFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBNYXRoLnNxcnQoc2QyKTtcbiAgICAgICAgICAgICAgICB2YXIgRCA9IHRoaXMuRFt1XVt2XTtcbiAgICAgICAgICAgICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5HICE9IG51bGwgPyB0aGlzLkdbdV1bdl0gOiAxO1xuICAgICAgICAgICAgICAgIGlmICh3ZWlnaHQgPiAxICYmIGwgPiBEIHx8ICFpc0Zpbml0ZShEKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdl0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdlaWdodCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIEQyID0gRCAqIEQ7XG4gICAgICAgICAgICAgICAgdmFyIGdzID0gMiAqIHdlaWdodCAqIChsIC0gRCkgLyAoRDIgKiBsKTtcbiAgICAgICAgICAgICAgICB2YXIgbDMgPSBsICogbCAqIGw7XG4gICAgICAgICAgICAgICAgdmFyIGhzID0gMiAqIC13ZWlnaHQgLyAoRDIgKiBsMyk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShncykpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VdICs9IGRbaV0gKiBncztcbiAgICAgICAgICAgICAgICAgICAgSHV1W2ldIC09IHRoaXMuSFtpXVt1XVt2XSA9IGhzICogKGwzICsgRCAqIChkMltpXSAtIHNkMikgKyBsICogc2QyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgbWF4SCA9IE1hdGgubWF4KG1heEgsIHRoaXMuSFtpXVt1XVt1XSA9IEh1dVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHIgPSB0aGlzLnNuYXBHcmlkU2l6ZSAvIDI7XG4gICAgICAgIHZhciBnID0gdGhpcy5zbmFwR3JpZFNpemU7XG4gICAgICAgIHZhciB3ID0gdGhpcy5zbmFwU3RyZW5ndGg7XG4gICAgICAgIHZhciBrID0gdyAvIChyICogcik7XG4gICAgICAgIHZhciBudW1Ob2RlcyA9IHRoaXMubnVtR3JpZFNuYXBOb2RlcztcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCBudW1Ob2RlczsgKyt1KSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGl1ID0gdGhpcy54W2ldW3VdO1xuICAgICAgICAgICAgICAgIHZhciBtID0geGl1IC8gZztcbiAgICAgICAgICAgICAgICB2YXIgZiA9IG0gJSAxO1xuICAgICAgICAgICAgICAgIHZhciBxID0gbSAtIGY7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBNYXRoLmFicyhmKTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSAoYSA8PSAwLjUpID8geGl1IC0gcSAqIGcgOlxuICAgICAgICAgICAgICAgICAgICAoeGl1ID4gMCkgPyB4aXUgLSAocSArIDEpICogZyA6IHhpdSAtIChxIC0gMSkgKiBnO1xuICAgICAgICAgICAgICAgIGlmICgtciA8IGR4ICYmIGR4IDw9IHIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVTbmFwQnlNYXhIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdbaV1bdV0gKz0gbWF4SCAqIGsgKiBkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSFtpXVt1XVt1XSArPSBtYXhIICogaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ1tpXVt1XSArPSBrICogZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdV0gKz0gaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubG9ja3MuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvY2tzLmFwcGx5KGZ1bmN0aW9uICh1LCBwKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IF90aGlzLms7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5IW2ldW3VdW3VdICs9IG1heEg7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmdbaV1bdV0gLT0gbWF4SCAqIChwW2ldIC0geFtpXVt1XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQuZG90UHJvZCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciB4ID0gMCwgaSA9IGEubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgeCArPSBhW2ldICogYltpXTtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgICBEZXNjZW50LnJpZ2h0TXVsdGlwbHkgPSBmdW5jdGlvbiAobSwgdiwgcikge1xuICAgICAgICB2YXIgaSA9IG0ubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgcltpXSA9IERlc2NlbnQuZG90UHJvZChtW2ldLCB2KTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVTdGVwU2l6ZSA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHZhciBudW1lcmF0b3IgPSAwLCBkZW5vbWluYXRvciA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIG51bWVyYXRvciArPSBEZXNjZW50LmRvdFByb2QodGhpcy5nW2ldLCBkW2ldKTtcbiAgICAgICAgICAgIERlc2NlbnQucmlnaHRNdWx0aXBseSh0aGlzLkhbaV0sIGRbaV0sIHRoaXMuSGRbaV0pO1xuICAgICAgICAgICAgZGVub21pbmF0b3IgKz0gRGVzY2VudC5kb3RQcm9kKGRbaV0sIHRoaXMuSGRbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA9PT0gMCB8fCAhaXNGaW5pdGUoZGVub21pbmF0b3IpKVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxICogbnVtZXJhdG9yIC8gZGVub21pbmF0b3I7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5yZWR1Y2VTdHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcml2YXRpdmVzKHRoaXMueCk7XG4gICAgICAgIHZhciBhbHBoYSA9IHRoaXMuY29tcHV0ZVN0ZXBTaXplKHRoaXMuZyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHRoaXMueFtpXSwgdGhpcy5nW2ldLCBhbHBoYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZVN0cmVzcygpO1xuICAgIH07XG4gICAgRGVzY2VudC5jb3B5ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIG0gPSBhLmxlbmd0aCwgbiA9IGJbMF0ubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07ICsraSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgICAgICBiW2ldW2pdID0gYVtpXVtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuc3RlcEFuZFByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHIsIGQsIHN0ZXBTaXplKSB7XG4gICAgICAgIERlc2NlbnQuY29weSh4MCwgcik7XG4gICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHJbMF0sIGRbMF0sIHN0ZXBTaXplKTtcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdClcbiAgICAgICAgICAgIHRoaXMucHJvamVjdFswXSh4MFswXSwgeDBbMV0sIHJbMF0pO1xuICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcChyWzFdLCBkWzFdLCBzdGVwU2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpXG4gICAgICAgICAgICB0aGlzLnByb2plY3RbMV0oclswXSwgeDBbMV0sIHJbMV0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMjsgaSA8IHRoaXMuazsgaSsrKVxuICAgICAgICAgICAgdGhpcy50YWtlRGVzY2VudFN0ZXAocltpXSwgZFtpXSwgc3RlcFNpemUpO1xuICAgIH07XG4gICAgRGVzY2VudC5tQXBwbHkgPSBmdW5jdGlvbiAobSwgbiwgZikge1xuICAgICAgICB2YXIgaSA9IG07XG4gICAgICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICAgICAgICB2YXIgaiA9IG47XG4gICAgICAgICAgICB3aGlsZSAoai0tID4gMClcbiAgICAgICAgICAgICAgICBmKGksIGopO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5tYXRyaXhBcHBseSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIERlc2NlbnQubUFwcGx5KHRoaXMuaywgdGhpcy5uLCBmKTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVOZXh0UG9zaXRpb24gPSBmdW5jdGlvbiAoeDAsIHIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5jb21wdXRlRGVyaXZhdGl2ZXMoeDApO1xuICAgICAgICB2YXIgYWxwaGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmcpO1xuICAgICAgICB0aGlzLnN0ZXBBbmRQcm9qZWN0KHgwLCByLCB0aGlzLmcsIGFscGhhKTtcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdCkge1xuICAgICAgICAgICAgdGhpcy5tYXRyaXhBcHBseShmdW5jdGlvbiAoaSwgaikgeyByZXR1cm4gX3RoaXMuZVtpXVtqXSA9IHgwW2ldW2pdIC0gcltpXVtqXTsgfSk7XG4gICAgICAgICAgICB2YXIgYmV0YSA9IHRoaXMuY29tcHV0ZVN0ZXBTaXplKHRoaXMuZSk7XG4gICAgICAgICAgICBiZXRhID0gTWF0aC5tYXgoMC4yLCBNYXRoLm1pbihiZXRhLCAxKSk7XG4gICAgICAgICAgICB0aGlzLnN0ZXBBbmRQcm9qZWN0KHgwLCByLCB0aGlzLmUsIGJldGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoaXRlcmF0aW9ucykge1xuICAgICAgICB2YXIgc3RyZXNzID0gTnVtYmVyLk1BWF9WQUxVRSwgY29udmVyZ2VkID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghY29udmVyZ2VkICYmIGl0ZXJhdGlvbnMtLSA+IDApIHtcbiAgICAgICAgICAgIHZhciBzID0gdGhpcy5ydW5nZUt1dHRhKCk7XG4gICAgICAgICAgICBjb252ZXJnZWQgPSBNYXRoLmFicyhzdHJlc3MgLyBzIC0gMSkgPCB0aGlzLnRocmVzaG9sZDtcbiAgICAgICAgICAgIHN0cmVzcyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmVzcztcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnJ1bmdlS3V0dGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLngsIHRoaXMuYSk7XG4gICAgICAgIERlc2NlbnQubWlkKHRoaXMueCwgdGhpcy5hLCB0aGlzLmlhKTtcbiAgICAgICAgdGhpcy5jb21wdXRlTmV4dFBvc2l0aW9uKHRoaXMuaWEsIHRoaXMuYik7XG4gICAgICAgIERlc2NlbnQubWlkKHRoaXMueCwgdGhpcy5iLCB0aGlzLmliKTtcbiAgICAgICAgdGhpcy5jb21wdXRlTmV4dFBvc2l0aW9uKHRoaXMuaWIsIHRoaXMuYyk7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmMsIHRoaXMuZCk7XG4gICAgICAgIHZhciBkaXNwID0gMDtcbiAgICAgICAgdGhpcy5tYXRyaXhBcHBseShmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgdmFyIHggPSAoX3RoaXMuYVtpXVtqXSArIDIuMCAqIF90aGlzLmJbaV1bal0gKyAyLjAgKiBfdGhpcy5jW2ldW2pdICsgX3RoaXMuZFtpXVtqXSkgLyA2LjAsIGQgPSBfdGhpcy54W2ldW2pdIC0geDtcbiAgICAgICAgICAgIGRpc3AgKz0gZCAqIGQ7XG4gICAgICAgICAgICBfdGhpcy54W2ldW2pdID0geDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkaXNwO1xuICAgIH07XG4gICAgRGVzY2VudC5taWQgPSBmdW5jdGlvbiAoYSwgYiwgbSkge1xuICAgICAgICBEZXNjZW50Lm1BcHBseShhLmxlbmd0aCwgYVswXS5sZW5ndGgsIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICByZXR1cm4gbVtpXVtqXSA9IGFbaV1bal0gKyAoYltpXVtqXSAtIGFbaV1bal0pIC8gMi4wO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnRha2VEZXNjZW50U3RlcCA9IGZ1bmN0aW9uICh4LCBkLCBzdGVwU2l6ZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICB4W2ldID0geFtpXSAtIHN0ZXBTaXplICogZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZVN0cmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0cmVzcyA9IDA7XG4gICAgICAgIGZvciAodmFyIHUgPSAwLCBuTWludXMxID0gdGhpcy5uIC0gMTsgdSA8IG5NaW51czE7ICsrdSkge1xuICAgICAgICAgICAgZm9yICh2YXIgdiA9IHUgKyAxLCBuID0gdGhpcy5uOyB2IDwgbjsgKyt2KSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGR4ID0gdGhpcy54W2ldW3VdIC0gdGhpcy54W2ldW3ZdO1xuICAgICAgICAgICAgICAgICAgICBsICs9IGR4ICogZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGwgPSBNYXRoLnNxcnQobCk7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLkRbdV1bdl07XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShkKSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIHJsID0gZCAtIGw7XG4gICAgICAgICAgICAgICAgdmFyIGQyID0gZCAqIGQ7XG4gICAgICAgICAgICAgICAgc3RyZXNzICs9IHJsICogcmwgLyBkMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyZXNzO1xuICAgIH07XG4gICAgRGVzY2VudC56ZXJvRGlzdGFuY2UgPSAxZS0xMDtcbiAgICByZXR1cm4gRGVzY2VudDtcbn0oKSk7XG5leHBvcnRzLkRlc2NlbnQgPSBEZXNjZW50O1xudmFyIFBzZXVkb1JhbmRvbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHNldWRvUmFuZG9tKHNlZWQpIHtcbiAgICAgICAgaWYgKHNlZWQgPT09IHZvaWQgMCkgeyBzZWVkID0gMTsgfVxuICAgICAgICB0aGlzLnNlZWQgPSBzZWVkO1xuICAgICAgICB0aGlzLmEgPSAyMTQwMTM7XG4gICAgICAgIHRoaXMuYyA9IDI1MzEwMTE7XG4gICAgICAgIHRoaXMubSA9IDIxNDc0ODM2NDg7XG4gICAgICAgIHRoaXMucmFuZ2UgPSAzMjc2NztcbiAgICB9XG4gICAgUHNldWRvUmFuZG9tLnByb3RvdHlwZS5nZXROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNlZWQgPSAodGhpcy5zZWVkICogdGhpcy5hICsgdGhpcy5jKSAlIHRoaXMubTtcbiAgICAgICAgcmV0dXJuICh0aGlzLnNlZWQgPj4gMTYpIC8gdGhpcy5yYW5nZTtcbiAgICB9O1xuICAgIFBzZXVkb1JhbmRvbS5wcm90b3R5cGUuZ2V0TmV4dEJldHdlZW4gPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIHRoaXMuZ2V0TmV4dCgpICogKG1heCAtIG1pbik7XG4gICAgfTtcbiAgICByZXR1cm4gUHNldWRvUmFuZG9tO1xufSgpKTtcbmV4cG9ydHMuUHNldWRvUmFuZG9tID0gUHNldWRvUmFuZG9tO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWkdWelkyVnVkQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyUmxjMk5sYm5RdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZKU1R0SlFVRkJPMUZCUTBrc1ZVRkJTeXhIUVVFMlFpeEZRVUZGTEVOQlFVTTdTVUZ2UTNwRExFTkJRVU03U1VFM1FrY3NiVUpCUVVjc1IwRkJTQ3hWUVVGSkxFVkJRVlVzUlVGQlJTeERRVUZYTzFGQlNYWkNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTNaQ0xFTkJRVU03U1VGSlJDeHhRa0ZCU3l4SFFVRk1PMUZCUTBrc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1EwRkJRenRKUVV0RUxIVkNRVUZQTEVkQlFWQTdVVUZEU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU4yUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZMUkN4eFFrRkJTeXhIUVVGTUxGVkJRVTBzUTBGQmIwTTdVVUZEZEVNc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGFFTXNRMEZCUXp0SlFVTk1MRU5CUVVNN1NVRkRUQ3haUVVGRE8wRkJRVVFzUTBGQlF5eEJRWEpEUkN4SlFYRkRRenRCUVhKRFdTeHpRa0ZCU3p0QlFXbEViRUk3U1VFMlJFa3NhVUpCUVZrc1EwRkJZU3hGUVVGVExFTkJRV0VzUlVGQlV5eERRVUZ0UWp0UlFVRnVRaXhyUWtGQlFTeEZRVUZCTEZGQlFXMUNPMUZCUVhwRExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWazdVVUZCVXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGclFqdFJRVFZFY0VVc1kwRkJVeXhIUVVGWExFMUJRVTBzUTBGQlF6dFJRVEpETTBJc2NVSkJRV2RDTEVkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUXpkQ0xHbENRVUZaTEVkQlFWY3NSMEZCUnl4RFFVRkRPMUZCUXpOQ0xHbENRVUZaTEVkQlFWY3NTVUZCU1N4RFFVRkRPMUZCUXpWQ0xHOUNRVUZsTEVkQlFWa3NTMEZCU3l4RFFVRkRPMUZCUldoRExGZEJRVTBzUjBGQlJ5eEpRVUZKTEZsQlFWa3NSVUZCUlN4RFFVRkRPMUZCUlRkQ0xGbEJRVThzUjBGQk1FUXNTVUZCU1N4RFFVRkRPMUZCVjNwRkxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTFnc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTTNRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0xUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNNVFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1MwRkJTeXhGUVVGRkxFTkJRVU03VVVGRGVrSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEWWl4UFFVRlBMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRFZDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTA0c1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXp0blFrRkRZaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyaENMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjZRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRiRUlzUTBGQlF6dFpRVU5NTEVOQlFVTTdVVUZEVEN4RFFVRkRPMUZCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTMEZCU3l4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8xbEJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRXQ3hQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZEVkN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTk9MRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZEVkN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaERMRU5CUVVNN1dVRkRSQ3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6RkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU42UWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRekZDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRNVUlzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9ReXhEUVVGRE8wbEJRMHdzUTBGQlF6dEpRVVZoTERCQ1FVRnJRaXhIUVVGb1F5eFZRVUZwUXl4RFFVRlRMRVZCUVVVc1EwRkJiVU03VVVGRE0wVXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY2tJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTjZRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNFSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dG5Ra0ZEZWtJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZEVJc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJJc1EwRkJRenRKUVVWUExESkNRVUZUTEVkQlFXcENPMUZCUVVFc2FVSkJVME03VVVGU1J5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETVVJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlExWXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZET1VJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03V1VGRGVrUXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFppeERRVUZETzFGQlEwUXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtJc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFbEJRVWtzUzBGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUVd4Q0xFTkJRV3RDTEVOQlFVTXNRMEZCUXp0SlFVTjZReXhEUVVGRE8wbEJSMDBzYjBOQlFXdENMRWRCUVhwQ0xGVkJRVEJDTEVOQlFXRTdVVUZCZGtNc2FVSkJaMGRETzFGQkwwWkhMRWxCUVVrc1EwRkJReXhIUVVGWExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZGtJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVRkRMRTFCUVUwc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFWTXNRMEZCUXp0UlFVMWtMRWxCUVVrc1EwRkJReXhIUVVGaExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1F5eEpRVUZKTEVWQlFVVXNSMEZCWVN4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hIUVVGSExFZEJRV0VzU1VGQlNTeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JETEVsQlFVa3NTVUZCU1N4SFFVRlhMRU5CUVVNc1EwRkJRenRSUVVOeVFpeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJWeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRMnBETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU4yUkN4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzJkQ1FVTjZRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMjlDUVVGRExGRkJRVkVzUTBGQlF6dG5Ra0ZIZEVJc1NVRkJTU3haUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhQUVVGUExGbEJRVmtzUlVGQlJTeEZRVUZGTEVOQlFVTTdiMEpCUTNCQ0xFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXp0dlFrRkRXaXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN2QwSkJRekZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU5zUXl4SFFVRkhMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2IwSkJRek5DTEVOQlFVTTdiMEpCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0M1FrRkJReXhMUVVGTExFTkJRVU03YjBKQlEzUkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eFRRVUZUTEVWQlFVVXNRMEZCUXp0dlFrRkRNVUlzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN2QwSkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRiRVFzUTBGQlF6dG5Ra0ZEUkN4SlFVRkpMRU5CUVVNc1IwRkJWeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVNdlFpeEpRVUZKTEVOQlFVTXNSMEZCVnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNM1FpeEpRVUZKTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU12UXl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOMFF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenQzUWtGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRGFrUXNVVUZCVVN4RFFVRkRPMmRDUVVOaUxFTkJRVU03WjBKQlEwUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJJc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZEWml4RFFVRkRPMmRDUVVORUxFbEJRVWtzUlVGQlJTeEhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRM1pDTEVsQlFVa3NSVUZCUlN4SFFVRlhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJwRUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yZENRVU51UWl4SlFVRkpMRVZCUVVVc1IwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU03WjBKQlEzcERMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVOa0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1owSkJRM0JDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dHZRa0ZETVVJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMjlDUVVNeFFpeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRlRVVzUTBGQlF6dFpRVU5NTEVOQlFVTTdXVUZEUkN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZCUlN4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnFSaXhEUVVGRE8xRkJSVVFzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1IwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlF6RkNMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZGY2tNc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFWY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhSUVVGUkxFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTjRReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRekZDTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM1pDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlEyaENMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTJRc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRaQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU53UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRMMElzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTNSRUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU03ZDBKQlEzWkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdkMEpCUXpsQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRGFFTXNRMEZCUXp0dlFrRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dDNRa0ZEU2l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03ZDBKQlEzWkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzI5Q1FVTjZRaXhEUVVGRE8yZENRVU5NTEVOQlFVTTdXVUZEVEN4RFFVRkRPMUZCUTB3c1EwRkJRenRSUVVORUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZUVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRuUWtGRGJFSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzI5Q1FVTXhRaXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXp0dlFrRkRlRUlzUzBGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlF6VkRMRU5CUVVNN1dVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5RTEVOQlFVTTdTVUZUVEN4RFFVRkRPMGxCUldNc1pVRkJUeXhIUVVGMFFpeFZRVUYxUWl4RFFVRlhMRVZCUVVVc1EwRkJWenRSUVVNelF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEZUVJc1QwRkJUeXhEUVVGRExFVkJRVVU3V1VGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTNRaXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEySXNRMEZCUXp0SlFVZGpMSEZDUVVGaExFZEJRVFZDTEZWQlFUWkNMRU5CUVdFc1JVRkJSU3hEUVVGWExFVkJRVVVzUTBGQlZ6dFJRVU5vUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzFGQlEycENMRTlCUVU4c1EwRkJReXhGUVVGRk8xbEJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRTlCUVU4c1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEVOQlFVTTdTVUZMVFN4cFEwRkJaU3hIUVVGMFFpeFZRVUYxUWl4RFFVRmhPMUZCUTJoRExFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNSVUZCUlN4WFFVRlhMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMjVETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlF6bENMRk5CUVZNc1NVRkJTU3hQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRPVU1zVDBGQlR5eERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRia1FzVjBGQlZ5eEpRVUZKTEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UkN4RFFVRkRPMUZCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zVjBGQlZ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNVVFzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRWRCUVVjc1YwRkJWeXhEUVVGRE8wbEJRM1pETEVOQlFVTTdTVUZGVFN3NFFrRkJXU3hIUVVGdVFqdFJRVU5KTEVsQlFVa3NRMEZCUXl4clFrRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRhRU1zU1VGQlNTeExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZWtNc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdVVUZEZEVRc1EwRkJRenRSUVVORUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RlFVRkZMRU5CUVVNN1NVRkRhRU1zUTBGQlF6dEpRVVZqTEZsQlFVa3NSMEZCYmtJc1ZVRkJiMElzUTBGQllTeEZRVUZGTEVOQlFXRTdVVUZETlVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnNReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNwQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRM3BDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRFSXNRMEZCUXp0UlFVTk1MRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJVVThzWjBOQlFXTXNSMEZCZEVJc1ZVRkJkVUlzUlVGQll5eEZRVUZGTEVOQlFXRXNSVUZCUlN4RFFVRmhMRVZCUVVVc1VVRkJaMEk3VVVGRGFrWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpORExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZEVRc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpORExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIY2tRc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTXpRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRlZia1FzUTBGQlF6dEpRVVZqTEdOQlFVMHNSMEZCY2tJc1ZVRkJjMElzUTBGQlV5eEZRVUZGTEVOQlFWTXNSVUZCUlN4RFFVRm5RenRSUVVONFJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkJReXhQUVVGUExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dG5Ra0ZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzWkRMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJRMDhzTmtKQlFWY3NSMEZCYmtJc1ZVRkJiMElzUTBGQlowTTdVVUZEYUVRc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZEVNc1EwRkJRenRKUVVWUExIRkRRVUZ0UWl4SFFVRXpRaXhWUVVFMFFpeEZRVUZqTEVWQlFVVXNRMEZCWVR0UlFVRjZSQ3hwUWtGbFF6dFJRV1JITEVsQlFVa3NRMEZCUXl4clFrRkJhMElzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU42UXl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFJRVTB4UXl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTm1MRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1MwRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnFReXhEUVVGcFF5eERRVUZETEVOQlFVTTdXVUZET1VRc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZUVNc1NVRkJTU3hEUVVGRExHTkJRV01zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETjBNc1EwRkJRenRKUVVOTUxFTkJRVU03U1VGRlRTeHhRa0ZCUnl4SFFVRldMRlZCUVZjc1ZVRkJhMEk3VVVGRGVrSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRExGTkJRVk1zUlVGQlJTeFRRVUZUTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTJwRUxFOUJRVThzUTBGQlF5eFRRVUZUTEVsQlFVa3NWVUZCVlN4RlFVRkZMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRGNFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJTeERRVUZETzFsQlF6RkNMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXp0WlFVTjBSQ3hOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEyWXNRMEZCUXp0UlFVTkVMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVVk5MRFJDUVVGVkxFZEJRV3BDTzFGQlFVRXNhVUpCWlVNN1VVRmtSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0pETEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRZaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRVZCUTJwR0xFTkJRVU1zUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmtMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUldNc1YwRkJSeXhIUVVGc1FpeFZRVUZ0UWl4RFFVRmhMRVZCUVVVc1EwRkJZU3hGUVVGRkxFTkJRV0U3VVVGRE1VUXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTjJReXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSenRSUVVFM1F5eERRVUUyUXl4RFFVRkRMRU5CUVVNN1NVRkRka1FzUTBGQlF6dEpRVVZOTEdsRFFVRmxMRWRCUVhSQ0xGVkJRWFZDTEVOQlFWY3NSVUZCUlN4RFFVRlhMRVZCUVVVc1VVRkJaMEk3VVVGRE4wUXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZET1VJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhSUVVGUkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFTkJRVU03U1VGRFRDeERRVUZETzBsQlJVMHNLMEpCUVdFc1IwRkJjRUk3VVVGRFNTeEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRaaXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhQUVVGUExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTnlSQ3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0blFrRkRla01zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVOV0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8yOUNRVU01UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzSkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTnFRaXhEUVVGRE8yZENRVU5FTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnFRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGQlF5eFJRVUZSTEVOQlFVTTdaMEpCUXpOQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMllzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGRFppeE5RVUZOTEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU03V1VGRE0wSXNRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkRSQ3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRnlWMk1zYjBKQlFWa3NSMEZCVnl4TFFVRkxMRU5CUVVNN1NVRnpWMmhFTEdOQlFVTTdRMEZCUVN4QlFXaFpSQ3hKUVdkWlF6dEJRV2haV1N3d1FrRkJUenRCUVcxWmNFSTdTVUZOU1N4elFrRkJiVUlzU1VGQlowSTdVVUZCYUVJc2NVSkJRVUVzUlVGQlFTeFJRVUZuUWp0UlFVRm9RaXhUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZaTzFGQlRETkNMRTFCUVVNc1IwRkJWeXhOUVVGTkxFTkJRVU03VVVGRGJrSXNUVUZCUXl4SFFVRlhMRTlCUVU4c1EwRkJRenRSUVVOd1FpeE5RVUZETEVkQlFWY3NWVUZCVlN4RFFVRkRPMUZCUTNaQ0xGVkJRVXNzUjBGQlZ5eExRVUZMTEVOQlFVTTdTVUZGVXl4RFFVRkRPMGxCUjNoRExEaENRVUZQTEVkQlFWQTdVVUZEU1N4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMjVFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFbEJRVWtzUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVNeFF5eERRVUZETzBsQlIwUXNjVU5CUVdNc1IwRkJaQ3hWUVVGbExFZEJRVmNzUlVGQlJTeEhRVUZYTzFGQlEyNURMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlF6bERMRU5CUVVNN1NVRkRUQ3h0UWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZzUWtRc1NVRnJRa003UVVGc1Fsa3NiME5CUVZraWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIFBvaW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb2ludCgpIHtcbiAgICB9XG4gICAgcmV0dXJuIFBvaW50O1xufSgpKTtcbmV4cG9ydHMuUG9pbnQgPSBQb2ludDtcbnZhciBMaW5lU2VnbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGluZVNlZ21lbnQoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdGhpcy54MSA9IHgxO1xuICAgICAgICB0aGlzLnkxID0geTE7XG4gICAgICAgIHRoaXMueDIgPSB4MjtcbiAgICAgICAgdGhpcy55MiA9IHkyO1xuICAgIH1cbiAgICByZXR1cm4gTGluZVNlZ21lbnQ7XG59KCkpO1xuZXhwb3J0cy5MaW5lU2VnbWVudCA9IExpbmVTZWdtZW50O1xudmFyIFBvbHlQb2ludCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFBvbHlQb2ludCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQb2x5UG9pbnQoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFBvbHlQb2ludDtcbn0oUG9pbnQpKTtcbmV4cG9ydHMuUG9seVBvaW50ID0gUG9seVBvaW50O1xuZnVuY3Rpb24gaXNMZWZ0KFAwLCBQMSwgUDIpIHtcbiAgICByZXR1cm4gKFAxLnggLSBQMC54KSAqIChQMi55IC0gUDAueSkgLSAoUDIueCAtIFAwLngpICogKFAxLnkgLSBQMC55KTtcbn1cbmV4cG9ydHMuaXNMZWZ0ID0gaXNMZWZ0O1xuZnVuY3Rpb24gYWJvdmUocCwgdmksIHZqKSB7XG4gICAgcmV0dXJuIGlzTGVmdChwLCB2aSwgdmopID4gMDtcbn1cbmZ1bmN0aW9uIGJlbG93KHAsIHZpLCB2aikge1xuICAgIHJldHVybiBpc0xlZnQocCwgdmksIHZqKSA8IDA7XG59XG5mdW5jdGlvbiBDb252ZXhIdWxsKFMpIHtcbiAgICB2YXIgUCA9IFMuc2xpY2UoMCkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS54ICE9PSBiLnggPyBiLnggLSBhLnggOiBiLnkgLSBhLnk7IH0pO1xuICAgIHZhciBuID0gUy5sZW5ndGgsIGk7XG4gICAgdmFyIG1pbm1pbiA9IDA7XG4gICAgdmFyIHhtaW4gPSBQWzBdLng7XG4gICAgZm9yIChpID0gMTsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoUFtpXS54ICE9PSB4bWluKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBtaW5tYXggPSBpIC0gMTtcbiAgICB2YXIgSCA9IFtdO1xuICAgIEgucHVzaChQW21pbm1pbl0pO1xuICAgIGlmIChtaW5tYXggPT09IG4gLSAxKSB7XG4gICAgICAgIGlmIChQW21pbm1heF0ueSAhPT0gUFttaW5taW5dLnkpXG4gICAgICAgICAgICBILnB1c2goUFttaW5tYXhdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciBtYXhtaW4sIG1heG1heCA9IG4gLSAxO1xuICAgICAgICB2YXIgeG1heCA9IFBbbiAtIDFdLng7XG4gICAgICAgIGZvciAoaSA9IG4gLSAyOyBpID49IDA7IGktLSlcbiAgICAgICAgICAgIGlmIChQW2ldLnggIT09IHhtYXgpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIG1heG1pbiA9IGkgKyAxO1xuICAgICAgICBpID0gbWlubWF4O1xuICAgICAgICB3aGlsZSAoKytpIDw9IG1heG1pbikge1xuICAgICAgICAgICAgaWYgKGlzTGVmdChQW21pbm1pbl0sIFBbbWF4bWluXSwgUFtpXSkgPj0gMCAmJiBpIDwgbWF4bWluKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgd2hpbGUgKEgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xlZnQoSFtILmxlbmd0aCAtIDJdLCBIW0gubGVuZ3RoIC0gMV0sIFBbaV0pID4gMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBILmxlbmd0aCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgIT0gbWlubWluKVxuICAgICAgICAgICAgICAgIEgucHVzaChQW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF4bWF4ICE9IG1heG1pbilcbiAgICAgICAgICAgIEgucHVzaChQW21heG1heF0pO1xuICAgICAgICB2YXIgYm90ID0gSC5sZW5ndGg7XG4gICAgICAgIGkgPSBtYXhtaW47XG4gICAgICAgIHdoaWxlICgtLWkgPj0gbWlubWF4KSB7XG4gICAgICAgICAgICBpZiAoaXNMZWZ0KFBbbWF4bWF4XSwgUFttaW5tYXhdLCBQW2ldKSA+PSAwICYmIGkgPiBtaW5tYXgpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB3aGlsZSAoSC5sZW5ndGggPiBib3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNMZWZ0KEhbSC5sZW5ndGggLSAyXSwgSFtILmxlbmd0aCAtIDFdLCBQW2ldKSA+IDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgSC5sZW5ndGggLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpICE9IG1pbm1pbilcbiAgICAgICAgICAgICAgICBILnB1c2goUFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEg7XG59XG5leHBvcnRzLkNvbnZleEh1bGwgPSBDb252ZXhIdWxsO1xuZnVuY3Rpb24gY2xvY2t3aXNlUmFkaWFsU3dlZXAocCwgUCwgZikge1xuICAgIFAuc2xpY2UoMCkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gTWF0aC5hdGFuMihhLnkgLSBwLnksIGEueCAtIHAueCkgLSBNYXRoLmF0YW4yKGIueSAtIHAueSwgYi54IC0gcC54KTsgfSkuZm9yRWFjaChmKTtcbn1cbmV4cG9ydHMuY2xvY2t3aXNlUmFkaWFsU3dlZXAgPSBjbG9ja3dpc2VSYWRpYWxTd2VlcDtcbmZ1bmN0aW9uIG5leHRQb2x5UG9pbnQocCwgcHMpIHtcbiAgICBpZiAocC5wb2x5SW5kZXggPT09IHBzLmxlbmd0aCAtIDEpXG4gICAgICAgIHJldHVybiBwc1swXTtcbiAgICByZXR1cm4gcHNbcC5wb2x5SW5kZXggKyAxXTtcbn1cbmZ1bmN0aW9uIHByZXZQb2x5UG9pbnQocCwgcHMpIHtcbiAgICBpZiAocC5wb2x5SW5kZXggPT09IDApXG4gICAgICAgIHJldHVybiBwc1twcy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gcHNbcC5wb2x5SW5kZXggLSAxXTtcbn1cbmZ1bmN0aW9uIHRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSB7XG4gICAgdmFyIFZjbG9zZWQgPSBWLnNsaWNlKDApO1xuICAgIFZjbG9zZWQucHVzaChWWzBdKTtcbiAgICByZXR1cm4geyBydGFuOiBSdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFZjbG9zZWQpLCBsdGFuOiBMdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFZjbG9zZWQpIH07XG59XG5mdW5jdGlvbiBSdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgbiA9IFYubGVuZ3RoIC0gMTtcbiAgICB2YXIgYSwgYiwgYztcbiAgICB2YXIgdXBBLCBkbkM7XG4gICAgaWYgKGJlbG93KFAsIFZbMV0sIFZbMF0pICYmICFhYm92ZShQLCBWW24gLSAxXSwgVlswXSkpXG4gICAgICAgIHJldHVybiAwO1xuICAgIGZvciAoYSA9IDAsIGIgPSBuOzspIHtcbiAgICAgICAgaWYgKGIgLSBhID09PSAxKVxuICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbYl0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICBjID0gTWF0aC5mbG9vcigoYSArIGIpIC8gMik7XG4gICAgICAgIGRuQyA9IGJlbG93KFAsIFZbYyArIDFdLCBWW2NdKTtcbiAgICAgICAgaWYgKGRuQyAmJiAhYWJvdmUoUCwgVltjIC0gMV0sIFZbY10pKVxuICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgIHVwQSA9IGFib3ZlKFAsIFZbYSArIDFdLCBWW2FdKTtcbiAgICAgICAgaWYgKHVwQSkge1xuICAgICAgICAgICAgaWYgKGRuQylcbiAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChhYm92ZShQLCBWW2FdLCBWW2NdKSlcbiAgICAgICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZG5DKVxuICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGJlbG93KFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gTHRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSB7XG4gICAgdmFyIG4gPSBWLmxlbmd0aCAtIDE7XG4gICAgdmFyIGEsIGIsIGM7XG4gICAgdmFyIGRuQSwgZG5DO1xuICAgIGlmIChhYm92ZShQLCBWW24gLSAxXSwgVlswXSkgJiYgIWJlbG93KFAsIFZbMV0sIFZbMF0pKVxuICAgICAgICByZXR1cm4gMDtcbiAgICBmb3IgKGEgPSAwLCBiID0gbjs7KSB7XG4gICAgICAgIGlmIChiIC0gYSA9PT0gMSlcbiAgICAgICAgICAgIGlmIChiZWxvdyhQLCBWW2FdLCBWW2JdKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gYjtcbiAgICAgICAgYyA9IE1hdGguZmxvb3IoKGEgKyBiKSAvIDIpO1xuICAgICAgICBkbkMgPSBiZWxvdyhQLCBWW2MgKyAxXSwgVltjXSk7XG4gICAgICAgIGlmIChhYm92ZShQLCBWW2MgLSAxXSwgVltjXSkgJiYgIWRuQylcbiAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICBkbkEgPSBiZWxvdyhQLCBWW2EgKyAxXSwgVlthXSk7XG4gICAgICAgIGlmIChkbkEpIHtcbiAgICAgICAgICAgIGlmICghZG5DKVxuICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGJlbG93KFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGRuQylcbiAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChhYm92ZShQLCBWW2FdLCBWW2NdKSlcbiAgICAgICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHRhbmdlbnRfUG9seVBvbHlDKFYsIFcsIHQxLCB0MiwgY21wMSwgY21wMikge1xuICAgIHZhciBpeDEsIGl4MjtcbiAgICBpeDEgPSB0MShXWzBdLCBWKTtcbiAgICBpeDIgPSB0MihWW2l4MV0sIFcpO1xuICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgd2hpbGUgKCFkb25lKSB7XG4gICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgaWYgKGl4MSA9PT0gVi5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgIGl4MSA9IDA7XG4gICAgICAgICAgICBpZiAoY21wMShXW2l4Ml0sIFZbaXgxXSwgVltpeDEgKyAxXSkpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICArK2l4MTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgaWYgKGl4MiA9PT0gMClcbiAgICAgICAgICAgICAgICBpeDIgPSBXLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICBpZiAoY21wMihWW2l4MV0sIFdbaXgyXSwgV1tpeDIgLSAxXSkpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAtLWl4MjtcbiAgICAgICAgICAgIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB0MTogaXgxLCB0MjogaXgyIH07XG59XG5leHBvcnRzLnRhbmdlbnRfUG9seVBvbHlDID0gdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBMUnRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICB2YXIgcmwgPSBSTHRhbmdlbnRfUG9seVBvbHlDKFcsIFYpO1xuICAgIHJldHVybiB7IHQxOiBybC50MiwgdDI6IHJsLnQxIH07XG59XG5leHBvcnRzLkxSdGFuZ2VudF9Qb2x5UG9seUMgPSBMUnRhbmdlbnRfUG9seVBvbHlDO1xuZnVuY3Rpb24gUkx0YW5nZW50X1BvbHlQb2x5QyhWLCBXKSB7XG4gICAgcmV0dXJuIHRhbmdlbnRfUG9seVBvbHlDKFYsIFcsIFJ0YW5nZW50X1BvaW50UG9seUMsIEx0YW5nZW50X1BvaW50UG9seUMsIGFib3ZlLCBiZWxvdyk7XG59XG5leHBvcnRzLlJMdGFuZ2VudF9Qb2x5UG9seUMgPSBSTHRhbmdlbnRfUG9seVBvbHlDO1xuZnVuY3Rpb24gTEx0YW5nZW50X1BvbHlQb2x5QyhWLCBXKSB7XG4gICAgcmV0dXJuIHRhbmdlbnRfUG9seVBvbHlDKFYsIFcsIEx0YW5nZW50X1BvaW50UG9seUMsIEx0YW5nZW50X1BvaW50UG9seUMsIGJlbG93LCBiZWxvdyk7XG59XG5leHBvcnRzLkxMdGFuZ2VudF9Qb2x5UG9seUMgPSBMTHRhbmdlbnRfUG9seVBvbHlDO1xuZnVuY3Rpb24gUlJ0YW5nZW50X1BvbHlQb2x5QyhWLCBXKSB7XG4gICAgcmV0dXJuIHRhbmdlbnRfUG9seVBvbHlDKFYsIFcsIFJ0YW5nZW50X1BvaW50UG9seUMsIFJ0YW5nZW50X1BvaW50UG9seUMsIGFib3ZlLCBhYm92ZSk7XG59XG5leHBvcnRzLlJSdGFuZ2VudF9Qb2x5UG9seUMgPSBSUnRhbmdlbnRfUG9seVBvbHlDO1xudmFyIEJpVGFuZ2VudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmlUYW5nZW50KHQxLCB0Mikge1xuICAgICAgICB0aGlzLnQxID0gdDE7XG4gICAgICAgIHRoaXMudDIgPSB0MjtcbiAgICB9XG4gICAgcmV0dXJuIEJpVGFuZ2VudDtcbn0oKSk7XG5leHBvcnRzLkJpVGFuZ2VudCA9IEJpVGFuZ2VudDtcbnZhciBCaVRhbmdlbnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCaVRhbmdlbnRzKCkge1xuICAgIH1cbiAgICByZXR1cm4gQmlUYW5nZW50cztcbn0oKSk7XG5leHBvcnRzLkJpVGFuZ2VudHMgPSBCaVRhbmdlbnRzO1xudmFyIFRWR1BvaW50ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoVFZHUG9pbnQsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gVFZHUG9pbnQoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFRWR1BvaW50O1xufShQb2ludCkpO1xuZXhwb3J0cy5UVkdQb2ludCA9IFRWR1BvaW50O1xudmFyIFZpc2liaWxpdHlWZXJ0ZXggPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZpc2liaWxpdHlWZXJ0ZXgoaWQsIHBvbHlpZCwgcG9seXZlcnRpZCwgcCkge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMucG9seWlkID0gcG9seWlkO1xuICAgICAgICB0aGlzLnBvbHl2ZXJ0aWQgPSBwb2x5dmVydGlkO1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICBwLnZ2ID0gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFZpc2liaWxpdHlWZXJ0ZXg7XG59KCkpO1xuZXhwb3J0cy5WaXNpYmlsaXR5VmVydGV4ID0gVmlzaWJpbGl0eVZlcnRleDtcbnZhciBWaXNpYmlsaXR5RWRnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmlzaWJpbGl0eUVkZ2Uoc291cmNlLCB0YXJnZXQpIHtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIH1cbiAgICBWaXNpYmlsaXR5RWRnZS5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZHggPSB0aGlzLnNvdXJjZS5wLnggLSB0aGlzLnRhcmdldC5wLng7XG4gICAgICAgIHZhciBkeSA9IHRoaXMuc291cmNlLnAueSAtIHRoaXMudGFyZ2V0LnAueTtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgfTtcbiAgICByZXR1cm4gVmlzaWJpbGl0eUVkZ2U7XG59KCkpO1xuZXhwb3J0cy5WaXNpYmlsaXR5RWRnZSA9IFZpc2liaWxpdHlFZGdlO1xudmFyIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGggPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGgoUCwgZzApIHtcbiAgICAgICAgdGhpcy5QID0gUDtcbiAgICAgICAgdGhpcy5WID0gW107XG4gICAgICAgIHRoaXMuRSA9IFtdO1xuICAgICAgICBpZiAoIWcwKSB7XG4gICAgICAgICAgICB2YXIgbiA9IFAubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IFBbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwaiA9IHBbal0sIHZ2ID0gbmV3IFZpc2liaWxpdHlWZXJ0ZXgodGhpcy5WLmxlbmd0aCwgaSwgaiwgcGopO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLlYucHVzaCh2dik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChqID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRS5wdXNoKG5ldyBWaXNpYmlsaXR5RWRnZShwW2ogLSAxXS52diwgdnYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHAubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHBbMF0udnYsIHBbcC5sZW5ndGggLSAxXS52dikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIFBpID0gUFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFBqID0gUFtqXSwgdCA9IHRhbmdlbnRzKFBpLCBQaik7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHEgaW4gdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB0W3FdLCBzb3VyY2UgPSBQaVtjLnQxXSwgdGFyZ2V0ID0gUGpbYy50Ml07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVkZ2VJZlZpc2libGUoc291cmNlLCB0YXJnZXQsIGksIGopO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5WID0gZzAuVi5zbGljZSgwKTtcbiAgICAgICAgICAgIHRoaXMuRSA9IGcwLkUuc2xpY2UoMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuYWRkRWRnZUlmVmlzaWJsZSA9IGZ1bmN0aW9uICh1LCB2LCBpMSwgaTIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmludGVyc2VjdHNQb2x5cyhuZXcgTGluZVNlZ21lbnQodS54LCB1LnksIHYueCwgdi55KSwgaTEsIGkyKSkge1xuICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHUudnYsIHYudnYpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuYWRkUG9pbnQgPSBmdW5jdGlvbiAocCwgaTEpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLlAubGVuZ3RoO1xuICAgICAgICB0aGlzLlYucHVzaChuZXcgVmlzaWJpbGl0eVZlcnRleCh0aGlzLlYubGVuZ3RoLCBuLCAwLCBwKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaTEpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgcG9seSA9IHRoaXMuUFtpXSwgdCA9IHRhbmdlbnRfUG9pbnRQb2x5QyhwLCBwb2x5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShwLCBwb2x5W3QubHRhbl0sIGkxLCBpKTtcbiAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShwLCBwb2x5W3QucnRhbl0sIGkxLCBpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcC52djtcbiAgICB9O1xuICAgIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGgucHJvdG90eXBlLmludGVyc2VjdHNQb2x5cyA9IGZ1bmN0aW9uIChsLCBpMSwgaTIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLlAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSAhPSBpMSAmJiBpICE9IGkyICYmIGludGVyc2VjdHMobCwgdGhpcy5QW2ldKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGg7XG59KCkpO1xuZXhwb3J0cy5UYW5nZW50VmlzaWJpbGl0eUdyYXBoID0gVGFuZ2VudFZpc2liaWxpdHlHcmFwaDtcbmZ1bmN0aW9uIGludGVyc2VjdHMobCwgUCkge1xuICAgIHZhciBpbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDEsIG4gPSBQLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICB2YXIgaW50ID0gcmVjdGFuZ2xlXzEuUmVjdGFuZ2xlLmxpbmVJbnRlcnNlY3Rpb24obC54MSwgbC55MSwgbC54MiwgbC55MiwgUFtpIC0gMV0ueCwgUFtpIC0gMV0ueSwgUFtpXS54LCBQW2ldLnkpO1xuICAgICAgICBpZiAoaW50KVxuICAgICAgICAgICAgaW50cy5wdXNoKGludCk7XG4gICAgfVxuICAgIHJldHVybiBpbnRzO1xufVxuZnVuY3Rpb24gdGFuZ2VudHMoViwgVykge1xuICAgIHZhciBtID0gVi5sZW5ndGggLSAxLCBuID0gVy5sZW5ndGggLSAxO1xuICAgIHZhciBidCA9IG5ldyBCaVRhbmdlbnRzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgIHZhciB2MSA9IFZbaSA9PSAwID8gbSAtIDEgOiBpIC0gMV07XG4gICAgICAgICAgICB2YXIgdjIgPSBWW2ldO1xuICAgICAgICAgICAgdmFyIHYzID0gVltpICsgMV07XG4gICAgICAgICAgICB2YXIgdzEgPSBXW2ogPT0gMCA/IG4gLSAxIDogaiAtIDFdO1xuICAgICAgICAgICAgdmFyIHcyID0gV1tqXTtcbiAgICAgICAgICAgIHZhciB3MyA9IFdbaiArIDFdO1xuICAgICAgICAgICAgdmFyIHYxdjJ3MiA9IGlzTGVmdCh2MSwgdjIsIHcyKTtcbiAgICAgICAgICAgIHZhciB2MncxdzIgPSBpc0xlZnQodjIsIHcxLCB3Mik7XG4gICAgICAgICAgICB2YXIgdjJ3MnczID0gaXNMZWZ0KHYyLCB3MiwgdzMpO1xuICAgICAgICAgICAgdmFyIHcxdzJ2MiA9IGlzTGVmdCh3MSwgdzIsIHYyKTtcbiAgICAgICAgICAgIHZhciB3MnYxdjIgPSBpc0xlZnQodzIsIHYxLCB2Mik7XG4gICAgICAgICAgICB2YXIgdzJ2MnYzID0gaXNMZWZ0KHcyLCB2MiwgdjMpO1xuICAgICAgICAgICAgaWYgKHYxdjJ3MiA+PSAwICYmIHYydzF3MiA+PSAwICYmIHYydzJ3MyA8IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPj0gMCAmJiB3MnYxdjIgPj0gMCAmJiB3MnYydjMgPCAwKSB7XG4gICAgICAgICAgICAgICAgYnQubGwgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodjF2MncyIDw9IDAgJiYgdjJ3MXcyIDw9IDAgJiYgdjJ3MnczID4gMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA8PSAwICYmIHcydjF2MiA8PSAwICYmIHcydjJ2MyA+IDApIHtcbiAgICAgICAgICAgICAgICBidC5yciA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2MXYydzIgPD0gMCAmJiB2MncxdzIgPiAwICYmIHYydzJ3MyA8PSAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyID49IDAgJiYgdzJ2MXYyIDwgMCAmJiB3MnYydjMgPj0gMCkge1xuICAgICAgICAgICAgICAgIGJ0LnJsID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHYxdjJ3MiA+PSAwICYmIHYydzF3MiA8IDAgJiYgdjJ3MnczID49IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPD0gMCAmJiB3MnYxdjIgPiAwICYmIHcydjJ2MyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgYnQubHIgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidDtcbn1cbmV4cG9ydHMudGFuZ2VudHMgPSB0YW5nZW50cztcbmZ1bmN0aW9uIGlzUG9pbnRJbnNpZGVQb2x5KHAsIHBvbHkpIHtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IHBvbHkubGVuZ3RoOyBpIDwgbjsgKytpKVxuICAgICAgICBpZiAoYmVsb3cocG9seVtpIC0gMV0sIHBvbHlbaV0sIHApKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gaXNBbnlQSW5RKHAsIHEpIHtcbiAgICByZXR1cm4gIXAuZXZlcnkoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICFpc1BvaW50SW5zaWRlUG9seSh2LCBxKTsgfSk7XG59XG5mdW5jdGlvbiBwb2x5c092ZXJsYXAocCwgcSkge1xuICAgIGlmIChpc0FueVBJblEocCwgcSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmIChpc0FueVBJblEocSwgcCkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGZvciAodmFyIGkgPSAxLCBuID0gcC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgdmFyIHYgPSBwW2ldLCB1ID0gcFtpIC0gMV07XG4gICAgICAgIGlmIChpbnRlcnNlY3RzKG5ldyBMaW5lU2VnbWVudCh1LngsIHUueSwgdi54LCB2LnkpLCBxKS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmV4cG9ydHMucG9seXNPdmVybGFwID0gcG9seXNPdmVybGFwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWjJWdmJTNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDJkbGIyMHVkSE1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN096czdPenM3TzBGQlFVRXNlVU5CUVhGRE8wRkJRMnBETzBsQlFVRTdTVUZIUVN4RFFVRkRPMGxCUVVRc1dVRkJRenRCUVVGRUxFTkJRVU1zUVVGSVJDeEpRVWRETzBGQlNGa3NjMEpCUVVzN1FVRkxiRUk3U1VGRFNTeHhRa0ZCYlVJc1JVRkJWU3hGUVVGVExFVkJRVlVzUlVGQlV5eEZRVUZWTEVWQlFWTXNSVUZCVlR0UlFVRnVSU3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlFWTXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdVVUZCVXl4UFFVRkZMRWRCUVVZc1JVRkJSU3hEUVVGUk8wbEJRVWtzUTBGQlF6dEpRVU12Uml4clFrRkJRenRCUVVGRUxFTkJRVU1zUVVGR1JDeEpRVVZETzBGQlJsa3NhME5CUVZjN1FVRkplRUk3U1VGQkswSXNOa0pCUVVzN1NVRkJjRU03TzBsQlJVRXNRMEZCUXp0SlFVRkVMR2RDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVVpFTEVOQlFTdENMRXRCUVVzc1IwRkZia003UVVGR1dTdzRRa0ZCVXp0QlFWVjBRaXhuUWtGQmRVSXNSVUZCVXl4RlFVRkZMRVZCUVZNc1JVRkJSU3hGUVVGVE8wbEJRMnhFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wRkJRM3BGTEVOQlFVTTdRVUZHUkN4M1FrRkZRenRCUVVWRUxHVkJRV1VzUTBGQlVTeEZRVUZGTEVWQlFWTXNSVUZCUlN4RlFVRlRPMGxCUTNwRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYWtNc1EwRkJRenRCUVVWRUxHVkJRV1VzUTBGQlVTeEZRVUZGTEVWQlFWTXNSVUZCUlN4RlFVRlRPMGxCUTNwRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYWtNc1EwRkJRenRCUVZORUxHOUNRVUV5UWl4RFFVRlZPMGxCUTJwRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVzVETEVOQlFXMURMRU5CUVVNc1EwRkJRenRKUVVOMlJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU53UWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRFppeEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeENMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEzSkNMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRE8xbEJRVU1zUzBGQlN5eERRVUZETzBsQlF5OUNMRU5CUVVNN1NVRkRSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZaTEVWQlFVVXNRMEZCUXp0SlFVTndRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkROVUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRlNpeEpRVUZKTEUxQlFVMHNSVUZCUlN4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVOMlFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXp0blFrRkJReXhMUVVGTExFTkJRVU03VVVGREwwSXNUVUZCVFN4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGSFppeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRPMUZCUTFnc1QwRkJUeXhGUVVGRkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVWQlFVVXNRMEZCUXp0WlFVVnVRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRTFCUVUwc1EwRkJRenRuUWtGRGRFUXNVVUZCVVN4RFFVRkRPMWxCUldJc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZEYmtJc1EwRkJRenRuUWtGRlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOdVJDeExRVUZMTEVOQlFVTTdaMEpCUTFZc1NVRkJTVHR2UWtGRFFTeERRVUZETEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOMFFpeERRVUZETzFsQlEwUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFMUJRVTBzUTBGQlF6dG5Ra0ZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFTkJRVU03VVVGSFJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1RVRkJUU3hEUVVGRE8xbEJRMnBDTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZEVJc1NVRkJTU3hIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnVRaXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETzFGQlExZ3NUMEZCVHl4RlFVRkZMRU5CUVVNc1NVRkJTU3hOUVVGTkxFVkJRVVVzUTBGQlF6dFpRVVZ1UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXp0blFrRkRkRVFzVVVGQlVTeERRVUZETzFsQlJXSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFZEJRVWNzUlVGRGNrSXNRMEZCUXp0blFrRkZSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVTnVSQ3hMUVVGTExFTkJRVU03WjBKQlExWXNTVUZCU1R0dlFrRkRRU3hEUVVGRExFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhEUVVGRE8xbEJRMFFzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRTFCUVUwc1EwRkJRenRuUWtGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeERMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJRMFFzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0QlFVTmlMRU5CUVVNN1FVRTVSRVFzWjBOQk9FUkRPMEZCUjBRc09FSkJRWEZETEVOQlFWRXNSVUZCUlN4RFFVRlZMRVZCUVVVc1EwRkJjVUk3U1VGRE5VVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlExZ3NWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVc1RkxFTkJRVzFGTEVOQlF6VkZMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBGQlEzSkNMRU5CUVVNN1FVRktSQ3h2UkVGSlF6dEJRVVZFTEhWQ1FVRjFRaXhEUVVGWkxFVkJRVVVzUlVGQlpUdEpRVU5vUkN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVTBGQlV5eExRVUZMTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRVU1zVFVGQlRTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOb1JDeE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdRVUZETDBJc1EwRkJRenRCUVVWRUxIVkNRVUYxUWl4RFFVRlpMRVZCUVVVc1JVRkJaVHRKUVVOb1JDeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1UwRkJVeXhMUVVGTExFTkJRVU1zUTBGQlF6dFJRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTm9SQ3hOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03UVVGREwwSXNRMEZCUXp0QlFWRkVMRFJDUVVFMFFpeERRVUZSTEVWQlFVVXNRMEZCVlR0SlFVYzFReXhKUVVGSkxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM3BDTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZGYmtJc1RVRkJUU3hEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEcxQ1FVRnRRaXhEUVVGRExFTkJRVU1zUlVGQlJTeFBRVUZQTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc2JVSkJRVzFDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU03UVVGRE5VWXNRMEZCUXp0QlFWTkVMRFpDUVVFMlFpeERRVUZSTEVWQlFVVXNRMEZCVlR0SlFVTTNReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVkeVFpeEpRVUZKTEVOQlFWTXNSVUZCUlN4RFFVRlRMRVZCUVVVc1EwRkJVeXhEUVVGRE8wbEJRM0JETEVsQlFVa3NSMEZCV1N4RlFVRkZMRWRCUVZrc1EwRkJRenRKUVVrdlFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJSV0lzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZMTEVOQlFVTTdVVUZEYmtJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRXaXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGNrSXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOaUxFbEJRVWs3WjBKQlEwRXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWcVFpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNMVFpeEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF5OUNMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5xUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJTV0lzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEwNHNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRE8yZENRVU5LTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRWaXhKUVVGSkxFTkJRVU1zUTBGQlF6dG5Ra0ZEUml4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRWaXhKUVVGSk8yOUNRVU5CTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTBZc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTTdaMEpCUTB3c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU5XTEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOR0xFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU55UWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yZENRVU5XTEVsQlFVazdiMEpCUTBFc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU5rTEVOQlFVTTdVVUZEVEN4RFFVRkRPMGxCUTB3c1EwRkJRenRCUVVOTUxFTkJRVU03UVVGUlJDdzJRa0ZCTmtJc1EwRkJVU3hGUVVGRkxFTkJRVlU3U1VGRE4wTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZGY2tJc1NVRkJTU3hEUVVGVExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFWTXNRMEZCUXp0SlFVTndReXhKUVVGSkxFZEJRVmtzUlVGQlJTeEhRVUZaTEVOQlFVTTdTVUZKTDBJc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVVmlMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTeXhEUVVGRE8xRkJRMjVDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFsQlExb3NSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNKQ0xFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEWWl4SlFVRkpPMmRDUVVOQkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZGYWtJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETlVJc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNdlFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNN1dVRkRha01zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVbGlMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRMMElzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOT0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRPMmRDUVVOTUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEVml4SlFVRkpMRU5CUVVNc1EwRkJRenRuUWtGRFJpeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEY2tJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZEVml4SlFVRkpPMjlDUVVOQkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEWkN4RFFVRkRPMUZCUTB3c1EwRkJRenRSUVVORUxFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEwWXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRE8yZENRVU5LTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRWaXhKUVVGSkxFTkJRVU1zUTBGQlF6dG5Ra0ZEUml4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRWaXhKUVVGSk8yOUNRVU5CTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hEUVVGRE8xRkJRMHdzUTBGQlF6dEpRVU5NTEVOQlFVTTdRVUZEVEN4RFFVRkRPMEZCVTBRc01rSkJRV3RETEVOQlFWVXNSVUZCUlN4RFFVRlZMRVZCUVVVc1JVRkJiME1zUlVGQlJTeEZRVUZ2UXl4RlFVRkZMRWxCUVN0RExFVkJRVVVzU1VGQkswTTdTVUZEYkU4c1NVRkJTU3hIUVVGWExFVkJRVVVzUjBGQlZ5eERRVUZETzBsQlJ6ZENMRWRCUVVjc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhDTEVkQlFVY3NSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUjNCQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXp0SlFVTnFRaXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVVUZEV0N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMW9zVDBGQlR5eEpRVUZKTEVWQlFVVXNRMEZCUXp0WlFVTldMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJ4RExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkJReXhMUVVGTExFTkJRVU03V1VGRE5VTXNSVUZCUlN4SFFVRkhMRU5CUVVNN1VVRkRWaXhEUVVGRE8xRkJRMFFzVDBGQlR5eEpRVUZKTEVWQlFVVXNRMEZCUXp0WlFVTldMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTTdaMEpCUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJ4RExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkJReXhMUVVGTExFTkJRVU03V1VGRE5VTXNSVUZCUlN4SFFVRkhMRU5CUVVNN1dVRkRUaXhKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEycENMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJRMFFzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZEYUVNc1EwRkJRenRCUVhoQ1JDdzRRMEYzUWtNN1FVRkZSQ3cyUWtGQmIwTXNRMEZCVlN4RlFVRkZMRU5CUVZVN1NVRkRkRVFzU1VGQlNTeEZRVUZGTEVkQlFVY3NiVUpCUVcxQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTI1RExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1FVRkRjRU1zUTBGQlF6dEJRVWhFTEd0RVFVZERPMEZCUlVRc05rSkJRVzlETEVOQlFWVXNSVUZCUlN4RFFVRlZPMGxCUTNSRUxFMUJRVTBzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEcxQ1FVRnRRaXhGUVVGRkxHMUNRVUZ0UWl4RlFVRkZMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dEJRVU16Uml4RFFVRkRPMEZCUmtRc2EwUkJSVU03UVVGRlJDdzJRa0ZCYjBNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGRGRFUXNUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc2JVSkJRVzFDTEVWQlFVVXNiVUpCUVcxQ0xFVkJRVVVzUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMEZCUXpOR0xFTkJRVU03UVVGR1JDeHJSRUZGUXp0QlFVVkVMRFpDUVVGdlF5eERRVUZWTEVWQlFVVXNRMEZCVlR0SlFVTjBSQ3hOUVVGTkxFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeHRRa0ZCYlVJc1JVRkJSU3h0UWtGQmJVSXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03UVVGRE0wWXNRMEZCUXp0QlFVWkVMR3RFUVVWRE8wRkJSVVE3U1VGRFNTeHRRa0ZCYlVJc1JVRkJWU3hGUVVGVExFVkJRVlU3VVVGQk4wSXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdTVUZCU1N4RFFVRkRPMGxCUTNwRUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRkdXU3c0UWtGQlV6dEJRVWwwUWp0SlFVRkJPMGxCUzBFc1EwRkJRenRKUVVGRUxHbENRVUZETzBGQlFVUXNRMEZCUXl4QlFVeEVMRWxCUzBNN1FVRk1XU3huUTBGQlZUdEJRVTkyUWp0SlFVRTRRaXcwUWtGQlN6dEpRVUZ1UXpzN1NVRkZRU3hEUVVGRE8wbEJRVVFzWlVGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4RFFVRTRRaXhMUVVGTExFZEJSV3hETzBGQlJsa3NORUpCUVZFN1FVRkpja0k3U1VGRFNTd3dRa0ZEVnl4RlFVRlZMRVZCUTFZc1RVRkJZeXhGUVVOa0xGVkJRV3RDTEVWQlEyeENMRU5CUVZjN1VVRklXQ3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlExWXNWMEZCVFN4SFFVRk9MRTFCUVUwc1EwRkJVVHRSUVVOa0xHVkJRVlVzUjBGQlZpeFZRVUZWTEVOQlFWRTdVVUZEYkVJc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQlZUdFJRVVZzUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUTB3c2RVSkJRVU03UVVGQlJDeERRVUZETEVGQlZFUXNTVUZUUXp0QlFWUlpMRFJEUVVGblFqdEJRVmMzUWp0SlFVTkpMSGRDUVVOWExFMUJRWGRDTEVWQlEzaENMRTFCUVhkQ08xRkJSSGhDTEZkQlFVMHNSMEZCVGl4TlFVRk5MRU5CUVd0Q08xRkJRM2hDTEZkQlFVMHNSMEZCVGl4TlFVRk5MRU5CUVd0Q08wbEJRVWtzUTBGQlF6dEpRVU40UXl3clFrRkJUU3hIUVVGT08xRkJRMGtzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpORExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGRFRDeHhRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRlVSQ3hKUVZORE8wRkJWRmtzZDBOQlFXTTdRVUZYTTBJN1NVRkhTU3huUTBGQmJVSXNRMEZCWlN4RlFVRkZMRVZCUVcxRU8xRkJRWEJGTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVdNN1VVRkdiRU1zVFVGQlF5eEhRVUYxUWl4RlFVRkZMRU5CUVVNN1VVRkRNMElzVFVGQlF5eEhRVUZ4UWl4RlFVRkZMRU5CUVVNN1VVRkZja0lzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMDRzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVWcVFpeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVU42UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUldJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN2IwSkJRMmhETEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRFZDeEZRVUZGTEVkQlFVY3NTVUZCU1N4blFrRkJaMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVOMlJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZKYUVJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0M1FrRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTm9SU3hEUVVGRE8yZENRVVZFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJpeERRVUZETzFsQlEwUXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdaMEpCUXpkQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFpDeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dHZRa0ZETjBJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTlVMRU5CUVVNc1IwRkJSeXhSUVVGUkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVONlFpeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzNkQ1FVTmtMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZEVWl4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0M1FrRkRla01zU1VGQlNTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5vUkN4RFFVRkRPMmRDUVVOTUxFTkJRVU03V1VGRFRDeERRVUZETzFGQlEwd3NRMEZCUXp0UlFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRMG9zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6TkNMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJRMFFzYVVSQlFXZENMRWRCUVdoQ0xGVkJRV2xDTEVOQlFWY3NSVUZCUlN4RFFVRlhMRVZCUVVVc1JVRkJWU3hGUVVGRkxFVkJRVlU3VVVGRE4wUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzSkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRhRVFzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZEUkN4NVEwRkJVU3hIUVVGU0xGVkJRVk1zUTBGQlZ5eEZRVUZGTEVWQlFWVTdVVUZETlVJc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRkRUlzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE1VUXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFpRVU42UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzJkQ1FVRkRMRkZCUVZFc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU5vUWl4RFFVRkRMRWRCUVVjc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM0JETEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRPVU1zU1VGQlNTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnNSQ3hEUVVGRE8xRkJRMFFzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVU5QTEdkRVFVRmxMRWRCUVhaQ0xGVkJRWGRDTEVOQlFXTXNSVUZCUlN4RlFVRlZMRVZCUVVVc1JVRkJWVHRSUVVNeFJDeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVNMVF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUXpWRUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdXVUZEYUVJc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRFRDdzJRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRm9SVVFzU1VGblJVTTdRVUZvUlZrc2QwUkJRWE5DTzBGQmEwVnVReXh2UWtGQmIwSXNRMEZCWXl4RlFVRkZMRU5CUVZVN1NVRkRNVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJRc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFJRVU4yUXl4SlFVRkpMRWRCUVVjc1IwRkJSeXh4UWtGQlV5eERRVUZETEdkQ1FVRm5RaXhEUVVOb1F5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRMVlzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVOV0xFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUTJJc1EwRkJRenRSUVVOT0xFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXp0WlFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZETlVJc1EwRkJRenRKUVVORUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdRVUZEYUVJc1EwRkJRenRCUVVWRUxHdENRVUY1UWl4RFFVRlZMRVZCUVVVc1EwRkJWVHRKUVVVelF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRGRrTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hWUVVGVkxFVkJRVVVzUTBGQlF6dEpRVU14UWl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEzcENMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEWkN4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJ4Q0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEpRVUZKTEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTm9ReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU5vUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVOb1F5eEpRVUZKTEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTm9ReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU5vUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVOb1F5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNN2JVSkJRM0pETEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE1VTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRjRU1zUTBGQlF6dFpRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU03YlVKQlF6VkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNFTXNRMEZCUXp0WlFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhEUVVGRExFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTTdiVUpCUXpWRExFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNc1NVRkJTU3hOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRNVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSMEZCUnl4SlFVRkpMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY0VNc1EwRkJRenRaUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEVsQlFVa3NUVUZCVFN4SlFVRkpMRU5CUVVNN2JVSkJRelZETEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE1VTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRjRU1zUTBGQlF6dFJRVU5NTEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCUTBRc1RVRkJUU3hEUVVGRExFVkJRVVVzUTBGQlF6dEJRVU5rTEVOQlFVTTdRVUZzUTBRc05FSkJhME5ETzBGQlJVUXNNa0pCUVRKQ0xFTkJRVkVzUlVGQlJTeEpRVUZoTzBsQlF6bERMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRSUVVOMlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRE8wbEJRM0pFTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1FVRkRhRUlzUTBGQlF6dEJRVVZFTEcxQ1FVRnRRaXhEUVVGVkxFVkJRVVVzUTBGQlZUdEpRVU55UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRWGhDTEVOQlFYZENMRU5CUVVNc1EwRkJRenRCUVVOdVJDeERRVUZETzBGQlJVUXNjMEpCUVRaQ0xFTkJRVlVzUlVGQlJTeERRVUZWTzBsQlF5OURMRVZCUVVVc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEycERMRVZCUVVVc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEycERMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGRrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6TkNMRVZCUVVVc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eEpRVUZKTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1NVRkRia1lzUTBGQlF6dEpRVU5FTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNN1FVRkRha0lzUTBGQlF6dEJRVkpFTEc5RFFWRkRJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgdnBzY18xID0gcmVxdWlyZShcIi4vdnBzY1wiKTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIE5vZGVXcmFwcGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlV3JhcHBlcihpZCwgcmVjdCwgY2hpbGRyZW4pIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlY3QgPSByZWN0O1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgIHRoaXMubGVhZiA9IHR5cGVvZiBjaGlsZHJlbiA9PT0gJ3VuZGVmaW5lZCcgfHwgY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgICByZXR1cm4gTm9kZVdyYXBwZXI7XG59KCkpO1xuZXhwb3J0cy5Ob2RlV3JhcHBlciA9IE5vZGVXcmFwcGVyO1xudmFyIFZlcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZlcnQoaWQsIHgsIHksIG5vZGUsIGxpbmUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHZvaWQgMCkgeyBub2RlID0gbnVsbDsgfVxuICAgICAgICBpZiAobGluZSA9PT0gdm9pZCAwKSB7IGxpbmUgPSBudWxsOyB9XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgdGhpcy5saW5lID0gbGluZTtcbiAgICB9XG4gICAgcmV0dXJuIFZlcnQ7XG59KCkpO1xuZXhwb3J0cy5WZXJ0ID0gVmVydDtcbnZhciBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShzLCB0KSB7XG4gICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIHRoaXMudCA9IHQ7XG4gICAgICAgIHZhciBtZiA9IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZS5maW5kTWF0Y2gocywgdCk7XG4gICAgICAgIHZhciB0ciA9IHQuc2xpY2UoMCkucmV2ZXJzZSgpO1xuICAgICAgICB2YXIgbXIgPSBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoKHMsIHRyKTtcbiAgICAgICAgaWYgKG1mLmxlbmd0aCA+PSBtci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbWYubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5zaSA9IG1mLnNpO1xuICAgICAgICAgICAgdGhpcy50aSA9IG1mLnRpO1xuICAgICAgICAgICAgdGhpcy5yZXZlcnNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZW5ndGggPSBtci5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnNpID0gbXIuc2k7XG4gICAgICAgICAgICB0aGlzLnRpID0gdC5sZW5ndGggLSBtci50aSAtIG1yLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMucmV2ZXJzZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZS5maW5kTWF0Y2ggPSBmdW5jdGlvbiAocywgdCkge1xuICAgICAgICB2YXIgbSA9IHMubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHQubGVuZ3RoO1xuICAgICAgICB2YXIgbWF0Y2ggPSB7IGxlbmd0aDogMCwgc2k6IC0xLCB0aTogLTEgfTtcbiAgICAgICAgdmFyIGwgPSBuZXcgQXJyYXkobSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbTsgaSsrKSB7XG4gICAgICAgICAgICBsW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyBqKyspXG4gICAgICAgICAgICAgICAgaWYgKHNbaV0gPT09IHRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBsW2ldW2pdID0gKGkgPT09IDAgfHwgaiA9PT0gMCkgPyAxIDogbFtpIC0gMV1baiAtIDFdICsgMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgPiBtYXRjaC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLmxlbmd0aCA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5zaSA9IGkgLSB2ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLnRpID0gaiAtIHYgKyAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBsW2ldW2pdID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfTtcbiAgICBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UucHJvdG90eXBlLmdldFNlcXVlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPj0gMCA/IHRoaXMucy5zbGljZSh0aGlzLnNpLCB0aGlzLnNpICsgdGhpcy5sZW5ndGgpIDogW107XG4gICAgfTtcbiAgICByZXR1cm4gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xufSgpKTtcbmV4cG9ydHMuTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xudmFyIEdyaWRSb3V0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyaWRSb3V0ZXIob3JpZ2luYWxub2RlcywgYWNjZXNzb3IsIGdyb3VwUGFkZGluZykge1xuICAgICAgICBpZiAoZ3JvdXBQYWRkaW5nID09PSB2b2lkIDApIHsgZ3JvdXBQYWRkaW5nID0gMTI7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5vcmlnaW5hbG5vZGVzID0gb3JpZ2luYWxub2RlcztcbiAgICAgICAgdGhpcy5ncm91cFBhZGRpbmcgPSBncm91cFBhZGRpbmc7XG4gICAgICAgIHRoaXMubGVhdmVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG9yaWdpbmFsbm9kZXMubWFwKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiBuZXcgTm9kZVdyYXBwZXIoaSwgYWNjZXNzb3IuZ2V0Qm91bmRzKHYpLCBhY2Nlc3Nvci5nZXRDaGlsZHJlbih2KSk7IH0pO1xuICAgICAgICB0aGlzLmxlYXZlcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmxlYWY7IH0pO1xuICAgICAgICB0aGlzLmdyb3VwcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiAhZy5sZWFmOyB9KTtcbiAgICAgICAgdGhpcy5jb2xzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3gnKTtcbiAgICAgICAgdGhpcy5yb3dzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3knKTtcbiAgICAgICAgdGhpcy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHYuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMubm9kZXNbY10ucGFyZW50ID0gdjsgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3QgPSB7IGNoaWxkcmVuOiBbXSB9O1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdi5wYXJlbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdi5wYXJlbnQgPSBfdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIF90aGlzLnJvb3QuY2hpbGRyZW4ucHVzaCh2LmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHYucG9ydHMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYmFja1RvRnJvbnQgPSB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgICAgICB0aGlzLmJhY2tUb0Zyb250LnNvcnQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIF90aGlzLmdldERlcHRoKHgpIC0gX3RoaXMuZ2V0RGVwdGgoeSk7IH0pO1xuICAgICAgICB2YXIgZnJvbnRUb0JhY2tHcm91cHMgPSB0aGlzLmJhY2tUb0Zyb250LnNsaWNlKDApLnJldmVyc2UoKS5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuICFnLmxlYWY7IH0pO1xuICAgICAgICBmcm9udFRvQmFja0dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB2YXIgciA9IHJlY3RhbmdsZV8xLlJlY3RhbmdsZS5lbXB0eSgpO1xuICAgICAgICAgICAgdi5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiByID0gci51bmlvbihfdGhpcy5ub2Rlc1tjXS5yZWN0KTsgfSk7XG4gICAgICAgICAgICB2LnJlY3QgPSByLmluZmxhdGUoX3RoaXMuZ3JvdXBQYWRkaW5nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBjb2xNaWRzID0gdGhpcy5taWRQb2ludHModGhpcy5jb2xzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5wb3M7IH0pKTtcbiAgICAgICAgdmFyIHJvd01pZHMgPSB0aGlzLm1pZFBvaW50cyh0aGlzLnJvd3MubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnBvczsgfSkpO1xuICAgICAgICB2YXIgcm93eCA9IGNvbE1pZHNbMF0sIHJvd1ggPSBjb2xNaWRzW2NvbE1pZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBjb2x5ID0gcm93TWlkc1swXSwgY29sWSA9IHJvd01pZHNbcm93TWlkcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIGhsaW5lcyA9IHRoaXMucm93cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuICh7IHgxOiByb3d4LCB4Mjogcm93WCwgeTE6IHIucG9zLCB5Mjogci5wb3MgfSk7IH0pXG4gICAgICAgICAgICAuY29uY2F0KHJvd01pZHMubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiAoeyB4MTogcm93eCwgeDI6IHJvd1gsIHkxOiBtLCB5MjogbSB9KTsgfSkpO1xuICAgICAgICB2YXIgdmxpbmVzID0gdGhpcy5jb2xzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gKHsgeDE6IGMucG9zLCB4MjogYy5wb3MsIHkxOiBjb2x5LCB5MjogY29sWSB9KTsgfSlcbiAgICAgICAgICAgIC5jb25jYXQoY29sTWlkcy5tYXAoZnVuY3Rpb24gKG0pIHsgcmV0dXJuICh7IHgxOiBtLCB4MjogbSwgeTE6IGNvbHksIHkyOiBjb2xZIH0pOyB9KSk7XG4gICAgICAgIHZhciBsaW5lcyA9IGhsaW5lcy5jb25jYXQodmxpbmVzKTtcbiAgICAgICAgbGluZXMuZm9yRWFjaChmdW5jdGlvbiAobCkgeyByZXR1cm4gbC52ZXJ0cyA9IFtdOyB9KTtcbiAgICAgICAgdGhpcy52ZXJ0cyA9IFtdO1xuICAgICAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgICAgIGhsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmxpbmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgdi54MSwgaC55MSk7XG4gICAgICAgICAgICAgICAgaC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHYudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICBfdGhpcy52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHZhciBpID0gX3RoaXMuYmFja1RvRnJvbnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFja1RvRnJvbnRbaV0sIHIgPSBub2RlLnJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHAueCAtIHIuY3goKSksIGR5ID0gTWF0aC5hYnMocC55IC0gci5jeSgpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGR4IDwgci53aWR0aCgpIC8gMiAmJiBkeSA8IHIuaGVpZ2h0KCkgLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGwsIGxpKSB7XG4gICAgICAgICAgICBfdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgdi5yZWN0LmxpbmVJbnRlcnNlY3Rpb25zKGwueDEsIGwueTEsIGwueDIsIGwueTIpLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCwgaikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgaW50ZXJzZWN0LngsIGludGVyc2VjdC55LCB2LCBsKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICAgICAgbC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgICAgICB2LnBvcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBpc0hvcml6ID0gTWF0aC5hYnMobC55MSAtIGwueTIpIDwgMC4xO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGlzSG9yaXogPyBiLnggLSBhLnggOiBiLnkgLSBhLnk7IH07XG4gICAgICAgICAgICBsLnZlcnRzLnNvcnQoZGVsdGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsLnZlcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBsLnZlcnRzW2kgLSAxXSwgdiA9IGwudmVydHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHUubm9kZSAmJiB1Lm5vZGUgPT09IHYubm9kZSAmJiB1Lm5vZGUubGVhZilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgX3RoaXMuZWRnZXMucHVzaCh7IHNvdXJjZTogdS5pZCwgdGFyZ2V0OiB2LmlkLCBsZW5ndGg6IE1hdGguYWJzKGRlbHRhKHUsIHYpKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmF2ZyA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLnJlZHVjZShmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCArIHk7IH0pIC8gYS5sZW5ndGg7IH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0R3JpZExpbmVzID0gZnVuY3Rpb24gKGF4aXMpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcbiAgICAgICAgdmFyIGxzID0gdGhpcy5sZWF2ZXMuc2xpY2UoMCwgdGhpcy5sZWF2ZXMubGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKGxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBvdmVybGFwcGluZyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5yZWN0WydvdmVybGFwJyArIGF4aXMudG9VcHBlckNhc2UoKV0obHNbMF0ucmVjdCk7IH0pO1xuICAgICAgICAgICAgdmFyIGNvbCA9IHtcbiAgICAgICAgICAgICAgICBub2Rlczogb3ZlcmxhcHBpbmcsXG4gICAgICAgICAgICAgICAgcG9zOiB0aGlzLmF2ZyhvdmVybGFwcGluZy5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucmVjdFsnYycgKyBheGlzXSgpOyB9KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIGNvbC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBscy5zcGxpY2UobHMuaW5kZXhPZih2KSwgMSk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5wb3MgLSBiLnBvczsgfSk7XG4gICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0RGVwdGggPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgZGVwdGggPSAwO1xuICAgICAgICB3aGlsZSAodi5wYXJlbnQgIT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgZGVwdGgrKztcbiAgICAgICAgICAgIHYgPSB2LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5taWRQb2ludHMgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICB2YXIgZ2FwID0gYVsxXSAtIGFbMF07XG4gICAgICAgIHZhciBtaWRzID0gW2FbMF0gLSBnYXAgLyAyXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtaWRzLnB1c2goKGFbaV0gKyBhW2kgLSAxXSkgLyAyKTtcbiAgICAgICAgfVxuICAgICAgICBtaWRzLnB1c2goYVthLmxlbmd0aCAtIDFdICsgZ2FwIC8gMik7XG4gICAgICAgIHJldHVybiBtaWRzO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZmluZExpbmVhZ2UgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgbGluZWFnZSA9IFt2XTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdiA9IHYucGFyZW50O1xuICAgICAgICAgICAgbGluZWFnZS5wdXNoKHYpO1xuICAgICAgICB9IHdoaWxlICh2ICE9PSB0aGlzLnJvb3QpO1xuICAgICAgICByZXR1cm4gbGluZWFnZS5yZXZlcnNlKCk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5maW5kQW5jZXN0b3JQYXRoQmV0d2VlbiA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhYSA9IHRoaXMuZmluZExpbmVhZ2UoYSksIGJhID0gdGhpcy5maW5kTGluZWFnZShiKSwgaSA9IDA7XG4gICAgICAgIHdoaWxlIChhYVtpXSA9PT0gYmFbaV0pXG4gICAgICAgICAgICBpKys7XG4gICAgICAgIHJldHVybiB7IGNvbW1vbkFuY2VzdG9yOiBhYVtpIC0gMV0sIGxpbmVhZ2VzOiBhYS5zbGljZShpKS5jb25jYXQoYmEuc2xpY2UoaSkpIH07XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5zaWJsaW5nT2JzdGFjbGVzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmZpbmRBbmNlc3RvclBhdGhCZXR3ZWVuKGEsIGIpO1xuICAgICAgICB2YXIgbGluZWFnZUxvb2t1cCA9IHt9O1xuICAgICAgICBwYXRoLmxpbmVhZ2VzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGxpbmVhZ2VMb29rdXBbdi5pZF0gPSB7fTsgfSk7XG4gICAgICAgIHZhciBvYnN0YWNsZXMgPSBwYXRoLmNvbW1vbkFuY2VzdG9yLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gISh2IGluIGxpbmVhZ2VMb29rdXApOyB9KTtcbiAgICAgICAgcGF0aC5saW5lYWdlc1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wYXJlbnQgIT09IHBhdGguY29tbW9uQW5jZXN0b3I7IH0pXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gb2JzdGFjbGVzID0gb2JzdGFjbGVzLmNvbmNhdCh2LnBhcmVudC5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMgIT09IHYuaWQ7IH0pKTsgfSk7XG4gICAgICAgIHJldHVybiBvYnN0YWNsZXMubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiBfdGhpcy5ub2Rlc1t2XTsgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzID0gZnVuY3Rpb24gKHJvdXRlcywgeCwgeSkge1xuICAgICAgICB2YXIgdnNlZ21lbnRzID0gW107XG4gICAgICAgIGZvciAodmFyIGVpID0gMDsgZWkgPCByb3V0ZXMubGVuZ3RoOyBlaSsrKSB7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbZWldO1xuICAgICAgICAgICAgZm9yICh2YXIgc2kgPSAwOyBzaSA8IHJvdXRlLmxlbmd0aDsgc2krKykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gcm91dGVbc2ldO1xuICAgICAgICAgICAgICAgIHMuZWRnZWlkID0gZWk7XG4gICAgICAgICAgICAgICAgcy5pID0gc2k7XG4gICAgICAgICAgICAgICAgdmFyIHNkeCA9IHNbMV1beF0gLSBzWzBdW3hdO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzZHgpIDwgMC4xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZzZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2c2VnbWVudHMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXVt4XSAtIGJbMF1beF07IH0pO1xuICAgICAgICB2YXIgdnNlZ21lbnRzZXRzID0gW107XG4gICAgICAgIHZhciBzZWdtZW50c2V0ID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2c2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzID0gdnNlZ21lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWdtZW50c2V0IHx8IE1hdGguYWJzKHNbMF1beF0gLSBzZWdtZW50c2V0LnBvcykgPiAwLjEpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50c2V0ID0geyBwb3M6IHNbMF1beF0sIHNlZ21lbnRzOiBbXSB9O1xuICAgICAgICAgICAgICAgIHZzZWdtZW50c2V0cy5wdXNoKHNlZ21lbnRzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VnbWVudHNldC5zZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2c2VnbWVudHNldHM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm51ZGdlU2VncyA9IGZ1bmN0aW9uICh4LCB5LCByb3V0ZXMsIHNlZ21lbnRzLCBsZWZ0T2YsIGdhcCkge1xuICAgICAgICB2YXIgbiA9IHNlZ21lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKG4gPD0gMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHZzID0gc2VnbWVudHMubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHNbMF1beF0pOyB9KTtcbiAgICAgICAgdmFyIGNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBqKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB2YXIgczEgPSBzZWdtZW50c1tpXSwgczIgPSBzZWdtZW50c1tqXSwgZTEgPSBzMS5lZGdlaWQsIGUyID0gczIuZWRnZWlkLCBsaW5kID0gLTEsIHJpbmQgPSAtMTtcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSAneCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGluZCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KHZzW2xpbmRdLCB2c1tyaW5kXSwgZ2FwKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgICAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdmFyIHMgPSBzZWdtZW50c1tpXTtcbiAgICAgICAgICAgIHZhciBwb3MgPSB2LnBvc2l0aW9uKCk7XG4gICAgICAgICAgICBzWzBdW3hdID0gc1sxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJvdXRlc1tzLmVkZ2VpZF07XG4gICAgICAgICAgICBpZiAocy5pID4gMClcbiAgICAgICAgICAgICAgICByb3V0ZVtzLmkgLSAxXVsxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIGlmIChzLmkgPCByb3V0ZS5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgIHJvdXRlW3MuaSArIDFdWzBdW3hdID0gcG9zO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdtZW50cyA9IGZ1bmN0aW9uIChyb3V0ZXMsIHgsIHksIGxlZnRPZiwgZ2FwKSB7XG4gICAgICAgIHZhciB2c2VnbWVudHNldHMgPSBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzKHJvdXRlcywgeCwgeSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnNlZ21lbnRzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3MgPSB2c2VnbWVudHNldHNbaV07XG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNzLnNlZ21lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBzcy5zZWdtZW50c1tqXTtcbiAgICAgICAgICAgICAgICBldmVudHMucHVzaCh7IHR5cGU6IDAsIHM6IHMsIHBvczogTWF0aC5taW4oc1swXVt5XSwgc1sxXVt5XSkgfSk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0eXBlOiAxLCBzOiBzLCBwb3M6IE1hdGgubWF4KHNbMF1beV0sIHNbMV1beV0pIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3MgKyBhLnR5cGUgLSBiLnR5cGU7IH0pO1xuICAgICAgICAgICAgdmFyIG9wZW4gPSBbXTtcbiAgICAgICAgICAgIHZhciBvcGVuQ291bnQgPSAwO1xuICAgICAgICAgICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4ucHVzaChlLnMpO1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ291bnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5Db3VudC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3BlbkNvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ3MoeCwgeSwgcm91dGVzLCBvcGVuLCBsZWZ0T2YsIGdhcCk7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUucm91dGVFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcywgbnVkZ2VHYXAsIHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciByb3V0ZVBhdGhzID0gZWRnZXMubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5yb3V0ZShzb3VyY2UoZSksIHRhcmdldChlKSk7IH0pO1xuICAgICAgICB2YXIgb3JkZXIgPSBHcmlkUm91dGVyLm9yZGVyRWRnZXMocm91dGVQYXRocyk7XG4gICAgICAgIHZhciByb3V0ZXMgPSByb3V0ZVBhdGhzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gR3JpZFJvdXRlci5tYWtlU2VnbWVudHMoZSk7IH0pO1xuICAgICAgICBHcmlkUm91dGVyLm51ZGdlU2VnbWVudHMocm91dGVzLCAneCcsICd5Jywgb3JkZXIsIG51ZGdlR2FwKTtcbiAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ21lbnRzKHJvdXRlcywgJ3knLCAneCcsIG9yZGVyLCBudWRnZUdhcCk7XG4gICAgICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMocm91dGVzLCByb3V0ZVBhdGhzKTtcbiAgICAgICAgcmV0dXJuIHJvdXRlcztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMgPSBmdW5jdGlvbiAocm91dGVzLCByb3V0ZVBhdGhzKSB7XG4gICAgICAgIHJvdXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzZWdtZW50cywgaSkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSByb3V0ZVBhdGhzW2ldO1xuICAgICAgICAgICAgaWYgKHBhdGgucmV2ZXJzZWQpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoc2VnbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyA9IGZ1bmN0aW9uIChsaW5lMSwgbGluZTIpIHtcbiAgICAgICAgdmFyIGFuZ2xlMSA9IE1hdGguYXRhbjIobGluZTFbMF0ueSAtIGxpbmUxWzFdLnksIGxpbmUxWzBdLnggLSBsaW5lMVsxXS54KTtcbiAgICAgICAgdmFyIGFuZ2xlMiA9IE1hdGguYXRhbjIobGluZTJbMF0ueSAtIGxpbmUyWzFdLnksIGxpbmUyWzBdLnggLSBsaW5lMlsxXS54KTtcbiAgICAgICAgdmFyIGRpZmYgPSBhbmdsZTEgLSBhbmdsZTI7XG4gICAgICAgIGlmIChkaWZmID4gTWF0aC5QSSB8fCBkaWZmIDwgLU1hdGguUEkpIHtcbiAgICAgICAgICAgIGRpZmYgPSBhbmdsZTIgLSBhbmdsZTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmlzTGVmdCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgIHJldHVybiAoKGIueCAtIGEueCkgKiAoYy55IC0gYS55KSAtIChiLnkgLSBhLnkpICogKGMueCAtIGEueCkpIDw9IDA7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldE9yZGVyID0gZnVuY3Rpb24gKHBhaXJzKSB7XG4gICAgICAgIHZhciBvdXRnb2luZyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IHBhaXJzW2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvdXRnb2luZ1twLmxdID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICBvdXRnb2luZ1twLmxdID0ge307XG4gICAgICAgICAgICBvdXRnb2luZ1twLmxdW3Aucl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobCwgcikgeyByZXR1cm4gdHlwZW9mIG91dGdvaW5nW2xdICE9PSAndW5kZWZpbmVkJyAmJiBvdXRnb2luZ1tsXVtyXTsgfTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIub3JkZXJFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcykge1xuICAgICAgICB2YXIgZWRnZU9yZGVyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBlZGdlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gZWRnZXNbaV0sIGYgPSBlZGdlc1tqXSwgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB2YXIgdSwgdmksIHZqO1xuICAgICAgICAgICAgICAgIGlmIChsY3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAobGNzLnJldmVyc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGYucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICBmLnJldmVyc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChsY3Muc2kgPD0gMCB8fCBsY3MudGkgPD0gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBpLCByOiBqIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBlW2xjcy5zaSAtIDFdO1xuICAgICAgICAgICAgICAgICAgICB2aSA9IGZbbGNzLnRpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgIHZpID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBmW2xjcy50aSArIGxjcy5sZW5ndGhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoR3JpZFJvdXRlci5pc0xlZnQodSwgdmksIHZqKSkge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGosIHI6IGkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGksIHI6IGogfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBHcmlkUm91dGVyLmdldE9yZGVyKGVkZ2VPcmRlcik7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm1ha2VTZWdtZW50cyA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNvcHlQb2ludChwKSB7XG4gICAgICAgICAgICByZXR1cm4geyB4OiBwLngsIHk6IHAueSB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc1N0cmFpZ2h0ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHsgcmV0dXJuIE1hdGguYWJzKChiLnggLSBhLngpICogKGMueSAtIGEueSkgLSAoYi55IC0gYS55KSAqIChjLnggLSBhLngpKSA8IDAuMDAxOyB9O1xuICAgICAgICB2YXIgc2VnbWVudHMgPSBbXTtcbiAgICAgICAgdmFyIGEgPSBjb3B5UG9pbnQocGF0aFswXSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGIgPSBjb3B5UG9pbnQocGF0aFtpXSksIGMgPSBpIDwgcGF0aC5sZW5ndGggLSAxID8gcGF0aFtpICsgMV0gOiBudWxsO1xuICAgICAgICAgICAgaWYgKCFjIHx8ICFpc1N0cmFpZ2h0KGEsIGIsIGMpKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMucHVzaChbYSwgYl0pO1xuICAgICAgICAgICAgICAgIGEgPSBiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWdtZW50cztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLnJvdXRlID0gZnVuY3Rpb24gKHMsIHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMubm9kZXNbc10sIHRhcmdldCA9IHRoaXMubm9kZXNbdF07XG4gICAgICAgIHRoaXMub2JzdGFjbGVzID0gdGhpcy5zaWJsaW5nT2JzdGFjbGVzKHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgdmFyIG9ic3RhY2xlTG9va3VwID0ge307XG4gICAgICAgIHRoaXMub2JzdGFjbGVzLmZvckVhY2goZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9ic3RhY2xlTG9va3VwW28uaWRdID0gbzsgfSk7XG4gICAgICAgIHRoaXMucGFzc2FibGVFZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgdSA9IF90aGlzLnZlcnRzW2Uuc291cmNlXSwgdiA9IF90aGlzLnZlcnRzW2UudGFyZ2V0XTtcbiAgICAgICAgICAgIHJldHVybiAhKHUubm9kZSAmJiB1Lm5vZGUuaWQgaW4gb2JzdGFjbGVMb29rdXBcbiAgICAgICAgICAgICAgICB8fCB2Lm5vZGUgJiYgdi5ub2RlLmlkIGluIG9ic3RhY2xlTG9va3VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc291cmNlLnBvcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdSA9IHNvdXJjZS5wb3J0c1swXS5pZDtcbiAgICAgICAgICAgIHZhciB2ID0gc291cmNlLnBvcnRzW2ldLmlkO1xuICAgICAgICAgICAgdGhpcy5wYXNzYWJsZUVkZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogdSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHYsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRhcmdldC5wb3J0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHUgPSB0YXJnZXQucG9ydHNbMF0uaWQ7XG4gICAgICAgICAgICB2YXIgdiA9IHRhcmdldC5wb3J0c1tpXS5pZDtcbiAgICAgICAgICAgIHRoaXMucGFzc2FibGVFZGdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB2LFxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdldFNvdXJjZSA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfSwgZ2V0VGFyZ2V0ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9LCBnZXRMZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH07XG4gICAgICAgIHZhciBzaG9ydGVzdFBhdGhDYWxjdWxhdG9yID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHRoaXMudmVydHMubGVuZ3RoLCB0aGlzLnBhc3NhYmxlRWRnZXMsIGdldFNvdXJjZSwgZ2V0VGFyZ2V0LCBnZXRMZW5ndGgpO1xuICAgICAgICB2YXIgYmVuZFBlbmFsdHkgPSBmdW5jdGlvbiAodSwgdiwgdykge1xuICAgICAgICAgICAgdmFyIGEgPSBfdGhpcy52ZXJ0c1t1XSwgYiA9IF90aGlzLnZlcnRzW3ZdLCBjID0gX3RoaXMudmVydHNbd107XG4gICAgICAgICAgICB2YXIgZHggPSBNYXRoLmFicyhjLnggLSBhLngpLCBkeSA9IE1hdGguYWJzKGMueSAtIGEueSk7XG4gICAgICAgICAgICBpZiAoYS5ub2RlID09PSBzb3VyY2UgJiYgYS5ub2RlID09PSBiLm5vZGUgfHwgYi5ub2RlID09PSB0YXJnZXQgJiYgYi5ub2RlID09PSBjLm5vZGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICByZXR1cm4gZHggPiAxICYmIGR5ID4gMSA/IDEwMDAgOiAwO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hvcnRlc3RQYXRoID0gc2hvcnRlc3RQYXRoQ2FsY3VsYXRvci5QYXRoRnJvbU5vZGVUb05vZGVXaXRoUHJldkNvc3Qoc291cmNlLnBvcnRzWzBdLmlkLCB0YXJnZXQucG9ydHNbMF0uaWQsIGJlbmRQZW5hbHR5KTtcbiAgICAgICAgdmFyIHBhdGhQb2ludHMgPSBzaG9ydGVzdFBhdGgucmV2ZXJzZSgpLm1hcChmdW5jdGlvbiAodmkpIHsgcmV0dXJuIF90aGlzLnZlcnRzW3ZpXTsgfSk7XG4gICAgICAgIHBhdGhQb2ludHMucHVzaCh0aGlzLm5vZGVzW3RhcmdldC5pZF0ucG9ydHNbMF0pO1xuICAgICAgICByZXR1cm4gcGF0aFBvaW50cy5maWx0ZXIoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiAhKGkgPCBwYXRoUG9pbnRzLmxlbmd0aCAtIDEgJiYgcGF0aFBvaW50c1tpICsgMV0ubm9kZSA9PT0gc291cmNlICYmIHYubm9kZSA9PT0gc291cmNlXG4gICAgICAgICAgICAgICAgfHwgaSA+IDAgJiYgdi5ub2RlID09PSB0YXJnZXQgJiYgcGF0aFBvaW50c1tpIC0gMV0ubm9kZSA9PT0gdGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFJvdXRlUGF0aCA9IGZ1bmN0aW9uIChyb3V0ZSwgY29ybmVycmFkaXVzLCBhcnJvd3dpZHRoLCBhcnJvd2hlaWdodCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgcm91dGVwYXRoOiAnTSAnICsgcm91dGVbMF1bMF0ueCArICcgJyArIHJvdXRlWzBdWzBdLnkgKyAnICcsXG4gICAgICAgICAgICBhcnJvd3BhdGg6ICcnXG4gICAgICAgIH07XG4gICAgICAgIGlmIChyb3V0ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbaV07XG4gICAgICAgICAgICAgICAgdmFyIHggPSBsaVsxXS54LCB5ID0gbGlbMV0ueTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSB4IC0gbGlbMF0ueDtcbiAgICAgICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IHJvdXRlLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGR4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yb3V0ZXBhdGggKz0gJ0wgJyArIHggKyAnICcgKyB5ICsgJyAnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHJvdXRlW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgwID0gbFswXS54LCB5MCA9IGxbMF0ueTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgxID0gbFsxXS54O1xuICAgICAgICAgICAgICAgICAgICB2YXIgeTEgPSBsWzFdLnk7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0geDEgLSB4MDtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSB5MSAtIHkwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5nbGUgPSBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyhsaSwgbCkgPCAwID8gMSA6IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MiwgeTI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgwICsgZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4MDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTAgKyBkeSAvIE1hdGguYWJzKGR5KSAqIGNvcm5lcnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY3ggPSBNYXRoLmFicyh4MiAtIHgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBNYXRoLmFicyh5MiAtIHkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdBICcgKyBjeCArICcgJyArIGN5ICsgJyAwIDAgJyArIGFuZ2xlICsgJyAnICsgeDIgKyAnICcgKyB5MiArICcgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFycm93Y29ybmVyMSwgYXJyb3djb3JuZXIyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3gsIHkgKyBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4LCB5IC0gYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogYXJyb3doZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3ggLSBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFycm93aGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFycm93cGF0aCA9ICdNICcgKyBhcnJvd3RpcFswXSArICcgJyArIGFycm93dGlwWzFdICsgJyBMICcgKyBhcnJvd2Nvcm5lcjFbMF0gKyAnICcgKyBhcnJvd2Nvcm5lcjFbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbMF07XG4gICAgICAgICAgICB2YXIgeCA9IGxpWzFdLngsIHkgPSBsaVsxXS55O1xuICAgICAgICAgICAgdmFyIGR4ID0geCAtIGxpWzBdLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgIHZhciBhcnJvd2Nvcm5lcjEsIGFycm93Y29ybmVyMjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMSA9IFt4LCB5ICsgYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3gsIHkgLSBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHkgLT0gZHkgLyBNYXRoLmFicyhkeSkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4IC0gYXJyb3d3aWR0aCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgIGlmIChhcnJvd2hlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYXJyb3dwYXRoID0gJ00gJyArIGFycm93dGlwWzBdICsgJyAnICsgYXJyb3d0aXBbMV0gKyAnIEwgJyArIGFycm93Y29ybmVyMVswXSArICcgJyArIGFycm93Y29ybmVyMVsxXVxuICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gR3JpZFJvdXRlcjtcbn0oKSk7XG5leHBvcnRzLkdyaWRSb3V0ZXIgPSBHcmlkUm91dGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWjNKcFpISnZkWFJsY2k1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMmR5YVdSeWIzVjBaWEl1ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkRRU3g1UTBGQmNVTTdRVUZEY2tNc0swSkJRVzFFTzBGQlEyNUVMR2xFUVVFd1F6dEJRVXQwUXp0SlFVbEpMSEZDUVVGdFFpeEZRVUZWTEVWQlFWTXNTVUZCWlN4RlFVRlRMRkZCUVd0Q08xRkJRVGRFTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZYTzFGQlFWTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJWVHRSUVVNMVJTeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRTlCUVU4c1VVRkJVU3hMUVVGTExGZEJRVmNzU1VGQlNTeFJRVUZSTEVOQlFVTXNUVUZCVFN4TFFVRkxMRU5CUVVNc1EwRkJRenRKUVVONlJTeERRVUZETzBsQlEwd3NhMEpCUVVNN1FVRkJSQ3hEUVVGRExFRkJVRVFzU1VGUFF6dEJRVkJaTEd0RFFVRlhPMEZCVVhoQ08wbEJRMGtzWTBGQmJVSXNSVUZCVlN4RlFVRlRMRU5CUVZFc1JVRkJVeXhEUVVGVExFVkJRVk1zU1VGQmQwSXNSVUZCVXl4SlFVRlhPMUZCUVRWRExIRkNRVUZCTEVWQlFVRXNWMEZCZDBJN1VVRkJVeXh4UWtGQlFTeEZRVUZCTEZkQlFWYzdVVUZCYkVjc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVU4N1VVRkJVeXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZSTzFGQlFWTXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJiMEk3VVVGQlV5eFRRVUZKTEVkQlFVb3NTVUZCU1N4RFFVRlBPMGxCUVVjc1EwRkJRenRKUVVNM1NDeFhRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRkdXU3h2UWtGQlNUdEJRVWxxUWp0SlFVdEpMR3REUVVGdFFpeERRVUZOTEVWQlFWTXNRMEZCVFR0UlFVRnlRaXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZMTzFGQlFWTXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJTenRSUVVOd1F5eEpRVUZKTEVWQlFVVXNSMEZCUnl4M1FrRkJkMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeEZRVUZGTEVkQlFVY3NkMEpCUVhkQ0xFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVOdVJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1RVRkJUU3hKUVVGSkxFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVONFFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRGFFSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyaENMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlF6RkNMRU5CUVVNN1VVRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU5LTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF6dFpRVU40UWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEYUVJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTjJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhEUVVGRE8wbEJRMHdzUTBGQlF6dEpRVU5qTEd0RFFVRlRMRWRCUVhoQ0xGVkJRVFJDTEVOQlFVMHNSVUZCUlN4RFFVRk5PMUZCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRha0lzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVOcVFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlF6RkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1dVRkRla0lzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzQkNMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJUdG5Ra0ZEZEVJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0dlFrRkRha1VzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzNkQ1FVTnVRaXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0M1FrRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dDNRa0ZEY2tJc1MwRkJTeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNRMEZCUXp0dlFrRkJRU3hEUVVGRE8yZENRVU5PTEVOQlFVTTdaMEpCUVVNc1NVRkJTVHR2UWtGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlF6TkNMRU5CUVVNN1VVRkRSQ3hOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkRSQ3c0UTBGQlZ5eEhRVUZZTzFGQlEwa3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03U1VGRGFFWXNRMEZCUXp0SlFVTk1MQ3RDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVE5EUkN4SlFUSkRRenRCUVRORFdTdzBSRUZCZDBJN1FVRnBSSEpETzBsQmMwUkpMRzlDUVVGdFFpeGhRVUZ4UWl4RlFVRkZMRkZCUVRSQ0xFVkJRVk1zV1VGQmVVSTdVVUZCZWtJc05rSkJRVUVzUlVGQlFTeHBRa0ZCZVVJN1VVRkJlRWNzYVVKQmEwaERPMUZCYkVoclFpeHJRa0ZCWVN4SFFVRmlMR0ZCUVdFc1EwRkJVVHRSUVVGMVF5eHBRa0ZCV1N4SFFVRmFMRmxCUVZrc1EwRkJZVHRSUVhKRWVFY3NWMEZCVFN4SFFVRnJRaXhKUVVGSkxFTkJRVU03VVVGelJIcENMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeEpRVUZKTEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1VVRkJVU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFXeEZMRU5CUVd0RkxFTkJRVU1zUTBGQlF6dFJRVU0zUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCVGl4RFFVRk5MRU5CUVVNc1EwRkJRenRSUVVNMVF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZRTEVOQlFVOHNRMEZCUXl4RFFVRkRPMUZCUXpkRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU51UXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkhia01zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMnBDTEU5QlFVRXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUVdoRExFTkJRV2RETEVOQlFVTTdVVUZCZUVRc1EwRkJkMFFzUTBGQlF5eERRVUZETzFGQlJ6bEVMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUlVGQlJTeFJRVUZSTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNN1VVRkROMElzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMmhDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOc1F5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRXRCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03WjBKQlEzSkNMRXRCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGJFTXNRMEZCUXp0WlFVOUVMRU5CUVVNc1EwRkJReXhMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZCTzFGQlEyaENMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSMGdzU1VGQlNTeERRVUZETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjJReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeExRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVc1RExFTkJRVzFETEVOQlFVTXNRMEZCUXp0UlFVdHlSU3hKUVVGSkxHbENRVUZwUWl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlVDeERRVUZQTEVOQlFVTXNRMEZCUXp0UlFVTm9SaXhwUWtGQmFVSXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4SFFVRkhMSEZDUVVGVExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdXVUZETVVJc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRXZRaXhEUVVFclFpeERRVUZETEVOQlFVTTdXVUZEZUVRc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUTBGQlF6dFJRVU14UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWSUxFbEJRVWtzVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZNTEVOQlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRka1FzU1VGQlNTeFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVd3NRMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVkMlJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEhRVUZITEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRWRCUVVjc1QwRkJUeXhEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhNVVFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkxMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVUVzUlVGQmFrUXNRMEZCYVVRc1EwRkJRenRoUVVNMVJTeE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVc3NSVUZCUlN4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEpRVUZKTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVRXNSVUZCZWtNc1EwRkJlVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIZUVVc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZMTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVFc1JVRkJha1FzUTBGQmFVUXNRMEZCUXp0aFFVTTFSU3hOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVXNzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVsQlFVa3NSVUZCUlN4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFTkJRVUVzUlVGQmVrTXNRMEZCZVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSGVFVXNTVUZCU1N4TFFVRkxMRWRCUVVjc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVZHNReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVWQlFWb3NRMEZCV1N4RFFVRkRMRU5CUVVNN1VVRkhhRU1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkhhRUlzVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRXaXhQUVVGQkxFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMmRDUVVOYUxFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTm9SQ3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFFSXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFdEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVWR1UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMHNRMEZCUXp0blFrRkRhRU1zVDBGQlR5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJRenR2UWtGRFlpeEpRVUZKTEVsQlFVa3NSMEZCUnl4TFFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU14UWl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dHZRa0ZEYkVJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVTXpRaXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVOb1F5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2QwSkJRM1JETEVOQlFVVXNRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRE8zZENRVU55UWl4TFFVRkxMRU5CUVVNN2IwSkJRMVlzUTBGQlF6dG5Ra0ZEVEN4RFFVRkRPMWxCUTB3c1EwRkJReXhEUVVGRE8xRkJiRUpHTEVOQmEwSkZMRU5CUTBRc1EwRkJRenRSUVVWT0xFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVWb1FpeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzJkQ1FVTndRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eFRRVUZUTEVWQlFVVXNRMEZCUXp0dlFrRkZiRVVzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4SlFVRkpMRU5CUVVNc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGNFVXNTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTI1Q0xFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5vUWl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRjRUlzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEVUN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVkSUxFbEJRVWtzVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8xbEJRekZETEVsQlFVa3NTMEZCU3l4SFFVRkhMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVM5Q0xFTkJRU3RDTEVOQlFVTTdXVUZEZEVRc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRjRUlzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzJkQ1FVTjBReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZGtNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03YjBKQlFVTXNVVUZCVVN4RFFVRkRPMmRDUVVONlJDeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGJrWXNRMEZCUXp0UlFVTk1MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJTVkFzUTBGQlF6dEpRVFZLVHl4M1FrRkJSeXhIUVVGWUxGVkJRVmtzUTBGQlF5eEpRVUZKTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVXdzUTBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRU3hEUVVGRExFTkJRVU03U1VGSmRFUXNhVU5CUVZrc1IwRkJjRUlzVlVGQmNVSXNTVUZCU1R0UlFVTnlRaXhKUVVGSkxFOUJRVThzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRiRVFzVDBGQlR5eEZRVUZGTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJSVzVDTEVsQlFVa3NWMEZCVnl4SFFVRkhMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVd4RUxFTkJRV3RFTEVOQlFVTXNRMEZCUXp0WlFVTndSaXhKUVVGSkxFZEJRVWNzUjBGQlJ6dG5Ra0ZEVGl4TFFVRkxMRVZCUVVVc1YwRkJWenRuUWtGRGJFSXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRWEJDTEVOQlFXOUNMRU5CUVVNc1EwRkJRenRoUVVNelJDeERRVUZETzFsQlEwWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQk0wSXNRMEZCTWtJc1EwRkJReXhEUVVGRE8xRkJRM1pFTEVOQlFVTTdVVUZEUkN4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCWWl4RFFVRmhMRU5CUVVNc1EwRkJRVHRSUVVOeVF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRPMGxCUTI1Q0xFTkJRVU03U1VGSFR5dzJRa0ZCVVN4SFFVRm9RaXhWUVVGcFFpeERRVUZETzFGQlEyUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dFpRVU0xUWl4TFFVRkxMRVZCUVVVc1EwRkJRenRaUVVOU0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTJwQ0xFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGSFR5dzRRa0ZCVXl4SFFVRnFRaXhWUVVGclFpeERRVUZETzFGQlEyWXNTVUZCU1N4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRGFFTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja01zUTBGQlF6dFJRVU5FTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFYVklUeXhuUTBGQlZ5eEhRVUZ1UWl4VlFVRnZRaXhEUVVGRE8xRkJRMnBDTEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFSXNSMEZCUnl4RFFVRkRPMWxCUTBFc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0UlFVTXhRaXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGSFR5dzBRMEZCZFVJc1IwRkJMMElzVlVGQlowTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkRhRU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUXpsRUxFOUJRVThzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03V1VGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0UlFVVTFRaXhOUVVGTkxFTkJRVU1zUlVGQlJTeGpRVUZqTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeFJRVUZSTEVWQlFVVXNSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdTVUZEY0VZc1EwRkJRenRKUVVsRUxIRkRRVUZuUWl4SFFVRm9RaXhWUVVGcFFpeERRVUZETEVWQlFVVXNRMEZCUXp0UlFVRnlRaXhwUWtGWFF6dFJRVlpITEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXgxUWtGQmRVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE9VTXNTVUZCU1N4aFFVRmhMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM1pDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFYaENMRU5CUVhkQ0xFTkJRVU1zUTBGQlF6dFJRVU53UkN4SlFVRkpMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMR0ZCUVdFc1EwRkJReXhGUVVGeVFpeERRVUZ4UWl4RFFVRkRMRU5CUVVNN1VVRkZMMFVzU1VGQlNTeERRVUZETEZGQlFWRTdZVUZEVWl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRWxCUVVrc1EwRkJReXhqUVVGakxFVkJRV2hETEVOQlFXZERMRU5CUVVNN1lVRkROVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1UwRkJVeXhIUVVGSExGTkJRVk1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFWWXNRMEZCVlN4RFFVRkRMRU5CUVVNc1JVRkJkRVVzUTBGQmMwVXNRMEZCUXl4RFFVRkRPMUZCUlhwR0xFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJZaXhEUVVGaExFTkJRVU1zUTBGQlF6dEpRVU0xUXl4RFFVRkRPMGxCU1Uwc2VVSkJRV01zUjBGQmNrSXNWVUZCYzBJc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFGQlJUbENMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU51UWl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFdEJRVXNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRka0lzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU03WjBKQlEzWkRMRWxCUVVrc1EwRkJReXhIUVVGUkxFdEJRVXNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0blFrRkRka0lzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN1owSkJRMlFzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1owSkJRMVFzU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETlVJc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjBRaXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOMFFpeERRVUZETzFsQlEwd3NRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkRSQ3hUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVdwQ0xFTkJRV2xDTEVOQlFVTXNRMEZCUXp0UlFVYzFReXhKUVVGSkxGbEJRVmtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEZEVJc1NVRkJTU3hWUVVGVkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEzUkNMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1UwRkJVeXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMWxCUTNoRExFbEJRVWtzUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOeVFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRlZCUVZVc1NVRkJTU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETVVRc1ZVRkJWU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeFJRVUZSTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNN1owSkJRelZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03V1VGRGJFTXNRMEZCUXp0WlFVTkVMRlZCUVZVc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJoRExFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNXVUZCV1N4RFFVRkRPMGxCUTNoQ0xFTkJRVU03U1VGVFRTeHZRa0ZCVXl4SFFVRm9RaXhWUVVGcFFpeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hSUVVGUkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVkQlFWYzdVVUZEZUVVc1NVRkJTU3hEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTjRRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUVVNc1RVRkJUU3hEUVVGRE8xRkJRMjVDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMR1ZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJja0lzUTBGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFbEJRVWtzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTmFMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZEZWtJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkRla0lzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenR2UWtGQlF5eFJRVUZSTEVOQlFVTTdaMEpCUTNSQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRhRUlzUlVGQlJTeEhRVUZITEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRhRUlzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4TlFVRk5MRVZCUTJRc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eE5RVUZOTEVWQlEyUXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVOVUxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRk5aQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRFdDeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0M1FrRkZha0lzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdORUpCUTNSQ0xFbEJRVWtzUjBGQlJ5eERRVUZETEVWQlFVVXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenQzUWtGRGRrSXNRMEZCUXp0M1FrRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6czBRa0ZEU2l4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGRkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdkMEpCUTNaQ0xFTkJRVU03YjBKQlEwd3NRMEZCUXp0blFrRkRUQ3hEUVVGRE8yZENRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMjlDUVVOS0xFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzNkQ1FVTnFRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6czBRa0ZEZEVJc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPM2RDUVVOMlFpeERRVUZETzNkQ1FVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE96UkNRVU5LTEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUVVVc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dDNRa0ZEZGtJc1EwRkJRenR2UWtGRFRDeERRVUZETzJkQ1FVTk1MRU5CUVVNN1owSkJRMFFzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlJWb3NSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxHbENRVUZWTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU55UkN4RFFVRkRPMWxCUTB3c1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRFJDeEpRVUZKTEUxQlFVMHNSMEZCUnl4SlFVRkpMR0ZCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEYUVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzFGQlEyWXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlExb3NTVUZCU1N4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzQkNMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRaUVVONFFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6ZENMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRaUVVONFF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRSUVVNelJDeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkZUU3gzUWtGQllTeEhRVUZ3UWl4VlFVRnhRaXhOUVVGTkxFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFWTXNSVUZCUlN4TlFVRXlReXhGUVVGRkxFZEJRVmM3VVVGRGRrY3NTVUZCU1N4WlFVRlpMRWRCUVVjc1ZVRkJWU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVE5FTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NXVUZCV1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzFsQlF6TkRMRWxCUVVrc1JVRkJSU3hIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdXVUZEYUVJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVU14UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOMlFpeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdaMEpCUTJoRkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU53UlN4RFFVRkRPMWxCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRXZRaXhEUVVFclFpeERRVUZETEVOQlFVTTdXVUZEZGtRc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzFsQlEyUXNTVUZCU1N4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRMnhDTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8yZENRVU5hTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRaaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRFppeFRRVUZUTEVWQlFVVXNRMEZCUXp0blFrRkRhRUlzUTBGQlF6dG5Ra0ZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenR2UWtGRFNpeFRRVUZUTEVWQlFVVXNRMEZCUXp0blFrRkRhRUlzUTBGQlF6dG5Ra0ZEUkN4RlFVRkZMRU5CUVVNc1EwRkJReXhUUVVGVExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRha0lzVlVGQlZTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVWQlFVVXNUVUZCVFN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU4wUkN4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVU5rTEVOQlFVTTdXVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOUUxFTkJRVU03U1VGRFRDeERRVUZETzBsQlUwUXNLMEpCUVZVc1IwRkJWaXhWUVVGcFFpeExRVUZoTEVWQlFVVXNVVUZCWjBJc1JVRkJSU3hOUVVFeVFpeEZRVUZGTEUxQlFUSkNPMUZCUVRGSExHbENRVkZETzFGQlVFY3NTVUZCU1N4VlFVRlZMRWRCUVVjc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZvUXl4RFFVRm5ReXhEUVVGRExFTkJRVU03VVVGRGFrVXNTVUZCU1N4TFFVRkxMRWRCUVVjc1ZVRkJWU3hEUVVGRExGVkJRVlVzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXp0UlFVTTVReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtZc1ZVRkJWU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hMUVVGTExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVVUZETlVRc1ZVRkJWU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hMUVVGTExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVVUZETlVRc1ZVRkJWU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVWQlFVVXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRPVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJTVTBzZVVKQlFXTXNSMEZCY2tJc1ZVRkJjMElzVFVGQlRTeEZRVUZGTEZWQlFWVTdVVUZEY0VNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRPMWxCUTNaQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeEZRVUZGTEVOQlFVTXNRMEZCVHl4SlFVRkxMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZGtJc1VVRkJVU3hEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETzJkQ1FVTnVRaXhSUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFWVXNUMEZCVHp0dlFrRkRPVUlzVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPMmRDUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTlFMRU5CUVVNN1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVFN3MlFrRkJhMElzUjBGQmVrSXNWVUZCTUVJc1MwRkJZeXhGUVVGRkxFdEJRV003VVVGRGNFUXNTVUZCU1N4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpORExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpkQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU16UXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFGQlF6TkNMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNCRExFbEJRVWtzUjBGQlJ5eE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRPMUZCUXpOQ0xFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSFl5eHBRa0ZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkRla0lzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dEpRVU40UlN4RFFVRkRPMGxCU1dNc2JVSkJRVkVzUjBGQmRrSXNWVUZCZDBJc1MwRkJhVU03VVVGRGNrUXNTVUZCU1N4UlFVRlJMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMnhDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzFsQlEzQkRMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eFBRVUZQTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzVjBGQlZ5eERRVUZETzJkQ1FVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMWxCUXpkRUxGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTTVRaXhEUVVGRE8xRkJRMFFzVFVGQlRTeERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFOUJRVThzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjc1NVRkJTU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVhCRUxFTkJRVzlFTEVOQlFVTTdTVUZETVVVc1EwRkJRenRKUVVsTkxIRkNRVUZWTEVkQlFXcENMRlZCUVd0Q0xFdEJRVXM3VVVGRGJrSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMjVDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTjRReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03WjBKQlEzaERMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZEV2l4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU5hTEVkQlFVY3NSMEZCUnl4SlFVRkpMSGRDUVVGM1FpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE4wTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZEWkN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNRMEZCUXp0dlFrRkRha0lzVVVGQlVTeERRVUZETzJkQ1FVTmlMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVkbUxFTkJRVU1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0dlFrRkRXaXhEUVVGRExFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXp0dlFrRkRiRUlzUjBGQlJ5eEhRVUZITEVsQlFVa3NkMEpCUVhkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNM1F5eERRVUZETzJkQ1FVTkVMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdiMEpCUXpWQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlJYWkZMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVTXZRaXhSUVVGUkxFTkJRVU03WjBKQlEySXNRMEZCUXp0blFrRkRSQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlRYSkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGJFSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOdVFpeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNaQ0xFTkJRVU03WjBKQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN2IwSkJRMG9zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJReTlDTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN2IwSkJRelZDTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1owSkJRMmhETEVOQlFVTTdaMEpCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRMMElzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1owSkJRMjVETEVOQlFVTTdaMEpCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YjBKQlEwb3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WjBKQlEyNURMRU5CUVVNN1dVRkRUQ3hEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVVZFTEUxQlFVMHNRMEZCUXl4VlFVRlZMRU5CUVVNc1VVRkJVU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkxUU3gxUWtGQldTeEhRVUZ1UWl4VlFVRnZRaXhKUVVGaE8xRkJRemRDTEcxQ1FVRnRRaXhEUVVGUk8xbEJRM1pDTEUxQlFVMHNRMEZCVVN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGNrTXNRMEZCUXp0UlFVTkVMRWxCUVVrc1ZVRkJWU3hIUVVGSExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRWFpGTEVOQlFYVkZMRU5CUVVNN1VVRkRkRWNzU1VGQlNTeFJRVUZSTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTnVReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRPMWxCUTNwRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU0zUWl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM1JDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRWaXhEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4UlFVRlJMRU5CUVVNN1NVRkRjRUlzUTBGQlF6dEpRVWxFTERCQ1FVRkxMRWRCUVV3c1ZVRkJUU3hEUVVGVExFVkJRVVVzUTBGQlV6dFJRVUV4UWl4cFFrRTBSRU03VVVFelJFY3NTVUZCU1N4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSU3hKUVVGSkxFTkJRVU1zVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkZka1FzU1VGQlNTeGpRVUZqTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTNoQ0xFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRWGhDTEVOQlFYZENMRU5CUVVNc1EwRkJRenRSUVVOMFJDeEpRVUZKTEVOQlFVTXNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXp0WlFVTndReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGRGVFSXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMWxCUXpkQ0xFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4alFVRmpPMjFDUVVOMlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEdOQlFXTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlIwZ3NSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMWxCUXpORExFbEJRVWtzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRek5DTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRE8yZENRVU53UWl4TlFVRk5MRVZCUVVVc1EwRkJRenRuUWtGRFZDeE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRWQ3hOUVVGTkxFVkJRVVVzUTBGQlF6dGhRVU5hTEVOQlFVTXNRMEZCUXp0UlFVTlFMRU5CUVVNN1VVRkRSQ3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRE0wTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNCQ0xFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yZENRVU5VTEUxQlFVMHNSVUZCUlN4RFFVRkRPMkZCUTFvc1EwRkJReXhEUVVGRE8xRkJRMUFzUTBGQlF6dFJRVVZFTEVsQlFVa3NVMEZCVXl4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJMRVZCUTNoQ0xGTkJRVk1zUjBGQlJ5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVklzUTBGQlVTeEZRVU40UWl4VFFVRlRMRWRCUVVjc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRlNMRU5CUVZFc1EwRkJRenRSUVVVM1FpeEpRVUZKTEhOQ1FVRnpRaXhIUVVGSExFbEJRVWtzTUVKQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RlFVRkZMRk5CUVZNc1JVRkJSU3hUUVVGVExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdVVUZEY0Vnc1NVRkJTU3hYUVVGWExFZEJRVWNzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRkRUlzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU0xUkN4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJSWFpFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNN1owSkJRMnBHTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRZaXhOUVVGTkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMlF5eERRVUZETEVOQlFVTTdVVUZIUml4SlFVRkpMRmxCUVZrc1IwRkJSeXh6UWtGQmMwSXNRMEZCUXl3NFFrRkJPRUlzUTBGRGNFVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlEzUkRMRmRCUVZjc1EwRkJReXhEUVVGRE8xRkJSMnBDTEVsQlFVa3NWVUZCVlN4SFFVRkhMRmxCUVZrc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RlFVRkZMRWxCUVVrc1QwRkJRU3hMUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRmtMRU5CUVdNc1EwRkJReXhEUVVGRE8xRkJRMnhGTEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIYUVRc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVNeFFpeFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVFVGQlRUdHRRa0ZET1VVc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwc1NVRkJTU3hWUVVGVkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU03VVVGRWRrVXNRMEZEZFVVc1EwRkJReXhEUVVGRE8wbEJRMnBHTEVOQlFVTTdTVUZGVFN4MVFrRkJXU3hIUVVGdVFpeFZRVUZ2UWl4TFFVRm5RaXhGUVVGRkxGbEJRVzlDTEVWQlFVVXNWVUZCYTBJc1JVRkJSU3hYUVVGdFFqdFJRVU12Uml4SlFVRkpMRTFCUVUwc1IwRkJSenRaUVVOVUxGTkJRVk1zUlVGQlJTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSE8xbEJRek5FTEZOQlFWTXNSVUZCUlN4RlFVRkZPMU5CUTJoQ0xFTkJRVU03VVVGRFJpeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1owSkJRM0JETEVsQlFVa3NSVUZCUlN4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEYkVJc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE4wSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM0pDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOMlFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2QwSkJRMjVDTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNN2IwSkJRekZETEVOQlFVTTdiMEpCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03ZDBKQlEwb3NRMEZCUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRmxCUVZrc1EwRkJRenR2UWtGRE1VTXNRMEZCUXp0dlFrRkRSQ3hOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdiMEpCUXpkRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRemRDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyaENMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRWxCUVVrc1MwRkJTeXhIUVVGSExGVkJRVlVzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkZOMFFzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRPMjlDUVVOWUxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0M1FrRkRia0lzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNN2QwSkJRek5ETEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2IwSkJRMW9zUTBGQlF6dHZRa0ZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenQzUWtGRFNpeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPM2RDUVVOU0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NXVUZCV1N4RFFVRkRPMjlDUVVNdlF5eERRVUZETzI5Q1FVTkVMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU14UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRE1VSXNUVUZCVFN4RFFVRkRMRk5CUVZNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1QwRkJUeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEhRVUZITEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVjc1IwRkJSeXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETzJkQ1FVTXpSaXhEUVVGRE8yZENRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMjlDUVVOS0xFbEJRVWtzVVVGQlVTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU4wUWl4SlFVRkpMRmxCUVZrc1JVRkJSU3haUVVGWkxFTkJRVU03YjBKQlF5OUNMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dDNRa0ZEYmtJc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGZEJRVmNzUTBGQlF6dDNRa0ZEY2tNc1dVRkJXU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJRenQzUWtGRGJrTXNXVUZCV1N4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNRMEZCUXp0dlFrRkRka01zUTBGQlF6dHZRa0ZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenQzUWtGRFNpeERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPM2RDUVVOeVF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzNkQ1FVTnVReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NWVUZCVlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU4yUXl4RFFVRkRPMjlDUVVORUxFMUJRVTBzUTBGQlF5eFRRVUZUTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0dlFrRkROME1zUlVGQlJTeERRVUZETEVOQlFVTXNWMEZCVnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03ZDBKQlEyeENMRTFCUVUwc1EwRkJReXhUUVVGVExFZEJRVWNzU1VGQlNTeEhRVUZITEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1IwRkJSeXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU03T0VKQlEzcEhMRXRCUVVzc1IwRkJSeXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEZEVRc1EwRkJRenRuUWtGRFRDeERRVUZETzFsQlEwd3NRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU5LTEVsQlFVa3NSVUZCUlN4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpkQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0pDTEVsQlFVa3NVVUZCVVN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzUkNMRWxCUVVrc1dVRkJXU3hGUVVGRkxGbEJRVmtzUTBGQlF6dFpRVU12UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyNUNMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhYUVVGWExFTkJRVU03WjBKQlEzSkRMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRU5CUVVNN1owSkJRMjVETEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEVOQlFVTTdXVUZEZGtNc1EwRkJRenRaUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJkQ1FVTktMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhYUVVGWExFTkJRVU03WjBKQlEzSkRMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMjVETEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtNc1EwRkJRenRaUVVORUxFMUJRVTBzUTBGQlF5eFRRVUZUTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTTNReXhGUVVGRkxFTkJRVU1zUTBGQlF5eFhRVUZYTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGJFSXNUVUZCVFN4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4SFFVRkhMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJRenR6UWtGRGVrY3NTMEZCU3l4SFFVRkhMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEVOQlFVTTdVVUZEVEN4RFFVRkRPMUZCUTBRc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF6dEpRVU5zUWl4RFFVRkRPMGxCUTB3c2FVSkJRVU03UVVGQlJDeERRVUZETEVGQmVteENSQ3hKUVhsc1FrTTdRVUY2YkVKWkxHZERRVUZWSW4wPSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBhY2tpbmdPcHRpb25zID0ge1xuICAgIFBBRERJTkc6IDEwLFxuICAgIEdPTERFTl9TRUNUSU9OOiAoMSArIE1hdGguc3FydCg1KSkgLyAyLFxuICAgIEZMT0FUX0VQU0lMT046IDAuMDAwMSxcbiAgICBNQVhfSU5FUkFUSU9OUzogMTAwXG59O1xuZnVuY3Rpb24gYXBwbHlQYWNraW5nKGdyYXBocywgdywgaCwgbm9kZV9zaXplLCBkZXNpcmVkX3JhdGlvLCBjZW50ZXJHcmFwaCkge1xuICAgIGlmIChkZXNpcmVkX3JhdGlvID09PSB2b2lkIDApIHsgZGVzaXJlZF9yYXRpbyA9IDE7IH1cbiAgICBpZiAoY2VudGVyR3JhcGggPT09IHZvaWQgMCkgeyBjZW50ZXJHcmFwaCA9IHRydWU7IH1cbiAgICB2YXIgaW5pdF94ID0gMCwgaW5pdF95ID0gMCwgc3ZnX3dpZHRoID0gdywgc3ZnX2hlaWdodCA9IGgsIGRlc2lyZWRfcmF0aW8gPSB0eXBlb2YgZGVzaXJlZF9yYXRpbyAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNpcmVkX3JhdGlvIDogMSwgbm9kZV9zaXplID0gdHlwZW9mIG5vZGVfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBub2RlX3NpemUgOiAwLCByZWFsX3dpZHRoID0gMCwgcmVhbF9oZWlnaHQgPSAwLCBtaW5fd2lkdGggPSAwLCBnbG9iYWxfYm90dG9tID0gMCwgbGluZSA9IFtdO1xuICAgIGlmIChncmFwaHMubGVuZ3RoID09IDApXG4gICAgICAgIHJldHVybjtcbiAgICBjYWxjdWxhdGVfYmIoZ3JhcGhzKTtcbiAgICBhcHBseShncmFwaHMsIGRlc2lyZWRfcmF0aW8pO1xuICAgIGlmIChjZW50ZXJHcmFwaCkge1xuICAgICAgICBwdXRfbm9kZXNfdG9fcmlnaHRfcG9zaXRpb25zKGdyYXBocyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZV9iYihncmFwaHMpIHtcbiAgICAgICAgZ3JhcGhzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIGNhbGN1bGF0ZV9zaW5nbGVfYmIoZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVfc2luZ2xlX2JiKGdyYXBoKSB7XG4gICAgICAgICAgICB2YXIgbWluX3ggPSBOdW1iZXIuTUFYX1ZBTFVFLCBtaW5feSA9IE51bWJlci5NQVhfVkFMVUUsIG1heF94ID0gMCwgbWF4X3kgPSAwO1xuICAgICAgICAgICAgZ3JhcGguYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHZhciB3ID0gdHlwZW9mIHYud2lkdGggIT09ICd1bmRlZmluZWQnID8gdi53aWR0aCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgaCA9IHR5cGVvZiB2LmhlaWdodCAhPT0gJ3VuZGVmaW5lZCcgPyB2LmhlaWdodCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB3IC89IDI7XG4gICAgICAgICAgICAgICAgaCAvPSAyO1xuICAgICAgICAgICAgICAgIG1heF94ID0gTWF0aC5tYXgodi54ICsgdywgbWF4X3gpO1xuICAgICAgICAgICAgICAgIG1pbl94ID0gTWF0aC5taW4odi54IC0gdywgbWluX3gpO1xuICAgICAgICAgICAgICAgIG1heF95ID0gTWF0aC5tYXgodi55ICsgaCwgbWF4X3kpO1xuICAgICAgICAgICAgICAgIG1pbl95ID0gTWF0aC5taW4odi55IC0gaCwgbWluX3kpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBncmFwaC53aWR0aCA9IG1heF94IC0gbWluX3g7XG4gICAgICAgICAgICBncmFwaC5oZWlnaHQgPSBtYXhfeSAtIG1pbl95O1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHB1dF9ub2Rlc190b19yaWdodF9wb3NpdGlvbnMoZ3JhcGhzKSB7XG4gICAgICAgIGdyYXBocy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjZW50ZXIueCArPSBub2RlLng7XG4gICAgICAgICAgICAgICAgY2VudGVyLnkgKz0gbm9kZS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjZW50ZXIueCAvPSBnLmFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIGNlbnRlci55IC89IGcuYXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNvcm5lciA9IHsgeDogY2VudGVyLnggLSBnLndpZHRoIC8gMiwgeTogY2VudGVyLnkgLSBnLmhlaWdodCAvIDIgfTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB7IHg6IGcueCAtIGNvcm5lci54ICsgc3ZnX3dpZHRoIC8gMiAtIHJlYWxfd2lkdGggLyAyLCB5OiBnLnkgLSBjb3JuZXIueSArIHN2Z19oZWlnaHQgLyAyIC0gcmVhbF9oZWlnaHQgLyAyIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnggKz0gb2Zmc2V0Lng7XG4gICAgICAgICAgICAgICAgbm9kZS55ICs9IG9mZnNldC55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhcHBseShkYXRhLCBkZXNpcmVkX3JhdGlvKSB7XG4gICAgICAgIHZhciBjdXJyX2Jlc3RfZiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgdmFyIGN1cnJfYmVzdCA9IDA7XG4gICAgICAgIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYi5oZWlnaHQgLSBhLmhlaWdodDsgfSk7XG4gICAgICAgIG1pbl93aWR0aCA9IGRhdGEucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS53aWR0aCA8IGIud2lkdGggPyBhLndpZHRoIDogYi53aWR0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBsZWZ0ID0geDEgPSBtaW5fd2lkdGg7XG4gICAgICAgIHZhciByaWdodCA9IHgyID0gZ2V0X2VudGlyZV93aWR0aChkYXRhKTtcbiAgICAgICAgdmFyIGl0ZXJhdGlvbkNvdW50ZXIgPSAwO1xuICAgICAgICB2YXIgZl94MSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHZhciBmX3gyID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGZsYWcgPSAtMTtcbiAgICAgICAgdmFyIGR4ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGRmID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgd2hpbGUgKChkeCA+IG1pbl93aWR0aCkgfHwgZGYgPiBwYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKSB7XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgxID0gcmlnaHQgLSAocmlnaHQgLSBsZWZ0KSAvIHBhY2tpbmdPcHRpb25zLkdPTERFTl9TRUNUSU9OO1xuICAgICAgICAgICAgICAgIHZhciBmX3gxID0gc3RlcChkYXRhLCB4MSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgyID0gbGVmdCArIChyaWdodCAtIGxlZnQpIC8gcGFja2luZ09wdGlvbnMuR09MREVOX1NFQ1RJT047XG4gICAgICAgICAgICAgICAgdmFyIGZfeDIgPSBzdGVwKGRhdGEsIHgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGR4ID0gTWF0aC5hYnMoeDEgLSB4Mik7XG4gICAgICAgICAgICBkZiA9IE1hdGguYWJzKGZfeDEgLSBmX3gyKTtcbiAgICAgICAgICAgIGlmIChmX3gxIDwgY3Vycl9iZXN0X2YpIHtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3RfZiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0ID0geDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZl94MiA8IGN1cnJfYmVzdF9mKSB7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0X2YgPSBmX3gyO1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdCA9IHgyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZfeDEgPiBmX3gyKSB7XG4gICAgICAgICAgICAgICAgbGVmdCA9IHgxO1xuICAgICAgICAgICAgICAgIHgxID0geDI7XG4gICAgICAgICAgICAgICAgZl94MSA9IGZfeDI7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByaWdodCA9IHgyO1xuICAgICAgICAgICAgICAgIHgyID0geDE7XG4gICAgICAgICAgICAgICAgZl94MiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlcmF0aW9uQ291bnRlcisrID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RlcChkYXRhLCBjdXJyX2Jlc3QpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdGVwKGRhdGEsIG1heF93aWR0aCkge1xuICAgICAgICBsaW5lID0gW107XG4gICAgICAgIHJlYWxfd2lkdGggPSAwO1xuICAgICAgICByZWFsX2hlaWdodCA9IDA7XG4gICAgICAgIGdsb2JhbF9ib3R0b20gPSBpbml0X3k7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSBkYXRhW2ldO1xuICAgICAgICAgICAgcHV0X3JlY3QobywgbWF4X3dpZHRoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5hYnMoZ2V0X3JlYWxfcmF0aW8oKSAtIGRlc2lyZWRfcmF0aW8pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwdXRfcmVjdChyZWN0LCBtYXhfd2lkdGgpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGxpbmVbaV0uc3BhY2VfbGVmdCA+PSByZWN0LmhlaWdodCkgJiYgKGxpbmVbaV0ueCArIGxpbmVbaV0ud2lkdGggKyByZWN0LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORyAtIG1heF93aWR0aCkgPD0gcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTikge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGxpbmVbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGluZS5wdXNoKHJlY3QpO1xuICAgICAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlY3QueCA9IHBhcmVudC54ICsgcGFyZW50LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgICAgIHJlY3QueSA9IHBhcmVudC5ib3R0b207XG4gICAgICAgICAgICByZWN0LnNwYWNlX2xlZnQgPSByZWN0LmhlaWdodDtcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gcmVjdC55O1xuICAgICAgICAgICAgcGFyZW50LnNwYWNlX2xlZnQgLT0gcmVjdC5oZWlnaHQgKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICAgICAgcGFyZW50LmJvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWN0LnkgPSBnbG9iYWxfYm90dG9tO1xuICAgICAgICAgICAgZ2xvYmFsX2JvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgICAgICByZWN0LnggPSBpbml0X3g7XG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IHJlY3QueTtcbiAgICAgICAgICAgIHJlY3Quc3BhY2VfbGVmdCA9IHJlY3QuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnkgKyByZWN0LmhlaWdodCAtIHJlYWxfaGVpZ2h0ID4gLXBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pXG4gICAgICAgICAgICByZWFsX2hlaWdodCA9IHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gaW5pdF95O1xuICAgICAgICBpZiAocmVjdC54ICsgcmVjdC53aWR0aCAtIHJlYWxfd2lkdGggPiAtcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTilcbiAgICAgICAgICAgIHJlYWxfd2lkdGggPSByZWN0LnggKyByZWN0LndpZHRoIC0gaW5pdF94O1xuICAgIH1cbiAgICA7XG4gICAgZnVuY3Rpb24gZ2V0X2VudGlyZV93aWR0aChkYXRhKSB7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyByZXR1cm4gd2lkdGggKz0gZC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7IH0pO1xuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF9yZWFsX3JhdGlvKCkge1xuICAgICAgICByZXR1cm4gKHJlYWxfd2lkdGggLyByZWFsX2hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5hcHBseVBhY2tpbmcgPSBhcHBseVBhY2tpbmc7XG5mdW5jdGlvbiBzZXBhcmF0ZUdyYXBocyhub2RlcywgbGlua3MpIHtcbiAgICB2YXIgbWFya3MgPSB7fTtcbiAgICB2YXIgd2F5cyA9IHt9O1xuICAgIHZhciBncmFwaHMgPSBbXTtcbiAgICB2YXIgY2x1c3RlcnMgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGxpbmsgPSBsaW5rc1tpXTtcbiAgICAgICAgdmFyIG4xID0gbGluay5zb3VyY2U7XG4gICAgICAgIHZhciBuMiA9IGxpbmsudGFyZ2V0O1xuICAgICAgICBpZiAod2F5c1tuMS5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24xLmluZGV4XS5wdXNoKG4yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMS5pbmRleF0gPSBbbjJdO1xuICAgICAgICBpZiAod2F5c1tuMi5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24yLmluZGV4XS5wdXNoKG4xKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMi5pbmRleF0gPSBbbjFdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChtYXJrc1tub2RlLmluZGV4XSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBleHBsb3JlX25vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4cGxvcmVfbm9kZShuLCBpc19uZXcpIHtcbiAgICAgICAgaWYgKG1hcmtzW24uaW5kZXhdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChpc19uZXcpIHtcbiAgICAgICAgICAgIGNsdXN0ZXJzKys7XG4gICAgICAgICAgICBncmFwaHMucHVzaCh7IGFycmF5OiBbXSB9KTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrc1tuLmluZGV4XSA9IGNsdXN0ZXJzO1xuICAgICAgICBncmFwaHNbY2x1c3RlcnMgLSAxXS5hcnJheS5wdXNoKG4pO1xuICAgICAgICB2YXIgYWRqYWNlbnQgPSB3YXlzW24uaW5kZXhdO1xuICAgICAgICBpZiAoIWFkamFjZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkamFjZW50Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBleHBsb3JlX25vZGUoYWRqYWNlbnRbal0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JhcGhzO1xufVxuZXhwb3J0cy5zZXBhcmF0ZUdyYXBocyA9IHNlcGFyYXRlR3JhcGhzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYUdGdVpHeGxaR2x6WTI5dWJtVmpkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZhR0Z1Wkd4bFpHbHpZMjl1Ym1WamRHVmtMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3TzBGQlFVa3NTVUZCU1N4alFVRmpMRWRCUVVjN1NVRkRha0lzVDBGQlR5eEZRVUZGTEVWQlFVVTdTVUZEV0N4alFVRmpMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03U1VGRGRFTXNZVUZCWVN4RlFVRkZMRTFCUVUwN1NVRkRja0lzWTBGQll5eEZRVUZGTEVkQlFVYzdRMEZEZEVJc1EwRkJRenRCUVVkR0xITkNRVUUyUWl4TlFVRnBRaXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNVMEZCVXl4RlFVRkZMR0ZCUVdsQ0xFVkJRVVVzVjBGQmEwSTdTVUZCY2tNc09FSkJRVUVzUlVGQlFTeHBRa0ZCYVVJN1NVRkJSU3cwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRKUVVWc1J5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUTFZc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGRlZpeFRRVUZUTEVkQlFVY3NRMEZCUXl4RlFVTmlMRlZCUVZVc1IwRkJSeXhEUVVGRExFVkJSV1FzWVVGQllTeEhRVUZITEU5QlFVOHNZVUZCWVN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNoRkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEZOQlFWTXNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVVTFSQ3hWUVVGVkxFZEJRVWNzUTBGQlF5eEZRVU5rTEZkQlFWY3NSMEZCUnl4RFFVRkRMRVZCUTJZc1UwRkJVeXhIUVVGSExFTkJRVU1zUlVGRllpeGhRVUZoTEVkQlFVY3NRMEZCUXl4RlFVTnFRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlJXUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYmtJc1RVRkJUU3hEUVVGRE8wbEJWVmdzV1VGQldTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMGxCUTNKQ0xFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1NVRkROMElzUlVGQlJTeERRVUZCTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOaUxEUkNRVUUwUWl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wbEJRM3BETEVOQlFVTTdTVUZIUkN4elFrRkJjMElzVFVGQlRUdFJRVVY0UWl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVlVzUTBGQlF6dFpRVU4wUWl4dFFrRkJiVUlzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUVR0UlFVTXhRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVVZJTERaQ1FVRTJRaXhMUVVGTE8xbEJRemxDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRVVVzUzBGQlN5eEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUTJ4RUxFdEJRVXNzUjBGQlJ5eERRVUZETEVWQlFVVXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVWNlFpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU03WjBKQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJRenRuUWtGRE4wUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRPMmRDUVVNdlJDeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOUUxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUTFBc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdaMEpCUTJwRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMmRDUVVOcVF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRuUWtGRGFrTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGNrTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkZTQ3hMUVVGTExFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkROVUlzUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBETEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCZFVORUxITkRRVUZ6UXl4TlFVRk5PMUZCUTNoRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4RFFVRkRPMWxCUlhSQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZGTlVJc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4SlFVRkpPMmRDUVVNeFFpeE5RVUZOTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyNUNMRTFCUVUwc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVVZJTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZETTBJc1RVRkJUU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVjelFpeEpRVUZKTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEZGtVc1NVRkJTU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEZOQlFWTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEZWQlFWVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1YwRkJWeXhIUVVGSExFTkJRVU1zUlVGQlF5eERRVUZETzFsQlIzcElMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFWVXNTVUZCU1R0blFrRkRNVUlzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU51UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtJc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFVDeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkpSQ3hsUVVGbExFbEJRVWtzUlVGQlJTeGhRVUZoTzFGQlF6bENMRWxCUVVrc1YwRkJWeXhIUVVGSExFMUJRVTBzUTBGQlF5eHBRa0ZCYVVJc1EwRkJRenRSUVVNelF5eEpRVUZKTEZOQlFWTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRiRUlzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUlRORUxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRGJFTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJRenRSUVVOcVJDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVVklMRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUjBGQlJ5eFRRVUZUTEVOQlFVTTdVVUZETVVJc1NVRkJTU3hMUVVGTExFZEJRVWNzUlVGQlJTeEhRVUZITEdkQ1FVRm5RaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEzaERMRWxCUVVrc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUlhwQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeEpRVUZKTEVkQlFVY3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenRSUVVNMVFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVka0xFbEJRVWtzUlVGQlJTeEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenRSUVVVeFFpeFBRVUZQTEVOQlFVTXNSVUZCUlN4SFFVRkhMRk5CUVZNc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eGpRVUZqTEVOQlFVTXNZVUZCWVN4RlFVRkZMRU5CUVVNN1dVRkZNMFFzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlExb3NTVUZCU1N4RlFVRkZMRWRCUVVjc1MwRkJTeXhIUVVGSExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhqUVVGakxFTkJRVU03WjBKQlEyaEZMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRPVUlzUTBGQlF6dFpRVU5FTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTmFMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUjBGQlJ5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhqUVVGakxFTkJRVU1zWTBGQll5eERRVUZETzJkQ1FVTXZSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xbEJRemxDTEVOQlFVTTdXVUZGUkN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRka0lzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlJUTkNMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVFpeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRPMmRDUVVOdVFpeFRRVUZUTEVkQlFVY3NSVUZCUlN4RFFVRkRPMWxCUTI1Q0xFTkJRVU03V1VGRlJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEY2tJc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dG5Ra0ZEYmtJc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dFpRVU51UWl4RFFVRkRPMWxCUlVRc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMlFzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0blFrRkRWaXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTlNMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU03WjBKQlExb3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOaUxFTkJRVU03V1VGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0blFrRkRTaXhMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTllMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlExSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJRenRuUWtGRFdpeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJJc1EwRkJRenRaUVVWRUxFVkJRVVVzUTBGQlF5eERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRNMElzUzBGQlN5eERRVUZETzFsQlExWXNRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkZSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMGxCUXpGQ0xFTkJRVU03U1VGSlJDeGpRVUZqTEVsQlFVa3NSVUZCUlN4VFFVRlRPMUZCUTNwQ0xFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEVml4VlFVRlZMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMllzVjBGQlZ5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhoUVVGaExFZEJRVWNzVFVGQlRTeERRVUZETzFGQlJYWkNMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMWxCUTI1RExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOb1FpeFJRVUZSTEVOQlFVTXNRMEZCUXl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xRkJRek5DTEVOQlFVTTdVVUZGUkN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eGpRVUZqTEVWQlFVVXNSMEZCUnl4aFFVRmhMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNhMEpCUVd0Q0xFbEJRVWtzUlVGQlJTeFRRVUZUTzFGQlJ6ZENMRWxCUVVrc1RVRkJUU3hIUVVGSExGTkJRVk1zUTBGQlF6dFJRVVYyUWl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTnVReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhWUVVGVkxFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1kwRkJZeXhEUVVGRExFOUJRVThzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4alFVRmpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZGtvc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha0lzUzBGQlN5eERRVUZETzFsQlExWXNRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkZSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUldoQ0xFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVOQlFVTXNTMEZCU3l4SFFVRkhMR05CUVdNc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRE1VUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEzWkNMRWxCUVVrc1EwRkJReXhWUVVGVkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTTVRaXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRja0lzVFVGQlRTeERRVUZETEZWQlFWVXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExHTkJRV01zUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZETVVRc1RVRkJUU3hEUVVGRExFMUJRVTBzU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMR05CUVdNc1EwRkJReXhQUVVGUExFTkJRVU03VVVGRE1VUXNRMEZCUXp0UlFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRMG9zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4aFFVRmhMRU5CUVVNN1dVRkRka0lzWVVGQllTeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1kwRkJZeXhEUVVGRExFOUJRVThzUTBGQlF6dFpRVU4wUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF6dFpRVU5vUWl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY2tJc1NVRkJTU3hEUVVGRExGVkJRVlVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTJ4RExFTkJRVU03VVVGRlJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NWMEZCVnl4SFFVRkhMRU5CUVVNc1kwRkJZeXhEUVVGRExHRkJRV0VzUTBGQlF6dFpRVUZETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRPMUZCUTNCSUxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eFZRVUZWTEVkQlFVY3NRMEZCUXl4alFVRmpMRU5CUVVNc1lVRkJZU3hEUVVGRE8xbEJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eE5RVUZOTEVOQlFVTTdTVUZEY0Vnc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpd3dRa0ZCTUVJc1NVRkJTVHRSUVVNeFFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRaQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFWVXNRMEZCUXl4SlFVRkpMRTFCUVUwc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4alFVRmpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtZc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRN1VVRkRTU3hOUVVGTkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVkQlFVY3NWMEZCVnl4RFFVRkRMRU5CUVVNN1NVRkRkRU1zUTBGQlF6dEJRVU5NTEVOQlFVTTdRVUV4VUVRc2IwTkJNRkJETzBGQlRVUXNkMEpCUVN0Q0xFdEJRVXNzUlVGQlJTeExRVUZMTzBsQlEzWkRMRWxCUVVrc1MwRkJTeXhIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5tTEVsQlFVa3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVOa0xFbEJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTm9RaXhKUVVGSkxGRkJRVkVzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZGYWtJc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1VVRkRjRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGNrSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU55UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUTJZc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1R0WlFVTkJMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVVeFFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFsQlEyWXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNUdFpRVU5CTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTTVRaXhEUVVGRE8wbEJSVVFzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03VVVGRGNFTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkJReXhSUVVGUkxFTkJRVU03VVVGRGFFTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dEpRVU0zUWl4RFFVRkRPMGxCUlVRc2MwSkJRWE5DTEVOQlFVTXNSVUZCUlN4TlFVRk5PMUZCUXpOQ0xFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzVTBGQlV5eERRVUZETzFsQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTNwRExFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRWQ3hSUVVGUkxFVkJRVVVzUTBGQlF6dFpRVU5ZTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTXZRaXhEUVVGRE8xRkJRMFFzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhSUVVGUkxFTkJRVU03VVVGRE1VSXNUVUZCVFN4RFFVRkRMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMjVETEVsQlFVa3NVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdVVUZETjBJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTTdXVUZCUXl4TlFVRk5MRU5CUVVNN1VVRkZkRUlzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eFJRVUZSTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRGRrTXNXVUZCV1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0UlFVTnlReXhEUVVGRE8wbEJRMHdzUTBGQlF6dEpRVVZFTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1FVRkRiRUlzUTBGQlF6dEJRVFZEUkN4M1EwRTBRME1pZlE9PSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBvd2VyZ3JhcGggPSByZXF1aXJlKFwiLi9wb3dlcmdyYXBoXCIpO1xudmFyIGxpbmtsZW5ndGhzXzEgPSByZXF1aXJlKFwiLi9saW5rbGVuZ3Roc1wiKTtcbnZhciBkZXNjZW50XzEgPSByZXF1aXJlKFwiLi9kZXNjZW50XCIpO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIHNob3J0ZXN0cGF0aHNfMSA9IHJlcXVpcmUoXCIuL3Nob3J0ZXN0cGF0aHNcIik7XG52YXIgZ2VvbV8xID0gcmVxdWlyZShcIi4vZ2VvbVwiKTtcbnZhciBoYW5kbGVkaXNjb25uZWN0ZWRfMSA9IHJlcXVpcmUoXCIuL2hhbmRsZWRpc2Nvbm5lY3RlZFwiKTtcbnZhciBFdmVudFR5cGU7XG4oZnVuY3Rpb24gKEV2ZW50VHlwZSkge1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJzdGFydFwiXSA9IDBdID0gXCJzdGFydFwiO1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJ0aWNrXCJdID0gMV0gPSBcInRpY2tcIjtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1wiZW5kXCJdID0gMl0gPSBcImVuZFwiO1xufSkoRXZlbnRUeXBlID0gZXhwb3J0cy5FdmVudFR5cGUgfHwgKGV4cG9ydHMuRXZlbnRUeXBlID0ge30pKTtcbjtcbmZ1bmN0aW9uIGlzR3JvdXAoZykge1xuICAgIHJldHVybiB0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBnLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCc7XG59XG52YXIgTGF5b3V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMYXlvdXQoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSBbMSwgMV07XG4gICAgICAgIHRoaXMuX2xpbmtEaXN0YW5jZSA9IDIwO1xuICAgICAgICB0aGlzLl9kZWZhdWx0Tm9kZVNpemUgPSAxMDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F2b2lkT3ZlcmxhcHMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgICB0aGlzLl9ncm91cHMgPSBbXTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlua3MgPSBbXTtcbiAgICAgICAgdGhpcy5fY29uc3RyYWludHMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzdGFuY2VNYXRyaXggPSBudWxsO1xuICAgICAgICB0aGlzLl9kZXNjZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMgPSBudWxsO1xuICAgICAgICB0aGlzLl90aHJlc2hvbGQgPSAwLjAxO1xuICAgICAgICB0aGlzLl92aXNpYmlsaXR5R3JhcGggPSBudWxsO1xuICAgICAgICB0aGlzLl9ncm91cENvbXBhY3RuZXNzID0gMWUtNjtcbiAgICAgICAgdGhpcy5ldmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubGlua0FjY2Vzc29yID0ge1xuICAgICAgICAgICAgZ2V0U291cmNlSW5kZXg6IExheW91dC5nZXRTb3VyY2VJbmRleCxcbiAgICAgICAgICAgIGdldFRhcmdldEluZGV4OiBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgsXG4gICAgICAgICAgICBzZXRMZW5ndGg6IExheW91dC5zZXRMaW5rTGVuZ3RoLFxuICAgICAgICAgICAgZ2V0VHlwZTogZnVuY3Rpb24gKGwpIHsgcmV0dXJuIHR5cGVvZiBfdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IF90aGlzLl9saW5rVHlwZShsKSA6IDA7IH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgTGF5b3V0LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChlLCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuZXZlbnQpXG4gICAgICAgICAgICB0aGlzLmV2ZW50ID0ge307XG4gICAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbRXZlbnRUeXBlW2VdXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudFtlXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgJiYgdHlwZW9mIHRoaXMuZXZlbnRbZS50eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbZS50eXBlXShlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAoIXRoaXMudGljaygpKVxuICAgICAgICAgICAgO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fYWxwaGEgPCB0aGlzLl90aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7IHR5cGU6IEV2ZW50VHlwZS5lbmQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IDAsIHN0cmVzczogdGhpcy5fbGFzdFN0cmVzcyB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuID0gdGhpcy5fbm9kZXMubGVuZ3RoLCBtID0gdGhpcy5fbGlua3MubGVuZ3RoO1xuICAgICAgICB2YXIgbywgaTtcbiAgICAgICAgdGhpcy5fZGVzY2VudC5sb2Nrcy5jbGVhcigpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBvID0gdGhpcy5fbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoby5maXhlZCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygby5weCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIG8ucHkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8ucHggPSBvLng7XG4gICAgICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwID0gW28ucHgsIG8ucHldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzMSA9IHRoaXMuX2Rlc2NlbnQucnVuZ2VLdXR0YSgpO1xuICAgICAgICBpZiAoczEgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdGhpcy5fbGFzdFN0cmVzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGFzdFN0cmVzcyA9IHMxO1xuICAgICAgICB0aGlzLnVwZGF0ZU5vZGVQb3NpdGlvbnMoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHsgdHlwZTogRXZlbnRUeXBlLnRpY2ssIGFscGhhOiB0aGlzLl9hbHBoYSwgc3RyZXNzOiB0aGlzLl9sYXN0U3RyZXNzIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnVwZGF0ZU5vZGVQb3NpdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy5fZGVzY2VudC54WzBdLCB5ID0gdGhpcy5fZGVzY2VudC54WzFdO1xuICAgICAgICB2YXIgbywgaSA9IHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgby54ID0geFtpXTtcbiAgICAgICAgICAgIG8ueSA9IHlbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubm9kZXMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGggPT09IDAgJiYgdGhpcy5fbGlua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBuID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgICAgIG4gPSBNYXRoLm1heChuLCBsLnNvdXJjZSwgbC50YXJnZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzID0gbmV3IEFycmF5KCsrbik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbm9kZXNbaV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZ3JvdXBzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwcztcbiAgICAgICAgdGhpcy5fZ3JvdXBzID0geDtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0ge307XG4gICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGcucGFkZGluZyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICBnLnBhZGRpbmcgPSAxO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnLmxlYXZlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIGcubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmxlYXZlc1tpXSA9IF90aGlzLl9ub2Rlc1t2XSkucGFyZW50ID0gZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBnLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnaSwgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdpID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmdyb3Vwc1tpXSA9IF90aGlzLl9ncm91cHNbZ2ldKS5wYXJlbnQgPSBnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwLmxlYXZlcyA9IHRoaXMuX25vZGVzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYucGFyZW50ID09PSAndW5kZWZpbmVkJzsgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cC5ncm91cHMgPSB0aGlzLl9ncm91cHMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiB0eXBlb2YgZy5wYXJlbnQgPT09ICd1bmRlZmluZWQnOyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnBvd2VyR3JhcGhHcm91cHMgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB2YXIgZyA9IHBvd2VyZ3JhcGguZ2V0R3JvdXBzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcywgdGhpcy5saW5rQWNjZXNzb3IsIHRoaXMuX3Jvb3RHcm91cCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzKGcuZ3JvdXBzKTtcbiAgICAgICAgZihnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmF2b2lkT3ZlcmxhcHMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fYXZvaWRPdmVybGFwcyA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5oYW5kbGVEaXNjb25uZWN0ZWQgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkO1xuICAgICAgICB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZmxvd0xheW91dCA9IGZ1bmN0aW9uIChheGlzLCBtaW5TZXBhcmF0aW9uKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIGF4aXMgPSAneSc7XG4gICAgICAgIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzID0ge1xuICAgICAgICAgICAgYXhpczogYXhpcyxcbiAgICAgICAgICAgIGdldE1pblNlcGFyYXRpb246IHR5cGVvZiBtaW5TZXBhcmF0aW9uID09PSAnbnVtYmVyJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1pblNlcGFyYXRpb247IH0gOiBtaW5TZXBhcmF0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rcztcbiAgICAgICAgdGhpcy5fbGlua3MgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuY29uc3RyYWludHMgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludHM7XG4gICAgICAgIHRoaXMuX2NvbnN0cmFpbnRzID0gYztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3RhbmNlTWF0cml4O1xuICAgICAgICB0aGlzLl9kaXN0YW5jZU1hdHJpeCA9IGQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbnZhc1NpemU7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZGVmYXVsdE5vZGVTaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHROb2RlU2l6ZTtcbiAgICAgICAgdGhpcy5fZGVmYXVsdE5vZGVTaXplID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdyb3VwQ29tcGFjdG5lc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ3JvdXBDb21wYWN0bmVzcztcbiAgICAgICAgdGhpcy5fZ3JvdXBDb21wYWN0bmVzcyA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rRGlzdGFuY2UgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rRGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGlua0Rpc3RhbmNlID0gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiA/IHggOiAreDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua1R5cGUgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IGY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5jb252ZXJnZW5jZVRocmVzaG9sZCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuX3RocmVzaG9sZCA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5hbHBoYSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbHBoYTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB4ID0gK3g7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWxwaGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoeCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0geDtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoeyB0eXBlOiBFdmVudFR5cGUuc3RhcnQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IHggfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMua2ljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2xpbmtEaXN0YW5jZSA9PT0gXCJmdW5jdGlvblwiID8gKyh0aGlzLl9saW5rRGlzdGFuY2UobGluaykpIDogdGhpcy5fbGlua0Rpc3RhbmNlO1xuICAgIH07XG4gICAgTGF5b3V0LnNldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaywgbGVuZ3RoKSB7XG4gICAgICAgIGxpbmsubGVuZ3RoID0gbGVuZ3RoO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5nZXRMaW5rVHlwZSA9IGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuX2xpbmtUeXBlKGxpbmspIDogMDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzID0gZnVuY3Rpb24gKGlkZWFsTGVuZ3RoLCB3KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICAgICAgdGhpcy5saW5rRGlzdGFuY2UoZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGlkZWFsTGVuZ3RoICogbC5sZW5ndGg7IH0pO1xuICAgICAgICB0aGlzLl9saW5rTGVuZ3RoQ2FsY3VsYXRvciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpbmtsZW5ndGhzXzEuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKF90aGlzLl9saW5rcywgX3RoaXMubGlua0FjY2Vzc29yLCB3KTsgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmphY2NhcmRMaW5rTGVuZ3RocyA9IGZ1bmN0aW9uIChpZGVhbExlbmd0aCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgICAgIHRoaXMubGlua0Rpc3RhbmNlKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpZGVhbExlbmd0aCAqIGwubGVuZ3RoOyB9KTtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBsaW5rbGVuZ3Roc18xLmphY2NhcmRMaW5rTGVuZ3RocyhfdGhpcy5fbGlua3MsIF90aGlzLmxpbmtBY2Nlc3Nvciwgdyk7IH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMsIGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMsIGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMsIGdyaWRTbmFwSXRlcmF0aW9ucywga2VlcFJ1bm5pbmcsIGNlbnRlckdyYXBoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChpbml0aWFsVXNlckNvbnN0cmFpbnRJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoZ3JpZFNuYXBJdGVyYXRpb25zID09PSB2b2lkIDApIHsgZ3JpZFNuYXBJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoa2VlcFJ1bm5pbmcgPT09IHZvaWQgMCkgeyBrZWVwUnVubmluZyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNlbnRlckdyYXBoID09PSB2b2lkIDApIHsgY2VudGVyR3JhcGggPSB0cnVlOyB9XG4gICAgICAgIHZhciBpLCBqLCBuID0gdGhpcy5ub2RlcygpLmxlbmd0aCwgTiA9IG4gKyAyICogdGhpcy5fZ3JvdXBzLmxlbmd0aCwgbSA9IHRoaXMuX2xpbmtzLmxlbmd0aCwgdyA9IHRoaXMuX2NhbnZhc1NpemVbMF0sIGggPSB0aGlzLl9jYW52YXNTaXplWzFdO1xuICAgICAgICB2YXIgeCA9IG5ldyBBcnJheShOKSwgeSA9IG5ldyBBcnJheShOKTtcbiAgICAgICAgdmFyIEcgPSBudWxsO1xuICAgICAgICB2YXIgYW8gPSB0aGlzLl9hdm9pZE92ZXJsYXBzO1xuICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICB2LmluZGV4ID0gaTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdi54ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHYueCA9IHcgLyAyLCB2LnkgPSBoIC8gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhbaV0gPSB2LngsIHlbaV0gPSB2Lnk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IpXG4gICAgICAgICAgICB0aGlzLl9saW5rTGVuZ3RoQ2FsY3VsYXRvcigpO1xuICAgICAgICB2YXIgZGlzdGFuY2VzO1xuICAgICAgICBpZiAodGhpcy5fZGlzdGFuY2VNYXRyaXgpIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IHRoaXMuX2Rpc3RhbmNlTWF0cml4O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGlzdGFuY2VzID0gKG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcihOLCB0aGlzLl9saW5rcywgTGF5b3V0LmdldFNvdXJjZUluZGV4LCBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgsIGZ1bmN0aW9uIChsKSB7IHJldHVybiBfdGhpcy5nZXRMaW5rTGVuZ3RoKGwpOyB9KSkuRGlzdGFuY2VNYXRyaXgoKTtcbiAgICAgICAgICAgIEcgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgoTiwgZnVuY3Rpb24gKCkgeyByZXR1cm4gMjsgfSk7XG4gICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsLnNvdXJjZSA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgICAgICBsLnNvdXJjZSA9IF90aGlzLl9ub2Rlc1tsLnNvdXJjZV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsLnRhcmdldCA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgICAgICBsLnRhcmdldCA9IF90aGlzLl9ub2Rlc1tsLnRhcmdldF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2xpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdSA9IExheW91dC5nZXRTb3VyY2VJbmRleChlKSwgdiA9IExheW91dC5nZXRUYXJnZXRJbmRleChlKTtcbiAgICAgICAgICAgICAgICBHW3VdW3ZdID0gR1t2XVt1XSA9IGUud2VpZ2h0IHx8IDE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgRCA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChOLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIGRpc3RhbmNlc1tpXVtqXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9yb290R3JvdXAgJiYgdHlwZW9mIHRoaXMuX3Jvb3RHcm91cC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgaSA9IG47XG4gICAgICAgICAgICB2YXIgYWRkQXR0cmFjdGlvbiA9IGZ1bmN0aW9uIChpLCBqLCBzdHJlbmd0aCwgaWRlYWxEaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgIEdbaV1bal0gPSBHW2pdW2ldID0gc3RyZW5ndGg7XG4gICAgICAgICAgICAgICAgRFtpXVtqXSA9IERbal1baV0gPSBpZGVhbERpc3RhbmNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICAgICAgYWRkQXR0cmFjdGlvbihpLCBpICsgMSwgX3RoaXMuX2dyb3VwQ29tcGFjdG5lc3MsIDAuMSk7XG4gICAgICAgICAgICAgICAgeFtpXSA9IDAsIHlbaSsrXSA9IDA7XG4gICAgICAgICAgICAgICAgeFtpXSA9IDAsIHlbaSsrXSA9IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLl9yb290R3JvdXAgPSB7IGxlYXZlczogdGhpcy5fbm9kZXMsIGdyb3VwczogW10gfTtcbiAgICAgICAgdmFyIGN1ckNvbnN0cmFpbnRzID0gdGhpcy5fY29uc3RyYWludHMgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cykge1xuICAgICAgICAgICAgdGhpcy5saW5rQWNjZXNzb3IuZ2V0TWluU2VwYXJhdGlvbiA9IHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzLmdldE1pblNlcGFyYXRpb247XG4gICAgICAgICAgICBjdXJDb25zdHJhaW50cyA9IGN1ckNvbnN0cmFpbnRzLmNvbmNhdChsaW5rbGVuZ3Roc18xLmdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMobiwgdGhpcy5fbGlua3MsIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzLmF4aXMsICh0aGlzLmxpbmtBY2Nlc3NvcikpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMoZmFsc2UpO1xuICAgICAgICB0aGlzLl9kZXNjZW50ID0gbmV3IGRlc2NlbnRfMS5EZXNjZW50KFt4LCB5XSwgRCk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuY2xlYXIoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5fbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoby5maXhlZCkge1xuICAgICAgICAgICAgICAgIG8ucHggPSBvLng7XG4gICAgICAgICAgICAgICAgby5weSA9IG8ueTtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IFtvLngsIG8ueV07XG4gICAgICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5sb2Nrcy5hZGQoaSwgcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGVzY2VudC50aHJlc2hvbGQgPSB0aGlzLl90aHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuaW5pdGlhbExheW91dChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMsIHgsIHkpO1xuICAgICAgICBpZiAoY3VyQ29uc3RyYWludHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucHJvamVjdCA9IG5ldyByZWN0YW5nbGVfMS5Qcm9qZWN0aW9uKHRoaXMuX25vZGVzLCB0aGlzLl9ncm91cHMsIHRoaXMuX3Jvb3RHcm91cCwgY3VyQ29uc3RyYWludHMpLnByb2plY3RGdW5jdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fZGVzY2VudC5ydW4oaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyk7XG4gICAgICAgIHRoaXMuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHModywgaCwgY2VudGVyR3JhcGgpO1xuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMoYW8pO1xuICAgICAgICBpZiAoYW8pIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geFtpXSwgdi55ID0geVtpXTsgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzLCB0cnVlKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHhbaV0gPSB2LngsIHlbaV0gPSB2Lnk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQuRyA9IEc7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMpO1xuICAgICAgICBpZiAoZ3JpZFNuYXBJdGVyYXRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBTdHJlbmd0aCA9IDEwMDA7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBHcmlkU2l6ZSA9IHRoaXMuX25vZGVzWzBdLndpZHRoO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5udW1HcmlkU25hcE5vZGVzID0gbjtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQuc2NhbGVTbmFwQnlNYXhIID0gbiAhPSBOO1xuICAgICAgICAgICAgdmFyIEcwID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gbiB8fCBqID49IG4pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBHW2ldW2pdO1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LkcgPSBHMDtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGdyaWRTbmFwSXRlcmF0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVOb2RlUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHModywgaCwgY2VudGVyR3JhcGgpO1xuICAgICAgICByZXR1cm4ga2VlcFJ1bm5pbmcgPyB0aGlzLnJlc3VtZSgpIDogdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuaW5pdGlhbExheW91dCA9IGZ1bmN0aW9uIChpdGVyYXRpb25zLCB4LCB5KSB7XG4gICAgICAgIGlmICh0aGlzLl9ncm91cHMubGVuZ3RoID4gMCAmJiBpdGVyYXRpb25zID4gMCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9ub2Rlcy5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZWRnZXMgPSB0aGlzLl9saW5rcy5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuICh7IHNvdXJjZTogZS5zb3VyY2UuaW5kZXgsIHRhcmdldDogZS50YXJnZXQuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgdmFyIHZzID0gdGhpcy5fbm9kZXMubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiAoeyBpbmRleDogdi5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZywgaSkge1xuICAgICAgICAgICAgICAgIHZzLnB1c2goeyBpbmRleDogZy5pbmRleCA9IG4gKyBpIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZywgaSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICBnLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBnLmluZGV4LCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICBnLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnZykgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogZy5pbmRleCwgdGFyZ2V0OiBnZy5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ldyBMYXlvdXQoKVxuICAgICAgICAgICAgICAgIC5zaXplKHRoaXMuc2l6ZSgpKVxuICAgICAgICAgICAgICAgIC5ub2Rlcyh2cylcbiAgICAgICAgICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgICAgICAgICAgLmF2b2lkT3ZlcmxhcHMoZmFsc2UpXG4gICAgICAgICAgICAgICAgLmxpbmtEaXN0YW5jZSh0aGlzLmxpbmtEaXN0YW5jZSgpKVxuICAgICAgICAgICAgICAgIC5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMoNSlcbiAgICAgICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtNClcbiAgICAgICAgICAgICAgICAuc3RhcnQoaXRlcmF0aW9ucywgMCwgMCwgMCwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHhbdi5pbmRleF0gPSB2c1t2LmluZGV4XS54O1xuICAgICAgICAgICAgICAgIHlbdi5pbmRleF0gPSB2c1t2LmluZGV4XS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihpdGVyYXRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zZXBhcmF0ZU92ZXJsYXBwaW5nQ29tcG9uZW50cyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjZW50ZXJHcmFwaCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoY2VudGVyR3JhcGggPT09IHZvaWQgMCkgeyBjZW50ZXJHcmFwaCA9IHRydWU7IH1cbiAgICAgICAgaWYgKCF0aGlzLl9kaXN0YW5jZU1hdHJpeCAmJiB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciB4XzEgPSB0aGlzLl9kZXNjZW50LnhbMF0sIHlfMSA9IHRoaXMuX2Rlc2NlbnQueFsxXTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geF8xW2ldLCB2LnkgPSB5XzFbaV07IH0pO1xuICAgICAgICAgICAgdmFyIGdyYXBocyA9IGhhbmRsZWRpc2Nvbm5lY3RlZF8xLnNlcGFyYXRlR3JhcGhzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcyk7XG4gICAgICAgICAgICBoYW5kbGVkaXNjb25uZWN0ZWRfMS5hcHBseVBhY2tpbmcoZ3JhcGhzLCB3aWR0aCwgaGVpZ2h0LCB0aGlzLl9kZWZhdWx0Tm9kZVNpemUsIDEsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fZGVzY2VudC54WzBdW2ldID0gdi54LCBfdGhpcy5fZGVzY2VudC54WzFdW2ldID0gdi55O1xuICAgICAgICAgICAgICAgIGlmICh2LmJvdW5kcykge1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcy5zZXRYQ2VudHJlKHYueCk7XG4gICAgICAgICAgICAgICAgICAgIHYuYm91bmRzLnNldFlDZW50cmUodi55KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFscGhhKDAuMSk7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFscGhhKDApO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5wcmVwYXJlRWRnZVJvdXRpbmcgPSBmdW5jdGlvbiAobm9kZU1hcmdpbikge1xuICAgICAgICBpZiAobm9kZU1hcmdpbiA9PT0gdm9pZCAwKSB7IG5vZGVNYXJnaW4gPSAwOyB9XG4gICAgICAgIHRoaXMuX3Zpc2liaWxpdHlHcmFwaCA9IG5ldyBnZW9tXzEuVGFuZ2VudFZpc2liaWxpdHlHcmFwaCh0aGlzLl9ub2Rlcy5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2LmJvdW5kcy5pbmZsYXRlKC1ub2RlTWFyZ2luKS52ZXJ0aWNlcygpO1xuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnJvdXRlRWRnZSA9IGZ1bmN0aW9uIChlZGdlLCBhaCwgZHJhdykge1xuICAgICAgICBpZiAoYWggPT09IHZvaWQgMCkgeyBhaCA9IDU7IH1cbiAgICAgICAgdmFyIGxpbmVEYXRhID0gW107XG4gICAgICAgIHZhciB2ZzIgPSBuZXcgZ2VvbV8xLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGgodGhpcy5fdmlzaWJpbGl0eUdyYXBoLlAsIHsgVjogdGhpcy5fdmlzaWJpbGl0eUdyYXBoLlYsIEU6IHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5FIH0pLCBwb3J0MSA9IHsgeDogZWRnZS5zb3VyY2UueCwgeTogZWRnZS5zb3VyY2UueSB9LCBwb3J0MiA9IHsgeDogZWRnZS50YXJnZXQueCwgeTogZWRnZS50YXJnZXQueSB9LCBzdGFydCA9IHZnMi5hZGRQb2ludChwb3J0MSwgZWRnZS5zb3VyY2UuaW5kZXgpLCBlbmQgPSB2ZzIuYWRkUG9pbnQocG9ydDIsIGVkZ2UudGFyZ2V0LmluZGV4KTtcbiAgICAgICAgdmcyLmFkZEVkZ2VJZlZpc2libGUocG9ydDEsIHBvcnQyLCBlZGdlLnNvdXJjZS5pbmRleCwgZWRnZS50YXJnZXQuaW5kZXgpO1xuICAgICAgICBpZiAodHlwZW9mIGRyYXcgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkcmF3KHZnMik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNvdXJjZUluZCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZS5pZDsgfSwgdGFyZ2V0SW5kID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0LmlkOyB9LCBsZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGgoKTsgfSwgc3BDYWxjID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHZnMi5WLmxlbmd0aCwgdmcyLkUsIHNvdXJjZUluZCwgdGFyZ2V0SW5kLCBsZW5ndGgpLCBzaG9ydGVzdFBhdGggPSBzcENhbGMuUGF0aEZyb21Ob2RlVG9Ob2RlKHN0YXJ0LmlkLCBlbmQuaWQpO1xuICAgICAgICBpZiAoc2hvcnRlc3RQYXRoLmxlbmd0aCA9PT0gMSB8fCBzaG9ydGVzdFBhdGgubGVuZ3RoID09PSB2ZzIuVi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJlY3RhbmdsZV8xLm1ha2VFZGdlQmV0d2VlbihlZGdlLnNvdXJjZS5pbm5lckJvdW5kcywgZWRnZS50YXJnZXQuaW5uZXJCb3VuZHMsIGFoKTtcbiAgICAgICAgICAgIGxpbmVEYXRhID0gW3JvdXRlLnNvdXJjZUludGVyc2VjdGlvbiwgcm91dGUuYXJyb3dTdGFydF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbiA9IHNob3J0ZXN0UGF0aC5sZW5ndGggLSAyLCBwID0gdmcyLlZbc2hvcnRlc3RQYXRoW25dXS5wLCBxID0gdmcyLlZbc2hvcnRlc3RQYXRoWzBdXS5wLCBsaW5lRGF0YSA9IFtlZGdlLnNvdXJjZS5pbm5lckJvdW5kcy5yYXlJbnRlcnNlY3Rpb24ocC54LCBwLnkpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBuOyBpID49IDA7IC0taSlcbiAgICAgICAgICAgICAgICBsaW5lRGF0YS5wdXNoKHZnMi5WW3Nob3J0ZXN0UGF0aFtpXV0ucCk7XG4gICAgICAgICAgICBsaW5lRGF0YS5wdXNoKHJlY3RhbmdsZV8xLm1ha2VFZGdlVG8ocSwgZWRnZS50YXJnZXQuaW5uZXJCb3VuZHMsIGFoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmVEYXRhO1xuICAgIH07XG4gICAgTGF5b3V0LmdldFNvdXJjZUluZGV4ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnNvdXJjZSA9PT0gJ251bWJlcicgPyBlLnNvdXJjZSA6IGUuc291cmNlLmluZGV4O1xuICAgIH07XG4gICAgTGF5b3V0LmdldFRhcmdldEluZGV4ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnRhcmdldCA9PT0gJ251bWJlcicgPyBlLnRhcmdldCA6IGUudGFyZ2V0LmluZGV4O1xuICAgIH07XG4gICAgTGF5b3V0LmxpbmtJZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBMYXlvdXQuZ2V0U291cmNlSW5kZXgoZSkgKyBcIi1cIiArIExheW91dC5nZXRUYXJnZXRJbmRleChlKTtcbiAgICB9O1xuICAgIExheW91dC5kcmFnU3RhcnQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgTGF5b3V0LnN0b3JlT2Zmc2V0KGQsIExheW91dC5kcmFnT3JpZ2luKGQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIExheW91dC5zdG9wTm9kZShkKTtcbiAgICAgICAgICAgIGQuZml4ZWQgfD0gMjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnN0b3BOb2RlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdi5weCA9IHYueDtcbiAgICAgICAgdi5weSA9IHYueTtcbiAgICB9O1xuICAgIExheW91dC5zdG9yZU9mZnNldCA9IGZ1bmN0aW9uIChkLCBvcmlnaW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGQubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2LmZpeGVkIHw9IDI7XG4gICAgICAgICAgICAgICAgTGF5b3V0LnN0b3BOb2RlKHYpO1xuICAgICAgICAgICAgICAgIHYuX2RyYWdHcm91cE9mZnNldFggPSB2LnggLSBvcmlnaW4ueDtcbiAgICAgICAgICAgICAgICB2Ll9kcmFnR3JvdXBPZmZzZXRZID0gdi55IC0gb3JpZ2luLnk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykgeyByZXR1cm4gTGF5b3V0LnN0b3JlT2Zmc2V0KGcsIG9yaWdpbik7IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZ09yaWdpbiA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmIChpc0dyb3VwKGQpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IGQuYm91bmRzLmN4KCksXG4gICAgICAgICAgICAgICAgeTogZC5ib3VuZHMuY3koKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZyA9IGZ1bmN0aW9uIChkLCBwb3NpdGlvbikge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGQuYm91bmRzLnNldFhDZW50cmUocG9zaXRpb24ueCk7XG4gICAgICAgICAgICAgICAgICAgIGQuYm91bmRzLnNldFlDZW50cmUocG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIHYucHggPSB2Ll9kcmFnR3JvdXBPZmZzZXRYICsgcG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdi5weSA9IHYuX2RyYWdHcm91cE9mZnNldFkgKyBwb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7IHJldHVybiBMYXlvdXQuZHJhZyhnLCBwb3NpdGlvbik7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZC5weCA9IHBvc2l0aW9uLng7XG4gICAgICAgICAgICBkLnB5ID0gcG9zaXRpb24ueTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWdFbmQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIExheW91dC5kcmFnRW5kKHYpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdi5fZHJhZ0dyb3VwT2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYuX2RyYWdHcm91cE9mZnNldFk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGQuZ3JvdXBzLmZvckVhY2goTGF5b3V0LmRyYWdFbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZC5maXhlZCAmPSB+NjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0Lm1vdXNlT3ZlciA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQuZml4ZWQgfD0gNDtcbiAgICAgICAgZC5weCA9IGQueCwgZC5weSA9IGQueTtcbiAgICB9O1xuICAgIExheW91dC5tb3VzZU91dCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQuZml4ZWQgJj0gfjQ7XG4gICAgfTtcbiAgICByZXR1cm4gTGF5b3V0O1xufSgpKTtcbmV4cG9ydHMuTGF5b3V0ID0gTGF5b3V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYkdGNWIzVjBMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmJHRjViM1YwTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJRVUVzZVVOQlFUQkRPMEZCUXpGRExEWkRRVUVyU0R0QlFVTXZTQ3h4UTBGQmFVTTdRVUZEYWtNc2VVTkJRVGhGTzBGQlF6bEZMR2xFUVVFd1F6dEJRVU14UXl3clFrRkJkVVE3UVVGRGRrUXNNa1JCUVdsRk8wRkJUemRFTEVsQlFWa3NVMEZCT0VJN1FVRkJNVU1zVjBGQldTeFRRVUZUTzBsQlFVY3NNa05CUVVzc1EwRkJRVHRKUVVGRkxIbERRVUZKTEVOQlFVRTdTVUZCUlN4MVEwRkJSeXhEUVVGQk8wRkJRVU1zUTBGQlF5eEZRVUU1UWl4VFFVRlRMRWRCUVZRc2FVSkJRVk1zUzBGQlZDeHBRa0ZCVXl4UlFVRnhRanRCUVVGQkxFTkJRVU03UVVFclF6TkRMR2xDUVVGcFFpeERRVUZOTzBsQlEyNUNMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVOQlFVTTdRVUZET1VVc1EwRkJRenRCUVhkQ1JEdEpRVUZCTzFGQlFVRXNhVUpCYTNsQ1F6dFJRV3A1UWxjc1owSkJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOeVFpeHJRa0ZCWVN4SFFVRjVReXhGUVVGRkxFTkJRVU03VVVGRGVrUXNjVUpCUVdkQ0xFZEJRVmNzUlVGQlJTeERRVUZETzFGQlF6bENMREJDUVVGeFFpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTTNRaXhqUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEycENMRzFDUVVGakxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEzWkNMSGRDUVVGdFFpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVY3pRaXhoUVVGUkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEycENMRmRCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRFdpeFpRVUZQTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJJc1pVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5zUWl4WFFVRk5MRWRCUVRCQ0xFVkJRVVVzUTBGQlF6dFJRVU51UXl4cFFrRkJXU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5zUWl4dlFrRkJaU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU4yUWl4aFFVRlJMRWRCUVZrc1NVRkJTU3hEUVVGRE8xRkJRM3BDTERaQ1FVRjNRaXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5vUXl4bFFVRlZMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMnhDTEhGQ1FVRm5RaXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU40UWl4elFrRkJhVUlzUjBGQlJ5eEpRVUZKTEVOQlFVTTdVVUZIZGtJc1ZVRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRV3RXZGtJc2FVSkJRVmtzUjBGQk1rSTdXVUZEYmtNc1kwRkJZeXhGUVVGRkxFMUJRVTBzUTBGQlF5eGpRVUZqTzFsQlEzSkRMR05CUVdNc1JVRkJSU3hOUVVGTkxFTkJRVU1zWTBGQll6dFpRVU55UXl4VFFVRlRMRVZCUVVVc1RVRkJUU3hEUVVGRExHRkJRV0U3V1VGREwwSXNUMEZCVHl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzVDBGQlR5eExRVUZKTEVOQlFVTXNVMEZCVXl4TFFVRkxMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUUxUkN4RFFVRTBSRHRUUVVNM1JTeERRVUZETzBsQmJXSk9MRU5CUVVNN1NVRjBkMEpWTEcxQ1FVRkZMRWRCUVZRc1ZVRkJWU3hEUVVGeFFpeEZRVUZGTEZGQlFXbERPMUZCUlRsRUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRaUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJwRExFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNN1VVRkRlRU1zUTBGQlF6dFJRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTBvc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNN1VVRkROMElzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVWxUTEhkQ1FVRlBMRWRCUVdwQ0xGVkJRV3RDTEVOQlFWRTdVVUZEZEVJc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRE1VUXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNVUlzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZMVXl4eFFrRkJTU3hIUVVGa08xRkJRMGtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVN1dVRkJReXhEUVVGRE8wbEJRM3BDTEVOQlFVTTdTVUZMVXl4eFFrRkJTU3hIUVVGa08xRkJRMGtzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTm9ReXhKUVVGSkxFTkJRVU1zVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhIUVVGSExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVONFJpeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFTkJRVU03VVVGRFJDeEpRVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGRGRFSXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVVZVTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzFGQlF6VkNMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEzSkNMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU5XTEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlN5eFhRVUZYTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUXpkRUxFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRFdDeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyWXNRMEZCUXp0blFrRkRSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyeERMRU5CUVVNN1VVRkRUQ3hEUVVGRE8xRkJSVVFzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhWUVVGVkxFVkJRVVVzUTBGQlF6dFJRVVZ3UXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTllMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEzQkNMRU5CUVVNN1VVRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNUMEZCVHl4SlFVRkpMRU5CUVVNc1YwRkJWeXhMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYWtRc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEY2tJc1EwRkJRenRSUVVORUxFbEJRVWtzUTBGQlF5eFhRVUZYTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUlhSQ0xFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSU3hEUVVGRE8xRkJSVE5DTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzVTBGQlV5eERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRGNrWXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVOcVFpeERRVUZETzBsQlIwOHNiME5CUVcxQ0xFZEJRVE5DTzFGQlEwa3NTVUZCVFN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pFTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTTVRaXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZEVkN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOWUxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMllzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZYUkN4elFrRkJTeXhIUVVGTUxGVkJRVTBzUTBGQlR6dFJRVU5VTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5NTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVkeVJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMVlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRE8yOUNRVU16UWl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFWVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJWU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdaMEpCUTNoRUxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTklMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE4wSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dHZRa0ZEZWtJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1owSkJRM2hDTEVOQlFVTTdXVUZEVEN4RFFVRkRPMWxCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEZGtJc1EwRkJRenRSUVVORUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZORUxIVkNRVUZOTEVkQlFVNHNWVUZCVHl4RFFVRm5RanRSUVVGMlFpeHBRa0YxUWtNN1VVRjBRa2NzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRiRUlzUlVGQlJTeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1QwRkJUeXhMUVVGTExGZEJRVmNzUTBGQlF6dG5Ra0ZEYWtNc1EwRkJReXhEUVVGRExFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVJc1JVRkJSU3hEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyeERMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN2IwSkJRMnhDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExGRkJRVkVzUTBGQlF6dDNRa0ZEZEVJc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGQk8yZENRVU5xUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOUUxFTkJRVU03V1VGRFJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRiRU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dHZRa0ZEYmtJc1JVRkJSU3hEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEV0QlFVc3NVVUZCVVN4RFFVRkRPM2RDUVVOMlFpeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVRTdaMEpCUTI1RUxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlExQXNRMEZCUXp0UlFVTk1MRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMGdzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RlFVRXZRaXhEUVVFclFpeERRVUZETEVOQlFVTTdVVUZEYkVZc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEZRVUV2UWl4RFFVRXJRaXhEUVVGRExFTkJRVU03VVVGRGJrWXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlJVUXNhVU5CUVdkQ0xFZEJRV2hDTEZWQlFXbENMRU5CUVZjN1VVRkRlRUlzU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExGbEJRVmtzUlVGQlJTeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRNMFlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03VVVGRGRFSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMHdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJWVVFzT0VKQlFXRXNSMEZCWWl4VlFVRmpMRU5CUVZjN1VVRkRja0lzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4alFVRmpMRU5CUVVNN1VVRkRiRVFzU1VGQlNTeERRVUZETEdOQlFXTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRlRUlzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJXVVFzYlVOQlFXdENMRWRCUVd4Q0xGVkJRVzFDTEVOQlFWYzdVVUZETVVJc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJRenRSUVVOMlJDeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFZEJRVWNzUTBGQlF5eERRVUZETzFGQlF6ZENMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFWRkVMREpDUVVGVkxFZEJRVllzVlVGQlZ5eEpRVUZaTEVWQlFVVXNZVUZCZDBNN1VVRkROMFFzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRVU1zU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXp0UlFVTnNReXhKUVVGSkxFTkJRVU1zZDBKQlFYZENMRWRCUVVjN1dVRkROVUlzU1VGQlNTeEZRVUZGTEVsQlFVazdXVUZEVml4blFrRkJaMElzUlVGQlJTeFBRVUZQTEdGQlFXRXNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExHTkJRV01zVFVGQlRTeERRVUZETEdGQlFXRXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllUdFRRVU0zUnl4RFFVRkRPMUZCUTBZc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFUUkNPMUZCUXpsQ0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZWRUxEUkNRVUZYTEVkQlFWZ3NWVUZCV1N4RFFVRmpPMUZCUTNSQ0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUTJoRUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZkRUxDdENRVUZqTEVkQlFXUXNWVUZCWlN4RFFVRlBPMUZCUTJ4Q0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRPMUZCUTI1RUxFbEJRVWtzUTBGQlF5eGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNwQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZWRUxIRkNRVUZKTEVkQlFVb3NWVUZCU3l4RFFVRnBRanRSUVVOc1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRPMUZCUTJoRExFbEJRVWtzUTBGQlF5eFhRVUZYTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZORUxHZERRVUZsTEVkQlFXWXNWVUZCWjBJc1EwRkJUenRSUVVOdVFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU03VVVGRGNrTXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTXhRaXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlRSQ3hwUTBGQlowSXNSMEZCYUVJc1ZVRkJhVUlzUTBGQlR6dFJRVU53UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTTdVVUZEZEVNc1NVRkJTU3hEUVVGRExHbENRVUZwUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNelFpeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGVFJDdzJRa0ZCV1N4SFFVRmFMRlZCUVdFc1EwRkJUenRSUVVOb1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRFRDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJRenRSUVVNNVFpeERRVUZETzFGQlEwUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZEVRc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1F5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlJDeDVRa0ZCVVN4SFFVRlNMRlZCUVZNc1EwRkJiMEk3VVVGRGVrSXNTVUZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGJrSXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlNVUXNjVU5CUVc5Q0xFZEJRWEJDTEZWQlFYRkNMRU5CUVZVN1VVRkRNMElzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXp0UlFVTXZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEU5QlFVOHNRMEZCUXl4TFFVRkxMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOdVJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSlJDeHpRa0ZCU3l4SFFVRk1MRlZCUVUwc1EwRkJWVHRSUVVOYUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEwWXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMUFzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dHZRa0ZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZETTBJc1NVRkJTVHR2UWtGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVONlFpeERRVUZETzFsQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVObUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEycENMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETzI5Q1FVTnlRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETDBRc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzJkQ1FVTm9RaXhEUVVGRE8xbEJRMHdzUTBGQlF6dFpRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkRhRUlzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZGUkN3NFFrRkJZU3hIUVVGaUxGVkJRV01zU1VGQmVVSTdVVUZEYmtNc1RVRkJUU3hEUVVGRExFOUJRVThzU1VGQlNTeERRVUZETEdGQlFXRXNTMEZCU3l4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQkswSXNTVUZCU1N4RFFVRkRMR0ZCUVdNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCVXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8wbEJRemxKTEVOQlFVTTdTVUZGVFN4dlFrRkJZU3hIUVVGd1FpeFZRVUZ4UWl4SlFVRjFRaXhGUVVGRkxFMUJRV003VVVGRGVFUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03U1VGRGVrSXNRMEZCUXp0SlFVVkVMRFJDUVVGWExFZEJRVmdzVlVGQldTeEpRVUY1UWp0UlFVTnFReXhOUVVGTkxFTkJRVU1zVDBGQlR5eEpRVUZKTEVOQlFVTXNVMEZCVXl4TFFVRkxMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6TkZMRU5CUVVNN1NVRnRRa1FzZVVOQlFYZENMRWRCUVhoQ0xGVkJRWGxDTEZkQlFXMUNMRVZCUVVVc1EwRkJZVHRSUVVFelJDeHBRa0ZKUXp0UlFVbzJReXhyUWtGQlFTeEZRVUZCTEV0QlFXRTdVVUZEZGtRc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRmRCUVZjc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUYwUWl4RFFVRnpRaXhEUVVGRExFTkJRVU03VVVGREwwTXNTVUZCU1N4RFFVRkRMSEZDUVVGeFFpeEhRVUZITEdOQlFVMHNUMEZCUVN4elEwRkJkMElzUTBGQlF5eExRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRXRCUVVrc1EwRkJReXhaUVVGWkxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFUTkVMRU5CUVRKRUxFTkJRVU03VVVGREwwWXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQldVUXNiVU5CUVd0Q0xFZEJRV3hDTEZWQlFXMUNMRmRCUVcxQ0xFVkJRVVVzUTBGQllUdFJRVUZ5UkN4cFFrRkpRenRSUVVwMVF5eHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkRha1FzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRjBRaXhEUVVGelFpeERRVUZETEVOQlFVTTdVVUZETDBNc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMR05CUVUwc1QwRkJRU3huUTBGQmEwSXNRMEZCUXl4TFFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVhKRUxFTkJRWEZFTEVOQlFVTTdVVUZEZWtZc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCV1VRc2MwSkJRVXNzUjBGQlRDeFZRVU5KTERoQ1FVRXdReXhGUVVNeFF5d3JRa0ZCTWtNc1JVRkRNME1zSzBKQlFUSkRMRVZCUXpORExHdENRVUU0UWl4RlFVTTVRaXhYUVVGclFpeEZRVU5zUWl4WFFVRnJRanRSUVU1MFFpeHBRa0Z6U2tNN1VVRnlTa2NzSzBOQlFVRXNSVUZCUVN4clEwRkJNRU03VVVGRE1VTXNaMFJCUVVFc1JVRkJRU3h0UTBGQk1rTTdVVUZETTBNc1owUkJRVUVzUlVGQlFTeHRRMEZCTWtNN1VVRkRNME1zYlVOQlFVRXNSVUZCUVN4elFrRkJPRUk3VVVGRE9VSXNORUpCUVVFc1JVRkJRU3hyUWtGQmEwSTdVVUZEYkVJc05FSkJRVUVzUlVGQlFTeHJRa0ZCYTBJN1VVRkZiRUlzU1VGQlNTeERRVUZUTEVWQlExUXNRMEZCVXl4RlFVTlVMRU5CUVVNc1IwRkJaMElzU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUnl4RFFVRkRMRTFCUVUwc1JVRkRja01zUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlF5OUNMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSVUZEZEVJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNaQ0xFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVFZDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVVYyUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRllpeEpRVUZKTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRE8xRkJSVGRDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEY2tJc1EwRkJReXhEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEV2l4RlFVRkZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE4wSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU0zUWl4RFFVRkRPMWxCUTBRc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZGU0N4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zY1VKQlFYRkNMRU5CUVVNN1dVRkJReXhKUVVGSkxFTkJRVU1zY1VKQlFYRkNMRVZCUVVVc1EwRkJRenRSUVVzM1JDeEpRVUZKTEZOQlFWTXNRMEZCUXp0UlFVTmtMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUlhaQ0xGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRPMUZCUTNKRExFTkJRVU03VVVGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVVktMRk5CUVZNc1IwRkJSeXhEUVVGRExFbEJRVWtzTUVKQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVOQlFVTXNZMEZCWXl4RlFVRkZMRTFCUVUwc1EwRkJReXhqUVVGakxFVkJRVVVzVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4TFFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZ5UWl4RFFVRnhRaXhEUVVGRExFTkJRVU1zUTBGQlF5eGpRVUZqTEVWQlFVVXNRMEZCUXp0WlFVbDJTU3hEUVVGRExFZEJRVWNzYVVKQlFVOHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETEVWQlFVVXNZMEZCVFN4UFFVRkJMRU5CUVVNc1JVRkJSQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU16UXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdaMEpCUTJwQ0xFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1NVRkJTU3hSUVVGUkxFTkJRVU03YjBKQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhMUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRuUWtGRE1VVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeEpRVUZKTEZGQlFWRXNRMEZCUXp0dlFrRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEV0QlFVa3NRMEZCUXl4TlFVRk5MRU5CUVZNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6bEZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMGdzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8yZENRVU5xUWl4SlFVRk5MRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNSRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExQXNRMEZCUXp0UlFVVkVMRWxCUVVrc1EwRkJReXhIUVVGSExHbENRVUZQTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eEZRVUZGTEZWQlFWVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRhRVFzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWSUxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRlZMRWxCUVVrc1QwRkJUeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMjVGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOV0xFbEJRVWtzWVVGQllTeEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hSUVVGUkxFVkJRVVVzWVVGQllUdG5Ra0ZET1VNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNN1owSkJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzWVVGQllTeERRVUZETzFsQlEzUkRMRU5CUVVNc1EwRkJRenRaUVVOR0xFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRuUWtGRGJFSXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVa3NRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRnBRbkpFTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yZENRVU55UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU42UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOUUxFTkJRVU03VVVGQlF5eEpRVUZKTzFsQlFVTXNTVUZCU1N4RFFVRkRMRlZCUVZVc1IwRkJSeXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF6dFJRVVUzUkN4SlFVRkpMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeEpRVUZKTEVWQlFVVXNRMEZCUXp0UlFVTTNReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNkMEpCUVhkQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6RkNMRWxCUVVrc1EwRkJReXhaUVVGaExFTkJRVU1zWjBKQlFXZENMRWRCUVVjc1NVRkJTU3hEUVVGRExIZENRVUYzUWl4RFFVRkRMR2RDUVVGblFpeERRVUZETzFsQlF6TkdMR05CUVdNc1IwRkJSeXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETERaRFFVRXJRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXgzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUnpGS0xFTkJRVU03VVVGRlJDeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xRkJRekZDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRWRCUVVjc1NVRkJTU3hwUWtGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJYWkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUXpWQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRla0lzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU4yUWl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRWaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMWdzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU5ZTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMjVDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRiRU1zUTBGQlF6dFJRVU5NTEVOQlFVTTdVVUZEUkN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRPMUZCU3pGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNPRUpCUVRoQ0xFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUjNwRUxFVkJRVVVzUTBGQlF5eERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3h6UWtGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFOUJRVThzUlVGQlJTeEpRVUZKTEVOQlFVTXNWVUZCVlN4RlFVRkZMR05CUVdNc1EwRkJReXhEUVVGRExHZENRVUZuUWl4RlFVRkZMRU5CUVVNN1VVRkRja29zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc0swSkJRU3RDTEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hKUVVGSkxFTkJRVU1zTmtKQlFUWkNMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeFhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVZDBSQ3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNaQ0xFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRUQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMSE5DUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRkxFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVXNZMEZCWXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExHZENRVUZuUWl4RlFVRkZMRU5CUVVNN1dVRkROVWdzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja1VzUTBGQlF6dFJRVWRFTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5d3JRa0ZCSzBJc1EwRkJReXhEUVVGRE8xRkJSVzVFTEVWQlFVVXNRMEZCUXl4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnlRaXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEZsQlFWa3NSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRiRU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4WlFVRlpMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNN1dVRkRiRVFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4blFrRkJaMElzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYmtNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eGxRVUZsTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOMlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4cFFrRkJUeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNc1JVRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzJkQ1FVTjJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YjBKQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRja01zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUVR0WlFVTmFMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMGdzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRM0pDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1VVRkRNVU1zUTBGQlF6dFJRVVZFTEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUlVGQlJTeERRVUZETzFGQlF6TkNMRWxCUVVrc1EwRkJReXcyUWtGQk5rSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxGZEJRVmNzUTBGQlF5eERRVUZETzFGQlEzUkVMRTFCUVUwc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETzBsQlF6bERMRU5CUVVNN1NVRkZUeXc0UWtGQllTeEhRVUZ5UWl4VlFVRnpRaXhWUVVGclFpeEZRVUZGTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUXpsRUxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeFZRVUZWTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVjMVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF6dFpRVU16UWl4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVXNzUlVGQlJTeE5RVUZOTEVWQlFWTXNRMEZCUXl4RFFVRkRMRTFCUVU4c1EwRkJReXhMUVVGTExFVkJRVVVzVFVGQlRTeEZRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRlBMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVUVzUlVGQmRrVXNRMEZCZFVVc1EwRkJReXhEUVVGRE8xbEJRekZITEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJTeXhGUVVGRkxFdEJRVXNzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVFc1JVRkJka0lzUTBGQmRVSXNRMEZCUXl4RFFVRkRPMWxCUTNaRUxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlEzUkNMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVTBzUlVGQlJTeExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTTNReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5JTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU03YjBKQlEyaERMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJhRVFzUTBGQlowUXNRMEZCUXl4RFFVRkRPMmRDUVVNMVJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eERRVUZETzI5Q1FVTm9ReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRVZCUVVVc1NVRkJTU3hQUVVGQkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNSVUZCUlN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRV3BFTEVOQlFXbEVMRU5CUVVNc1EwRkJRenRaUVVOc1JpeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVZElMRWxCUVVrc1RVRkJUU3hGUVVGRk8ybENRVU5RTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03YVVKQlEycENMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU03YVVKQlExUXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJRenRwUWtGRFdpeGhRVUZoTEVOQlFVTXNTMEZCU3l4RFFVRkRPMmxDUVVOd1FpeFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmxCUVZrc1JVRkJSU3hEUVVGRE8ybENRVU5xUXl4M1FrRkJkMElzUTBGQlF5eERRVUZETEVOQlFVTTdhVUpCUXpOQ0xHOUNRVUZ2UWl4RFFVRkRMRWxCUVVrc1EwRkJRenRwUWtGRE1VSXNTMEZCU3l4RFFVRkRMRlZCUVZVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVWMlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03WjBKQlEycENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUXpOQ0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRMMElzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEVUN4RFFVRkRPMUZCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRFNpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU5zUXl4RFFVRkRPMGxCUTB3c1EwRkJRenRKUVVkUExEaERRVUUyUWl4SFFVRnlReXhWUVVGelF5eExRVUZoTEVWQlFVVXNUVUZCWXl4RlFVRkZMRmRCUVRKQ08xRkJRV2hITEdsQ1FXVkRPMUZCWm05RkxEUkNRVUZCTEVWQlFVRXNhMEpCUVRKQ08xRkJSVFZHTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExHVkJRV1VzU1VGQlNTeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzQkVMRWxCUVVrc1IwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UkN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZWTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5xUlN4SlFVRkpMRTFCUVUwc1IwRkJSeXh0UTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlEzUkVMR2xEUVVGWkxFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVc3NSVUZCUlN4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RlFVRkZMRU5CUVVNc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFpRVU16UlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVOeVFpeExRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFdEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM3BFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTllMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNM1FpeERRVUZETzFsQlEwd3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRVQ3hEUVVGRE8wbEJRMHdzUTBGQlF6dEpRVVZFTEhWQ1FVRk5MRWRCUVU0N1VVRkRTU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVNelFpeERRVUZETzBsQlJVUXNjVUpCUVVrc1IwRkJTanRSUVVOSkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM3BDTEVOQlFVTTdTVUZKUkN4dFEwRkJhMElzUjBGQmJFSXNWVUZCYlVJc1ZVRkJjMEk3VVVGQmRFSXNNa0pCUVVFc1JVRkJRU3hqUVVGelFqdFJRVU55UXl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVkQlFVY3NTVUZCU1N3MlFrRkJjMElzUTBGRE9VTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETzFsQlEzWkNMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETzFGQlEzQkVMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFdpeERRVUZETzBsQlYwUXNNRUpCUVZNc1IwRkJWQ3hWUVVGVkxFbEJRVWtzUlVGQlJTeEZRVUZqTEVWQlFVVXNTVUZCU1R0UlFVRndRaXh0UWtGQlFTeEZRVUZCTEUxQlFXTTdVVUZETVVJc1NVRkJTU3hSUVVGUkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlNXeENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzTmtKQlFYTkNMRU5CUVVNc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkRja2dzUzBGQlN5eEhRVUZoTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVU40UkN4TFFVRkxMRWRCUVdFc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTNoRUxFdEJRVXNzUjBGQlJ5eEhRVUZITEVOQlFVTXNVVUZCVVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVTTVReXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEZGQlFWRXNRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0UlFVTnFSQ3hIUVVGSExFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNwRkxFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNTVUZCU1N4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRE9VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzUTBGQlF6dFJRVU5FTEVsQlFVa3NVMEZCVXl4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVZnc1EwRkJWeXhGUVVGRkxGTkJRVk1zUjBGQlJ5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZZTEVOQlFWY3NSVUZCUlN4TlFVRk5MRWRCUVVjc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVZZc1EwRkJWU3hGUVVOd1JpeE5RVUZOTEVkQlFVY3NTVUZCU1N3d1FrRkJWU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzVTBGQlV5eEZRVUZGTEZOQlFWTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkRNVVVzV1VGQldTeEhRVUZITEUxQlFVMHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU12UkN4RlFVRkZMRU5CUVVNc1EwRkJReXhaUVVGWkxFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNTVUZCU1N4WlFVRlpMRU5CUVVNc1RVRkJUU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOd1JTeEpRVUZKTEV0QlFVc3NSMEZCUnl3eVFrRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNWMEZCVnl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUTJ4R0xGRkJRVkVzUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4clFrRkJhMElzUlVGQlJTeExRVUZMTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkROVVFzUTBGQlF6dFJRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTBvc1NVRkJTU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUXpOQ0xFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETlVJc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU0xUWl4UlFVRlJMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1owSkJRM1pDTEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU0xUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExITkNRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRPVVFzUTBGQlF6dFJRV0ZFTEUxQlFVMHNRMEZCUXl4UlFVRlJMRU5CUVVNN1NVRkRjRUlzUTBGQlF6dEpRVWROTEhGQ1FVRmpMRWRCUVhKQ0xGVkJRWE5DTEVOQlFYTkNPMUZCUTNoRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlV5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJVU3hEUVVGRExFTkJRVU1zVFVGQlR5eERRVUZETEV0QlFVc3NRMEZCUXp0SlFVTndSaXhEUVVGRE8wbEJSMDBzY1VKQlFXTXNSMEZCY2tJc1ZVRkJjMElzUTBGQmMwSTdVVUZEZUVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGVExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRlJMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETzBsQlEzQkdMRU5CUVVNN1NVRkhUU3hoUVVGTkxFZEJRV0lzVlVGQll5eERRVUZ6UWp0UlFVTm9ReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOeVJTeERRVUZETzBsQlRVMHNaMEpCUVZNc1IwRkJhRUlzVlVGQmFVSXNRMEZCWlR0UlFVTTFRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMklzVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJoRUxFTkJRVU03VVVGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTktMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtJc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYWtJc1EwRkJRenRKUVVOTUxFTkJRVU03U1VGSll5eGxRVUZSTEVkQlFYWkNMRlZCUVhkQ0xFTkJRVTg3VVVGRGNrSXNRMEZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExb3NRMEZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzUkNMRU5CUVVNN1NVRkpZeXhyUWtGQlZ5eEhRVUV4UWl4VlFVRXlRaXhEUVVGUkxFVkJRVVVzVFVGQlowTTdVVUZEYWtVc1JVRkJSU3hEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJFTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzJkQ1FVTmtMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETzJkQ1FVTmlMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJJc1EwRkJSU3hEUVVGRExHbENRVUZwUWl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRkRU1zUTBGQlJTeERRVUZETEdsQ1FVRnBRaXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOb1JDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTlFMRU5CUVVNN1VVRkRSQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRTFCUVUwc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4RlFVRTNRaXhEUVVFMlFpeERRVUZETEVOQlFVTTdVVUZEZWtRc1EwRkJRenRKUVVOTUxFTkJRVU03U1VGSFRTeHBRa0ZCVlN4SFFVRnFRaXhWUVVGclFpeERRVUZsTzFGQlF6ZENMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRZaXhOUVVGTkxFTkJRVU03WjBKQlEwZ3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTzJkQ1FVTm9RaXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVN1lVRkRia0lzUTBGQlF6dFJRVU5PTEVOQlFVTTdVVUZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOS0xFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEWWl4RFFVRkRPMGxCUTB3c1EwRkJRenRKUVVsTkxGZEJRVWtzUjBGQldDeFZRVUZaTEVOQlFXVXNSVUZCUlN4UlFVRnJRenRSUVVNelJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEySXNSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMnhETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dHZRa0ZEWkN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRMmhETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRNVUlzUTBGQlJTeERRVUZETEVWQlFVVXNSMEZCVXl4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGFFUXNRMEZCUlN4RFFVRkRMRVZCUVVVc1IwRkJVeXhEUVVGRkxFTkJRVU1zYVVKQlFXbENMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETVVRc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRFVDeERRVUZETzFsQlEwUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMnhETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVWQlFYaENMRU5CUVhkQ0xFTkJRVU1zUTBGQlF6dFpRVU53UkN4RFFVRkRPMUZCUTB3c1EwRkJRenRSUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEwVXNRMEZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyNUNMRU5CUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTNRaXhEUVVGRE8wbEJRMHdzUTBGQlF6dEpRVWxOTEdOQlFVOHNSMEZCWkN4VlFVRmxMRU5CUVVNN1VVRkRXaXhGUVVGRkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMklzUlVGQlJTeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJ4RExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenR2UWtGRFpDeE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5zUWl4UFFVRmhMRU5CUVVVc1EwRkJReXhwUWtGQmFVSXNRMEZCUXp0dlFrRkRiRU1zVDBGQllTeERRVUZGTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU03WjBKQlEzUkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMUFzUTBGQlF6dFpRVU5FTEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOc1F5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdXVUZEY2tNc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTktMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZGYkVJc1EwRkJRenRKUVVOTUxFTkJRVU03U1VGSFRTeG5Ra0ZCVXl4SFFVRm9RaXhWUVVGcFFpeERRVUZETzFGQlEyUXNRMEZCUXl4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRFlpeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRek5DTEVOQlFVTTdTVUZIVFN4bFFVRlJMRWRCUVdZc1ZVRkJaMElzUTBGQlF6dFJRVU5pTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVTk1MR0ZCUVVNN1FVRkJSQ3hEUVVGRExFRkJiSGxDUkN4SlFXdDVRa003UVVGc2VVSlpMSGRDUVVGTkluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIGRlc2NlbnRfMSA9IHJlcXVpcmUoXCIuL2Rlc2NlbnRcIik7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgbGlua2xlbmd0aHNfMSA9IHJlcXVpcmUoXCIuL2xpbmtsZW5ndGhzXCIpO1xudmFyIExpbmszRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGluazNEKHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB9XG4gICAgTGluazNELnByb3RvdHlwZS5hY3R1YWxMZW5ndGggPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHgucmVkdWNlKGZ1bmN0aW9uIChjLCB2KSB7XG4gICAgICAgICAgICB2YXIgZHggPSB2W190aGlzLnRhcmdldF0gLSB2W190aGlzLnNvdXJjZV07XG4gICAgICAgICAgICByZXR1cm4gYyArIGR4ICogZHg7XG4gICAgICAgIH0sIDApKTtcbiAgICB9O1xuICAgIHJldHVybiBMaW5rM0Q7XG59KCkpO1xuZXhwb3J0cy5MaW5rM0QgPSBMaW5rM0Q7XG52YXIgTm9kZTNEID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlM0QoeCwgeSwgeikge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IDA7IH1cbiAgICAgICAgaWYgKHogPT09IHZvaWQgMCkgeyB6ID0gMDsgfVxuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLnogPSB6O1xuICAgIH1cbiAgICByZXR1cm4gTm9kZTNEO1xufSgpKTtcbmV4cG9ydHMuTm9kZTNEID0gTm9kZTNEO1xudmFyIExheW91dDNEID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMYXlvdXQzRChub2RlcywgbGlua3MsIGlkZWFsTGlua0xlbmd0aCkge1xuICAgICAgICBpZiAoaWRlYWxMaW5rTGVuZ3RoID09PSB2b2lkIDApIHsgaWRlYWxMaW5rTGVuZ3RoID0gMTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHRoaXMubGlua3MgPSBsaW5rcztcbiAgICAgICAgdGhpcy5pZGVhbExpbmtMZW5ndGggPSBpZGVhbExpbmtMZW5ndGg7XG4gICAgICAgIHRoaXMuY29uc3RyYWludHMgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZUphY2NhcmRMaW5rTGVuZ3RocyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVzdWx0ID0gbmV3IEFycmF5KExheW91dDNELmspO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IExheW91dDNELms7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRbaV0gPSBuZXcgQXJyYXkobm9kZXMubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gTGF5b3V0M0QuZGltczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGltID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdltkaW1dID09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICB2W2RpbV0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzBdW2ldID0gdi54O1xuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzFdW2ldID0gdi55O1xuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzJdW2ldID0gdi56O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgO1xuICAgIExheW91dDNELnByb3RvdHlwZS5saW5rTGVuZ3RoID0gZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgcmV0dXJuIGwuYWN0dWFsTGVuZ3RoKHRoaXMucmVzdWx0KTtcbiAgICB9O1xuICAgIExheW91dDNELnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChpdGVyYXRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChpdGVyYXRpb25zID09PSB2b2lkIDApIHsgaXRlcmF0aW9ucyA9IDEwMDsgfVxuICAgICAgICB2YXIgbiA9IHRoaXMubm9kZXMubGVuZ3RoO1xuICAgICAgICB2YXIgbGlua0FjY2Vzc29yID0gbmV3IExpbmtBY2Nlc3NvcigpO1xuICAgICAgICBpZiAodGhpcy51c2VKYWNjYXJkTGlua0xlbmd0aHMpXG4gICAgICAgICAgICBsaW5rbGVuZ3Roc18xLmphY2NhcmRMaW5rTGVuZ3Rocyh0aGlzLmxpbmtzLCBsaW5rQWNjZXNzb3IsIDEuNSk7XG4gICAgICAgIHRoaXMubGlua3MuZm9yRWFjaChmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGggKj0gX3RoaXMuaWRlYWxMaW5rTGVuZ3RoOyB9KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlTWF0cml4ID0gKG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcihuLCB0aGlzLmxpbmtzLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2U7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldDsgfSwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9KSkuRGlzdGFuY2VNYXRyaXgoKTtcbiAgICAgICAgdmFyIEQgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgobiwgZnVuY3Rpb24gKGksIGopIHsgcmV0dXJuIGRpc3RhbmNlTWF0cml4W2ldW2pdOyB9KTtcbiAgICAgICAgdmFyIEcgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgobiwgZnVuY3Rpb24gKCkgeyByZXR1cm4gMjsgfSk7XG4gICAgICAgIHRoaXMubGlua3MuZm9yRWFjaChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBfYS5zb3VyY2UsIHRhcmdldCA9IF9hLnRhcmdldDtcbiAgICAgICAgICAgIHJldHVybiBHW3NvdXJjZV1bdGFyZ2V0XSA9IEdbdGFyZ2V0XVtzb3VyY2VdID0gMTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGVzY2VudCA9IG5ldyBkZXNjZW50XzEuRGVzY2VudCh0aGlzLnJlc3VsdCwgRCk7XG4gICAgICAgIHRoaXMuZGVzY2VudC50aHJlc2hvbGQgPSAxZS0zO1xuICAgICAgICB0aGlzLmRlc2NlbnQuRyA9IEc7XG4gICAgICAgIGlmICh0aGlzLmNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgdGhpcy5kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLm5vZGVzLCBudWxsLCBudWxsLCB0aGlzLmNvbnN0cmFpbnRzKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NlbnQubG9ja3MuYWRkKGksIFt2LngsIHYueSwgdi56XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXNjZW50LnJ1bihpdGVyYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmNsZWFyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NlbnQubG9ja3MuYWRkKGksIFt2LngsIHYueSwgdi56XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzY2VudC5ydW5nZUt1dHRhKCk7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5kaW1zID0gWyd4JywgJ3knLCAneiddO1xuICAgIExheW91dDNELmsgPSBMYXlvdXQzRC5kaW1zLmxlbmd0aDtcbiAgICByZXR1cm4gTGF5b3V0M0Q7XG59KCkpO1xuZXhwb3J0cy5MYXlvdXQzRCA9IExheW91dDNEO1xudmFyIExpbmtBY2Nlc3NvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua0FjY2Vzc29yKCkge1xuICAgIH1cbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLmdldFNvdXJjZUluZGV4ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlOyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuZ2V0VGFyZ2V0SW5kZXggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS50YXJnZXQ7IH07XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH07XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5zZXRMZW5ndGggPSBmdW5jdGlvbiAoZSwgbCkgeyBlLmxlbmd0aCA9IGw7IH07XG4gICAgcmV0dXJuIExpbmtBY2Nlc3Nvcjtcbn0oKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2liR0Y1YjNWME0yUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5c1lYbHZkWFF6WkM1MGN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU96dEJRVUZCTEdsRVFVRXdRenRCUVVNeFF5eHhRMEZCYVVNN1FVRkRha01zZVVOQlFUUkVPMEZCUlRWRUxEWkRRVUZ2UlR0QlFVVndSVHRKUVVWUkxHZENRVUZ0UWl4TlFVRmpMRVZCUVZNc1RVRkJZenRSUVVGeVF5eFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRlJPMUZCUVZNc1YwRkJUU3hIUVVGT0xFMUJRVTBzUTBGQlVUdEpRVUZKTEVOQlFVTTdTVUZETjBRc05rSkJRVmtzUjBGQldpeFZRVUZoTEVOQlFXRTdVVUZCTVVJc2FVSkJUVU03VVVGTVJ5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkRXaXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVTXNRMEZCVXl4RlFVRkZMRU5CUVZjN1dVRkROVUlzU1VGQlRTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRek5ETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU4yUWl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5tTEVOQlFVTTdTVUZEVEN4aFFVRkRPMEZCUVVRc1EwRkJReXhCUVZaTUxFbEJWVXM3UVVGV1VTeDNRa0ZCVFR0QlFWZG1PMGxCVTBrc1owSkJRMWNzUTBGQllTeEZRVU5pTEVOQlFXRXNSVUZEWWl4RFFVRmhPMUZCUm1Jc2EwSkJRVUVzUlVGQlFTeExRVUZoTzFGQlEySXNhMEpCUVVFc1JVRkJRU3hMUVVGaE8xRkJRMklzYTBKQlFVRXNSVUZCUVN4TFFVRmhPMUZCUm1Jc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQldUdFJRVU5pTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVZrN1VVRkRZaXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZaTzBsQlFVa3NRMEZCUXp0SlFVTnFReXhoUVVGRE8wRkJRVVFzUTBGQlF5eEJRV0pFTEVsQllVTTdRVUZpV1N4M1FrRkJUVHRCUVdOdVFqdEpRVTFKTEd0Q1FVRnRRaXhMUVVGbExFVkJRVk1zUzBGQlpTeEZRVUZUTEdWQlFUSkNPMUZCUVROQ0xHZERRVUZCTEVWQlFVRXNiVUpCUVRKQ08xRkJRVGxHTEdsQ1FXRkRPMUZCWW10Q0xGVkJRVXNzUjBGQlRDeExRVUZMTEVOQlFWVTdVVUZCVXl4VlFVRkxMRWRCUVV3c1MwRkJTeXhEUVVGVk8xRkJRVk1zYjBKQlFXVXNSMEZCWml4bFFVRmxMRU5CUVZrN1VVRkdPVVlzWjBKQlFWY3NSMEZCVlN4SlFVRkpMRU5CUVVNN1VVRnhRakZDTERCQ1FVRnhRaXhIUVVGWkxFbEJRVWtzUTBGQlF6dFJRV3hDYkVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEYkVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdVVUZETjBNc1EwRkJRenRSUVVORUxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVObUxFZEJRVWNzUTBGQlF5eERRVUZaTEZWQlFXRXNSVUZCWWl4TFFVRkJMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRV0lzWTBGQllTeEZRVUZpTEVsQlFXRTdaMEpCUVhoQ0xFbEJRVWtzUjBGQlJ5eFRRVUZCTzJkQ1FVTlNMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJRenR2UWtGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETzJGQlF6VkVPMWxCUTBRc1MwRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzaENMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4TFFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRVQ3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVVZHTERaQ1FVRlZMRWRCUVZZc1ZVRkJWeXhEUVVGVE8xRkJRMmhDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0SlFVTjJReXhEUVVGRE8wbEJTMFFzZDBKQlFVc3NSMEZCVEN4VlFVRk5MRlZCUVhkQ08xRkJRVGxDTEdsQ1FYVkRRenRSUVhaRFN5d3lRa0ZCUVN4RlFVRkJMR2RDUVVGM1FqdFJRVU14UWl4SlFVRk5MRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVVTFRaXhKUVVGSkxGbEJRVmtzUjBGQlJ5eEpRVUZKTEZsQlFWa3NSVUZCUlN4RFFVRkRPMUZCUlhSRExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4eFFrRkJjVUlzUTBGQlF6dFpRVU16UWl4blEwRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVVYwUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUzBGQlNTeERRVUZETEdWQlFXVXNSVUZCYUVNc1EwRkJaME1zUTBGQlF5eERRVUZETzFGQlJ6RkVMRWxCUVUwc1kwRkJZeXhIUVVGSExFTkJRVU1zU1VGQlNTd3dRa0ZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVU5vUkN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFWSXNRMEZCVVN4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJMRVZCUVVVc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRlNMRU5CUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zWTBGQll5eEZRVUZGTEVOQlFVTTdVVUZGYWtVc1NVRkJUU3hEUVVGRExFZEJRVWNzYVVKQlFVOHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGd1FpeERRVUZ2UWl4RFFVRkRMRU5CUVVNN1VVRkplRVVzU1VGQlNTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1kwRkJZeXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRhRVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJReXhGUVVGclFqdG5Ra0ZCYUVJc2EwSkJRVTBzUlVGQlJTeHJRa0ZCVFR0WlFVRlBMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRPMUZCUVhwRExFTkJRWGxETEVOQlFVTXNRMEZCUXp0UlFVVjBSaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NhVUpCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpORExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVNNVFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGSmJrSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF6dFpRVU5xUWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFOUJRVThzUjBGQlJ5eEpRVUZKTEhOQ1FVRlZMRU5CUVdNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVWQlFVVXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3hEUVVGRE8xRkJSWEJJTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTjZReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1JDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTldMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBNc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRlJDeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU0zUWl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZGUkN4MVFrRkJTU3hIUVVGS08xRkJRMGtzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03VVVGRE0wSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMWxCUTNwRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRFSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTFZc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZReXhEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVlVzUlVGQlJTeERRVUZETzBsQlEzSkRMRU5CUVVNN1NVRTNSVTBzWVVGQlNTeEhRVUZITEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU4yUWl4VlFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUUyUlhCRExHVkJRVU03UTBGQlFTeEJRUzlGUkN4SlFTdEZRenRCUVM5RldTdzBRa0ZCVVR0QlFXbEdja0k3U1VGQlFUdEpRVXRCTEVOQlFVTTdTVUZLUnl4eFEwRkJZeXhIUVVGa0xGVkJRV1VzUTBGQlRTeEpRVUZaTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU51UkN4eFEwRkJZeXhIUVVGa0xGVkJRV1VzUTBGQlRTeEpRVUZaTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU51UkN4blEwRkJVeXhIUVVGVUxGVkJRVlVzUTBGQlRTeEpRVUZaTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU01UXl4blEwRkJVeXhIUVVGVUxGVkJRVlVzUTBGQlRTeEZRVUZGTEVOQlFWTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYkVRc2JVSkJRVU03UVVGQlJDeERRVUZETEVGQlRFUXNTVUZMUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdW5pb25Db3VudChhLCBiKSB7XG4gICAgdmFyIHUgPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGEpXG4gICAgICAgIHVbaV0gPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGIpXG4gICAgICAgIHVbaV0gPSB7fTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModSkubGVuZ3RoO1xufVxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uQ291bnQoYSwgYikge1xuICAgIHZhciBuID0gMDtcbiAgICBmb3IgKHZhciBpIGluIGEpXG4gICAgICAgIGlmICh0eXBlb2YgYltpXSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICArK247XG4gICAgcmV0dXJuIG47XG59XG5mdW5jdGlvbiBnZXROZWlnaGJvdXJzKGxpbmtzLCBsYSkge1xuICAgIHZhciBuZWlnaGJvdXJzID0ge307XG4gICAgdmFyIGFkZE5laWdoYm91cnMgPSBmdW5jdGlvbiAodSwgdikge1xuICAgICAgICBpZiAodHlwZW9mIG5laWdoYm91cnNbdV0gPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgbmVpZ2hib3Vyc1t1XSA9IHt9O1xuICAgICAgICBuZWlnaGJvdXJzW3VdW3ZdID0ge307XG4gICAgfTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB1ID0gbGEuZ2V0U291cmNlSW5kZXgoZSksIHYgPSBsYS5nZXRUYXJnZXRJbmRleChlKTtcbiAgICAgICAgYWRkTmVpZ2hib3Vycyh1LCB2KTtcbiAgICAgICAgYWRkTmVpZ2hib3Vycyh2LCB1KTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmVpZ2hib3Vycztcbn1cbmZ1bmN0aW9uIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZiwgbGEpIHtcbiAgICB2YXIgbmVpZ2hib3VycyA9IGdldE5laWdoYm91cnMobGlua3MsIGxhKTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHZhciBhID0gbmVpZ2hib3Vyc1tsYS5nZXRTb3VyY2VJbmRleChsKV07XG4gICAgICAgIHZhciBiID0gbmVpZ2hib3Vyc1tsYS5nZXRUYXJnZXRJbmRleChsKV07XG4gICAgICAgIGxhLnNldExlbmd0aChsLCAxICsgdyAqIGYoYSwgYikpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKGxpbmtzLCBsYSwgdykge1xuICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICBjb21wdXRlTGlua0xlbmd0aHMobGlua3MsIHcsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBNYXRoLnNxcnQodW5pb25Db3VudChhLCBiKSAtIGludGVyc2VjdGlvbkNvdW50KGEsIGIpKTsgfSwgbGEpO1xufVxuZXhwb3J0cy5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMgPSBzeW1tZXRyaWNEaWZmTGlua0xlbmd0aHM7XG5mdW5jdGlvbiBqYWNjYXJkTGlua0xlbmd0aHMobGlua3MsIGxhLCB3KSB7XG4gICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKE9iamVjdC5rZXlzKGEpLmxlbmd0aCwgT2JqZWN0LmtleXMoYikubGVuZ3RoKSA8IDEuMSA/IDAgOiBpbnRlcnNlY3Rpb25Db3VudChhLCBiKSAvIHVuaW9uQ291bnQoYSwgYik7XG4gICAgfSwgbGEpO1xufVxuZXhwb3J0cy5qYWNjYXJkTGlua0xlbmd0aHMgPSBqYWNjYXJkTGlua0xlbmd0aHM7XG5mdW5jdGlvbiBnZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzKG4sIGxpbmtzLCBheGlzLCBsYSkge1xuICAgIHZhciBjb21wb25lbnRzID0gc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzKG4sIGxpbmtzLCBsYSk7XG4gICAgdmFyIG5vZGVzID0ge307XG4gICAgY29tcG9uZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjLCBpKSB7XG4gICAgICAgIHJldHVybiBjLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5vZGVzW3ZdID0gaTsgfSk7XG4gICAgfSk7XG4gICAgdmFyIGNvbnN0cmFpbnRzID0gW107XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICB2YXIgdWkgPSBsYS5nZXRTb3VyY2VJbmRleChsKSwgdmkgPSBsYS5nZXRUYXJnZXRJbmRleChsKSwgdSA9IG5vZGVzW3VpXSwgdiA9IG5vZGVzW3ZpXTtcbiAgICAgICAgaWYgKHUgIT09IHYpIHtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIGF4aXM6IGF4aXMsXG4gICAgICAgICAgICAgICAgbGVmdDogdWksXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHZpLFxuICAgICAgICAgICAgICAgIGdhcDogbGEuZ2V0TWluU2VwYXJhdGlvbihsKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29uc3RyYWludHM7XG59XG5leHBvcnRzLmdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMgPSBnZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzO1xuZnVuY3Rpb24gc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzKG51bVZlcnRpY2VzLCBlZGdlcywgbGEpIHtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzdGFjayA9IFtdO1xuICAgIHZhciBjb21wb25lbnRzID0gW107XG4gICAgZnVuY3Rpb24gc3Ryb25nQ29ubmVjdCh2KSB7XG4gICAgICAgIHYuaW5kZXggPSB2Lmxvd2xpbmsgPSBpbmRleCsrO1xuICAgICAgICBzdGFjay5wdXNoKHYpO1xuICAgICAgICB2Lm9uU3RhY2sgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdi5vdXQ7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgdyA9IF9hW19pXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdy5pbmRleCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzdHJvbmdDb25uZWN0KHcpO1xuICAgICAgICAgICAgICAgIHYubG93bGluayA9IE1hdGgubWluKHYubG93bGluaywgdy5sb3dsaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHcub25TdGFjaykge1xuICAgICAgICAgICAgICAgIHYubG93bGluayA9IE1hdGgubWluKHYubG93bGluaywgdy5pbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYubG93bGluayA9PT0gdi5pbmRleCkge1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudCA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHcgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB3Lm9uU3RhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQucHVzaCh3KTtcbiAgICAgICAgICAgICAgICBpZiAodyA9PT0gdilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50Lm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi5pZDsgfSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVmVydGljZXM7IGkrKykge1xuICAgICAgICBub2Rlcy5wdXNoKHsgaWQ6IGksIG91dDogW10gfSk7XG4gICAgfVxuICAgIGZvciAodmFyIF9pID0gMCwgZWRnZXNfMSA9IGVkZ2VzOyBfaSA8IGVkZ2VzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBlID0gZWRnZXNfMVtfaV07XG4gICAgICAgIHZhciB2XzEgPSBub2Rlc1tsYS5nZXRTb3VyY2VJbmRleChlKV0sIHcgPSBub2Rlc1tsYS5nZXRUYXJnZXRJbmRleChlKV07XG4gICAgICAgIHZfMS5vdXQucHVzaCh3KTtcbiAgICB9XG4gICAgZm9yICh2YXIgX2EgPSAwLCBub2Rlc18xID0gbm9kZXM7IF9hIDwgbm9kZXNfMS5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgdmFyIHYgPSBub2Rlc18xW19hXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2LmluZGV4ID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHN0cm9uZ0Nvbm5lY3Qodik7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRzO1xufVxuZXhwb3J0cy5zdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMgPSBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2liR2x1YTJ4bGJtZDBhSE11YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXVMaTh1TGk5WFpXSkRiMnhoTDNOeVl5OXNhVzVyYkdWdVozUm9jeTUwY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pT3p0QlFWVkpMRzlDUVVGdlFpeERRVUZOTEVWQlFVVXNRMEZCVFR0SlFVTTVRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEV0N4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlF6TkNMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZETTBJc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8wRkJRMnBETEVOQlFVTTdRVUZIUkN3eVFrRkJNa0lzUTBGQlZ5eEZRVUZGTEVOQlFWYzdTVUZETDBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlExWXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnl4RFFVRkRPMWxCUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRGRFUXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVOaUxFTkJRVU03UVVGRlJDeDFRa0ZCTmtJc1MwRkJZU3hGUVVGRkxFVkJRWE5DTzBsQlF6bEVMRWxCUVVrc1ZVRkJWU3hIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU53UWl4SlFVRkpMR0ZCUVdFc1IwRkJSeXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEzSkNMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjc1EwRkJRenRaUVVOeVF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM1pDTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZETVVJc1EwRkJReXhEUVVGRE8wbEJRMFlzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1VVRkRXQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1pFTEdGQlFXRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFSXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU40UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOSUxFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTTdRVUZEZEVJc1EwRkJRenRCUVVkRUxEUkNRVUZyUXl4TFFVRmhMRVZCUVVVc1EwRkJVeXhGUVVGRkxFTkJRVFpDTEVWQlFVVXNSVUZCTkVJN1NVRkRia2dzU1VGQlNTeFZRVUZWTEVkQlFVY3NZVUZCWVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU14UXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFJRVU5ZTEVsQlFVa3NRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRVZCUVVVc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjZReXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOeVF5eERRVUZETEVOQlFVTXNRMEZCUXp0QlFVTlFMRU5CUVVNN1FVRkxSQ3hyUTBGQkswTXNTMEZCWVN4RlFVRkZMRVZCUVRSQ0xFVkJRVVVzUTBGQllUdEpRVUZpTEd0Q1FVRkJMRVZCUVVFc1MwRkJZVHRKUVVOeVJ5eHJRa0ZCYTBJc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eEZRVUZGTEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCY2tRc1EwRkJjVVFzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTjBSeXhEUVVGRE8wRkJSa1FzTkVSQlJVTTdRVUZMUkN3MFFrRkJlVU1zUzBGQllTeEZRVUZGTEVWQlFUUkNMRVZCUVVVc1EwRkJZVHRKUVVGaUxHdENRVUZCTEVWQlFVRXNTMEZCWVR0SlFVTXZSaXhyUWtGQmEwSXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhGUVVGRkxGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdVVUZET1VJc1QwRkJRU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVUUzUnl4RFFVRTJSeXhGUVVNelJ5eEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTmtMRU5CUVVNN1FVRktSQ3huUkVGSlF6dEJRVzlDUkN4NVEwRkJjMFFzUTBGQlV5eEZRVUZGTEV0QlFXRXNSVUZCUlN4SlFVRlpMRVZCUTNoR0xFVkJRWGxDTzBsQlJYcENMRWxCUVVrc1ZVRkJWU3hIUVVGSExESkNRVUV5UWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdTVUZETTBRc1NVRkJTU3hMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyWXNWVUZCVlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlF5eERRVUZETzFGQlEyNUNMRTlCUVVFc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFWb3NRMEZCV1N4RFFVRkRPMGxCUVRWQ0xFTkJRVFJDTEVOQlF5OUNMRU5CUVVNN1NVRkRSaXhKUVVGSkxGZEJRVmNzUjBGQlZTeEZRVUZGTEVOQlFVTTdTVUZETlVJc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEV0N4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTndSQ3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEYWtNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRWaXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETzJkQ1FVTmlMRWxCUVVrc1JVRkJSU3hKUVVGSk8yZENRVU5XTEVsQlFVa3NSVUZCUlN4RlFVRkZPMmRDUVVOU0xFdEJRVXNzUlVGQlJTeEZRVUZGTzJkQ1FVTlVMRWRCUVVjc1JVRkJSU3hGUVVGRkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRemxDTEVOQlFVTXNRMEZCUXp0UlFVTlFMRU5CUVVNN1NVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5JTEUxQlFVMHNRMEZCUXl4WFFVRlhMRU5CUVVNN1FVRkRka0lzUTBGQlF6dEJRWFJDUkN3d1JVRnpRa003UVVGUlJDeHhRMEZCYTBRc1YwRkJiVUlzUlVGQlJTeExRVUZoTEVWQlFVVXNSVUZCYzBJN1NVRkRlRWNzU1VGQlNTeExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJZc1NVRkJTU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEyUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRMllzU1VGQlNTeFZRVUZWTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTNCQ0xIVkNRVUYxUWl4RFFVRkRPMUZCUlhCQ0xFTkJRVU1zUTBGQlF5eExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF6dFJRVU01UWl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyUXNRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGSGFrSXNSMEZCUnl4RFFVRkRMRU5CUVZVc1ZVRkJTeXhGUVVGTUxFdEJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCVEN4alFVRkxMRVZCUVV3c1NVRkJTenRaUVVGa0xFbEJRVWtzUTBGQlF5eFRRVUZCTzFsQlEwNHNSVUZCUlN4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUzBGQlN5eExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJSV3BETEdGQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFrSXNRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFsQlF5OURMRU5CUVVNN1dVRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlJXNUNMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTTNReXhEUVVGRE8xTkJRMG83VVVGSFJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUlhoQ0xFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVTnVRaXhQUVVGUExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRiRUlzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRuUWtGRGFFSXNRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhMUVVGTExFTkJRVU03WjBKQlJXeENMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJ4Q0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN2IwSkJRVU1zUzBGQlN5eERRVUZETzFsQlEzWkNMRU5CUVVNN1dVRkZSQ3hWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRktMRU5CUVVrc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE9VTXNRMEZCUXp0SlFVTk1MRU5CUVVNN1NVRkRSQ3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGZEJRVmNzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMUZCUTI1RExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeEZRVUZGTEVWQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRExFTkJRVU03U1VGRFJDeEhRVUZITEVOQlFVTXNRMEZCVlN4VlFVRkxMRVZCUVV3c1pVRkJTeXhGUVVGTUxHMUNRVUZMTEVWQlFVd3NTVUZCU3p0UlFVRmtMRWxCUVVrc1EwRkJReXhqUVVGQk8xRkJRMDRzU1VGQlNTeEhRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETDBJc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFTXNSMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEYWtJN1NVRkRSQ3hIUVVGSExFTkJRVU1zUTBGQlZTeFZRVUZMTEVWQlFVd3NaVUZCU3l4RlFVRk1MRzFDUVVGTExFVkJRVXdzU1VGQlN6dFJRVUZrTEVsQlFVa3NRMEZCUXl4alFVRkJPMUZCUVZjc1JVRkJSU3hEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNTMEZCU3l4TFFVRkxMRmRCUVZjc1EwRkJRenRaUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVRkJPMGxCUXpGRkxFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTTdRVUZEZEVJc1EwRkJRenRCUVdoRVJDeHJSVUZuUkVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3dlckVkZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvd2VyRWRnZShzb3VyY2UsIHRhcmdldCwgdHlwZSkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIHJldHVybiBQb3dlckVkZ2U7XG59KCkpO1xuZXhwb3J0cy5Qb3dlckVkZ2UgPSBQb3dlckVkZ2U7XG52YXIgQ29uZmlndXJhdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uZmlndXJhdGlvbihuLCBlZGdlcywgbGlua0FjY2Vzc29yLCByb290R3JvdXApIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5saW5rQWNjZXNzb3IgPSBsaW5rQWNjZXNzb3I7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgdGhpcy5yb290cyA9IFtdO1xuICAgICAgICBpZiAocm9vdEdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRNb2R1bGVzRnJvbUdyb3VwKHJvb3RHcm91cCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJvb3RzLnB1c2gobmV3IE1vZHVsZVNldCgpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgICAgIHRoaXMucm9vdHNbMF0uYWRkKHRoaXMubW9kdWxlc1tpXSA9IG5ldyBNb2R1bGUoaSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuUiA9IGVkZ2VzLmxlbmd0aDtcbiAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHMgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRTb3VyY2VJbmRleChlKV0sIHQgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRUYXJnZXRJbmRleChlKV0sIHR5cGUgPSBsaW5rQWNjZXNzb3IuZ2V0VHlwZShlKTtcbiAgICAgICAgICAgIHMub3V0Z29pbmcuYWRkKHR5cGUsIHQpO1xuICAgICAgICAgICAgdC5pbmNvbWluZy5hZGQodHlwZSwgcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5pbml0TW9kdWxlc0Zyb21Hcm91cCA9IGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICB2YXIgbW9kdWxlU2V0ID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICB0aGlzLnJvb3RzLnB1c2gobW9kdWxlU2V0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZWF2ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gZ3JvdXAubGVhdmVzW2ldO1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG5ldyBNb2R1bGUobm9kZS5pZCk7XG4gICAgICAgICAgICB0aGlzLm1vZHVsZXNbbm9kZS5pZF0gPSBtb2R1bGU7XG4gICAgICAgICAgICBtb2R1bGVTZXQuYWRkKG1vZHVsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyb3VwLmdyb3Vwcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBncm91cC5ncm91cHMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBncm91cC5ncm91cHNbal07XG4gICAgICAgICAgICAgICAgdmFyIGRlZmluaXRpb24gPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGNoaWxkKVxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCAhPT0gXCJsZWF2ZXNcIiAmJiBwcm9wICE9PSBcImdyb3Vwc1wiICYmIGNoaWxkLmhhc093blByb3BlcnR5KHByb3ApKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbltwcm9wXSA9IGNoaWxkW3Byb3BdO1xuICAgICAgICAgICAgICAgIG1vZHVsZVNldC5hZGQobmV3IE1vZHVsZSgtMSAtIGosIG5ldyBMaW5rU2V0cygpLCBuZXcgTGlua1NldHMoKSwgdGhpcy5pbml0TW9kdWxlc0Zyb21Hcm91cChjaGlsZCksIGRlZmluaXRpb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW9kdWxlU2V0O1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYSwgYiwgaykge1xuICAgICAgICBpZiAoayA9PT0gdm9pZCAwKSB7IGsgPSAwOyB9XG4gICAgICAgIHZhciBpbkludCA9IGEuaW5jb21pbmcuaW50ZXJzZWN0aW9uKGIuaW5jb21pbmcpLCBvdXRJbnQgPSBhLm91dGdvaW5nLmludGVyc2VjdGlvbihiLm91dGdvaW5nKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICBjaGlsZHJlbi5hZGQoYSk7XG4gICAgICAgIGNoaWxkcmVuLmFkZChiKTtcbiAgICAgICAgdmFyIG0gPSBuZXcgTW9kdWxlKHRoaXMubW9kdWxlcy5sZW5ndGgsIG91dEludCwgaW5JbnQsIGNoaWxkcmVuKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzLnB1c2gobSk7XG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAocywgaSwgbykge1xuICAgICAgICAgICAgcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsaW5rdHlwZSkge1xuICAgICAgICAgICAgICAgIG1zLmZvckFsbChmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmxzID0gbltpXTtcbiAgICAgICAgICAgICAgICAgICAgbmxzLmFkZChsaW5rdHlwZSwgbSk7XG4gICAgICAgICAgICAgICAgICAgIG5scy5yZW1vdmUobGlua3R5cGUsIGEpO1xuICAgICAgICAgICAgICAgICAgICBubHMucmVtb3ZlKGxpbmt0eXBlLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgYVtvXS5yZW1vdmUobGlua3R5cGUsIG4pO1xuICAgICAgICAgICAgICAgICAgICBiW29dLnJlbW92ZShsaW5rdHlwZSwgbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBkYXRlKG91dEludCwgXCJpbmNvbWluZ1wiLCBcIm91dGdvaW5nXCIpO1xuICAgICAgICB1cGRhdGUoaW5JbnQsIFwib3V0Z29pbmdcIiwgXCJpbmNvbWluZ1wiKTtcbiAgICAgICAgdGhpcy5SIC09IGluSW50LmNvdW50KCkgKyBvdXRJbnQuY291bnQoKTtcbiAgICAgICAgdGhpcy5yb290c1trXS5yZW1vdmUoYSk7XG4gICAgICAgIHRoaXMucm9vdHNba10ucmVtb3ZlKGIpO1xuICAgICAgICB0aGlzLnJvb3RzW2tdLmFkZChtKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5yb290TWVyZ2VzID0gZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKGsgPT09IHZvaWQgMCkgeyBrID0gMDsgfVxuICAgICAgICB2YXIgcnMgPSB0aGlzLnJvb3RzW2tdLm1vZHVsZXMoKTtcbiAgICAgICAgdmFyIG4gPSBycy5sZW5ndGg7XG4gICAgICAgIHZhciBtZXJnZXMgPSBuZXcgQXJyYXkobiAqIChuIC0gMSkpO1xuICAgICAgICB2YXIgY3RyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlfID0gbiAtIDE7IGkgPCBpXzsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHJzW2ldLCBiID0gcnNbal07XG4gICAgICAgICAgICAgICAgbWVyZ2VzW2N0cl0gPSB7IGlkOiBjdHIsIG5FZGdlczogdGhpcy5uRWRnZXMoYSwgYiksIGE6IGEsIGI6IGIgfTtcbiAgICAgICAgICAgICAgICBjdHIrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVyZ2VzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuZ3JlZWR5TWVyZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yb290cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucm9vdHNbaV0ubW9kdWxlcygpLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgbXMgPSB0aGlzLnJvb3RNZXJnZXMoaSkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5uRWRnZXMgPT0gYi5uRWRnZXMgPyBhLmlkIC0gYi5pZCA6IGEubkVkZ2VzIC0gYi5uRWRnZXM7IH0pO1xuICAgICAgICAgICAgdmFyIG0gPSBtc1swXTtcbiAgICAgICAgICAgIGlmIChtLm5FZGdlcyA+PSB0aGlzLlIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB0aGlzLm1lcmdlKG0uYSwgbS5iLCBpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5uRWRnZXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgaW5JbnQgPSBhLmluY29taW5nLmludGVyc2VjdGlvbihiLmluY29taW5nKSwgb3V0SW50ID0gYS5vdXRnb2luZy5pbnRlcnNlY3Rpb24oYi5vdXRnb2luZyk7XG4gICAgICAgIHJldHVybiB0aGlzLlIgLSBpbkludC5jb3VudCgpIC0gb3V0SW50LmNvdW50KCk7XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5nZXRHcm91cEhpZXJhcmNoeSA9IGZ1bmN0aW9uIChyZXRhcmdldGVkRWRnZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdO1xuICAgICAgICB2YXIgcm9vdCA9IHt9O1xuICAgICAgICB0b0dyb3Vwcyh0aGlzLnJvb3RzWzBdLCByb290LCBncm91cHMpO1xuICAgICAgICB2YXIgZXMgPSB0aGlzLmFsbEVkZ2VzKCk7XG4gICAgICAgIGVzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBhID0gX3RoaXMubW9kdWxlc1tlLnNvdXJjZV07XG4gICAgICAgICAgICB2YXIgYiA9IF90aGlzLm1vZHVsZXNbZS50YXJnZXRdO1xuICAgICAgICAgICAgcmV0YXJnZXRlZEVkZ2VzLnB1c2gobmV3IFBvd2VyRWRnZSh0eXBlb2YgYS5naWQgPT09IFwidW5kZWZpbmVkXCIgPyBlLnNvdXJjZSA6IGdyb3Vwc1thLmdpZF0sIHR5cGVvZiBiLmdpZCA9PT0gXCJ1bmRlZmluZWRcIiA/IGUudGFyZ2V0IDogZ3JvdXBzW2IuZ2lkXSwgZS50eXBlKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuYWxsRWRnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlcyA9IFtdO1xuICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKHRoaXMucm9vdHNbMF0sIGVzKTtcbiAgICAgICAgcmV0dXJuIGVzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyA9IGZ1bmN0aW9uIChtb2R1bGVzLCBlcykge1xuICAgICAgICBtb2R1bGVzLmZvckFsbChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgbS5nZXRFZGdlcyhlcyk7XG4gICAgICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKG0uY2hpbGRyZW4sIGVzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbjtcbn0oKSk7XG5leHBvcnRzLkNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uO1xuZnVuY3Rpb24gdG9Hcm91cHMobW9kdWxlcywgZ3JvdXAsIGdyb3Vwcykge1xuICAgIG1vZHVsZXMuZm9yQWxsKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIGlmIChtLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBpZiAoIWdyb3VwLmxlYXZlcylcbiAgICAgICAgICAgICAgICBncm91cC5sZWF2ZXMgPSBbXTtcbiAgICAgICAgICAgIGdyb3VwLmxlYXZlcy5wdXNoKG0uaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGcgPSBncm91cDtcbiAgICAgICAgICAgIG0uZ2lkID0gZ3JvdXBzLmxlbmd0aDtcbiAgICAgICAgICAgIGlmICghbS5pc0lzbGFuZCgpIHx8IG0uaXNQcmVkZWZpbmVkKCkpIHtcbiAgICAgICAgICAgICAgICBnID0geyBpZDogbS5naWQgfTtcbiAgICAgICAgICAgICAgICBpZiAobS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBtLmRlZmluaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBnW3Byb3BdID0gbS5kZWZpbml0aW9uW3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmICghZ3JvdXAuZ3JvdXBzKVxuICAgICAgICAgICAgICAgICAgICBncm91cC5ncm91cHMgPSBbXTtcbiAgICAgICAgICAgICAgICBncm91cC5ncm91cHMucHVzaChtLmdpZCk7XG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2goZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b0dyb3VwcyhtLmNoaWxkcmVuLCBnLCBncm91cHMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG52YXIgTW9kdWxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGUoaWQsIG91dGdvaW5nLCBpbmNvbWluZywgY2hpbGRyZW4sIGRlZmluaXRpb24pIHtcbiAgICAgICAgaWYgKG91dGdvaW5nID09PSB2b2lkIDApIHsgb3V0Z29pbmcgPSBuZXcgTGlua1NldHMoKTsgfVxuICAgICAgICBpZiAoaW5jb21pbmcgPT09IHZvaWQgMCkgeyBpbmNvbWluZyA9IG5ldyBMaW5rU2V0cygpOyB9XG4gICAgICAgIGlmIChjaGlsZHJlbiA9PT0gdm9pZCAwKSB7IGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpOyB9XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5vdXRnb2luZyA9IG91dGdvaW5nO1xuICAgICAgICB0aGlzLmluY29taW5nID0gaW5jb21pbmc7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gZGVmaW5pdGlvbjtcbiAgICB9XG4gICAgTW9kdWxlLnByb3RvdHlwZS5nZXRFZGdlcyA9IGZ1bmN0aW9uIChlcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm91dGdvaW5nLmZvckFsbChmdW5jdGlvbiAobXMsIGVkZ2V0eXBlKSB7XG4gICAgICAgICAgICBtcy5mb3JBbGwoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIGVzLnB1c2gobmV3IFBvd2VyRWRnZShfdGhpcy5pZCwgdGFyZ2V0LmlkLCBlZGdldHlwZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTW9kdWxlLnByb3RvdHlwZS5pc0xlYWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmNvdW50KCkgPT09IDA7XG4gICAgfTtcbiAgICBNb2R1bGUucHJvdG90eXBlLmlzSXNsYW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRnb2luZy5jb3VudCgpID09PSAwICYmIHRoaXMuaW5jb21pbmcuY291bnQoKSA9PT0gMDtcbiAgICB9O1xuICAgIE1vZHVsZS5wcm90b3R5cGUuaXNQcmVkZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuZGVmaW5pdGlvbiAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgICB9O1xuICAgIHJldHVybiBNb2R1bGU7XG59KCkpO1xuZXhwb3J0cy5Nb2R1bGUgPSBNb2R1bGU7XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24obSwgbikge1xuICAgIHZhciBpID0ge307XG4gICAgZm9yICh2YXIgdiBpbiBtKVxuICAgICAgICBpZiAodiBpbiBuKVxuICAgICAgICAgICAgaVt2XSA9IG1bdl07XG4gICAgcmV0dXJuIGk7XG59XG52YXIgTW9kdWxlU2V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGVTZXQoKSB7XG4gICAgICAgIHRoaXMudGFibGUgPSB7fTtcbiAgICB9XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudGFibGUpLmxlbmd0aDtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTW9kdWxlU2V0KCk7XG4gICAgICAgIHJlc3VsdC50YWJsZSA9IGludGVyc2VjdGlvbih0aGlzLnRhYmxlLCBvdGhlci50YWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmludGVyc2VjdGlvbkNvdW50ID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbihvdGhlcikuY291bnQoKTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkIGluIHRoaXMudGFibGU7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHRoaXMudGFibGVbbS5pZF0gPSBtO1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICBkZWxldGUgdGhpcy50YWJsZVttLmlkXTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuZm9yQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgbWlkIGluIHRoaXMudGFibGUpIHtcbiAgICAgICAgICAgIGYodGhpcy50YWJsZVttaWRdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5tb2R1bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdnMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghbS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICB2cy5wdXNoKG0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZzO1xuICAgIH07XG4gICAgcmV0dXJuIE1vZHVsZVNldDtcbn0oKSk7XG5leHBvcnRzLk1vZHVsZVNldCA9IE1vZHVsZVNldDtcbnZhciBMaW5rU2V0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua1NldHMoKSB7XG4gICAgICAgIHRoaXMuc2V0cyA9IHt9O1xuICAgICAgICB0aGlzLm4gPSAwO1xuICAgIH1cbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm47XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZvckFsbE1vZHVsZXMoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0ICYmIG0uaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAobGlua3R5cGUsIG0pIHtcbiAgICAgICAgdmFyIHMgPSBsaW5rdHlwZSBpbiB0aGlzLnNldHMgPyB0aGlzLnNldHNbbGlua3R5cGVdIDogdGhpcy5zZXRzW2xpbmt0eXBlXSA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgcy5hZGQobSk7XG4gICAgICAgICsrdGhpcy5uO1xuICAgIH07XG4gICAgTGlua1NldHMucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChsaW5rdHlwZSwgbSkge1xuICAgICAgICB2YXIgbXMgPSB0aGlzLnNldHNbbGlua3R5cGVdO1xuICAgICAgICBtcy5yZW1vdmUobSk7XG4gICAgICAgIGlmIChtcy5jb3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zZXRzW2xpbmt0eXBlXTtcbiAgICAgICAgfVxuICAgICAgICAtLXRoaXMubjtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGwgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsaW5rdHlwZSBpbiB0aGlzLnNldHMpIHtcbiAgICAgICAgICAgIGYodGhpcy5zZXRzW2xpbmt0eXBlXSwgTnVtYmVyKGxpbmt0eXBlKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGxNb2R1bGVzID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsdCkgeyByZXR1cm4gbXMuZm9yQWxsKGYpOyB9KTtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBMaW5rU2V0cygpO1xuICAgICAgICB0aGlzLmZvckFsbChmdW5jdGlvbiAobXMsIGx0KSB7XG4gICAgICAgICAgICBpZiAobHQgaW4gb3RoZXIuc2V0cykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gbXMuaW50ZXJzZWN0aW9uKG90aGVyLnNldHNbbHRdKSwgbiA9IGkuY291bnQoKTtcbiAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldHNbbHRdID0gaTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm4gKz0gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIExpbmtTZXRzO1xufSgpKTtcbmV4cG9ydHMuTGlua1NldHMgPSBMaW5rU2V0cztcbmZ1bmN0aW9uIGludGVyc2VjdGlvbkNvdW50KG0sIG4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW50ZXJzZWN0aW9uKG0sIG4pKS5sZW5ndGg7XG59XG5mdW5jdGlvbiBnZXRHcm91cHMobm9kZXMsIGxpbmtzLCBsYSwgcm9vdEdyb3VwKSB7XG4gICAgdmFyIG4gPSBub2Rlcy5sZW5ndGgsIGMgPSBuZXcgQ29uZmlndXJhdGlvbihuLCBsaW5rcywgbGEsIHJvb3RHcm91cCk7XG4gICAgd2hpbGUgKGMuZ3JlZWR5TWVyZ2UoKSlcbiAgICAgICAgO1xuICAgIHZhciBwb3dlckVkZ2VzID0gW107XG4gICAgdmFyIGcgPSBjLmdldEdyb3VwSGllcmFyY2h5KHBvd2VyRWRnZXMpO1xuICAgIHBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlbmQpIHtcbiAgICAgICAgICAgIHZhciBnID0gZVtlbmRdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnID09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgZVtlbmRdID0gbm9kZXNbZ107XG4gICAgICAgIH07XG4gICAgICAgIGYoXCJzb3VyY2VcIik7XG4gICAgICAgIGYoXCJ0YXJnZXRcIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgZ3JvdXBzOiBnLCBwb3dlckVkZ2VzOiBwb3dlckVkZ2VzIH07XG59XG5leHBvcnRzLmdldEdyb3VwcyA9IGdldEdyb3Vwcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNHOTNaWEpuY21Gd2FDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDNCdmQyVnlaM0poY0dndWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZQU1R0SlFVTkpMRzFDUVVOWExFMUJRVmNzUlVGRFdDeE5RVUZYTEVWQlExZ3NTVUZCV1R0UlFVWmFMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRVXM3VVVGRFdDeFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRkxPMUZCUTFnc1UwRkJTU3hIUVVGS0xFbEJRVWtzUTBGQlVUdEpRVUZKTEVOQlFVTTdTVUZEYUVNc1owSkJRVU03UVVGQlJDeERRVUZETEVGQlRFUXNTVUZMUXp0QlFVeFpMRGhDUVVGVE8wRkJUM1JDTzBsQlUwa3NkVUpCUVZrc1EwRkJVeXhGUVVGRkxFdEJRV0VzUlVGQlZTeFpRVUZ2UXl4RlFVRkZMRk5CUVdsQ08xRkJRWEpITEdsQ1FXdENRenRSUVd4Q05rTXNhVUpCUVZrc1IwRkJXaXhaUVVGWkxFTkJRWGRDTzFGQlF6bEZMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRhRUlzUlVGQlJTeERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOYUxFbEJRVWtzUTBGQlF5eHZRa0ZCYjBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFJRVU42UXl4RFFVRkRPMUZCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRFNpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGTkJRVk1zUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEYWtNc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzJkQ1FVTjBRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBRc1EwRkJRenRSUVVORUxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVOMFFpeExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRaUVVOWUxFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTm9SQ3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEVMRWxCUVVrc1IwRkJSeXhaUVVGWkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1RExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEVUN4RFFVRkRPMGxCUlU4c05FTkJRVzlDTEVkQlFUVkNMRlZCUVRaQ0xFdEJRVXM3VVVGRE9VSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1NVRkJTU3hUUVVGVExFVkJRVVVzUTBGQlF6dFJRVU5vUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE0wTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXpRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGFrTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRPMWxCUXk5Q0xGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRNVUlzUTBGQlF6dFJRVU5FTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyWXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVNelF5eEpRVUZKTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVVTFRaXhKUVVGSkxGVkJRVlVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdaMEpCUTNCQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRXRCUVVzc1EwRkJRenR2UWtGRGJrSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExGRkJRVkVzU1VGQlNTeEpRVUZKTEV0QlFVc3NVVUZCVVN4SlFVRkpMRXRCUVVzc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdkMEpCUTNKRkxGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03WjBKQlJYWkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzVVVGQlVTeEZRVUZGTEVWQlFVVXNTVUZCU1N4UlFVRlJMRVZCUVVVc1JVRkJSU3hKUVVGSkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnNTQ3hEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNN1NVRkRjRUlzUTBGQlF6dEpRVWRHTERaQ1FVRkxMRWRCUVV3c1ZVRkJUU3hEUVVGVExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFXRTdVVUZCWWl4clFrRkJRU3hGUVVGQkxFdEJRV0U3VVVGRGNrTXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVNelF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUTJwRUxFbEJRVWtzVVVGQlVTeEhRVUZITEVsQlFVa3NVMEZCVXl4RlFVRkZMRU5CUVVNN1VVRkRMMElzVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOb1FpeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1JVRkJSU3hMUVVGTExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVVUZEYWtVc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja0lzU1VGQlNTeE5RVUZOTEVkQlFVY3NWVUZCUXl4RFFVRlhMRVZCUVVVc1EwRkJVeXhGUVVGRkxFTkJRVk03V1VGRE0wTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFVkJRVVVzUlVGQlJTeFJRVUZSTzJkQ1FVTnNRaXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXp0dlFrRkRVQ3hKUVVGSkxFZEJRVWNzUjBGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRM3BDTEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTnlRaXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGVFSXNSMEZCUnl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlJTeERRVUZETEUxQlFVMHNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlF6RkNMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU42UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOUUxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExQXNRMEZCUXl4RFFVRkRPMUZCUTBZc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeFZRVUZWTEVWQlFVVXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRka01zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4VlFVRlZMRVZCUVVVc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRGRFTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUzBGQlN5eEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8xRkJRM3BETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNoQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzaENMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSVThzYTBOQlFWVXNSMEZCYkVJc1ZVRkJiVUlzUTBGQllUdFJRVUZpTEd0Q1FVRkJMRVZCUVVFc1MwRkJZVHRSUVUwMVFpeEpRVUZKTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPMUZCUTJwRExFbEJRVWtzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRUlzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTFvc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFpRVU4wUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0blFrRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM3BDTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUlVGQlJTeEhRVUZITEVWQlFVVXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVOcVJTeEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVTldMRU5CUVVNN1VVRkRUQ3hEUVVGRE8xRkJRMFFzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJSVVFzYlVOQlFWY3NSMEZCV0R0UlFVTkpMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVWNlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlFVTXNVVUZCVVN4RFFVRkRPMWxCUjJwRUxFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRWGhFTEVOQlFYZEVMRU5CUVVNc1EwRkJRenRaUVVOeVJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRFpDeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUVVNc1VVRkJVU3hEUVVGRE8xbEJRMnBETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hDTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkRhRUlzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZGVHl3NFFrRkJUU3hIUVVGa0xGVkJRV1VzUTBGQlV5eEZRVUZGTEVOQlFWTTdVVUZETDBJc1NVRkJTU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEZRVU16UXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMnBFTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03U1VGRGJrUXNRMEZCUXp0SlFVVkVMSGxEUVVGcFFpeEhRVUZxUWl4VlFVRnJRaXhsUVVFMFFqdFJRVUU1UXl4cFFrRmxRenRSUVdSSExFbEJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTm9RaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEWkN4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03VVVGRGRFTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETzFGQlEzcENMRVZCUVVVc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlExSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRMMElzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdXVUZETDBJc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEZOQlFWTXNRMEZET1VJc1QwRkJUeXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGRGRrUXNUMEZCVHl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkRka1FzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZEVkN4RFFVRkRMRU5CUVVNN1VVRkRVQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRkRiRUlzUTBGQlF6dEpRVVZFTEdkRFFVRlJMRWRCUVZJN1VVRkRTU3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEV2l4aFFVRmhMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRE1VTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1EwRkJRenRKUVVOa0xFTkJRVU03U1VGRlRTeHpRa0ZCVVN4SFFVRm1MRlZCUVdkQ0xFOUJRV3RDTEVWQlFVVXNSVUZCWlR0UlFVTXZReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXp0WlFVTmFMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEWml4aFFVRmhMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRNME1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEVUN4RFFVRkRPMGxCUTB3c2IwSkJRVU03UVVGQlJDeERRVUZETEVGQmVFcEVMRWxCZDBwRE8wRkJlRXBaTEhORFFVRmhPMEZCTUVveFFpeHJRa0ZCYTBJc1QwRkJhMElzUlVGQlJTeExRVUZMTEVWQlFVVXNUVUZCVFR0SlFVTXZReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXp0UlFVTmFMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRZaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNN1owSkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN1dVRkRja01zUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzFGQlF6VkNMRU5CUVVNN1VVRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU5LTEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJRenRaUVVOa0xFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOMFFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNXVUZCV1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU53UXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOc1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1dVRkJXU3hGUVVGRkxFTkJRVU03YjBKQlJXcENMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNN2QwSkJRekZDTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOeVF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03YjBKQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlEzSkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGRGVrSXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4RFFVRkRPMWxCUTBRc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8xRkJRM0JETEVOQlFVTTdTVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVOUUxFTkJRVU03UVVGRlJEdEpRVWRKTEdkQ1FVTlhMRVZCUVZVc1JVRkRWaXhSUVVGdFF5eEZRVU51UXl4UlFVRnRReXhGUVVOdVF5eFJRVUZ4UXl4RlFVTnlReXhWUVVGblFqdFJRVWhvUWl4NVFrRkJRU3hGUVVGQkxHVkJRWGxDTEZGQlFWRXNSVUZCUlR0UlFVTnVReXg1UWtGQlFTeEZRVUZCTEdWQlFYbENMRkZCUVZFc1JVRkJSVHRSUVVOdVF5eDVRa0ZCUVN4RlFVRkJMR1ZCUVRCQ0xGTkJRVk1zUlVGQlJUdFJRVWh5UXl4UFFVRkZMRWRCUVVZc1JVRkJSU3hEUVVGUk8xRkJRMVlzWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTWtJN1VVRkRia01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTWtJN1VVRkRia01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTmtJN1VVRkRja01zWlVGQlZTeEhRVUZXTEZWQlFWVXNRMEZCVFR0SlFVRkpMRU5CUVVNN1NVRkZhRU1zZVVKQlFWRXNSMEZCVWl4VlFVRlRMRVZCUVdVN1VVRkJlRUlzYVVKQlRVTTdVVUZNUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZETEVWQlFVVXNSVUZCUlN4UlFVRlJPMWxCUXpsQ0xFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4TlFVRk5PMmRDUVVOYUxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VFFVRlRMRU5CUVVNc1MwRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRVQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGUkN4MVFrRkJUU3hIUVVGT08xRkJRMGtzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBsQlEzWkRMRU5CUVVNN1NVRkZSQ3g1UWtGQlVTeEhRVUZTTzFGQlEwa3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMGxCUTNSRkxFTkJRVU03U1VGRlJDdzJRa0ZCV1N4SFFVRmFPMUZCUTBrc1RVRkJUU3hEUVVGRExFOUJRVThzU1VGQlNTeERRVUZETEZWQlFWVXNTMEZCU3l4WFFVRlhMRU5CUVVNN1NVRkRiRVFzUTBGQlF6dEpRVU5NTEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCTjBKRUxFbEJOa0pETzBGQk4wSlpMSGRDUVVGTk8wRkJLMEp1UWl4elFrRkJjMElzUTBGQlRTeEZRVUZGTEVOQlFVMDdTVUZEYUVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlExZ3NSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU5pTEVOQlFVTTdRVUZGUkR0SlFVRkJPMUZCUTBrc1ZVRkJTeXhIUVVGUkxFVkJRVVVzUTBGQlF6dEpRV3REY0VJc1EwRkJRenRKUVdwRFJ5eDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dEpRVU14UXl4RFFVRkRPMGxCUTBRc1owTkJRVmtzUjBGQldpeFZRVUZoTEV0QlFXZENPMUZCUTNwQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVsQlFVa3NVMEZCVXl4RlFVRkZMRU5CUVVNN1VVRkROMElzVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1VVRkRja1FzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJRMFFzY1VOQlFXbENMRWRCUVdwQ0xGVkJRV3RDTEV0QlFXZENPMUZCUXpsQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzBsQlF6VkRMRU5CUVVNN1NVRkRSQ3cwUWtGQlVTeEhRVUZTTEZWQlFWTXNSVUZCVlR0UlFVTm1MRTFCUVUwc1EwRkJReXhGUVVGRkxFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0SlFVTTFRaXhEUVVGRE8wbEJRMFFzZFVKQlFVY3NSMEZCU0N4VlFVRkpMRU5CUVZNN1VVRkRWQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRGVrSXNRMEZCUXp0SlFVTkVMREJDUVVGTkxFZEJRVTRzVlVGQlR5eERRVUZUTzFGQlExb3NUMEZCVHl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTTFRaXhEUVVGRE8wbEJRMFFzTUVKQlFVMHNSMEZCVGl4VlFVRlBMRU5CUVhOQ08xRkJRM3BDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRrSXNRMEZCUXp0SlFVTk1MRU5CUVVNN1NVRkRSQ3d5UWtGQlR5eEhRVUZRTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMW9zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRWQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4WlFVRlpMRVZCUVVVc1EwRkJRenRuUWtGRGJFSXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTTdTVUZEWkN4RFFVRkRPMGxCUTB3c1owSkJRVU03UVVGQlJDeERRVUZETEVGQmJrTkVMRWxCYlVORE8wRkJia05aTERoQ1FVRlRPMEZCY1VOMFFqdEpRVUZCTzFGQlEwa3NVMEZCU1N4SFFVRlJMRVZCUVVVc1EwRkJRenRSUVVObUxFMUJRVU1zUjBGQlZ5eERRVUZETEVOQlFVTTdTVUZuUkd4Q0xFTkJRVU03U1VFdlEwY3NkMEpCUVVzc1IwRkJURHRSUVVOSkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJ4Q0xFTkJRVU03U1VGRFJDd3lRa0ZCVVN4SFFVRlNMRlZCUVZNc1JVRkJWVHRSUVVObUxFbEJRVWtzVFVGQlRTeEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTnVRaXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEZWQlFVRXNRMEZCUXp0WlFVTm9RaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNoQ0xFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTTdXVUZEYkVJc1EwRkJRenRSUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEwZ3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQlEwUXNjMEpCUVVjc1IwRkJTQ3hWUVVGSkxGRkJRV2RDTEVWQlFVVXNRMEZCVXp0UlFVTXpRaXhKUVVGSkxFTkJRVU1zUjBGQll5eFJRVUZSTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhKUVVGSkxGTkJRVk1zUlVGQlJTeERRVUZETzFGQlEzWkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEVkN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFlpeERRVUZETzBsQlEwUXNlVUpCUVUwc1IwRkJUaXhWUVVGUExGRkJRV2RDTEVWQlFVVXNRMEZCVXp0UlFVTTVRaXhKUVVGSkxFVkJRVVVzUjBGQll5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRM2hETEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFlpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhQUVVGUExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRMMElzUTBGQlF6dFJRVU5FTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRFJDeDVRa0ZCVFN4SFFVRk9MRlZCUVU4c1EwRkJORU03VVVGREwwTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hSUVVGUkxFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkROMElzUTBGQlF5eERRVUZaTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRlRVFzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZEUkN4blEwRkJZU3hIUVVGaUxGVkJRV01zUTBGQmMwSTdVVUZEYUVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRWxCUVVzc1QwRkJRU3hGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRmFMRU5CUVZrc1EwRkJReXhEUVVGRE8wbEJRekZETEVOQlFVTTdTVUZEUkN3clFrRkJXU3hIUVVGYUxGVkJRV0VzUzBGQlpUdFJRVU40UWl4SlFVRkpMRTFCUVUwc1IwRkJZU3hKUVVGSkxGRkJRVkVzUlVGQlJTeERRVUZETzFGQlEzUkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlR0WlFVTm1MRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGJrSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExGbEJRVmtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRMjVETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03WjBKQlEyeENMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOU0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU53UWl4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dG5Ra0ZEYkVJc1EwRkJRenRaUVVOTUxFTkJRVU03VVVGRFRDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVTk1MR1ZCUVVNN1FVRkJSQ3hEUVVGRExFRkJiRVJFTEVsQmEwUkRPMEZCYkVSWkxEUkNRVUZSTzBGQmIwUnlRaXd5UWtGQk1rSXNRMEZCVFN4RlFVRkZMRU5CUVUwN1NVRkRja01zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRVHRCUVVOcVJDeERRVUZETzBGQlJVUXNiVUpCUVdkRExFdEJRVmtzUlVGQlJTeExRVUZoTEVWQlFVVXNSVUZCTUVJc1JVRkJSU3hUUVVGcFFqdEpRVU4wUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVU5vUWl4RFFVRkRMRWRCUVVjc1NVRkJTU3hoUVVGaExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NSVUZCUlN4RlFVRkZMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03U1VGRGJrUXNUMEZCVHl4RFFVRkRMRU5CUVVNc1YwRkJWeXhGUVVGRk8xRkJRVU1zUTBGQlF6dEpRVU40UWl4SlFVRkpMRlZCUVZVc1IwRkJaMElzUlVGQlJTeERRVUZETzBsQlEycERMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dEpRVU40UXl4VlFVRlZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVlVzUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhWUVVGRExFZEJRVWM3V1VGRFVpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFppeEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hSUVVGUkxFTkJRVU03WjBKQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hEUVVGRExFTkJRVU03VVVGRFJpeERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRXaXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdTVUZEYUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeE5RVUZOTEVOQlFVTXNSVUZCUlN4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxGVkJRVlVzUlVGQlJTeFZRVUZWTEVWQlFVVXNRMEZCUXp0QlFVTnFSQ3hEUVVGRE8wRkJaa1FzT0VKQlpVTWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUGFpcmluZ0hlYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBhaXJpbmdIZWFwKGVsZW0pIHtcbiAgICAgICAgdGhpcy5lbGVtID0gZWxlbTtcbiAgICAgICAgdGhpcy5zdWJoZWFwcyA9IFtdO1xuICAgIH1cbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHN0ciA9IFwiXCIsIG5lZWRDb21tYSA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3ViaGVhcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzdWJoZWFwID0gdGhpcy5zdWJoZWFwc1tpXTtcbiAgICAgICAgICAgIGlmICghc3ViaGVhcC5lbGVtKSB7XG4gICAgICAgICAgICAgICAgbmVlZENvbW1hID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVlZENvbW1hKSB7XG4gICAgICAgICAgICAgICAgc3RyID0gc3RyICsgXCIsXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHIgPSBzdHIgKyBzdWJoZWFwLnRvU3RyaW5nKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIG5lZWRDb21tYSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0ciAhPT0gXCJcIikge1xuICAgICAgICAgICAgc3RyID0gXCIoXCIgKyBzdHIgKyBcIilcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHRoaXMuZWxlbSA/IHNlbGVjdG9yKHRoaXMuZWxlbSkgOiBcIlwiKSArIHN0cjtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIGYodGhpcy5lbGVtLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuc3ViaGVhcHMuZm9yRWFjaChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5mb3JFYWNoKGYpOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbXB0eSgpID8gMCA6IDEgKyB0aGlzLnN1YmhlYXBzLnJlZHVjZShmdW5jdGlvbiAobiwgaCkge1xuICAgICAgICAgICAgcmV0dXJuIG4gKyBoLmNvdW50KCk7XG4gICAgICAgIH0sIDApO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLm1pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSA9PSBudWxsO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGgpIHtcbiAgICAgICAgaWYgKHRoaXMgPT09IGgpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YmhlYXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdWJoZWFwc1tpXS5jb250YWlucyhoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuaXNIZWFwID0gZnVuY3Rpb24gKGxlc3NUaGFuKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLnN1YmhlYXBzLmV2ZXJ5KGZ1bmN0aW9uIChoKSB7IHJldHVybiBsZXNzVGhhbihfdGhpcy5lbGVtLCBoLmVsZW0pICYmIGguaXNIZWFwKGxlc3NUaGFuKTsgfSk7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKG9iaiwgbGVzc1RoYW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWVyZ2UobmV3IFBhaXJpbmdIZWFwKG9iaiksIGxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uIChoZWFwMiwgbGVzc1RoYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSlcbiAgICAgICAgICAgIHJldHVybiBoZWFwMjtcbiAgICAgICAgZWxzZSBpZiAoaGVhcDIuZW1wdHkoKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBlbHNlIGlmIChsZXNzVGhhbih0aGlzLmVsZW0sIGhlYXAyLmVsZW0pKSB7XG4gICAgICAgICAgICB0aGlzLnN1YmhlYXBzLnB1c2goaGVhcDIpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBoZWFwMi5zdWJoZWFwcy5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAyO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUucmVtb3ZlTWluID0gZnVuY3Rpb24gKGxlc3NUaGFuKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVyZ2VQYWlycyhsZXNzVGhhbik7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUubWVyZ2VQYWlycyA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICBpZiAodGhpcy5zdWJoZWFwcy5sZW5ndGggPT0gMClcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFpcmluZ0hlYXAobnVsbCk7XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3ViaGVhcHMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YmhlYXBzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGZpcnN0UGFpciA9IHRoaXMuc3ViaGVhcHMucG9wKCkubWVyZ2UodGhpcy5zdWJoZWFwcy5wb3AoKSwgbGVzc1RoYW4pO1xuICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IHRoaXMubWVyZ2VQYWlycyhsZXNzVGhhbik7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RQYWlyLm1lcmdlKHJlbWFpbmluZywgbGVzc1RoYW4pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZGVjcmVhc2VLZXkgPSBmdW5jdGlvbiAoc3ViaGVhcCwgbmV3VmFsdWUsIHNldEhlYXBOb2RlLCBsZXNzVGhhbikge1xuICAgICAgICB2YXIgbmV3SGVhcCA9IHN1YmhlYXAucmVtb3ZlTWluKGxlc3NUaGFuKTtcbiAgICAgICAgc3ViaGVhcC5lbGVtID0gbmV3SGVhcC5lbGVtO1xuICAgICAgICBzdWJoZWFwLnN1YmhlYXBzID0gbmV3SGVhcC5zdWJoZWFwcztcbiAgICAgICAgaWYgKHNldEhlYXBOb2RlICE9PSBudWxsICYmIG5ld0hlYXAuZWxlbSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0SGVhcE5vZGUoc3ViaGVhcC5lbGVtLCBzdWJoZWFwKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFpcmluZ05vZGUgPSBuZXcgUGFpcmluZ0hlYXAobmV3VmFsdWUpO1xuICAgICAgICBpZiAoc2V0SGVhcE5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEhlYXBOb2RlKG5ld1ZhbHVlLCBwYWlyaW5nTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubWVyZ2UocGFpcmluZ05vZGUsIGxlc3NUaGFuKTtcbiAgICB9O1xuICAgIHJldHVybiBQYWlyaW5nSGVhcDtcbn0oKSk7XG5leHBvcnRzLlBhaXJpbmdIZWFwID0gUGFpcmluZ0hlYXA7XG52YXIgUHJpb3JpdHlRdWV1ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJpb3JpdHlRdWV1ZShsZXNzVGhhbikge1xuICAgICAgICB0aGlzLmxlc3NUaGFuID0gbGVzc1RoYW47XG4gICAgfVxuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnRvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5lbGVtO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFpcmluZ05vZGU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBhcmc7IGFyZyA9IGFyZ3NbaV07ICsraSkge1xuICAgICAgICAgICAgcGFpcmluZ05vZGUgPSBuZXcgUGFpcmluZ0hlYXAoYXJnKTtcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IHRoaXMuZW1wdHkoKSA/XG4gICAgICAgICAgICAgICAgcGFpcmluZ05vZGUgOiB0aGlzLnJvb3QubWVyZ2UocGFpcmluZ05vZGUsIHRoaXMubGVzc1RoYW4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYWlyaW5nTm9kZTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmVtcHR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMucm9vdCB8fCAhdGhpcy5yb290LmVsZW07XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5pc0hlYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuaXNIZWFwKHRoaXMubGVzc1RoYW4pO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMucm9vdC5mb3JFYWNoKGYpO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqID0gdGhpcy5yb290Lm1pbigpO1xuICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLnJvb3QucmVtb3ZlTWluKHRoaXMubGVzc1RoYW4pO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUucmVkdWNlS2V5ID0gZnVuY3Rpb24gKGhlYXBOb2RlLCBuZXdLZXksIHNldEhlYXBOb2RlKSB7XG4gICAgICAgIGlmIChzZXRIZWFwTm9kZSA9PT0gdm9pZCAwKSB7IHNldEhlYXBOb2RlID0gbnVsbDsgfVxuICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLnJvb3QuZGVjcmVhc2VLZXkoaGVhcE5vZGUsIG5ld0tleSwgc2V0SGVhcE5vZGUsIHRoaXMubGVzc1RoYW4pO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC50b1N0cmluZyhzZWxlY3Rvcik7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jb3VudCgpO1xuICAgIH07XG4gICAgcmV0dXJuIFByaW9yaXR5UXVldWU7XG59KCkpO1xuZXhwb3J0cy5Qcmlvcml0eVF1ZXVlID0gUHJpb3JpdHlRdWV1ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNIRjFaWFZsTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZjSEYxWlhWbExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUTBFN1NVRkpTU3h4UWtGQmJVSXNTVUZCVHp0UlFVRlFMRk5CUVVrc1IwRkJTaXhKUVVGSkxFTkJRVWM3VVVGRGRFSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGRrSXNRMEZCUXp0SlFVVk5MRGhDUVVGUkxFZEJRV1lzVlVGQlowSXNVVUZCVVR0UlFVTndRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEZRVUZGTEVWQlFVVXNVMEZCVXl4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVOb1F5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETlVNc1NVRkJTU3hQUVVGUExFZEJRVzFDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGREwwTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRhRUlzVTBGQlV5eEhRVUZITEV0QlFVc3NRMEZCUXp0blFrRkRiRUlzVVVGQlVTeERRVUZETzFsQlEySXNRMEZCUXp0WlFVTkVMRVZCUVVVc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTFvc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTTdXVUZEY0VJc1EwRkJRenRaUVVORUxFZEJRVWNzUjBGQlJ5eEhRVUZITEVkQlFVY3NUMEZCVHl4RFFVRkRMRkZCUVZFc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFpRVU4yUXl4VFFVRlRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRM0pDTEVOQlFVTTdVVUZEUkN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTmlMRWRCUVVjc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXp0UlFVTXhRaXhEUVVGRE8xRkJRMFFzVFVGQlRTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMGxCUTNoRUxFTkJRVU03U1VGRlRTdzJRa0ZCVHl4SFFVRmtMRlZCUVdVc1EwRkJRenRSUVVOYUxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5vUWl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVZvc1EwRkJXU3hEUVVGRExFTkJRVU03VVVGRE4wTXNRMEZCUXp0SlFVTk1MRU5CUVVNN1NVRkZUU3d5UWtGQlN5eEhRVUZhTzFGQlEwa3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhEUVVGVExFVkJRVVVzUTBGQmFVSTdXVUZETlVVc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1VVRkRla0lzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTFZc1EwRkJRenRKUVVWTkxIbENRVUZITEVkQlFWWTdVVUZEU1N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU55UWl4RFFVRkRPMGxCUlUwc01rSkJRVXNzUjBGQldqdFJRVU5KTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF6dEpRVU0zUWl4RFFVRkRPMGxCUlUwc09FSkJRVkVzUjBGQlppeFZRVUZuUWl4RFFVRnBRanRSUVVNM1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRE8xbEJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXp0UlFVTTFRaXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRE5VTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRSUVVOc1JDeERRVUZETzFGQlEwUXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVOcVFpeERRVUZETzBsQlJVMHNORUpCUVUwc1IwRkJZaXhWUVVGakxGRkJRV2xETzFGQlFTOURMR2xDUVVWRE8xRkJSRWNzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNVVUZCVVN4RFFVRkRMRXRCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFXcEVMRU5CUVdsRUxFTkJRVU1zUTBGQlF6dEpRVU4wUml4RFFVRkRPMGxCUlUwc05FSkJRVTBzUjBGQllpeFZRVUZqTEVkQlFVOHNSVUZCUlN4UlFVRlJPMUZCUXpOQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1YwRkJWeXhEUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUTNwRUxFTkJRVU03U1VGRlRTd3lRa0ZCU3l4SFFVRmFMRlZCUVdFc1MwRkJjVUlzUlVGQlJTeFJRVUZSTzFGQlEzaERMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0WlFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU03VVVGREwwSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0WlFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU03VVVGRGNFTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRNVUlzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXp0UlFVTm9RaXhEUVVGRE8xRkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEU2l4TFFVRkxMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTXhRaXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETzFGQlEycENMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJSVTBzSzBKQlFWTXNSMEZCYUVJc1ZVRkJhVUlzVVVGQmFVTTdVVUZET1VNc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMWxCUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF6dFJRVU01UWl4SlFVRkpPMWxCUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRkRNVU1zUTBGQlF6dEpRVVZOTEdkRFFVRlZMRWRCUVdwQ0xGVkJRV3RDTEZGQlFXbERPMUZCUXk5RExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU12UkN4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlFVTXNRMEZCUXp0UlFVTm9SU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU5HTEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1dVRkRla1VzU1VGQlNTeFRRVUZUTEVkQlFVY3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFpRVU14UXl4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eFRRVUZUTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRhRVFzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZEVFN4cFEwRkJWeXhIUVVGc1FpeFZRVUZ0UWl4UFFVRjFRaXhGUVVGRkxGRkJRVmNzUlVGQlJTeFhRVUUwUXl4RlFVRkZMRkZCUVdsRE8xRkJRM0JKTEVsQlFVa3NUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZGTVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpWQ0xFOUJRVThzUTBGQlF5eFJRVUZSTEVkQlFVY3NUMEZCVHl4RFFVRkRMRkZCUVZFc1EwRkJRenRSUVVOd1F5eEZRVUZGTEVOQlFVTXNRMEZCUXl4WFFVRlhMRXRCUVVzc1NVRkJTU3hKUVVGSkxFOUJRVThzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOb1JDeFhRVUZYTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRPMUZCUTBRc1NVRkJTU3hYUVVGWExFZEJRVWNzU1VGQlNTeFhRVUZYTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVU1zUlVGQlJTeERRVUZETEVOQlFVTXNWMEZCVnl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRrSXNWMEZCVnl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRPMUZCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNWMEZCVnl4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8wbEJRemRETEVOQlFVTTdTVUZEVEN4clFrRkJRenRCUVVGRUxFTkJRVU1zUVVGNlIwUXNTVUY1UjBNN1FVRjZSMWtzYTBOQlFWYzdRVUU0UjNoQ08wbEJSVWtzZFVKQlFXOUNMRkZCUVdsRE8xRkJRV3BETEdGQlFWRXNSMEZCVWl4UlFVRlJMRU5CUVhsQ08wbEJRVWtzUTBGQlF6dEpRVXR1UkN3eVFrRkJSeXhIUVVGV08xRkJRMGtzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkJReXhEUVVGRE8xRkJRMnhETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUzAwc05FSkJRVWtzUjBGQldEdFJRVUZaTEdOQlFWazdZVUZCV2l4VlFVRlpMRVZCUVZvc2NVSkJRVmtzUlVGQldpeEpRVUZaTzFsQlFWb3NlVUpCUVZrN08xRkJRM0JDTEVsQlFVa3NWMEZCVnl4RFFVRkRPMUZCUTJoQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEhRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEzQkRMRmRCUVZjc1IwRkJSeXhKUVVGSkxGZEJRVmNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTnVReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVU4wUWl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRmRCUVZjc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZEYkVVc1EwRkJRenRSUVVORUxFMUJRVTBzUTBGQlF5eFhRVUZYTEVOQlFVTTdTVUZEZGtJc1EwRkJRenRKUVV0TkxEWkNRVUZMTEVkQlFWbzdVVUZEU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGVrTXNRMEZCUXp0SlFVdE5MRGhDUVVGTkxFZEJRV0k3VVVGRFNTeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUXpORExFTkJRVU03U1VGTFRTd3JRa0ZCVHl4SFFVRmtMRlZCUVdVc1EwRkJRenRSUVVOYUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM3BDTEVOQlFVTTdTVUZKVFN3eVFrRkJSeXhIUVVGV08xRkJRMGtzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5tTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkRhRUlzUTBGQlF6dFJRVU5FTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETVVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZETDBNc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF6dEpRVU5tTEVOQlFVTTdTVUZKVFN4cFEwRkJVeXhIUVVGb1FpeFZRVUZwUWl4UlFVRjNRaXhGUVVGRkxFMUJRVk1zUlVGQlJTeFhRVUZ0UkR0UlFVRnVSQ3cwUWtGQlFTeEZRVUZCTEd0Q1FVRnRSRHRSUVVOeVJ5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZGQlFWRXNSVUZCUlN4TlFVRk5MRVZCUVVVc1YwRkJWeXhGUVVGRkxFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0SlFVTndSaXhEUVVGRE8wbEJRMDBzWjBOQlFWRXNSMEZCWml4VlFVRm5RaXhSUVVGUk8xRkJRM0JDTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0SlFVTjRReXhEUVVGRE8wbEJTMDBzTmtKQlFVc3NSMEZCV2p0UlFVTkpMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGRFRDeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRSVVFzU1VGM1JVTTdRVUY0UlZrc2MwTkJRV0VpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgVHJlZUJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRyZWVCYXNlKCkge1xuICAgICAgICB0aGlzLmZpbmRJdGVyID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLml0ZXJhdG9yKCk7XG4gICAgICAgICAgICB3aGlsZSAocmVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2gocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgd2hpbGUgKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmxvd2VyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgdGhpcy5fY29tcGFyYXRvcik7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLnVwcGVyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgICAgICAgZnVuY3Rpb24gcmV2ZXJzZV9jbXAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGNtcChiLCBhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgcmV2ZXJzZV9jbXApO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAocmVzLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHJlcy5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzID0gcmVzLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuaXRlcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IodGhpcyk7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgdmFyIGl0ID0gdGhpcy5pdGVyYXRvcigpLCBkYXRhO1xuICAgICAgICB3aGlsZSAoKGRhdGEgPSBpdC5uZXh0KCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjYihkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5yZWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgaXQgPSB0aGlzLml0ZXJhdG9yKCksIGRhdGE7XG4gICAgICAgIHdoaWxlICgoZGF0YSA9IGl0LnByZXYoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNiKGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLl9ib3VuZCA9IGZ1bmN0aW9uIChkYXRhLCBjbXApIHtcbiAgICAgICAgdmFyIGN1ciA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuICAgICAgICB3aGlsZSAoY3VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgY3VyLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSBjdXI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMucHVzaChjdXIpO1xuICAgICAgICAgICAgY3VyID0gY3VyLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgY3VyID0gaXRlci5fYW5jZXN0b3JzW2ldO1xuICAgICAgICAgICAgaWYgKGNtcChkYXRhLCBjdXIuZGF0YSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gY3VyO1xuICAgICAgICAgICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSAwO1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9O1xuICAgIDtcbiAgICByZXR1cm4gVHJlZUJhc2U7XG59KCkpO1xuZXhwb3J0cy5UcmVlQmFzZSA9IFRyZWVCYXNlO1xudmFyIEl0ZXJhdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJdGVyYXRvcih0cmVlKSB7XG4gICAgICAgIHRoaXMuX3RyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICB9XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByb290ID0gdGhpcy5fdHJlZS5fcm9vdDtcbiAgICAgICAgICAgIGlmIChyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWluTm9kZShyb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2F2ZTtcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmUgPSB0aGlzLl9jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9hbmNlc3RvcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHRoaXMuX2N1cnNvci5yaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnNvciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICAgICAgaWYgKHJvb3QgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnNvci5sZWZ0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBzYXZlID0gdGhpcy5fY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5jZXN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gdGhpcy5fYW5jZXN0b3JzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5fY3Vyc29yLmxlZnQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHRoaXMuX2N1cnNvci5sZWZ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fY3Vyc29yICE9PSBudWxsID8gdGhpcy5fY3Vyc29yLmRhdGEgOiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWluTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWF4Tm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQucmlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3Vyc29yID0gc3RhcnQ7XG4gICAgfTtcbiAgICA7XG4gICAgcmV0dXJuIEl0ZXJhdG9yO1xufSgpKTtcbmV4cG9ydHMuSXRlcmF0b3IgPSBJdGVyYXRvcjtcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5yaWdodCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgTm9kZS5wcm90b3R5cGUuZ2V0X2NoaWxkID0gZnVuY3Rpb24gKGRpcikge1xuICAgICAgICByZXR1cm4gZGlyID8gdGhpcy5yaWdodCA6IHRoaXMubGVmdDtcbiAgICB9O1xuICAgIDtcbiAgICBOb2RlLnByb3RvdHlwZS5zZXRfY2hpbGQgPSBmdW5jdGlvbiAoZGlyLCB2YWwpIHtcbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgICAgdGhpcy5yaWdodCA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBSQlRyZWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSQlRyZWUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUkJUcmVlKGNvbXBhcmF0b3IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX3Jvb3QgPSBudWxsO1xuICAgICAgICBfdGhpcy5fY29tcGFyYXRvciA9IGNvbXBhcmF0b3I7XG4gICAgICAgIF90aGlzLnNpemUgPSAwO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJCVHJlZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdCA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgdmFyIGRpciA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBncCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgZ2dwID0gaGVhZDtcbiAgICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgICAgICAgICAgIGdncC5yaWdodCA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgTm9kZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcC5zZXRfY2hpbGQoZGlyLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaXplKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFJCVHJlZS5pc19yZWQobm9kZS5sZWZ0KSAmJiBSQlRyZWUuaXNfcmVkKG5vZGUucmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJpZ2h0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChub2RlKSAmJiBSQlRyZWUuaXNfcmVkKHApKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXIyID0gZ2dwLnJpZ2h0ID09PSBncDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHAuZ2V0X2NoaWxkKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKGdwLCAhbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2dwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuZG91YmxlX3JvdGF0ZShncCwgIWxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcihub2RlLmRhdGEsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChjbXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3QgPSBkaXI7XG4gICAgICAgICAgICAgICAgZGlyID0gY21wIDwgMDtcbiAgICAgICAgICAgICAgICBpZiAoZ3AgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2dwID0gZ3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdwID0gcDtcbiAgICAgICAgICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoZWFkID0gbmV3IE5vZGUodW5kZWZpbmVkKTtcbiAgICAgICAgdmFyIG5vZGUgPSBoZWFkO1xuICAgICAgICBub2RlLnJpZ2h0ID0gdGhpcy5fcm9vdDtcbiAgICAgICAgdmFyIHAgPSBudWxsO1xuICAgICAgICB2YXIgZ3AgPSBudWxsO1xuICAgICAgICB2YXIgZm91bmQgPSBudWxsO1xuICAgICAgICB2YXIgZGlyID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKG5vZGUuZ2V0X2NoaWxkKGRpcikgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZGlyO1xuICAgICAgICAgICAgZ3AgPSBwO1xuICAgICAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIG5vZGUuZGF0YSk7XG4gICAgICAgICAgICBkaXIgPSBjbXAgPiAwO1xuICAgICAgICAgICAgaWYgKGNtcCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghUkJUcmVlLmlzX3JlZChub2RlKSAmJiAhUkJUcmVlLmlzX3JlZChub2RlLmdldF9jaGlsZChkaXIpKSkge1xuICAgICAgICAgICAgICAgIGlmIChSQlRyZWUuaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKCFkaXIpKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3IgPSBSQlRyZWUuc2luZ2xlX3JvdGF0ZShub2RlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICBwLnNldF9jaGlsZChsYXN0LCBzcik7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBzcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIVJCVHJlZS5pc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaWJsaW5nID0gcC5nZXRfY2hpbGQoIWxhc3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKCFsYXN0KSkgJiYgIVJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQobGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpcjIgPSBncC5yaWdodCA9PT0gcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZChsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5kb3VibGVfcm90YXRlKHAsIGxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZCghbGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuc2luZ2xlX3JvdGF0ZShwLCBsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBncGMgPSBncC5nZXRfY2hpbGQoZGlyMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5yaWdodC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvdW5kLmRhdGEgPSBub2RlLmRhdGE7XG4gICAgICAgICAgICBwLnNldF9jaGlsZChwLnJpZ2h0ID09PSBub2RlLCBub2RlLmdldF9jaGlsZChub2RlLmxlZnQgPT09IG51bGwpKTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZS0tO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fcm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm91bmQgIT09IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLmlzX3JlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlICE9PSBudWxsICYmIG5vZGUucmVkO1xuICAgIH07XG4gICAgUkJUcmVlLnNpbmdsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHZhciBzYXZlID0gcm9vdC5nZXRfY2hpbGQoIWRpcik7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIHNhdmUuZ2V0X2NoaWxkKGRpcikpO1xuICAgICAgICBzYXZlLnNldF9jaGlsZChkaXIsIHJvb3QpO1xuICAgICAgICByb290LnJlZCA9IHRydWU7XG4gICAgICAgIHNhdmUucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBzYXZlO1xuICAgIH07XG4gICAgUkJUcmVlLmRvdWJsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKHJvb3QuZ2V0X2NoaWxkKCFkaXIpLCAhZGlyKSk7XG4gICAgICAgIHJldHVybiBSQlRyZWUuc2luZ2xlX3JvdGF0ZShyb290LCBkaXIpO1xuICAgIH07XG4gICAgcmV0dXJuIFJCVHJlZTtcbn0oVHJlZUJhc2UpKTtcbmV4cG9ydHMuUkJUcmVlID0gUkJUcmVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pY21KMGNtVmxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNtSjBjbVZsTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3pzN096dEJRWFZDU1R0SlFVRkJPMUZCTkVKSkxHRkJRVkVzUjBGQlJ5eFZRVUZWTEVsQlFVazdXVUZEY2tJc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTnlRaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkZNMElzVDBGQlR5eEhRVUZITEV0QlFVc3NTVUZCU1N4RlFVRkZMRU5CUVVNN1owSkJRMnhDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRuUWtGRGVrTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTFZc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eEhRVUZITEVOQlFVTTdiMEpCUTI1Q0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTJoQ0xFTkJRVU03WjBKQlEwUXNTVUZCU1N4RFFVRkRMRU5CUVVNN2IwSkJRMFlzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03YjBKQlF6RkNMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGREwwSXNRMEZCUXp0WlFVTk1MRU5CUVVNN1dVRkZSQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzFGQlEyaENMRU5CUVVNc1EwRkJRenRKUVN0R1RpeERRVUZETzBsQmRrbEhMSGRDUVVGTExFZEJRVXc3VVVGRFNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSFZDUVVGSkxFZEJRVW9zVlVGQlN5eEpRVUZKTzFGQlEwd3NTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVVZ5UWl4UFFVRlBMRWRCUVVjc1MwRkJTeXhKUVVGSkxFVkJRVVVzUTBGQlF6dFpRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRGVrTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTFZc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTTdXVUZEY0VJc1EwRkJRenRaUVVORUxFbEJRVWtzUTBGQlF5eERRVUZETzJkQ1FVTkdMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNdlFpeERRVUZETzFGQlEwd3NRMEZCUXp0UlFVVkVMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRjFRa1lzTmtKQlFWVXNSMEZCVml4VlFVRlhMRWxCUVVrN1VVRkRXQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETzBsQlF5OURMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSMFlzTmtKQlFWVXNSMEZCVml4VlFVRlhMRWxCUVVrN1VVRkRXQ3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRPMUZCUlROQ0xIRkNRVUZ4UWl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVOeVFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4RFFVRkRPMUZCUlVRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RlFVRkZMRmRCUVZjc1EwRkJReXhEUVVGRE8wbEJRekZETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUjBZc2MwSkJRVWNzUjBGQlNEdFJRVU5KTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGNrSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEWml4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8xRkJRMmhDTEVOQlFVTTdVVUZGUkN4UFFVRlBMRWRCUVVjc1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTEVOQlFVTTdXVUZEZGtJc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTTdVVUZEYmtJc1EwRkJRenRSUVVWRUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGQlFTeERRVUZETzBsQlIwWXNjMEpCUVVjc1IwRkJTRHRSUVVOSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRja0lzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRFppeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFTkJRVU03VVVGRlJDeFBRVUZQTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzc1NVRkJTU3hGUVVGRkxFTkJRVU03V1VGRGVFSXNSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGNFSXNRMEZCUXp0UlFVVkVMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJTVVlzTWtKQlFWRXNSMEZCVWp0UlFVTkpMRTFCUVUwc1EwRkJReXhKUVVGSkxGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0SlFVTTVRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWRHTEhWQ1FVRkpMRWRCUVVvc1ZVRkJTeXhGUVVGRk8xRkJRMGdzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSU3hGUVVGRkxFbEJRVWtzUTBGQlF6dFJRVU12UWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4TFFVRkxMRWxCUVVrc1JVRkJSU3hEUVVGRE8xbEJRMnBETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOaUxFTkJRVU03U1VGRFRDeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSGRDUVVGTExFZEJRVXdzVlVGQlRTeEZRVUZGTzFGQlEwb3NTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUlVGQlJTeEZRVUZGTEVsQlFVa3NRMEZCUXp0UlFVTXZRaXhQUVVGUExFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhMUVVGTExFbEJRVWtzUlVGQlJTeERRVUZETzFsQlEycERMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU5pTEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xIbENRVUZOTEVkQlFVNHNWVUZCVHl4SlFVRkpMRVZCUVVVc1IwRkJSenRSUVVOYUxFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRja0lzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJSVE5DTEU5QlFVOHNSMEZCUnl4TFFVRkxMRWxCUVVrc1JVRkJSU3hEUVVGRE8xbEJRMnhDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVONlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEVml4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFZEJRVWNzUTBGQlF6dG5Ra0ZEYmtJc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF6dFpRVU5vUWl4RFFVRkRPMWxCUTBRc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRNVUlzUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF5OUNMRU5CUVVNN1VVRkZSQ3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyNUVMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRekZDTEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1IwRkJSeXhEUVVGRE8yZENRVU51UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUXpOQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdXVUZEYUVJc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRlJDeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRE0wSXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVTk9MR1ZCUVVNN1FVRkJSQ3hEUVVGRExFRkJOVWxFTEVsQk5FbERPMEZCTlVsWkxEUkNRVUZSTzBGQk5rbHlRanRKUVVsSkxHdENRVUZaTEVsQlFVazdVVUZEV2l4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU55UWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU40UWl4RFFVRkRPMGxCUlVRc2RVSkJRVWtzUjBGQlNqdFJRVU5KTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0SlFVTTFSQ3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWxHTEhWQ1FVRkpMRWRCUVVvN1VVRkRTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFSXNTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZETlVJc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMmhDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRGVFSXNRMEZCUXp0UlFVTk1MRU5CUVVNN1VVRkRSQ3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU5HTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJSemxDTEVsQlFVa3NTVUZCU1N4RFFVRkRPMmRDUVVOVUxFZEJRVWNzUTBGQlF6dHZRa0ZEUVN4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dHZRa0ZEY0VJc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU42UWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN2IwSkJRM3BETEVOQlFVTTdiMEpCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU03ZDBKQlEwWXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU03ZDBKQlEzQkNMRXRCUVVzc1EwRkJRenR2UWtGRFZpeERRVUZETzJkQ1FVTk1MRU5CUVVNc1VVRkJVU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRNVU1zUTBGQlF6dFpRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVWR0xFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dG5Ra0ZEYmtNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xbEJRM1JETEVOQlFVTTdVVUZEVEN4RFFVRkRPMUZCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRelZFTEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCU1VZc2RVSkJRVWtzUjBGQlNqdFJRVU5KTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjRRaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJRenRaUVVNMVFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEYUVJc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjRRaXhEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTBZc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETjBJc1NVRkJTU3hKUVVGSkxFTkJRVU03WjBKQlExUXNSMEZCUnl4RFFVRkRPMjlDUVVOQkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMjlDUVVOd1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdkMEpCUTNwQ0xFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dHZRa0ZEZWtNc1EwRkJRenR2UWtGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXp0M1FrRkRSaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXp0M1FrRkRjRUlzUzBGQlN5eERRVUZETzI5Q1FVTldMRU5CUVVNN1owSkJRMHdzUTBGQlF5eFJRVUZSTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU42UXl4RFFVRkRPMWxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU03WjBKQlEwWXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMmRDUVVOdVF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEY2tNc1EwRkJRenRSUVVOTUxFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1MwRkJTeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZETlVRc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpd3lRa0ZCVVN4SFFVRlNMRlZCUVZNc1MwRkJTenRSUVVOV0xFOUJRVThzUzBGQlN5eERRVUZETEVsQlFVa3NTMEZCU3l4SlFVRkpMRVZCUVVVc1EwRkJRenRaUVVONlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU0xUWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF6dFJRVU4yUWl4RFFVRkRPMUZCUTBRc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpd3lRa0ZCVVN4SFFVRlNMRlZCUVZNc1MwRkJTenRSUVVOV0xFOUJRVThzUzBGQlN5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRVZCUVVVc1EwRkJRenRaUVVNeFFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU0xUWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU40UWl4RFFVRkRPMUZCUTBRc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRFRpeGxRVUZETzBGQlFVUXNRMEZCUXl4QlFUbEdSQ3hKUVRoR1F6dEJRVGxHV1N3MFFrRkJVVHRCUVdkSGNrSTdTVUZMU1N4alFVRlpMRWxCUVVrN1VVRkRXaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTndRaXhEUVVGRE8wbEJSVVFzZDBKQlFWTXNSMEZCVkN4VlFVRlZMRWRCUVVjN1VVRkRWQ3hOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGQlFTeERRVUZETzBsQlJVWXNkMEpCUVZNc1IwRkJWQ3hWUVVGVkxFZEJRVWNzUlVGQlJTeEhRVUZITzFGQlEyUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5PTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1IwRkJSeXhEUVVGRE8xRkJRM0pDTEVOQlFVTTdVVUZEUkN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOR0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRPMUZCUTNCQ0xFTkJRVU03U1VGRFRDeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVTk9MRmRCUVVNN1FVRkJSQ3hEUVVGRExFRkJlRUpFTEVsQmQwSkRPMEZCUlVRN1NVRkJLMElzTUVKQlFWRTdTVUZMYmtNc1owSkJRVmtzVlVGQmEwTTdVVUZCT1VNc1dVRkRTU3hwUWtGQlR5eFRRVWxXTzFGQlNFY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGJFSXNTMEZCU1N4RFFVRkRMRmRCUVZjc1IwRkJSeXhWUVVGVkxFTkJRVU03VVVGRE9VSXNTMEZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU03TzBsQlEyeENMRU5CUVVNN1NVRkhSQ3gxUWtGQlRTeEhRVUZPTEZWQlFVOHNTVUZCU1R0UlFVTlFMRWxCUVVrc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVVZvUWl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkZkRUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU0xUWl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRMWdzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMUZCUTJoQ0xFTkJRVU03VVVGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTkdMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUlM5Q0xFbEJRVWtzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXp0WlFVTm9RaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZIYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETzFsQlEyUXNTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRMllzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRPMWxCUTJJc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTjBRaXhIUVVGSExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1dVRkhka0lzVDBGQlR5eEpRVUZKTEVWQlFVVXNRMEZCUXp0blFrRkRWaXhGUVVGRkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRmFFSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzI5Q1FVTjBRaXhEUVVGRExFTkJRVU1zVTBGQlV5eERRVUZETEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenR2UWtGRGRrSXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRFdDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1owSkJRMmhDTEVOQlFVTTdaMEpCUTBRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkZOMFFzU1VGQlNTeERRVUZETEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRMmhDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF6dHZRa0ZEZEVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRPMmRDUVVNelFpeERRVUZETzJkQ1FVZEVMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRekZETEVsQlFVa3NTVUZCU1N4SFFVRkhMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXNzUlVGQlJTeERRVUZETzI5Q1FVVTFRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdkMEpCUXpkQ0xFZEJRVWNzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RlFVRkZMRTFCUVUwc1EwRkJReXhoUVVGaExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGVrUXNRMEZCUXp0dlFrRkRSQ3hKUVVGSkxFTkJRVU1zUTBGQlF6dDNRa0ZEUml4SFFVRkhMRU5CUVVNc1UwRkJVeXhEUVVGRExFbEJRVWtzUlVGQlJTeE5RVUZOTEVOQlFVTXNZVUZCWVN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTNwRUxFTkJRVU03WjBKQlEwd3NRMEZCUXp0blFrRkZSQ3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUnpWRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5hTEV0QlFVc3NRMEZCUXp0blFrRkRWaXhEUVVGRE8yZENRVVZFTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNN1owSkJRMWdzUjBGQlJ5eEhRVUZITEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJSMlFzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyUXNSMEZCUnl4SFFVRkhMRVZCUVVVc1EwRkJRenRuUWtGRFlpeERRVUZETzJkQ1FVTkVMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlExQXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRuUWtGRFZDeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU12UWl4RFFVRkRPMWxCUjBRc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCUXpWQ0xFTkJRVU03VVVGSFJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRmRrSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJRenRKUVVObUxFTkJRVU03U1VGQlFTeERRVUZETzBsQlIwWXNkVUpCUVUwc1IwRkJUaXhWUVVGUExFbEJRVWs3VVVGRFVDeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZEVJc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU5xUWl4RFFVRkRPMUZCUlVRc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1VVRkRMMElzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRZaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTTdVVUZEWkN4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGFrSXNTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJSV1lzVDBGQlR5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFbEJRVWtzUlVGQlJTeERRVUZETzFsQlEyeERMRWxCUVVrc1NVRkJTU3hIUVVGSExFZEJRVWNzUTBGQlF6dFpRVWRtTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRVQ3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFsQlExUXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZGTTBJc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlJUVkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETzFsQlIyUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTFvc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5xUWl4RFFVRkRPMWxCUjBRc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNNVJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEZEVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU03YjBKQlEzcERMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zU1VGQlNTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVOMFFpeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOWUxFTkJRVU03WjBKQlEwUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRelZETEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0dlFrRkRha01zUlVGQlJTeERRVUZETEVOQlFVTXNUMEZCVHl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03ZDBKQlEyNUNMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6czBRa0ZGZEVZc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdORUpCUTJRc1QwRkJUeXhEUVVGRExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdORUpCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPM2RDUVVOd1FpeERRVUZETzNkQ1FVTkVMRWxCUVVrc1EwRkJReXhEUVVGRE96UkNRVU5HTEVsQlFVa3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJReXhMUVVGTExFdEJRVXNzUTBGQlF5eERRVUZET3pSQ1FVVXhRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owTkJRM3BETEVWQlFVVXNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFMUJRVTBzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03TkVKQlEzUkVMRU5CUVVNN05FSkJRMFFzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkRFFVTXZReXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPelJDUVVOMFJDeERRVUZET3pSQ1FVZEVMRWxCUVVrc1IwRkJSeXhIUVVGSExFVkJRVVVzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN05FSkJRemRDTEVkQlFVY3NRMEZCUXl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE96UkNRVU5tTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE96UkNRVU5vUWl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdORUpCUTNKQ0xFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4SFFVRkhMRXRCUVVzc1EwRkJRenQzUWtGRE1VSXNRMEZCUXp0dlFrRkRUQ3hEUVVGRE8yZENRVU5NTEVOQlFVTTdXVUZEVEN4RFFVRkRPMUZCUTB3c1EwRkJRenRSUVVkRUxFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMnBDTEV0QlFVc3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dFpRVU4yUWl4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEV0QlFVc3NTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMnhGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOb1FpeERRVUZETzFGQlIwUXNTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFGQlEzaENMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOMFFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRE0wSXNRMEZCUXp0UlFVVkVMRTFCUVUwc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeERRVUZETzBsQlF6RkNMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSVXNzWVVGQlRTeEhRVUZpTEZWQlFXTXNTVUZCU1R0UlFVTmtMRTFCUVUwc1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNN1NVRkRja01zUTBGQlF6dEpRVVZOTEc5Q1FVRmhMRWRCUVhCQ0xGVkJRWEZDTEVsQlFVa3NSVUZCUlN4SFFVRkhPMUZCUXpGQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVVZvUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVVXhRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVVnFRaXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRkZUU3h2UWtGQllTeEhRVUZ3UWl4VlFVRnhRaXhKUVVGSkxFVkJRVVVzUjBGQlJ6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEUxQlFVMHNRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUlN4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRNME1zUTBGQlF6dEpRVU5NTEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCY2sxRUxFTkJRU3RDTEZGQlFWRXNSMEZ4VFhSRE8wRkJjazFaTEhkQ1FVRk5JbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2cHNjXzEgPSByZXF1aXJlKFwiLi92cHNjXCIpO1xudmFyIHJidHJlZV8xID0gcmVxdWlyZShcIi4vcmJ0cmVlXCIpO1xuZnVuY3Rpb24gY29tcHV0ZUdyb3VwQm91bmRzKGcpIHtcbiAgICBnLmJvdW5kcyA9IHR5cGVvZiBnLmxlYXZlcyAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgIGcubGVhdmVzLnJlZHVjZShmdW5jdGlvbiAociwgYykgeyByZXR1cm4gYy5ib3VuZHMudW5pb24ocik7IH0sIFJlY3RhbmdsZS5lbXB0eSgpKSA6XG4gICAgICAgIFJlY3RhbmdsZS5lbXB0eSgpO1xuICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgIGcuYm91bmRzID0gZy5ncm91cHMucmVkdWNlKGZ1bmN0aW9uIChyLCBjKSB7IHJldHVybiBjb21wdXRlR3JvdXBCb3VuZHMoYykudW5pb24ocik7IH0sIGcuYm91bmRzKTtcbiAgICBnLmJvdW5kcyA9IGcuYm91bmRzLmluZmxhdGUoZy5wYWRkaW5nKTtcbiAgICByZXR1cm4gZy5ib3VuZHM7XG59XG5leHBvcnRzLmNvbXB1dGVHcm91cEJvdW5kcyA9IGNvbXB1dGVHcm91cEJvdW5kcztcbnZhciBSZWN0YW5nbGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlY3RhbmdsZSh4LCBYLCB5LCBZKSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuWCA9IFg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuWSA9IFk7XG4gICAgfVxuICAgIFJlY3RhbmdsZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBSZWN0YW5nbGUoTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZKTsgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmN4ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMueCArIHRoaXMuWCkgLyAyOyB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuY3kgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy55ICsgdGhpcy5ZKSAvIDI7IH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5vdmVybGFwWCA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHZhciB1eCA9IHRoaXMuY3goKSwgdnggPSByLmN4KCk7XG4gICAgICAgIGlmICh1eCA8PSB2eCAmJiByLnggPCB0aGlzLlgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5YIC0gci54O1xuICAgICAgICBpZiAodnggPD0gdXggJiYgdGhpcy54IDwgci5YKVxuICAgICAgICAgICAgcmV0dXJuIHIuWCAtIHRoaXMueDtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLm92ZXJsYXBZID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgdmFyIHV5ID0gdGhpcy5jeSgpLCB2eSA9IHIuY3koKTtcbiAgICAgICAgaWYgKHV5IDw9IHZ5ICYmIHIueSA8IHRoaXMuWSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlkgLSByLnk7XG4gICAgICAgIGlmICh2eSA8PSB1eSAmJiB0aGlzLnkgPCByLlkpXG4gICAgICAgICAgICByZXR1cm4gci5ZIC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuc2V0WENlbnRyZSA9IGZ1bmN0aW9uIChjeCkge1xuICAgICAgICB2YXIgZHggPSBjeCAtIHRoaXMuY3goKTtcbiAgICAgICAgdGhpcy54ICs9IGR4O1xuICAgICAgICB0aGlzLlggKz0gZHg7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnNldFlDZW50cmUgPSBmdW5jdGlvbiAoY3kpIHtcbiAgICAgICAgdmFyIGR5ID0gY3kgLSB0aGlzLmN5KCk7XG4gICAgICAgIHRoaXMueSArPSBkeTtcbiAgICAgICAgdGhpcy5ZICs9IGR5O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWCAtIHRoaXMueDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuaGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ZIC0gdGhpcy55O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKE1hdGgubWluKHRoaXMueCwgci54KSwgTWF0aC5tYXgodGhpcy5YLCByLlgpLCBNYXRoLm1pbih0aGlzLnksIHIueSksIE1hdGgubWF4KHRoaXMuWSwgci5ZKSk7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmxpbmVJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHZhciBzaWRlcyA9IFtbdGhpcy54LCB0aGlzLnksIHRoaXMuWCwgdGhpcy55XSxcbiAgICAgICAgICAgIFt0aGlzLlgsIHRoaXMueSwgdGhpcy5YLCB0aGlzLlldLFxuICAgICAgICAgICAgW3RoaXMuWCwgdGhpcy5ZLCB0aGlzLngsIHRoaXMuWV0sXG4gICAgICAgICAgICBbdGhpcy54LCB0aGlzLlksIHRoaXMueCwgdGhpcy55XV07XG4gICAgICAgIHZhciBpbnRlcnNlY3Rpb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgciA9IFJlY3RhbmdsZS5saW5lSW50ZXJzZWN0aW9uKHgxLCB5MSwgeDIsIHkyLCBzaWRlc1tpXVswXSwgc2lkZXNbaV1bMV0sIHNpZGVzW2ldWzJdLCBzaWRlc1tpXVszXSk7XG4gICAgICAgICAgICBpZiAociAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICBpbnRlcnNlY3Rpb25zLnB1c2goeyB4OiByLngsIHk6IHIueSB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW50ZXJzZWN0aW9ucztcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUucmF5SW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHgyLCB5Mikge1xuICAgICAgICB2YXIgaW50cyA9IHRoaXMubGluZUludGVyc2VjdGlvbnModGhpcy5jeCgpLCB0aGlzLmN5KCksIHgyLCB5Mik7XG4gICAgICAgIHJldHVybiBpbnRzLmxlbmd0aCA+IDAgPyBpbnRzWzBdIDogbnVsbDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUudmVydGljZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IHg6IHRoaXMueCwgeTogdGhpcy55IH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMuWCwgeTogdGhpcy55IH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMuWCwgeTogdGhpcy5ZIH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMueCwgeTogdGhpcy5ZIH1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5saW5lSW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkge1xuICAgICAgICB2YXIgZHgxMiA9IHgyIC0geDEsIGR4MzQgPSB4NCAtIHgzLCBkeTEyID0geTIgLSB5MSwgZHkzNCA9IHk0IC0geTMsIGRlbm9taW5hdG9yID0gZHkzNCAqIGR4MTIgLSBkeDM0ICogZHkxMjtcbiAgICAgICAgaWYgKGRlbm9taW5hdG9yID09IDApXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGR4MzEgPSB4MSAtIHgzLCBkeTMxID0geTEgLSB5MywgbnVtYSA9IGR4MzQgKiBkeTMxIC0gZHkzNCAqIGR4MzEsIGEgPSBudW1hIC8gZGVub21pbmF0b3IsIG51bWIgPSBkeDEyICogZHkzMSAtIGR5MTIgKiBkeDMxLCBiID0gbnVtYiAvIGRlbm9taW5hdG9yO1xuICAgICAgICBpZiAoYSA+PSAwICYmIGEgPD0gMSAmJiBiID49IDAgJiYgYiA8PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHgxICsgYSAqIGR4MTIsXG4gICAgICAgICAgICAgICAgeTogeTEgKyBhICogZHkxMlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuaW5mbGF0ZSA9IGZ1bmN0aW9uIChwYWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUodGhpcy54IC0gcGFkLCB0aGlzLlggKyBwYWQsIHRoaXMueSAtIHBhZCwgdGhpcy5ZICsgcGFkKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWN0YW5nbGU7XG59KCkpO1xuZXhwb3J0cy5SZWN0YW5nbGUgPSBSZWN0YW5nbGU7XG5mdW5jdGlvbiBtYWtlRWRnZUJldHdlZW4oc291cmNlLCB0YXJnZXQsIGFoKSB7XG4gICAgdmFyIHNpID0gc291cmNlLnJheUludGVyc2VjdGlvbih0YXJnZXQuY3goKSwgdGFyZ2V0LmN5KCkpIHx8IHsgeDogc291cmNlLmN4KCksIHk6IHNvdXJjZS5jeSgpIH0sIHRpID0gdGFyZ2V0LnJheUludGVyc2VjdGlvbihzb3VyY2UuY3goKSwgc291cmNlLmN5KCkpIHx8IHsgeDogdGFyZ2V0LmN4KCksIHk6IHRhcmdldC5jeSgpIH0sIGR4ID0gdGkueCAtIHNpLngsIGR5ID0gdGkueSAtIHNpLnksIGwgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpLCBhbCA9IGwgLSBhaDtcbiAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2VJbnRlcnNlY3Rpb246IHNpLFxuICAgICAgICB0YXJnZXRJbnRlcnNlY3Rpb246IHRpLFxuICAgICAgICBhcnJvd1N0YXJ0OiB7IHg6IHNpLnggKyBhbCAqIGR4IC8gbCwgeTogc2kueSArIGFsICogZHkgLyBsIH1cbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlRWRnZUJldHdlZW4gPSBtYWtlRWRnZUJldHdlZW47XG5mdW5jdGlvbiBtYWtlRWRnZVRvKHMsIHRhcmdldCwgYWgpIHtcbiAgICB2YXIgdGkgPSB0YXJnZXQucmF5SW50ZXJzZWN0aW9uKHMueCwgcy55KTtcbiAgICBpZiAoIXRpKVxuICAgICAgICB0aSA9IHsgeDogdGFyZ2V0LmN4KCksIHk6IHRhcmdldC5jeSgpIH07XG4gICAgdmFyIGR4ID0gdGkueCAtIHMueCwgZHkgPSB0aS55IC0gcy55LCBsID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICByZXR1cm4geyB4OiB0aS54IC0gYWggKiBkeCAvIGwsIHk6IHRpLnkgLSBhaCAqIGR5IC8gbCB9O1xufVxuZXhwb3J0cy5tYWtlRWRnZVRvID0gbWFrZUVkZ2VUbztcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKHYsIHIsIHBvcykge1xuICAgICAgICB0aGlzLnYgPSB2O1xuICAgICAgICB0aGlzLnIgPSByO1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICAgICAgdGhpcy5wcmV2ID0gbWFrZVJCVHJlZSgpO1xuICAgICAgICB0aGlzLm5leHQgPSBtYWtlUkJUcmVlKCk7XG4gICAgfVxuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBFdmVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnQoaXNPcGVuLCB2LCBwb3MpIHtcbiAgICAgICAgdGhpcy5pc09wZW4gPSBpc09wZW47XG4gICAgICAgIHRoaXMudiA9IHY7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgIH1cbiAgICByZXR1cm4gRXZlbnQ7XG59KCkpO1xuZnVuY3Rpb24gY29tcGFyZUV2ZW50cyhhLCBiKSB7XG4gICAgaWYgKGEucG9zID4gYi5wb3MpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChhLnBvcyA8IGIucG9zKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKGEuaXNPcGVuKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKGIuaXNPcGVuKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIG1ha2VSQlRyZWUoKSB7XG4gICAgcmV0dXJuIG5ldyByYnRyZWVfMS5SQlRyZWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3M7IH0pO1xufVxudmFyIHhSZWN0ID0ge1xuICAgIGdldENlbnRyZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuY3goKTsgfSxcbiAgICBnZXRPcGVuOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci55OyB9LFxuICAgIGdldENsb3NlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5ZOyB9LFxuICAgIGdldFNpemU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLndpZHRoKCk7IH0sXG4gICAgbWFrZVJlY3Q6IGZ1bmN0aW9uIChvcGVuLCBjbG9zZSwgY2VudGVyLCBzaXplKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKGNlbnRlciAtIHNpemUgLyAyLCBjZW50ZXIgKyBzaXplIC8gMiwgb3BlbiwgY2xvc2UpOyB9LFxuICAgIGZpbmROZWlnaGJvdXJzOiBmaW5kWE5laWdoYm91cnNcbn07XG52YXIgeVJlY3QgPSB7XG4gICAgZ2V0Q2VudHJlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5jeSgpOyB9LFxuICAgIGdldE9wZW46IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLng7IH0sXG4gICAgZ2V0Q2xvc2U6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLlg7IH0sXG4gICAgZ2V0U2l6ZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuaGVpZ2h0KCk7IH0sXG4gICAgbWFrZVJlY3Q6IGZ1bmN0aW9uIChvcGVuLCBjbG9zZSwgY2VudGVyLCBzaXplKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKG9wZW4sIGNsb3NlLCBjZW50ZXIgLSBzaXplIC8gMiwgY2VudGVyICsgc2l6ZSAvIDIpOyB9LFxuICAgIGZpbmROZWlnaGJvdXJzOiBmaW5kWU5laWdoYm91cnNcbn07XG5mdW5jdGlvbiBnZW5lcmF0ZUdyb3VwQ29uc3RyYWludHMocm9vdCwgZiwgbWluU2VwLCBpc0NvbnRhaW5lZCkge1xuICAgIGlmIChpc0NvbnRhaW5lZCA9PT0gdm9pZCAwKSB7IGlzQ29udGFpbmVkID0gZmFsc2U7IH1cbiAgICB2YXIgcGFkZGluZyA9IHJvb3QucGFkZGluZywgZ24gPSB0eXBlb2Ygcm9vdC5ncm91cHMgIT09ICd1bmRlZmluZWQnID8gcm9vdC5ncm91cHMubGVuZ3RoIDogMCwgbG4gPSB0eXBlb2Ygcm9vdC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnID8gcm9vdC5sZWF2ZXMubGVuZ3RoIDogMCwgY2hpbGRDb25zdHJhaW50cyA9ICFnbiA/IFtdXG4gICAgICAgIDogcm9vdC5ncm91cHMucmVkdWNlKGZ1bmN0aW9uIChjY3MsIGcpIHsgcmV0dXJuIGNjcy5jb25jYXQoZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKGcsIGYsIG1pblNlcCwgdHJ1ZSkpOyB9LCBbXSksIG4gPSAoaXNDb250YWluZWQgPyAyIDogMCkgKyBsbiArIGduLCB2cyA9IG5ldyBBcnJheShuKSwgcnMgPSBuZXcgQXJyYXkobiksIGkgPSAwLCBhZGQgPSBmdW5jdGlvbiAociwgdikgeyByc1tpXSA9IHI7IHZzW2krK10gPSB2OyB9O1xuICAgIGlmIChpc0NvbnRhaW5lZCkge1xuICAgICAgICB2YXIgYiA9IHJvb3QuYm91bmRzLCBjID0gZi5nZXRDZW50cmUoYiksIHMgPSBmLmdldFNpemUoYikgLyAyLCBvcGVuID0gZi5nZXRPcGVuKGIpLCBjbG9zZSA9IGYuZ2V0Q2xvc2UoYiksIG1pbiA9IGMgLSBzICsgcGFkZGluZyAvIDIsIG1heCA9IGMgKyBzIC0gcGFkZGluZyAvIDI7XG4gICAgICAgIHJvb3QubWluVmFyLmRlc2lyZWRQb3NpdGlvbiA9IG1pbjtcbiAgICAgICAgYWRkKGYubWFrZVJlY3Qob3BlbiwgY2xvc2UsIG1pbiwgcGFkZGluZyksIHJvb3QubWluVmFyKTtcbiAgICAgICAgcm9vdC5tYXhWYXIuZGVzaXJlZFBvc2l0aW9uID0gbWF4O1xuICAgICAgICBhZGQoZi5tYWtlUmVjdChvcGVuLCBjbG9zZSwgbWF4LCBwYWRkaW5nKSwgcm9vdC5tYXhWYXIpO1xuICAgIH1cbiAgICBpZiAobG4pXG4gICAgICAgIHJvb3QubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGFkZChsLmJvdW5kcywgbC52YXJpYWJsZSk7IH0pO1xuICAgIGlmIChnbilcbiAgICAgICAgcm9vdC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIGIgPSBnLmJvdW5kcztcbiAgICAgICAgICAgIGFkZChmLm1ha2VSZWN0KGYuZ2V0T3BlbihiKSwgZi5nZXRDbG9zZShiKSwgZi5nZXRDZW50cmUoYiksIGYuZ2V0U2l6ZShiKSksIGcubWluVmFyKTtcbiAgICAgICAgfSk7XG4gICAgdmFyIGNzID0gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdnMsIGYsIG1pblNlcCk7XG4gICAgaWYgKGduKSB7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgdi5jT3V0ID0gW10sIHYuY0luID0gW107IH0pO1xuICAgICAgICBjcy5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IGMubGVmdC5jT3V0LnB1c2goYyksIGMucmlnaHQuY0luLnB1c2goYyk7IH0pO1xuICAgICAgICByb290Lmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgZ2FwQWRqdXN0bWVudCA9IChnLnBhZGRpbmcgLSBmLmdldFNpemUoZy5ib3VuZHMpKSAvIDI7XG4gICAgICAgICAgICBnLm1pblZhci5jSW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5nYXAgKz0gZ2FwQWRqdXN0bWVudDsgfSk7XG4gICAgICAgICAgICBnLm1pblZhci5jT3V0LmZvckVhY2goZnVuY3Rpb24gKGMpIHsgYy5sZWZ0ID0gZy5tYXhWYXI7IGMuZ2FwICs9IGdhcEFkanVzdG1lbnQ7IH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkQ29uc3RyYWludHMuY29uY2F0KGNzKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZhcnMsIHJlY3QsIG1pblNlcCkge1xuICAgIHZhciBpLCBuID0gcnMubGVuZ3RoO1xuICAgIHZhciBOID0gMiAqIG47XG4gICAgY29uc29sZS5hc3NlcnQodmFycy5sZW5ndGggPj0gbik7XG4gICAgdmFyIGV2ZW50cyA9IG5ldyBBcnJheShOKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciByID0gcnNbaV07XG4gICAgICAgIHZhciB2ID0gbmV3IE5vZGUodmFyc1tpXSwgciwgcmVjdC5nZXRDZW50cmUocikpO1xuICAgICAgICBldmVudHNbaV0gPSBuZXcgRXZlbnQodHJ1ZSwgdiwgcmVjdC5nZXRPcGVuKHIpKTtcbiAgICAgICAgZXZlbnRzW2kgKyBuXSA9IG5ldyBFdmVudChmYWxzZSwgdiwgcmVjdC5nZXRDbG9zZShyKSk7XG4gICAgfVxuICAgIGV2ZW50cy5zb3J0KGNvbXBhcmVFdmVudHMpO1xuICAgIHZhciBjcyA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBzY2FubGluZSA9IG1ha2VSQlRyZWUoKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgTjsgKytpKSB7XG4gICAgICAgIHZhciBlID0gZXZlbnRzW2ldO1xuICAgICAgICB2YXIgdiA9IGUudjtcbiAgICAgICAgaWYgKGUuaXNPcGVuKSB7XG4gICAgICAgICAgICBzY2FubGluZS5pbnNlcnQodik7XG4gICAgICAgICAgICByZWN0LmZpbmROZWlnaGJvdXJzKHYsIHNjYW5saW5lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjYW5saW5lLnJlbW92ZSh2KTtcbiAgICAgICAgICAgIHZhciBtYWtlQ29uc3RyYWludCA9IGZ1bmN0aW9uIChsLCByKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlcCA9IChyZWN0LmdldFNpemUobC5yKSArIHJlY3QuZ2V0U2l6ZShyLnIpKSAvIDIgKyBtaW5TZXA7XG4gICAgICAgICAgICAgICAgY3MucHVzaChuZXcgdnBzY18xLkNvbnN0cmFpbnQobC52LCByLnYsIHNlcCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciB2aXNpdE5laWdoYm91cnMgPSBmdW5jdGlvbiAoZm9yd2FyZCwgcmV2ZXJzZSwgbWtjb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgdSwgaXQgPSB2W2ZvcndhcmRdLml0ZXJhdG9yKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKCh1ID0gaXRbZm9yd2FyZF0oKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbWtjb24odSwgdik7XG4gICAgICAgICAgICAgICAgICAgIHVbcmV2ZXJzZV0ucmVtb3ZlKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2aXNpdE5laWdoYm91cnMoXCJwcmV2XCIsIFwibmV4dFwiLCBmdW5jdGlvbiAodSwgdikgeyByZXR1cm4gbWFrZUNvbnN0cmFpbnQodSwgdik7IH0pO1xuICAgICAgICAgICAgdmlzaXROZWlnaGJvdXJzKFwibmV4dFwiLCBcInByZXZcIiwgZnVuY3Rpb24gKHUsIHYpIHsgcmV0dXJuIG1ha2VDb25zdHJhaW50KHYsIHUpOyB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmFzc2VydChzY2FubGluZS5zaXplID09PSAwKTtcbiAgICByZXR1cm4gY3M7XG59XG5mdW5jdGlvbiBmaW5kWE5laWdoYm91cnModiwgc2NhbmxpbmUpIHtcbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChmb3J3YXJkLCByZXZlcnNlKSB7XG4gICAgICAgIHZhciBpdCA9IHNjYW5saW5lLmZpbmRJdGVyKHYpO1xuICAgICAgICB2YXIgdTtcbiAgICAgICAgd2hpbGUgKCh1ID0gaXRbZm9yd2FyZF0oKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB1b3ZlcnZYID0gdS5yLm92ZXJsYXBYKHYucik7XG4gICAgICAgICAgICBpZiAodW92ZXJ2WCA8PSAwIHx8IHVvdmVydlggPD0gdS5yLm92ZXJsYXBZKHYucikpIHtcbiAgICAgICAgICAgICAgICB2W2ZvcndhcmRdLmluc2VydCh1KTtcbiAgICAgICAgICAgICAgICB1W3JldmVyc2VdLmluc2VydCh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1b3ZlcnZYIDw9IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgZihcIm5leHRcIiwgXCJwcmV2XCIpO1xuICAgIGYoXCJwcmV2XCIsIFwibmV4dFwiKTtcbn1cbmZ1bmN0aW9uIGZpbmRZTmVpZ2hib3Vycyh2LCBzY2FubGluZSkge1xuICAgIHZhciBmID0gZnVuY3Rpb24gKGZvcndhcmQsIHJldmVyc2UpIHtcbiAgICAgICAgdmFyIHUgPSBzY2FubGluZS5maW5kSXRlcih2KVtmb3J3YXJkXSgpO1xuICAgICAgICBpZiAodSAhPT0gbnVsbCAmJiB1LnIub3ZlcmxhcFgodi5yKSA+IDApIHtcbiAgICAgICAgICAgIHZbZm9yd2FyZF0uaW5zZXJ0KHUpO1xuICAgICAgICAgICAgdVtyZXZlcnNlXS5pbnNlcnQodik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGYoXCJuZXh0XCIsIFwicHJldlwiKTtcbiAgICBmKFwicHJldlwiLCBcIm5leHRcIik7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVhDb25zdHJhaW50cyhycywgdmFycykge1xuICAgIHJldHVybiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCB4UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWENvbnN0cmFpbnRzID0gZ2VuZXJhdGVYQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVlDb25zdHJhaW50cyhycywgdmFycykge1xuICAgIHJldHVybiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCB5UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWUNvbnN0cmFpbnRzID0gZ2VuZXJhdGVZQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzKHJvb3QpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIHhSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cyA9IGdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzKHJvb3QpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIHlSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cyA9IGdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHM7XG5mdW5jdGlvbiByZW1vdmVPdmVybGFwcyhycykge1xuICAgIHZhciB2cyA9IHJzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gbmV3IHZwc2NfMS5WYXJpYWJsZShyLmN4KCkpOyB9KTtcbiAgICB2YXIgY3MgPSBnZW5lcmF0ZVhDb25zdHJhaW50cyhycywgdnMpO1xuICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHJzW2ldLnNldFhDZW50cmUodi5wb3NpdGlvbigpKTsgfSk7XG4gICAgdnMgPSBycy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIG5ldyB2cHNjXzEuVmFyaWFibGUoci5jeSgpKTsgfSk7XG4gICAgY3MgPSBnZW5lcmF0ZVlDb25zdHJhaW50cyhycywgdnMpO1xuICAgIHNvbHZlciA9IG5ldyB2cHNjXzEuU29sdmVyKHZzLCBjcyk7XG4gICAgc29sdmVyLnNvbHZlKCk7XG4gICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gcnNbaV0uc2V0WUNlbnRyZSh2LnBvc2l0aW9uKCkpOyB9KTtcbn1cbmV4cG9ydHMucmVtb3ZlT3ZlcmxhcHMgPSByZW1vdmVPdmVybGFwcztcbnZhciBJbmRleGVkVmFyaWFibGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhJbmRleGVkVmFyaWFibGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSW5kZXhlZFZhcmlhYmxlKGluZGV4LCB3KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIDAsIHcpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIEluZGV4ZWRWYXJpYWJsZTtcbn0odnBzY18xLlZhcmlhYmxlKSk7XG5leHBvcnRzLkluZGV4ZWRWYXJpYWJsZSA9IEluZGV4ZWRWYXJpYWJsZTtcbnZhciBQcm9qZWN0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQcm9qZWN0aW9uKG5vZGVzLCBncm91cHMsIHJvb3RHcm91cCwgY29uc3RyYWludHMsIGF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgaWYgKHJvb3RHcm91cCA9PT0gdm9pZCAwKSB7IHJvb3RHcm91cCA9IG51bGw7IH1cbiAgICAgICAgaWYgKGNvbnN0cmFpbnRzID09PSB2b2lkIDApIHsgY29uc3RyYWludHMgPSBudWxsOyB9XG4gICAgICAgIGlmIChhdm9pZE92ZXJsYXBzID09PSB2b2lkIDApIHsgYXZvaWRPdmVybGFwcyA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgIHRoaXMucm9vdEdyb3VwID0gcm9vdEdyb3VwO1xuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMgPSBhdm9pZE92ZXJsYXBzO1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IG5vZGVzLm1hcChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHYudmFyaWFibGUgPSBuZXcgSW5kZXhlZFZhcmlhYmxlKGksIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25zdHJhaW50cyhjb25zdHJhaW50cyk7XG4gICAgICAgIGlmIChhdm9pZE92ZXJsYXBzICYmIHJvb3RHcm91cCAmJiB0eXBlb2Ygcm9vdEdyb3VwLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXYud2lkdGggfHwgIXYuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHYuYm91bmRzID0gbmV3IFJlY3RhbmdsZSh2LngsIHYueCwgdi55LCB2LnkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB3MiA9IHYud2lkdGggLyAyLCBoMiA9IHYuaGVpZ2h0IC8gMjtcbiAgICAgICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUodi54IC0gdzIsIHYueCArIHcyLCB2LnkgLSBoMiwgdi55ICsgaDIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb21wdXRlR3JvdXBCb3VuZHMocm9vdEdyb3VwKTtcbiAgICAgICAgICAgIHZhciBpID0gbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy52YXJpYWJsZXNbaV0gPSBnLm1pblZhciA9IG5ldyBJbmRleGVkVmFyaWFibGUoaSsrLCB0eXBlb2YgZy5zdGlmZm5lc3MgIT09IFwidW5kZWZpbmVkXCIgPyBnLnN0aWZmbmVzcyA6IDAuMDEpO1xuICAgICAgICAgICAgICAgIF90aGlzLnZhcmlhYmxlc1tpXSA9IGcubWF4VmFyID0gbmV3IEluZGV4ZWRWYXJpYWJsZShpKyssIHR5cGVvZiBnLnN0aWZmbmVzcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGcuc3RpZmZuZXNzIDogMC4wMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVTZXBhcmF0aW9uID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB2cHNjXzEuQ29uc3RyYWludCh0aGlzLm5vZGVzW2MubGVmdF0udmFyaWFibGUsIHRoaXMubm9kZXNbYy5yaWdodF0udmFyaWFibGUsIGMuZ2FwLCB0eXBlb2YgYy5lcXVhbGl0eSAhPT0gXCJ1bmRlZmluZWRcIiA/IGMuZXF1YWxpdHkgOiBmYWxzZSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5tYWtlRmVhc2libGUgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoIXRoaXMuYXZvaWRPdmVybGFwcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGF4aXMgPSAneCcsIGRpbSA9ICd3aWR0aCc7XG4gICAgICAgIGlmIChjLmF4aXMgPT09ICd4JylcbiAgICAgICAgICAgIGF4aXMgPSAneScsIGRpbSA9ICdoZWlnaHQnO1xuICAgICAgICB2YXIgdnMgPSBjLm9mZnNldHMubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBfdGhpcy5ub2Rlc1tvLm5vZGVdOyB9KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhW2F4aXNdIC0gYltheGlzXTsgfSk7XG4gICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFBvcyA9IHBbYXhpc10gKyBwW2RpbV07XG4gICAgICAgICAgICAgICAgaWYgKG5leHRQb3MgPiB2W2F4aXNdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZbYXhpc10gPSBuZXh0UG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAgPSB2O1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUFsaWdubWVudCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB1ID0gdGhpcy5ub2Rlc1tjLm9mZnNldHNbMF0ubm9kZV0udmFyaWFibGU7XG4gICAgICAgIHRoaXMubWFrZUZlYXNpYmxlKGMpO1xuICAgICAgICB2YXIgY3MgPSBjLmF4aXMgPT09ICd4JyA/IHRoaXMueENvbnN0cmFpbnRzIDogdGhpcy55Q29uc3RyYWludHM7XG4gICAgICAgIGMub2Zmc2V0cy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgICB2YXIgdiA9IF90aGlzLm5vZGVzW28ubm9kZV0udmFyaWFibGU7XG4gICAgICAgICAgICBjcy5wdXNoKG5ldyB2cHNjXzEuQ29uc3RyYWludCh1LCB2LCBvLm9mZnNldCwgdHJ1ZSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUNvbnN0cmFpbnRzID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBpc1NlcCA9IGZ1bmN0aW9uIChjKSB7IHJldHVybiB0eXBlb2YgYy50eXBlID09PSAndW5kZWZpbmVkJyB8fCBjLnR5cGUgPT09ICdzZXBhcmF0aW9uJzsgfTtcbiAgICAgICAgdGhpcy54Q29uc3RyYWludHMgPSBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5heGlzID09PSBcInhcIiAmJiBpc1NlcChjKTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZVNlcGFyYXRpb24oYyk7IH0pO1xuICAgICAgICB0aGlzLnlDb25zdHJhaW50cyA9IGNvbnN0cmFpbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmF4aXMgPT09IFwieVwiICYmIGlzU2VwKGMpOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMuY3JlYXRlU2VwYXJhdGlvbihjKTsgfSk7XG4gICAgICAgIGNvbnN0cmFpbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLnR5cGUgPT09ICdhbGlnbm1lbnQnOyB9KVxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZUFsaWdubWVudChjKTsgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5zZXR1cFZhcmlhYmxlc0FuZEJvdW5kcyA9IGZ1bmN0aW9uICh4MCwgeTAsIGRlc2lyZWQsIGdldERlc2lyZWQpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICBpZiAodi5maXhlZCkge1xuICAgICAgICAgICAgICAgIHYudmFyaWFibGUud2VpZ2h0ID0gdi5maXhlZFdlaWdodCA/IHYuZml4ZWRXZWlnaHQgOiAxMDAwO1xuICAgICAgICAgICAgICAgIGRlc2lyZWRbaV0gPSBnZXREZXNpcmVkKHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdi52YXJpYWJsZS53ZWlnaHQgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHcgPSAodi53aWR0aCB8fCAwKSAvIDIsIGggPSAodi5oZWlnaHQgfHwgMCkgLyAyO1xuICAgICAgICAgICAgdmFyIGl4ID0geDBbaV0sIGl5ID0geTBbaV07XG4gICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUoaXggLSB3LCBpeCArIHcsIGl5IC0gaCwgaXkgKyBoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS54UHJvamVjdCA9IGZ1bmN0aW9uICh4MCwgeTAsIHgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvb3RHcm91cCAmJiAhKHRoaXMuYXZvaWRPdmVybGFwcyB8fCB0aGlzLnhDb25zdHJhaW50cykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvamVjdCh4MCwgeTAsIHgwLCB4LCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5weDsgfSwgdGhpcy54Q29uc3RyYWludHMsIGdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHMsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmJvdW5kcy5zZXRYQ2VudHJlKHhbdi52YXJpYWJsZS5pbmRleF0gPSB2LnZhcmlhYmxlLnBvc2l0aW9uKCkpOyB9LCBmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIHhtaW4gPSB4W2cubWluVmFyLmluZGV4XSA9IGcubWluVmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgeG1heCA9IHhbZy5tYXhWYXIuaW5kZXhdID0gZy5tYXhWYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBwMiA9IGcucGFkZGluZyAvIDI7XG4gICAgICAgICAgICBnLmJvdW5kcy54ID0geG1pbiAtIHAyO1xuICAgICAgICAgICAgZy5ib3VuZHMuWCA9IHhtYXggKyBwMjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS55UHJvamVjdCA9IGZ1bmN0aW9uICh4MCwgeTAsIHkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvb3RHcm91cCAmJiAhdGhpcy55Q29uc3RyYWludHMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvamVjdCh4MCwgeTAsIHkwLCB5LCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5weTsgfSwgdGhpcy55Q29uc3RyYWludHMsIGdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHMsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmJvdW5kcy5zZXRZQ2VudHJlKHlbdi52YXJpYWJsZS5pbmRleF0gPSB2LnZhcmlhYmxlLnBvc2l0aW9uKCkpOyB9LCBmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIHltaW4gPSB5W2cubWluVmFyLmluZGV4XSA9IGcubWluVmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgeW1heCA9IHlbZy5tYXhWYXIuaW5kZXhdID0gZy5tYXhWYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBwMiA9IGcucGFkZGluZyAvIDI7XG4gICAgICAgICAgICBnLmJvdW5kcy55ID0geW1pbiAtIHAyO1xuICAgICAgICAgICAgO1xuICAgICAgICAgICAgZy5ib3VuZHMuWSA9IHltYXggKyBwMjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5wcm9qZWN0RnVuY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZnVuY3Rpb24gKHgwLCB5MCwgeCkgeyByZXR1cm4gX3RoaXMueFByb2plY3QoeDAsIHkwLCB4KTsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICh4MCwgeTAsIHkpIHsgcmV0dXJuIF90aGlzLnlQcm9qZWN0KHgwLCB5MCwgeSk7IH1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCBzdGFydCwgZGVzaXJlZCwgZ2V0RGVzaXJlZCwgY3MsIGdlbmVyYXRlQ29uc3RyYWludHMsIHVwZGF0ZU5vZGVCb3VuZHMsIHVwZGF0ZUdyb3VwQm91bmRzKSB7XG4gICAgICAgIHRoaXMuc2V0dXBWYXJpYWJsZXNBbmRCb3VuZHMoeDAsIHkwLCBkZXNpcmVkLCBnZXREZXNpcmVkKTtcbiAgICAgICAgaWYgKHRoaXMucm9vdEdyb3VwICYmIHRoaXMuYXZvaWRPdmVybGFwcykge1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHRoaXMucm9vdEdyb3VwKTtcbiAgICAgICAgICAgIGNzID0gY3MuY29uY2F0KGdlbmVyYXRlQ29uc3RyYWludHModGhpcy5yb290R3JvdXApKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNvbHZlKHRoaXMudmFyaWFibGVzLCBjcywgc3RhcnQsIGRlc2lyZWQpO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2godXBkYXRlTm9kZUJvdW5kcyk7XG4gICAgICAgIGlmICh0aGlzLnJvb3RHcm91cCAmJiB0aGlzLmF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzLmZvckVhY2godXBkYXRlR3JvdXBCb3VuZHMpO1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHRoaXMucm9vdEdyb3VwKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAodnMsIGNzLCBzdGFydGluZywgZGVzaXJlZCkge1xuICAgICAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICAgICAgc29sdmVyLnNldFN0YXJ0aW5nUG9zaXRpb25zKHN0YXJ0aW5nKTtcbiAgICAgICAgc29sdmVyLnNldERlc2lyZWRQb3NpdGlvbnMoZGVzaXJlZCk7XG4gICAgICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIH07XG4gICAgcmV0dXJuIFByb2plY3Rpb247XG59KCkpO1xuZXhwb3J0cy5Qcm9qZWN0aW9uID0gUHJvamVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNtVmpkR0Z1WjJ4bExtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTWlPbHNpTGk0dkxpNHZWMlZpUTI5c1lTOXpjbU12Y21WamRHRnVaMnhsTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3pzN096dEJRVUZCTEN0Q1FVRnRSRHRCUVVOdVJDeHRRMEZCSzBJN1FVRnJRak5DTERSQ1FVRnRReXhEUVVGclFqdEpRVU5xUkN4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJRenRSUVVONFF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFTkJRVmtzUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCYWtJc1EwRkJhVUlzUlVGQlJTeFRRVUZUTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRelZGTEZOQlFWTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRKUVVOMFFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eERRVUZETzFGQlEyaERMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRV01zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhEUVVGWkxFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVFNVFpeERRVUU0UWl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU42Unl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU4yUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dEJRVU53UWl4RFFVRkRPMEZCVWtRc1owUkJVVU03UVVGRlJEdEpRVU5KTEcxQ1FVTlhMRU5CUVZNc1JVRkRWQ3hEUVVGVExFVkJRMVFzUTBGQlV5eEZRVU5VTEVOQlFWTTdVVUZJVkN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRMVFzVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVVR0UlFVTlVMRTFCUVVNc1IwRkJSQ3hEUVVGRExFTkJRVkU3VVVGRFZDeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlJPMGxCUVVrc1EwRkJRenRKUVVWc1FpeGxRVUZMTEVkQlFWb3NZMEZCTkVJc1RVRkJUU3hEUVVGRExFbEJRVWtzVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVVzVFVGQlRTeERRVUZETEdsQ1FVRnBRaXhGUVVGRkxFMUJRVTBzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVVV6U2l4elFrRkJSU3hIUVVGR0xHTkJRV1VzVFVGQlRTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVVNVF5eHpRa0ZCUlN4SFFVRkdMR05CUVdVc1RVRkJUU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVVTVReXcwUWtGQlVTeEhRVUZTTEZWQlFWTXNRMEZCV1R0UlFVTnFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTm9ReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSVVFzTkVKQlFWRXNSMEZCVWl4VlFVRlRMRU5CUVZrN1VVRkRha0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1VVRkRhRU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVVZFTERoQ1FVRlZMRWRCUVZZc1ZVRkJWeXhGUVVGVk8xRkJRMnBDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZEZUVJc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVVUZEWWl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRc09FSkJRVlVzUjBGQlZpeFZRVUZYTEVWQlFWVTdVVUZEYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOaUxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRlJDeDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNelFpeERRVUZETzBsQlJVUXNNRUpCUVUwc1IwRkJUanRSUVVOSkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE0wSXNRMEZCUXp0SlFVVkVMSGxDUVVGTExFZEJRVXdzVlVGQlRTeERRVUZaTzFGQlEyUXNUVUZCVFN4RFFVRkRMRWxCUVVrc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOeVNDeERRVUZETzBsQlYwUXNjVU5CUVdsQ0xFZEJRV3BDTEZWQlFXdENMRVZCUVZVc1JVRkJSU3hGUVVGVkxFVkJRVVVzUlVGQlZTeEZRVUZGTEVWQlFWVTdVVUZETlVRc1NVRkJTU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNrTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaERMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JETEVsQlFVa3NZVUZCWVN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOMlFpeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRrY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF6dG5Ra0ZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUXpORUxFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNZVUZCWVN4RFFVRkRPMGxCUTNwQ0xFTkJRVU03U1VGVlJDeHRRMEZCWlN4SFFVRm1MRlZCUVdkQ0xFVkJRVlVzUlVGQlJTeEZRVUZWTzFGQlEyeERMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTm9SU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRelZETEVOQlFVTTdTVUZGUkN3MFFrRkJVU3hIUVVGU08xRkJRMGtzVFVGQlRTeERRVUZETzFsQlEwZ3NSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSVHRaUVVONFFpeEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZPMWxCUTNoQ0xFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEZUVJc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJUdFRRVUZETEVOQlFVTTdTVUZEYkVNc1EwRkJRenRKUVVWTkxEQkNRVUZuUWl4SFFVRjJRaXhWUVVOSkxFVkJRVlVzUlVGQlJTeEZRVUZWTEVWQlEzUkNMRVZCUVZVc1JVRkJSU3hGUVVGVkxFVkJRM1JDTEVWQlFWVXNSVUZCUlN4RlFVRlZMRVZCUTNSQ0xFVkJRVlVzUlVGQlJTeEZRVUZWTzFGQlEzUkNMRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVWQlFVVXNTVUZCU1N4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFVkJRemxDTEVsQlFVa3NSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVTTVRaXhYUVVGWExFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRelZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRmRCUVZjc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUTJ4RExFbEJRVWtzU1VGQlNTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUVVVc1NVRkJTU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVWQlF6bENMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SlFVRkpMRVZCUTJoRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NWMEZCVnl4RlFVTjBRaXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SlFVRkpMRWRCUVVjc1NVRkJTU3hGUVVOb1F5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRmRCUVZjc1EwRkJRenRSUVVNelFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjJReXhOUVVGTkxFTkJRVU03WjBKQlEwZ3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzU1VGQlNUdG5Ra0ZEYUVJc1EwRkJReXhGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NTVUZCU1R0aFFVTnVRaXhEUVVGRE8xRkJRMDRzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVVZFTERKQ1FVRlBMRWRCUVZBc1ZVRkJVU3hIUVVGWE8xRkJRMllzVFVGQlRTeERRVUZETEVsQlFVa3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZEYWtZc1EwRkJRenRKUVVOTUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFYaElSQ3hKUVhkSVF6dEJRWGhJV1N3NFFrRkJVenRCUVhGSmRFSXNlVUpCUVdkRExFMUJRV2xDTEVWQlFVVXNUVUZCYVVJc1JVRkJSU3hGUVVGVk8wbEJSVFZGTEVsQlFVMHNSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRemRHTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1pVRkJaU3hEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVNelJpeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVU5vUWl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVTm9RaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5zUkN4TlFVRk5MRU5CUVVNN1VVRkRTQ3hyUWtGQmEwSXNSVUZCUlN4RlFVRkZPMUZCUTNSQ0xHdENRVUZyUWl4RlFVRkZMRVZCUVVVN1VVRkRkRUlzVlVGQlZTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVU3UzBGREwwUXNRMEZCUVR0QlFVTk1MRU5CUVVNN1FVRmFSQ3d3UTBGWlF6dEJRVmRFTEc5Q1FVRXlRaXhEUVVFeVFpeEZRVUZGTEUxQlFXbENMRVZCUVVVc1JVRkJWVHRKUVVOcVJpeEpRVUZKTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRekZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRVU1zUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU03U1VGRGFrUXNTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTm1MRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJZc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTTdTVUZEY2tNc1RVRkJUU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJRenRCUVVNMVJDeERRVUZETzBGQlVFUXNaME5CVDBNN1FVRkZSRHRKUVVsSkxHTkJRVzFDTEVOQlFWY3NSVUZCVXl4RFFVRlpMRVZCUVZNc1IwRkJWenRSUVVGd1JDeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlZPMUZCUVZNc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQlZ6dFJRVUZUTEZGQlFVY3NSMEZCU0N4SFFVRkhMRU5CUVZFN1VVRkRia1VzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4VlFVRlZMRVZCUVVVc1EwRkJRenRSUVVONlFpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRlZCUVZVc1JVRkJSU3hEUVVGRE8wbEJRemRDTEVOQlFVTTdTVUZEVEN4WFFVRkRPMEZCUVVRc1EwRkJReXhCUVZKRUxFbEJVVU03UVVGRlJEdEpRVU5KTEdWQlFXMUNMRTFCUVdVc1JVRkJVeXhEUVVGUExFVkJRVk1zUjBGQlZ6dFJRVUZ1UkN4WFFVRk5MRWRCUVU0c1RVRkJUU3hEUVVGVE8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVFR0UlFVRlRMRkZCUVVjc1IwRkJTQ3hIUVVGSExFTkJRVkU3U1VGQlJ5eERRVUZETzBsQlF6bEZMRmxCUVVNN1FVRkJSQ3hEUVVGRExFRkJSa1FzU1VGRlF6dEJRVVZFTEhWQ1FVRjFRaXhEUVVGUkxFVkJRVVVzUTBGQlVUdEpRVU55UXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJRMFFzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEWkN4RFFVRkRPMGxCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkZXQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEWkN4RFFVRkRPMGxCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkZXQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEySXNRMEZCUXp0SlFVTkVMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UVVGRFlpeERRVUZETzBGQlJVUTdTVUZEU1N4TlFVRk5MRU5CUVVNc1NVRkJTU3hsUVVGTkxFTkJRVThzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRmlMRU5CUVdFc1EwRkJReXhEUVVGRE8wRkJRM0pFTEVOQlFVTTdRVUZYUkN4SlFVRkpMRXRCUVVzc1IwRkJhMEk3U1VGRGRrSXNVMEZCVXl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRk9MRU5CUVUwN1NVRkRja0lzVDBGQlR5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlNDeERRVUZITzBsQlEyaENMRkZCUVZFc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVnc1EwRkJSenRKUVVOcVFpeFBRVUZQTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFWUXNRMEZCVXp0SlFVTjBRaXhSUVVGUkxFVkJRVVVzVlVGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFbEJRVXNzVDBGQlFTeEpRVUZKTEZOQlFWTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeE5RVUZOTEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUzBGQlN5eERRVUZETEVWQlFXaEZMRU5CUVdkRk8wbEJRM3BITEdOQlFXTXNSVUZCUlN4bFFVRmxPME5CUTJ4RExFTkJRVU03UVVGRlJpeEpRVUZKTEV0QlFVc3NSMEZCYTBJN1NVRkRka0lzVTBGQlV5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZPTEVOQlFVMDdTVUZEY2tJc1QwRkJUeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJTQ3hEUVVGSE8wbEJRMmhDTEZGQlFWRXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVZ3NRMEZCUnp0SlFVTnFRaXhQUVVGUExFVkJRVVVzVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVllzUTBGQlZUdEpRVU4yUWl4UlFVRlJMRVZCUVVVc1ZVRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEUxQlFVMHNSVUZCUlN4SlFVRkpMRWxCUVVzc1QwRkJRU3hKUVVGSkxGTkJRVk1zUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEUxQlFVMHNSMEZCUnl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRV2hGTEVOQlFXZEZPMGxCUTNwSExHTkJRV01zUlVGQlJTeGxRVUZsTzBOQlEyeERMRU5CUVVNN1FVRkZSaXhyUTBGQmEwTXNTVUZCY1VJc1JVRkJSU3hEUVVGblFpeEZRVUZGTEUxQlFXTXNSVUZCUlN4WFFVRTBRanRKUVVFMVFpdzBRa0ZCUVN4RlFVRkJMRzFDUVVFMFFqdEpRVVZ1U0N4SlFVRkpMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEZRVU4wUWl4RlFVRkZMRWRCUVVjc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRhRVVzUlVGQlJTeEhRVUZITEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEZMR2RDUVVGblFpeEhRVUZwUWl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU42UXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUXl4SFFVRnBRaXhGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc2QwSkJRWGRDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCZUVRc1EwRkJkMFFzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZETlVjc1EwRkJReXhIUVVGSExFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUTI1RExFVkJRVVVzUjBGQlpTeEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkROMElzUlVGQlJTeEhRVUZuUWl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRE9VSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkRUQ3hIUVVGSExFZEJRVWNzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRlBMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRMME1zUlVGQlJTeERRVUZETEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWa0xFbEJRVWtzUTBGQlF5eEhRVUZqTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUXpGQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGRGVFTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6RkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEU5QlFVOHNSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVONlJDeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMR1ZCUVdVc1IwRkJSeXhIUVVGSExFTkJRVU03VVVGRGJFTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NSVUZCUlN4SFFVRkhMRVZCUVVVc1QwRkJUeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUTNoRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNaVUZCWlN4SFFVRkhMRWRCUVVjc1EwRkJRenRSUVVOc1F5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdTVUZETlVRc1EwRkJRenRKUVVORUxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0UlFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGNlFpeERRVUY1UWl4RFFVRkRMRU5CUVVNN1NVRkROVVFzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eEhRVUZqTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkROVUlzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTjZSaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5JTEVsQlFVa3NSVUZCUlN4SFFVRkhMRzFDUVVGdFFpeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBsQlEyaEVMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEVEN4RlFVRkZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZOTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlN4RFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wTXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlRTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE9VUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlEycENMRWxCUVVrc1lVRkJZU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVNeFJDeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxHRkJRV0VzUlVGQmRFSXNRMEZCYzBJc1EwRkJReXhEUVVGRE8xbEJRMnhFTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXk5RkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFVTkVMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03UVVGRGRrTXNRMEZCUXp0QlFVVkVMRFpDUVVFMlFpeEZRVUZsTEVWQlFVVXNTVUZCWjBJc1JVRkRNVVFzU1VGQmJVSXNSVUZCUlN4TlFVRmpPMGxCUlc1RExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRE8wbEJRM0pDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRFpDeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYWtNc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRha01zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkRja0lzU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYUVRc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRNVVFzUTBGQlF6dEpRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU03U1VGRE0wSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hMUVVGTExFVkJRV01zUTBGQlF6dEpRVU5xUXl4SlFVRkpMRkZCUVZFc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF6dEpRVU0xUWl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFJRVU55UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYkVJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmFMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTFnc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVOeVF5eERRVUZETzFGQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkZTaXhSUVVGUkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFbEJRVWtzWTBGQll5eEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRM1JDTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETzJkQ1FVTXZSQ3hGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NhVUpCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU16UXl4RFFVRkRMRU5CUVVNN1dVRkRSaXhKUVVGSkxHVkJRV1VzUjBGQlJ5eFZRVUZETEU5QlFVOHNSVUZCUlN4UFFVRlBMRVZCUVVVc1MwRkJTenRuUWtGRE1VTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRuUWtGRGJFTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNRMEZCUXl4TFFVRkxMRWxCUVVrc1JVRkJSU3hEUVVGRE8yOUNRVU5zUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTmFMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRM3BDTEVOQlFVTTdXVUZEVEN4RFFVRkRMRU5CUVVNN1dVRkRSaXhsUVVGbExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeGpRVUZqTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGd1FpeERRVUZ2UWl4RFFVRkRMRU5CUVVNN1dVRkRhRVVzWlVGQlpTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNZMEZCWXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQmNFSXNRMEZCYjBJc1EwRkJReXhEUVVGRE8xRkJRM0JGTEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCUTBRc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM0JETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNN1FVRkRaQ3hEUVVGRE8wRkJSVVFzZVVKQlFYbENMRU5CUVU4c1JVRkJSU3hSUVVGelFqdEpRVU53UkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhWUVVGRExFOUJRVThzUlVGQlJTeFBRVUZQTzFGQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExGRkJRVkVzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEVGl4UFFVRlBMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4RFFVRkRMRXRCUVVzc1NVRkJTU3hGUVVGRkxFTkJRVU03V1VGRGJFTXNTVUZCU1N4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMmhETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1NVRkJTU3hEUVVGRExFbEJRVWtzVDBGQlR5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJReTlETEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNKQ0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNRMEZCUXp0WlFVTkVMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVObUxFdEJRVXNzUTBGQlF6dFpRVU5XTEVOQlFVTTdVVUZEVEN4RFFVRkRPMGxCUTB3c1EwRkJReXhEUVVGQk8wbEJRMFFzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wRkJRM1JDTEVOQlFVTTdRVUZGUkN4NVFrRkJlVUlzUTBGQlR5eEZRVUZGTEZGQlFYTkNPMGxCUTNCRUxFbEJRVWtzUTBGQlF5eEhRVUZITEZWQlFVTXNUMEZCVHl4RlFVRkZMRTlCUVU4N1VVRkRja0lzU1VGQlNTeERRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUTNoRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZEVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOeVFpeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzcENMRU5CUVVNN1NVRkRUQ3hEUVVGRExFTkJRVUU3U1VGRFJDeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wbEJRMnhDTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03UVVGRGRFSXNRMEZCUXp0QlFVVkVMRGhDUVVGeFF5eEZRVUZsTEVWQlFVVXNTVUZCWjBJN1NVRkRiRVVzVFVGQlRTeERRVUZETEcxQ1FVRnRRaXhEUVVGRExFVkJRVVVzUlVGQlJTeEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8wRkJRM1JFTEVOQlFVTTdRVUZHUkN4dlJFRkZRenRCUVVWRUxEaENRVUZ4UXl4RlFVRmxMRVZCUVVVc1NVRkJaMEk3U1VGRGJFVXNUVUZCVFN4RFFVRkRMRzFDUVVGdFFpeERRVUZETEVWQlFVVXNSVUZCUlN4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzBGQlEzUkVMRU5CUVVNN1FVRkdSQ3h2UkVGRlF6dEJRVVZFTEcxRFFVRXdReXhKUVVGeFFqdEpRVU16UkN4TlFVRk5MRU5CUVVNc2QwSkJRWGRDTEVOQlFVTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dEJRVU4yUkN4RFFVRkRPMEZCUmtRc09FUkJSVU03UVVGRlJDeHRRMEZCTUVNc1NVRkJjVUk3U1VGRE0wUXNUVUZCVFN4RFFVRkRMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UVVGRGRrUXNRMEZCUXp0QlFVWkVMRGhFUVVWRE8wRkJSVVFzZDBKQlFTdENMRVZCUVdVN1NVRkRNVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVsQlFVa3NaVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZ3UWl4RFFVRnZRaXhEUVVGRExFTkJRVU03U1VGRE0wTXNTVUZCU1N4RlFVRkZMRWRCUVVjc2IwSkJRVzlDTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRM1JETEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1lVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTm9ReXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdTVUZEWml4RlFVRkZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFVkJRVGxDTEVOQlFUaENMRU5CUVVNc1EwRkJRenRKUVVOeVJDeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVsQlFVa3NaVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZ3UWl4RFFVRnZRaXhEUVVGRExFTkJRVU03U1VGRGRFTXNSVUZCUlN4SFFVRkhMRzlDUVVGdlFpeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVOc1F5eE5RVUZOTEVkQlFVY3NTVUZCU1N4aFFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBsQlF6VkNMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dEpRVU5tTEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNc1JVRkJPVUlzUTBGQk9FSXNRMEZCUXl4RFFVRkRPMEZCUTNwRUxFTkJRVU03UVVGWVJDeDNRMEZYUXp0QlFXRkVPMGxCUVhGRExHMURRVUZSTzBsQlEzcERMSGxDUVVGdFFpeExRVUZoTEVWQlFVVXNRMEZCVXp0UlFVRXpReXhaUVVOSkxHdENRVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1UwRkRaRHRSUVVaclFpeFhRVUZMTEVkQlFVd3NTMEZCU3l4RFFVRlJPenRKUVVWb1F5eERRVUZETzBsQlEwd3NjMEpCUVVNN1FVRkJSQ3hEUVVGRExFRkJTa1FzUTBGQmNVTXNaVUZCVVN4SFFVazFRenRCUVVwWkxEQkRRVUZsTzBGQlRUVkNPMGxCUzBrc2IwSkJRVzlDTEV0QlFXdENMRVZCUXpGQ0xFMUJRWGxDTEVWQlEzcENMRk5CUVdsRExFVkJRM3BETEZkQlFYZENMRVZCUTJoQ0xHRkJRVGhDTzFGQlJqbENMREJDUVVGQkxFVkJRVUVzWjBKQlFXbERPMUZCUTNwRExEUkNRVUZCTEVWQlFVRXNhMEpCUVhkQ08xRkJRMmhDTERoQ1FVRkJMRVZCUVVFc2NVSkJRVGhDTzFGQlNqRkRMR2xDUVRoQ1F6dFJRVGxDYlVJc1ZVRkJTeXhIUVVGTUxFdEJRVXNzUTBGQllUdFJRVU14UWl4WFFVRk5MRWRCUVU0c1RVRkJUU3hEUVVGdFFqdFJRVU42UWl4alFVRlRMRWRCUVZRc1UwRkJVeXhEUVVGM1FqdFJRVVZxUXl4clFrRkJZU3hIUVVGaUxHRkJRV0VzUTBGQmFVSTdVVUZGZEVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE5VSXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeGxRVUZsTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUlVnc1JVRkJSU3hEUVVGRExFTkJRVU1zVjBGQlZ5eERRVUZETzFsQlFVTXNTVUZCU1N4RFFVRkRMR2xDUVVGcFFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUlhKRUxFVkJRVVVzUTBGQlF5eERRVUZETEdGQlFXRXNTVUZCU1N4VFFVRlRMRWxCUVVrc1QwRkJUeXhUUVVGVExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRlRVVzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRekZDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkRNVUlzUTBGQlF6dHZRa0ZGUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETjBNc1RVRkJUU3hEUVVGRE8yZENRVU5TTEVOQlFVTTdaMEpCUTJNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVONFF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRja1VzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEU0N4clFrRkJhMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTTVRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTNKQ0xFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMmRDUVVOYUxFdEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEdWQlFXVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eFRRVUZUTEV0QlFVc3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRuUWtGRGFrZ3NTMEZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1pVRkJaU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRk5CUVZNc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEzSklMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMUFzUTBGQlF6dEpRVU5NTEVOQlFVTTdTVUZIVHl4eFEwRkJaMElzUjBGQmVFSXNWVUZCZVVJc1EwRkJUVHRSUVVNelFpeE5RVUZOTEVOQlFVTXNTVUZCU1N4cFFrRkJWU3hEUVVOcVFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlF6TkNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkROVUlzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZEVEN4UFFVRlBMRU5CUVVNc1EwRkJReXhSUVVGUkxFdEJRVXNzVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTm9SU3hEUVVGRE8wbEJSMDhzYVVOQlFWa3NSMEZCY0VJc1ZVRkJjVUlzUTBGQlRUdFJRVUV6UWl4cFFrRnBRa003VVVGb1FrY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzFsQlFVTXNUVUZCVFN4RFFVRkRPMUZCUldoRExFbEJRVWtzU1VGQlNTeEhRVUZITEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVjc1QwRkJUeXhEUVVGRE8xRkJRemxDTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzUjBGQlJ5eERRVUZETzFsQlFVTXNTVUZCU1N4SFFVRkhMRWRCUVVjc1JVRkJSU3hIUVVGSExFZEJRVWNzVVVGQlVTeERRVUZETzFGQlF5OURMRWxCUVVrc1JVRkJSU3hIUVVGblFpeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZzUWl4RFFVRnJRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRV3BDTEVOQlFXbENMRU5CUVVNc1EwRkJRenRSUVVNdlJpeEpRVUZKTEVOQlFVTXNSMEZCWXl4SlFVRkpMRU5CUVVNN1VVRkRlRUlzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkZVaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOS0xFbEJRVWtzVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUXk5Q0xFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTndRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRPMmRDUVVOMFFpeERRVUZETzFsQlEwd3NRMEZCUXp0WlFVTkVMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFZpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkZUeXh2UTBGQlpTeEhRVUYyUWl4VlFVRjNRaXhEUVVGTk8xRkJRVGxDTEdsQ1FWRkRPMUZCVUVjc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJRenRSUVVNdlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUTJoRkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEZUVJc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETzFsQlEzQkRMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeHBRa0ZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTFBc1EwRkJRenRKUVVWUExITkRRVUZwUWl4SFFVRjZRaXhWUVVFd1FpeFhRVUZyUWp0UlFVRTFReXhwUWtGWFF6dFJRVlpITEVsQlFVa3NTMEZCU3l4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzVDBGQlR5eERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRmRCUVZjc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEZsQlFWa3NSVUZCZUVRc1EwRkJkMFFzUTBGQlF6dFJRVU14UlN4SlFVRkpMRU5CUVVNc1dVRkJXU3hIUVVGSExGZEJRVmM3WVVGRE1VSXNUVUZCVFN4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUV4UWl4RFFVRXdRaXhEUVVGRE8yRkJRM1pETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFdEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQmVFSXNRMEZCZDBJc1EwRkJReXhEUVVGRE8xRkJRM2hETEVsQlFVa3NRMEZCUXl4WlFVRlpMRWRCUVVjc1YwRkJWenRoUVVNeFFpeE5RVUZOTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVEZDTEVOQlFUQkNMRU5CUVVNN1lVRkRka01zUjBGQlJ5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1MwRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGNFFpeERRVUYzUWl4RFFVRkRMRU5CUVVNN1VVRkRlRU1zVjBGQlZ6dGhRVU5PTEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NWMEZCVnl4RlFVRjBRaXhEUVVGelFpeERRVUZETzJGQlEyNURMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEV0QlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRWFpDTEVOQlFYVkNMRU5CUVVNc1EwRkJRenRKUVVNdlF5eERRVUZETzBsQlJVOHNORU5CUVhWQ0xFZEJRUzlDTEZWQlFXZERMRVZCUVZrc1JVRkJSU3hGUVVGWkxFVkJRVVVzVDBGQmFVSXNSVUZCUlN4VlFVRnZRenRSUVVNdlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEzQkNMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOV0xFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF6dG5Ra0ZEZWtRc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNdlFpeERRVUZETzFsQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1owSkJRMG9zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRekZDTEVOQlFVTTdXVUZEUkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFsQlEzQkVMRWxCUVVrc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6TkNMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeFRRVUZUTEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZEVMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMUFzUTBGQlF6dEpRVVZFTERaQ1FVRlJMRWRCUVZJc1ZVRkJVeXhGUVVGWkxFVkJRVVVzUlVGQldTeEZRVUZGTEVOQlFWYzdVVUZETlVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF6dFJRVU14UlN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNlVUpCUVhsQ0xFVkJRemxGTEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRnRRaXhEUVVGRExFTkJRVU1zVVVGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNSVUZCYmtZc1EwRkJiVVlzUlVGRGVFWXNWVUZCUVN4RFFVRkRPMWxCUTBjc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZ0UWl4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03V1VGRGRFVXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGdFFpeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRek5DTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTFnc1EwRkJRenRKUVVWRUxEWkNRVUZSTEVkQlFWSXNWVUZCVXl4RlFVRlpMRVZCUVVVc1JVRkJXU3hGUVVGRkxFTkJRVmM3VVVGRE5VTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNlVUpCUVhsQ0xFVkJRemxGTEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRnRRaXhEUVVGRExFTkJRVU1zVVVGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNSVUZCYmtZc1EwRkJiVVlzUlVGRGVFWXNWVUZCUVN4RFFVRkRPMWxCUTBjc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZ0UWl4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03V1VGRGRFVXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGdFFpeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVRkJMRU5CUVVNN1dVRkRlRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU16UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOWUxFTkJRVU03U1VGRlJDeHhRMEZCWjBJc1IwRkJhRUk3VVVGQlFTeHBRa0ZMUXp0UlFVcEhMRTFCUVUwc1EwRkJRenRaUVVOSUxGVkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hMUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRWGhDTEVOQlFYZENPMWxCUTNaRExGVkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hMUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRWGhDTEVOQlFYZENPMU5CUXpGRExFTkJRVU03U1VGRFRpeERRVUZETzBsQlJVOHNORUpCUVU4c1IwRkJaaXhWUVVGblFpeEZRVUZaTEVWQlFVVXNSVUZCV1N4RlFVRkZMRXRCUVdVc1JVRkJSU3hQUVVGcFFpeEZRVU14UlN4VlFVRnZReXhGUVVOd1F5eEZRVUZuUWl4RlFVTm9RaXh0UWtGQmVVUXNSVUZEZWtRc1owSkJRWFZETEVWQlEzWkRMR2xDUVVFNFF6dFJRVVU1UXl4SlFVRkpMRU5CUVVNc2RVSkJRWFZDTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hQUVVGUExFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTTdVVUZETVVRc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU4yUXl4clFrRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRia01zUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc2JVSkJRVzFDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVFUXNRMEZCUXp0UlFVTkVMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1MwRkJTeXhGUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzFGQlF5OURMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03VVVGRGNrTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOMlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRPMWxCUTNaRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRPMGxCUTB3c1EwRkJRenRKUVVWUExEQkNRVUZMTEVkQlFXSXNWVUZCWXl4RlFVRmpMRVZCUVVVc1JVRkJaMElzUlVGQlJTeFJRVUZyUWl4RlFVRkZMRTlCUVdsQ08xRkJRMnBHTEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1lVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTm9ReXhOUVVGTkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VVVGRGRFTXNUVUZCVFN4RFFVRkRMRzFDUVVGdFFpeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMUZCUTNCRExFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0SlFVTnVRaXhEUVVGRE8wbEJRMHdzYVVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCYkV0RUxFbEJhMHRETzBGQmJFdFpMR2REUVVGVkluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwcXVldWVfMSA9IHJlcXVpcmUoXCIuL3BxdWV1ZVwiKTtcbnZhciBOZWlnaGJvdXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5laWdoYm91cihpZCwgZGlzdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxuICAgIHJldHVybiBOZWlnaGJvdXI7XG59KCkpO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUoaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIFF1ZXVlRW50cnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFF1ZXVlRW50cnkobm9kZSwgcHJldiwgZCkge1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgICAgICB0aGlzLmQgPSBkO1xuICAgIH1cbiAgICByZXR1cm4gUXVldWVFbnRyeTtcbn0oKSk7XG52YXIgQ2FsY3VsYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FsY3VsYXRvcihuLCBlcywgZ2V0U291cmNlSW5kZXgsIGdldFRhcmdldEluZGV4LCBnZXRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgdGhpcy5lcyA9IGVzO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBuZXcgQXJyYXkodGhpcy5uKTtcbiAgICAgICAgdmFyIGkgPSB0aGlzLm47XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbaV0gPSBuZXcgTm9kZShpKTtcbiAgICAgICAgaSA9IHRoaXMuZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuZXNbaV07XG4gICAgICAgICAgICB2YXIgdSA9IGdldFNvdXJjZUluZGV4KGUpLCB2ID0gZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICB2YXIgZCA9IGdldExlbmd0aChlKTtcbiAgICAgICAgICAgIHRoaXMubmVpZ2hib3Vyc1t1XS5uZWlnaGJvdXJzLnB1c2gobmV3IE5laWdoYm91cih2LCBkKSk7XG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbdl0ubmVpZ2hib3Vycy5wdXNoKG5ldyBOZWlnaGJvdXIodSwgZCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLkRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgRCA9IG5ldyBBcnJheSh0aGlzLm4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBEW2ldID0gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEQ7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5EaXN0YW5jZXNGcm9tTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoc3RhcnQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKHN0YXJ0LCBlbmQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHByZXZDb3N0KSB7XG4gICAgICAgIHZhciBxID0gbmV3IHBxdWV1ZV8xLlByaW9yaXR5UXVldWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZCA8PSBiLmQ7IH0pLCB1ID0gdGhpcy5uZWlnaGJvdXJzW3N0YXJ0XSwgcXUgPSBuZXcgUXVldWVFbnRyeSh1LCBudWxsLCAwKSwgdmlzaXRlZEZyb20gPSB7fTtcbiAgICAgICAgcS5wdXNoKHF1KTtcbiAgICAgICAgd2hpbGUgKCFxLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHF1ID0gcS5wb3AoKTtcbiAgICAgICAgICAgIHUgPSBxdS5ub2RlO1xuICAgICAgICAgICAgaWYgKHUuaWQgPT09IGVuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV0sIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICBpZiAocXUucHJldiAmJiB2LmlkID09PSBxdS5wcmV2Lm5vZGUuaWQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciB2aWR1aWQgPSB2LmlkICsgJywnICsgdS5pZDtcbiAgICAgICAgICAgICAgICBpZiAodmlkdWlkIGluIHZpc2l0ZWRGcm9tICYmIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPD0gcXUuZClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIGNjID0gcXUucHJldiA/IHByZXZDb3N0KHF1LnByZXYubm9kZS5pZCwgdS5pZCwgdi5pZCkgOiAwLCB0ID0gcXUuZCArIG5laWdoYm91ci5kaXN0YW5jZSArIGNjO1xuICAgICAgICAgICAgICAgIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPSB0O1xuICAgICAgICAgICAgICAgIHEucHVzaChuZXcgUXVldWVFbnRyeSh2LCBxdSwgdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoID0gW107XG4gICAgICAgIHdoaWxlIChxdS5wcmV2KSB7XG4gICAgICAgICAgICBxdSA9IHF1LnByZXY7XG4gICAgICAgICAgICBwYXRoLnB1c2gocXUubm9kZS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5kaWprc3RyYU5laWdoYm91cnMgPSBmdW5jdGlvbiAoc3RhcnQsIGRlc3QpIHtcbiAgICAgICAgaWYgKGRlc3QgPT09IHZvaWQgMCkgeyBkZXN0ID0gLTE7IH1cbiAgICAgICAgdmFyIHEgPSBuZXcgcHF1ZXVlXzEuUHJpb3JpdHlRdWV1ZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5kIDw9IGIuZDsgfSksIGkgPSB0aGlzLm5laWdoYm91cnMubGVuZ3RoLCBkID0gbmV3IEFycmF5KGkpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubmVpZ2hib3Vyc1tpXTtcbiAgICAgICAgICAgIG5vZGUuZCA9IGkgPT09IHN0YXJ0ID8gMCA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgICAgIG5vZGUucSA9IHEucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIXEuZW1wdHkoKSkge1xuICAgICAgICAgICAgdmFyIHUgPSBxLnBvcCgpO1xuICAgICAgICAgICAgZFt1LmlkXSA9IHUuZDtcbiAgICAgICAgICAgIGlmICh1LmlkID09PSBkZXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVvZiB2LnByZXYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaCh2LnByZXYuaWQpO1xuICAgICAgICAgICAgICAgICAgICB2ID0gdi5wcmV2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHUuZCArIG5laWdoYm91ci5kaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAodS5kICE9PSBOdW1iZXIuTUFYX1ZBTFVFICYmIHYuZCA+IHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5kID0gdDtcbiAgICAgICAgICAgICAgICAgICAgdi5wcmV2ID0gdTtcbiAgICAgICAgICAgICAgICAgICAgcS5yZWR1Y2VLZXkodi5xLCB2LCBmdW5jdGlvbiAoZSwgcSkgeyByZXR1cm4gZS5xID0gcTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkO1xuICAgIH07XG4gICAgcmV0dXJuIENhbGN1bGF0b3I7XG59KCkpO1xuZXhwb3J0cy5DYWxjdWxhdG9yID0gQ2FsY3VsYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWMyaHZjblJsYzNSd1lYUm9jeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzTm9iM0owWlhOMGNHRjBhSE11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJRU3h0UTBGQmJVUTdRVUZGYmtRN1NVRkRTU3h0UWtGQmJVSXNSVUZCVlN4RlFVRlRMRkZCUVdkQ08xRkJRVzVETEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhoUVVGUkxFZEJRVklzVVVGQlVTeERRVUZSTzBsQlFVa3NRMEZCUXp0SlFVTXZSQ3huUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4SlFVVkRPMEZCUlVRN1NVRkRTU3hqUVVGdFFpeEZRVUZWTzFGQlFWWXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVONlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVONlFpeERRVUZETzBsQlMwd3NWMEZCUXp0QlFVRkVMRU5CUVVNc1FVRlNSQ3hKUVZGRE8wRkJSVVE3U1VGRFNTeHZRa0ZCYlVJc1NVRkJWU3hGUVVGVExFbEJRV2RDTEVWQlFWTXNRMEZCVXp0UlFVRnlSQ3hUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZOTzFGQlFWTXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVVGVExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWRTdTVUZCUnl4RFFVRkRPMGxCUTJoR0xHbENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRlRSRHRKUVVkSkxHOUNRVUZ0UWl4RFFVRlRMRVZCUVZNc1JVRkJWU3hGUVVGRkxHTkJRVzFETEVWQlFVVXNZMEZCYlVNc1JVRkJSU3hUUVVFNFFqdFJRVUYwU1N4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRVk1zVDBGQlJTeEhRVUZHTEVWQlFVVXNRMEZCVVR0UlFVTXpReXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVN1dVRkJSU3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUZEVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dFpRVU0zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZYTEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVmNzWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJwRkxFbEJRVWtzUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOeVFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZUVRc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRelZFTEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCVlVRc2JVTkJRV01zUjBGQlpEdFJRVU5KTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXhRaXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVNNVFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JETEVOQlFVTTdVVUZEUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVkZFTEhORFFVRnBRaXhIUVVGcVFpeFZRVUZyUWl4TFFVRmhPMUZCUXpOQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdTVUZETVVNc1EwRkJRenRKUVVWRUxIVkRRVUZyUWl4SFFVRnNRaXhWUVVGdFFpeExRVUZoTEVWQlFVVXNSMEZCVnp0UlFVTjZReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTXZReXhEUVVGRE8wbEJTMFFzYlVSQlFUaENMRWRCUVRsQ0xGVkJRMGtzUzBGQllTeEZRVU5pTEVkQlFWY3NSVUZEV0N4UlFVRTRRenRSUVVVNVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMSE5DUVVGaExFTkJRV0VzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRldMRU5CUVZVc1EwRkJReXhGUVVOMlJDeERRVUZETEVkQlFWTXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGRGFFTXNSVUZCUlN4SFFVRmxMRWxCUVVrc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlF5eEpRVUZKTEVWQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNwRExGZEJRVmNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEY2tJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTllMRTlCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVXNRMEZCUXp0WlFVTm1MRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdXVUZEWWl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF6dFpRVU5hTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRaaXhMUVVGTExFTkJRVU03V1VGRFZpeERRVUZETzFsQlEwUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03WjBKQlEzUkRMRWxCUVVrc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpOQ0xFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRk5CUVZNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dG5Ra0ZIZEVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJRenR2UWtGQlF5eFJRVUZSTEVOQlFVTTdaMEpCU1d4RUxFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUXk5Q0xFVkJRVVVzUTBGQlFTeERRVUZETEUxQlFVMHNTVUZCU1N4WFFVRlhMRWxCUVVrc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRM0JFTEZGQlFWRXNRMEZCUXp0blFrRkZZaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEzaEVMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4UlFVRlJMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVWQyUXl4WFFVRlhMRU5CUVVNc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTjRRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnlReXhEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEVsQlFVa3NTVUZCU1N4SFFVRlpMRVZCUVVVc1EwRkJRenRSUVVOMlFpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRaUVVOaUxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRPMWxCUTJJc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRekZDTEVOQlFVTTdVVUZEUkN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZGVHl4MVEwRkJhMElzUjBGQk1VSXNWVUZCTWtJc1MwRkJZU3hGUVVGRkxFbEJRV2xDTzFGQlFXcENMSEZDUVVGQkxFVkJRVUVzVVVGQlowSXNRMEZCUXp0UlFVTjJSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEhOQ1FVRmhMRU5CUVU4c1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZXTEVOQlFWVXNRMEZCUXl4RlFVTnFSQ3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRVZCUXpGQ0xFTkJRVU1zUjBGQllTeEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNdlFpeFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1dVRkRWQ3hKUVVGSkxFbEJRVWtzUjBGQlV5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0JETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zYVVKQlFXbENMRU5CUVVNN1dVRkRjRVFzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlF6RkNMRU5CUVVNN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4RlFVRkZMRU5CUVVNN1dVRkZhRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRMmhDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTmtMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFFSXNTVUZCU1N4SlFVRkpMRWRCUVdFc1JVRkJSU3hEUVVGRE8yZENRVU40UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlExWXNUMEZCVHl4UFFVRlBMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVjBGQlZ5eEZRVUZGTEVOQlFVTTdiMEpCUTI1RExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEY2tJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTJZc1EwRkJRenRuUWtGRFJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMWxCUTJoQ0xFTkJRVU03V1VGRFJDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1owSkJRMnhETEVsQlFVa3NVMEZCVXl4SFFVRkhMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTjBReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJReXhSUVVGUkxFTkJRVU03WjBKQlEycERMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NUVUZCVFN4RFFVRkRMRk5CUVZNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRM1JETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU5TTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU5ZTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVNc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVZBc1EwRkJUeXhEUVVGRExFTkJRVU03WjBKQlEzaERMRU5CUVVNN1dVRkRUQ3hEUVVGRE8xRkJRMHdzUTBGQlF6dFJRVU5FTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJRMHdzYVVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCYWtsRUxFbEJhVWxETzBGQmFrbFpMR2REUVVGVkluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3NpdGlvblN0YXRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb3NpdGlvblN0YXRzKHNjYWxlKSB7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgdGhpcy5BQiA9IDA7XG4gICAgICAgIHRoaXMuQUQgPSAwO1xuICAgICAgICB0aGlzLkEyID0gMDtcbiAgICB9XG4gICAgUG9zaXRpb25TdGF0cy5wcm90b3R5cGUuYWRkVmFyaWFibGUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgYWkgPSB0aGlzLnNjYWxlIC8gdi5zY2FsZTtcbiAgICAgICAgdmFyIGJpID0gdi5vZmZzZXQgLyB2LnNjYWxlO1xuICAgICAgICB2YXIgd2kgPSB2LndlaWdodDtcbiAgICAgICAgdGhpcy5BQiArPSB3aSAqIGFpICogYmk7XG4gICAgICAgIHRoaXMuQUQgKz0gd2kgKiBhaSAqIHYuZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLkEyICs9IHdpICogYWkgKiBhaTtcbiAgICB9O1xuICAgIFBvc2l0aW9uU3RhdHMucHJvdG90eXBlLmdldFBvc24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5BRCAtIHRoaXMuQUIpIC8gdGhpcy5BMjtcbiAgICB9O1xuICAgIHJldHVybiBQb3NpdGlvblN0YXRzO1xufSgpKTtcbmV4cG9ydHMuUG9zaXRpb25TdGF0cyA9IFBvc2l0aW9uU3RhdHM7XG52YXIgQ29uc3RyYWludCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uc3RyYWludChsZWZ0LCByaWdodCwgZ2FwLCBlcXVhbGl0eSkge1xuICAgICAgICBpZiAoZXF1YWxpdHkgPT09IHZvaWQgMCkgeyBlcXVhbGl0eSA9IGZhbHNlOyB9XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51bnNhdGlzZmlhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICB9XG4gICAgQ29uc3RyYWludC5wcm90b3R5cGUuc2xhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVuc2F0aXNmaWFibGUgPyBOdW1iZXIuTUFYX1ZBTFVFXG4gICAgICAgICAgICA6IHRoaXMucmlnaHQuc2NhbGUgKiB0aGlzLnJpZ2h0LnBvc2l0aW9uKCkgLSB0aGlzLmdhcFxuICAgICAgICAgICAgICAgIC0gdGhpcy5sZWZ0LnNjYWxlICogdGhpcy5sZWZ0LnBvc2l0aW9uKCk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uc3RyYWludDtcbn0oKSk7XG5leHBvcnRzLkNvbnN0cmFpbnQgPSBDb25zdHJhaW50O1xudmFyIFZhcmlhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWYXJpYWJsZShkZXNpcmVkUG9zaXRpb24sIHdlaWdodCwgc2NhbGUpIHtcbiAgICAgICAgaWYgKHdlaWdodCA9PT0gdm9pZCAwKSB7IHdlaWdodCA9IDE7IH1cbiAgICAgICAgaWYgKHNjYWxlID09PSB2b2lkIDApIHsgc2NhbGUgPSAxOyB9XG4gICAgICAgIHRoaXMuZGVzaXJlZFBvc2l0aW9uID0gZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLndlaWdodCA9IHdlaWdodDtcbiAgICAgICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgfVxuICAgIFZhcmlhYmxlLnByb3RvdHlwZS5kZmR2ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gMi4wICogdGhpcy53ZWlnaHQgKiAodGhpcy5wb3NpdGlvbigpIC0gdGhpcy5kZXNpcmVkUG9zaXRpb24pO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuYmxvY2sucHMuc2NhbGUgKiB0aGlzLmJsb2NrLnBvc24gKyB0aGlzLm9mZnNldCkgLyB0aGlzLnNjYWxlO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnZpc2l0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChwcmV2LCBmKSB7XG4gICAgICAgIHZhciBmZiA9IGZ1bmN0aW9uIChjLCBuZXh0KSB7IHJldHVybiBjLmFjdGl2ZSAmJiBwcmV2ICE9PSBuZXh0ICYmIGYoYywgbmV4dCk7IH07XG4gICAgICAgIHRoaXMuY091dC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmZihjLCBjLnJpZ2h0KTsgfSk7XG4gICAgICAgIHRoaXMuY0luLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZmKGMsIGMubGVmdCk7IH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFZhcmlhYmxlO1xufSgpKTtcbmV4cG9ydHMuVmFyaWFibGUgPSBWYXJpYWJsZTtcbnZhciBCbG9jayA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2sodikge1xuICAgICAgICB0aGlzLnZhcnMgPSBbXTtcbiAgICAgICAgdi5vZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLnBzID0gbmV3IFBvc2l0aW9uU3RhdHModi5zY2FsZSk7XG4gICAgICAgIHRoaXMuYWRkVmFyaWFibGUodik7XG4gICAgfVxuICAgIEJsb2NrLnByb3RvdHlwZS5hZGRWYXJpYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYuYmxvY2sgPSB0aGlzO1xuICAgICAgICB0aGlzLnZhcnMucHVzaCh2KTtcbiAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh2KTtcbiAgICAgICAgdGhpcy5wb3NuID0gdGhpcy5wcy5nZXRQb3NuKCk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUudXBkYXRlV2VpZ2h0ZWRQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wcy5BQiA9IHRoaXMucHMuQUQgPSB0aGlzLnBzLkEyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh0aGlzLnZhcnNbaV0pO1xuICAgICAgICB0aGlzLnBvc24gPSB0aGlzLnBzLmdldFBvc24oKTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jb21wdXRlX2xtID0gZnVuY3Rpb24gKHYsIHUsIHBvc3RBY3Rpb24pIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRmZHYgPSB2LmRmZHYoKTtcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnModSwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBfZGZkdiA9IF90aGlzLmNvbXB1dGVfbG0obmV4dCwgdiwgcG9zdEFjdGlvbik7XG4gICAgICAgICAgICBpZiAobmV4dCA9PT0gYy5yaWdodCkge1xuICAgICAgICAgICAgICAgIGRmZHYgKz0gX2RmZHYgKiBjLmxlZnQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IF9kZmR2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGZkdiArPSBfZGZkdiAqIGMucmlnaHQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IC1fZGZkdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvc3RBY3Rpb24oYyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGZkdiAvIHYuc2NhbGU7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUucG9wdWxhdGVTcGxpdEJsb2NrID0gZnVuY3Rpb24gKHYsIHByZXYpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnMocHJldiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIG5leHQub2Zmc2V0ID0gdi5vZmZzZXQgKyAobmV4dCA9PT0gYy5yaWdodCA/IGMuZ2FwIDogLWMuZ2FwKTtcbiAgICAgICAgICAgIF90aGlzLmFkZFZhcmlhYmxlKG5leHQpO1xuICAgICAgICAgICAgX3RoaXMucG9wdWxhdGVTcGxpdEJsb2NrKG5leHQsIHYpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uICh2aXNpdCwgYWNjLCB2LCBwcmV2KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh2ID09PSB2b2lkIDApIHsgdiA9IHRoaXMudmFyc1swXTsgfVxuICAgICAgICBpZiAocHJldiA9PT0gdm9pZCAwKSB7IHByZXYgPSBudWxsOyB9XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHByZXYsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICBhY2MucHVzaCh2aXNpdChjKSk7XG4gICAgICAgICAgICBfdGhpcy50cmF2ZXJzZSh2aXNpdCwgYWNjLCBuZXh0LCB2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9sbSh0aGlzLnZhcnNbMF0sIG51bGwsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICBpZiAoIWMuZXF1YWxpdHkgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNQmV0d2VlbiA9IGZ1bmN0aW9uIChsdiwgcnYpIHtcbiAgICAgICAgdGhpcy5jb21wdXRlX2xtKGx2LCBudWxsLCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZmluZFBhdGgobHYsIG51bGwsIHJ2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFjLmVxdWFsaXR5ICYmIGMucmlnaHQgPT09IG5leHQgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZFBhdGggPSBmdW5jdGlvbiAodiwgcHJldiwgdG8sIHZpc2l0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBlbmRGb3VuZCA9IGZhbHNlO1xuICAgICAgICB2LnZpc2l0TmVpZ2hib3VycyhwcmV2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFlbmRGb3VuZCAmJiAobmV4dCA9PT0gdG8gfHwgX3RoaXMuZmluZFBhdGgobmV4dCwgdiwgdG8sIHZpc2l0KSkpIHtcbiAgICAgICAgICAgICAgICBlbmRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmlzaXQoYywgbmV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZW5kRm91bmQ7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuaXNBY3RpdmVEaXJlY3RlZFBhdGhCZXR3ZWVuID0gZnVuY3Rpb24gKHUsIHYpIHtcbiAgICAgICAgaWYgKHUgPT09IHYpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgdmFyIGkgPSB1LmNPdXQubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHUuY091dFtpXTtcbiAgICAgICAgICAgIGlmIChjLmFjdGl2ZSAmJiB0aGlzLmlzQWN0aXZlRGlyZWN0ZWRQYXRoQmV0d2VlbihjLnJpZ2h0LCB2KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBCbG9jay5zcGxpdCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBbQmxvY2suY3JlYXRlU3BsaXRCbG9jayhjLmxlZnQpLCBCbG9jay5jcmVhdGVTcGxpdEJsb2NrKGMucmlnaHQpXTtcbiAgICB9O1xuICAgIEJsb2NrLmNyZWF0ZVNwbGl0QmxvY2sgPSBmdW5jdGlvbiAoc3RhcnRWYXIpIHtcbiAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2soc3RhcnRWYXIpO1xuICAgICAgICBiLnBvcHVsYXRlU3BsaXRCbG9jayhzdGFydFZhciwgbnVsbCk7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnNwbGl0QmV0d2VlbiA9IGZ1bmN0aW9uICh2bCwgdnIpIHtcbiAgICAgICAgdmFyIGMgPSB0aGlzLmZpbmRNaW5MTUJldHdlZW4odmwsIHZyKTtcbiAgICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBicyA9IEJsb2NrLnNwbGl0KGMpO1xuICAgICAgICAgICAgcmV0dXJuIHsgY29uc3RyYWludDogYywgbGI6IGJzWzBdLCByYjogYnNbMV0gfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5tZXJnZUFjcm9zcyA9IGZ1bmN0aW9uIChiLCBjLCBkaXN0KSB7XG4gICAgICAgIGMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBiLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIudmFyc1tpXTtcbiAgICAgICAgICAgIHYub2Zmc2V0ICs9IGRpc3Q7XG4gICAgICAgICAgICB0aGlzLmFkZFZhcmlhYmxlKHYpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9zbiA9IHRoaXMucHMuZ2V0UG9zbigpO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLCBpID0gdGhpcy52YXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLnZhcnNbaV0sIGQgPSB2LnBvc2l0aW9uKCkgLSB2LmRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgICAgIHN1bSArPSBkICogZCAqIHYud2VpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICByZXR1cm4gQmxvY2s7XG59KCkpO1xuZXhwb3J0cy5CbG9jayA9IEJsb2NrO1xudmFyIEJsb2NrcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2tzKHZzKSB7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdmFyIG4gPSB2cy5sZW5ndGg7XG4gICAgICAgIHRoaXMubGlzdCA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2sodnNbbl0pO1xuICAgICAgICAgICAgdGhpcy5saXN0W25dID0gYjtcbiAgICAgICAgICAgIGIuYmxvY2tJbmQgPSBuO1xuICAgICAgICB9XG4gICAgfVxuICAgIEJsb2Nrcy5wcm90b3R5cGUuY29zdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN1bSA9IDAsIGkgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3VtICs9IHRoaXMubGlzdFtpXS5jb3N0KCk7XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIGIuYmxvY2tJbmQgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB0aGlzLmxpc3QucHVzaChiKTtcbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIHN3YXBCbG9jayA9IHRoaXMubGlzdFtsYXN0XTtcbiAgICAgICAgdGhpcy5saXN0Lmxlbmd0aCA9IGxhc3Q7XG4gICAgICAgIGlmIChiICE9PSBzd2FwQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFtiLmJsb2NrSW5kXSA9IHN3YXBCbG9jaztcbiAgICAgICAgICAgIHN3YXBCbG9jay5ibG9ja0luZCA9IGIuYmxvY2tJbmQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgbCA9IGMubGVmdC5ibG9jaywgciA9IGMucmlnaHQuYmxvY2s7XG4gICAgICAgIHZhciBkaXN0ID0gYy5yaWdodC5vZmZzZXQgLSBjLmxlZnQub2Zmc2V0IC0gYy5nYXA7XG4gICAgICAgIGlmIChsLnZhcnMubGVuZ3RoIDwgci52YXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgci5tZXJnZUFjcm9zcyhsLCBjLCBkaXN0KTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbC5tZXJnZUFjcm9zcyhyLCBjLCAtZGlzdCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZik7XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLnVwZGF0ZUJsb2NrUG9zaXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYikgeyByZXR1cm4gYi51cGRhdGVXZWlnaHRlZFBvc2l0aW9uKCk7IH0pO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5zcGxpdCA9IGZ1bmN0aW9uIChpbmFjdGl2ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZUJsb2NrUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIuZmluZE1pbkxNKCk7XG4gICAgICAgICAgICBpZiAodiAhPT0gbnVsbCAmJiB2LmxtIDwgU29sdmVyLkxBR1JBTkdJQU5fVE9MRVJBTkNFKSB7XG4gICAgICAgICAgICAgICAgYiA9IHYubGVmdC5ibG9jaztcbiAgICAgICAgICAgICAgICBCbG9jay5zcGxpdCh2KS5mb3JFYWNoKGZ1bmN0aW9uIChuYikgeyByZXR1cm4gX3RoaXMuaW5zZXJ0KG5iKTsgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlKGIpO1xuICAgICAgICAgICAgICAgIGluYWN0aXZlLnB1c2godik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIEJsb2Nrcztcbn0oKSk7XG5leHBvcnRzLkJsb2NrcyA9IEJsb2NrcztcbnZhciBTb2x2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvbHZlcih2cywgY3MpIHtcbiAgICAgICAgdGhpcy52cyA9IHZzO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdi5jSW4gPSBbXSwgdi5jT3V0ID0gW107XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIGNzLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIGMubGVmdC5jT3V0LnB1c2goYyk7XG4gICAgICAgICAgICBjLnJpZ2h0LmNJbi5wdXNoKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IGNzLm1hcChmdW5jdGlvbiAoYykgeyBjLmFjdGl2ZSA9IGZhbHNlOyByZXR1cm4gYzsgfSk7XG4gICAgICAgIHRoaXMuYnMgPSBudWxsO1xuICAgIH1cbiAgICBTb2x2ZXIucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJzLmNvc3QoKTtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2V0U3RhcnRpbmdQb3NpdGlvbnMgPSBmdW5jdGlvbiAocHMpIHtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IHRoaXMuY3MubWFwKGZ1bmN0aW9uIChjKSB7IGMuYWN0aXZlID0gZmFsc2U7IHJldHVybiBjOyB9KTtcbiAgICAgICAgdGhpcy5icyA9IG5ldyBCbG9ja3ModGhpcy52cyk7XG4gICAgICAgIHRoaXMuYnMuZm9yRWFjaChmdW5jdGlvbiAoYiwgaSkgeyByZXR1cm4gYi5wb3NuID0gcHNbaV07IH0pO1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zZXREZXNpcmVkUG9zaXRpb25zID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHRoaXMudnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5kZXNpcmVkUG9zaXRpb24gPSBwc1tpXTsgfSk7XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLm1vc3RWaW9sYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1pblNsYWNrID0gTnVtYmVyLk1BWF9WQUxVRSwgdiA9IG51bGwsIGwgPSB0aGlzLmluYWN0aXZlLCBuID0gbC5sZW5ndGgsIGRlbGV0ZVBvaW50ID0gbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjID0gbFtpXTtcbiAgICAgICAgICAgIGlmIChjLnVuc2F0aXNmaWFibGUpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgc2xhY2sgPSBjLnNsYWNrKCk7XG4gICAgICAgICAgICBpZiAoYy5lcXVhbGl0eSB8fCBzbGFjayA8IG1pblNsYWNrKSB7XG4gICAgICAgICAgICAgICAgbWluU2xhY2sgPSBzbGFjaztcbiAgICAgICAgICAgICAgICB2ID0gYztcbiAgICAgICAgICAgICAgICBkZWxldGVQb2ludCA9IGk7XG4gICAgICAgICAgICAgICAgaWYgKGMuZXF1YWxpdHkpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkZWxldGVQb2ludCAhPT0gbiAmJlxuICAgICAgICAgICAgKG1pblNsYWNrIDwgU29sdmVyLlpFUk9fVVBQRVJCT1VORCAmJiAhdi5hY3RpdmUgfHwgdi5lcXVhbGl0eSkpIHtcbiAgICAgICAgICAgIGxbZGVsZXRlUG9pbnRdID0gbFtuIC0gMV07XG4gICAgICAgICAgICBsLmxlbmd0aCA9IG4gLSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2O1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zYXRpc2Z5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5icyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmJzID0gbmV3IEJsb2Nrcyh0aGlzLnZzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJzLnNwbGl0KHRoaXMuaW5hY3RpdmUpO1xuICAgICAgICB2YXIgdiA9IG51bGw7XG4gICAgICAgIHdoaWxlICgodiA9IHRoaXMubW9zdFZpb2xhdGVkKCkpICYmICh2LmVxdWFsaXR5IHx8IHYuc2xhY2soKSA8IFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgJiYgIXYuYWN0aXZlKSkge1xuICAgICAgICAgICAgdmFyIGxiID0gdi5sZWZ0LmJsb2NrLCByYiA9IHYucmlnaHQuYmxvY2s7XG4gICAgICAgICAgICBpZiAobGIgIT09IHJiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYi5pc0FjdGl2ZURpcmVjdGVkUGF0aEJldHdlZW4odi5yaWdodCwgdi5sZWZ0KSkge1xuICAgICAgICAgICAgICAgICAgICB2LnVuc2F0aXNmaWFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNwbGl0ID0gbGIuc3BsaXRCZXR3ZWVuKHYubGVmdCwgdi5yaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHNwbGl0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMuaW5zZXJ0KHNwbGl0LmxiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5pbnNlcnQoc3BsaXQucmIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJzLnJlbW92ZShsYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5hY3RpdmUucHVzaChzcGxpdC5jb25zdHJhaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHYudW5zYXRpc2ZpYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodi5zbGFjaygpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmFjdGl2ZS5wdXNoKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2F0aXNmeSgpO1xuICAgICAgICB2YXIgbGFzdGNvc3QgPSBOdW1iZXIuTUFYX1ZBTFVFLCBjb3N0ID0gdGhpcy5icy5jb3N0KCk7XG4gICAgICAgIHdoaWxlIChNYXRoLmFicyhsYXN0Y29zdCAtIGNvc3QpID4gMC4wMDAxKSB7XG4gICAgICAgICAgICB0aGlzLnNhdGlzZnkoKTtcbiAgICAgICAgICAgIGxhc3Rjb3N0ID0gY29zdDtcbiAgICAgICAgICAgIGNvc3QgPSB0aGlzLmJzLmNvc3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29zdDtcbiAgICB9O1xuICAgIFNvbHZlci5MQUdSQU5HSUFOX1RPTEVSQU5DRSA9IC0xZS00O1xuICAgIFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgPSAtMWUtMTA7XG4gICAgcmV0dXJuIFNvbHZlcjtcbn0oKSk7XG5leHBvcnRzLlNvbHZlciA9IFNvbHZlcjtcbmZ1bmN0aW9uIHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbihzcGFucywgbG93ZXJCb3VuZCwgdXBwZXJCb3VuZCkge1xuICAgIHZhciB2cyA9IHNwYW5zLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IFZhcmlhYmxlKHMuZGVzaXJlZENlbnRlcik7IH0pO1xuICAgIHZhciBjcyA9IFtdO1xuICAgIHZhciBuID0gc3BhbnMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbiAtIDE7IGkrKykge1xuICAgICAgICB2YXIgbGVmdCA9IHNwYW5zW2ldLCByaWdodCA9IHNwYW5zW2kgKyAxXTtcbiAgICAgICAgY3MucHVzaChuZXcgQ29uc3RyYWludCh2c1tpXSwgdnNbaSArIDFdLCAobGVmdC5zaXplICsgcmlnaHQuc2l6ZSkgLyAyKSk7XG4gICAgfVxuICAgIHZhciBsZWZ0TW9zdCA9IHZzWzBdLCByaWdodE1vc3QgPSB2c1tuIC0gMV0sIGxlZnRNb3N0U2l6ZSA9IHNwYW5zWzBdLnNpemUgLyAyLCByaWdodE1vc3RTaXplID0gc3BhbnNbbiAtIDFdLnNpemUgLyAyO1xuICAgIHZhciB2TG93ZXIgPSBudWxsLCB2VXBwZXIgPSBudWxsO1xuICAgIGlmIChsb3dlckJvdW5kKSB7XG4gICAgICAgIHZMb3dlciA9IG5ldyBWYXJpYWJsZShsb3dlckJvdW5kLCBsZWZ0TW9zdC53ZWlnaHQgKiAxMDAwKTtcbiAgICAgICAgdnMucHVzaCh2TG93ZXIpO1xuICAgICAgICBjcy5wdXNoKG5ldyBDb25zdHJhaW50KHZMb3dlciwgbGVmdE1vc3QsIGxlZnRNb3N0U2l6ZSkpO1xuICAgIH1cbiAgICBpZiAodXBwZXJCb3VuZCkge1xuICAgICAgICB2VXBwZXIgPSBuZXcgVmFyaWFibGUodXBwZXJCb3VuZCwgcmlnaHRNb3N0LndlaWdodCAqIDEwMDApO1xuICAgICAgICB2cy5wdXNoKHZVcHBlcik7XG4gICAgICAgIGNzLnB1c2gobmV3IENvbnN0cmFpbnQocmlnaHRNb3N0LCB2VXBwZXIsIHJpZ2h0TW9zdFNpemUpKTtcbiAgICB9XG4gICAgdmFyIHNvbHZlciA9IG5ldyBTb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuZXdDZW50ZXJzOiB2cy5zbGljZSgwLCBzcGFucy5sZW5ndGgpLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wb3NpdGlvbigpOyB9KSxcbiAgICAgICAgbG93ZXJCb3VuZDogdkxvd2VyID8gdkxvd2VyLnBvc2l0aW9uKCkgOiBsZWZ0TW9zdC5wb3NpdGlvbigpIC0gbGVmdE1vc3RTaXplLFxuICAgICAgICB1cHBlckJvdW5kOiB2VXBwZXIgPyB2VXBwZXIucG9zaXRpb24oKSA6IHJpZ2h0TW9zdC5wb3NpdGlvbigpICsgcmlnaHRNb3N0U2l6ZVxuICAgIH07XG59XG5leHBvcnRzLnJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbiA9IHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWRuQnpZeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzWndjMk11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJTVHRKUVV0SkxIVkNRVUZ0UWl4TFFVRmhPMUZCUVdJc1ZVRkJTeXhIUVVGTUxFdEJRVXNzUTBGQlVUdFJRVXBvUXl4UFFVRkZMRWRCUVZjc1EwRkJReXhEUVVGRE8xRkJRMllzVDBGQlJTeEhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVTm1MRTlCUVVVc1IwRkJWeXhEUVVGRExFTkJRVU03U1VGRmIwSXNRMEZCUXp0SlFVVndReXh0UTBGQlZ5eEhRVUZZTEZWQlFWa3NRMEZCVnp0UlFVTnVRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCUXpWQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRUlzU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU40UWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMR1ZCUVdVc1EwRkJRenRSUVVOMlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlF6VkNMRU5CUVVNN1NVRkZSQ3dyUWtGQlR5eEhRVUZRTzFGQlEwa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF6dEpRVU42UXl4RFFVRkRPMGxCUTB3c2IwSkJRVU03UVVGQlJDeERRVUZETEVGQmJrSkVMRWxCYlVKRE8wRkJia0paTEhORFFVRmhPMEZCY1VJeFFqdEpRVXRKTEc5Q1FVRnRRaXhKUVVGakxFVkJRVk1zUzBGQlpTeEZRVUZUTEVkQlFWY3NSVUZCVXl4UlFVRjVRanRSUVVGNlFpeDVRa0ZCUVN4RlFVRkJMR2RDUVVGNVFqdFJRVUUxUml4VFFVRkpMRWRCUVVvc1NVRkJTU3hEUVVGVk8xRkJRVk1zVlVGQlN5eEhRVUZNTEV0QlFVc3NRMEZCVlR0UlFVRlRMRkZCUVVjc1IwRkJTQ3hIUVVGSExFTkJRVkU3VVVGQlV5eGhRVUZSTEVkQlFWSXNVVUZCVVN4RFFVRnBRanRSUVVndlJ5eFhRVUZOTEVkQlFWa3NTMEZCU3l4RFFVRkRPMUZCUTNoQ0xHdENRVUZoTEVkQlFWa3NTMEZCU3l4RFFVRkRPMUZCUnpOQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4RFFVRkRPMUZCUTJZc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eFJRVUZSTEVOQlFVTTdTVUZETjBJc1EwRkJRenRKUVVWRUxEQkNRVUZMTEVkQlFVdzdVVUZEU1N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRk5CUVZNN1dVRkRlRU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWM3YTBKQlEyNUVMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03U1VGRGFrUXNRMEZCUXp0SlFVTk1MR2xDUVVGRE8wRkJRVVFzUTBGQlF5eEJRV3BDUkN4SlFXbENRenRCUVdwQ1dTeG5RMEZCVlR0QlFXMUNka0k3U1VGTlNTeHJRa0ZCYlVJc1pVRkJkVUlzUlVGQlV5eE5RVUZyUWl4RlFVRlRMRXRCUVdsQ08xRkJRVFZETEhWQ1FVRkJMRVZCUVVFc1ZVRkJhMEk3VVVGQlV5eHpRa0ZCUVN4RlFVRkJMRk5CUVdsQ08xRkJRVFZGTEc5Q1FVRmxMRWRCUVdZc1pVRkJaU3hEUVVGUk8xRkJRVk1zVjBGQlRTeEhRVUZPTEUxQlFVMHNRMEZCV1R0UlFVRlRMRlZCUVVzc1IwRkJUQ3hMUVVGTExFTkJRVms3VVVGTUwwWXNWMEZCVFN4SFFVRlhMRU5CUVVNc1EwRkJRenRKUVVzclJTeERRVUZETzBsQlJXNUhMSFZDUVVGSkxFZEJRVW83VVVGRFNTeE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETzBsQlEzaEZMRU5CUVVNN1NVRkZSQ3d5UWtGQlVTeEhRVUZTTzFGQlEwa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzBsQlF6bEZMRU5CUVVNN1NVRkhSQ3hyUTBGQlpTeEhRVUZtTEZWQlFXZENMRWxCUVdNc1JVRkJSU3hEUVVFd1F6dFJRVU4wUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhWUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQmRrTXNRMEZCZFVNc1EwRkJRenRSUVVNNVJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZrTEVOQlFXTXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRV0lzUTBGQllTeERRVUZETEVOQlFVTTdTVUZEZUVNc1EwRkJRenRKUVVOTUxHVkJRVU03UVVGQlJDeERRVUZETEVGQmRFSkVMRWxCYzBKRE8wRkJkRUpaTERSQ1FVRlJPMEZCZDBKeVFqdEpRVTFKTEdWQlFWa3NRMEZCVnp0UlFVeDJRaXhUUVVGSkxFZEJRV1VzUlVGQlJTeERRVUZETzFGQlRXeENMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEySXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1VVRkRja01zU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVONFFpeERRVUZETzBsQlJVOHNNa0pCUVZjc1IwRkJia0lzVlVGQmIwSXNRMEZCVnp0UlFVTXpRaXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTm1MRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1pDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0SlFVTnNReXhEUVVGRE8wbEJSMFFzYzBOQlFYTkNMRWRCUVhSQ08xRkJRMGtzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEzcERMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRE5VTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JETEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0SlFVTnNReXhEUVVGRE8wbEJSVThzTUVKQlFWVXNSMEZCYkVJc1ZVRkJiVUlzUTBGQlZ5eEZRVUZGTEVOQlFWY3NSVUZCUlN4VlFVRnBRenRSUVVFNVJTeHBRa0ZqUXp0UlFXSkhMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0UlFVTndRaXhEUVVGRExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSk8xbEJRM3BDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRXRCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNSVUZCUlN4VlFVRlZMRU5CUVVNc1EwRkJRenRaUVVOcVJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTI1Q0xFbEJRVWtzU1VGQlNTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03WjBKQlF6ZENMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETzFsQlEycENMRU5CUVVNN1dVRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dG5Ra0ZEU2l4SlFVRkpMRWxCUVVrc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRPMmRDUVVNNVFpeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRMnhDTEVOQlFVTTdXVUZEUkN4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRTQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNN1NVRkRNVUlzUTBGQlF6dEpRVVZQTEd0RFFVRnJRaXhIUVVFeFFpeFZRVUV5UWl4RFFVRlhMRVZCUVVVc1NVRkJZenRSUVVGMFJDeHBRa0ZOUXp0UlFVeEhMRU5CUVVNc1EwRkJReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrN1dVRkROVUlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFsQlF6ZEVMRXRCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZGtJc1MwRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGSFJDeDNRa0ZCVVN4SFFVRlNMRlZCUVZNc1MwRkJOa0lzUlVGQlJTeEhRVUZWTEVWQlFVVXNRMEZCTUVJc1JVRkJSU3hKUVVGdFFqdFJRVUZ1Unl4cFFrRkxRenRSUVV4dFJDeHJRa0ZCUVN4RlFVRkJMRWxCUVdNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZCUlN4eFFrRkJRU3hGUVVGQkxGZEJRVzFDTzFGQlF5OUdMRU5CUVVNc1EwRkJReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrN1dVRkROVUlzUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4TFFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUlVGQlJTeEhRVUZITEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1pETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTFBc1EwRkJRenRKUVV0RUxIbENRVUZUTEVkQlFWUTdVVUZEU1N4SlFVRkpMRU5CUVVNc1IwRkJaU3hKUVVGSkxFTkJRVU03VVVGRGVrSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1JVRkJSU3hWUVVGQkxFTkJRVU03V1VGRGFrTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeEpRVUZKTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUXpGRUxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEwZ3NUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRlR5eG5RMEZCWjBJc1IwRkJlRUlzVlVGQmVVSXNSVUZCV1N4RlFVRkZMRVZCUVZrN1VVRkRMME1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxHTkJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VNc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEySXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSk8xbEJRMmhETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdaMEpCUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU01UlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUlU4c2QwSkJRVkVzUjBGQmFFSXNWVUZCYVVJc1EwRkJWeXhGUVVGRkxFbEJRV01zUlVGQlJTeEZRVUZaTEVWQlFVVXNTMEZCTWtNN1VVRkJka2NzYVVKQlZVTTdVVUZVUnl4SlFVRkpMRkZCUVZFc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRGNrSXNRMEZCUXl4RFFVRkRMR1ZCUVdVc1EwRkJReXhKUVVGSkxFVkJRVVVzVlVGQlF5eERRVUZETEVWQlFVVXNTVUZCU1R0WlFVTTFRaXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRWxCUVVrc1MwRkJTeXhGUVVGRkxFbEJRVWtzUzBGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUTNCRkxFTkJRVU03WjBKQlEwY3NVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJRenRuUWtGRGFFSXNTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU51UWl4RFFVRkRPMUZCUTB3c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeE5RVUZOTEVOQlFVTXNVVUZCVVN4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGSlJDd3lRMEZCTWtJc1IwRkJNMElzVlVGQk5FSXNRMEZCVnl4RlFVRkZMRU5CUVZjN1VVRkRhRVFzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTTdVVUZEZWtJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRkRUlzVDBGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFbEJRVWtzUTBGQlF5d3lRa0ZCTWtJc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVONlJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUTNCQ0xFTkJRVU03VVVGRFJDeE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGSFRTeFhRVUZMTEVkQlFWb3NWVUZCWVN4RFFVRmhPMUZCUzNSQ0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTJwQ0xFMUJRVTBzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExHZENRVUZuUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6ZEZMRU5CUVVNN1NVRkZZeXh6UWtGQlowSXNSMEZCTDBJc1ZVRkJaME1zVVVGQmEwSTdVVUZET1VNc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVUlzUTBGQlF5eERRVUZETEd0Q1FVRnJRaXhEUVVGRExGRkJRVkVzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTnlReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEySXNRMEZCUXp0SlFVZEVMRFJDUVVGWkxFZEJRVm9zVlVGQllTeEZRVUZaTEVWQlFVVXNSVUZCV1R0UlFVdHVReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMklzU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4TlFVRk5MRU5CUVVNc1JVRkJSU3hWUVVGVkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRMjVFTEVOQlFVTTdVVUZGUkN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZGUkN3eVFrRkJWeXhIUVVGWUxGVkJRVmtzUTBGQlVTeEZRVUZGTEVOQlFXRXNSVUZCUlN4SlFVRlpPMUZCUXpkRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUXpWRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJFSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1NVRkJTU3hKUVVGSkxFTkJRVU03V1VGRGFrSXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU40UWl4RFFVRkRPMUZCUTBRc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wbEJRMnhETEVOQlFVTTdTVUZGUkN4dlFrRkJTU3hIUVVGS08xRkJRMGtzU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnNReXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZEVkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTm9RaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhsUVVGbExFTkJRVU03V1VGRGVrTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTTFRaXhEUVVGRE8xRkJRMFFzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXp0SlFVTm1MRU5CUVVNN1NVRlRUQ3haUVVGRE8wRkJRVVFzUTBGQlF5eEJRV3hMUkN4SlFXdExRenRCUVd4TFdTeHpRa0ZCU3p0QlFXOUxiRUk3U1VGSFNTeG5Ra0ZCYlVJc1JVRkJZenRSUVVGa0xFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWazdVVUZETjBJc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM3BDTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRaUVVOVUxFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzcENMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJwQ0xFTkJRVU1zUTBGQlF5eFJRVUZSTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTI1Q0xFTkJRVU03U1VGRFRDeERRVUZETzBsQlJVUXNjVUpCUVVrc1IwRkJTanRSUVVOSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVNc1QwRkJUeXhEUVVGRExFVkJRVVU3V1VGQlJTeEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0UlFVTjJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETzBsQlEyWXNRMEZCUXp0SlFVVkVMSFZDUVVGTkxFZEJRVTRzVlVGQlR5eERRVUZSTzFGQlNWZ3NRMEZCUXl4RFFVRkRMRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTTVRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVV0MFFpeERRVUZETzBsQlJVUXNkVUpCUVUwc1IwRkJUaXhWUVVGUExFTkJRVkU3VVVGTFdDeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYUVNc1NVRkJTU3hUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOb1F5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGVFSXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYkVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRWRCUVVjc1UwRkJVeXhEUVVGRE8xbEJRMnhETEZOQlFWTXNRMEZCUXl4UlFVRlJMRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF6dFJRVWx3UXl4RFFVRkRPMGxCUTB3c1EwRkJRenRKUVVsRUxITkNRVUZMTEVkQlFVd3NWVUZCVFN4RFFVRmhPMUZCUTJZc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCU1hoRExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03VVVGRGJFUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaERMRU5CUVVNc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVNeFFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMjVDTEVOQlFVTTdVVUZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOS0xFTkJRVU1zUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6TkNMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYmtJc1EwRkJRenRKUVV0TUxFTkJRVU03U1VGRlJDeDNRa0ZCVHl4SFFVRlFMRlZCUVZFc1EwRkJaME03VVVGRGNFTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVkRUxIRkRRVUZ2UWl4SFFVRndRanRSUVVOSkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEhOQ1FVRnpRaXhGUVVGRkxFVkJRVEZDTEVOQlFUQkNMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNjMEpCUVVzc1IwRkJUQ3hWUVVGTkxGRkJRWE5DTzFGQlFUVkNMR2xDUVdWRE8xRkJaRWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzFsQlEzUkNMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU51UkN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdaMEpCUTJwQ0xFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUlVGQlJTeEpRVUZGTEU5QlFVRXNTMEZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlppeERRVUZsTEVOQlFVTXNRMEZCUXp0blFrRkROVU1zUzBGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFppeFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJTM0pDTEVOQlFVTTdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGdlFrd3NZVUZCUXp0QlFVRkVMRU5CUVVNc1FVRnNTRVFzU1VGclNFTTdRVUZzU0Zrc2QwSkJRVTA3UVVGdlNHNUNPMGxCVDBrc1owSkJRVzFDTEVWQlFXTXNSVUZCVXl4RlFVRm5RanRSUVVGMlF5eFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRlpPMUZCUVZNc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQll6dFJRVU4wUkN4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5pTEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMUlzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZKTlVJc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOaUxFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTFJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0JDTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVbDRRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEVsQlFVa3NRMEZCUXl4UlFVRlJMRWRCUVVjc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU3l4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0xUkN4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU51UWl4RFFVRkRPMGxCUlVRc2NVSkJRVWtzUjBGQlNqdFJRVU5KTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlF6RkNMRU5CUVVNN1NVRkpSQ3h4UTBGQmIwSXNSMEZCY0VJc1ZVRkJjVUlzUlVGQldUdFJRVU0zUWl4SlFVRkpMRU5CUVVNc1VVRkJVU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGTExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJwRkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzFGQlF6bENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGa0xFTkJRV01zUTBGQlF5eERRVUZETzBsQlF6bERMRU5CUVVNN1NVRkZSQ3h2UTBGQmJVSXNSMEZCYmtJc1ZVRkJiMElzUlVGQldUdFJRVU0xUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hEUVVGRExFTkJRVU1zWlVGQlpTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJla0lzUTBGQmVVSXNRMEZCUXl4RFFVRkRPMGxCUTNwRUxFTkJRVU03U1VFeVFrOHNOa0pCUVZrc1IwRkJjRUk3VVVGRFNTeEpRVUZKTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhGUVVNelFpeERRVUZETEVkQlFXVXNTVUZCU1N4RlFVTndRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZEYWtJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlExb3NWMEZCVnl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOd1FpeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5pTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhoUVVGaExFTkJRVU03WjBKQlFVTXNVVUZCVVN4RFFVRkRPMWxCUXpsQ0xFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRaUVVOMFFpeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hKUVVGSkxFdEJRVXNzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVF5eFJRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPMmRDUVVOcVFpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVOT0xGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNN2IwSkJRVU1zUzBGQlN5eERRVUZETzFsQlF6RkNMRU5CUVVNN1VVRkRUQ3hEUVVGRE8xRkJRMFFzUlVGQlJTeERRVUZETEVOQlFVTXNWMEZCVnl4TFFVRkxMRU5CUVVNN1dVRkRha0lzUTBGQlF5eFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMR1ZCUVdVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRMjVGTEVOQlFVTTdXVUZEUnl4RFFVRkRMRU5CUVVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNeFFpeERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGNrSXNRMEZCUXp0UlFVTkVMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFlpeERRVUZETzBsQlNVUXNkMEpCUVU4c1IwRkJVRHRSUVVOSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVOc1F5eERRVUZETzFGQlNVUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpkQ0xFbEJRVWtzUTBGQlF5eEhRVUZsTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhQUVVGUExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEdWQlFXVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyeEhMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVMHhReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFdpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU55UWl4RFFVRkRPMWxCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03WjBKQlEwb3NSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExESkNRVUV5UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRmJFUXNRMEZCUXl4RFFVRkRMR0ZCUVdFc1IwRkJSeXhKUVVGSkxFTkJRVU03YjBKQlEzWkNMRkZCUVZFc1EwRkJRenRuUWtGRFlpeERRVUZETzJkQ1FVVkVMRWxCUVVrc1MwRkJTeXhIUVVGSExFVkJRVVVzUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdaMEpCUXpkRExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5xUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN2IwSkJRM3BDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRla0lzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03YjBKQlEyNUNMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRuUWtGRGVrTXNRMEZCUXp0blFrRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dHZRa0ZKU2l4RFFVRkRMRU5CUVVNc1lVRkJZU3hIUVVGSExFbEJRVWtzUTBGQlF6dHZRa0ZEZGtJc1VVRkJVU3hEUVVGRE8yZENRVU5pTEVOQlFVTTdaMEpCUTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlMycENMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNeFFpeERRVUZETzJkQ1FVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yOUNRVWxLTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhEUVVGRE8xbEJRMHdzUTBGQlF6dFJRVTFNTEVOQlFVTTdTVUZKVEN4RFFVRkRPMGxCUjBRc2MwSkJRVXNzUjBGQlREdFJRVU5KTEVsQlFVa3NRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRSUVVObUxFbEJRVWtzVVVGQlVTeEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUVVVc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1VVRkRka1FzVDBGQlR5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdXVUZEWml4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRMmhDTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzFGQlF6RkNMRU5CUVVNN1VVRkRSQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRndTMDBzTWtKQlFXOUNMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRE4wSXNjMEpCUVdVc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF6dEpRVzlMY0VNc1lVRkJRenREUVVGQkxFRkJla3RFTEVsQmVVdERPMEZCZWt0WkxIZENRVUZOTzBGQmFVeHVRaXh4UTBGQk5FTXNTMEZCWjBRc1JVRkJSU3hWUVVGdFFpeEZRVUZGTEZWQlFXMUNPMGxCUjJ4SkxFbEJRVTBzUlVGQlJTeEhRVUZsTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeEpRVUZKTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1lVRkJZU3hEUVVGRExFVkJRVGRDTEVOQlFUWkNMRU5CUVVNc1EwRkJRenRKUVVOeVJTeEpRVUZOTEVWQlFVVXNSMEZCYVVJc1JVRkJSU3hEUVVGRE8wbEJRelZDTEVsQlFVMHNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGRrSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZETjBJc1NVRkJUU3hKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpWRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpWRkxFTkJRVU03U1VGRFJDeEpRVUZOTEZGQlFWRXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMnhDTEZOQlFWTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVU55UWl4WlFVRlpMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUTJoRExHRkJRV0VzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZETVVNc1NVRkJTU3hOUVVGTkxFZEJRV0VzU1VGQlNTeEZRVUZGTEUxQlFVMHNSMEZCWVN4SlFVRkpMRU5CUVVNN1NVRkRja1FzUlVGQlJTeERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOaUxFMUJRVTBzUjBGQlJ5eEpRVUZKTEZGQlFWRXNRMEZCUXl4VlFVRlZMRVZCUVVVc1VVRkJVU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTXhSQ3hGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUTJoQ0xFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1RVRkJUU3hGUVVGRkxGRkJRVkVzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpWRUxFTkJRVU03U1VGRFJDeEZRVUZGTEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMklzVFVGQlRTeEhRVUZITEVsQlFVa3NVVUZCVVN4RFFVRkRMRlZCUVZVc1JVRkJSU3hUUVVGVExFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpORUxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRhRUlzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhUUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRPVVFzUTBGQlF6dEpRVU5FTEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTm9ReXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdTVUZEWml4TlFVRk5MRU5CUVVNN1VVRkRTQ3hWUVVGVkxFVkJRVVVzUlVGQlJTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNSVUZCV2l4RFFVRlpMRU5CUVVNN1VVRkROVVFzVlVGQlZTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1VVRkJVU3hGUVVGRkxFZEJRVWNzV1VGQldUdFJRVU16UlN4VlFVRlZMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eFJRVUZSTEVWQlFVVXNSMEZCUnl4aFFVRmhPMHRCUTJoR0xFTkJRVU03UVVGRFRpeERRVUZETzBGQmFFTkVMR3RGUVdkRFF5SjkiXX0=
