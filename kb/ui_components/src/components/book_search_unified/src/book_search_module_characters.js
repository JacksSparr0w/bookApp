function ModuleCharacters(parent) {
    this.parent = parent;

    this.characters = 0;
    this.maxCharacters = 5;
}

ModuleCharacters.prototype = {

    getRequiredKeynodes: function () {
        return [
            'male',
            'female',
            'rrel_main_character',
            'question_append_character_to_pattern'
        ];
    },

    getSelectedCriteriaCount: function () {
        var criteriaCount = 0;

        for (var i = 0; i < this.characters; ++i) {

            if ($(`#name_field_${i}`).val() != "")
                ++criteriaCount;

            if ($(`#gender_check_${i}`).prop('checked'))
                ++criteriaCount;

            if ($(`#type_check_${i}`).prop('checked'))
                ++criteriaCount;
        }

        return criteriaCount;
    },

    initMarkup : function (containerId) {
        this._debugMessage("initializing html");

        var container = $('#' + containerId);

        // form
        container.append('<div class="container-fluid"><form id="characters_form">');

        // 'add character' button
        $('#characters_form').append(
            '<hr/>' +
            '<button id="add_character_button" type="button" class="btn btn-secondary">Добавить персонажа</button>' +
            '<hr/>'
        );

        $('#add_character_button').click(
            () => this._addCharacter()
        );
    },

    onKeynodesResolved: function () {
        this._debugMessage("keynodes resolved (nothing to do)");
    },

    appendCriteriaToPattern: function (pattern) {
        this._debugMessage(`appending selected criteria to pattern (${this.characters} characters)`);

        var dfd = new jQuery.Deferred();

        // append each character to pattern
        var promises = [];
        for (var i = 0; i < this.characters; ++i) {
            promises.push(this._appendCharacterToPattern(pattern, i));
        }

        Promise.all(promises).then(
            () => dfd.resolve()
        ).catch(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendCharacterToPattern: function (pattern, index) {
        this._debugMessage(`appending character ${index} to pattern`);
        
        var dfd = new jQuery.Deferred();

        window.sctpClient.create_node(sc_type_const).done( params => {

            var promises = [];
            promises.push(this.parent.appendParameter(params, pattern, this._getKeynode("rrel_1")));

            var name = $(`#name_field_${index}`).val();
            if (name != "")
                promises.push(this._appendCharacterNameParameter(params, index));

            if ($(`#genre_check_${index}`).prop('checked'))
                promises.push(this._appendCharacterGenderParameter(params, index));

            if ($(`#lang_check_${index}`).prop('checked'))
                promises.push(this._appendCharacterTypeParameter(params, index));

            Promise.all(promises).then(() => {
                this.parent.initializeAgent('question_append_character_to_pattern', params).done(
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

    _appendCharacterNameParameter: function (params, index) {
        var dfd = new jQuery.Deferred();
        
        window.sctpClient.create_link().done( nameLink => {

            var name = $(`#name_field_${index}`).val();

            this._debugMessage(`appending name "${name}" of character ${index}`);

            window.sctpClient.set_link_content(nameLink, name).done(() => {
                this.parent.appendParameter(params, nameLink, this._getKeynode("rrel_2")).done(
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

    _appendCharacterGenderParameter: function (params, index) {
        var dfd = new jQuery.Deferred();

        var label = $(`#gender_select_${index} option:selected`).text();
        this._debugMessage(`appending gender "${label}" of character ${index}`);

        var gender = $(`#gender_select_${index} option:selected`).val();
        this.parent.appendParameter(params, gender, this._getKeynode("rrel_3")).done(
            () => dfd.resolve()
        ).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendCharacterTypeParameter: function (params, index) {
        var dfd = new jQuery.Deferred();

        var label = $(`#type_select_${index} option:selected`).text();
        this._debugMessage(`appending type "${label}" of character ${index}`);

        var type = $(`#type_select_${index} option:selected`).val();
        this.parent.appendParameter(params, type, this._getKeynode("rrel_4")).done(
            () => dfd.resolve()
        ).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _addCharacter: function () { 
        
        if (this.characters >= this.maxCharacters) {
            alert(`Лимит персонажей (${this.maxCharacters}) достигнут!`);
            return;
        }

        if (this.characters > 0)
            $('#characters_form').append('<hr/>');
        
        var index = this.characters;
        this.characters += 1;

        this._debugMessage(`adding character ${index}`);

        // name
        $('#characters_form').append(
            `<div class="form-group row">` +
                `<label class="col-sm-2 col-form-label" for="name_field_${index}">Имя:</label>` +
                `<div class="col-sm-7">` +
                    `<input id="name_field_${index}" class="form-control" type="text" placeholder="введите имя персонажа">` +
                `</div>` +
            `</div>`
        );

        // gender
        $('#characters_form').append(
            `<div class="form-group row">` + 
                `<label class="col-sm-2 col-form-label" for="gender_select_${index}">Пол:</label>` +
                `<div class="col-sm-4">` +
                    `<select id="gender_select_${index}" class="form-control" disabled></select>` +
                `</div>` +
                `<div class="form-check col-sm-3 book_search_checkbox">` +
                    `<input id="gender_check_${index}" class="form-check-input" type="checkbox">` +
                    `<label class="form-check-label book_search_checkbox_label" for="gender_check_${index}">Учитывать пол</label>` +
                `</div>` +
            `</div>`
        );

        // character type
        $('#characters_form').append(
            `<div class="form-group row">` + 
                `<label class="col-sm-2 col-form-label" for="type_select_${index}">Роль:</label>` +
                `<div class="col-sm-4">` +
                    `<select id="type_select_${index}" class="form-control" disabled></select>` +
                `</div>` +
                `<div class="form-check col-sm-3 book_search_checkbox">` +
                    `<input id="type_check_${index}" class="form-check-input" type="checkbox">` +
                    `<label class="form-check-label book_search_checkbox_label" for="type_check_${index}">Учитывать роль</label>` +
                `</div>` +
            `</div>`
        );

        // enable/disable gender select on checkbox click
        var gender_check = $(`#gender_check_${index}`);
        gender_check.click( () => {
            var checked = gender_check.prop('checked');
            $(`#gender_select_${index}`).prop('disabled', !checked);
        });

        // enable/disable type select on checkbox click
        var type_check = $(`#type_check_${index}`);
        type_check.click( () => {
            var checked = type_check.prop('checked');
            $(`#type_select_${index}`).prop('disabled', !checked);
        });

        this._fillDropdownLists(index);
    },

    _getKeynode: function (idtf) {
        return this.parent.getKeynode(idtf);
    },

    _fillDropdownLists: function (index) {
        this._debugMessage(`filling dropdown lists for character ${index}`);

        // fill genders list
        var gender = [ this._getKeynode('male'), this._getKeynode('female') ];

        $.each(gender, (i, gender_addr) => {
            window.scHelper.getIdentifier(gender_addr, scKeynodes.lang_ru).done( gender_idtf => {
                $(`#gender_select_${index}`).append($('<option>', { value : gender_addr }).text(gender_idtf));
            })
        });

        // fill roles list
        var roles = [ this._getKeynode('rrel_main_character') ];

        $.each(roles, (i, type_addr) => {
            window.scHelper.getIdentifier(type_addr, scKeynodes.lang_ru).done( type_idtf => {
                $(`#type_select_${index}`).append($('<option>', { value : type_addr }).text(type_idtf));
            })
        });
    },

    _debugMessage: function (msg) {
        this.parent._debugMessage("ModuleCharacters: " + msg);
    }
};