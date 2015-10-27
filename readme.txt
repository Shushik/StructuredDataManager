
    Tree structured data manager (ex b-finder)

    Working example: http://silkleo.ru/fun/SDM



    Goods:

    — no external libraries required (Vanilla JS);
    — simple syntax.



    Constructor params list:

     param | value
    ==========================================================================
     args | StructuredDataManager settings object.
    ==========================================================================



    Settings object properties:

     alias           | value
    ==========================================================================
     hold_cls        | True if multiselect is allowed.
    --------------------------------------------------------------------------
     cols_num        | Number of columns visible in frame (2—5).
    --------------------------------------------------------------------------
     drop_ttl        | Number of seconds Finder will wait for the row
                     | holding success.
    --------------------------------------------------------------------------
     hold_ttl        | Number of seconds Finder will wait for the row
                     | holding success.
    --------------------------------------------------------------------------
     load_ttl        | Number of seconds Finder will wait for the data
                     | loading success.
    --------------------------------------------------------------------------
     view_ttl        | Number of seconds Finder will wait for the row
                     | viewing success.
    --------------------------------------------------------------------------
     id              | SDM instance id. This instance could be found after
                     | the initiation by StructuredDataManager[id].
    --------------------------------------------------------------------------
     name_txt        | Title text.
    --------------------------------------------------------------------------
     hide_txt        | Hide controll title text.
    --------------------------------------------------------------------------
     hint_txt        | Bottom hint text.
    --------------------------------------------------------------------------
     wrapper         | String with the CSS path or DOM node for the wrapper
                     | HTML element. document.body by default.
    --------------------------------------------------------------------------
     ondrawstart     | Handler for the event, firing when the module
                     | rendering starts. Takes a DOM.Event object as the only
                     | argument.
    --------------------------------------------------------------------------
     ondropstart     | 
    --------------------------------------------------------------------------
     onholdstart     | Handler for the event, firing when user selects any
                     | row by mouse doubleclick or enter key. It can be used
                     | to make any external actions, related to this action.
                     | Takes a DOM.Event object as the only argument.
                     |
                     | event.detail property contains the following
                     | properties and methods:
                     | — id     — selected row ids, separated with commas;
                     | — done() — runs the successful finish;
                     | — fail() — runs the unsuccessful finish.
    --------------------------------------------------------------------------
     onloadstart     | Handler for the event, firing when the module instance
                     | inits and need the data structure for the module DOM
                     | building. Doesn't fire if .data property in arguments
                     | has been given. Takes a DOM.Event object as the only
                     | argument.
                     |
                     | event.detail property contains the following
                     | properties and methods:
                     | — done — runs the successfull finish;
                     | — fail — runs the unsuccessful finish.
    --------------------------------------------------------------------------
     onopenstart     | Handler for the event, firing when user put a visual
                     | cursor on a row, and this row has a related content,
                     | not loaded yet. Takes a DOM.Event object as the only
                     | argument.
                     |
                     | event.detail property contains the following
                     | properties and methods:                     
                     | — id     — selected row id;
                     | — done() — runs the successful finish, takes a html
                     |            code string or an array with the rows data;
                     | — fail() — runs the unsuccessful finish.
    --------------------------------------------------------------------------
     ondrawfinish    | Handler for the event, firing when the module
                     | rendering finishes. Takes a DOM.Event object as the
                     | only argument.
    --------------------------------------------------------------------------
     ondropfinish    | 
    --------------------------------------------------------------------------
     onholdfinish    | Handler for the event, firing when all module actions,
                     | related to the successful finishing of onholdstart
                     | event. Takes a DOM.Event object as the only argument.
    --------------------------------------------------------------------------
     onloadfinish    | Handler for the event, firing when all module actions,
                     | related to the succesful finishing of onloadstart
                     | event. Takes a DOM.Event object as the only argument.
    --------------------------------------------------------------------------
     onopenfinish    | Handler for the event, firing when all module actions,
                     | related to the successful finishing of onview event.
                     | Takes a DOM.Event object as the only argument.
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
     mode            | One of two possible modes: observe or search.
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

     method          | value
    ==========================================================================
     back()          | Move cursor to the previous row.
    --------------------------------------------------------------------------
     drop()          | Deselect the selected row (with mouse doubleclick or
                     | enter keypress). Takes the following arguments:
                     | — id — id of the row that should be selected (if not
                              given, all selected rows will be deselected).
    --------------------------------------------------------------------------
     fail()          | Default error handler.
    --------------------------------------------------------------------------
     hide()          | Hide instance window.
    --------------------------------------------------------------------------
     hold()          | Select the row by its id (like with mouse doubleclick
                     | or enter keypress). Takes the following arguments:
                     | — id  — id of the row that should be selected;
                     | — add — true if there's no need to deselect previously
                     |         selected rows and the .multiple setting was
                     |         set on true.
    --------------------------------------------------------------------------
     kill()          | Destroy an instance.
    --------------------------------------------------------------------------
     load()          | Load main data structure.
    --------------------------------------------------------------------------
     move()          | Scroll to the row, which has been focused before.
    --------------------------------------------------------------------------
     next()          | Move cursor to the next row.
    --------------------------------------------------------------------------
     open()          | Set a cursor to the row and show all the subitems
                     | related to it. Takes the following arguments:
                     | — id — id of the row that should be focused.
    --------------------------------------------------------------------------
     push()          | 
    --------------------------------------------------------------------------
     pull()          | 
    --------------------------------------------------------------------------
     quit()          | Move cursor from the related items to the parent row.
    --------------------------------------------------------------------------
     show()          | Show instance window.
    --------------------------------------------------------------------------
     shut()          | Remove a cursor from the row and hide all the subitems
                     | related to it.
    --------------------------------------------------------------------------
     step()          | Move cursor from the parent row to the related items.
    --------------------------------------------------------------------------
     wait()          | Turn on or off the progressbar. Takes the following
                     | arguments:
                     | — alias — name of the action that inited the
                     |           progressbar, if nothing given, hides the
                     |           progressbar.
    ==========================================================================