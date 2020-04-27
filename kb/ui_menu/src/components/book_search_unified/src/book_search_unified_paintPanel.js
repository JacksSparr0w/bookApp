// PaintPanel

BookSearchUnified.PaintPanel = function (containerId) {
    this.containerId = containerId;

    this.modules = [
        new ModuleGeneralInfo(this),
        new ModuleCharacters(this)
    ];

    this.requiredKeynodes = this._collectRequiredKeynodes();
    this.keynodes = {};

    this.sc_type_arc_pos_var_perm = (sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm);
};

BookSearchUnified.PaintPanel.prototype = {

    init: function () {
        this._debugMessage("SearchComponent: initialize");

        this._initMarkup(this.containerId);
        this._resolveKeynodes();
    },

    getKeynode: function (idtf) {
        return this.keynodes[idtf];
    },


    _collectRequiredKeynodes: function () {
        var requiredKeynodes = [
            'book',
            'ui_menu_search_book_by_template',
            'book_search_pattern',
            'question_initiated',
            'question_finished',
            'rrel_1',
            'rrel_2',
            'rrel_3',
            'rrel_4',
            'rrel_5'
        ];

        // gather keynodes, that are required by modules
        // without duplicates
        this.modules.forEach(module => {
            module.getRequiredKeynodes().forEach(keynode => {
                if (!requiredKeynodes.includes(keynode))
                    requiredKeynodes.push(keynode);
            });
        });

        return requiredKeynodes;
    },

    _resolveKeynodes: function () {
        SCWeb.core.Server.resolveScAddr(this.requiredKeynodes, resolvedKeynodes => {
            this.keynodes = resolvedKeynodes;

            this._debugMessage("SearchComponent: keynodes resolved");

            this.modules.forEach(
                module => module.onKeynodesResolved()
            );
        });
    },

    _initMarkup: function (containerId) {
        this._debugMessage("SearchComponent: initializing html");

        var cont = $('#' + containerId);

        // book search panel
        cont.append(
            '<div class="panel panel-primary" id="book_search_panel" style="width: 70%;">' +
                '<div class="panel-heading"><h4 class="panel-title">Поиск книг</h4></div>' +
            '</div>'
        );

        // initialize modules markup
        this.modules.forEach(
            module => module.initMarkup("book_search_panel")
        );

        // submit button
        $('#book_search_panel').append(
            '<div class="col-sm-12" style="margin-top: 10px;">' +
                '<button id="find_books_button" type="button" class="btn btn-primary btn-block" value>Найти книги</button>' +
            '</div>'
        );

        $('#find_books_button').click(
            () => this._findBooks()
        );
    },

    _getTotalSelectedCriteriaCount: function () {
        var criteriaCount = 0;

        this.modules.forEach(
            module => criteriaCount += module.getSelectedCriteriaCount()
        );

        return criteriaCount;
    },

    _findBooks: function () {
        this._debugMessage("SearchComponent: start searching books");

        if (Object.keys(this.keynodes).length != this.requiredKeynodes.length) {
            alert("Ошибка! Не удалось найти необходимые понятия");
            return;
        }

        if (this._getTotalSelectedCriteriaCount() == 0) {
            alert("Необходимо задать хотя бы один критерий поиска.");
            return;
        }

        this._createSearchPattern().done(pattern => {
            this._debugMessage("SearchComponent: initiating search agent");

            // initiate ui_menu_search_book_by_template command
            var command = this.getKeynode('ui_menu_search_book_by_template');
            SCWeb.core.Main.doCommand(command, [pattern], result => {
                this._debugMessage("pattern executed");

                if (result.question != undefined)
                    SCWeb.ui.WindowManager.appendHistoryItem(result.question);
            });
        });    
    },

    _createSearchPattern: function () {
        var dfd = new jQuery.Deferred();

        this._debugMessage("SearchComponent: creating search pattern");

        // create pattern
        window.sctpClient.create_node(sc_type_node | sc_type_const).done(pattern => {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, this.getKeynode('book_search_pattern'), pattern)

            // create book
            window.sctpClient.create_node(sc_type_node | sc_type_var).done(book => {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, pattern, book);

                // connect book to book class
                window.sctpClient.create_arc(this.sc_type_arc_pos_var_perm, this.getKeynode('book'), book).done(bookArc => {
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, pattern, bookArc);
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, pattern, this.getKeynode('book'));

                    // fill created pattern with selected criteria
                    this._fillSearchPattern(pattern).done(
                        () => dfd.resolve(pattern)
                    ).fail(
                        () => dfd.reject()
                    );

                }).fail(
                    () => dfd.reject()
                );
            }).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _fillSearchPattern: function (pattern) {
        this._debugMessage("SearchComponent: filling search pattern with criteria");

        var dfd = new jQuery.Deferred();
        var promises = [];
                    
        // append modules criteria to the pattern
        this.modules.forEach( module => {
            if (module.getSelectedCriteriaCount() > 0)
                promises.push(module.appendCriteriaToPattern(pattern))
        });

        Promise.all(promises).then(
            () => dfd.resolve()
        ).catch(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    appendParameter: function (params, param, rrel_ordinal) {
        var dfd = new jQuery.Deferred();
        
        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, params, param).done(param_arc => {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, rrel_ordinal, param_arc).done(
                () => dfd.resolve()
            ).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    createQuestion: function (question_class, params) {
        var dfd = new jQuery.Deferred();

        window.sctpClient.create_node(sc_type_const).done(question => {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, question, params).done(() => {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, question_class, question).done(
                    () => dfd.resolve(question)
                ).fail(
                    () => dfd.reject()
                );
            }).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    initializeAgent: function (question_idtf, params) {
        var dfd = new jQuery.Deferred();

        this._debugMessage(`SearchComponent: initializing agent '${question_idtf}'`);

        this.createQuestion(this.getKeynode(question_idtf), params).done( question => {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, this.getKeynode('question_initiated'), question).done( () => {

                var eventID;
                window.sctpClient.event_create(SctpEventType.SC_EVENT_ADD_INPUT_ARC, question, (addr, arg) => {

                    window.sctpClient.get_arc(arg).done( arc => {
                        if (arc[0] == this.getKeynode('question_finished'))
                        {
                            this._debugMessage(`SearchComponent: ${question_idtf} finished (event id = ${eventID})`);

                            // TODO: fix event destroying 
                            /*
                            window.sctpClient.event_destroy(eventID).done( () => {
                                this._debugMessage(`SearchComponent: destroyed event (id = ${eventID})`);
                            }).fail( () => {
                                this._debugMessage(`SearchComponent: failed to destroy event (id = ${eventID})`);
                            });
                            */

                            dfd.resolve();
                        }
                    });
                }).done( ID => {
                        this._debugMessage(`SearchComponent: registered event for '${question_idtf}' (event id = ${ID})`);
                        eventID = ID;
                    }
                ).fail(
                    () => dfd.reject()
                );
            }).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _debugMessage: function (message) {
        console.log(message);
    }
};