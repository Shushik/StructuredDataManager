/**
 * Tree structured data manager (ex b-finder)
 *
 * @page    https://github.com/Shushik/StructuredDataManager
 * @author  Shushik <silkleopard@yandex.ru>
 * @version 2.0
 */
var SDM = SDM || (function() {

    /**
     * @constructor
     *
     * @property parent
     * @property document
     * @function Gui
     * @function Log
     * @function Events
     *
     * @param {object} args
     */
    function
        self(args) {
            // Always return an instance of module
            if (!(this instanceof self)) {
                return new self(args);
            }

            // Try to reach the arguments object
            args = typeof args == 'object' ? args : {};

            // Register an instance
            self.prototype.id++;
            this.id = typeof args.id == 'string' ? args.id : self.prototype.id + '';
            self[this.id] = this;

            // Init module
            this.init(args);

            // Init submodules
            this.gui    = self.Gui(this.args);
            this.events = self.Events(this.gui.root, this.events);

            // Set mousedown event
            this.events.sub('mousedown', this._binded.live);

            // Load data for the root column
            if (this.args.load_ttl) {
                this.load();
            }
        }

    /**
     * Local window link
     *
     * @static
     *
     * @type {object}
     */
    self.parent = this;

    /**
     * Local document link
     *
     * @static
     *
     * @type {object}
     */
    self.document = this.document;

    /**
     * @property _queue
     * @property _binded
     * @property _timers
     * @property id
     * @property gui
     * @property args
     * @property events
     * @property holded
     * @property opened
     * @property pulling
     * @function _live
     * @function _pull
     * @function _failed
     * @function _pulled
     * @function _opened
     * @function _keydown
     * @function _mousedown
     * @function back
     * @function drop
     * @function hide
     * @function hold
     * @function init
     * @function kill
     * @function load
     * @function move
     * @function next
     * @function open
     * @function pull
     * @function push
     * @function quit
     * @function show
     * @function shut
     * @function step
     */
    self.prototype = {
        /**
         * Common loading indicator
         *
         * @type {boolean}
         */
        pulling : false,
        /**
         * Instance id
         *
         * @type {number}
         */
        id : 0,
        /**
         * Loading processes queue
         *
         * @private
         *
         * @type {string}
         */
        _queue : '',
        /**
         * Selected rows ids
         *
         * @type {string}
         */
        holded : '',
        /**
         * Currently cursored row id
         *
         * @type {string}
         */
        opened : '',
        /**
         * Binded instance methods stack
         *
         * @private
         *
         * @type {object}
         */
        _binded : null,
        /**
         * Timers ids stack
         *
         * @private
         *
         * @type {object}
         */
        _timers : null,
        /**
         * Gui operations module instance
         *
         * @type {object}
         */
        gui : null,
        /**
         * Initial arguments stack
         *
         * @type {object}
         */
        args : null,
        /**
         * Events operations module instance
         *
         * @type {object}
         */
        events : null,
        /**
         * DOM events router
         *
         * @private
         *
         * @param {object} event
         *
         * @return {object}
         */
        _live : function(event) {
            var
                ctrl = event.ctrlKey || event.metaKey ? true : false,
                code = event.keyCode ? event.keyCode : event.which,
                type = event.type,
                part = event.target.className,
                node = event.target;

            // Parse Gui part name
            part = node == self.document.body ? 'sdm__root' : part;
            part = part ? part.match(/^sdm(__\S+)*[\s\S]*/) : null;

            // Get a short Gui part name
            part = part[0].replace(/\s[\s\S]*$/, '').replace(/sdm__/, '');

            if (this['_' + type]) {
                this['_' + type]({
                    ctrl : ctrl,
                    code : code,
                    part : part,
                    node : node,
                    root : event
                });
            }

            return this;
        },
        /**
         * Start data loading process
         *
         * @private
         */
        _pull : function() {
            var
                id   = '',
                what = '',
                args = null;

            // Get the id and action alias
            if (
                (what = this._queue.split(/;/)) &&
                what.length &&
                (what = what[0].split(':'))
            ) {
                id   = what[0];
                what = what[1];
            } else {
                return;
            }

            if (this.args[what + '_ttl']) {
                // Set a timeout for a waiting action
                if (this.args[what + '_ttl']) {
                    this._timers.pull = self.parent.setTimeout(
                        this._binded.failed,
                        this.args[what + '_ttl'] * 1000
                    );
                }

                // Turn the progress bar off
                this.gui.wait(true);

                // Set the pulling process indicator
                this.pulling = true;

                // Create the event arguments event
                args = {
                    id   : id,
                    done : this._binded.pulled,
                    fail : this._binded.failed,
                    hide : this._binded.hide,
                    show : this._binded.show
                }

                // Tell subscribers the action has been started
                this.events.pub(what + 'start', args);
            } else if (this['_' + what + 'ed']) {
                this['_' + what + 'ed']();
            }
        },
        /**
         * Common error handler
         *
         * @param {undefined|string} text
         *
         * @return {object}
         */
        _failed : function(text) {
            var
                id    = '',
                what  = '',
                row   = null,
                queue = null;

            if (
                this.pulling &&
                (queue = this._queue.split(/;/)) &&
                queue.length &&
                (what = queue.shift().split(':'))
            ) {
                // Get the id and action alias
                id   = what[0];
                what = what[1];

                // Clear the timer
                self.parent.clearTimeout(this._timers.pull)
                this._timers.pull = undefined;

                // Update the queue
                this._queue = queue.join(';');

                // Tell subscribers the action has been finished
                this.events.pub((what + 'finish'), {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });

                // Turn the progress bar off
                this.gui.wait(false);

                // Reset the pulling process indicator
                this.pulling = false;

                // 
                if (what == 'hold') {
                    this.drop(id);
                }

                // Load next item in queue
                if (queue.length) {
                    this._pull();
                }
            }

            // Throw an error message
            self.Log(text);

            return this;
        },
        /**
         * Finish the data loading process
         *
         * @private
         *
         * @param {object} data
         */
        _pulled : function(data) {
            var
                id    = '',
                what  = '',
                queue = null;

            if ((
                this.pulling &&
                (queue = this._queue.split(/;/)) &&
                queue.length &&
                (what = queue.shift().split(':'))
            )) {
                // Get the id and action alias
                id   = what[0];
                what = what[1];

                // Clear the timer
                self.parent.clearTimeout(this._timers.pull)
                this._timers.pull = undefined;

                // Update the queue
                this._queue = queue.join(';');

                // Tell subscribers the action has been finished
                this.events.pub((what + 'finish'), {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });

                // Turn the progress bar off
                this.gui.wait(false);

                // Reset the pulling process indicator
                this.pulling = false;

                // Add the rows
                if (what != 'hold' && data) {
                    this.push(id, data);
                }

                // Run the attached finishing action
                if (this['_' + what + 'ed']) {
                    this['_' + what + 'ed']();
                }

                // Load next item in queue
                if (queue.length) {
                    this._pull();
                }
            }
        },
        /**
         * Finish the opening of subitems process
         *
         * @private
         *
         * @param {undefined|object} data
         */
        _opened : function(data) {
            var
                rows = null;

            // Show the row subcontent if exists
            if (rows = this.gui.rows['..'][this.opened]) {
                rows.className += ' sdm__rows_are_opened';
                rows.parentNode.className += ' sdm__col_is_opened';
            }
        },
        /**
         * Keydown event handler
         *
         * @param {object} event
         */
        _keydown : function(event) {
            switch (event.code) {
                // 
                case 13:
                    this.hold(this.opened, event.ctrl);
                break;
                // 
                case 27:
                    this.hide();
                break;
                // 
                case 37:
                    event.root.preventDefault();
                    this.quit();
                break;
                // 
                case 38:
                    event.root.preventDefault();
                    this.back();
                break;
                // 
                case 39:
                    event.root.preventDefault();
                    this.step();
                break;
                // 
                case 40:
                    event.root.preventDefault();
                    this.next();
                break;
            }
        },
        /**
         * Mousedown event handler
         *
         * @param {object} event
         */
        _mousedown : function(event) {
            switch (event.part) {
                // 
                case 'row':
                    if (this._timers.open) {
                        // Cancel the cursor set
                        self.parent.clearTimeout(this._timers.open);
                        this._timers.open = undefined;

                        // Select a row
                        this.hold(this.opened, event.ctrl);

                        return;
                    }

                    // Get the id for the cursor
                    this.opened = event.node.getAttribute('data-id');

                    // Delay the cursor set
                    this._timers.open = self.parent.setTimeout(
                        this._binded.open,
                        150
                    );
                break;
                // 
                case 'hide': case 'sdm':
                    this.hide();
                break;
            }
        },
        /**
         * Set a visual cursor to the previous row
         *
         * @return {object}
         */
        back : function() {
            var
                id  = this.opened,
                row = this.gui.rows[id];

            if (row && (row = row.previousSibling)) {
                this.open(row.getAttribute('data-id'));
            } else if (
                !id &&
                (row = this.gui.rows['..']['-']) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(row.getAttribute('data-id'));
            }

            return this;
        },
        /**
         * Deselect a row
         *
         * @param {undefined|string} id
         *
         * @return {object}
         */
        drop : function(id) {
            var
                it0  = 0,
                ids  = '',
                row  = null,
                rows = id ? [this.gui.rows[id]] : this.gui.root.querySelectorAll('.sdm__row_is_holded');

            if (rows && (it0 = rows.length) > 0) {
                while (--it0 > -1) {
                    row = rows[it0];
                    row.className = row.className.replace(/\ssdm__row_is_holded/, '');

                    id = row.getAttribute('data-id');

                    this.holded = this.holded.replace(new RegExp('(^|;)' + id, ''));

                    // Call external actions
                    this.pull(id, 'drop');
                }
            }

            return this;
        },
        /**
         * Hide module
         *
         * @return {object}
         */
        hide : function() {
            // Hide Gui window
            this.gui.hide();

            // Reset Gui keydown event
            this.events.off('keydown', this._binded.lived);

            return this;
        },
        /**
         * Select a row
         *
         * @param {string}  id
         * @param {boolean} add
         *
         * @return {object}
         */
        hold : function(id, add) {
            var
                row = this.gui.rows[id];

            // Don't hold nonexistent and disabled rows
            if (!row || row.className.indexOf('_data_dead') != -1) {
                return this;
            }

            // Set a cursor
            if (row.className.indexOf('_is_opened') == -1) {
                this.open(id);
            }

            // Unhold the row if it's already holded
            if (this.holded.match(new RegExp('(^|;)' + id))) {
                return this.drop(id);
            } else if (!add) {
                this.drop();
            }

            // Save current row id
            this.holded += (this.holded ? ';' : '') + id;

            // Make a visible selection
            row.className += ' sdm__row_is_holded';

            // Call external actions
            this.pull(id, 'hold');

            return this;
        },
        /**
         * Init the module
         *
         * @param {object} args
         *
         * @return {object}
         */
        init : function(args) {
            var
                al0     = '',
                event   = '',
                limit   = '',
                ttls    = {drop : 5, find : 5, hold : 5, load : 5, open : 5},
                wrapper = null;

            // Try to fetch the wrapper DOM node
            if (args.wrapper instanceof HTMLElement) {
                wrapper = args.wrapper;
            } else if (typeof args.wrapper == 'string') {
                wrapper = self.document.querySelector(args.wrapper);
            } else {
                wrapper = self.document.body;
            }

            // Reset ids, indicators and stacks
            this.pulling = false;
            this._queue  = '';
            this.holded  = '';
            this.opened  = '';
            this._events = [];
            this._timers = {};

            // Parse, filter and save given arguments
            this.args = {
                hold_cls : args.hold_cls ? true : false,
                cols_num : args.cols_num > 1 && args.cols_num < 6 ? args.cols_num : 3,
                hide_txt : args.hide_txt ? args.hide_txt + '' : '',
                hint_txt : args.hint_txt ?
                           args.hint_txt + '' :
                           'Single click — expand; double click — select; ' +
                           'Ctrl + double click — multi select or Cmd + double click; ' +
                           'Esc — close',
                name_txt : args.name_txt ? args.name_txt + '' : '',
                wrapper  : wrapper
            };

            // 
            this.events = {};

            // Save time limits for main events
            for (al0 in ttls) {
                event = 'on' + al0 + 'start';
                limit = al0 + '_ttl';

                // Check if the start event handler is set
                if (typeof args[event] == 'function') {
                    this.args[limit] = args[limit] > ttls[al0] ?
                                       args[limit] :
                                       ttls[al0];

                    this.events[event] = args[event];
                }
            }

            // Create the proxied methods links stack
            this._binded = {
                hide   : this.hide.bind(this),
                live   : this._live.bind(this),
                open   : this.open.bind(this),
                show   : this.show.bind(this),
                failed : this._failed.bind(this),
                pulled : this._pulled.bind(this)
            };

            return this;
        },
        /**
         * Destroy an instance
         */
        kill : function() {
            var
                al0 = '';

            // Hide module
            this.hide();

            // Clear binded methods links
            for (al0 in this._binded) {
                this._binded[al0] = null;
            }

            this._binded = null;

            // Clear timers
            for (al0 in this._timers) {
                self.parent.clearTimeout(this._timers[al0]);
                this._timers[al0] = undefined;
            }

            this._timers = null;

            // Clear events
            this.events.kill();

            // Clear GUI
            this.gui.kill();

            // Clear this item
            self[this.id] = null;
        },
        /**
         * Load the initial rows data
         */
        load : function() {
            if (!this.gui.cols.length) {
                this.pull('-', 'load');
            }
        },
        /**
         * Scroll to the chosen column
         *
         * @private
         */
        move : function() {
            var
                col = null,
                row = this.gui.rows[this.opened];

            if (row) {
                // Get the previous or the current column
                col = row.parentNode.parentNode;
                col = col.previousSibling ? col.previousSibling : col;

                // Horisontal scrolling
                col.parentNode.scrollLeft = 0;
                col.parentNode.scrollLeft = col.offsetLeft;

                // Vertical scrolling
                row.parentNode.scrollTop = 0;
                row.parentNode.scrollTop = row.offsetTop;
            }
        },
        /**
         * Set a visual cursor to the next row
         *
         * @return {object}
         */
        next : function() {
            var
                id  = this.opened,
                row = this.gui.rows[id];

            if (row && (row = row.nextSibling)) {
                this.open(row.getAttribute('data-id'));
            } else if (
                !id &&
                (row = this.gui.rows['..']['-']) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(row.getAttribute('data-id'));
            }

            return this;
        },
        /**
         * Set a cursor to the row
         *
         * @param {string} id
         *
         * @return {object}
         */
        open : function(id) {
            var
                col = null,
                row = null;

            // Remove mousedown timer id
            this._timers.open = undefined;

            // Set the current row id
            if (typeof id == 'string') {
                this.opened = id;
            } else if (!this.opened) {
                this.opened = id = this.gui.rows['..'].firstChild.getAttribute('data-id');
            }

            // Don't go further if this row already has been selected
            if (!(row = this.gui.rows[this.opened])) {
                return this;
            }

            // Hide rows and columns
            this.shut();

            //  Switch between the different row behavior
            switch (row.className.replace(/[\s\S]*(data_(html|load|rows)(\s|$))[\s\S]*/g, '$2')) {
                // Load subitems
                case 'load':
                    // Set the loading status for row
                    row.className = row.className.replace(/_data_load/, '_data_loading');

                    // Run external actions
                    this.pull(this.opened, 'open');
                break;
                // Show subitems
                case 'html':
                case 'rows':
                    // Finish the opening of subitems process immediately
                    this._opened();
                break;
            }

            // Select all rows in chain
            while (row) {
                row.className += ' sdm__row_is_opened';
                row.parentNode.className += ' sdm__rows_are_opened';
                row.parentNode.parentNode.className += ' sdm__col_is_opened';

                // Get the parent row
                row = this.gui.rows[row.parentNode.getAttribute('data-id')];
            }

            // Scroll to the chosen column
            this.move();

            return this;
        },
        /**
         * Pull external data
         *
         * @param {string} id
         * @param {string} what
         *
         * @return {object}
         */
        pull : function(id, what) {
            what = typeof what == 'string' ? what : 'load';

            if (typeof id != 'string' && id != '-') {
                return this;
            }

            if (this.args[what + '_ttl']) {
                // Save the row id and process name into queue stack
                if (!this._queue.match(new RegExp('(^|;)' + id + ':' + what))) {
                    this._queue += (this._queue ? ';' : '') + id + ':' + what;
                }

                // Try to run the first element in stack
                if (!this.pulling) {
                    this._pull();
                }
            } else if (this['_' + what + 'ed']) {
                this['_' + what + 'ed']();
            }

            return this;
        },
        /**
         * Add the rows
         *
         * @param {string} id
         * @param {object} data
         *
         * @return {object}
         */
        push : function(id, data) {
            var
                accepted = false,
                it0      = 0,
                type     = typeof data,
                row      = this.gui.rows[id];

            if (!(accepted = type.match(/(string|object)/) ? true : false)) {
                return this;
            }

            // Get a row
            row = this.gui.rows[id];

            // Tell subscribers the rendering has been started
            this.events.pub('drawstart', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });

            if (row) {
                // Get the columns deep level
                it0 = row.parentNode.parentNode.getAttribute('data-id');
                it0 -= 0;
                it0 += 1;
            }

            // Create cols and rows
            if (accepted) {
                this.gui.push(data, id, it0);
            }

            // Tell subscribers the rendering has been finished
            this.events.pub('drawfinish', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });

            return this;
        },
        /**
         * Set the visual cursor to the parent row
         */
        quit : function() {
            var
                id  = this.opened,
                row = this.gui.rows[id];

            if (row && (id = row.parentNode.getAttribute('data-id'))) {
                if (id != '-') {
                    row.className = row.className.replace(/\s*sdm__row_is_opened/, '');
    
                    if (
                        (row = this.gui.rows[id])
                    ) {
                        this.open(row.getAttribute('data-id'));
                    }
                }
            }

            return this;
        },
        /**
         * Show module
         *
         * @return {object}
         */
        show : function() {
            // Show Gui window
            this.gui.show();

            // Set Gui keydown event
            this.events.sub('keydown', this._binded.live);

            return this;
        },
        /**
         * Hide rows and columns
         *
         * @return {object}
         */
        shut : function() {
            var
                it0 = 0,
                tm0 = ['sdm__row_is_opened', 'sdm__rows_are_opened', 'sdm__col_is_opened'],
                tm1 = this.gui.root.querySelectorAll('.' + tm0.join(',.')),
                tm2 = null;

            if (it0 = tm1.length) {
                while (--it0 > -1) {
                    tm2 = tm1[it0];
                    tm2.className = tm2.className.replace(
                                        new RegExp('\\s(' + tm0.join('|') + ')'),
                                    '');
                }
            }

            return this;
        },
        /**
         * Set the visual cursor to the first child row
         */
        step : function() {
            var
                id  = this.opened,
                row = null;

            if (
                id &&
                (row = this.gui.rows['..'][id]) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(row.getAttribute('data-id'));
            }

            return this;
        }
    };

    return self;

})();



