var $table = null;

function Array2DTracer(module) {
    if (Tracer.call(this, module || Array2DTracer)) {
        initTable();
        return true;
    }
    return false;
}

Array2DTracer.prototype = Object.create(Tracer.prototype);
Array2DTracer.prototype.constructor = Array2DTracer;

// Override
Array2DTracer.prototype.resize = function () {
    Tracer.prototype.resize.call(this);

    this.refresh();
};

// Override
Array2DTracer.prototype.clear = function () {
    Tracer.prototype.clear.call(this);

    clearTableColor();
};

var Array2D = {
    random: function (N, M, min, max) {
        if (!N) N = 10;
        if (!M) M = 10;
        if (min === undefined) min = 1;
        if (max === undefined) max = 9;
        var D = [];
        for (var i = 0; i < N; i++) {
            D.push([]);
            for (var j = 0; j < M; j++) {
                D[i].push((Math.random() * (max - min + 1) | 0) + min);
            }
        }
        return D;
    }
};

// Override
Array2DTracer.prototype._setData = function (D) {
    this.D = D;
    this.viewX = this.viewY = 0;
    this.paddingH = 6;
    this.paddingV = 3;
    this.fontSize = 16;

    if (Tracer.prototype._setData.call(this, arguments)) {
        $('.mtbl-row').each(function (i) {
            $(this).children().each(function (j) {
                $(this).text(D[i][j]);
            });
        });
        return true;
    }

    $table.empty();
    for (var i = 0; i < D.length; i++) {
        var $row = $('<div class="mtbl-row">');
        $table.append($row);
        for (var j = 0; j < D[i].length; j++) {
            var $cell = $('<div class="mtbl-cell">')
                .css(this.getCellCss())
                .text(D[i][j]);
            $row.append($cell);
        }
    }
    this.resize();

    return false;
};

Array2DTracer.prototype._notify = function (x1, y1, x2, y2) {
    var second = x2 !== undefined && y2 !== undefined;
    this.pushStep({type: 'notifying', x: x1, y: y1, value: this.D[x1][y1]}, !second);
    if (second) this.pushStep({type: 'notifying', x: x2, y: y2, value: this.D[x2][y2]}, true);
    this.pushStep({type: 'notified', x: x1, y: y1}, false);
    if (second) this.pushStep({type: 'notified', x: x2, y: y2}, false);
};

Array2DTracer.prototype._select = function (sx, sy, ex, ey) {
    this.pushSelectingStep('select', null, arguments);
};

Array2DTracer.prototype._selectRow = function (x, sy, ey) {
    this.pushSelectingStep('select', 'row', arguments);
};

Array2DTracer.prototype._selectCol = function (y, sx, ex) {
    this.pushSelectingStep('select', 'col', arguments);
};

Array2DTracer.prototype._selectSet = function (coords) {
    this.pushSelectingStep('select', 'set', arguments);
};

Array2DTracer.prototype._deselect = function (sx, sy, ex, ey) {
    this.pushSelectingStep('deselect', null, arguments);
};

Array2DTracer.prototype._deselectRow = function (x, sy, ey) {
    this.pushSelectingStep('deselect', 'row', arguments);
};

Array2DTracer.prototype._deselectCol = function (y, sx, ex) {
    this.pushSelectingStep('deselect', 'col', arguments);
};

Array2DTracer.prototype._deselectSet = function (coords) {
    this.pushSelectingStep('deselect', 'set', arguments);
};

Array2DTracer.prototype.pushSelectingStep = function () {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var mode = args.shift();
    args = Array.prototype.slice.call(args.shift());
    var coord;
    switch (mode) {
        case 'row':
            coord = {x: args[0], sy: args[1], ey: args[2]};
            break;
        case 'col':
            coord = {y: args[0], sx: args[1], ex: args[2]};
            break;
        case 'set':
            coord = {coords: args[0]};
            break;
        default:
            if (args[2] === undefined && args[3] === undefined) {
                coord = {x: args[0], y: args[1]};
            } else {
                coord = {sx: args[0], sy: args[1], ex: args[2], ey: args[3]};
            }
    }
    var step = {type: type};
    $.extend(step, coord);
    this.pushStep(step, type == 'select');
};

