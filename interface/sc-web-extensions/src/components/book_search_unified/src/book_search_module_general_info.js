function ModuleGeneralInfo(parent) {
    this.parent = parent;
}

ModuleGeneralInfo.prototype = {

    getRequiredKeynodes: function () {
        return [
            'genre',
            'question_append_general_info_to_pattern'
        ];
    },

    getSelectedCriteriaCount: function () {
        var criteriaCount = 0;

        if ($("#author_field").val() != "")
            ++criteriaCount;

        if ($("#genre_check").prop('checked'))
            ++criteriaCount;

        if ($("#lang_check").prop('checked'))
            ++criteriaCount;

        return criteriaCount;
    },

    initMarkup : function (containerId) {
        this._debugMessage("initializing html");

        var container = $('#' + containerId);

        // form
        container.append('<div class="container-fluid" id="book_search_container"><form id="book_search_form">');

        // author name
        $('#book_search_form').append(
            '<div class="form-group row">' +
                '<label class="col-sm-2 col-form-label" for="author_field">Имя автора:</label>' +
                '<div class="col-sm-7">' +
                    '<input id="author_field" class="form-control" type="text" placeholder="введите имя автора">' +
                '</div>' +
            '</div>'
        );

        // genre
        $('#book_search_form').append(
            '<div class="form-group row">' + 
                '<label class="col-sm-2 col-form-label" for="genre_select">Жанр:</label>' +
                '<div class="col-sm-4">' +
                    '<select id="genre_select" class="form-control" disabled></select>' +
                '</div>' +
                '<div class="form-check col-sm-3 book_search_checkbox">' +
                    '<input id="genre_check" class="form-check-input" type="checkbox">' +
                    '<label class="form-check-label book_search_checkbox_label" for="genre_check">Учитывать жанр</label>' +
                '</div>' +
            '</div>'
        );

        // language
        $('#book_search_form').append(
            '<div class="form-group row">' + 
                '<label class="col-sm-2 col-form-label" for="lang_select">Язык:</label>' +
                '<div class="col-sm-4">' +
                    '<select id="lang_select" class="form-control" disabled></select>' +
                '</div>' +
                '<div class="form-check col-sm-3 book_search_checkbox">' +
                    '<input id="lang_check" class="form-check-input" type="checkbox">' +
                    '<label class="form-check-label book_search_checkbox_label" for="lang_check">Учитывать язык</label>' +
                '</div>' +
            '</div>'
        );

        // enable/disable genre select on checkbox click
        $('#genre_check').click(function () {
            var checked = $('#genre_check').prop('checked');
            $('#genre_select').prop('disabled', !checked);
        });

        // enable/disable language select on checkbox click
        $('#lang_check').click(function () {
            var checked = $('#lang_check').prop('checked');
            $('#lang_select').prop('disabled', !checked);
        });
    },

    onKeynodesResolved: function () {
        this._debugMessage("keynodes resolved");
        this._fillDropDownLists();
    },

    appendCriteriaToPattern: function (pattern) {
        this._debugMessage("appending selected criteria to pattern");

        var dfd = new jQuery.Deferred();

        window.sctpClient.create_node(sc_type_const).done(params => {
            
            var promises = [];
            promises.push(this.parent.appendParameter(params, pattern, this._getKeynode("rrel_1")));
            
            var authorName = $("#author_field").val();
            if (authorName != "")
                promises.push(this._appendAuthorNameParameter(params));

            if ($("#genre_check").prop('checked'))
                promises.push(this._appendGenreParameter(params));

            if ($("#lang_check").prop('checked'))
                promises.push(this._appendLanguageParameter(params));

            Promise.all(promises).then(() => {
                this.parent.initializeAgent('question_append_general_info_to_pattern', params).done(
                    () => dfd.resolve()
                ).fail(
                    () => dfd.reject()
                );
            }).catch(
                () => dfd.reject()
            );

        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendAuthorNameParameter: function (params) {
        var dfd = new jQuery.Deferred();

        this._debugMessage("appending author name");
        
        window.sctpClient.create_link().done(authorLink => {
            var authorName = $("#author_field").val();
            window.sctpClient.set_link_content(authorLink, authorName).done(() => {
                this.parent.appendParameter(params, authorLink, this._getKeynode("rrel_2")).done(
                    () => dfd.resolve()
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

    _appendGenreParameter: function (params) {
        var dfd = new jQuery.Deferred();

        this._debugMessage("appending genre");

        var genre = $("#genre_select option:selected").val();
        this.parent.appendParameter(params, genre, this._getKeynode("rrel_3")).done(
            () => dfd.resolve()
        ).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendLanguageParameter: function (params) {
        var dfd = new jQuery.Deferred();

        this._debugMessage("appending language");

        var lang = $("#lang_select option:selected").val();
        this.parent.appendParameter(params, lang, this._getKeynode("rrel_4")).done(
            () => dfd.resolve()
        ).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _getKeynode: function (idtf) {
        return this.parent.getKeynode(idtf);
    },

    _fillDropDownLists: function () {
        this._debugMessage("filling dropdown lists");

        // fill genres list
        window.scHelper.getSetElements(this._getKeynode('genre')).done(genres => {
            $.each(genres, (index, genre_addr) => {
                window.scHelper.getIdentifier(genre_addr, scKeynodes.lang_ru).done(genre_idtf => {
                    $('#genre_select').append($('<option>', { value : genre_addr }).text(genre_idtf));
                })
            });
        });

        // fill languages list
        window.scHelper.getLanguages().done(languages => {
            $.each(languages, (index, lang_addr) => {
                window.scHelper.getIdentifier(lang_addr, scKeynodes.lang_ru).done(lang_idtf => {
                    $('#lang_select').append($('<option>', { value : lang_addr }).text(lang_idtf));
                })
            });
        });
    },

    _debugMessage: function (msg) {
        this.parent._debugMessage("ModuleGeneralInfo: " + msg);
    }
};