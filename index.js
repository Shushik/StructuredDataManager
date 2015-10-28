/**
 * Tree structured data manager (ex b-finder)
 *
 * @page    https://github.com/Shushik/StructuredDataManager
 * @author  Shushik <silkleopard@yandex.ru>
 * @version 2.0
 *
 * @todo Add the row data object fields schema
 */
var SDM = SDM || (function() {

    /**
     * @constructor
     *
     * @property parent
     * @property document
     * @function Gui
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
            this.gui    = self.Gui(args);
            this.events = self.Events(this.gui.root, args);

            // Set mousedown event
            this.events.sub('mousedown', this._binded.live);

            // Load data for the root column
            if (args.onloadstart) {
                this.pull('-', 'load');
            } else if (args.data) {
                this.push('-', args.data);
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
     * @property _mouse
     * @property _binded
     * @property _delayed
     * @property id
     * @property gui
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
         * Mouse timer id
         *
         * @type {number}
         */
        _mouse : 0,
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
        _delayed : '',
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
         * Gui operations module instance
         *
         * @type {object}
         */
        gui : null,
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
                id     = '',
                action = '',
                args   = null;

            // Get the id and action alias
            if (
                (action = this._delayed.split(/;/)) &&
                action.length &&
                (action = action[0].split(':'))
            ) {
                id     = action[0];
                action = action[1];
            } else {
                return;
            }

            // Set the pulling process indicator
            this.pulling = true;

            // Turn the progress bar on
            this.gui.wait();

            // Set the timer for the start event
            this.events.wait(action + 'start', {
                id   : id,
                done : this._binded.pulled,
                fail : this._binded.failed,
                hide : this._binded.hide,
                show : this._binded.show
            });
        },
        /**
         * Common error handler
         *
         * @param {undefined|string} text
         */
        _failed : function(text) {
            var
                id     = '',
                action = '',
                row    = null,
                queue  = null;

            if ((
                this.pulling &&
                (queue = this._delayed.split(/;/)) &&
                queue.length &&
                (action = queue.shift().split(':'))
            )) {
                // Get the id and action alias
                id     = action[0];
                action = action[1];

                // Reset the timer for the start event
                this.events.halt(action + 'start');
    
                // Turn the progress bar off
                this.gui.halt();

                // Reset the pulling process indicator
                this.pulling = false;

                // Update the queue
                this._delayed = queue.join(';');

                // Tell subscribers the action has been finished
                this.events.pub((action + 'fail'), {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });

                // Remove loading class
                if (row = this.gui.rows[id]) {
                    row.className = row.className.replace(
                        /sdm__row_data_loading/,
                        'sdm__row_data_dead'
                    );
                }

                // Deselect row
                if (action.indexOf('hold') > -1) {
                    this.drop(id);
                }

                // Load next item in queue
                if (queue.length) {
                    this._pull();
                }
            }
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
                id     = '',
                action = '',
                queue  = null;

            if ((
                this.pulling &&
                (queue = this._delayed.split(/;/)) &&
                queue.length &&
                (action = queue.shift().split(':'))
            )) {
                // Get the id and action alias
                id     = action[0];
                action = action[1];

                // Reset the timer for the start event
                this.events.halt(action + 'start');

                // Turn the progress bar off
                this.gui.halt();

                // Reset the pulling process indicator
                this.pulling = false;

                // Update the queue
                this._delayed = queue.join(';');

                // Tell subscribers the action has been finished
                this.events.pub((action + 'finish'), {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });

                // Add the rows
                if (action.indexOf('hold') == -1 && data) {
                    this.push(id, data);
                }

                // Run the related finishing action
                if (this['_' + action + 'ed']) {
                    this['_' + action + 'ed']();
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
                    if (this._mouse) {
                        // Cancel the cursor set
                        self.parent.clearTimeout(this._mouse);
                        this._mouse = 0;

                        // Select a row
                        this.hold(this.opened, event.ctrl);

                        return;
                    }

                    // Get the id for the cursor
                    this.opened = event.node.getAttribute('data-id');

                    // Delay the cursor set
                    this._mouse = self.parent.setTimeout(
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
            // Reset ids, indicators and stacks
            this.pulling  = false;
            this._mouse   = 0;
            this._delayed = '';
            this.holded   = '';
            this.opened   = '';
            this.events   = {};

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

            // Clear events
            this.events.kill();

            // Clear GUI
            this.gui.kill();

            // Clear this item
            self[this.id] = null;
        },
        /**
         * Scroll to the chosen column
         *
         * @private
         *
         * @param {number} mouse
         *
         * @return {object}
         */
        move : function(mouse) {
            var
                col = null,
                row = this.gui.rows[this.opened];

            if (row) {
                // Get the previous or the current column
                col = row.parentNode.parentNode;

                // Don't make a vertical scroll on click
                if (!mouse) {
                    col.scrollTop = row.offsetTop;
                }

                col = col.previousSibling ? col.previousSibling : col;
                col.parentNode.scrollLeft = col.offsetLeft;
            }

            return this;
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
            this.move(this._mouse);

            // Remove mousedown timer id
            this._mouse = 0;

            return this;
        },
        /**
         * Pull external data
         *
         * @param {string} id
         * @param {string} action
         *
         * @return {object}
         */
        pull : function(id, action) {
            action = typeof action == 'string' ? action : 'load';

            if (typeof id != 'string' && id != '-') {
                return this;
            }

            // Save the row id and process name into queue stack
            if (!this._delayed.match(new RegExp('(^|;)' + id + ':' + action))) {
                this._delayed += (this._delayed ? ';' : '') + id + ':' + action;
            }

            // Try to run the first element in stack
            if (!this.pulling) {
                this._pull();
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
         *
         * @return {object}
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
                part  = '',
                node  = args.wrapper,
                attrs = null,
                parts = ['name', 'wait', 'hide', 'hint'];

            // Try to fetch the wrapper DOM node
            if (args.wrapper instanceof HTMLElement) {
                node = args.wrapper;
            } else if (typeof args.wrapper == 'string') {
                node = self.document.querySelector(args.wrapper);
            } else {
                node = self.parent.document.body;
            }

            // DOM root
            node = this.root = self.create({
                className : 'sdm'
            }, node);

            // Name text
            node = self.create({
                className : 'sdm__unit'
            }, node);

            // Create text nodes
            while (part = parts.shift()) {
                attrs = {className : 'sdm__' + part};

                if (typeof args[part + '_txt'] == 'string') {
                    attrs.title = args[part + '_txt'];
                } else if (part == 'hint') {
                    attrs.title = 'Single click — expand; double click — select; ' +
                                  'Ctrl + double click — multi select or Cmd + double click; ' +
                                  'Esc — close'
                }

                self.create(attrs, node);
            }

            // Columns stack
            this.cols = [];
            this.cols['..'] = self.create({
                className : 'sdm__cols',
                data      : {
                                limit : typeof args.cols_num == 'number' ?
                                args.cols_num :
                                3
                            }
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
     * @function halt
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
        mode : 'search;observe',
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
            }
        },
        /**
         * Turn Gui window into search mode
         */
        find : function() {
            this.turn('search');
        },
        /**
         * Hide progressbar
         */
        halt : function() {
            this.root.className = this.root.className.
                                  replace(/\s*sdm_is_waiting/, '');
        },
        /**
         * Hide Gui window
         */
        hide : function() {
            this.root.className = this.root.className.
                                  replace(new RegExp(
                                      '\\ssdm_mode_(' +
                                      this.mode.replace(/;/, '|') +
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
         * Show progressbar
         */
        wait : function() {
            this.root.className += ' sdm_is_waiting';
        }
    };

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
                auto    = this._auto.match(/([^:;\d]+)/g),
                handler = null;


            // Setup main properties
            this._root   = root;
            this._saved  = {};

            // Save autoevents handlers if exist
            if (it0 = auto.length) {
                while (--it0 > -1) {
                    event   = auto[it0];
                    handler = handlers['on' + event];

                    this.sub(event, handler);
                }
            }
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
     * @property _auto
     * @property _root
     * @property _saved
     * @function off
     * @function pub
     * @function sub
     * @function halt
     * @function kill
     * @function wait
     */
    self.prototype = {
        /**
         * Available events list
         *
         * @private
         *
         * @type {string}
         */
        _auto : 'drawstart;drawfinish;' +
                'dropfail;dropstart:5;dropfinish;' +
                'holdfail;holdstart:5;holdfinish;' +
                'loadfail;loadstart:5;loadfinish;' +
                'openfail;openstart:5;openfinish;' +
                'shutstart;shutfinish;' +
                'mousedown;keydown',
        /**
         * Instance DOM root
         *
         * @private
         *
         * @type {object}
         */
        _root : null,
        /**
         * Saved events handlers stack (for clean removing)
         *
         * @private
         *
         * @type {object}
         */
        _saved : null,
        /**
         * Remove an event
         *
         * @param {string} event
         */
        off : function(event) {
            var
                saved = this._saved[event];

            if (this._saved[event]) {
                this.halt(event);

                self.off(
                    event.indexOf('key') == 0 ? self.parent.document.body : this._root,
                    this._saved[event].handler
                );
            }
        },
        /**
         * Fire an event
         *
         * @param {string} event
         * @param {object} data
         */
        pub : function(event, data) {
            if (this._saved[event]) {
                self.pub(
                    event.indexOf('key') == 0 ? self.parent.document.body : this._root,
                    event,
                    data
                );
            }
        },
        /**
         * Subscribe to an event
         *
         * @param {string}           event
         * @param {function}         handler
         * @param {undefined|number} delay
         */
        sub : function(event, handler, delay) {
            var
                alias  = '',
                source = this._auto.match(new RegExp('(' + event + ')(:(\\d+))*(;|$)'));

            // Main events should be added once only
            if (
                source &&
                (alias = source[1]) &&
                !this._saved[alias] &&
                typeof handler == 'function'
            ) {
                delay = typeof delay == 'number' && delay >= 0 ?
                        delay :
                        source[3] - 0;

                // Save event handler and time limit
                this._saved[alias] = {
                    delay   : !self.parent.parent.isNaN(delay) ? delay : -1,
                    handler : handler
                }

                // Save the real event
                self.sub(
                    alias.indexOf('key') == 0 ? self.parent.document.body : this._root,
                    alias,
                    handler
                );
            }
        },
        /**
         * Stop an event timer
         *
         * @param {string} event
         */
        halt : function(event) {
            var
                saved = this._saved[event];

            if (this._saved[event] && this._saved[event].timer) {
                this._saved[event].timer = self.parent.parent.clearTimeout(
                    this._saved[event].timer
                );
            }
        },
        /**
         * Remove an instance
         */
        kill : function() {
            var
                al0 = '';

            for (al0 in this._saved) {
            }
        },
        /**
         * Fire an event with timer
         *
         * @param {string} event
         * @param {object} data
         */
        wait : function(event, data) {
            data = data && typeof data == 'object' ? data : {};

            var
                item = this._saved[event];

            if (item && item.delay && data.fail) {
                this.halt(event);

                item.timer = self.parent.parent.setTimeout(
                    data.fail,
                    item.delay * 1000
                );

                this.pub(event, data);
            } else if (data.done) {
                data.done();
            }
        }
    };

    return self;

}).call(SDM);