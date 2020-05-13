var AverageMark = {};

function extend(child, parent) {
    var F = function () {
    };
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superclass = parent.prototype;
}

/**
 * AverageMark component.
 */
AverageMark.DrawComponent = {
    ext_lang: 'average_mark',
    formats: ['average_mark_format'],
    struct_support: true,
    factory: function (sandbox) {
        return new AverageMark.DrawWindow(sandbox);
    }
};

AverageMark.DrawWindow = function (sandbox) {
    this.sandbox = sandbox;
    this.paintPanel = new AverageMark.PaintPanel(this.sandbox.container);
    this.paintPanel.init();
    this.recieveData = function (data) {
        console.log("in recieve data" + data);
    };

    var scElements = {};

    function drawAllElements() {
        var dfd = new jQuery.Deferred();
       // for (var addr in scElements) {
            jQuery.each(scElements, function(j, val){
                var obj = scElements[j];
                if (!obj || obj.translated) return;
// check if object is an arc
                if (obj.data.type & sc_type_arc_pos_const_perm) {
                    var begin = obj.data.begin;
                    var end = obj.data.end;
                    // logic for component update should go here
                }

        });
        SCWeb.ui.Locker.hide();
        dfd.resolve();
        return dfd.promise();
    }

// resolve keynodes
    var self = this;
    this.needUpdate = false;
    this.requestUpdate = function () {
        var updateVisual = function () {
// check if object is an arc
            var dfd1 = drawAllElements();
            dfd1.done(function (r) {
                return;
            });


/// @todo: Don't update if there are no new elements
            window.clearTimeout(self.structTimeout);
            delete self.structTimeout;
            if (self.needUpdate)
                self.requestUpdate();
            return dfd1.promise();
        };
        self.needUpdate = true;
        if (!self.structTimeout) {
            self.needUpdate = false;
            SCWeb.ui.Locker.show();
            self.structTimeout = window.setTimeout(updateVisual, 1000);
        }
    }
    
    this.eventStructUpdate = function (added, element, arc) {
        window.sctpClient.get_arc(arc).done(function (r) {
            var addr = r[1];
            window.sctpClient.get_element_type(addr).done(function (t) {
                var type = t;
                var obj = new Object();
                obj.data = new Object();
                obj.data.type = type;
                obj.data.addr = addr;
                if (type & sc_type_arc_mask) {
                    window.sctpClient.get_arc(addr).done(function (a) {
                        obj.data.begin = a[0];
                        obj.data.end = a[1];
                        scElements[addr] = obj;
                        self.requestUpdate();
                    });
                }
            });
        });
    };

    var keynodes = ['ui_menu_file_for_installation_avarage_rating_of_the_book'];  
    this.applyTranslation = function (namesMap) {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
                var buttonLoad = idf[keynodes['ui_menu_file_for_installation_avarage_rating_of_the_book']];

                $(buttonFind).html(buttonLoad);
            });
        });
    };

    this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this); 
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);
    this.sandbox.updateContent();
};
SCWeb.core.ComponentManager.appendComponentInitialize(AverageMark.DrawComponent);



/**
 * Paint panel.
 */

AverageMark.PaintPanel = function (containerId) {
    this.containerId = containerId;
};

let keys = new Map();

