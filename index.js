/**
 * Tree structured data manager (ex b-finder)
 *
 * @page     https://github.com/Shushik/StructuredDataManager
 * @since    11.2015
 * @author   Shushik <silkleopard@yandex.ru>
 * @license  GNU LGPL
 * @version  2.0
 * @tutorial readme.txt
 *
 * @class SDM
 */
var SDM = SDM || (function() {

    /**
     * @constructor
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
     * @static
     *
     * @member {string} version
     */
    self.version = '2.0';

    /**
     * Local window link
     *
     * @static
     *
     * @member {object} parent
     */
    self.parent = this;

    /**
     * Local document link
     *
     * @static
     *
     * @member {object} document
     */
    self.document = this.document;

    /**
     * Instance id
     *
     * @member {number} id
     */
    self.prototype.id = 0;

    /**
     * Module mode
     *
     * @member {string} mode
     */
    self.prototype.mode = 'view';

    /**
     * Selected rows ids
     *
     * @member {string} holded
     */
    self.prototype.holded = '';

    /**
     * Id of the row on which the cursor has been set
     *
     * @member {string} opened
     */
    self.prototype.opened = '';

    /**
     * Search text
     *
     * @member {string} seeked
     */
    self.prototype.seeked = '';

    /**
     * Binded instance methods stack
     *
     * @private
     *
     * @member {object} _binded
     */
    self.prototype._binded = null;

    /**
     * Gui operations module instance link
     *
     * @see    SDM.Gui
     * @member {object} gui
     */
    self.prototype.gui = null;

    /**
     * Events operations module instance link
     *
     * @see    SDM.Events
     * @member {object} events
     */
    self.prototype.events = null;

    /**
     * DOM events router
     *
     * @private
     *
     * @method  _live
     * @param   {object} event
     * @listens {keyup|keydown|mousedown}
     * @returns {object}
     */
    self.prototype._live = function(event) {
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
    }

    /**
     * Initiate DOM search
     *
     * @private
     *
     * @method _seek
     */
    self.prototype._seek = function() {
        var
            it0  = -1,
            ln0  = 0,
            row  = null,
            fake = null,
            real = this.gui.get('rows', '-'),
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

            // Get the new root rows group
            fake = this.gui.get('rows', '|');

            // Replace
            this.gui.mod(real, 'id', false);
            this.gui.mod(real, 'id', '|');
            this.gui.mod(fake, 'id', false);
            this.gui.mod(fake, 'id', '-');

            real = fake;
        }

        // Clean previous results
        real.innerHTML = '';

        // Clone row nodes and put them into fake rows group
        if (
            (rows = this.gui.get('row:match', this.seeked.toLowerCase())) &&
            (ln0 = rows.length)
        ) {
            while (++it0 < ln0) {
                row = rows[it0].cloneNode();
                this.gui.add('raw', real, row);
            }
        }

        // Set counter badge
        this.gui.find.parentNode.title = ln0;
    }

    /**
     * Click pseudoevent handler
     *
     * @private
     *
     * @method _click
     */
    self.prototype._click = function() {
        this.open();
        this.gui.move(true);
    }

    /**
     * Keyup event handler
     *
     * @private
     *
     * @method _keyup
     * @param  {object} event
     */
    self.prototype._keyup = function(event) {
        var
            id = '';

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
                // Cancel the search action
                this.events.halt('keyup');

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
    }

    /**
     * Finish the holding process
     *
     * @private
     *
     * @method _droped
     * @param  {string}           id
     * @param  {undefined|object} data
     */
    self.prototype._droped = function(id) {
        this.push(id, null, 'drop');
    }

    /**
     * Finish the holding process
     *
     * @private
     *
     * @method _holded
     * @param  {string}           id
     * @param  {undefined|object} data
     */
    self.prototype._holded = function(id, data) {
        this.push(id, data, 'hold');
    }

    /**
     * Finish the loading process
     *
     * @private
     *
     * @method _loaded
     * @param  {string}           id
     * @param  {undefined|object} data
     */
    self.prototype._loaded = function(id, data) {
        this.push(id, data, 'load');
    }

    /**
     * Finish the opening process
     *
     * @private
     *
     * @method _opened
     * @param  {string}           id
     * @param  {undefined|object} data
     */
    self.prototype._opened = function(id, data) {
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
    }

    /**
     * Keydown event handler
     *
     * @private
     *
     * @method _keydown
     * @param  {object} event
     */
    self.prototype._keydown = function(event) {
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
    }

    /**
     * Doubleclick pseudoevent handler
     *
     * @private
     *
     * @method _dblclick
     * @param  {boolean} ctrl
     */
    self.prototype._dblclick = function(ctrl) {
        if (this.mode == 'seek') {
            this.lose();
            this.open(this.opened);
            this.gui.move();
        } else {
            this.hold(this.opened, ctrl);
            this.gui.move(true);
        }
    }

    /**
     * Mousedown event handler
     *
     * @private
     *
     * @method _mousedown
     * @param  {object} event
     */
    self.prototype._mousedown = function(event) {
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
            // Hide control has been clicked
            case 'sdm': case 'hide':
                this.hide();
            break;
        }
    }

    /**
     * Set cursor at the upper row
     *
     * @method  bwd
     * @returns {object}
     */
    self.prototype.bwd = function() {
        this.open(this.gui.get('row:previous', true));
        return this;
    }

    /**
     * Set cursor at the first child row
     *
     * @method  dwd
     * @returns {object}
     */
    self.prototype.dwd = function() {
        this.open(this.gui.get('row:child', this.opened, true));
        return this;
    }

    /**
     * Set cursor at the downer row
     *
     * @method  fwd
     * @returns {object}
     */
    self.prototype.fwd = function() {
        this.open(this.gui.get('row:next', true));
        return this;
    }

    /**
     * Set cursor at the parent row
     *
     * @method  uwd
     * @returns {object}
     */
    self.prototype.uwd = function() {
        this.open(this.gui.get('row:parent', this.opened, true));
        return this;
    }

    /**
     * Deselect a row
     *
     * @method  drop
     * @param   {undefined|string|object} id
     * @returns {object}
     */
    self.prototype.drop = function(id) {
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
    }

    /**
     * Common error handler
     *
     * @method  fail
     * @param   {undefined|string} text
     * @fires   SDM.fail
     * @returns {object}
     */
    self.prototype.fail = function(id, text) {
        // Turn the progress bar off
        this.gui.mod(this.gui.root, 'is', 'waiting', false);

        /**
         * Tell subscribers action has been failed
         *
         * @event SDM#fail
         *
         * @property {object}   event
         * @property {object}   event.detail
         * @property {string}   event.detail.id
         * @property {function} event.detail.hide
         * @property {function} event.detail.show
         */
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

        return this;
    }

    /**
     * Hide module
     *
     * @method  hide
     * @returns {object}
     */
    self.prototype.hide = function() {
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
    }

    /**
     * Select a row
     *
     * @method  hold
     * @param   {string}  id
     * @param   {boolean} add
     * @returns {object}
     */
    self.prototype.hold = function(id, add) {
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
    }

    /**
     * Init the module
     *
     * @method  init
     * @param   {object} args
     * @returns {object}
     */
    self.prototype.init = function(args) {
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
            failed : this.fail.bind(this),
            holded : this._holded.bind(this),
            loaded : this._loaded.bind(this),
            opened : this._opened.bind(this)
        };

        return this;
    }

    /**
     * Destroy an instance
     *
     * @method kill
     */
    self.prototype.kill = function() {
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
    }

    /**
     * Clear the search results
     *
     * @method  lose
     * @returns {object}
     */
    self.prototype.lose = function() {
        var
            fake = this.gui.get('rows', '-'),
            real = this.gui.get('rows', '|');

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
            this.gui.mod(fake, 'id', false);
            this.gui.mod(fake, 'id', '|');
            this.gui.mod(real, 'id', false);
            this.gui.mod(real, 'id', '-');

            // Clean results
            fake.innerHTML = '';
        }

        return this;
    }

    /**
     * Set a cursor to the row
     *
     * @method  open
     * @param   {undefined|string|object} id
     * @returns {object}
     */
    self.prototype.open = function(id) {
        var
            row = null;

        // Set the current row id
        if (typeof id == 'string') {
            this.opened = id;
        } else if (id instanceof HTMLElement) {
            row = id;
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
    }

    /**
     * Pull external data
     *
     * @method  pull
     * @param   {string} id
     * @param   {string} action
     * @fires   SDM#loadstart
     * @fires   SDM#dropstart
     * @fires   SDM#holdstart
     * @fires   SDM#openstart
     * @returns {object}
     */
    self.prototype.pull = function(id, action) {
        action = typeof action == 'string' ? action : 'load';

        // No need to go further
        if (typeof id != 'string' && id != '-') {
            return this;
        }

        // Turn the progress bar on
        this.gui.mod(this.gui.root, 'is', 'waiting');

        /**
         * Tell subscribers action has been started
         *
         * @event SDM#loadstart
         * @event SDM#dropstart
         * @event SDM#holdstart
         * @event SDM#openstart
         *
         * @property {object}   event
         * @property {object}   event.detail
         * @property {string}   event.detail.id
         * @property {function} event.detail.done
         * @property {function} event.detail.fail
         * @property {function} event.detail.hide
         * @property {function} event.detail.show
         */
        this.events.pub(action + 'start', {
            id   : id,
            done : this._binded[action + 'ed'],
            fail : this._binded.failed,
            hide : this._binded.hide,
            show : this._binded.show
        });

        return this;
    }

    /**
     * Add the rows
     *
     * @method  push
     * @param   {string}           id
     * @param   {object}           data
     * @param   {undefined|string} action
     * @fires   SDM#drawstart
     * @fires   SDM#drawfinish
     * @fires   SDM#loadfinish
     * @fires   SDM#dropfinish
     * @fires   SDM#holdfinish
     * @fires   SDM#openfinish
     * @returns {object}
     */
    self.prototype.push = function(id, data, action) {
        var
            deep = 0,
            type = typeof data,
            row  = null;

        // Finish started action
        if (typeof action == 'string') {
            this.gui.mod(this.gui.root, 'is', 'waiting', false);

            /**
             * Tell subscribers action has been finished
             *
             * @event SDM#loadfinish
             * @event SDM#dropfinish
             * @event SDM#holdfinish
             * @event SDM#openfinish
             *
             * @property {object}   event
             * @property {object}   event.detail
             * @property {string}   event.detail.id
             * @property {function} event.detail.hide
             * @property {function} event.detail.show
             */
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

            /**
             * Tell subscribers rendering action has been started
             *
             * @event SDM#drawstart
             *
             * @property {object}   event
             * @property {object}   event.detail
             * @property {string}   event.detail.id
             * @property {function} event.detail.hide
             * @property {function} event.detail.show
             */
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

            /**
             * Tell subscribers rendering action has been finished
             *
             * @event SDM#drawfinish
             *
             * @property {object}   event
             * @property {object}   event.detail
             * @property {string}   event.detail.id
             * @property {function} event.detail.hide
             * @property {function} event.detail.show
             */
            this.events.pub('drawfinish', {
                id   : id,
                hide : this._binded.hide,
                show : this._binded.show
            });
        }

        return this;
    }

    /**
     * Find a word in the rows
     *
     * @method  seek
     * @param   {string} what
     * @returns {object}
     */
    self.prototype.seek = function(what) {
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
    }

    /**
     * Show module
     *
     * @method  show
     * @returns {object}
     */
    self.prototype.show = function() {
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
    }

    /**
     * Remove cursors from all rows in chain and hide
     * all rows groups and columns
     *
     * @method  shut
     * @returns {object}
     */
    self.prototype.shut = function() {
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

    return self;

})();



