var BestBooks = {};

function extend(child, parent) {
    var F = function () {
    };
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superclass = parent.prototype;
}

/**
 * BestBooks component.
 */
BestBooks.DrawComponent = {
    ext_lang: 'best_book',
    formats: ['best_book_format'],
    struct_support: true,
    factory: function (sandbox) {
        return new BestBooks.DrawWindow(sandbox);
    }
};

BestBooks.DrawWindow = function (sandbox) {
    this.sandbox = sandbox;
    this.paintPanel = new BestBooks.PaintPanel(this.sandbox.container);
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
SCWeb.core.ComponentManager.appendComponentInitialize(BestBooks.DrawComponent);
/**
 * Paint panel.
 */

BestBooks.PaintPanel = function (containerId) {
    this.containerId = containerId;
};

let genres = new Map();
let authors = new Map();

BestBooks.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

        var self = this;
        var agentKeyNode = 'ui_menu_file_for_finding_the_best_work_of_the_author';
        var keynodes = ['ui_menu_file_for_finding_the_best_work_of_the_author'];  

        container.load('static/components/html/find_best_book.html', function() {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
            	var buttonSearch = idf[keynodes['ui_menu_file_for_finding_the_best_work_of_the_author']];

            	$(buttonFind).html(buttonSearch);

                $(author).on("change paste keyup", function() {
                    let authorName = $(author).val();
                    if (authorName.length > 4){
                        self._search(authorName, $("#authorList"));
                    }
                });

                $(genre).on("change paste keyup", function() {
                    let genreName = $(genre).val();
                    if (genreName.length > 4){
                        self._search(genreName, $("#genreList"));
                    }
                });

                $(buttonFind).click(function() {
                    $(labelProcessing).html = "Processing...";
                    if ($(author).val() == ""){
                    	$(author).css("border-color", "rgb(255, 17, 17)");
                    	$(results).html("<p>" + "Поле Автор не может быть пустым!" + "</p><br>");
                    	return;
                    }
                    if ($(genre).val() == ""){
                    	$(genre).css("border-color", "rgb(255, 17, 17)");
                    	$(results).html("<a>" + "Поле Жанр не может быть пустым!" + "</a><br>");
                    	return;
                    }
                    var authorName = $(author).val();
                    var genreName = $(genre).val();
                    if (genres.has(genreName) && authors.has(authorName)){
                        var rez = self._findBestBook(genres.get(genreName), authors.get(authorName));
                        $(results).html("<h4>Лучшая книга:</h4>");
                        $(labelProcessing).empty();
                    }
                });
            });
        });
    });

    },
    _findBestBook: function(genreAddr, authorAddr) {
    		$(results).empty();
            return SCWeb.core.Server.resolveScAddr(['ui_menu_file_for_finding_the_best_work_of_the_author'], function (data) {
                var cmd = data['ui_menu_file_for_finding_the_best_work_of_the_author'];
                console.log("cmd", cmd);
                SCWeb.core.Server.doCommand(cmd, [authorAddr, genreAddr], function (result) {
                    if (result.question != undefined) {
                        console.log(result.question);
                        window.scHelper.getAnswer(result.question).done(function (addr) {                       
                                window.scHelper.getSetElements(addr).done(function(set) {
                                    SCWeb.core.Server.resolveIdentifiers(set, function(idtfs){
                                    	let item = Object.entries(idtfs)[0];
                                        $(results).append('<div class="scs-scn-keyword"><a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr=' + item[0] + '>' + item[1] + '</a></div>');
                                        console.log("item", item);
                                    });
                                });
                            }).fail(function (v) {
                                console.log("error");
                                $(results).append("<h5>Книг не найдено!</h>")
                         });
                    }
                });
            });
    },

    _search: function(query, item) {
        SCWeb.core.Server.findIdentifiersSubStr(query, function (data) {
                        $(item).empty();
                        data.main.forEach((element) =>{
                            var key = element[1];
                            var value = element[0];
                            if (item.attr('id') == "genreList"){
                            	genres.set(key, value);
                            }
                            if (item.attr('id') == "authorList"){
                            	authors.set(key, value);
                            } 
                            item.append("<option value= "+ "\'" + key + "\'>");                                     
                        });
                    });
    }
};