AverageMark.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

        var self = this;
        var agentKeyNode = 'ui_menu_file_for_installation_avarage_rating_of_the_book';
        var keynodes = ['ui_menu_file_for_installation_avarage_rating_of_the_book'];  

        container.load('static/components/html/average-mark-main-page.html', function() {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
            	var buttonSearch = idf[keynodes['ui_menu_file_for_installation_avarage_rating_of_the_book']];

            	$(buttonFind).html(buttonSearch);

                $(book).on("change paste keyup", function() {
                    let bookName = $(book).val();
                    if (bookName.length > 4){
                        self._search(bookName)
                    }
                });

                $(buttonFind).click(function() {
                    $(labelProcessing).html = "Processing...";
                    let bookName = $(book).val();
                    if (bookName == ""){
                    	$(book).css("border-color", "rgb(255, 17, 17)");
                    	$(results).html("<p>" + "Введите название книги!" + "</p>");
                    	return;
                    }
                    if (keys.has(bookName)){
                        var rez = "Вычисление..."
                        rez = self._installAverageMark(keys.get(bookName));
                        $(results).html("<p>" + "Средняя оценка: " + rez + "</p>");
                        $(labelProcessing).empty();
                    }
                });
            });
        });
    });

    },

    _installAverageMark: function(bookAddr){
            return SCWeb.core.Server.resolveScAddr(['ui_menu_file_for_installation_avarage_rating_of_the_book'], function (data) {
                var cmd = data['ui_menu_file_for_installation_avarage_rating_of_the_book'];
                console.log("cmd", cmd);
                var commandState = new SCWeb.core.CommandState(cmd, [bookAddr]);
                // SCWeb.core.Main.getTranslatedAnswer(commandState).done(function(answer){
                //     console.log(answer);
                //     SCWeb.core.Server.resolveIdentifiers([answer], function(idtfs){
                //         console.log("answer", idtfs);
                //     });
                // });
                
                // return SCWeb.core.Main.doCommand(cmd, [bookAddr], function (result) {
                //     if (result.question != undefined) {
                //         SCWeb.core.Server.getLinkContent(result.question, function(data) {
                //             console.log(data);
                //         }, function(){
                //             console.log("error getLinkContent");
                //         });
                //         return result.question;
                //         consonle.log(result.question);
                //     }
                // });
                SCWeb.core.Server.doCommand(cmd, [bookAddr], function (result) {
                    if (result.question != undefined) {
                        console.log("question", result.question);

                        SCWeb.core.Server.getAnswerTranslated(result.question, null, function(answer){
                            console.log("firstResult", answer);
                        }); 
                            var commandState = new SCWeb.core.CommandState(cmd, [bookAddr]);
                            var performAnswer = jQuery.proxy(function (answer_addr) {
                                console.log("answerAddr", answer_addr);
                                this.addr = answer_addr;
                                this.removeChild();
                            }, this);

                            var rez = SCWeb.core.Main.getTranslatedAnswer(commandState)
                                .then(performAnswer);
                      
                        console.log("result", rez);
                        window.scHelper.getAnswer(result.question).done(function (addr) {                       
                                window.scHelper.getSetElements(addr).done(function(set) {
                                    // SCWeb.core.Server.getLinkContent(set, function(data){
                                    //     console.log("data1", data);
                                    //     SCWeb.core.Server.resolveIdentifiers(Object.values(data), function(idtfs){
                                    //         console.log("identifiers", idtfs);
                                    //     });                             
                                    // }, function(){
                                    //     console.log("data1 error");
                                    // });
                                    SCWeb.core.Server.getLinksFormat(set, function(data){
                                        console.log("data2", data);
                                        SCWeb.core.Server.getAnswerTranslated(addr, Object.values(data)[0], function(result){
                                            console.log("result", result);
                                        });                          
                                    }, function(){
                                        console("data2 error")
                                    });
                                    SCWeb.core.Server.resolveIdentifiers(set, function(idtfs){
                                        console.log("idents", idtfs);
                                    });
                                    // var lang = SCWeb.core.Main.getDefaultExternalLang();
                                    // set.forEach((element=>{
                                    //     SCWeb.core.ComponentSandbox.getKeynode(element);
                                    //     var elementIdtf = window.scHelper.getIdentifier(element, lang).done(function(item){
                                    //         console.log(item);
                                    //     });
                                    // }));
                                });
                            }).fail(function (v) {
                                console.log("error");
                         });
                    } else if (result.command != undefined) {
                        console.log(result.command);
                        console.log(result);
                    } 
                });
            });
    },

    _searchAnswer: function(command_state){
        var performAnswer = jQuery.proxy(function (answer_addr) {
        this.addr = answer_addr;
        this.removeChild();
    }, this);
    return SCWeb.core.Main.getTranslatedAnswer(this.command_state)
        .then(performAnswer);
    },

    _search: function(query) {
        SCWeb.core.Server.findIdentifiersSubStr(query, function (data) {
                        $(propagation).empty();
                        data.main.forEach((element) =>{
                            var key = element[1];
                            var value = element[0];
                            keys.set(key, value);                                             
                            $(propagation).append("<option value= "+ "\'" + key + "\'>");
                        });
                    });
    }
};