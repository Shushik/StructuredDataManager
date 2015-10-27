
    Tree structured data manager (ex b-finder)

    Working example: http://silkleo.ru/fun/SDM



    Goods:

    — no external libraries required (Vanilla JS);
    — simple syntax.



    Constructor params list:

     param | value
    ==========================================================================
     args  | StructuredDataManager settings object.
    ==========================================================================



    Settings object properties:

     alias               | value
    ==========================================================================
     hold_cls            | True if multiselect is allowed.
    --------------------------------------------------------------------------
     cols_num            | Number of columns visible in frame (2—5).
    --------------------------------------------------------------------------
     drop_ttl            | Number of seconds module will wait for the row
                         | deselection success.
    --------------------------------------------------------------------------
     hold_ttl            | Number of seconds module will wait for the row
                         | selection success.
    --------------------------------------------------------------------------
     load_ttl            | Number of seconds module will wait for the data
                         | load success.
    --------------------------------------------------------------------------
     open_ttl            | Number of seconds module will wait for the cursor
                         | set success.
    --------------------------------------------------------------------------
     id                  | SDM instance id. This instance could be found
                         | after the initiation by StructuredDataManager[id].
    --------------------------------------------------------------------------
     name_txt            | Title text.
    --------------------------------------------------------------------------
     hide_txt            | Hide controll title text.
    --------------------------------------------------------------------------
     hint_txt            | Bottom hint text.
    --------------------------------------------------------------------------
     wrapper             | String with the CSS path or DOM node for the wrapper
                         | HTML element. document.body by default.
    --------------------------------------------------------------------------
     ondrawstart(event) | Handler for the event, firing when the module
                         | rendering starts. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     ondropstart(event) | Handler for the event, firing when user deselects
                         | any row by mouse doubleclick or enter key.
                         | Takes a DOM.Event object as the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — done() — finish process successful;
                         | — fail() — finish process unsuccessful;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onholdstart(event) | Handler for the event, firing when user selects any
                         | row by mouse doubleclick or enter key. Takes
                         | a DOM.Event object as the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — done() — finish process successful;
                         | — fail() — finish process unsuccessful;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onloadstart(event) | Handler for the event, firing when user loads data.
                         | Takes a DOM.Event object as the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — done() — finish process successful;
                         | — fail() — finish process unsuccessful;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onopenstart(event) | Handler for the event, firing when user sets cursor
                         | at the row by mouse click or keyboard keys. Takes
                         | a DOM.Event object as the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — done() — finish process successful;
                         | — fail() — finish process unsuccessful;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     ondrawfinish(event) | Handler for the event, firing when the module
                         | rendering finishes. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     ondropfinish(event) | Handler for the event, firing when ondropstart
                         | has been finished. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onholdfinish(event) | Handler for the event, firing when onholdstart
                         | has been finished. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onloadfinish(event) | Handler for the event, firing when onloadstart
                         | has been finished. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    --------------------------------------------------------------------------
     onopenfinish(event) | Handler for the event, firing when onloadstart
                         | has been finished. Takes a DOM.Event object as
                         | the only argument.
                         |
                         | event.detail property contains the following
                         | properties and methods:
                         | — id     — selected row id;
                         | — hide() — hide module;
                         | — show() — show module.
    ==========================================================================



    Instance properties:

     property        | value
    ==========================================================================
     id              | Instance id.
    --------------------------------------------------------------------------
     gui             | 
    --------------------------------------------------------------------------
     args            | Parsed and cleaned user arguments.
    --------------------------------------------------------------------------
     events          | 
    --------------------------------------------------------------------------
     holded          | Ids of rows which have been selected by mouse
                     | doubleclick or enter keypress, separated with the
                     | comma.
    --------------------------------------------------------------------------
     opened          | Row which has been focused by mouse singleclick.
    --------------------------------------------------------------------------
     pulling         | 
    ==========================================================================



    Instance methods (chaining available):

     method           | value
    ==========================================================================
     back()           | Move cursor to the previous row.
    --------------------------------------------------------------------------
     drop(id)         | Deselect the selected row (with mouse doubleclick or
                      | enter keypress).
                      |
                      | Takes the following arguments:
                      | — id — id of the row that should be selected (if not
                      |        given, all selected rows will be deselected).
    --------------------------------------------------------------------------
     hide()           | Hide instance window.
    --------------------------------------------------------------------------
     hold(id, add)    | Select the row by its id (like with mouse doubleclick
                      | or enter keypress).
                      |
                      | Takes the following arguments:
                      | — id  — id of the row that should be selected;
                      | — add — true if there's no need to deselect
                      |         previously selected rows and the hold_cls key
                      |         in the args was set on true.
    --------------------------------------------------------------------------
     kill()           | Destroy an instance.
    --------------------------------------------------------------------------
     load()           | Load main data structure.
    --------------------------------------------------------------------------
     move()           | Scroll to the row, which has been focused before.
    --------------------------------------------------------------------------
     next()           | Move cursor to the next row.
    --------------------------------------------------------------------------
     open(id)         | Set a cursor to the row and show all the subitems
                      | related to it.
                      |
                      | Takes the following arguments:
                      | — id — id of the row that should be focused.
    --------------------------------------------------------------------------
     pull(id, action) | Initiate an external action (to load data
                      | for example).
                      |
                      | Takes the following arguments:
                      | — id     — id of the row;
                      | — action — action name (drop, hold, load, open).
    --------------------------------------------------------------------------
     push(id, data)   | Add a row into the module structure.
                      |
                      | Takes the following arguments:
                      | — id   — id of the parent row («-» if root);
                      | — data — array with the row.
    --------------------------------------------------------------------------
     quit()           | Move cursor from the related items to the parent row.
    --------------------------------------------------------------------------
     show()           | Show instance window.
    --------------------------------------------------------------------------
     shut()           | Remove a cursor from the row and hide all the
                      | subitems related to it.
    --------------------------------------------------------------------------
     step()           | Move cursor from the parent row to the related items.
    ==========================================================================



    Row data:

    It should be html string or array with the row data objects of the
    following structure.

     key             | value
    ==========================================================================
     dead            | True if this row should be disabled.
    --------------------------------------------------------------------------
     id              | Row id.
    --------------------------------------------------------------------------
     name            | Row title.
    --------------------------------------------------------------------------
     seek            | Row search index string. If not given it will
                     | autofilled with the row title in lowercase.
    --------------------------------------------------------------------------
     data            | Array of the children rows objects with the similar
                     | structure.
    ==========================================================================