/**
 * Tree structured data manager (ex b-finder)
 *
 * @page    https://github.com/Shushik/StructuredDataManager
 * @author  Shushik <silkleopard@yandex.ru>
 * @version 2.0
 */
var StructuredDataManager = StructuredDataManager || (function() {

    /**
     * @constructor
     * 
     * @property _id
     * @property _events
     * @property _installed
     * @property parent
     * @property document
     *
     * @param {object} args
     */
    function
        self(args) {
            if (!(this instanceof self)) {
                return new self(args);
            }

            // Try to reach the arguments object
            args = typeof args == 'object' ? args : {};

            // Register an instance
            self._id++;
            this.id = (typeof args.id).match(/number|string/) ? args.id : self._id + '';
            self[this.id] = this;
            self._installed += (self._installed ? ',' : '') + this.id;

            // Set instance main variables
            this._setup(args);

            // Init the DOM module
            this._dom = new self.DOM(this._args);

            // Bind main module events handlers
            this._alive(args);

            // Start loading data
            if (args.data) {
                this._loaded(args.data);
            } else {
                this.load();
            }
        }

    /**
     * @property _dom
     * @property _mouse
     * @property _binded
     * @property _timers
     * @property id
     * @property mode
     * @property holded
     * @property viewed
     * @property waiting
     * @function _jump
     * @function _view
     * @function _alive
     * @function _moved
     * @function _route
     * @function _setup
     * @function _holded
     * @function _loaded
     * @function _render
     * @function _viewed
     * @function back
     * @function drop
     * @function fail
     * @function free
     * @function goin
     * @function hide
     * @function hold
     * @function kill
     * @function load
     * @function move
     * @function next
     * @function quit
     * @function show
     * @function view
     * @function wait
     */
    self.prototype = {
        /**
         * Mouse event indicator
         *
         * @private
         *
         * @type {boolean}
         */
        _mouse : false,
        /**
         * Instance id
         *
         * @type {string}
         */
        id : '',
        /**
         * Visibility indicator
         *
         * @type {string}
         */
        mode : '',
        /**
         * Chosen item id
         *
         * @type {string}
         */
        holded : '',
        /**
         * Selected item id
         *
         * @type {string}
         */
        viewed : '',
        /**
         * Waiting of some internal process indicator
         *
         * @type {boolean}
         */
        waiting : '',
        /**
         * Internal DOM links and methods
         *
         * @private
         *
         * @type {object}
         */
        _dom : null,
        /**
         * List of proxied methods links
         *
         * @private
         *
         * @type {object}
         */
        _binded : null,
        /**
         * Timers ids
         *
         * @private
         *
         * @type {object}
         */
        _timers : null,
        /**
         * Move the selection cursor to the next
         * or the previous item
         *
         * @param {string} way
         */
        _jump : function(way) {
            var
                node = null,
                ways = {back : 'previous', next : 'next'};

            // If nothing was selected yet, get the id
            // of the very first node
            if (!this.viewed && (node = this._dom.rows['root'])) {
                this.view(node.firstChild.getAttribute('data-id'));
                return;
            }

            // Choose the next or the previous node
            if (node = this._dom.cels[this.viewed]) {
                node = node[ways[way] + 'Sibling'];

                // Select the holded node
                if (node) {
                    this.view(node.getAttribute('data-id'));
                    node.parentNode.parentNode.scrollTop = node.offsetTop;
                }
            }
        },
        /**
         * Delayed row selection
         *
         * @private
         */
        _view : function() {
            // Turn the candybar on and wait for the loading
            this.wait('view');

            // 
            this._timers.view = self.parent.setTimeout(
                this._binded.fail,
                this._args.view * 1000
            );

            // 
            this._dom.pub('viewstart', {
                id   : this.viewed,
                done : this._binded.viewed,
                fail : this._binded.fail
            });
        },
        /**
         * Bind main module events handlers
         *
         * @param {object} args
         */
        _alive : function(args) {
            var
                it0 = 0,
                al0 = '',
                al1 = '',
                tm0 = self._events.split(',');

            // Common mousedown event
            this._dom.sub('dblclick', this._binded.route);
            this._dom.sub('mousedown', this._binded.route);

            // Custom events
            if (it0 = tm0.length) {
                while (--it0 > -1) {
                    al0 = tm0[it0];
                    al1 = 'on' + al0

                    // Set a handler given in this._args
                    if (typeof args[al1] == 'function') {
                        this._dom.sub(al0, args[al1]);
                    }
                }
            }
        },
        /**
         * Scroll to a viewed column
         *
         * @private
         */
        _moved : function() {
            var
                col = null,
                row = this._dom.cels[this.viewed];

            if (row) {
                // Get the previous or the current column
                col = row.parentNode.parentNode;
                col = col.previousSibling ? col.previousSibling : col;

                // Horisontal scrolling
                col.parentNode.scrollLeft = 0;
                col.parentNode.scrollLeft = col.offsetLeft;

                if (this._mouse) {
                    this._mouse = false;
                } else {
                    // Vertical scrolling
                    row.parentNode.scrollTop = 0;
                    row.parentNode.scrollTop = row.offsetTop;
                }
            }
        },
        /**
         * Events router
         *
         * @private
         *
         * @param {object} event
         */
        _route : function(event) {
            var
                code = event.keyCode ? event.keyCode : event.which,
                type = event.type,
                part = event.target.className,
                node = event.target;

            // Get a GUI part name
            part = node == self.document.body ? 'sdm__root' : part;
            part = part ? part.match(/^sdm(__\S+)*[\s\S]*/) : null;

            // Filter unfamiliar calls
            if (!part || this.waiting) {
                return;
            }

            // Get a short GUI part name
            part = part[0].replace(/\s[\s\S]*$/, '').replace(/sdm__/, '');

            if (type == 'dblclick') {
                if (part == 'row') {
                    this.hold(
                        node.getAttribute('data-id'),
                        this._args.multiple && (event.ctrlKey || event.metaKey) ?
                        true :
                        false
                    );
                }
            } else if (type == 'mousedown') {
                // Set mousedown indicator
                this._mouse = true;

                // Mouse events
                if (part == 'sdm' || part == 'hide') {
                    // Hide by clicking the empty space around or the cross control
                    this.hide();
                } else if (part == 'row') {
                    this.view(node.getAttribute('data-id'));
                }
            } else if (type == 'keydown') {
                // Just in case
                this._mouse = false;

                // Keyboard events
                if (code == 13) {
                    if (!this.viewed) {
                        this.next();
                    }

                    this.hold(this.viewed, (
                        this._args.multiple && (event.ctrlKey || event.metaKey) ?
                        true :
                        false
                    ));
                } else if (code == 27) {
                    this.hide();
                } else if (code == 37) {
                    event.preventDefault();
                    this.quit();
                } else if (code == 38) {
                    event.preventDefault();
                    this.back();
                } else if (code == 39) {
                    event.preventDefault();
                    this.goin();
                } else if (code == 40) {
                    event.preventDefault();
                    this.next();
                }
            }
        },
        /**
         * Set instance main variables
         *
         * @private
         *
         * @param {object} args
         * @param {object} node
         */
        _setup : function(args, node) {
            var
                al0 = '',
                al1 = '',
                al2 = '',
                tm0 = {hold : 5, load : 5, view : 5};

            // Check if the 
            if (args.wrapper instanceof HTMLElement) {
                node = args.wrapper;
            } else if (typeof args.wrapper == 'string') {
                node = self.document.querySelector(args.wrapper);
            }

            // Reset the selected row id
            this.viewed = '';

            // Parse and fix given arguments
            this._args = {
                multiple : args.multiple ? true : false,
                cols_num : args.cols_num > 1 && args.cols_num < 6 ? args.cols_num : 3,
                id       : this.id,
                hide_txt : args.hide_txt ? args.hide_txt + '' : '',
                hint_txt : args.hint_txt ?
                           args.hint_txt + '' :
                           'Single click — expand; double click — select; ' +
                           'Ctrl + double click — multi select or Cmd + double click; ' +
                           'Esc — close',
                name_txt : args.name_txt ? args.name_txt + '' : '',
                wrapper  : node ? node : self.document.body
            };

            // Save time limits for main events
            for (al0 in tm0) {
                al1 = 'on' + al0 + 'start';
                al2 = al0 + '_ttl';

                // Check if the start event handler is set
                if (typeof args[al1] == 'function') {
                    this._args[al0] = args[al2] > tm0[al0] ?
                                      args[al2] :
                                      tm0[al0];
                }
            }

            // Create the proxied methods links stack
            this._binded = {
                fail   : this.fail.bind(this),
                hide   : this.hide.bind(this),
                show   : this.show.bind(this),
                view   : this._view.bind(this),
                moved  : this._moved.bind(this),
                route  : this._route.bind(this),
                holded : this._holded.bind(this),
                loaded : this._loaded.bind(this),
                viewed : this._viewed.bind(this)
            };

            // Create the timers ids stack
            this._timers = {
                hold : 0,
                load : 0,
                move : 0,
                view : 0
            };
        },
        /**
         * The row has been succesfully holded
         */
        _holded : function() {
            if (this.waiting == 'hold') {
                // Clear the operation timeout
                if (this._timers.hold) {
                    self.parent.clearTimeout(this._timers.hold);
                }

                // Turn candybar off
                this.wait();

                // Tell that choosing has been finished
                this._dom.pub('holdfinish');
            }
        },
        /**
         * Data has been succesfully loaded
         *
         * @param {object} data
         */
        _loaded : function(data) {
            // Load has been finished
            if (this.waiting == 'load') {
                // Clear the operation timeout
                if (this._timers.load) {
                    self.parent.clearTimeout(this._timers.load);
                }

                // Turn candybar off
                this.wait();

                // Tell that loading has been finished
                this._dom.pub('loadfinish');
            }

            // Parse and render
            if (data instanceof Array) {
                this._render(data);
            }
        },
        /**
         * Render the rows using loaded data
         *
         * @private
         *
         * @param {object} data
         * @param {number} deep
         * @param {number} pid
         */
        _render : function(data, deep, pid) {
            pid  = pid ? pid : 'root';
            data = data instanceof Array ? data : [];
            deep = deep && typeof deep == 'number' ? deep : 0;

            var
                it0 = -1,
                ln0 = data.length,
                al0 = 'none',
                tm0 = null;

            // Rendering is started
            if (!deep) {
                this._dom.pub('renderstart');

                // Turn the candybar off
                this.wait('render');
            }

            // Iterate through the items
            while (++it0 < ln0) {
                tm0 = data[it0];
                al0 = self.DOM.identify(
                          tm0.data === true && this._args.view ?
                          true :
                          tm0.data
                      );

                // Render a row
                this._dom.row({
                    dead : tm0.dead ? true : false,
                    id   : tm0.id,
                    pid  : pid,
                    deep : deep,
                    name : tm0.name,
                    type : al0
                });

                // Render subitems
                if (al0 == 'list') {
                    this._render(
                        tm0.data,
                        deep + 1,
                        tm0.id
                    );
                } else if (al0 == 'html') {
                    this._dom.box({
                        pid  : tm0.id,
                        deep : deep + 1,
                        html : tm0.data,
                        type : al0
                    });
                }
            }

            // Rendering is finished
            if (!deep) {
                this._dom.pub('renderfinish');

                // Turn the candybar off
                this.wait();
            }
        },
        /**
         * The row has been succesfully viewed
         *
         * @param {undefined|object} data
         */
        _viewed : function(data) {
            var
                al0 = self.DOM.identify(data);
                tm0 = this._dom.cels[this.viewed];

            // Turn the candybar off
            if (this.waiting == 'view') {
                if (al0 == 'none') {
                    return this.fail();
                }

                // Mark row with its content type
                tm0.setAttribute('data-type', al0);

                // Render the rows using loaded data
                if (al0 == 'html') {
                    this._dom.box({
                        pid  : this.viewed,
                        deep : (tm0.parentNode.parentNode.getAttribute('data-deep') - 0) + 1,
                        html : data
                    });
                } else {
                    this._render(
                        data,
                        (tm0.parentNode.parentNode.getAttribute('data-deep') - 0) + 1,
                        this.viewed
                    );
                }

                // Turn candybar off
                this.wait();
            }

            // Rows group appears
            tm0 = this._dom.rows[this.viewed];
            tm0.className += ' sdm__rows_are_viewed';

            // Scroll to a viewed column
            this.move();
        },
        /**
         * Go to the previous item
         *
         * @return {object}
         */
        back : function() {
            this._jump('back');
            return this;
        },
        /**
         * Drop a row
         *
         * @param {undefined|number|string} id
         *
         * @return {object}
         */
        drop : function(id) {
            var
                it0 = 0,
                tm0 = this._dom.cels[id] ?
                      [this._dom.cels[id]] :
                      this._dom.root.querySelectorAll('.sdm__row_is_holded'),
                tm1 = null;

            it0 = tm0.length;

            // Unhold the holded nodes and remove ids from the holded ids list
            while (--it0 > -1) {
                tm1 = tm0[it0];
                tm1.className = tm1.className.replace(' sdm__row_is_holded', '');
                this.holded = this.holded.replace(new RegExp('(^|,)' + tm1.getAttribute('data-id')));
            }

            return this;
        },
        /**
         * Report an error message to console if development mode is on
         *
         * @return {object}
         */
        fail : function() {
            var
                node = this._dom.cels[this.viewed];

            // Unhold row
            if (this.waiting == 'hold') {
                if (node) {
                    node.className = node.className.replace(' sdm__row_is_holded', '');
                }
            } else if (this.waiting == 'view') {
                if (node) {
                    node.setAttribute('data-type', 'none');
                }
            }

            // Turn candybar off
            if (this.waiting) {
                this.wait();
            }

            return this;
        },
        /**
         * Clean the _viewed classes
         *
         * @return {object}
         */
        free : function() {
            var
                it0 = 0,
                tm0 = ['sdm__row_is_viewed', 'sdm__rows_are_viewed', 'sdm__col_is_viewed'],
                tm1 = this._dom.root.querySelectorAll('.' + tm0.join(',.')),
                tm2 = null;

            it0 = tm1.length;

            while (--it0 > -1) {
                tm2 = tm1[it0];
                tm2.className = tm2.className.replace(
                                    new RegExp(' (' + tm0.join('|') + ')'),
                                '');
            }

            return this;
        },
        /**
         * Move a cursor to the next column
         *
         * @return {object}
         */
        goin : function() {
            var
                node = null;

            // No idea where to go
            if (!this.viewed) {
                return this.next();
            }

            // Make a selection in the next column
            if (node = this._dom.rows[this.viewed]) {
                if (node = node.firstChild) {
                    this.view(node.getAttribute('data-id'));
                }
            }

            return this;
        },
        /**
         * Hide the manager
         *
         * @return {object}
         */
        hide : function() {
            this.mode = 'sleep';
            this._dom.root.className = this._dom.root.className.replace(' sdm_mode_observe', '');
            self.document.body.removeEventListener('keydown', this._binded.route);
            return this;
        },
        /**
         * Hold a row
         *
         * @param {number|string}     id
         * @param {undefined|boolean} add
         *
         * @return {object}
         */
        hold : function(id, add) {
            // Make a selection if needed
            if (!this.viewed || id != this.viewed) {
                this.view(id);
                id = this.viewed;
            }

            // Don't hold disabled rows
            if (this._dom.cels[id].className.indexOf('_is_dead') > -1) {
                return this;
            }

            // Unhold the row if it's already holded
            if (this.holded.match(new RegExp('(^|,)' + id))) {
                return this.drop(id);
            } else if (!add) {
                this.drop();
            }

            // Turn candybar on
            this.wait('hold');

            // Add a current row id to holded ids list
            this.holded += (this.holded ? ',' : '') + id;

            // Mark row as holded
            this._dom.cels[id].className += ' sdm__row_is_holded';

            // Set a timeout for the operation
            this._timers.hold = self.parent.setTimeout(
                this._binded.fail,
                (this._args.hold * 1000)
            );

            // Run the holdstart event
            this._dom.pub('holdstart', {
                id   : this.holded,
                done : this._binded.holded,
                fail : this._binded.fail
            });

            return this;
        },
        /**
         * Remove instance
         */
        kill : function() {
            // Hide the manager
            this.hide();

            // Remove events handlers
            this.off('dblclick', this._binded.route);
            this.off('mousedown', this._binded.route);

            // Remove instance id from the list
            self._installed = self._installed.replace(new RegExp(this.id + '(,|$)'));

            // Remove all instance DOM
            this._dom.root.parentNode.removeChild(this._dom.root);

            // Remove instance
            delete self[this.id];
        },
        /**
         * Parse loaded data and create rows
         *
         * @return {object}
         */
        load : function() {
            // Turn the candybar on
            this.wait('load');

            // Set a timeout for the operation
            this._timers.load = self.parent.setTimeout(
                this._binded.fail,
                (this._args.load * 1000)
            );

            // Fire the loadingstart event
            this._dom.pub('loadstart', {
                done : this._binded.loaded,
                fail : this._binded.fail
            });

            return this;
        },
        /**
         * Delay scroll to a viewed column
         *
         * @return {object
         */
        move : function() {
            if (this._timers.move) {
                self.parent.clearInterval(this._timers.move);
            }

            this._timers.move = self.parent.setTimeout(
                this._binded.moved,
                200
            );

            return this;
        },
        /**
         * Go to the next item
         *
         * @return {object}
         */
        next : function() {
            this._jump('next');
            return this;
        },
        /**
         * Return a column to the current column
         *
         * @return {object}
         */
        quit : function() {
            var
                node = null;

            // No idea where to go
            if (!this.viewed) {
                return this.next();
            }

            // Make a selection in a current column
            if (node = this._dom.cels[this.viewed]) {
                this.view(node.parentNode.getAttribute('data-id'));
            }

            return this;
        },
        /**
         * Show the manager
         *
         * @return {object}
         */
        show : function() {
            this.mode = 'observe';
            this._dom.root.className += ' sdm_mode_observe';
            self.document.body.addEventListener('keydown', this._binded.route);
            return this;
        },
        /**
         * Select a row
         *
         * @param {number|string}     id
         * @param {undefined|boolean} _tech (internal usage only)
         *
         * @return {object}
         */
        view : function(id, _tech) {
            var
                tm0 = this._dom.cels[id],
                tm1 = this._dom.rows[id];

            if (tm0) {
                if (_tech === undefined) {
                    // Save the viewed row id and unselect the selected rows
                    this.viewed = id + '';
                    this.free();

                    if (tm0.className.indexOf('_is_dead') == -1) {
                        //
                        if (this._timers.view) {
                            self.parent.clearTimeout(this._timers.view);
                        }

                        if (tm1) {
                            // Finish viewing immediately
                            this._viewed();
                        } else if (tm0.getAttribute('data-type') == 'load') {
                            //
                            if (!this._mouse) {
                                this._timers.view = self.parent.setTimeout(
                                    this._binded.view,
                                    200
                                );
                            } else {
                                this._view();
                            }
                        }
                    }
                }

                // Row selects
                tm0.className += ' sdm__row_is_viewed';

                // Rows group appears
                tm0 = tm0.parentNode;
                id  = tm0.getAttribute('data-id');
                tm0.className += ' sdm__rows_are_viewed';

                // Column appears
                tm0 = tm0.parentNode;
                tm0.className += ' sdm__col_is_viewed';

                // Next column appears
                if (_tech === undefined && (tm0 = tm0.nextSibling)) {
                    tm0.className += ' sdm__col_is_viewed';
                }

                // Previous column appears
                if (id) {
                    this.view(id, false);
                }

                // Scroll to a viewed column
                this.move();
            }

            return this;
        },
        /**
         * Turn the candybar on or off
         *
         * @param {undefined|string} alias
         *
         * @return {object}
         */
        wait : function(alias) {
            if (this.waiting) {
                // Turn off the candybar
                this.waiting = '';
                this._dom.root.className = this._dom.root.className.
                                           replace(' sdm_is_waiting', '');
            } else {
                // Turn on the candybar
                this.waiting = typeof alias == 'string' ? alias : 'something';
                this._dom.root.className += ' sdm_is_waiting';
            }

            return this;
        }
    }

    /**
     * Global id iterator
     *
     * @static
     * @private
     *
     * @type {number}
     */
    self._id = 0;

    /**
     * Available module custom events list
     *
     * @type {string}
     */
    self._events = 'holdstart,holdfinish,' +
                   'loadstart,loadfinish,' +
                   'viewstart,viewfinish,' +
                   'renderstart,renderfinish';

    /**
     * Installed modules ids
     *
     * @static
     * @private
     *
     * @type {string}
     */
    self._installed = '';

    /**
     * Link to the window object
     *
     * @static
     *
     * @type {object}
     */
    self.parent = this;

    /**
     * Link to the document object
     *
     * @static
     *
     * @type {object}
     */
    self.document = this.document;

    return self;

})();



