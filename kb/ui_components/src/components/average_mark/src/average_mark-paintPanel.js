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

        container.load('static/components/html/average_mark-main-page.html', function() {
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
                        rez += self._installAverageMark(keys.get(bookName));
                        $(results).html("<p>" + "Средняя оценка: </p>");
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
                SCWeb.core.Main.doCommand(cmd, [bookAddr], function (result) {
                    console.log("result", result);
                    if (result.question != undefined) {
                        
                    } else if (result.command != undefined) {
                        
                    } 
                });
            });
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