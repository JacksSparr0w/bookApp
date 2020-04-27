/**
 * Paint panel.
 */
 var numerOfFields = 1;
 var patternIsCreated = false;
 var genderParamIs = false;
 var nameParamIs = false;
 var typeParamIs = false;

BookSearch.PaintPanel = function (containerId) {
    this.containerId = containerId;

    this.sc_type_arc_pos_var_perm = sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm;
};

BookSearch.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

            new Promise(function(resolve){
                window.sctpClient.create_node(sc_type_node | sc_type_const ).done(function(allInfoNode){
                window.sctpClient.create_link().done(function(allInfoNodeLink){
                window.sctpClient.set_link_content(allInfoNodeLink, 'setChar');
                window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, allInfoNode, allInfoNodeLink).done(function(generatedCommonArc){
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, scKeynodes.nrel_system_identifier, generatedCommonArc).done(function(){
                        resolve(allInfoNode);
                        console.log("ok");
                    });
                });
                });
                });    
            }).then((response) => {
                var self = this;
                container.append('<div class="sc-no-default-cmd">Поиск книги</div>');
                container.append('<input type="button" class = "button-search" value="Добавить поле" id="add-field-1">');
                container.append('<input type = "button" class = "button-search" value= "Добавить информацию" id = "add-info-1"> ');
                container.append('<input type = "button" class = "button-search" value = " Сгенерировать шаблон" id= "create-pattern">');
                container.append('<input type = "button" class = "button-search" value = " Начать поиск" id= "search-button">');
                container.append('<br>');

                $('#add-field-1').click(function () {
                    self._addNewParam(containerId);
                });

                $('#add-info-1').click(function () {
                    self._addNewInfo(containerId);
                });

                $('#create-pattern').click(function () {
                    self._createNewPattern(numerOfFields, response);
                });
                $('#search-button').click(function () {
                    self._searchBook(response);
                });                
            });
    },

    _searchBook: function(allInfoNode){
        console.log("run search");

        SCWeb.core.Server.resolveScAddr(["ui_menu_search_book_by_characters"], function(data){
            var cmd = data["ui_menu_search_book_by_characters"];
            SCWeb.core.Main.doCommand(cmd, [allInfoNode], function(result){
                if (result.question != undefined){
                    SCWeb.ui.WindowManager.appendHistoryItem(result.question);
                }            
            });
        });
    },

    _addToPattern: function (pattern, addr) {
        window.scHelper.checkEdge(pattern, sc_type_arc_pos_const_perm, addr).fail(function () {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, pattern, addr);
        });
    },

    _addNewParam: function(divId){

        var container = $('#' + divId);
        var new_param_field_addr, name_addr, age_addr, gender_addr, type_addr, fem_addr, male_addr;
        var resolving_addrs = [
            'nrel_character_gender',
            'nrel_character_name',
            'nrel_main_idtf',
            'nrel_character_type',
            'female_character',
            'male_character',
            'concept_person',
            'concept_dog',
            'concept_cat'
        ];

        SCWeb.core.Server.resolveScAddr(resolving_addrs, function(keynodes){
            gender_addr = keynodes['nrel_character_gender'];
            name_addr = keynodes['nrel_main_idtf'];
            type_addr = keynodes['nrel_character_type'];
            // age_addr = keynodes['nrel_character_age'];
            fem_addr = keynodes['female_character'];
            male_addr = keynodes['male_character'];  
            person_addr = keynodes['concept_person'];
            dog_addr = keynodes['concept_dog'];
            cat_addr = keynodes['concept_cat'];         

            
            var all_addr = [gender_addr, name_addr, type_addr,/*age_addr,*/ fem_addr, male_addr];
            SCWeb.core.Server.resolveIdentifiers(all_addr, function(keynodes){
                var character_params = [gender_addr, name_addr, type_addr];
                var character_params_name = [];
                var strProm = "";
                for (var i = 0; i <= character_params.length - 1; i++) {
                    character_params_name[i] = keynodes[character_params[i]];
                    strProm = strProm + ((i+1)+"."+" "+character_params_name[i]+"\n");
                }
                var param_to_create_addr;
                var attr = prompt(strProm);
                switch(attr){
                    case '1': if(!genderParamIs){param_to_create_addr = character_params[0];
                        container.append("<select id =\"gender_id\"><option value=\""+ male_addr+"\">Мужской</option><option value=\""+ fem_addr+"\">Женский</option></select>");
                        genderParamIs = true;}
                        else{alert("Вы уже добавляли данный параметр");}
                        break;
                    case '2': if(!nameParamIs){param_to_create_addr = character_params[1];
                        var name_of_nrel = keynodes[param_to_create_addr];
                        container.append("<input type = \"text\" placeholder = \""+name_of_nrel+"\" id = \"name_id\">"); 
                        nameParamIs = true;}
                        else {alert("Вы уже добавляли данный параметр");}
                        break;
                    case '3': if (!typeParamIs){param_to_create_addr = character_params[2];
                        container.append("<select placeholder = \"Выберите вид персонажа\" id = \"type_id\"><option value = \""+person_addr+"\">Человек</option><option value = \""+dog_addr+"\">Пес</option><option value=\""+cat_addr+"\">Кот</option></select>");
                        typeParamIs = true;}
                        else {alert("Вы уже добавляли данный параметр");}
                        break;
                    // case '4': param_to_create_addr = character_params[3];
                    // var name_of_nrel = keynodes[param_to_create_addr];
                    // container.append("<input type = \"text\" placeholder = \""+name_of_nrel+"\" id = \"age_id\">");
                    //     break;
                }
            });     
        });
    },

    /*добавление нового персонажа*/
    _addNewInfo: function(containerId){
        var container = $('#' + containerId);
        if(patternIsCreated){
            $("#name_id").remove();
            $("#gender_id").remove();
            $("#type_id").remove();
            numerOfFields++;
            genderParamIs = false;
            nameParamIs = false;
            typeParamIs = false;

        }
        else alert("Необходимо сформировать шаблон, иначе данные будут потеряны!");

    },
    /*формирование шаблона*/
    _createNewPattern: function(numerOfFields, allInfoNode){
        var self = this;
        
        var  fem_addr, male_addr, person_addr, dog_addr, cat_addr, char_addr;
        var resolving_addrs = [
            'female_character',
            'male_character',
            'concept_person',
            'concept_dog',
            'concept_cat',
            'lit_person',
            'resolving_link',
            'nrel_sc_text_translation'
        ];

        SCWeb.core.Server.resolveScAddr(resolving_addrs, function(keynodes){
            
            fem_addr = keynodes['female_character'];
            male_addr = keynodes['male_character'];
            person_addr = keynodes['concept_person'];
            dog_addr = keynodes['concept_dog'];
            cat_addr = keynodes['concept_cat'];
            char_addr = keynodes['lit_person'];
            resolving_link = keynodes['resolving_link'];
            translation = keynodes['nrel_sc_text_translation'];

            var temp_char = 'new_char_' + numerOfFields;

            // создаем узел персонажа
            new Promise (function(resolve){
                window.sctpClient.create_node(sc_type_node | sc_type_var).done(function(nameGenCharName){
                    window.sctpClient.create_link().done(function(nameGenCharLink){
                        self._addToPattern(allInfoNode, nameGenCharName);

                        window.sctpClient.set_link_content(nameGenCharLink, temp_char);
                        //window.sctpClient.create_arc(sc_type_arc_pos_const_perm, allInfoNode, nameGenCharLink);
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_var, nameGenCharName, nameGenCharLink).done(function(nameGenCharCommonArc){
                            //window.sctpClient.create_arc(sc_type_arc_pos_const_perm, allInfoNode, nameGenCharCommonArc);
                            window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, scKeynodes.nrel_system_identifier, nameGenCharCommonArc).done(function(nameGenCharHelpArc_1){
                                //window.sctpClient.create_arc(sc_type_arc_pos_const_perm, allInfoNode, nameGenCharHelpArc_1);
                                //window.sctpClient.create_arc(sc_type_arc_pos_const_perm, allInfoNode, scKeynodes.nrel_system_identifier);
                                console.log('generated ', nameGenCharName, temp_char);
                                window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, char_addr, nameGenCharName).done(function(genArc){
                                    self._addToPattern(allInfoNode, genArc);
                                    self._addToPattern(allInfoNode, char_addr);
                                });
                                resolve(nameGenCharName);
                            });
                        });
                    });
                });
            }).then((response) => {

                if($("#name_id").val() != ""){    
                    console.log($("#name_id").val());

                    // создаем замещаемую ссылку
                    window.sctpClient.create_node(sc_type_var).done(function (nameGenCharVar) {
                        self._addToPattern(allInfoNode, nameGenCharVar);

                        // добавляем созданный узел во множество замещаемых ссылок
                        window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, resolving_link, nameGenCharVar);

                        // связываем персонажа с замещаемой ссылкой онтошением nrel_main_idtf
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_var, response, nameGenCharVar).done(function(nameGenCharArc){
                            window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, scKeynodes.nrel_main_idtf, nameGenCharArc).done(function(nameGenCharIdtfArc){
                               self._addToPattern(allInfoNode, nameGenCharIdtfArc);
                            });

                            self._addToPattern(allInfoNode, scKeynodes.nrel_main_idtf);
                            self._addToPattern(allInfoNode, nameGenCharArc);
                        });

                        // добавляем русский язык к замещаемой ссылке
                        window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, scKeynodes.lang_ru, nameGenCharVar).done(function(nameGenCharVarLangArc) {
                            self._addToPattern(allInfoNode, nameGenCharVarLangArc);
                            self._addToPattern(allInfoNode, scKeynodes.lang_ru);
                        });

                        // создаем реальную ссылку и связываем её с замещаемой при помощи nrel_sc_text_translation
                        window.sctpClient.create_link().done(function(nameGenCharIdtf){
                            window.sctpClient.set_link_content(nameGenCharIdtf, $("#name_id").val());
                            window.sctpClient.create_arc(sc_type_arc_common | sc_type_var, nameGenCharIdtf, nameGenCharVar).done(function(translationArc){
                                 window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, translation, translationArc);
                            });
                            
                        });
                    });
                // -------------------------------------
                }
                
                if($( "#type_id option:selected" ).text() != ""){
                    console.log($( "#type_id option:selected" ).text());
                    var charType = "";
                    switch($( "#type_id option:selected" ).text()){
                        case 'Человек': charType = person_addr;
                            break;
                        case 'Пес': charType = dog_addr;
                            break;
                        case 'Кот' : charType = cat_addr;
                            break; 
                    }
                    window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, charType, response).done(function(nameGenCharType){
                        self._addToPattern(allInfoNode, nameGenCharType);
                        self._addToPattern(allInfoNode, charType);
                    });
                }
                if($( "#gender_id option:selected" ).text() != ""){
                    console.log($( "#gender_id option:selected" ).text());
                    var charGender = "";
                    switch($( "#gender_id option:selected" ).text()){
                        case 'Мужской': charGender = male_addr;
                            break;
                        case 'Женский': charGender = fem_addr;
                            break; 
                    }
                    window.sctpClient.create_arc(self.sc_type_arc_pos_var_perm, charGender, response).done(function(nameGenCharGender){
                        self._addToPattern(allInfoNode, nameGenCharGender);
                        self._addToPattern(allInfoNode, charGender);
                    });
                }
                
                // функция для возраста
                
            }/*подозреваю, что здесь отправка персонажа или агенту или поисковику*/);
        
        patternIsCreated = true;
        numerOfFields++;
        });
    }
};