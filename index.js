/**
 * Tree structured data manager (ex b-finder)
 *
 * @page    https://github.com/Shushik/StructuredDataManager
 * @author  Shushik <silkleopard@yandex.ru>
 * @version 2.0
 *
 * @namespace SDM
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
     * @instance
     *
     * @property _binded
     * @property id
     * @property gui
     * @property mode
     * @property events
     * @property holded
     * @property opened
     * @property seeked
     * @function _live
     * @function _click
     * @function _keyup
     * @function _failed
     * @function _opened
     * @function _droped
     * @function _holded
     * @function _loaded
     * @function _keydown
     * @function _dblclick
     * @function _mousedown
     * @function bwd
     * @function dwd
     * @function fwd
     * @function uwd
     * @function drop
     * @function hide
     * @function hold
     * @function init
     * @function kill
     * @function lose
     * @function open
     * @function pull
     * @function push
     * @function seek
     * @function show
     * @function shut
     */
    self.prototype = {
        /**
         * Instance id
         *
         * @type {number}
         */
        id : 0,
        /**
         * Module mode
         *
         * @type {string}
         */
        mode : 'view',
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
         * @returns {object}
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
         * Initiate DOM search
         *
         * @private
         */
        _seek : function() {
            var
                it0  = -1,
                ln0  = 0,
                row  = null,
                fake = null,
                root = this.gui.get('rows', '-'),
                rows = null;

            // Initiate the search mode
            if (this.mode != 'seek') {
                // Prepare main properties and remove cursors
                this.shut();
                this.mode   = 'seek';
                this.opened = '';

                // Hide Gui window
                this.gui.mod(this.gui.root, 'mode', 'view', false);
                this.gui.mod(this.gui.root, 'mode', 'seek');

                // 
                fake = this.gui.get('rows', '|');
                root.id = root.id.replace('_-', '_|');
                fake.id = fake.id.replace('_|', '_-');
                root = fake;
            }

            // Clean previous results
            root.innerHTML = '';

            // 
            if (
                (rows = this.gui.get('row:match', this.seeked.toLowerCase())) &&
                (ln0 = rows.length)
            ) {
                while (++it0 < ln0) {
                    row = rows[it0].cloneNode();
                    this.gui.add('raw', root, row);
                }
            }

            // Set counter badge
            this.gui.find.parentNode.title = ln0;
        },
        /**
         * Click pseudoevent handler
         *
         * @private
         */
        _click : function() {
            this.open();
            this.gui.move(true);
        },
        /**
         * Keyup event handler
         *
         * @private
         *
         * @param {object} event
         */
        _keyup : function(event) {
            var
                id = '';

            // Cancel the search action
            this.events.halt('keyup');

            switch (event.code) {
                // 
                case 13:
                    id = this.opened;
                    this.lose();
                    this.open(id);
                    this.gui.move();
                break;
                // Hide GUI window on Esc
                case 27:
                    this.lose();
                    this.fwd();
                    this.gui.move();
                break;
                // Set cursor at the downer row
                case 40:
                    event.root.preventDefault();
                    this.gui.find.blur();
                    this.fwd();
                    this.gui.move();
                break;
                // Text typing
                default:
                    if (this.seeked != event.node.value) {
                        this.opened = '';
                        this.seeked = event.node.value;

                        this.shut();

                        this.events.wait(
                            'keyup',
                            this._binded.seek,
                            300
                        );
                    }
                break;
            }
        },
        /**
         * Finish the holding process
         *
         * @private
         *
         * @param {string}           id
         * @param {undefined|object} data
         */
        _droped : function(id) {
            this.push(id, null, 'drop');
        },
        /**
         * Common error handler
         *
         * @private
         *
         * @param {undefined|string} text
         */
        _failed : function(id, text) {
            // Turn the progress bar off
            this.gui.mod(this.gui.root, 'is', 'waiting', false);

            // Tell subscribers the action has been finished
            this.events.pub('fail', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });

            // Remove loading class
            if (typeof id == 'string' && (row = this.gui.get('row', id, true))) {
                this.gui.mod(row, 'data', 'loading', false);
                this.gui.mod(row, 'data', 'dead');

                if (row.className.indexOf('_is_holded')) {
                    this.drop(id);
                }
            }
        },
        /**
         * Finish the holding process
         *
         * @private
         *
         * @param {string}           id
         * @param {undefined|object} data
         */
        _holded : function(id, data) {
            this.push(id, data, 'hold');
        },
        /**
         * Finish the loading process
         *
         * @private
         *
         * @param {string}           id
         * @param {undefined|object} data
         */
        _loaded : function(id, data) {
            this.push(id, data, 'load');
        },
        /**
         * Finish the opening process
         *
         * @private
         *
         * @param {string}           id
         * @param {undefined|object} data
         */
        _opened : function(id, data) {
            var
                rows = null;

            // 
            if (data) {
                this.push(id, data, 'open');
            }

            // 
            if (this.opened == id && (rows = this.gui.get('rows', id))) {
                this.gui.mod(rows, 'are', 'opened');
                this.gui.mod(rows.parentNode, 'is', 'opened');
            }
        },
        /**
         * Keydown event handler
         *
         * @private
         *
         * @param {object} event
         */
        _keydown : function(event) {
            // No need to go further
            if (event.part == 'find') {
                return;
            }

            // Switch between the keycodes
            switch (event.code) {
                // Select row on Enter
                case 13:
                    if (this.mode == 'seek') {
                        this._keyup(event);
                    } else {
                        this.hold(this.opened, event.ctrl);
                        this.gui.move();
                    }
                break;
                // Hide GUI window on Esc
                case 27:
                    if (this.mode == 'seek') {
                        this._keyup(event);
                    } else {
                        this.hide();
                    }
                break;
                // Set cursor at the parent row
                case 37:
                    if (this.mode != 'seek') {
                        event.root.preventDefault();
                        this.uwd();
                        this.gui.move();
                    }
                break;
                // Set cursor at the upper row
                case 38:
                    event.root.preventDefault();
                    this.bwd();
                    this.gui.move();
                break;
                // Set cursor at the first child row
                case 39:
                    if (this.mode != 'seek') {
                        event.root.preventDefault();
                        this.dwd();
                        this.gui.move();
                    }
                break;
                // Set cursor at the downer row
                case 40:
                    event.root.preventDefault();
                    this.fwd();
                    this.gui.move();
                break;
            }
        },
        /**
         * Doubleclick pseudoevent handler
         *
         * @private
         *
         * @param {boolean} ctrl
         */
        _dblclick : function(ctrl) {
            if (this.mode == 'seek') {
                this.lose();
                this.open(this.opened);
                this.gui.move();
            } else {
                this.hold(this.opened, ctrl);
                this.gui.move(true);
            }
        },
        /**
         * Mousedown event handler
         *
         * @private
         *
         * @param {object} event
         */
        _mousedown : function(event) {
            var
                id = '';

            switch (event.part) {
                // Row has been clicked
                case 'row':
                    id = this.gui.get('id', event.node);

                    if (this.events.halt('click') && id == this.opened) {
                        this._dblclick(event.ctrl);

                        return;
                    }

                    // No need to go further
                    if (
                        this.mode == 'seek' &&
                        this.gui.get('id', event.node.parentNode) != '-'
                    ) {
                        this.lose();
                    }

                    // Get the id for the cursor
                    this.opened = id;

                    // Delay the cursor set
                    this.events.wait('click', this._binded.click, 150);
                break;
                // Exit control has been clicked
                case 'exit':
                    if (this.mode == 'seek') {
                        this.lose()
                        this.fwd();
                    }
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
         * @returns {object}
         */
        bwd : function() {
            this.open(this.gui.get('row:previous', true));
            return this;
        },
        /**
         * Set cursor at the first child row
         *
         * @returns {object}
         */
        dwd : function() {
            this.open(this.gui.get('row:child', this.opened, true));
            return this;
        },
        /**
         * Set cursor at the downer row
         *
         * @returns {object}
         */
        fwd : function() {
            this.open(this.gui.get('row:next', true));
            return this;
        },
        /**
         * Set cursor at the parent row
         */
        uwd : function() {
            this.open(this.gui.get('row:parent', this.opened, true));
            return this;
        },
        /**
         * Deselect a row
         *
         * @param {undefined|string|object} id
         *
         * @returns {object}
         */
        drop : function(id) {
            var
                it0  = 0,
                ids  = '',
                row  = null,
                rows = null;

            if (typeof id == 'string') {
                rows = [this.gui.get('row', id, true)];
            } else if (id instanceof HTMLElement) {
                rows = [id];
            } else {
                rows = this.gui.get('row:holded');
            }

            if (rows && (it0 = rows.length) > 0) {
                while (--it0 > -1) {
                    row = rows[it0];
                    id  = this.gui.get('id', row);

                    // Deselect the row
                    this.gui.mod(row, 'is', 'holded', false);

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
         * @returns {object}
         */
        hide : function() {
            if (this.mode != 'hide') {
                // Modify mode
                this.mode = 'hide';

                // Hide Gui window
                this.gui.mod(this.gui.root, 'mode', 'view', false);
                this.gui.mod(this.gui.root, 'mode', 'seek', false);

                // Reset Gui keydown event
                this.events.off('keyup');
                this.events.off('keydown');
            }

            return this;
        },
        /**
         * Select a row
         *
         * @param {string}  id
         * @param {boolean} add
         *
         * @returns {object}
         */
        hold : function(id, add) {
            var
                row = this.gui.get('row', id, true);

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
         * @returns {object}
         */
        init : function(args) {
            // Reset ids, indicators and stacks
            this.mode   = 'hide';
            this.holded = '';
            this.opened = '';
            this.events = {};

            // Create the proxied methods links stack
            this._binded = {
                hide   : this.hide.bind(this),
                live   : this._live.bind(this),
                seek   : this._seek.bind(this),
                show   : this.show.bind(this),
                click  : this._click.bind(this),
                droped : this._droped.bind(this),
                failed : this._failed.bind(this),
                holded : this._holded.bind(this),
                loaded : this._loaded.bind(this),
                opened : this._opened.bind(this)
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
                delete this._binded[al0];
            }

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
         * @returns {object}
         */
        lose : function() {
            var
                fake = this.gui.get('rows', '-'),
                root = this.gui.get('rows', '|');

            // Initiate the search mode
            if (this.mode == 'seek') {
                // Blur the search text element
                this.gui.find.blur();
                this.gui.find.value = '';
                this.gui.find.parentNode.title = 0;
                this.seeked = '';

                // Prepare main properties and remove cursors
                this.shut();
                this.mode   = 'view';
                this.opened = '';

                // Switch to the view mode
                this.gui.mod(this.gui.root, 'mode', 'seek', false);
                this.gui.mod(this.gui.root, 'mode', 'view');

                // Replace 
                root.id = root.id.replace('_|', '_-');
                fake.id = fake.id.replace('_-', '_|');

                // Clean results
                fake.innerHTML = '';
            }

            return this;
        },
        /**
         * Set a cursor to the row
         *
         * @param {undefined|string|object} id
         *
         * @returns {object}
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
                this.opened = id = this.gui.get('id', row);
            } else if (
                !this.opened &&
                (row = this.gui.get('row:first', true))
            ) {
                this.opened = id = this.gui.get('id', row);
            }

            // Don't go further if this row already has been selected
            if (!row && !(row = this.gui.get('row', this.opened, true))) {
                return this;
            }

            // Clear row subcontent loading timer
            this.events.halt('open')

            // Remove cursors
            this.shut();

            //  Switch between the different row behavior
            switch (row.className.replace(/[\s\S]*(data_(html|load|rows)(\s|$))[\s\S]*/g, '$2')) {
                // Load subitems
                case 'load':
                    if (this.mode != 'seek') {
                        // Mark the row with the loading status
                        this.gui.mod(row, 'data', 'load', false);
                        this.gui.mod(row, 'data', 'loading');

                        // Run external actions
                        this.pull(this.opened, 'open');
                    }
                break;
                // Show subitems
                case 'html':
                case 'rows':
                    // Finish the opening of subitems process immediately
                    this._opened(this.opened);
                break;
            }

            // Set cursors at all rows in chain and scroll to the last column
            while (row) {
                this.gui.mod(row, 'is', 'opened');
                this.gui.mod(row.parentNode, 'are', 'opened');
                this.gui.mod(row.parentNode.parentNode, 'is', 'opened');

                row = this.gui.get('row', this.gui.get('id', row.parentNode));
            }

            return this;
        },
        /**
         * Pull external data
         *
         * @param {string} id
         * @param {string} action
         *
         * @returns {object}
         */
        pull : function(id, action) {
            action = typeof action == 'string' ? action : 'load';

            // 
            if (typeof id != 'string' && id != '-') {
                return this;
            }

            // Turn the progress bar on
            this.gui.mod(this.gui.root, 'is', 'waiting');

            // Set the timer for the start event
            this.events.pub(action + 'start', {
                id   : id,
                done : this._binded[action + 'ed'],
                fail : this._binded.failed,
                hide : this._binded.hide,
                show : this._binded.show
            });

            return this;
        },
        /**
         * Add the rows
         *
         * @param {string}           id
         * @param {object}           data
         * @param {undefined|string} action
         *
         * @returns {object}
         */
        push : function(id, data, action) {
            var
                deep = 0,
                type = typeof data,
                row  = null;

            // Finish started action
            if (typeof action == 'string') {
                this.gui.mod(this.gui.root, 'is', 'waiting', false);

                this.events.pub((action + 'finish'), {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });
            }

            // Render
            if (data) {
                // Get a row
                row = this.gui.get('row', id, true);

                // Tell subscribers the rendering has been started
                this.events.pub('drawstart', {
                    id   : id,
                    hide : this._binded.hide,
                    show : this._binded.show
                });

                // Get the columns deep level
                if (row) {
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
            }

            return this;
        },
        /**
         * Find a word in the rows
         *
         * @param {string} what
         *
         * @returns {object}
         */
        seek : function(what) {
            var
                fake = null,
                root = this.gui.get('rows', '-');

            // Set the current row id
            if (typeof what == 'string') {
                this.seeked = what;
                this.gui.find.value = what;
                this.gui.find.focus();
            } else if (!this.seeked && this.gui.find) {
                return this;
            }

            // Initiate DOM search
            if (this.seeked) {
                this._seek();
            }

            return this;
        },
        /**
         * Show module
         *
         * @returns {object}
         */
        show : function() {
            if (this.mode != 'view') {
                // Modify mode
                this.mode = 'view';

                // Show Gui window
                this.gui.mod(this.gui.root, 'mode', 'view');

                // Set Gui keyboard event
                this.events.sub('keyup',   this._binded.live);
                this.events.sub('keydown', this._binded.live);
            }

            return this;
        },
        /**
         * Remove cursors from all rows in chain and hide
         * all rows groups and columns
         *
         * @returns {object}
         */
        shut : function() {
            var
                it0   = 0,
                node  = null,
                nodes = this.gui.get(':opened', false);

            if (it0 = nodes.length) {
                while (--it0 > -1) {
                    this.gui.mod(nodes[it0], '(is|are)', 'opened', false);
                }
            }

            return this;
        }
    };

    return self;

})();



/**
 * Gui operations
 *
 * @namespace SDM.Gui
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
                cols  = null,
                node  = args.wrapper,
                attrs = null;

            // Link to a parent instance
            this.parent = parent;

            // Save the custom fields names schema
            if (args.keys) {
                this.keys = {};

                for (al0 in self.prototype.keys) {
                    this.keys[al0] = args.keys[al0] ?
                                     args.keys[al0] :
                                     self.prototype.keys[al0];
                }
            }

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

            // DOM fields
            node = this.add('unit', node);
            node = this.add('seek', node);
            this.find = this.add('find', node);
            this.add('exit', node);
            node = node.parentNode;
            this.add('name', node, args);
            this.add('wait', node, args);
            this.add('hide', node, args);
            cols = this.add('cols', node, args.cols_num);
            this.add('hint', node, args);
            this.add('rows', this.add('col', cols, 0), '|');
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
        args = typeof args == 'object' && args !== null ? args : {};

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
     * @property keys
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
         * Search text DOM node
         *
         * @type {object}
         */
        find : null,
        /**
         * Data fields custom names
         *
         * @type {object}
         */
        keys : {id : 'id', data : 'data', dead : 'dead', name : 'name', seek : 'seek'},
        /**
         * Last result of this.get(...)
         *
         * @type {object}
         */
        last : null,
        /**
         * Root DOM node
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
         * @returns {object}
         */
        add : function(what, where, args) {
            args = args !== undefined ? args : {};

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
                // Insert raw DOM node
                case 'raw':
                    if (args instanceof HTMLElement) {
                        where.appendChild(args);
                        return args;
                    }
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
                case 'exit':
                case 'find':
                case 'hide':
                case 'hint':
                case 'name':
                case 'seek':
                case 'unit':
                case 'wait':
                    temp = {className : 'sdm__' + what};

                    if (what == 'find') {
                        temp.tagName      = 'input';
                        temp.placeholder  = typeof args[what + '_txt'] == 'string' ?
                                            args[what + '_txt'] :
                                            'Search';
                        temp.autocomplete = "off";
                    } else if (typeof args[what + '_txt'] == 'string') {
                        temp.title = args[what + '_txt'];
                    } else if (what == 'hint') {
                        temp.title = 'Single click — expand; double click — select; ' +
                                     'Ctrl + double click — multi select or Cmd + double click; ' +
                                     'Esc — close'
                    }

                    return self.create(temp, where);
                break;
            }

            return null;
        },
        /**
         * Get DOM element(s) or dom property
         *
         * @param {string}                          what
         * @param {undefined|boolean|string|object} from
         * @param {undefined|boolean}               save
         *
         * @returns {string|object}
         */
        get : function(what, args, save) {
            var
                last = null;

            // Switch between queues
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
                    last = self.parent.document.getElementById(
                        'sdm_' + this.parent.id + '_' + what + '_' + args
                    );
                break;
                // Get the columns wrapper node
                case 'cols':
                    last = this.root.querySelector('.sdm__cols');
                break;
                // Get the next or the first row
                case 'row:next':
                case 'row:previous':
                    if (this.parent.opened) {
                        last = this.get('row', this.parent.opened, save);
                        last = last ?
                               last[what.replace('row:', '') + 'Sibling'] :
                               this.get('row:first', save);
                    } else {
                        last = this.get('row:first', save);
                    }
                break;
                // Get the first row in child rows group
                case 'row:child':
                    last = this.get('rows', args);
                    last = last && last.firstChild ? last.firstChild : null;
                break;
                // Get the very first row
                case 'row:first':
                    last = this.root.querySelector(
                        '.sdm__col:first-child ' +
                        '.sdm__rows:' + (
                            this.parent.mode == 'seek' ?
                            'first' :
                            'last'
                        ) + '-child ' +
                        '.sdm__row:first-child'
                    );
                break;
                // Get the rows matched to the search criteria
                case 'row:match':
                    last = this.root.querySelectorAll(
                        '.sdm__row[data-seek^="' + args + '"],' +
                        '.sdm__row[data-seek*="' + args + '"]'
                    );
                break;
                // Get all selected rows
                case 'row:holded':
                    last = this.root.querySelectorAll(
                        '.sdm__row_is_holded'
                    );
                break;
                // Get a parent row
                case 'row:parent':
                    last = this.get('row', args);
                    last = this.get('row', this.get('id', last.parentNode));
                break;
                // Get all displayed columns, rows groups and rows
                case ':opened':
                    last = this.root.querySelectorAll(
                        '.sdm__col_is_opened,' +
                        '.sdm__row_is_opened,' +
                        '.sdm__rows_are_opened'
                    );
                break;
                // Get DOM node for global events
                case 'event:root':
                    if (args == 'keydown') {
                        last = self.parent.document.body
                    } else if (args == 'keyup') {
                        last = this.find;
                    } else {
                        last = this.root;
                    }
                break;
            }

            return (save === true || args === true ? (this.last = last) : last);
        },
        /**
         * Deselect the row
         *
         * @param {object}            node
         * @param {string}            as
         * @param {string}            is
         * @param {undefined|boolean} rm
         */
        mod : function(node, alias, value, clear) {
            node.className = node.className.replace(
                new RegExp((
                    value === false || clear === false ?
                    '\\s*sdm(__\\S+)?_' + alias + '(_' + (value ? value : '\\S+') + ')+' :
                    '^sdm(__\\S*)?'
                ), value === false ? 'g' : ''),
                (
                    value === false || clear === false ?
                    '' :
                    'sdm$1 sdm$1_' + alias + (value ? '_' + value : '')
                )
            );
        },
        /**
         * Remove an instance
         */
        kill : function() {
            delete this.last;
            delete this.parent;
            this.root.innerHTML = '';
            delete this.root;
        },
        /**
         * Scroll to the chosen column
         *
         * @param {undefined|boolean} yoff
         */
        move : function(yoff) {
            var
                row = this.last,
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
                parent = this.get('row', pid, true);

            // Create a new column if not exist
            if (!col) {
                col = this.add('col', cols, deep);
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
                        this.mod(parent, 'data', 'loading', false);
                        this.mod(parent, 'data', 'rows');
                    }

                    // Save the rows
                    while (++it0 < ln0) {
                        item = data[it0];

                        // Render item
                        if (item instanceof HTMLElement) {
                            rows.appendChild(item);
                        } else {
                            this.add('row', rows, {
                                dead : item[this.keys.dead] ? true : false,
                                id   : item[this.keys.id],
                                name : item[this.keys.name],
                                seek : item[this.keys.seek] ?
                                       item[this.keys.seek] :
                                       item[this.keys.name].toLowerCase()
                            });
                        }

                        // Render subitems
                        if (item[this.keys.data]) {
                            this.push(
                                item[this.keys.data],
                                item[this.keys.id],
                                deep + 1,
                                cols
                            );
                        }
                    }
                break;
                // Subcontent is html
                case 'string':
                    // Set the row subitems type and save preview HTML
                    if (parent) {
                        this.mod(parent, 'data', 'loading', false);
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
 *
 * @namespace SDM.Events
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
                auto    = this.auto.split(';'),
                handler = null;

            // Setup main properties
            this._saved = {};
            this.parent  = parent;

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
     * @returns {object}
     */
    self.sub = function(node, type, func) {
        node.addEventListener(type, func);
    }

    /**
     * Short alias for clearTimeout()
     *
     * @param {number} timer
     */
    self.halt = function(timer) {
        self.parent.parent.clearTimeout(timer);
    }

    /**
     * Short alias for setTimeout()
     *
     * @param {function} handler
     * @param {number}   delay
     */
    self.wait = function(handler, delay) {
        return self.parent.parent.setTimeout(handler, delay);
    }

    /**
     * @instance
     *
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
         * @type {string}
         */
        auto : 'fail;' +
               'drawstart;drawfinish;' +
               'dropstart;dropfinish;' +
               'holdstart;holdfinish;' +
               'loadstart;loadfinish;' +
               'openstart;openfinish;' +
               'seekstart;seekfinish;' +
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
                node    = null,
                handler = this._saved[event];

            if (
                typeof handler == 'function' &&
                (node = this.parent.gui.get('event:root', event))
            ) {
                self.off(node, event, handler);
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
                node = null;

            if (
                typeof this._saved[event] == 'function' &&
                (node = this.parent.gui.get('event:root', event))
            ) {
                self.pub(node, event, data);
            } else if (data.done) {
                data.done(data.id);
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
                node  = null;

            if (
                this.auto.match(new RegExp('(^|;)' + event)) &&
                (node = this.parent.gui.get('event:root', event))
            ) {
                this.off(event);

                this._saved[event] = handler;

                self.sub(node, event, handler);
            }
        },
        /**
         * Stop an event timer
         *
         * @param {string} timer
         *
         * @returns {boolean}
         */
        halt : function(timer) {
            if (typeof this._saved[timer] == 'number') {
                self.halt(this._saved[timer]);

                delete this._saved[timer];

                return true;
            }

            return false;
        },
        /**
         * Remove an instance
         */
        kill : function() {
            var
                al0  = '',
                type = '',
                item = null;

            for (al0 in this._saved) {
                item = this._saved[al0];
                type = typeof item;

                switch (type) {
                    case 'number':
                        this.halt(al0);
                    break;
                    case 'function':
                        this.off(al0);
                    break;
                }
            }

            delete this._saved;
            delete this.parent;
        },
        /**
         * Fire an event with timer
         *
         * @param {string} timer
         * @param {object} handler
         * @param {number} delay
         */
        wait : function(timer, handler, delay) {
            this.halt(timer);
            return (this._saved[timer] = self.wait(handler, delay));
        }
    };

    return self;

}).call(SDM);