/**
 * Gui operations module
 */
SDM.Gui = SDM.Gui || (function() {

    /**
     * @constructor
     *
     * @property parent
     * @function create
     *
     * @param {object} args
     */
    function
        self(args) {
            // Always return an instance of module
            if (!(this instanceof self)) {
                return new self(args);
            }

            var
                node = args.wrapper;

            // DOM root
            node = this.root = self.create({
                className : 'sdm'
            }, node);

            // Name text
            node = self.create({
                className : 'sdm__unit'
            }, node);

            // Name text
            self.create({
                title     : args.name_txt,
                className : 'sdm__name'
            }, node);

            // Name text
            self.create({
                title     : args.name_txt,
                className : 'sdm__wait'
            }, node);

            // Hide control
            self.create({
                title     : args.hide_txt,
                className : 'sdm__hide'
            }, node);

            // Hint text
            self.create({
                title     : args.hint_txt,
                className : 'sdm__hint'
            }, node);

            // Columns stack
            this.cols = [];
            this.cols['..'] = self.create({
                className : 'sdm__cols',
                data      : {limit : args.cols_num}
            }, node);

            // Rows and groups stack
            this.rows = {'..' : {}};
        }

    /**
     * Link to a parent module
     *
     * @static
     *
     * @type {object}
     */
    self.parent = this;

    /**
     * Create a DOM node using given arguments and append it
     *
     * @static
     *
     * @param {object}           args
     * @param {undefined|object} save
     * @param {undefined|object} before
     */
    self.create = function(args, save, before) {
        args = typeof args == 'object' ? args : {};

        var
            it0  = 0,
            ln0  = 0,
            al0  = '',
            al1  = '',
            node = self.parent.document.createElement(
                       typeof args.tagName == 'string' ?
                       args.tagName :
                       'div'
                   );

        // Read properties for node
        for (al0 in args) {
            if (al0 == 'data') {
                // Set the node data-attributes
                for (al1 in args.data) {
                    node.setAttribute('data-' + al1, args.data[al1]);
                }
            } else if (!al0.match(/tagName/)) {
                // Set the node property
                node[al0] = args[al0];
            }
        }

        // Save the compiled node
        if (save instanceof HTMLElement) {
            if (before instanceof HTMLElement) {
                save.insertBefore(node, before);
            } else {
                save.appendChild(node);
            }
        }

        return node;
    }

    /**
     * @property cols
     * @property mode
     * @property root
     * @property rows
     * @function _box
     * @function _col
     * @function _row
     * @function push
     * @function find
     * @function hide
     * @function turn
     * @function show
     * @function wait
     */
    self.prototype = {
        /**
         * Available modes list
         *
         * @type {string}
         */
        mode : 'search,observe',
        /**
         * Stack of created cols and cols wrapper
         *
         * @type {object}
         */
        cols : null,
        /**
         * Root DOM element
         *
         * @type {object}
         */
        root : null,
        /**
         * Stack of created rows and rows groups
         *
         * @type {object}
         */
        rows : null,
        /**
         * Add a row content preview
         *
         * @private
         *
         * @param {object} data
         */
        _box : function(data) {
            // Create a row group if not exist
            if (!this.rows['..'][data.pid]) {
                this.rows['..'][data.pid] = self.create({
                    className : 'sdm__rows',
                    data      : {id : data.pid}
                }, this.cols[data.deep]);
            }

            // Create a row
            this.rows[data.id] = self.create({
                className : 'sdm__box',
                innerHTML : data.html,
                data      : {id : data.id}
            }, this.rows['..'][data.pid]);
        },
        /**
         * Add a column
         *
         * @private
         *
         * @param {number} deep
         */
        _col : function(deep) {
            var
                ln0 = this.cols.length;

            // Create the needed number of columns
            if (deep >= ln0) {
                this.cols[ln0] = self.create({
                    className : 'sdm__col',
                    data      : {id : deep}
                }, this.cols['..']);
            }
        },
        /**
         * Add a row
         *
         * @private
         *
         * @param {object} data
         */
        _row : function(data) {
            // Create a row group if not exist
            if (!this.rows['..'][data.pid]) {
                this.rows['..'][data.pid] = self.create({
                    className : 'sdm__rows',
                    data      : {id : data.pid}
                }, this.cols[data.deep]);
            }

            // Create a row
            this.rows[data.id] = self.create({
                title     : data.name,
                className : 'sdm__row' + (data.dead ? ' sdm__row_data_dead' : ''),
                data      : {id : data.id, seek : data.seek}
            }, this.rows['..'][data.pid]);
        },
        /**
         * Remove an instance
         */
        kill : function() {
        },
        /**
         * Create cols and rows
         *
         * @param {object} data
         * @param {number} pid
         * @param {number} _deep
         */
        push : function(data, pid, _deep) {
            pid  = pid ? pid : '-';

            var
                it0    = -1,
                deep   = _deep && typeof _deep == 'number' ? _deep : 0,
                type   = typeof data,
                item   = null,
                parent = this.rows[pid];

            // 
            if (parent && parent.className.indexOf('_data_loading')) {
                parent.className = parent.className.replace(
                    /\s*sdm__row_data_loading/,
                    ''
                );
            }

            // Switch before
            switch (type) {
                // Create a row
                case 'object':
                    if (parent) {
                        parent.className += ' sdm__row_data_rows';
                    }

                    while (++it0 < data.length) {
                        item = data[it0];

                        this._col(deep);
                        this._row({
                            dead : item.dead ? true : false,
                            deep : deep,
                            id   : item.id,
                            pid  : pid,
                            name : item.name,
                            seek : item.seek ? item.seek : item.name.toLowerCase()
                        });

                        if (item.data) {
                            this.push(item.data, item.id, deep + 1);
                        }
                    }
                break;
                // Create html preview
                case 'string':
                    if (parent) {
                        parent.className += ' sdm__row_data_html';
                    }

                    this._col(deep);
                    this._box({
                        deep : deep,
                        pid  : pid,
                        html : data
                    });
                    
                break;
                // Subcontent should be loaded
                case 'boolean':
                    if (parent && type) {
                        parent.className += ' sdm__row_data_load';
                    }
                break;
                // Throw an error message
                default:
                    self.parent.Log('Data should be String or Array');
                break;
            }
        },
        /**
         * Turn Gui window into search mode
         */
        find : function() {
            this.turn('search');
        },
        /**
         * Hide Gui window
         */
        hide : function() {
            this.root.className = this.root.className.
                                  replace(new RegExp(
                                      '\\ssdm_mode_(' +
                                      this.mode.replace(/,/, '|') +
                                      ')',
                                      'g'
                                  ), '');
        },
        /**
         * Change Gui window mode
         *
         * @param {string} mode
         */
        turn : function(mode) {
            // Hide Gui window
            this.hide();

            // Check if the given mode exists
            if (typeof mode == 'string' && this.mode.indexOf(mode) > -1) {
                this.root.className += ' sdm_mode_' + mode;
            }
        },
        /**
         * Show Gui window
         */
        show : function() {
            this.turn('observe');
        },
        /**
         * Show or hide progressbar
         *
         * @param {boolean} won
         */
        wait : function(won) {
            var
                ch0 = this.root.className.indexOf('_is_waiting') != -1 ? true : false;

            if (won && !ch0) {
                this.root.className += ' sdm_is_waiting';
            } else if (ch0) {
                this.root.className = this.root.className.
                                      replace(/\s*sdm_is_waiting/, '');
            }
        }
    };

    return self;

}).call(SDM);