StructuredDataManager.DOM = StructuredDataManager.DOM || (function() {

    /**
     * @constructor
     *
     * @property parent
     * @function create
     * @function identify
     * 
     * @param {object} args
     */
    function
        self(args) {
            var
                it0  = args.cols_num,
                node = args.wrapper;

            // Root (curtain) node
            node = this.root = self.create({
                className : 'sdm'
            }, node);

            // GUI window
            node = self.create({
                className : 'sdm__unit'
            }, node);

            // Candybar
            node = this.wait = self.create({
                className : 'sdm__wait'
            }, node);

            // Title
            node = this.name = self.create({
                title     : args.name_txt,
                className : 'sdm__name'
            }, node.parentNode);

            // Hide control
            node = this.hide = self.create({
                title     : args.hide_txt,
                className : 'sdm__hide'
            }, node.parentNode);

            // Hint string
            node = this.hint = self.create({
                className : 'sdm__hint',
                innerHTML : args.hint_txt
            }, node.parentNode);

            // Create needed number of columns
            this.cols = it0;
            this.cels = {};
            this.rows = {};
        }

    /**
     * @property cels
     * @property cols
     * @property name
     * @property root
     * @property rows
     * @property wait
     * @function box
     * @function col
     * @function off
     * @function pub
     * @function row
     * @function sub
     */
    self.prototype = {
        /**
         * Items nodes stack
         *
         * @type {object}
         */
        cels : null,
        /**
         * Columns nodes stack
         *
         * @type {object}
         */
        cols : null,
        /**
         * Title node
         *
         * @type {object}
         */
        name : null,
        /**
         * Root node
         *
         * @type {object}
         */
        root : null,
        /**
         * Groups nodes stack
         *
         * @type {object}
         */
        rows : null,
        /**
         * Candybar node
         *
         * @type {object}
         */
        wait : null,
        /**
         * Create a row info node
         *
         * @param {object} data
         */
        box : function(data) {
            var
                node = null;

            // Create a column node if not exists
            if (!this.cols[data.deep]) {
                this.col();
            }

            // Create a rows wrapper node if not exists
            if (!this.rows[data.pid]) {
                this.rows[data.pid] = self.create({
                    className : 'sdm__rows',
                    data      : {
                        id : data.pid
                    }
                }, this.cols[data.deep]);
            }

            // Create a row info node
            self.create({
                className : 'sdm__box',
                innerHTML : data.html
            }, this.rows[data.pid]);
        },
        /**
         * Create a column node
         */
        col : function() {
            var
                cols = 0,
                node = null;

            if (typeof this.cols == 'number') {
                // Get a needed number of nodes
                cols = this.cols;
                this.cols = [];

                // Create columns DOM node
                node = self.create({
                    data      : {
                        cols : cols
                    },
                    className : 'sdm__cols'
                }, this.root.firstChild);
            } else {
                // Get columns DOM node
                node = this.cols[0].parentNode;
            }

            // Create the column DOM node
            this.cols.push(self.create({
                className : 'sdm__col',
                data      : {
                    deep : this.cols.length
                }
            }, node, this.sbox));
        },
        /**
         * Remove the custom event subscription
         *
         * @param {string}   type
         * @param {function} func
         *
         * @return {object}
         */
        off : function(type, func) {    
            this.root.removeEventListener(type, func);
            return this;
        },
        /**
         * Fire a custom event
         *
         * @param {string}   type
         * @param {function} func
         *
         * @return {object}
         */
        pub : function(type, data) {
            data = typeof data == 'object' ? data : {};

            var
                event = self.parent.document.createEvent('CustomEvent');

            event.initCustomEvent(type, false, false, data);
            this.root.dispatchEvent(event);

            return this;
        },
        /**
         * Create a row node
         *
         * @param {object} data
         */
        row : function(data) {
            var
                node = null;

            // Create a column node if not exists
            if (!this.cols[data.deep]) {
                this.col();
            }

            // Create a rows wrapper node if not exists
            if (!this.rows[data.pid]) {
                this.rows[data.pid] = self.create({
                    className : 'sdm__rows',
                    data      : {
                        id : data.pid
                    }
                }, this.cols[data.deep]);
            }

            // Create a row node
            this.cels[data.id] = self.create({
                title     : data.name,
                className : 'sdm__row' + (data.dead ? ' sdm__row_is_dead' : ''),
                data      : {
                    id   : data.id,
                    sid  : data.name.toLowerCase(),
                    type : data.type
                }
            }, this.rows[data.pid]);
        },
        /**
         * Subscribe to a custom event
         *
         * @param {string}   type
         * @param {function} func
         *
         * @return {object}
         */
        sub : function(type, func) {
            this.root.addEventListener(type, func);
            return this;
        }
    };

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
     * Get a type for a given data
     *
     * @static
     *
     * @param {undefined|boolean|string|object} data
     *
     * @return {string}
     */
    self.identify = function(data) {
        var
            al0 = typeof data,
            tm0 = {
                      'object'  : 'list',
                      'string'  : 'html',
                      'boolean' : 'load'
                  };

        if (tm0[al0]) {
            return tm0[al0];
        }

        return 'none';
    }

    return self;

}).call(StructuredDataManager)