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
            this.gui    = self.Gui(args, this);
            this.events = self.Events(args, this);

            // Set user generated events
            this.events.sub('mousedown', this._binded.live);

            // Load data for the root column
            if (args.onloadstart) {
                this.pull('-', 'load');
            } else if (args.data) {
                this.push('-', args.data);
            }
        }

    /**
     * Number of module version
     *
     * @type {string}
     */
    self.version = '2.0';

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
     * @property _binded
     * @property _timers
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
     * @function _opened
     * @function _pulled
     * @function _keydown
     * @function _mousedown
     * @function back
     * @function drop
     * @function hide
     * @function hold
     * @function init
     * @function kill
     * @function seek
     * @function next
     * @function open
     * @function pull
     * @function push
     * @function quit
     * @function seek
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
        _delayed : '',
        /**
         * Selected rows ids
         *
         * @type {string}
         */
        holded : '',
        /**
         * Id of the row on which the cursor has been set
         *
         * @type {string}
         */
        opened : '',
        /**
         * Search text
         *
         * @type {string}
         */
        seeked : '',
        /**
         * Binded instance methods stack
         *
         * @private
         *
         * @type {object}
         */
        _binded : null,
        /**
         * Instance timers stack
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
                type = event.type,
                part = event.target.className,
                node = event.target;

            // Parse Gui part name
            part = node == self.document.body ? 'sdm__root' : part;
            part = part ? part.match(/^sdm(__\S+)*[\s\S]*/) : null;

            // Not a part of active GUI
            if (!part) {
                return;
            }

            // Get a short Gui part name
            part = part[0].replace(/\s[\s\S]*$/, '').replace(/sdm__/, '');

            // Call the event subhandler
            if (this['_' + type]) {
                this['_' + type]({
                    ctrl : event.ctrlKey || event.metaKey ? true : false,
                    code : event.keyCode ? event.keyCode : event.which,
                    part : part,
                    node : node,
                    root : event
                });
            }

            return this;
        },
        /**
         * Initiate row subcontent loading
         *
         * @private
         */
        _open : function() {
            var
                row = this.gui.get('row', this.opened);

            // Mark the row with the loading status
            this.gui.mod(row, 'data', 'load', true);
            this.gui.mod(row, 'data', 'loading');

            // Run external actions
            this.pull(this.opened, 'open');
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
            this.gui.mod(this.gui.root, 'is', 'waiting');

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
                this.gui.mod(this.gui.root, 'is', 'waiting', false);

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
                if (row = this.gui.get('row', id)) {
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
                (queue = this._delayed.split(';')) &&
                queue.length &&
                (action = queue.shift().split(':'))
            )) {
                // Get the id and action alias
                id     = action[0];
                action = action[1];

                // Reset the timer for the start event
                this.events.halt(action + 'start');

                // Turn the progress bar off
                this.gui.mod(this.gui.root, 'is', 'waiting', true);

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
                rows = this.gui.get('rows', this.opened);

            if (rows) {
                this.gui.mod(rows, 'are', 'opened');
                this.gui.mod(rows.parentNode, 'is', 'opened');
            }
        },
        /**
         * Keydown event handler
         *
         * @param {object} event
         */
        _keydown : function(event) {
            switch (event.code) {
                // Select row on Enter
                case 13:
                    this.hold(this.opened, event.ctrl);
                break;
                // Hide GUI window on Esc
                case 27:
                    this.hide();
                break;
                // Set cursor at the parent row
                case 37:
                    event.root.preventDefault();
                    this.quit();
                break;
                // Set cursor at the upper row
                case 38:
                    event.root.preventDefault();
                    this.back();
                break;
                // Set cursor at the first child row
                case 39:
                    event.root.preventDefault();
                    this.step();
                break;
                // Set cursor at the downer row
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
                    if (this._timers.click) {
                        // Cancel the cursor set
                        self.parent.clearTimeout(this._timers.click);

                        // Select a row
                        this.hold(this.opened, event.ctrl);

                        // Remove mousedown timer id
                        this._timers.click = undefined;

                        return;
                    }

                    // Get the id for the cursor
                    this.opened = this.gui.get('id', event.node);

                    // Delay the cursor set
                    this._timers.click = self.parent.setTimeout(
                        this._binded.click,
                        150
                    );
                break;
                // 
                case 'sdm': case 'hide':
                    this.hide();
                break;
            }
        },
        /**
         * Set cursor at the upper row
         *
         * @return {object}
         */
        back : function() {
            var
                id  = this.opened,
                row = this.gui.get('row', id);

            if (row && (row = row.previousSibling)) {
                this.open(this.gui.get('id', row));
            } else if (
                !id &&
                (row = this.gui.get('rows', '-')) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(this.gui.get('id', row));
            }

            return this;
        },
        /**
         * Deselect a row
         *
         * @param {undefined|string|object} id
         *
         * @return {object}
         */
        drop : function(id) {
            var
                it0  = 0,
                ids  = '',
                row  = null,
                rows = null;

            if (typeof id == 'string') {
                rows = [this.gui.get('row', id)];
            } else if (id instanceof HTMLElement) {
                rows = [id];
            } else {
                rows = this.gui.get('holded');
            }

            if (rows && (it0 = rows.length) > 0) {
                while (--it0 > -1) {
                    row = rows[it0];
                    id  = this.gui.get('id', row);

                    // Deselect the row
                    this.gui.mod(row, 'is', 'holded', true);

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
            this.gui.mod(this.gui.root, 'is', 'observing', true);

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
                row = this.gui.get('row', id);

            // Don't hold nonexistent and disabled rows
            if (!row || row.className.indexOf('_data_dead') != -1) {
                return this;
            }

            // Set a cursor
            if (row.className.indexOf('_is_opened') == -1) {
                this.open(row);
            }

            // Unhold the row if it's already holded
            if (this.holded.match(new RegExp('(^|;)' + id))) {
                return this.drop(id);
            } else if (!add) {
                this.drop();
            }

            // Save current row id
            this.holded += (this.holded ? ';' : '') + id;

            // Select the row
            this.gui.mod(row, 'is', 'holded');

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
            this._delayed = '';
            this.holded   = '';
            this.opened   = '';
            this._timers  = {};
            this.events   = {};

            // Create the proxied methods links stack
            this._binded = {
                hide   : this.hide.bind(this),
                live   : this._live.bind(this),
                open   : this._open.bind(this),
                show   : this.show.bind(this),
                click  : this.open.bind(this),
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
         * Clear the search results
         *
         * @return {object}
         */
        lose : function() {
            return this;
        },
        /**
         * Set cursor at the downer row
         *
         * @return {object}
         */
        next : function() {
            var
                id  = this.opened,
                row = this.gui.get('row', id);

            if (row && (row = row.nextSibling)) {
                this.open(this.gui.get('id', row));
            } else if (
                !id &&
                (row = this.gui.get('rows', '-')) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(this.gui.get('id', row));
            }

            return this;
        },
        /**
         * Set a cursor to the row
         *
         * @param {undefined|string|object} id
         *
         * @return {object}
         */
        open : function(id) {
            var
                to  = null,
                row = null;

            // Set the current row id
            if (typeof id == 'string') {
                this.opened = id;
            } else if (id instanceof HTMLElement) {
                row = id;
                id  = this.gui.get('id', row);
            } else if (
                !this.opened &&
                (row = this.gui.get('row:first'))
            ) {
                this.opened = id = this.gui.get('id', row);
            }

            // Don't go further if this row already has been selected
            if (!row && !(row = this.gui.get('row', this.opened))) {
                return this;
            }

            // Clear row subcontent loading timer
            if (this._timers.open) {
                self.parent.clearTimeout(this._timers.open);
                this._timers.open = undefined;
            }

            // Hide rows and columns
            this.shut();

            //  Switch between the different row behavior
            switch (row.className.replace(/[\s\S]*(data_(html|load|rows)(\s|$))[\s\S]*/g, '$2')) {
                // Load subitems
                case 'load':
                    // Set row subcontent loading timer
                    this._timers.open = self.parent.setTimeout(this._binded.open, 500);
                break;
                // Show subitems
                case 'html':
                case 'rows':
                    // Finish the opening of subitems process immediately
                    this._opened();
                break;
            }

            // Save a link for the first row in chain
            // for further scrolling
            to = row;

            // Set cursors at all rows in chain and scroll to the last column
            while (row) {
                this.gui.mod(row, 'is', 'opened');
                this.gui.mod(row.parentNode, 'are', 'opened');
                this.gui.mod(row.parentNode.parentNode, 'is', 'opened');

                row = this.gui.get('row', this.gui.get('id', row.parentNode));
            }

            // Scroll to the first row in chain
            this.gui.move(to, (this._timers.click ? true : false));

            // Remove mousedown timer id
            this._timers.click = undefined;

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
                deep = 0,
                type = typeof data,
                row  = null;

            // Get a row
            row = this.gui.get('row', id);

            // Tell subscribers the rendering has been started
            this.events.pub('drawstart', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });

            if (row) {
                // Get the columns deep level
                deep = this.gui.get('id', row.parentNode.parentNode);
                deep -= 0;
                deep += 1;
            }

            // Create cols and rows
            this.gui.push(data, id, deep);

            // Tell subscribers the rendering has been finished
            this.events.pub('drawfinish', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });

            return this;
        },
        /**
         * Set cursor at the parent row
         */
        quit : function() {
            var
                id  = this.opened,
                row = this.gui.get('row', id);

            if (row && (id = this.gui.get('id', row.parentNode))) {
                if (id != '-') {
                    row.className = row.className.replace(/\s*sdm__row_is_opened/, '');

                    if (
                        (row = this.gui.get('row', id))
                    ) {
                        this.open(this.gui.get('id', row));
                    }
                }
            }

            return this;
        },
        /**
         * Find a word in the rows
         *
         * @param {string} what
         *
         * @return {object}
         */
        seek : function(what) {
            return this;
        },
        /**
         * Show module
         *
         * @return {object}
         */
        show : function() {
            // Show Gui window
            this.gui.mod(this.gui.root, 'is', 'observing');

            // Set Gui keydown event
            this.events.sub('keydown', this._binded.live);

            return this;
        },
        /**
         * Remove cursors from all rows in chain and hide
         * all rows groups and columns
         *
         * @return {object}
         */
        shut : function() {
            var
                it0   = 0,
                node  = null,
                nodes = this.gui.get('opened');

            if (it0 = nodes.length) {
                while (--it0 > -1) {
                    this.gui.mod(nodes[it0], '(is|are)', 'opened', true);
                }
            }

            return this;
        },
        /**
         * Set cursor at the first child row
         *
         * @return {object}
         */
        step : function() {
            var
                id  = this.opened,
                row = null;

            if (
                id &&
                (row = this.gui.get('rows', id)) &&
                (row = row.firstChild) &&
                row.className.indexOf('__row') != -1
            ) {
                this.open(this.gui.get('id', row));
            }

            return this;
        }
    };

    return self;

})();