/**
 * Common tools
 */
SDM.Log = SDM.Log || (function() {

    /**
     * @static
     *
     * @property dev
     * @property list
     * @property parent
     *
     * @param {string} text
     */
    function
        self(text) {
            self.list += (self.list ? ';' : '') + text;

            if (self.dev) {
                throw new Error(text);
            }
        }

    /**
     * Development mode indicator
     *
     * @static
     *
     * @type {dev}
     */
    self.dev = false;

    /**
     * Errors messages stack
     *
     * @static
     *
     * @type {object}
     */
    self.list = '';

    /**
     * Link to a parent module
     *
     * @static
     *
     * @type {object}
     */
    self.parent = this;

    return self;

}).call(SDM);



/**
 * Events tools
 */
SDM.Events = SDM.Events || (function() {

    /**
     * @constructor
     *
     * @property _auto
     * @property parent
     * @function off
     * @function pub
     * @function sub
     *
     * @param {object} root
     * @param {object} handlers
     */
    function
        self(root, handlers) {
            // Always return an instance of module
            if (!(this instanceof self)) {
                return new self(root, handlers);
            }

            var
                it0     = 0,
                event   = '',
                handler = '',
                events  = self._auto.split(';');

            // Setup main properties
            this._root = root;
            this._list = [];

            // Save autoevents
            it0 = events.length;

            while (--it0 > -1) {
                event   = events[it0];
                handler = 'on' + event;

                if (handlers[handler]) {
                    this.sub(event, handlers[handler]);
                }
            }
        }

    /**
     * Available events list
     *
     * @static
     * @private
     *
     * @type {string}
     */
    self._auto = 'drawstart;drawfinish;' +
                 'dropstart;dropfinish;' +
                 'holdstart;holdfinish;' +
                 'loadstart;loadfinish;' +
                 'openstart;openfinish;' +
                 'shutstart;shutfinish';

    /**
     * Link to a parent module
     *
     * @static
     *
     * @type {object}
     */
    self.parent = this;

    /**
     * Remove the custom event subscription
     *
     * @static
     *
     * @param {object}   node
     * @param {string}   type
     * @param {function} func
     */
    self.off = function(node, type, func) {
        node.removeEventListener(type, func);
    }

    /**
     * Fire a custom event
     *
     * @static
     *
     * @param {object}   node
     * @param {string}   type
     * @param {function} func
     */
    self.pub = function(node, type, data) {
        data = typeof data == 'object' ? data : {};

        var
            event = self.parent.document.createEvent('CustomEvent');

        event.initCustomEvent(type, false, false, data);
        node.dispatchEvent(event);
    }

    /**
     * Subscribe to a custom event
     *
     * @static
     *
     * @param {object}   node
     * @param {string}   type
     * @param {function} func
     *
     * @return {object}
     */
    self.sub = function(node, type, func) {
        node.addEventListener(type, func);
    }

    /**
     * @property _list
     * @property _root
     * @function off
     * @function pub
     * @function sub
     * @function kill
     */
    self.prototype = {
        /**
         * Saved events handlers stack (for clean removing)
         *
         * @private
         *
         * @type {object}
         */
        _list : null,
        /**
         * Instance DOM root
         *
         * @private
         *
         * @type {object}
         */
        _root : null,
        /**
         * Remove an event
         *
         * @param {string} event
         */
        off : function(event) {
            var
                it0    = 0,
                it1    = 0,
                alias  = '',
                saved  = null,
                events = event.split(' ');

            if (it0 = events.length) {
                while (--it0 > -1) {
                    it1   = this._list.length;
                    alias = events[it0];

                    while (--it1 > -1) {
                        saved = this._list[it1];

                        if (saved.event == alias) {
                            self.off(
                                saved.event.indexOf('key') == 0 ? self.parent.document.body : this._root,
                                saved.event,
                                saved.handler
                            );

                            this._list.splice(it1, 1);
                        }
                    }
                }
            }
        },
        /**
         * Fire an event
         *
         * @param {string} event
         * @param {object} data
         */
        pub : function(event, data) {
            var
                it0    = 0,
                alias  = '',
                events = event.split(' ');

            if ((it0 = events.length) && typeof data == 'object') {
                while (--it0 > -1) {
                    alias = events[it0];

                    self.pub(
                        alias.indexOf('key') == 0 ? self.parent.document.body : this._root,
                        alias,
                        data
                    );
                }
            }
        },
        /**
         * Subscribe to an event
         *
         * @param {string}   event
         * @param {function} handler
         */
        sub : function(event, handler) {
            var
                it0    = 0,
                alias  = '',
                events = event.split(' ');

            if ((it0 = events.length) && typeof handler == 'function') {
                while (--it0 > -1) {
                    alias = events[it0];

                    self.sub(
                        alias.indexOf('key') == 0 ? self.parent.document.body : this._root,
                        alias,
                        handler
                    );

                    this._list.push({
                        event   : alias,
                        handler : handler
                    });
                }
            }
        },
        /**
         * Remove an instance
         */
        kill : function() {
            var
                it0   = this._list.length,
                saved = null;

            if (it0) {
                while (--it0 > -1) {
                    saved = this._list[it1];

                    self.off(
                        saved.event.indexOf('key') == 0 ? self.parent.document.body : this._root,
                        saved.event,
                        saved.handler
                    );

                    this._list.splice(it1, 1);
                }
            }
        },
    };

    return self;

}).call(SDM);