/**
 * Gui operations module
 *
 * @class SDM.Gui
 */
SDM.Gui = SDM.Gui || (function() {

    /**
     * @constructor
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
     * @member {object} parent
     */
    self.parent = this;

    /**
     * Create a DOM node using given arguments and append it
     *
     * @static
     *
     * @method create
     * @param  {object}           args
     * @param  {undefined|object} save
     * @param  {undefined|object} before
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
     * Search text DOM node
     *
     * @member {object} find
     */
    self.prototype.find = null;

    /**
     * Data fields custom names
     *
     * @member {object} keys
     */
    self.prototype.keys = {id : 'id', data : 'data', dead : 'dead', name : 'name', seek : 'seek'};

    /**
     * Last result of this.get(...)
     *
     * @member {object} last
     */
    self.prototype.last = null;

    /**
     * Root DOM node
     *
     * @member {object} root
     */
    self.prototype.root = null;

    /**
     * Link to the parent module instance
     *
     * @member {object} parent
     */
    self.prototype.parent = null;

    /**
     * Create a row, rows group, column or columns wrapper
     *
     * @method  add
     * @param   {string}        what
     * @param   {object}        where
     * @param   {string|object} args
     * @returns {object}
     */
    self.prototype.add = function(what, where, args) {
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
                    className : 'sdm__col sdm__col_id_' + args
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
                    title     : args.name,
                    className : 'sdm__row sdm__row_id_' + args.id +
                                (args.dead ? ' sdm__row_data_dead' : ''),
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
                    className : 'sdm__rows sdm__rows_id_' + args
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
    }

    /**
     * Get DOM element(s) or dom property
     *
     * @method  get
     * @param   {string}                          what
     * @param   {undefined|boolean|string|object} from
     * @param   {undefined|boolean}               save
     * @returns {string|object}
     */
    self.prototype.get = function(what, args, save) {
        var
            last = null;

        // Switch between queues
        switch (what) {
            // Get a clean id of the row or rows group
            case 'id':
                if (args instanceof HTMLElement) {
                    console.log(args.className.replace(
                        /[\s\S]*sdm__(col|row|rows)_id_(\S*)[\s\S]*/,
                        '$2'
                    ));
                    return args.className.replace(
                        /[\s\S]*sdm__(col|row|rows)_id_(\S*)[\s\S]*/,
                        '$2'
                    );
                }
            break;
            // Get the column, rows group or row node
            case 'col':
            case 'row':
            case 'rows':
                last = this.root.getElementsByClassName(
                           'sdm__' + what + '_id_' + args
                       );
                last = last && last.length ? last[0] : null;
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
    }

    /**
     * Deselect the row
     *
     * @method mod
     * @param  {object}            node
     * @param  {string}            alias
     * @param  {boolean|string}    value
     * @param  {undefined|boolean} clear
     */
    self.prototype.mod = function(node, alias, value, clear) {
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
    }

    /**
     * Remove an instance
     *
     * @method kill
     */
    self.prototype.kill = function() {
        delete this.last;
        delete this.parent;
        this.root.innerHTML = '';
        delete this.root;
    }

    /**
     * Scroll to the chosen column
     *
     * @method move
     * @param  {undefined|boolean} yoff
     */
    self.prototype.move = function(yoff) {
        var
            row = this.last,
            col = null;

        if (row && (col = row.parentNode.parentNode)) {

            if (!yoff) {
                col.scrollTop = row.offsetTop;
            }

            col.parentNode.scrollLeft = col.offsetLeft;
        }
    }

    /**
     * Create cols and rows
     *
     * @method push
     * @param  {object}           data
     * @param  {number}           pid
     * @param  {undefined|number} _deep
     * @param  {undefined|object} _cols
     */
    self.prototype.push = function(data, pid, _deep, _cols) {
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

    return self;

}).call(SDM);



/**
 * Events operations module
 *
 * @class SDM.Events
 */
SDM.Events = SDM.Events || (function() {

    /**
     * @constructor
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
     * @member {object} parent
     */
    self.parent = this;

    /**
     * Remove the custom event subscription
     *
     * @static
     *
     * @method off
     * @param  {object}   node
     * @param  {string}   type
     * @param  {function} func
     */
    self.off = function(node, type, func) {
        node.removeEventListener(type, func);
    }

    /**
     * Fire a custom event
     *
     * @static
     *
     * @method pub
     * @param  {object}   node
     * @param  {string}   type
     * @param  {function} func
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
     * @method sub
     * @param  {object}   node
     * @param  {string}   type
     * @param  {function} func
     *
     * @returns {object}
     */
    self.sub = function(node, type, func) {
        node.addEventListener(type, func);
    }

    /**
     * Short alias for clearTimeout()
     *
     * @static
     *
     * @method halt
     * @param  {number} timer
     */
    self.halt = function(timer) {
        self.parent.parent.clearTimeout(timer);
    }

    /**
     * Short alias for setTimeout()
     *
     * @static
     *
     * @method wait
     * @param  {function} handler
     * @param  {number}   delay
     */
    self.wait = function(handler, delay) {
        return self.parent.parent.setTimeout(handler, delay);
    }

    /**
     * Available events list
     *
     * @member {string} auto
     */
    self.prototype.auto = 'fail;' +
                          'drawstart;drawfinish;' +
                          'dropstart;dropfinish;' +
                          'holdstart;holdfinish;' +
                          'loadstart;loadfinish;' +
                          'openstart;openfinish;' +
                          'seekstart;seekfinish;' +
                          'losestart;losefinish;' +
                          'shutstart;shutfinish;' +
                          'keyup;keydown;mousedown';

    /**
     * Saved events handlers stack (for clean removing)
     *
     * @private
     *
     * @member {object} _saved
     */
    self.prototype._saved = null;

    /**
     * Link to the parent module instance
     *
     * @member {object} parent
     */
    self.prototype.parent = null;

    /**
     * Remove an event
     *
     * @method off
     * @param  {string} event
     */
    self.prototype.off = function(event) {
        var
            node    = null,
            handler = this._saved[event];

        if (
            typeof handler == 'function' &&
            (node = this.parent.gui.get('event:root', event))
        ) {
            self.off(node, event, handler);
        }
    }

    /**
     * Fire an event
     *
     * @method pub
     * @param  {string} event
     * @param  {object} data
     */
    self.prototype.pub = function(event, data) {
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
    }

    /**
     * Subscribe to an event
     *
     * @method sub
     * @param  {string}   event
     * @param  {function} handler
     */
    self.prototype.sub = function(event, handler) {
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
    }

    /**
     * Stop an event timer
     *
     * @method  halt
     * @param   {string} timer
     * @returns {boolean}
     */
    self.prototype.halt = function(timer) {
        if (typeof this._saved[timer] == 'number') {
            self.halt(this._saved[timer]);
            delete this._saved[timer];
            return true;
        }

        return false;
    }

    /**
     * Remove an instance
     *
     * @method kill
     */
    self.prototype.kill = function() {
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
    }

    /**
     * Fire an event with timer
     *
     * @method  wait
     * @param   {string} timer
     * @param   {object} handler
     * @param   {number} delay
     * @returns {number}
     */
    self.prototype.wait = function(timer, handler, delay) {
        this.halt(timer);
        return (this._saved[timer] = self.wait(handler, delay));
    }

    return self;

}).call(SDM);