/**
 * Gui operations module
 *
 * @todo has(), get(), set() methods
 */
SDM.Gui = SDM.Gui || (function() {

    /**
     * @constructor
     *
     * @property parent
     * @function create
     *
     * @param {object} args
     * @param {object} parent
     */
    function
        self(args, parent) {
            // Always return an instance of module
            if (!(this instanceof self)) {
                return new self(args, parent);
            }

            var
                al0   = '',
                find  = null,
                node  = args.wrapper,
                attrs = null;

            // Link to a parent instance
            this.parent = parent;

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

            node = this.add('unit', node);
            this.add('name', node, args);
            this.add('wait', node, args);
            this.add('hide', node, args);
            this.add('hint', node, args);

            // Save the custom fields names schema
            if (args.keys) {
                this.keys = {};

                for (al0 in self.prototype.keys) {
                    this.keys[al0] = args.keys[al0] ?
                                     args.keys[al0] :
                                     self.prototype.keys[al0];
                }
            }

            // Add the columns wrapper
            this.add('cols', this.root.firstChild, args.cols_num);
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
            switch (al0) {
                // Set the node data-attributes
                case 'data':
                    for (al1 in args.data) {
                        node.setAttribute('data-' + al1, args.data[al1]);
                    }
                break;
                // Filter tagName property
                case 'tagName':
                break;
                // Set attributes
                case 'contenteditable':
                    node.setAttribute(al0, args[al0]);
                break;
                // Set the node property
                default:
                    node[al0] = args[al0];
                break;
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
     * @property look
     * @property root
     * @property parent
     * @function add
     * @function get
     * @function mod
     * @function kill
     * @function move
     * @function push
     */
    self.prototype = {
        /**
         * Data fields custom names
         *
         * @type {object}
         */
        keys : {id : 'id', data : 'data', dead : 'dead', name : 'name', seek : 'seek'},
        /**
         * Root DOM element
         *
         * @type {object}
         */
        root : null,
        /**
         * Link to the parent module instance
         *
         * @type {object}
         */
        parent : null,
        /**
         * Create a row, rows group, column or columns wrapper
         *
         * @param {string}        what
         * @param {object}        where
         * @param {string|object} args
         *
         * @return {object}
         */
        add : function(what, where, args) {
            args = args || {};

            var
                temp = null;

            switch (what) {
                // Create a preview block
                case 'box':
                    return self.create({
                        className : 'sdm__box',
                        innerHTML : args
                    }, where);
                break;
                // Create a column DOM node
                case 'col':
                    return self.create({
                        id        : 'sdm_' + this.parent.id + '_col_' + args,
                        className : 'sdm__col'
                    }, where);
                break;
                // Create a row DOM node
                case 'row':
                    return self.create({
                        id        : 'sdm_' + this.parent.id + '_row_' + args.id,
                        title     : args.name,
                        className : 'sdm__row' + (args.dead ? ' sdm__row_data_dead' : ''),
                        data      : {
                                        seek : args.seek ?
                                               args.seek + '' :
                                               args.name.toLowerCase()
                                    }
                    }, where);
                break;
                // Create a columns wrapper DOM node
                case 'cols':
                    return self.create({
                        className : 'sdm__cols sdm__cols_limit_' +
                                    (typeof args == 'number' ? args : 3)
                    }, where);
                break;
                // Create a rows group DOM node
                case 'rows':
                    return self.create({
                        id        : 'sdm_' + this.parent.id + '_rows_' + args,
                        className : 'sdm__rows'
                    }, where);
                break;
                // Create GUI parts and controls
                case 'hide':
                case 'hint':
                case 'name':
                case 'unit':
                case 'wait':
                    temp = {className : 'sdm__' + what};

                    if (typeof args[what + '_txt'] == 'string') {
                        temp.title = args[what + '_txt'];
                    } else if (what == 'hint') {
                        temp.title = 'Single click — expand; double click — select; ' +
                                     'Ctrl + double click — multi select or Cmd + double click; ' +
                                     'Esc — close'
                    }

                    if (what == 'find') {
                        temp.contenteditable = true;
                    }

                    return self.create(temp, where);
                break;
            }

            return null;
        },
        /**
         * Get DOM element(s) or dom property
         *
         * @param {string}        what
         * @param {string|object} from
         *
         * @return {string|object}
         */
        get : function(what, args) {
            switch (what) {
                // Get a clean id of the row or rows group
                case 'id':
                    return (args instanceof HTMLElement ? args.id : args).
                           replace(/sdm_[^_]*_[^_]*_/, '');
                break;
                // Get the column, rows group or row node
                case 'col':
                case 'row':
                case 'rows':
                    return self.parent.document.getElementById(
                        'sdm_' + this.parent.id + '_' + what + '_' + args
                    );
                break;
                // Get the columns wrapper node
                case 'cols':
                    return this.root.querySelector('.sdm__cols');
                break;
                // Get the very first row
                case 'col:first':
                case 'row:first':
                    return this.root.querySelector(
                        '.sdm__' + what + '-child'
                    );
                break;
                // Get the rows matched to the search criteria
                case 'row:match':
                    return this.root.querySelectorAll(
                        '.sdm__row[data-seek^="' + what + '"],' +
                        '.sdm__row[data-seek*="' + what + '"]'
                    );
                break;
                // Get all selected rows
                case 'holded':
                    return this.root.querySelectorAll(
                        '.sdm__row_is_holded'
                    );
                break;
                // Get all displayed columns, rows groups and rows
                case 'opened':
                    return this.root.querySelectorAll(
                        '.sdm__col_is_opened,' +
                        '.sdm__row_is_opened,' +
                        '.sdm__rows_are_opened'
                    );
                break;
            }

            return null;
        },
        /**
         * Deselect the row
         *
         * @param {object}            node
         * @param {string}            as
         * @param {string}            is
         * @param {undefined|boolean} rm
         */
        mod : function(node, as, is, rm) {
            node.className = node.className.replace(
                new RegExp((
                    rm === true ?
                    '\\s*sdm(__\\S+)?_' + as + '_' + is :
                    '^sdm(__\\S*)?'
                )),
                (
                    rm === true ?
                    '' :
                    'sdm$1 sdm$1_' + as + (is ? '_' + is : '')
                )
            );
        },
        /**
         * Remove an instance
         */
        kill : function() {
        },
        /**
         * Scroll to the chosen column
         *
         * @param {object}            at
         * @param {undefined|boolean} yoff
         */
        move : function(row, yoff) {
            var
                col = null;

            if (row && (col = row.parentNode.parentNode)) {
                if (!yoff) {
                    col.scrollTop = row.offsetTop;
                }

                col.parentNode.scrollLeft = col.offsetLeft;
            }
        },
        /**
         * Create cols and rows
         *
         * @param {object}           data
         * @param {number}           pid
         * @param {undefined|number} _deep
         * @param {undefined|object} _cols
         */
        push : function(data, pid, _deep, _cols) {
            pid  = pid ? pid : '-';

            var
                it0    = -1,
                ln0    = data.length,
                deep   = _deep && typeof _deep == 'number' ? _deep : 0,
                type   = typeof data,
                col    = this.get('col', deep),
                cols   = _cols instanceof HTMLElement ? _cols : this.get('cols'),
                item   = null,
                rows   = this.get('rows', pid),
                parent = this.get('row', pid);

            // Create a new column if not exist
            if (!col) {
                col = this.add('col', cols, deep)
            }

            // Create a new rows group if not exist
            if (!rows) {
                rows = this.add('rows', col, pid);
            }

            // Switch between the rows subcontent types
            switch (type) {
                // Subcontent is rows list
                case 'object':
                    // Set the row subitems type
                    if (parent) {
                        this.mod(parent, 'data', 'loading', true);
                        this.mod(parent, 'data', 'rows');
                    }

                    // Save the rows
                    while (++it0 < ln0) {
                        item = data[it0];

                        // Create the rows
                        if (item instanceof HTMLElement) {
                            rows.appendChild(item);
                        } else {
                            this.add('row', rows, {
                                dead : item[this.hull.dead] ? true : false,
                                id   : item[this.hull.id],
                                name : item[this.hull.name],
                                seek : item[this.hull.seek] ?
                                       item[this.hull.seek] :
                                       item[this.hull.name].toLowerCase()
                            });
                        }

                        // 
                        if (item.data) {
                            this.push(item.data, item.id, deep + 1, cols);
                        }
                    }
                break;
                // Subcontent is html
                case 'string':
                    // Set the row subitems type and save preview HTML
                    if (parent) {
                        this.mod(parent, 'data', 'loading', true);
                        this.mod(parent, 'data', 'html');
                    }

                    // Save the preview html
                    this.add('box', rows, data);
                break;
                // Subcontent should be loaded
                case 'boolean':
                    if (parent && type) {
                        this.mod(parent, 'data', 'load');
                    }
                break;
            }
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
     * @property parent
     * @function off
     * @function pub
     * @function sub
     *
     * @param {object} handlers
     * @param {object} parent
     */
    function
        self(handlers, parent) {
            // Always return an instance of module
            if (!(this instanceof self)) {
                return new self(handlers, parent);
            }

            var
                it0     = 0,
                event   = '',
                auto    = this.auto.match(/([^:;\d]+)/g),
                handler = null;


            // Setup main properties
            this._saved = {};
            this.parent = parent;

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
     * @property auto
     * @property _saved
     * @property parent
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
        auto : 'drawstart;drawfinish;' +
               'dropfail;dropstart:5;dropfinish;' +
               'holdfail;holdstart:5;holdfinish;' +
               'loadfail;loadstart:5;loadfinish;' +
               'openfail;openstart:5;openfinish;' +
               'seelfail;seekstart:5;seekfinish;' +
               'losestart;losefinish;' +
               'shutstart;shutfinish;' +
               'keyup;keydown;mousedown',
        /**
         * Saved events handlers stack (for clean removing)
         *
         * @private
         *
         * @type {object}
         */
        _saved : null,
        /**
         * Link to the parent module instance
         *
         * @type {object}
         */
        parent : null,
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
                    (
                        event.indexOf('keydown') == 0 ?
                        self.parent.document.body :
                        this.parent.gui.root
                    ),
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
                    (
                        event.indexOf('keydown') == 0 ?
                        self.parent.document.body :
                        this.parent.gui.root
                    ),
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
                source = this.auto.match(new RegExp('(' + event + ')(:(\\d+))*(;|$)'));

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
                    (
                        alias.indexOf('key') == 0 ?
                        self.parent.document.body :
                        this.parent.gui.root
                    ),
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