Array2DTracer.prototype.processStep = function (step, options) {
    switch (step.type) {
        case 'notifying':
            var $row = $table.find('.mtbl-row').eq(step.x);
            $row.find('.mtbl-cell').eq(step.y).text(step.value);
        case 'notified':
        case 'select':
        case 'deselect':
            var colorClass = step.type == 'select' || step.type == 'deselect' ? tableColorClass.selected : tableColorClass.notifying;
            var addClass = step.type == 'select' || step.type == 'notifying';
            if (step.coords) {
                step.coords.forEach(function (coord) {
                    var x = coord.x;
                    var y = coord.y;
                    paintColor(x, y, x, y, colorClass, addClass);
                });
            } else {
                var sx = step.sx;
                var sy = step.sy;
                var ex = step.ex;
                var ey = step.ey;
                if (sx === undefined) sx = step.x;
                if (sy === undefined) sy = step.y;
                if (ex === undefined) ex = step.x;
                if (ey === undefined) ey = step.y;
                paintColor(sx, sy, ex, ey, colorClass, addClass);
            }
            break;
    }
};

Array2DTracer.prototype.getCellCss = function () {
    return {
        padding: this.paddingV.toFixed(1) + 'px ' + this.paddingH.toFixed(1) + 'px',
        'font-size': this.fontSize.toFixed(1) + 'px'
    };
};

// Override
Array2DTracer.prototype.refresh = function () {
    Tracer.prototype.refresh.call(this);

    var $parent = $table.parent();
    var top = $parent.height() / 2 - $table.height() / 2 + this.viewY;
    var left = $parent.width() / 2 - $table.width() / 2 + this.viewX;
    $table.css('margin-top', top);
    $table.css('margin-left', left);
};

// Override
Array2DTracer.prototype.prevStep = function () {
    this.clear();
    $('#tab_trace .wrapper').empty();
    var finalIndex = this.traceIndex - 1;
    if (finalIndex < 0) {
        this.traceIndex = -1;
        return;
    }
    for (var i = 0; i < finalIndex; i++) {
        this.step(i, {virtual: true});
    }
    this.step(finalIndex);
};

// Override
Array2DTracer.prototype.mousedown = function (e) {
    Tracer.prototype.mousedown.call(this, e);

    this.dragX = e.pageX;
    this.dragY = e.pageY;
    this.dragging = true;
};

// Override
Array2DTracer.prototype.mousemove = function (e) {
    Tracer.prototype.mousemove.call(this, e);

    if (this.dragging) {
        this.viewX += e.pageX - this.dragX;
        this.viewY += e.pageY - this.dragY;
        this.dragX = e.pageX;
        this.dragY = e.pageY;
        this.refresh();
    }
};

// Override
Array2DTracer.prototype.mouseup = function (e) {
    Tracer.prototype.mouseup.call(this, e);

    this.dragging = false;
};

// Override
Array2DTracer.prototype.mousewheel = function (e) {
    Tracer.prototype.mousewheel.call(this, e);

    e.preventDefault();
    e = e.originalEvent;
    var delta = (e.wheelDelta !== undefined && e.wheelDelta) ||
        (e.detail !== undefined && -e.detail);
    var weight = 1.01;
    var ratio = delta > 0 ? 1 / weight : weight;
    if (this.fontSize < 4 && ratio < 1) return;
    if (this.fontSize > 40 && ratio > 1) return;
    this.paddingV *= ratio;
    this.paddingH *= ratio;
    this.fontSize *= ratio;
    $('.mtbl-cell').css(this.getCellCss());
    this.refresh();
};

var initTable = function () {
    $table = $('<div class="mtbl-table">');
    $module_container.append($table);
};

var paintColor = function (sx, sy, ex, ey, colorClass, addClass) {
    for (var i = sx; i <= ex; i++) {
        var $row = $table.find('.mtbl-row').eq(i);
        for (var j = sy; j <= ey; j++) {
            var $cell = $row.find('.mtbl-cell').eq(j);
            if (addClass) $cell.addClass(colorClass);
            else $cell.removeClass(colorClass);
        }
    }
};

var clearTableColor = function () {
    $table.find('.mtbl-cell').removeClass(Object.keys(tableColorClass).join(' '));
};

var tableColorClass = {
    selected: 'selected',
    notifying: 'notifying'
};